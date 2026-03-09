import { http } from "@/api";

export interface CompetencyReportItem {
    competencyId: string;
    question: string;
    department: string;
    selfGrade?: string;
    selfComment?: string;
    leaderGrade?: string;
    leaderComment?: string;
    leaderName?: string;
}

export interface GoalReportItem {
    goalId: string;
    title: string;
    description: string;
    goalType: string;
    selfGrade?: string;
    selfComment?: string;
    leaderGrade?: string;
    leaderComment?: string;
    leaderName?: string;
}

export interface FinalAssessmentItem {
    appraisalById: string;
    assessType: string;
    assessTerm: string;
    grade: string;
    comment: string;
    assessedBy: string;
    created: string;
}

export interface EvaluationReportResponse {
    appraisalUserId: string;
    owner: { userId: string; koreanName: string };
    appraisalTitle: string;
    appraisalStatus: string;
    userStatus: string | null;
    competency: CompetencyReportItem[];
    goals: GoalReportItem[];
    finalAssessments: FinalAssessmentItem[];
}

export const GET_evaluationReport = async (appraisalUserId: string): Promise<EvaluationReportResponse> => {
    const response = await http.get(`/evaluation-report/${appraisalUserId}`);
    return response.data;
};
