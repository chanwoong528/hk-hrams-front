import { http } from "@/api";

export const GET_goalMyGoals = async (appraisalUserId: string) => {
  const response = await http.get(`/goal/appraisal/${appraisalUserId}`);
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
  const response = await http.post(`/common-goal`, payload);
  return response.data;
};

export const PATCH_commonGoal = (payload: {
  appraisalId: string;
  departmentId: string;
  oldTitle: string;
  newTitle: string;
  newDescription: string;
}) => {
  return http.patch("/common-goal", payload);
};

export const DELETE_commonGoal = (payload: {
  appraisalId: string;
  departmentId: string;
  title: string;
}) => {
  return http.delete("/common-goal", { data: payload });
};

export const PATCH_goal = (
  goalId: string,
  payload: { title: string; description: string },
) => {
  return http.patch(`/goal/${goalId}`, payload);
};

export const DELETE_goal = (goalId: string) => {
  return http.delete(`/goal/${goalId}`);
};

