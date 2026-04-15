import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ListChecks, Pencil, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MyAppraisal, PerformanceSummarySnapshot } from "../type";
import {
  getStatusColor,
  getStatusText,
  goalHasUserAssessmentForTerm,
  isAppraisalEditableByEndDate,
  sortGoalsByProgress,
} from "../utils";
import {
  APPRAISAL_STATUS,
  PERSONAL_GOALS_PHASE_HINT,
  canMutatePersonalGoalsInMacroPhase,
} from "../constants";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import GoalAssessmentItem from "../widget/GoalAssessmentItem";
import { useCurrentUserStore } from "@/store/currentUserStore";
import { assessTermForSelfPerformance } from "@/lib/appraisalMacroWorkflow";

interface AppraisalCardProps {
  appraisal: MyAppraisal;
  currentUserId?: string;
  onOpenFinalAssessment: (
    appraisalId: string,
    existingGrade?: string,
    existingComment?: string,
    jobGroup?: string | null,
    macroWorkflowPhase?: number,
    peerSelfRounds?: {
      mid?: PerformanceSummarySnapshot;
      final?: PerformanceSummarySnapshot;
    },
  ) => void;
  onSaveGoalAssessment: (
    goalId: string,
    grade: string,
    comment: string,
    gradedByUserId?: string,
    kpiAchievementRate?: string,
    assessTerm?: "mid" | "final",
  ) => void;
}

export function AppraisalCard({
  appraisal,
  currentUserId,
  onOpenFinalAssessment,
  onSaveGoalAssessment,
}: AppraisalCardProps) {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUserStore();

  const performanceSelfTerm = assessTermForSelfPerformance(
    appraisal.macroWorkflowPhase,
  );
  const performanceSelfWindowClosed = performanceSelfTerm === null;

  const isGoalAssessedByMe = (goal: MyAppraisal["goals"][0]) =>
    performanceSelfTerm != null && currentUserId
      ? goalHasUserAssessmentForTerm(
          goal,
          currentUserId,
          performanceSelfTerm,
        )
      : goal.goalAssessmentBy?.some((a) => a.gradedBy === currentUserId);

  const assessedGoalsCount = appraisal.goals.filter(isGoalAssessedByMe).length;
  const totalGoals = appraisal.goals.length;
  const isAllGoalsAssessed = assessedGoalsCount === totalGoals;
  const isSubmitted = appraisal.status === APPRAISAL_STATUS.SUBMITTED;
  const isFinished = appraisal.status === APPRAISAL_STATUS.FINISHED;
  const editableByDeadline = isAppraisalEditableByEndDate(appraisal.endDate);
  const finalAssessmentLockedByStatus =
    (isSubmitted || isFinished) && !editableByDeadline;

  const finalAssessmentButtonDisabled =
    !isAllGoalsAssessed ||
    finalAssessmentLockedByStatus ||
    performanceSelfWindowClosed;
  const goalRowDisabled = (isSubmitted || isFinished) && !editableByDeadline;

  const handleFinalAssessmentClick = () => {
    const term = assessTermForSelfPerformance(appraisal.macroWorkflowPhase);
    const initial =
      term === "final"
        ? appraisal.selfPerformanceFinal
        : term === "mid"
          ? appraisal.selfPerformanceMid
          : undefined;

    onOpenFinalAssessment(
      appraisal.appraisalUserId || appraisal.appraisalId,
      initial?.grade,
      initial?.comment,
      currentUser?.jobGroup,
      appraisal.macroWorkflowPhase,
      {
        mid: appraisal.selfPerformanceMid,
        final: appraisal.selfPerformanceFinal,
      },
    );
  };

  const sortedGoals = sortGoalsByProgress(
    appraisal.goals,
    currentUserId,
    performanceSelfTerm,
  );

  const canMutatePersonalGoals = canMutatePersonalGoalsInMacroPhase(
    appraisal.macroWorkflowPhase,
  );
  const registerGoalsBlocked = totalGoals === 0 && !canMutatePersonalGoals;

  const termLabel = (t: "mid" | "final") =>
    t === "mid" ? "중간" : "기말";

  const otherPerf = appraisal.otherPerformanceAssessments ?? [];
  const hasSummaryStrip =
    !!(appraisal.selfPerformanceMid?.grade?.trim() ||
      appraisal.selfPerformanceMid?.comment?.trim() ||
      appraisal.selfPerformanceFinal?.grade?.trim() ||
      appraisal.selfPerformanceFinal?.comment?.trim()) ||
    otherPerf.length > 0;

  const footerHint = (() => {
    if (!isAllGoalsAssessed) {
      return {
        text: `평가 진행률: ${assessedGoalsCount} / ${totalGoals} (모든 목표를 평가해야 합니다)`,
        tone: "warning" as const,
      };
    }
    if (isAllGoalsAssessed && performanceSelfWindowClosed && totalGoals > 0) {
      return {
        text: "성과 종합 자가 평가는 워크플로 2단계(중간)·4단계(기말)에서만 제출할 수 있습니다. 해당 단계가 되면 버튼이 활성화됩니다.",
        tone: "info" as const,
      };
    }
    if (
      isAllGoalsAssessed &&
      (isSubmitted || isFinished) &&
      editableByDeadline
    ) {
      const dateStr = new Date(appraisal.endDate).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      return {
        text: `마감 ${dateStr}까지 최종 자가 평가를 수정할 수 있습니다.`,
        tone: "info" as const,
      };
    }
    if (
      isAllGoalsAssessed &&
      (isSubmitted || isFinished) &&
      !editableByDeadline
    ) {
      return {
        text: isFinished
          ? "평가가 최종 완료되었습니다."
          : "이미 최종 제출되었습니다.",
        tone: "closed" as const,
      };
    }
    return null;
  })();

  return (
    <Card className="border-none shadow-none">
      <CardContent className="p-0 space-y-4">
        {/* Appraisal Header */}
        <div className="flex flex-col gap-4 rounded-lg border bg-white p-5 shadow-sm lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={getStatusColor(appraisal.status)}>
                {getStatusText(appraisal.status)}
              </Badge>
              <h3 className="truncate text-lg font-bold text-gray-900">
                {appraisal.title}
              </h3>
            </div>

            <p className="break-keep text-sm leading-relaxed text-gray-600">
              {appraisal.description}
            </p>

            {hasSummaryStrip ? (
              <div
                className="rounded-lg border border-slate-200 bg-slate-50/90 p-3 text-sm shadow-sm"
                role="region"
                aria-label="성과 종합 등급 요약">
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 pb-2">
                  <span className="text-xs font-semibold text-slate-600">
                    나의 성과 종합 자가
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {appraisal.selfPerformanceMid?.grade?.trim() ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-white text-emerald-900">
                        중간 {appraisal.selfPerformanceMid.grade}등급
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">중간 —</span>
                    )}
                    {appraisal.selfPerformanceFinal?.grade?.trim() ? (
                      <Badge
                        variant="outline"
                        className="border-indigo-200 bg-white text-indigo-900">
                        기말 {appraisal.selfPerformanceFinal.grade}등급
                      </Badge>
                    ) : (
                      <span className="text-xs text-slate-400">기말 —</span>
                    )}
                  </div>
                </div>
                {(appraisal.selfPerformanceMid?.grade?.trim() ||
                  appraisal.selfPerformanceMid?.comment?.trim() ||
                  appraisal.selfPerformanceFinal?.grade?.trim() ||
                  appraisal.selfPerformanceFinal?.comment?.trim()) ? (
                  <Accordion
                    type="multiple"
                    className="w-full border-b border-slate-200/80 pb-1">
                    {(appraisal.selfPerformanceMid?.grade?.trim() ||
                      appraisal.selfPerformanceMid?.comment?.trim()) ? (
                      <AccordionItem value="self-mid" className="border-slate-100">
                        <AccordionTrigger className="py-2 text-xs font-medium text-slate-800 hover:no-underline">
                          <span className="flex flex-wrap items-center gap-2">
                            중간 자가 코멘트
                            {appraisal.selfPerformanceMid?.grade?.trim() ? (
                              <Badge
                                variant="outline"
                                className="border-emerald-200 bg-white text-[10px] text-emerald-900">
                                {appraisal.selfPerformanceMid.grade}등급
                              </Badge>
                            ) : null}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2 pt-0">
                          <p className="whitespace-pre-wrap rounded-md border border-slate-100 bg-white p-2 text-xs leading-relaxed text-slate-700 [overflow-wrap:anywhere]">
                            {appraisal.selfPerformanceMid?.comment?.trim() ||
                              "등록된 코멘트가 없습니다."}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ) : null}
                    {(appraisal.selfPerformanceFinal?.grade?.trim() ||
                      appraisal.selfPerformanceFinal?.comment?.trim()) ? (
                      <AccordionItem value="self-final" className="border-slate-100">
                        <AccordionTrigger className="py-2 text-xs font-medium text-slate-800 hover:no-underline">
                          <span className="flex flex-wrap items-center gap-2">
                            기말 자가 코멘트
                            {appraisal.selfPerformanceFinal?.grade?.trim() ? (
                              <Badge
                                variant="outline"
                                className="border-indigo-200 bg-white text-[10px] text-indigo-900">
                                {appraisal.selfPerformanceFinal.grade}등급
                              </Badge>
                            ) : null}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="pb-2 pt-0">
                          <p className="whitespace-pre-wrap rounded-md border border-slate-100 bg-white p-2 text-xs leading-relaxed text-slate-700 [overflow-wrap:anywhere]">
                            {appraisal.selfPerformanceFinal?.comment?.trim() ||
                              "등록된 코멘트가 없습니다."}
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    ) : null}
                  </Accordion>
                ) : null}
                {otherPerf.length > 0 ? (
                  <div className="pt-2">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      팀장·상위 조직 성과 평가
                    </div>
                    <Accordion type="multiple" className="w-full">
                      {otherPerf.map((row, idx) => (
                        <AccordionItem
                          key={`${row.assessedById ?? "x"}-${row.assessTerm}-${idx}`}
                          value={`other-${row.assessedById ?? idx}-${row.assessTerm}-${idx}`}
                          className="border-slate-100">
                          <AccordionTrigger className="py-2 text-xs hover:no-underline">
                            <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 pr-1 text-left">
                              <span className="min-w-0 font-medium text-slate-800 [overflow-wrap:anywhere]">
                                {row.assessedByName}
                                <span className="ml-1.5 font-normal text-slate-500">
                                  ({termLabel(row.assessTerm)})
                                </span>
                              </span>
                              <Badge
                                variant="outline"
                                className="shrink-0 border-purple-200 bg-purple-50/80 text-purple-900">
                                {(row.grade ?? "").trim() || "—"}등급
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-2 pt-0">
                            <p className="whitespace-pre-wrap rounded-md border border-slate-100 bg-white p-2 text-xs leading-relaxed text-slate-700 [overflow-wrap:anywhere]">
                              {(row.comment ?? "").trim() ||
                                "등록된 코멘트가 없습니다."}
                            </p>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ) : (
                  <p className="pt-2 text-xs text-slate-500">
                    아직 등록된 팀장·상위 성과 종합 평가가 없습니다.
                  </p>
                )}
              </div>
            ) : null}

            <div className="flex items-center gap-3 pt-1 text-sm text-gray-500">
              <div className="flex items-center gap-1.5">
                <ListChecks className="h-3.5 w-3.5" />
                <span className="font-medium text-gray-700">
                  목표 {totalGoals}개
                </span>
              </div>
            </div>
          </div>

          <div className="flex w-full min-w-0 shrink-0 flex-col gap-2 lg:w-auto lg:max-w-sm">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {registerGoalsBlocked ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex shrink-0">
                      <Button
                        variant="outline"
                        className="shrink-0"
                        disabled
                        aria-label={PERSONAL_GOALS_PHASE_HINT}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        목표 등록
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="max-w-xs text-balance leading-snug"
                  >
                    {PERSONAL_GOALS_PHASE_HINT}
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="outline"
                  className="shrink-0"
                  onClick={() => {
                    navigate(`/goal-management/${appraisal.appraisalId}`);
                  }}
                >
                  {totalGoals > 0 ? (
                    <Pencil className="mr-2 h-4 w-4" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {totalGoals > 0 ? "목표 관리" : "목표 등록"}
                </Button>
              )}
              {totalGoals > 0 ? (
                <Button
                  disabled={finalAssessmentButtonDisabled}
                  className="shrink-0 bg-indigo-600 text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                  onClick={handleFinalAssessmentClick}
                >
                  <ListChecks className="mr-2 h-4 w-4" />
                  {isFinished && !editableByDeadline
                    ? "자가 평가 완료"
                    : isSubmitted || isFinished
                      ? "최종 자가 평가 수정"
                      : "최종 자가 평가"}
                </Button>
              ) : null}
            </div>
            {totalGoals > 0 && footerHint ? (
              <p
                className={
                  footerHint.tone === "info"
                    ? "rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-right text-xs leading-relaxed text-slate-600 [overflow-wrap:anywhere]"
                    : footerHint.tone === "warning"
                      ? "rounded-md border border-red-100 bg-red-50/60 px-3 py-2 text-right text-xs font-medium leading-relaxed text-red-700 [overflow-wrap:anywhere]"
                      : "rounded-md border border-red-100 bg-red-50/40 px-3 py-2 text-right text-xs font-medium leading-relaxed text-red-600 [overflow-wrap:anywhere]"
                }
              >
                {footerHint.text}
              </p>
            ) : null}
          </div>
        </div>

        {/* Goals List (Self Assessment) */}
        {totalGoals > 0 && (
          <div className="min-w-0 space-y-4 border-l-2 border-gray-100 py-2 pl-0 ml-2 sm:ml-4 lg:pl-6">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pl-2 flex items-center gap-2 mb-2">
              <Star className="w-4 h-4" />
              목표 리스트 (Goal List)
            </h4>
            {sortedGoals.map((goal) => (
              <GoalAssessmentItem
                key={goal.goalId}
                goal={goal}
                currentUserId={currentUserId || ""}
                onSave={onSaveGoalAssessment}
                disabled={
                  goalRowDisabled ||
                  !canMutatePersonalGoalsInMacroPhase(
                    appraisal.macroWorkflowPhase,
                  )
                }
                writableAssessTerm={performanceSelfTerm ?? undefined}
                targetUserJobGroup={currentUser?.jobGroup}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
