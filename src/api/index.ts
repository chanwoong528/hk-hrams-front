import xior, { type XiorResponse } from "xior";
import { toast } from "sonner";
import { POST_newTokenFromOldRefreshToken } from "./auth/auth";
import { useCurrentUserStore } from "@/store/currentUserStore";
import errorRetry from "xior/plugins/error-retry";

import setupTokenRefresh from "xior/plugins/token-refresh";

export const http = xior.create({
  baseURL: import.meta.env.PROD
    ? "https://dp29w4ct1mtiu.cloudfront.net"
    : "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
});

http.interceptors.request.use((config) => {
  const token = useCurrentUserStore.getState().accessToken;
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

function shouldRefresh(response: XiorResponse) {
  const token = useCurrentUserStore.getState().accessToken;
  return Boolean(
    token &&
    response?.data?.statusCode &&
    [410].includes(response.data.statusCode as number),
  );
}

http.plugins.use(
  errorRetry({
    retryTimes: 1,
    retryInterval: 100,
    enableRetry: (_, error) => {
      if (error?.response && shouldRefresh(error.response)) {
        return true;
      }
      // return false;
    },
  }),
);

setupTokenRefresh(http, {
  shouldRefresh,
  async refreshToken(error) {
    try {
      const { data } = await POST_newTokenFromOldRefreshToken(
        useCurrentUserStore.getState().refreshToken as string,
      );
      if (data.accessToken && data.refreshToken) {
        useCurrentUserStore.getState().setAccessToken(data.accessToken);
        useCurrentUserStore.getState().setRefreshToken(data.refreshToken);
      } else {
        throw error;
      }
    } catch (error) {
      useCurrentUserStore.getState().clearAccessToken();
      useCurrentUserStore.getState().clearRefreshToken();
      toast.error("토큰 갱신 실패");
      return Promise.reject(error);
    }
  },
});
