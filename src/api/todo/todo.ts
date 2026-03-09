import { http } from "@/api";

export interface TodoItem {
    id: string;
    title: string;
    type: 'COMPETENCY_SELF' | 'GOAL_SELF' | 'LEADER_REVIEW' | 'TEAM_COMPETENCY' | 'TEAM_GOAL';
    appraisalId?: string;
    appraisalUserId?: string;
    assignmentId?: string;
}

export interface MyTodosResponse {
    selfCompetency: TodoItem[];
    selfGoal: TodoItem[];
    leaderReview?: TodoItem[];
    teamCompetency?: TodoItem[];
    teamGoal?: TodoItem[];
}

export const GET_myTodos = async (): Promise<MyTodosResponse> => {
    const response = await http.get('/todo/my');
    return response.data;
};
