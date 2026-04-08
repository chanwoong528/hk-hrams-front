import { http } from "@/api";

export interface HramsUserType {
  userId: string;
  koreanName: string;
  email: string;
  departments?: any[];
  userStatus?: string;
  jobGroup?: string;
  created?: string;
  updated?: string;
}

export interface Department {
  departmentId: string;
  departmentName: string;
}

export const GET_users = async (payload?: string) => {
  const response = await http.get("/user", {
    params: {
      keyword: payload,
    },
  });
  return response.data;
};

export const GET_usersByPagination = async (
  page: number = 1,
  limit: number = 10,
  keyword?: string,
  departmentId?: string,
) => {
  const response = await http.get("/user", {
    params: {
      page,
      limit,
      ...(keyword && { keyword }),
      ...(departmentId && { departmentId }),
    },
  });

  return response.data;
};

export const POST_user = async (payload: {
  koreanName: string;
  email: string;
  departments: Department[];
  jobGroup?: string;
}) => {
  const response = await http.post("/user", {
    koreanName: payload.koreanName,
    email: payload.email,
    departments: payload.departments.map((d) => d.departmentId),
    jobGroup: payload.jobGroup,
  });
  return response.data;
};
export const PATCH_user = async (payload: {
  userId: string;
  koreanName: string;
  email: string;
  tobeDeletedDepartments: string[];
  tobeAddedDepartments: string[];
  userStatus: "active" | "inactive";
  jobGroup?: string;
}) => {
  console.log("@@@payload>> ", payload);
  const response = await http.patch(`/user/${payload.userId}`, {
    koreanName: payload.koreanName,
    email: payload.email,
    tobeDeletedDepartments: payload.tobeDeletedDepartments,
    tobeAddedDepartments: payload.tobeAddedDepartments,
    ...(payload.userStatus && { userStatus: payload.userStatus }),
    jobGroup: payload.jobGroup,
  });
  return response.data;
};

export const GET_leaders = async () => {
  const { data } = await http.get("/user/leaders");
  return data || { data: [] };
};

export const POST_bulkUsers = async (payload: {
  users: {
    koreanName: string;
    email: string;
    jobGroup?: string;
    employeeId?: string;
    company?: string;
    phoneNumber?: string;
  }[];
  departments?: Department[];
}) => {
  const departmentIds = payload.departments?.map((d) => d.departmentId) ?? [];
  const response = await http.post("/user/bulk", {
    users: payload.users.map((u) => ({
      ...u,
      departments: departmentIds,
    })),
  });
  return response.data;
};
