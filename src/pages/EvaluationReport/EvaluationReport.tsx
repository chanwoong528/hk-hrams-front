import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  GET_evaluationReport,
  isTeamMemberReportUnlocked,
  type CompetencyReportItem,
  type GoalReportItem,
  type FinalAssessmentItem,
} from "@/api/evaluation-report/evaluation-report";
import {
  GET_appraisalsByDistinctType,
  GET_appraisalsOfTeamMembers,
} from "@/api/appraisal/appraisal";
import { GET_departments } from "@/api/department/department";
import { useCurrentUserStore } from "@/store/currentUserStore";
import { isHrOrAdminUser } from "@/lib/hrAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ClipboardList,
  Target,
  ArrowLeft,
  FileText,
  User,
  Users,
  ChevronRight,
} from "lucide-react";

const GRADE_COLORS: Record<string, string> = {
  S: "bg-purple-100 text-purple-700 border-purple-200",
  A: "bg-blue-100 text-blue-700 border-blue-200",
  B: "bg-green-100 text-green-700 border-green-200",
  C: "bg-amber-100 text-amber-700 border-amber-200",
  D: "bg-red-100 text-red-700 border-red-200",
};

/**
 * 피평가자 목록·리포트 헤더용 상태 문구.
 * `finished`는 DB상 리더 평가까지 반영된 상태이나, 팀원 본문(리포트)은
 * `isTeamMemberReportUnlocked` 등으로 따로 막혀 있을 수 있어
 * 전사적 "평가 종료"와 구분한다. "진행중"은 오해 소지가 커서 단계를 직접 쓴다.
 */
function formatAppraisalParticipationStatus(
  status: string | null | undefined,
): string {
  const s = String(status ?? "")
    .trim()
    .toLowerCase();
  switch (s) {
    case "ongoing":
      return "진행 중";
    case "submitted":
    case "self-submitted":
      return "제출 완료";
    case "completed":
      return "완료";
    case "finished":
      return "리더 평가 완료";
    case "draft":
      return "작성 중";
    case "":
      return "상태 없음";
    default:
      return String(status ?? "").trim() || "상태 없음";
  }
}

/** `finished`: 리더 평가 반영됨 — 리포트 본문은 별도 게이트(상세 페이지 참고) */
function isAppraisalReportViewPending(
  status: string | null | undefined,
): boolean {
  return String(status ?? "").trim().toLowerCase() === "finished";
}

function GradeBadge({ grade, label }: { grade?: string; label: string }) {
  if (!grade) {
    return (
      <div className='flex flex-col items-center gap-1'>
        <span className='text-[10px] font-bold text-gray-400 uppercase'>
          {label}
        </span>
        <div className='w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 font-bold text-lg'>
          -
        </div>
      </div>
    );
  }

  const colorClass =
    GRADE_COLORS[grade] || "bg-gray-100 text-gray-700 border-gray-200";

  return (
    <div className='flex flex-col items-center gap-1'>
      <span className='text-[10px] font-bold text-gray-400 uppercase'>
        {label}
      </span>
      <div
        className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center font-black text-lg ${colorClass}`}>
        {grade}
      </div>
    </div>
  );
}

function FinalGradeInlineList({
  items,
  ownerUserId,
}: {
  items: Array<FinalAssessmentItem>;
  ownerUserId: string | undefined;
}) {
  if (items.length === 0) return null;

  const sortedItems = [...items].sort((a, b) => {
    const aIsSelf = ownerUserId != null && a.assessedById === ownerUserId;
    const bIsSelf = ownerUserId != null && b.assessedById === ownerUserId;

    if (aIsSelf !== bIsSelf) return aIsSelf ? -1 : 1;

    const aCreated = new Date(a.created).getTime();
    const bCreated = new Date(b.created).getTime();
    if (aCreated !== bCreated) return aCreated - bCreated; // 오름차순

    return String(a.assessedBy ?? "").localeCompare(String(b.assessedBy ?? ""));
  });

  return (
    <div className='flex flex-wrap items-center justify-end gap-2'>
      {sortedItems.map((item) => (
        <div
          key={item.appraisalById}
          className='flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700'
        >
          <span className='font-semibold text-gray-600'>
            최종 ({item.assessedBy})
          </span>
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full border font-black ${
              GRADE_COLORS[item.grade] ||
              "bg-gray-100 text-gray-700 border-gray-200"
            }`}
          >
            {item.grade}
          </span>
        </div>
      ))}
    </div>
  );
}

function CompetencySection({
  items,
  finalItems,
  ownerUserId,
}: {
  items: CompetencyReportItem[];
  finalItems: FinalAssessmentItem[];
  ownerUserId: string | undefined;
}) {
  const byDept: Record<string, CompetencyReportItem[]> = {};
  items.forEach((item) => {
    const dept = item.department || "기타";
    if (!byDept[dept]) byDept[dept] = [];
    byDept[dept].push(item);
  });

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600'>
            <ClipboardList className='w-5 h-5' />
          </div>
          <h2 className='text-xl font-bold text-gray-900'>역량 평가</h2>
          <Badge variant='outline' className='text-xs'>
            {items.length}개 문항
          </Badge>
        </div>
        <FinalGradeInlineList items={finalItems} ownerUserId={ownerUserId} />
      </div>

      {Object.entries(byDept).map(([dept, deptItems]) => (
        <Card
          key={dept}
          className='border-none shadow-sm ring-1 ring-gray-200 overflow-hidden'>
          <CardHeader className='pb-3 bg-gray-50/50 border-b'>
            <CardTitle className='text-sm font-bold text-gray-600'>
              {dept}
            </CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            <div className='divide-y divide-gray-100'>
              {deptItems.map((item) => (
                <div key={item.competencyId} className='p-5'>
                  <p className='font-semibold text-gray-800 mb-4'>
                    {item.question}
                  </p>
                  {item.evaluations && item.evaluations.length > 0 ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {item.evaluations.map((ev) => {
                        const isSelf = ev.isSelf;
                        const title = isSelf
                          ? "자가 평가"
                          : `평가 (${ev.evaluatorName || "평가자"})`;
                        const bg = isSelf
                          ? "bg-blue-50/30 border-blue-100/50"
                          : "bg-green-50/30 border-green-100/50";
                        const icon = isSelf ? (
                          <User className='w-4 h-4 text-blue-600' />
                        ) : (
                          <Users className='w-4 h-4 text-green-600' />
                        );
                        const titleColor = isSelf
                          ? "text-blue-700"
                          : "text-green-700";
                        return (
                          <div
                            key={ev.evaluatorId}
                            className={`${bg} rounded-xl p-4 border`}
                          >
                            <div className='flex items-center gap-2 mb-3'>
                              {icon}
                              <span className={`text-xs font-bold ${titleColor}`}>
                                {title}
                              </span>
                              <GradeBadge grade={ev.grade ?? undefined} label='' />
                            </div>
                            <p className='text-sm text-gray-600 leading-relaxed'>
                              {ev.comment || "의견 없음"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='bg-blue-50/30 rounded-xl p-4 border border-blue-100/50'>
                        <div className='flex items-center gap-2 mb-3'>
                          <User className='w-4 h-4 text-blue-600' />
                          <span className='text-xs font-bold text-blue-700'>
                            자가 평가
                          </span>
                          <GradeBadge grade={item.selfGrade} label='' />
                        </div>
                        <p className='text-sm text-gray-600 leading-relaxed'>
                          {item.selfComment || "의견 없음"}
                        </p>
                      </div>
                      <div className='bg-green-50/30 rounded-xl p-4 border border-green-100/50'>
                        <div className='flex items-center gap-2 mb-3'>
                          <Users className='w-4 h-4 text-green-600' />
                          <span className='text-xs font-bold text-green-700'>
                            리더 평가
                            {item.leaderName && ` (${item.leaderName})`}
                          </span>
                          <GradeBadge grade={item.leaderGrade} label='' />
                        </div>
                        <p className='text-sm text-gray-600 leading-relaxed'>
                          {item.leaderComment || "의견 없음"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GoalSection({
  items,
  finalItems,
  ownerUserId,
}: {
  items: GoalReportItem[];
  finalItems: FinalAssessmentItem[];
  ownerUserId: string | undefined;
}) {
  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600'>
            <Target className='w-5 h-5' />
          </div>
          <h2 className='text-xl font-bold text-gray-900'>목표/성과 평가</h2>
          <Badge variant='outline' className='text-xs'>
            {items.length}개 목표
          </Badge>
        </div>
        <FinalGradeInlineList items={finalItems} ownerUserId={ownerUserId} />
      </div>

      <Card className='border-none shadow-sm ring-1 ring-gray-200 overflow-hidden'>
        <CardContent className='p-0'>
          <div className='divide-y divide-gray-100'>
            {items.length === 0 ? (
              <div className='p-8 text-center text-gray-400'>
                등록된 목표가 없습니다.
              </div>
            ) : (
              items.map((item) => (
                <div key={item.goalId} className='p-5'>
                  <div className='flex items-start gap-3 mb-4'>
                    <Badge
                      variant='outline'
                      className={`shrink-0 text-[10px] ${item.goalType === "common" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                      {item.goalType === "common" ? "공통 목표" : "개인 목표"}
                    </Badge>
                    <div>
                      <h4 className='font-bold text-gray-800'>{item.title}</h4>
                      <p className='text-sm text-gray-500 mt-1'>
                        {item.description}
                      </p>
                    </div>
                  </div>
                  {item.evaluations && item.evaluations.length > 0 ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {item.evaluations.map((ev) => {
                        const isSelf = ev.isSelf;
                        const title = isSelf
                          ? "자가 평가"
                          : `평가 (${ev.evaluatorName || "평가자"})`;
                        const bg = isSelf
                          ? "bg-blue-50/30 border-blue-100/50"
                          : "bg-green-50/30 border-green-100/50";
                        const icon = isSelf ? (
                          <User className='w-4 h-4 text-blue-600' />
                        ) : (
                          <Users className='w-4 h-4 text-green-600' />
                        );
                        const titleColor = isSelf
                          ? "text-blue-700"
                          : "text-green-700";
                        return (
                          <div
                            key={ev.evaluatorId}
                            className={`${bg} rounded-xl p-4 border`}
                          >
                            <div className='flex items-center gap-2 mb-2'>
                              {icon}
                              <span className={`text-xs font-bold ${titleColor}`}>
                                {title}
                              </span>
                              <GradeBadge grade={ev.grade ?? undefined} label='' />
                            </div>
                            <p className='text-sm text-gray-600'>
                              {ev.comment || "의견 없음"}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div className='bg-blue-50/30 rounded-xl p-4 border border-blue-100/50'>
                        <div className='flex items-center gap-2 mb-2'>
                          <User className='w-4 h-4 text-blue-600' />
                          <span className='text-xs font-bold text-blue-700'>
                            자가 평가
                          </span>
                          <GradeBadge grade={item.selfGrade} label='' />
                        </div>
                        <p className='text-sm text-gray-600'>
                          {item.selfComment || "의견 없음"}
                        </p>
                      </div>
                      <div className='bg-green-50/30 rounded-xl p-4 border border-green-100/50'>
                        <div className='flex items-center gap-2 mb-2'>
                          <Users className='w-4 h-4 text-green-600' />
                          <span className='text-xs font-bold text-green-700'>
                            리더 평가
                            {item.leaderName && ` (${item.leaderName})`}
                          </span>
                          <GradeBadge grade={item.leaderGrade} label='' />
                        </div>
                        <p className='text-sm text-gray-600'>
                          {item.leaderComment || "의견 없음"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// NOTE: 종합 평가는 각 섹션(역량/성과) 헤더 옆에 인라인으로 노출한다.

// Selection page: lists all my appraisals to pick from
function AppraisalSelectionView() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUserStore();

  const isHR = useMemo(
    () => isHrOrAdminUser(currentUser?.email, currentUser?.departments),
    [currentUser],
  );

  const [hrSelectedDeptId, setHrSelectedDeptId] = useState<string>("");

  const { data: myAppraisals, isLoading } = useQuery({
    queryKey: ["myAppraisals"],
    queryFn: () => GET_appraisalsByDistinctType("my-appraisal"),
    select: (data) => data.data as any[],
  });

  const { data: allDepartments } = useQuery({
    queryKey: ["allDepartments"],
    queryFn: () => GET_departments("flat"),
    enabled: isHR,
    select: (data) => data.data as any[],
  });

  const { data: hrTeamData, isLoading: isLoadingHrTeam } = useQuery({
    queryKey: ["hrTeamMembers", hrSelectedDeptId],
    queryFn: () => GET_appraisalsOfTeamMembers([hrSelectedDeptId]),
    enabled: isHR && !!hrSelectedDeptId,
    select: (data) => data.data as any[],
  });

  const hrParticipations = useMemo(() => {
    if (!hrTeamData) return [];
    const list: any[] = [];
    hrTeamData.forEach((dept) => {
      dept.appraisal.forEach((appr: any) => {
        appr.user.forEach((user: any) => {
          list.push({
            ...user,
            appraisalTitle: appr.title,
            appraisalId: appr.appraisalId,
            deptName: dept.departmentName,
          });
        });
      });
    });
    return list;
  }, [hrTeamData]);

  useEffect(() => {
    if (isLoading) return;
    console.log("[EvaluationReport] 목록(/evaluation-report) 로드됨", {
      rowCount: myAppraisals?.length ?? 0,
      isHR,
      rows: (myAppraisals ?? []).map((a: any) => ({
        appraisalUserId: a.appraisalUserId,
        title: a.title,
        rawStatus: a.status,
        label: formatAppraisalParticipationStatus(a.status),
      })),
    });
  }, [isLoading, myAppraisals, isHR]);

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-4'>
        <Loader2 className='w-10 h-10 animate-spin text-blue-600' />
        <p className='font-medium'>평가 목록을 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className='p-4 lg:p-8 max-w-4xl mx-auto space-y-8'>
      <div>
        <h1 className='text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3'>
          <FileText className='w-6 h-6 text-blue-600' />
          나의 평가 리포트
        </h1>
        <p className='text-sm text-gray-500 mt-2'>
          조회할 본인의 평가를 선택하세요.
        </p>
      </div>

      {!myAppraisals || myAppraisals.length === 0 ? (
        <Card className='border-none shadow-sm ring-1 ring-gray-200'>
          <CardContent className='p-12 text-center text-gray-400'>
            <FileText className='w-12 h-12 mx-auto mb-4 opacity-30' />
            <p className='font-medium'>참여 중인 평가가 없습니다.</p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-3'>
          {myAppraisals.map((appraisal: any) => {
            const statusLooksInProgress = isAppraisalReportViewPending(
              appraisal.status,
            );
            return (
              <button
                key={appraisal.appraisalUserId}
                type='button'
                onClick={() => {
                  console.log("[EvaluationReport] 행 클릭 → 상세 이동", {
                    appraisalUserId: appraisal.appraisalUserId,
                    status: appraisal.status,
                  });
                  navigate(`/evaluation-report/${appraisal.appraisalUserId}`);
                }}
                className='w-full flex items-center justify-between p-5 rounded-xl bg-white ring-1 ring-gray-200 text-left transition-all group hover:ring-blue-300 hover:bg-blue-50/30'>
                <div className='flex items-center gap-4'>
                  <div className='w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 transition-colors group-hover:bg-blue-200'>
                    <FileText className='w-5 h-5' />
                  </div>
                  <div>
                    <h3 className='font-bold text-gray-800'>{appraisal.title}</h3>
                    <p
                      className={`text-xs mt-0.5 ${
                        statusLooksInProgress
                          ? "text-amber-700/90"
                          : "text-gray-500"
                      }`}>
                      {formatAppraisalParticipationStatus(appraisal.status)}
                    </p>
                  </div>
                </div>
                <ChevronRight className='w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0' />
              </button>
            );
          })}
        </div>
      )}

      {isHR && (
        <div className='mt-12'>
          <div className='border-t pt-8 mb-6'>
            <h2 className='text-xl font-bold text-gray-900 flex items-center gap-2 mb-2'>
              <Users className='w-5 h-5 text-purple-600' />
              [HR 전용] 사원 평가 리포트 목록
            </h2>
            <p className='text-sm text-gray-500 mb-6'>
              부서를 선택하여 해당 부서원들의 종합 리포트를 열람하세요.
            </p>

            <div className='w-full sm:w-72 mb-6'>
              <Select
                value={hrSelectedDeptId}
                onValueChange={setHrSelectedDeptId}>
                <SelectTrigger className='h-10 bg-white'>
                  <SelectValue placeholder='조회할 부서 선택' />
                </SelectTrigger>
                <SelectContent>
                  {allDepartments?.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!hrSelectedDeptId ? (
            <Card className='border-none shadow-sm ring-1 ring-gray-200'>
              <CardContent className='p-8 text-center text-gray-400'>
                <p>부서를 선택해주세요.</p>
              </CardContent>
            </Card>
          ) : isLoadingHrTeam ? (
            <div className='flex justify-center p-8'>
              <Loader2 className='w-8 h-8 animate-spin text-purple-600' />
            </div>
          ) : hrParticipations.length === 0 ? (
            <Card className='border-none shadow-sm ring-1 ring-gray-200'>
              <CardContent className='p-8 text-center text-gray-400'>
                <p>해당 부서에 평가 대상자가 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            <div className='grid gap-3'>
              {hrParticipations.map((appraisal: any) => (
                <button
                  key={appraisal.appraisalUserId}
                  onClick={() =>
                    navigate(`/evaluation-report/${appraisal.appraisalUserId}`)
                  }
                  className='w-full flex items-center justify-between p-5 rounded-xl bg-white ring-1 ring-gray-200 hover:ring-purple-300 hover:bg-purple-50/30 transition-all text-left group'>
                  <div className='flex items-center gap-4'>
                    <div className='w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-200 transition-colors'>
                      <User className='w-5 h-5' />
                    </div>
                    <div>
                      <h3 className='font-bold text-gray-800 flex items-center gap-2'>
                        {appraisal.koreanName}
                        <Badge variant='outline' className='text-[10px] ml-2'>
                          {appraisal.deptName}
                        </Badge>
                      </h3>
                      <p className='text-xs text-gray-500 mt-1'>
                        {appraisal.appraisalTitle}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className='w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors' />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EvaluationReport() {
  const { appraisalUserId } = useParams<{ appraisalUserId: string }>();

  if (!appraisalUserId) {
    return <AppraisalSelectionView />;
  }

  return <ReportDetailView appraisalUserId={appraisalUserId} />;
}

function ReportDetailView({ appraisalUserId }: { appraisalUserId: string }) {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUserStore();

  const canViewIncompleteReport = useMemo(
    () => isHrOrAdminUser(currentUser?.email, currentUser?.departments),
    [currentUser],
  );

  const { data: report, isLoading } = useQuery({
    queryKey: ["evaluationReport", appraisalUserId],
    queryFn: () => GET_evaluationReport(appraisalUserId),
  });

  const isReportReady = useMemo(() => {
    if (!report) return false;
    return isTeamMemberReportUnlocked(report);
  }, [report]);

  useEffect(() => {
    if (isLoading) return;
    if (!report) {
      console.log("[EvaluationReport] Blocked: no report payload", {
        appraisalUserId,
      });
      return;
    }
    if (!isReportReady && !canViewIncompleteReport) {
      const ownerId = report.owner?.userId;
      const finalsGateDetail = report.finalAssessments.map((f) => ({
        assessType: f.assessType,
        assessTerm: f.assessTerm,
        grade: f.grade,
        assessedById: f.assessedById,
        isLeaderPerfFinal:
          f.assessType === "performance" &&
          f.assessTerm === "final" &&
          f.grade != null &&
          String(f.grade).trim() !== "" &&
          f.assessedById != null &&
          f.assessedById !== ownerId,
      }));
      console.log(
        "[EvaluationReport] Blocked: report body hidden for team member",
        {
          appraisalUserId,
          ownerId,
          canViewIncompleteReport,
          isReportReady,
          reason:
            report.finalAssessments.length === 0
              ? "no_appraisal_by_rows"
              : "no_leader_performance_final_with_grade",
          hint: "Need assessType=performance, assessTerm=final, non-empty grade, assessedById !== owner",
          finalAssessmentsCount: report.finalAssessments.length,
          finalsGateDetail,
          userStatus: report.userStatus,
          appraisalStatus: report.appraisalStatus,
        },
      );
    }
  }, [
    isLoading,
    report,
    isReportReady,
    canViewIncompleteReport,
    appraisalUserId,
  ]);

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] text-gray-400 gap-4'>
        <Loader2 className='w-10 h-10 animate-spin text-blue-600' />
        <p className='font-medium'>평가 리포트를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] text-center'>
        <FileText className='w-16 h-16 text-gray-300 mb-4' />
        <h3 className='text-xl font-bold text-gray-800'>
          리포트를 찾을 수 없습니다
        </h3>
        <p className='text-gray-500 mt-2'>
          해당 평가 데이터가 존재하지 않습니다.
        </p>
        <Button
          variant='outline'
          onClick={() => navigate("/evaluation-report")}
          className='mt-6'>
          <ArrowLeft className='w-4 h-4 mr-2' />
          목록으로
        </Button>
      </div>
    );
  }

  /*
   * 팀원 본문 공개: 리더(assessedById !== owner)의 성과(performance) 최종(final)
   * AppraisalBy가 1건 이상이고 등급이 있으면 통과. 다른 AppraisalBy 행은 무시.
   * 인사·관리자는 게이트 없이 항상 본문 조회 가능.
   */

  if (!isReportReady && !canViewIncompleteReport) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] text-center'>
        <ClipboardList className='w-16 h-16 text-gray-300 mb-4' />
        <h3 className='text-xl font-bold text-gray-800'>
          종합 평가가 아직 완료되지 않았습니다
        </h3>
        <p className='text-gray-500 mt-2 max-w-md'>
          리포트를 조회하려면 리더가 제출한 성과 평가의 최종(기말) 등급이
          등록되어야 합니다.
        </p>
        <Button
          variant='outline'
          onClick={() => navigate("/evaluation-report")}
          className='mt-6'>
          <ArrowLeft className='w-4 h-4 mr-2' />
          목록으로
        </Button>
      </div>
    );
  }

  return (
    <div className='p-4 lg:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 print:p-0'>
      <div className='flex items-start justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => navigate("/evaluation-report")}
            className='shrink-0 print:hidden'>
            <ArrowLeft className='w-5 h-5' />
          </Button>
          <div>
            <h1 className='text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3'>
              <FileText className='w-6 h-6 text-blue-600' />
              평가 종합 리포트
            </h1>
            <div className='flex items-center gap-3 mt-2'>
              <Badge className='bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold'>
                {report.owner.koreanName}
              </Badge>
              <span className='text-sm text-gray-500'>
                {report.appraisalTitle}
              </span>
              <Badge
                variant='outline'
                className={
                  report.appraisalStatus === "ongoing"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : String(report.appraisalStatus ?? "")
                          .toLowerCase()
                          .trim() === "finished"
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-gray-50"
                }>
                {formatAppraisalParticipationStatus(report.appraisalStatus)}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          variant='outline'
          className='gap-2 print:hidden'
          onClick={() => window.print()}>
          <FileText className='w-4 h-4' />
          인쇄
        </Button>
      </div>

      {canViewIncompleteReport && !isReportReady ? (
        <div
          className='rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 print:hidden'
          role='status'>
          인사·관리자 권한으로 작성 미완료 평가도 조회 중입니다. 일부 등급·의견은
          비어 있을 수 있습니다.
        </div>
      ) : null}

      {(() => {
        const competencyFinals = (report.finalAssessments ?? []).filter(
          (f) => f.assessType === "competency" && f.assessTerm === "final",
        );
        const performanceFinals = (report.finalAssessments ?? []).filter(
          (f) => f.assessType === "performance" && f.assessTerm === "final",
        );

        return (
          <>
            <GoalSection
              items={report.goals}
              finalItems={performanceFinals}
              ownerUserId={report.owner?.userId}
            />

            {report.competency.length > 0 ? (
              <CompetencySection
                items={report.competency}
                finalItems={competencyFinals}
                ownerUserId={report.owner?.userId}
              />
            ) : null}
          </>
        );
      })()}
    </div>
  );
}
