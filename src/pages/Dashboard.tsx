import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  ClipboardList,
  Building2,
  FileBarChart,
  ClipboardCheck,
  Loader2,
  AlertTriangle,
  Layers,
  BadgeCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";
import { GET_departments } from "@/api/department/department";
import { GET_appraisalsOfTeamMembers } from "@/api/appraisal/appraisal";
import {
  OrganizationGradeStackedBar,
  normalizePerformanceGradeLetter,
  pickRankBasedDisplayAssessment,
} from "@/lib/organizationGradeDistribution";
import type {
  Appraisal,
  DepartmentAppraisal,
  User,
} from "@/pages/GoalManagement/type";

const MS_PER_DAY = 86_400_000;
const DEADLINE_SOON_DAYS = 3;

function dedupeParticipations(
  data: DepartmentAppraisal[] | undefined,
): Map<string, { appraisal: Appraisal; user: User }> {
  const map = new Map<string, { appraisal: Appraisal; user: User }>();
  if (!data) return map;
  for (const block of data) {
    for (const appr of block.appraisal) {
      for (const u of appr.user) {
        const key = `${appr.appraisalId}:${String(u.appraisalUserId ?? u.userId)}`;
        if (!map.has(key)) map.set(key, { appraisal: appr, user: u });
      }
    }
  }
  return map;
}

function userHasFinalPerformanceGrade(user: User): boolean {
  const disp = pickRankBasedDisplayAssessment(user.assessments, user.userId);
  return normalizePerformanceGradeLetter(disp?.grade) != null;
}

function userSubmittedOrFinished(user: User): boolean {
  const s = String(user.status ?? "").toLowerCase();
  return s === "submitted" || s === "finished";
}

function userGoalsAllHaveAssessment(user: User): boolean {
  if (!user.goals.length) return true;
  return user.goals.every((g) => (g.goalAssessmentBy?.length ?? 0) > 0);
}

function pct(num: number, den: number): number {
  if (den <= 0) return 0;
  return Math.round((num / den) * 100);
}

function buildAppraisalRollups(data: DepartmentAppraisal[] | undefined) {
  const partMap = dedupeParticipations(data);
  const byAppraisal = new Map<
    string,
    { appraisal: Appraisal; users: User[] }
  >();

  for (const { appraisal, user } of partMap.values()) {
    const id = appraisal.appraisalId;
    if (!byAppraisal.has(id)) {
      byAppraisal.set(id, { appraisal, users: [] });
    }
    byAppraisal.get(id)!.users.push(user);
  }

  const rows: Array<{
    appraisalId: string;
    title: string;
    chartLabel: string;
    endDate: string;
    participants: number;
    submittedPct: number;
    gradePct: number;
    goalsPct: number;
  }> = [];

  for (const { appraisal, users } of byAppraisal.values()) {
    const n = users.length;
    if (n === 0) continue;
    const submitted = users.filter(userSubmittedOrFinished).length;
    const grade = users.filter(userHasFinalPerformanceGrade).length;
    const goals = users.filter(userGoalsAllHaveAssessment).length;
    const title = appraisal.title?.trim() || "제목 없음";
    rows.push({
      appraisalId: appraisal.appraisalId,
      title,
      chartLabel: title.length > 14 ? `${title.slice(0, 14)}…` : title,
      endDate: appraisal.endDate,
      participants: n,
      submittedPct: pct(submitted, n),
      gradePct: pct(grade, n),
      goalsPct: pct(goals, n),
    });
  }

  rows.sort((a, b) => a.title.localeCompare(b.title, "ko"));
  return rows;
}

function buildDeadlineSoonSummary(
  rollups: ReturnType<typeof buildAppraisalRollups>,
) {
  const now = Date.now();
  const limit = now + DEADLINE_SOON_DAYS * MS_PER_DAY;
  let appraisalCount = 0;
  let participantSum = 0;

  for (const r of rollups) {
    const end = Date.parse(r.endDate);
    if (!Number.isFinite(end)) continue;
    if (end < now || end > limit) continue;
    appraisalCount += 1;
    participantSum += r.participants;
  }

  return { appraisalCount, participantSum };
}

function collectUsersForDepartment(
  blocks: DepartmentAppraisal[] | undefined,
  departmentId: string,
): User[] {
  const deptBlock = blocks?.find((b) => b.departmentId === departmentId);
  if (!deptBlock) return [];
  const map = new Map<string, User>();
  for (const appr of deptBlock.appraisal) {
    for (const u of appr.user) {
      const existing = map.get(u.userId);
      if (!existing) {
        map.set(u.userId, u);
        continue;
      }
      map.set(u.userId, {
        ...existing,
        assessments: [
          ...(existing.assessments ?? []),
          ...(u.assessments ?? []),
        ],
      });
    }
  }
  return [...map.values()];
}

export default function Dashboard() {
  const { data: allDepartments, isLoading: isLoadingDepts } = useQuery({
    queryKey: ["dashboardDepartmentsFlat"],
    queryFn: () => GET_departments("flat"),
    select: (data) => data.data as DepartmentTreeData[],
  });

  const departmentIds = useMemo(
    () => allDepartments?.map((d) => d.id).filter(Boolean) ?? [],
    [allDepartments],
  );

  const { data: teamDepartmentAppraisals, isLoading: isLoadingTeam } = useQuery(
    {
      queryKey: ["dashboardTeamAppraisals", departmentIds.join(",")],
      queryFn: () => GET_appraisalsOfTeamMembers(departmentIds),
      enabled: departmentIds.length > 0,
      select: (data) => data.data as DepartmentAppraisal[],
    },
  );

  const participations = useMemo(
    () => dedupeParticipations(teamDepartmentAppraisals),
    [teamDepartmentAppraisals],
  );

  const appraisalRollups = useMemo(
    () => buildAppraisalRollups(teamDepartmentAppraisals),
    [teamDepartmentAppraisals],
  );

  const deadlineSoon = useMemo(
    () => buildDeadlineSoonSummary(appraisalRollups),
    [appraisalRollups],
  );

  const gradeConfirmedStats = useMemo(() => {
    const total = participations.size;
    if (total === 0) return { pct: 0, confirmed: 0, total: 0 };
    let confirmed = 0;
    for (const { user } of participations.values()) {
      if (userHasFinalPerformanceGrade(user)) confirmed += 1;
    }
    return {
      total,
      confirmed,
      pct: pct(confirmed, total),
    };
  }, [participations]);

  const [activeDeptId, setActiveDeptId] = useState<string>("");

  useEffect(() => {
    if (!allDepartments?.length) return;
    setActiveDeptId((prev) =>
      prev && allDepartments.some((d) => d.id === prev)
        ? prev
        : allDepartments[0].id,
    );
  }, [allDepartments]);

  const isLoadingOrg =
    isLoadingDepts || (departmentIds.length > 0 && isLoadingTeam);

  const participationCountDisplay =
    departmentIds.length === 0
      ? "0"
      : isLoadingTeam
        ? "…"
        : String(participations.size);

  const departmentCountDisplay = isLoadingDepts
    ? "…"
    : `${allDepartments?.length ?? 0}`;

  const appraisalCountDisplay =
    departmentIds.length === 0
      ? "0"
      : isLoadingTeam
        ? "…"
        : String(appraisalRollups.length);

  const gradePctDisplay =
    departmentIds.length === 0
      ? "0%"
      : isLoadingTeam
        ? "…"
        : `${gradeConfirmedStats.pct}%`;

  const metrics = [
    {
      title: "평가 참여 건수",
      value: participationCountDisplay,
      hint: "평가·대상자 조합 기준(동일 인원이 여러 평가에 들어가면 각각 1건)",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      title: "진행 중 평가 수",
      value: appraisalCountDisplay,
      hint: "팀원 평가 API에 노출된 서로 다른 평가 기수",
      icon: Layers,
      color: "text-indigo-600",
      bg: "bg-indigo-100",
    },
    {
      title: "조직 부서 수",
      value: departmentCountDisplay,
      hint: "조직도에 등록된 부서",
      icon: Building2,
      color: "text-violet-600",
      bg: "bg-violet-100",
    },
    {
      title: "성과 등급 확정 비율",
      value: gradePctDisplay,
      hint:
        departmentIds.length === 0 || isLoadingTeam
          ? "조직 기준 최종 성과 등급이 반영된 참여 건 비율"
          : `미확정 ${gradeConfirmedStats.total - gradeConfirmedStats.confirmed}건 / 전체 ${gradeConfirmedStats.total}건`,
      icon: BadgeCheck,
      color: "text-teal-600",
      bg: "bg-teal-100",
    },
  ];

  const chartRows = useMemo(
    () =>
      appraisalRollups.map((r) => ({
        name: r.chartLabel,
        fullTitle: r.title,
        제출완료: r.submittedPct,
        등급확정: r.gradePct,
        목표평가입력: r.goalsPct,
      })),
    [appraisalRollups],
  );

  return (
    <div className='p-4 lg:p-6 space-y-6'>
      <div>
        <h1 className='text-xl font-semibold tracking-tight'>HR 인사 대시보드</h1>
        <p className='text-sm text-muted-foreground mt-1'>
          팀원 평가·조직 데이터만 사용합니다. (데모 수치 없음)
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.title}>
              <CardContent className='p-6'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='text-sm text-gray-600'>{metric.title}</p>
                    <p className='mt-2 text-2xl font-semibold tabular-nums'>
                      {metric.value}
                    </p>
                    <p className='text-sm text-muted-foreground mt-1'>
                      {metric.hint}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "shrink-0 w-12 h-12 rounded-full flex items-center justify-center",
                      metric.bg,
                    )}
                    aria-hidden>
                    <Icon className={cn("w-6 h-6", metric.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {deadlineSoon.appraisalCount > 0 && (
        <div
          className='flex flex-wrap items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2.5 text-sm text-amber-950'
          role='status'
          aria-live='polite'>
          <AlertTriangle
            className='w-4 h-4 shrink-0 text-amber-700'
            aria-hidden
          />
          <span className='font-medium'>
            마감 {DEADLINE_SOON_DAYS}일 이내 평가 {deadlineSoon.appraisalCount}건
          </span>
          <span className='text-amber-900/90'>
            (참여 인원 합계 약 {deadlineSoon.participantSum}명 · 평가 종료일
            기준)
          </span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>부서별 성과 등급 분포</CardTitle>
          <CardDescription>
            조직에 등록된 부서 탭을 선택합니다. 등급은 목표 관리와 동일하게 성과
            최종(O/E/M/P/N·A/B/C) 중 조직 기준(비-HR 최상위 평가자)으로 집계되며,
            해당 없으면 &quot;미정&quot;으로 표시됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDepts ? (
            <div
              className='flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground'
              role='status'
              aria-live='polite'
              aria-busy='true'>
              <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
              <p className='text-sm'>부서 목록을 불러오는 중입니다.</p>
            </div>
          ) : !allDepartments?.length ? (
            <p className='text-sm text-muted-foreground py-8 text-center'>
              등록된 부서가 없습니다. 조직 관리에서 부서를 먼저 등록해 주세요.
            </p>
          ) : (
            <Tabs
              value={activeDeptId}
              onValueChange={setActiveDeptId}
              className='w-full'>
              <div className='overflow-x-auto pb-2 -mx-1 px-1'>
                <TabsList
                  className='inline-flex h-auto min-h-10 w-max max-w-full flex-wrap justify-start gap-1 bg-muted/50 p-1'
                  aria-label='부서 선택'>
                  {allDepartments.map((dept) => (
                    <TabsTrigger
                      key={dept.id}
                      value={dept.id}
                      className='shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white'>
                      {dept.text}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              {allDepartments.map((dept) => (
                <TabsContent
                  key={dept.id}
                  value={dept.id}
                  className='mt-4 focus-visible:outline-none'>
                  {isLoadingOrg ? (
                    <div
                      className='flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground'
                      role='status'
                      aria-live='polite'
                      aria-busy='true'>
                      <Loader2 className='h-7 w-7 animate-spin text-blue-600' />
                      <p className='text-sm'>평가 데이터를 불러오는 중입니다.</p>
                    </div>
                  ) : (
                    <DepartmentGradePanel
                      departmentName={dept.text}
                      users={collectUsersForDepartment(
                        teamDepartmentAppraisals,
                        dept.id,
                      )}
                    />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>평가별 진행률</CardTitle>
          <CardDescription>
            팀원 평가 API 기준입니다. 제출·완료는 참여 상태가 제출/완료인 비율,
            등급 확정은 조직 기준 성과 최종 등급이 있는 비율, 목표 평가 입력은
            모든 목표에 평가 기록이 1건 이상인 비율입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isLoadingTeam && chartRows.length === 0 ? (
            <p className='text-sm text-muted-foreground py-10 text-center'>
              표시할 평가 데이터가 없습니다. 성과 평가를 시작하거나 대상자를
              배정해 주세요.
            </p>
          ) : isLoadingTeam && departmentIds.length > 0 ? (
            <div
              className='flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground'
              role='status'
              aria-live='polite'
              aria-busy='true'>
              <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
              <p className='text-sm'>평가별 지표를 계산하는 중입니다.</p>
            </div>
          ) : (
            <ResponsiveContainer width='100%' height={Math.max(280, chartRows.length * 56)}>
              <BarChart
                data={chartRows}
                layout='vertical'
                margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
                <CartesianGrid strokeDasharray='3 3' horizontal={false} />
                <XAxis
                  type='number'
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type='category'
                  dataKey='name'
                  width={100}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => String(v)}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [`${value}%`, name]}
                  labelFormatter={(_, payload) => {
                    const row = payload?.[0]?.payload as
                      | { fullTitle?: string; name?: string }
                      | undefined;
                    return row?.fullTitle ?? row?.name ?? "";
                  }}
                />
                <Legend />
                <Bar dataKey='제출완료' fill='#2563eb' radius={[0, 4, 4, 0]} />
                <Bar dataKey='등급확정' fill='#059669' radius={[0, 4, 4, 0]} />
                <Bar dataKey='목표평가입력' fill='#d97706' radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>바로 가기</CardTitle>
          <CardDescription>자주 쓰는 인사·평가 화면으로 이동합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3'>
            <Button
              asChild
              className='h-auto py-4 flex-col gap-2 bg-blue-600 hover:bg-blue-700 text-white'>
              <Link to='/todo' aria-label='내 업무함 화면으로 이동'>
                <ClipboardList className='w-5 h-5' aria-hidden />
                <span>내 업무함</span>
              </Link>
            </Button>
            <Button
              asChild
              className='h-auto py-4 flex-col gap-2 bg-slate-700 hover:bg-slate-800 text-white'>
              <Link
                to='/organization-management'
                aria-label='조직 관리 화면으로 이동'>
                <Building2 className='w-5 h-5' aria-hidden />
                <span>조직 관리</span>
              </Link>
            </Button>
            <Button
              asChild
              className='h-auto py-4 flex-col gap-2 bg-emerald-600 hover:bg-emerald-700 text-white'>
              <Link
                to='/performance-appraisal'
                aria-label='성과 평가 관리 화면으로 이동'>
                <ClipboardCheck className='w-5 h-5' aria-hidden />
                <span>성과 평가 운영</span>
              </Link>
            </Button>
            <Button
              asChild
              className='h-auto py-4 flex-col gap-2 bg-indigo-600 hover:bg-indigo-700 text-white'>
              <Link to='/evaluation-report' aria-label='평가 리포트 화면으로 이동'>
                <FileBarChart className='w-5 h-5' aria-hidden />
                <span>평가 리포트</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DepartmentGradePanel({
  departmentName,
  users,
}: {
  departmentName: string;
  users: User[];
}) {
  if (users.length === 0) {
    return (
      <div className='rounded-lg border border-dashed border-gray-200 bg-gray-50/60 px-4 py-10 text-center text-sm text-muted-foreground'>
        <p className='font-medium text-gray-700'>{departmentName}</p>
        <p className='mt-2'>
          이 부서에 연결된 진행 중 평가 대상자가 없거나, 아직 데이터가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <p className='text-sm text-gray-600'>
        <span className='font-semibold text-gray-900'>{departmentName}</span>
        <span className='mx-1.5 text-gray-400' aria-hidden>
          ·
        </span>
        평가 대상 {users.length}명
      </p>
      <OrganizationGradeStackedBar users={users} />
    </div>
  );
}
