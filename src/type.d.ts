interface Department {
  departmentId: string;
  departmentName: string;

  leaderId?: string;
  leader?: User;
  parent?: Department;
  children?: Department[];
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
