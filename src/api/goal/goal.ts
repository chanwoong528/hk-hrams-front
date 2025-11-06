import { http } from "@/api";

export const GET_goalMyGoals = async (appraisalUserId: string) => {
  const response = await http.get(`/goal/${appraisalUserId}`);
  return response.data;
};

export const POST_goals = async (payload: {
  appraisalId: string;
  goals: { title: string; description: string }[];
}) => {
  const response = await http.post(`/goal`, payload);
  return response.data;
};
