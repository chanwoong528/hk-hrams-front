import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import GoalForm from "../widget/GoalForm";
import {
  POST_goals,
  GET_goalMyGoals,
  PATCH_goal,
  DELETE_goal,
} from "@/api/goal/goal";
import { GET_appraisalDetail } from "@/api/appraisal/appraisal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useCurrentUserStore } from "@/store/currentUserStore";
import type { Goal, Appraisal } from "../type";
import {
  PERSONAL_GOALS_PHASE_HINT,
  canMutatePersonalGoalsInMacroPhase,
} from "../constants";

function getApiErrorMessage(error: unknown): string {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  const msg = err?.response?.data?.message ?? err?.message;
  if (typeof msg === "string" && msg.trim()) return msg.trim();
  return "요청 처리 중 오류가 발생했습니다.";
}

export default function GoalDetail() {
  const { appraisalId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useCurrentUserStore();
  const queryClient = useQueryClient();

  // 1. Fetch Appraisal Info
  const { data: appraisal } = useQuery({
    queryKey: ["appraisal", appraisalId],
    queryFn: () => GET_appraisalDetail(appraisalId || ""),
    enabled: !!appraisalId,
    select: (data) => data.data.list?.[0] as Appraisal,
  });

  const personalGoalsReadOnly =
    !appraisal ||
    !canMutatePersonalGoalsInMacroPhase(appraisal.macroWorkflowPhase);

  // 2. Fetch Existing Goals
  const { data: goals } = useQuery({
    queryKey: ["goals", appraisalId],
    // The API signature might need checking, assuming it takes appraisalUserId or similar.
    // Wait, GET_goalMyGoals takes 'appraisalUserId'. My backend goal.controller says getGoalByUserIdAndAppraisalId takes appraisalId.
    // Let's verify standard usage. If GET_goalMyGoals uses /goal/:appraisalId, then passing appraisalId is correct.
    queryFn: () => GET_goalMyGoals(appraisalId || ""),
    enabled: !!appraisalId,
    select: (data) => data.data as Goal[],
  });

  const isCurrentVersionApproved = (goal: Goal): boolean => {
    const currentVersion = Math.floor(Number(goal.approvalVersion ?? 1)) || 1;
    const approvalRow = (goal.goalAssessmentBy ?? []).find((assessment) => {
      const isApprovalTerm =
        String(assessment.assessTerm ?? "")
          .trim()
          .toLowerCase() === "goal_approval";
      const isCurrentVersion =
        Number(assessment.targetApprovalVersion ?? -1) === currentVersion;
      return isApprovalTerm && isCurrentVersion;
    });
    return String(approvalRow?.grade ?? "")
      .trim()
      .toUpperCase() === "T";
  };

  const lockedGoalIdSet = new Set(
    (goals ?? [])
      .filter((goal) => goal.goalType !== "common" && isCurrentVersionApproved(goal))
      .map((goal) => goal.goalId),
  );

  // 3. Mutations
  const isOfficeManagement =
    (currentUser?.jobGroup ?? "").trim() === "사무관리직";

  const { mutateAsync: postGoals } = useMutation({
    mutationFn: (payload: {
      appraisalId: string;
      goals: {
        title: string;
        description: string;
        kpi?: string;
        achieveIndicator?: string;
      }[];
    }) => POST_goals(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", appraisalId] });
      queryClient.invalidateQueries({ queryKey: ["appraisalTypes"] });
    },
  });

  const { mutateAsync: updateGoal } = useMutation({
    mutationFn: (payload: {
      goalId: string;
      title: string;
      description: string;
      kpi?: string;
      achieveIndicator?: string;
    }) =>
      PATCH_goal(payload.goalId, {
        title: payload.title,
        description: payload.description,
        ...(isOfficeManagement
          ? {
              kpi: payload.kpi,
              achieveIndicator: payload.achieveIndicator,
            }
          : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", appraisalId] });
      queryClient.invalidateQueries({ queryKey: ["appraisalTypes"] });
    },
  });

  const { mutateAsync: deleteGoal } = useMutation({
    mutationFn: (goalId: string) => DELETE_goal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", appraisalId] });
      queryClient.invalidateQueries({ queryKey: ["appraisalTypes"] });
    },
  });

  // 4. Batch Handler
  const handleSaveAll = async (
    newGoals: {
      title: string;
      description: string;
      kpi?: string;
      achieveIndicator?: string;
    }[],
    updatedGoals: {
      goalId?: string;
      title: string;
      description: string;
      kpi?: string;
      achieveIndicator?: string;
    }[],
    deletedGoalIds: string[],
  ) => {
    if (!appraisalId) return;

    try {
      const promises = [];

      // 1. Create New Goals
      if (newGoals.length > 0) {
        promises.push(postGoals({ appraisalId, goals: newGoals }));
      }

      // 2. Update Existing Goals
      updatedGoals.forEach((goal) => {
        if (goal.goalId) {
          if (lockedGoalIdSet.has(goal.goalId)) {
            return;
          }
          const originalGoal = goals?.find((g) => g.goalId === goal.goalId);
          if (
            originalGoal &&
            (originalGoal.title !== goal.title ||
              originalGoal.description !== goal.description ||
              (isOfficeManagement &&
                ((originalGoal.kpi ?? "") !== (goal.kpi ?? "") ||
                  (originalGoal.achieveIndicator ?? "") !==
                    (goal.achieveIndicator ?? ""))))
          ) {
            promises.push(
              updateGoal({
                goalId: goal.goalId,
                title: goal.title,
                description: goal.description,
                kpi: goal.kpi,
                achieveIndicator: goal.achieveIndicator,
              }),
            );
          }
        }
      });

      // 3. Delete Goals (Executed immediately via mutation, but better to promise all)
      // Note: My mutations above trigger toast/invalidation individually.
      // For batch, this might cause multiple toasts. Ideally we refactor mutations to not toast individually
      // or we just accept it for now.
      // Let's iterate.
      deletedGoalIds.forEach((id) => {
        if (lockedGoalIdSet.has(id)) {
          return;
        }
        promises.push(deleteGoal(id));
      });

      await Promise.all(promises);

      // Summary Toast
      const actionSummaries = [];
      if (newGoals.length > 0)
        actionSummaries.push(`추가 ${newGoals.length}건`);
      if (updatedGoals.length > 0)
        actionSummaries.push(`수정 ${updatedGoals.length}건`);
      if (deletedGoalIds.length > 0)
        actionSummaries.push(`삭제 ${deletedGoalIds.length}건`);

      if (actionSummaries.length > 0) {
        toast.success(`저장이 완료되었습니다 (${actionSummaries.join(", ")})`);
      } else {
        toast.info("변경사항이 없습니다");
      }
    } catch (error) {
      console.error("Batch save error", error);
      toast.error(getApiErrorMessage(error));
    }
  };

  return (
    <div className='p-4 lg:p-6 space-y-6'>
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => navigate(-1)}>
          <ArrowLeft className='w-5 h-5' />
        </Button>
        <div>
          <h2 className='text-gray-900 font-bold text-lg'>목표 관리 Detail</h2>
          <p className='text-gray-500 text-sm'>
            {appraisal?.title || "평가 정보를 불러오는 중..."}
          </p>
        </div>
      </div>

      <GoalForm
        onSaveAll={handleSaveAll}
        existingGoals={goals?.filter((g) => g.goalType !== "common") || []}
        lockedGoalIds={Array.from(lockedGoalIdSet)}
        targetJobGroup={currentUser?.jobGroup}
        personalGoalsReadOnly={personalGoalsReadOnly}
        personalGoalsReadOnlyMessage={PERSONAL_GOALS_PHASE_HINT}
        appraisalInfo={{
          title: appraisal?.title,
          description: appraisal?.description,
          endDate: appraisal?.endDate,
          userName:
            appraisal?.creator?.koreanName ||
            appraisal?.user?.find((u) => u.userId === appraisal.createdBy)
              ?.koreanName ||
            appraisal?.createdBy ||
            "-",
          userEmail:
            appraisal?.creator?.email ||
            appraisal?.user?.find((u) => u.userId === appraisal.createdBy)
              ?.email ||
            "-",
          userDept: currentUser?.departments?.[0]?.departmentName,
        }}
      />
    </div>
  );
}
