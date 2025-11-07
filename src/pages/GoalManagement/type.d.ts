export interface Goal {
  goalId: string;
  title: string;
  description: string;
  created: string; // ISO string (Date 형태로 쓰고 싶다면 Date 로 바꿔도 됨)
  updated: string;
}

export interface User {
  userId: string;
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
  title: string;
  description: string;
}
