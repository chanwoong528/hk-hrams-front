export interface Goal {
  goalId: string;
  title: string;
  description: string;
  goalType?: string;
  created: string; // ISO string (Date 형태로 쓰고 싶다면 Date 로 바꿔도 됨)
  updated: string;
  goalAssessmentBy?: {
    goalAssessId: string;
    grade: string;
    comment: string;
    gradedBy: string;
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
  };
  assessments?: {
    grade: string;
    comment: string;
    assessedById: string;
    updated?: string;
  }[];
  koreanName: string;
  goals: Goal[];
}

export interface Appraisal {
  appraisalId: string;
  appraisalType: string;
  title: string;
  description: string;
  endDate: string; // ISO string
  status: string;
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
}

export interface MyAppraisal {
  appraisalId: string;
  appraisalUserId?: string;
  appraisalType: string;
  title: string;
  description: string;
  endDate: string;
  status: string;
  status: string;
  selfAssessment?: {
    grade: string;
    comment: string;
    updated?: string;
  };
  goals: Goal[];
}
