import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  GET_competencyFinalAssessments,
  POST_competencyFinalAssessment,
} from "@/api/competency/competency-final";

export function useCompetencyFinalAssessment({
  appraisalUserId,
}: {
  appraisalUserId: string | null | undefined;
}) {
  const queryClient = useQueryClient();

  const finalQuery = useQuery({
    queryKey: ["competencyFinalAssessments", appraisalUserId],
    queryFn: () => GET_competencyFinalAssessments(appraisalUserId as string),
    enabled: Boolean(appraisalUserId),
  });

  const upsertMutation = useMutation({
    mutationFn: (payload: { appraisalUserId: string; grade: string }) =>
      POST_competencyFinalAssessment(payload),
    onSuccess: (_, variables) => {
      toast.success("최종 평가가 저장되었습니다.");
      queryClient.invalidateQueries({
        queryKey: ["competencyFinalAssessments", variables.appraisalUserId],
      });
      queryClient.invalidateQueries({ queryKey: ["competencyAssessments"] });
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      queryClient.invalidateQueries({ queryKey: ["hrTeamMembers"] });
    },
    onError: () => {
      toast.error("최종 평가 저장 실패");
    },
  });

  return {
    finalQuery,
    upsertFinal: upsertMutation.mutate,
    isSaving: upsertMutation.isPending,
  };
}

