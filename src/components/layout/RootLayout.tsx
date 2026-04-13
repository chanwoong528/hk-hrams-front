import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { useCurrentUserStore } from "@/store/currentUserStore";
import { GET_checkToken } from "@/api/auth/auth";
import { useQueryEffects } from "@/hooks/useQueryEffect";
import { toast } from "sonner";
import { createLogger } from "@/lib/logger";

const rootLogger = createLogger("RootLayout");

export default function RootLayout() {
  const navigate = useNavigate();
  const { accessToken, setCurrentUser, clearCurrentUser } =
    useCurrentUserStore();
  const location = useLocation();

  const userInfoQuery = useQuery({
    queryKey: ["userInfo", location.pathname],
    queryFn: () => GET_checkToken(accessToken as string),
    enabled:
      ![
        "/login",
        "/forgot-password",
        "/reset-password",
        "/verify-email",
      ].includes(location.pathname) && !!accessToken,
    retry: false,
  });

  useQueryEffects(userInfoQuery, {
    onSuccess: (data) => {
      const { username, ...rest } = data.data;
      setCurrentUser({ ...rest, koreanName: username });
    },
    onError: (error) => {
      rootLogger.error("세션 확인 실패", error);
      toast.error("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
      clearCurrentUser();
      navigate("/login");
    },
  });

  return (
    <>
      <Outlet />
    </>
  );
}
