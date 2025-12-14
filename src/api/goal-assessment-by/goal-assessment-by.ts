import { http } from "@/api";

export const POST_goalAssessmentBy = async (payload: {
  goalId: string;
  grade: string;
  gradedBy: string;
  comment?: string;
}) => {
  const response = await http.post(`/goal-assessment-by`, payload);
  return response.data;
};
