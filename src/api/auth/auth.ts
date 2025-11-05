import { http } from "@/api";

export const POST_signIn = async (payload: SignInPayload) => {
  const response = await http.post("/auth", payload);
  return response.data;
};

export const POST_newTokenFromOldRefreshToken = async (
  refreshToken: string,
) => {
  const response = await http.post("/auth/new-token", {
    refreshToken: refreshToken,
  });
  return response.data;
};

export const GET_checkToken = async (accessToken: string) => {
  const response = await http.get("/auth/user-info", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return response.data;
};
