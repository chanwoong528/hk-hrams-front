export interface Goal {
  goalId: string;
  title: string;
  description: string;
  goalType?: string;
  /** 사무관리직 목표 필수 */
  kpi?: string | null;
  achieveIndicator?: string | null;
  created?: string; // ISO string (Date 형태로 쓰고 싶다면 Date 로 바꿔도 됨)
  updated?: string;
  goalAssessmentBy?: {
    goalAssessId: string;
    grade: string;
    comment: string;
    gradedBy: string;
    /** 사무관리직·본인 자가 평가 시에만 */
    kpiAchievementRate?: string | null;
    gradedByUser?: {
      userId: string;
      koreanName: string;
    };
  }[];
}

export interface User {
  userId: string;
  appraisalUserId?: string;
  status?: string;

  selfAssessment?: {
    grade: string;
    comment: string;
    updated?: string;
  };
  assessments?: {
    appraisalById?: string;
    grade: string;
    comment: string;
    assessedById: string;
    assessType?: string;
    assessTerm?: string;
    /** Min department rank (non-HR); from API. 999 = HR-only / none */
    assessorMinRankNonHr?: number;
    assessedByUser?: {
      userId: string;
      koreanName: string;
    };
    updated?: string;
  }[];
  koreanName: string;
  email?: string;
  jobGroup?: string;
  /** 팀원 목록 API: 해당 부서 기준 리더(팀장) 여부 */
  isDepartmentLeader?: boolean;
  goals: Goal[];
}

export interface Appraisal {
  appraisalId: string;
  appraisalYear: string;
  appraisalTerm: string;
  title: string;
  description: string;
  endDate: string; // ISO string
  status: string;
  createdBy?: string;
  minGradeRank?: number;
  maxGradeRank?: number;
  creator?: {
    koreanName: string;
    email: string;
  };
  user: User[];
}

export interface DepartmentAppraisal {
  departmentName: string;
  departmentId: string;
  appraisal: Appraisal[];
}

export interface GoalFormData {
  goalId?: string;
  title: string;
  description: string;
  kpi?: string;
  achieveIndicator?: string;
}

export interface MyAppraisal {
  appraisalId: string;
  appraisalUserId?: string;
  title: string;
  description: string;
  endDate: string;
  status: string;
  selfAssessment?: {
    grade: string;
    comment: string;
    updated?: string;
  };
  goals: Goal[];
}
