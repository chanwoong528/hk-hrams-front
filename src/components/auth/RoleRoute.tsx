import { Navigate } from "react-router-dom";
import { useCurrentUserStore } from "@/store/currentUserStore";

interface RoleRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  leaderOnly?: boolean;
}

export default function RoleRoute({
  children,
  adminOnly,
  leaderOnly,
}: RoleRouteProps) {
  const { currentUser, accessToken } = useCurrentUserStore();

  if (!currentUser) {
    if (accessToken) {
      return null;
    }
    return <Navigate to='/login' replace />;
  }

  const isAdmin =
    currentUser.email === "mooncw@hankookilbo.com" ||
    !!currentUser.departments?.some(
      (d) =>
        d.departmentName.toLowerCase() === "hr" ||
        d.departmentName === "인사팀",
    );

  const isLeader = !!currentUser.departments?.some((d) => d.isLeader);

  if (adminOnly && leaderOnly) {
    if (!isAdmin && !isLeader) {
      return <Navigate to='/todo' replace />;
    }
  } else if (adminOnly && !isAdmin) {
    return <Navigate to='/todo' replace />;
  } else if (leaderOnly && !isLeader) {
    return <Navigate to='/todo' replace />;
  }

  return <>{children}</>;
}
