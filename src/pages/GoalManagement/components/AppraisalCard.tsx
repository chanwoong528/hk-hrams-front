import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ListChecks, Pencil, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MyAppraisal } from "../type";
import {
  getStatusColor,
  getStatusText,
  isAppraisalEditableByEndDate,
  sortGoalsByProgress,
} from "../utils";
import { APPRAISAL_STATUS } from "../constants";
import GoalAssessmentItem from "../widget/GoalAssessmentItem";
import { useCurrentUserStore } from "@/store/currentUserStore";

interface AppraisalCardProps {
  appraisal: MyAppraisal;
  currentUserId?: string;
  onOpenFinalAssessment: (
    appraisalId: string,
    existingGrade?: string,
    existingComment?: string,
    jobGroup?: string | null,
  ) => void;
  onSaveGoalAssessment: (
    goalId: string,
    grade: string,
    comment: string,
    gradedByUserId?: string,
    kpiAchievementRate?: string,
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

  // Helper to check if a goal is assessed by current user
  const isGoalAssessedByMe = (goal: MyAppraisal["goals"][0]) =>
    goal.goalAssessmentBy?.some((a) => a.gradedBy === currentUserId);

  const assessedGoalsCount = appraisal.goals.filter(isGoalAssessedByMe).length;
  const totalGoals = appraisal.goals.length;
  const isAllGoalsAssessed = assessedGoalsCount === totalGoals;
  const isSubmitted = appraisal.status === APPRAISAL_STATUS.SUBMITTED;
  const isFinished = appraisal.status === APPRAISAL_STATUS.FINISHED;
  const editableByDeadline = isAppraisalEditableByEndDate(appraisal.endDate);
  const finalAssessmentLockedByStatus =
    (isSubmitted || isFinished) && !editableByDeadline;
  const finalAssessmentButtonDisabled =
    !isAllGoalsAssessed || finalAssessmentLockedByStatus;
  const goalRowDisabled = (isSubmitted || isFinished) && !editableByDeadline;

  const handleFinalAssessmentClick = () => {
    onOpenFinalAssessment(
      appraisal.appraisalUserId || appraisal.appraisalId,
      appraisal.selfAssessment?.grade,
      appraisal.selfAssessment?.comment,
      currentUser?.jobGroup,
    );
  };

  const sortedGoals = sortGoalsByProgress(appraisal.goals, currentUserId);

  const footerHint = (() => {
    if (!isAllGoalsAssessed) {
      return {
        text: `평가 진행률: ${assessedGoalsCount} / ${totalGoals} (모든 목표를 평가해야 합니다)`,
        tone: "warning" as const,
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
                disabled={goalRowDisabled}
                targetUserJobGroup={currentUser?.jobGroup}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
