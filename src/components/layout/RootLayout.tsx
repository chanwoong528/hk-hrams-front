import { Outlet, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { useCurrentUserStore } from "@/store/currentUserStore";
import { GET_checkToken } from "@/api/auth/auth";

export default function RootLayout() {
  const { accessToken } = useCurrentUserStore();
  const location = useLocation();

  const {
    data: userInfo,
    isError,
    error,
  } = useQuery({
    queryKey: ["userInfo", accessToken, location.pathname],
    queryFn: () => GET_checkToken(accessToken as string),
    enabled: !!accessToken,
  });

  console.log(isError, error);

  return (
    <>
      <Outlet />
    </>
  );
}
