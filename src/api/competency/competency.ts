import { http } from "@/api";

export interface CompetencyQuestionDto {
  appraisalId: string;
  departmentId: string;
  questions: string[];
}

export interface CompetencyAssessmentDto {
  assessmentId: string;
  competencyQuestion: {
    question: string;
    department: {
      departmentId: string;
      departmentName: string;
    };
  };
  grade?: string;
  comment?: string;
  evaluator: {
    userId: string;
    koreanName: string;
  };
  appraisalUser: {
    appraisalUserId: string;
    owner: {
      userId: string;
      koreanName: string;
    };
  };
}

// 1. 역량 평가 문항 출제
export const POST_createCompetencyQuestions = async (
  payload: CompetencyQuestionDto,
) => {
  const response = await http.post("/competency-question/department", payload);
  return response.data;
};

// 2. 부서원/자신의 역량 평가 항목 조회
export const GET_userCompetencyAssessments = async (
  appraisalUserId: string,
): Promise<CompetencyAssessmentDto[]> => {
  const response = await http.get(
    `/competency-assessment/user/${appraisalUserId}`,
  );
  return response.data;
};

// 3. 점수 저장 (본인 및 리더)
export const PATCH_competencyAssessment = async (
  assessmentId: string,
  payload: { grade?: string; comment?: string },
) => {
  const response = await http.patch(
    `/competency-assessment/${assessmentId}`,
    payload,
  );
  return response.data;
};

// 4. 출제된 역량 평가 문항 조회 (HR / 리더)
export interface CompetencyQuestionGroupDto {
  appraisalId: string;
  appraisalTitle: string;
  departmentId: string;
  departmentName: string;
  creatorId: string;
  creatorName: string;
  lastModifierId?: string;
  lastModifierName?: string;
  created: string;
  questions: string[];
}

export const GET_competencyQuestions = async (): Promise<
  CompetencyQuestionGroupDto[]
> => {
  const response = await http.get("/competency-question");
  return response.data?.data || [];
};
