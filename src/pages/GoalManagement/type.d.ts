/** 성과 종합(AppraisalBy performance) 한 차수 스냅샷 */
export type PerformanceSummarySnapshot = {
  grade: string;
  comment: string;
  updated?: string;
};

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
  /** 목표 승인 버전 (2단계 승인/거절용) */
  approvalVersion?: number;
  goalAssessmentBy?: {
    goalAssessId: string;
    grade: string;
    comment: string;
    gradedBy: string;
    /** 중간(mid)·기말(final). 생략·기타 값은 기말로 표시 */
    assessTerm?: string | null;
    /** 승인(assessTerm=goal_approval) 대상 버전, mid/final은 -1 */
    targetApprovalVersion?: number;
    /** 사무관리직·본인 자가 평가 시에만 */
    kpiAchievementRate?: string | null;
    created?: string | null;
    updated?: string;
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
  selfPerformanceMid?: PerformanceSummarySnapshot;
  selfPerformanceFinal?: PerformanceSummarySnapshot;
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
  /** HR 매크로 워크플로 1–6 */
  macroWorkflowPhase?: number;
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
  /** HR 매크로 워크플로 1–5 (개인 목표는 2·4에서만 변경) */
  macroWorkflowPhase?: number;
  selfAssessment?: {
    grade: string;
    comment: string;
    updated?: string;
  };
  /** 성과 종합 자가 — 중간(assessTerm mid) */
  selfPerformanceMid?: PerformanceSummarySnapshot;
  /** 성과 종합 자가 — 기말(assessTerm final) */
  selfPerformanceFinal?: PerformanceSummarySnapshot;
  /** 나를 평가한 타인의 성과 종합(performance) — 팀장·상위 등, 차수별 */
  otherPerformanceAssessments?: {
    assessTerm: "mid" | "final";
    grade: string;
    comment?: string;
    assessedById?: string;
    assessedByName?: string;
    updated?: string;
  }[];
  goals: Goal[];
}
