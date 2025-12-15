import { http } from "@/api";

export interface HramsUserType {
  userId: string;
  koreanName: string;
  email: string;
  departments?: any[];
  userStatus?: string;
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
) => {
  console.log("@@@keyword>> ", keyword);
  const response = await http.get("/user", {
    params: {
      page,
      limit,
      ...(keyword && { keyword }),
    },
  });

  return response.data;
};

export const POST_user = async (payload: {
  koreanName: string;
  email: string;
  departments: Department[];
}) => {
  const response = await http.post("/user", {
    koreanName: payload.koreanName,
    email: payload.email,
    departments: payload.departments.map((d) => d.departmentId),
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
}) => {
  console.log("@@@payload>> ", payload);
  const response = await http.patch(`/user/${payload.userId}`, {
    koreanName: payload.koreanName,
    email: payload.email,
    tobeDeletedDepartments: payload.tobeDeletedDepartments,
    tobeAddedDepartments: payload.tobeAddedDepartments,
    ...(payload.userStatus && { userStatus: payload.userStatus }),
  });
  return response.data;
};

export const GET_leaders = async () => {
  const { data } = await http.get("/user/leaders");
  return data || { data: [] };
};
