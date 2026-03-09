import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import {
  GET_evaluationReport,
  type CompetencyReportItem,
  type GoalReportItem,
  type FinalAssessmentItem,
} from "@/api/evaluation-report/evaluation-report";
import { GET_appraisalsByDistinctType } from "@/api/appraisal/appraisal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ClipboardList,
  Target,
  Award,
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

function CompetencySection({ items }: { items: CompetencyReportItem[] }) {
  const byDept: Record<string, CompetencyReportItem[]> = {};
  items.forEach((item) => {
    const dept = item.department || "기타";
    if (!byDept[dept]) byDept[dept] = [];
    byDept[dept].push(item);
  });

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <div className='w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600'>
          <ClipboardList className='w-5 h-5' />
        </div>
        <h2 className='text-xl font-bold text-gray-900'>역량 평가</h2>
        <Badge variant='outline' className='text-xs'>
          {items.length}개 문항
        </Badge>
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
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function GoalSection({ items }: { items: GoalReportItem[] }) {
  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <div className='w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600'>
          <Target className='w-5 h-5' />
        </div>
        <h2 className='text-xl font-bold text-gray-900'>목표/성과 평가</h2>
        <Badge variant='outline' className='text-xs'>
          {items.length}개 목표
        </Badge>
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
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FinalAssessmentSection({ items }: { items: FinalAssessmentItem[] }) {
  const termLabel: Record<string, string> = {
    mid: "중간 평가",
    final: "최종 평가",
  };
  const typeLabel: Record<string, string> = {
    performance: "성과",
    competency: "역량",
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-3'>
        <div className='w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600'>
          <Award className='w-5 h-5' />
        </div>
        <h2 className='text-xl font-bold text-gray-900'>종합 평가</h2>
        <Badge variant='outline' className='text-xs'>
          {items.length}건
        </Badge>
      </div>

      {items.length === 0 ? (
        <Card className='border-none shadow-sm ring-1 ring-gray-200'>
          <CardContent className='p-8 text-center text-gray-400'>
            등록된 종합 평가가 없습니다.
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {items.map((item) => (
            <Card
              key={item.appraisalById}
              className='border-none shadow-sm ring-1 ring-gray-200 overflow-hidden'>
              <CardHeader className='pb-3 bg-amber-50/30 border-b'>
                <div className='flex items-center justify-between'>
                  <CardTitle className='text-sm font-bold text-gray-700 flex items-center gap-2'>
                    <Badge variant='outline' className='bg-white'>
                      {typeLabel[item.assessType] || item.assessType}
                    </Badge>
                    {termLabel[item.assessTerm] || item.assessTerm}
                  </CardTitle>
                  <div
                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black text-lg ${GRADE_COLORS[item.grade] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                    {item.grade}
                  </div>
                </div>
              </CardHeader>
              <CardContent className='p-5'>
                <p className='text-sm text-gray-700 leading-relaxed'>
                  {item.comment || "코멘트 없음"}
                </p>
                <p className='text-[10px] text-gray-400 mt-3'>
                  평가자: {item.assessedBy} |{" "}
                  {new Date(item.created).toLocaleDateString("ko-KR")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Selection page: lists all my appraisals to pick from
function AppraisalSelectionView() {
  const navigate = useNavigate();

  const { data: myAppraisals, isLoading } = useQuery({
    queryKey: ["myAppraisals"],
    queryFn: () => GET_appraisalsByDistinctType("my-appraisal"),
    select: (data) => data.data as any[],
  });

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
        <p className='text-sm text-gray-500 mt-2'>조회할 평가를 선택하세요.</p>
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
          {myAppraisals.map((appraisal: any) => (
            <button
              key={appraisal.appraisalUserId}
              onClick={() =>
                navigate(`/evaluation-report/${appraisal.appraisalUserId}`)
              }
              className='w-full flex items-center justify-between p-5 rounded-xl bg-white ring-1 ring-gray-200 hover:ring-blue-300 hover:bg-blue-50/30 transition-all text-left group'>
              <div className='flex items-center gap-4'>
                <div className='w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors'>
                  <FileText className='w-5 h-5' />
                </div>
                <div>
                  <h3 className='font-bold text-gray-800'>{appraisal.title}</h3>
                  <p className='text-xs text-gray-500 mt-0.5'>
                    {(() => {
                      const status = appraisal.status;
                      if (status === "ongoing") return "진행 중";
                      if (status === "submitted") return "제출 완료";
                      if (status === "completed") return "완료";
                      return status || "상태 없음";
                    })()}
                  </p>
                </div>
              </div>
              <ChevronRight className='w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors' />
            </button>
          ))}
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

  const { data: report, isLoading } = useQuery({
    queryKey: ["evaluationReport", appraisalUserId],
    queryFn: () => GET_evaluationReport(appraisalUserId),
  });

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

  // Check if ALL evaluations are complete (every item must have grades)
  const allCompetencyComplete =
    report.competency.length > 0 &&
    report.competency.every((c) => c.selfGrade && c.leaderGrade);
  const allGoalsComplete =
    report.goals.length === 0 ||
    report.goals.every((g) => g.selfGrade && g.leaderGrade);
  const isReportReady = allCompetencyComplete && allGoalsComplete;

  if (!isReportReady) {
    return (
      <div className='flex flex-col items-center justify-center min-h-[60vh] text-center'>
        <ClipboardList className='w-16 h-16 text-gray-300 mb-4' />
        <h3 className='text-xl font-bold text-gray-800'>
          아직 작성된 평가가 없습니다
        </h3>
        <p className='text-gray-500 mt-2 max-w-md'>
          리포트를 조회하려면 역량 평가, 목표 평가, 또는 종합 평가 중 하나
          이상이 작성되어야 합니다.
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
                    : "bg-gray-50"
                }>
                {report.appraisalStatus === "ongoing"
                  ? "진행 중"
                  : report.appraisalStatus}
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

      {report.competency.length > 0 && (
        <CompetencySection items={report.competency} />
      )}

      <GoalSection items={report.goals} />

      <FinalAssessmentSection items={report.finalAssessments} />
    </div>
  );
}
