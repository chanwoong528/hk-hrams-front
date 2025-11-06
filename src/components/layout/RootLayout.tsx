import { Outlet, useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { useCurrentUserStore } from "@/store/currentUserStore";
import { GET_checkToken } from "@/api/auth/auth";
import { useQueryEffects } from "@/hooks/useQueryEffect";
import { toast } from "sonner";
// import { toast } from "sonner";

export default function RootLayout() {
  const navigate = useNavigate();
  const { accessToken, setCurrentUser, clearCurrentUser } =
    useCurrentUserStore();
  const location = useLocation();

  const userInfoQuery = useQuery({
    queryKey: ["userInfo", location.pathname],
    queryFn: () => GET_checkToken(accessToken as string),
    enabled: location.pathname !== "/login",
    retry: false,
  });

  useQueryEffects(userInfoQuery, {
    onSuccess: (data) => {
      setCurrentUser(data.data);
    },
    onError: (error) => {
      console.error("@@@@@@@@@@@@@@@@@@@@@@@@@@@@ ", error);
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
