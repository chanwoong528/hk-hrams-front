import { http } from "@/api";

export interface CompetencyFinalAssessmentDto {
  competencyFinalAssessmentId: string;
  appraisalUserId: string;
  assessedById: string;
  grade: string;
  evaluationRound?: string;
  assessedBy?: {
    userId: string;
    koreanName: string;
  };
  created: string;
  updated: string;
}

type ApiResponse<T> = { statusCode: number; message: string; data: T };

export async function GET_competencyFinalAssessments(appraisalUserId: string) {
  const response = await http.get<ApiResponse<CompetencyFinalAssessmentDto[]>>(
    `/competency-final/user/${appraisalUserId}`,
  );
  return response.data;
}

export async function POST_competencyFinalAssessment(payload: {
  appraisalUserId: string;
  grade: string;
  evaluationRound?: "mid" | "final";
}) {
  const response = await http.post<ApiResponse<CompetencyFinalAssessmentDto>>(
    "/competency-final",
    payload,
  );
  return response.data;
}

