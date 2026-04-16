import { http } from "@/api";

export interface CompetencyQuestionDto {
  appraisalId: string;
  departmentId: string;
  jobGroup: string;
  questions: string[];
}

export interface CompetencyAssessmentDto {
  assessmentId: string;
  /** 중간(mid) · 기말(final) 문항 평가 */
  assessTerm?: string;
  competencyQuestion: {
    competencyId?: string;
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
  jobGroup: string;
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

// 5. 역량 평가 템플릿 관련
export interface CompetencyTemplateDto {
  templateId: string;
  title: string;
  description?: string;
  jobGroup?: string;
  creator: {
    userId: string;
    koreanName: string;
  };
  questions: {
    questionId: string;
    question: string;
    order: number;
  }[];
  created: string;
}

/** GET 응답이 배열 / { data: [] } / { data: { list } } 등으로 올 수 있음 */
function normalizeCompetencyTemplateList(payload: unknown): CompetencyTemplateDto[] {
  const tryArray = (v: unknown): CompetencyTemplateDto[] | null =>
    Array.isArray(v) ? (v as CompetencyTemplateDto[]) : null;

  const direct = tryArray(payload);
  if (direct) return direct;

  if (payload && typeof payload === "object") {
    const root = payload as Record<string, unknown>;
    const fromData = tryArray(root.data);
    if (fromData) return fromData;
    if (root.data && typeof root.data === "object") {
      const inner = root.data as Record<string, unknown>;
      const fromList = tryArray(inner.list);
      if (fromList) return fromList;
      const nestedData = tryArray(inner.data);
      if (nestedData) return nestedData;
    }
    const fromList = tryArray(root.list);
    if (fromList) return fromList;
  }

  return [];
}

export const GET_competencyTemplates = async (): Promise<
  CompetencyTemplateDto[]
> => {
  const response = await http.get("/competency-template");
  return normalizeCompetencyTemplateList(response.data as unknown);
};

export const POST_createCompetencyTemplate = async (payload: {
  title: string;
  description?: string;
  jobGroup?: string;
  questions: string[];
}) => {
  const response = await http.post("/competency-template", payload);
  return response.data;
};

export const DELETE_competencyTemplate = async (templateId: string) => {
  const response = await http.delete(`/competency-template/${templateId}`);
  return response.data;
};
