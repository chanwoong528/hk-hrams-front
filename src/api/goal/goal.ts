import { http } from "@/api";

export const GET_goalMyGoals = async (appraisalUserId: string) => {
  const response = await http.get(`/goal/${appraisalUserId}`);
  return response.data;
};
