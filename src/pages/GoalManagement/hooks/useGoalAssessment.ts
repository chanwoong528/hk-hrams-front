import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { POST_goalAssessmentBy } from "@/api/goal-assessment-by/goal-assessment-by";

interface UseGoalAssessmentProps {
    currentUserId?: string;
}

export function useGoalAssessment({ currentUserId }: UseGoalAssessmentProps) {
    const queryClient = useQueryClient();

    const { mutate: mutateAssessGoal } = useMutation({
        mutationFn: POST_goalAssessmentBy,
        onSuccess: () => {
            toast.success("평가가 저장되었습니다");
            queryClient.invalidateQueries({ queryKey: ["appraisalTypes"] });
        },
        onError: () => {
            toast.error("평가 저장 실패");
        },
    });

    const handleSelfAssessment = (
        goalId: string,
        grade: string,
        comment: string,
    ) => {
        if (!currentUserId) {
            toast.error("사용자 정보를 찾을 수 없습니다.");
            return;
        }
        mutateAssessGoal({
            goalId,
            grade,
            comment,
            gradedBy: currentUserId,
        });
    };

    return {
        handleSelfAssessment,
    };
}
