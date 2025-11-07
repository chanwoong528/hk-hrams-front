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

export const POST_commonGoal = async (payload: {
  appraisalId: string;
  departmentId: string;
  goals: { title: string; description: string }[];
}) => {
  console.log("@@@@@@@@@@@@@@@ payload>> ", payload);
  const response = await http.post(`/common-goal`, payload);
  return response.data;
};
