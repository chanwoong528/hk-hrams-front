import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ListChecks, Pencil, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MyAppraisal } from "../type";
import { getStatusColor, getStatusText, sortGoalsByProgress } from "../utils";
import { APPRAISAL_STATUS } from "../constants";
import GoalAssessmentItem from "../widget/GoalAssessmentItem";

interface AppraisalCardProps {
  appraisal: MyAppraisal;
  currentUserId?: string;
  onOpenFinalAssessment: (
    appraisalId: string,
    existingGrade?: string,
    existingComment?: string,
  ) => void;
  onSaveGoalAssessment: (
    goalId: string,
    grade: string,
    comment: string,
  ) => void;
}

export function AppraisalCard({
  appraisal,
  currentUserId,
  onOpenFinalAssessment,
  onSaveGoalAssessment,
}: AppraisalCardProps) {
  const navigate = useNavigate();

  // Helper to check if a goal is assessed by current user
  const isGoalAssessedByMe = (goal: MyAppraisal["goals"][0]) =>
    goal.goalAssessmentBy?.some((a) => a.gradedBy === currentUserId);

  const assessedGoalsCount = appraisal.goals.filter(isGoalAssessedByMe).length;
  const totalGoals = appraisal.goals.length;
  const isAllGoalsAssessed = assessedGoalsCount === totalGoals;
  const isSubmitted = appraisal.status === APPRAISAL_STATUS.SUBMITTED;
  const isFinished = appraisal.status === APPRAISAL_STATUS.FINISHED;

  const handleFinalAssessmentClick = () => {
    onOpenFinalAssessment(
      appraisal.appraisalUserId || appraisal.appraisalId,
      appraisal.selfAssessment?.grade,
      appraisal.selfAssessment?.comment,
    );
  };

  const sortedGoals = sortGoalsByProgress(appraisal.goals, currentUserId);

  return (
    <Card className='border-none shadow-none'>
      <CardContent className='p-0 space-y-4'>
        {/* Appraisal Header */}
        <div className='p-5 rounded-lg border bg-white shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center'>
          <div className='space-y-3 flex-1 min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <Badge className={getStatusColor(appraisal.status)}>
                {getStatusText(appraisal.status)}
              </Badge>
              <h3 className='font-bold text-lg text-gray-900 truncate'>
                {appraisal.title}
              </h3>
            </div>

            <p className='text-gray-600 text-sm leading-relaxed break-keep'>
              {appraisal.description}
            </p>

            <div className='flex items-center gap-3 text-sm text-gray-500 pt-1'>
              <span className='bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-600'>
                {appraisal.appraisalType}
              </span>
              <span className='w-px h-3 bg-gray-300'></span>
              <div className='flex items-center gap-1.5'>
                <ListChecks className='w-3.5 h-3.5' />
                <span className='font-medium text-gray-700'>
                  목표 {totalGoals}개
                </span>
              </div>
            </div>
          </div>
          <Button
            variant='outline'
            onClick={() => {
              navigate(`/goal-management/${appraisal.appraisalId}`);
            }}>
            {totalGoals > 0 ? (
              <Pencil className='w-4 h-4 mr-2' />
            ) : (
              <Plus className='w-4 h-4 mr-2' />
            )}
            {totalGoals > 0 ? "목표 관리" : "목표 등록"}
          </Button>

          {totalGoals > 0 && (
            <div className='flex flex-col gap-1 items-end'>
              <Button
                disabled={isSubmitted || !isAllGoalsAssessed}
                className='bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
                onClick={handleFinalAssessmentClick}>
                <ListChecks className='w-4 h-4 mr-2' />
                최종 자가 평가
              </Button>
              {!isAllGoalsAssessed && (
                <span className='text-xs text-red-500 font-medium'>
                  {isSubmitted
                    ? "이미 최종 제출되었습니다."
                    : `평가 진행률: ${assessedGoalsCount} / ${totalGoals} (모든 목표를 평가해야 합니다)`}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Goals List (Self Assessment) */}
        {totalGoals > 0 && (
          <div className='pl-0 lg:pl-6 space-y-4 border-l-2 border-gray-100 ml-4 py-2'>
            <h4 className='text-sm font-semibold text-gray-500 uppercase tracking-wider pl-2 flex items-center gap-2 mb-2'>
              <Star className='w-4 h-4' />
              목표 리스트 (Goal List)
            </h4>
            {sortedGoals.map((goal) => (
              <GoalAssessmentItem
                key={goal.goalId}
                goal={goal}
                currentUserId={currentUserId || ""}
                onSave={onSaveGoalAssessment}
                disabled={isSubmitted || isFinished}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
