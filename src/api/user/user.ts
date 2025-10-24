import { http } from "@/api";

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
) => {
  const response = await http.get("/user", {
    params: {
      page,
      limit,
    },
  });

  return response.data;
};
