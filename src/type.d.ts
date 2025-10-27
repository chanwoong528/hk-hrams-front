interface Department {
  departmentId: string;
  departmentName: string;

  leaderId?: string;
  leader?: User;
  parent?: Department;
  children?: Department[];
  teamMembers?: User[];
}

interface DepartmentTreeData {
  id: string;
  parent: string;
  droppable: boolean;
  text: string;
  data: Department;
}

interface User {
  userId: string;
  koreanName: string;
  email: string;
  created: string;
  updated: string;
  userStatus: "active" | "inactive";
  departments: Department[];
}

interface Appraisal {
  id: string;
  title: string;
  targetUser: string;
  description: string;
  endDate: string;
  excludedUsers: User[];
}

interface Goal {
  id: string;
  appraisalId: string;
  description: string;
  grade: string | null;
  assessedBy: string[];
}

interface Assessment {
  id: string;
  appraisalId: string;
  type: "performance" | "competency";
  term: "mid" | "final";
  grade: string;
  comments: string;
  assessor: string;
  date: string;
}
