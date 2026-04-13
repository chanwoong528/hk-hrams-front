import { useState } from "react";
import { navigation } from "@/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { useCurrentUserStore } from "@/store/currentUserStore";
import { useQueryClient } from "@tanstack/react-query";

type NavItem = {
  id: string;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: NavItem[];
  detailPage?: boolean;
  admin?: boolean;
  leader?: boolean;
};

function isPathMatch(
  pathname: string,
  pattern?: string,
  search?: string,
): boolean {
  // Exact match
  if (!pattern) return false;

  const fullPath = search ? `${pathname}${search}` : pathname;

  if (fullPath === pattern || pathname === pattern.split("?")[0]) return true;

  // Convert route pattern to regex
  // e.g., "/performance-appraisal/:appraisalId" -> "^\/performance-appraisal\/[^/]+$"
  const regexPattern = pattern
    .split("?")[0] // Only match the pathname part for dynamic routes
    .split("/")
    .map((segment) => (segment.startsWith(":") ? "[^/]+" : segment))
    .join("\\/");
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(pathname);
}

function isRouteActive(
  pathname: string,
  search: string,
  item: NavItem,
): boolean {
  // Check if current path matches this item
  if (isPathMatch(pathname, item.path, search)) return true;

  // Check if any child route matches
  if (item.children) {
    return item.children.some((child) =>
      isRouteActive(pathname, search, child),
    );
  }

  return false;
}

function NavItemComponent({
  item,
  pathname,
  search,
  navigate,
  setSidebarOpen,
  level = 0,
}: {
  item: NavItem;
  pathname: string;
  search: string;
  navigate: (path: string) => void;
  setSidebarOpen: (open: boolean) => void;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(() => {
    // Auto-expand if any child is active
    if (item.children) {
      return item.children.some((child) =>
        isRouteActive(pathname, search, child),
      );
    }
    return false;
  });

  const isActive = isRouteActive(pathname, search, item);
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;
  const isChildActive =
    hasChildren &&
    item.children!.some((child) => isRouteActive(pathname, search, child));

  const handleItemClick = (e: React.MouseEvent) => {
    setSidebarOpen(false);
    if (item?.detailPage) {
      e.preventDefault();
      return;
    }
    if (item.path) {
      navigate(item.path);
    } else if (item.children) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 flex-nowrap items-center gap-1">
        <button
          type="button"
          onClick={handleItemClick}
          className={`min-w-0 flex-1 flex items-center gap-3 overflow-hidden px-4 py-3 rounded-lg transition-colors cursor-pointer text-left ${
            isActive && !hasChildren
              ? item.admin
                ? "bg-red-600 text-white"
                : item.leader
                  ? "bg-green-600 text-white"
                  : "bg-blue-600 text-white"
              : isChildActive || (isActive && hasChildren)
                ? item.admin
                  ? "bg-red-50 text-red-700"
                  : item.leader
                    ? "bg-green-50 text-green-700"
                    : "bg-blue-50 text-blue-700"
                : item.admin
                  ? "text-red-600 hover:bg-red-50"
                  : item.leader
                    ? "text-green-600 hover:bg-green-50"
                    : "text-gray-700 hover:bg-gray-100"
          }`}
          style={{ paddingLeft: `${1 + level * 1}rem` }}
        >
          {Icon ? (
            <Icon className="w-5 h-5 shrink-0" aria-hidden />
          ) : (
            <div className="w-5 h-5 shrink-0" aria-hidden />
          )}
          <span
            className='min-w-0 flex-1 truncate font-medium'
            title={item.name}>
            {item.name}
          </span>
        </button>
        {hasChildren && (
          <button
            type="button"
            onClick={handleChevronClick}
            className="shrink-0 p-2 rounded-lg transition-colors cursor-pointer hover:bg-gray-100 flex items-center justify-center"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "하위 메뉴 접기" : "하위 메뉴 펼치기"}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className="ml-4 mt-1 min-w-0 space-y-1">
          {item.children!.map((child) => (
            <NavItemComponent
              key={child.id}
              item={child}
              pathname={pathname}
              search={search}
              navigate={navigate}
              setSidebarOpen={setSidebarOpen}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SidebarContent({
  setSidebarOpen,
}: {
  setSidebarOpen: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, clearCurrentUser } = useCurrentUserStore();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    clearCurrentUser();
    queryClient.clear();
    navigate("/login");
  };

  const isAdmin =
    currentUser?.email === "mooncw@hankookilbo.com" ||
    !!currentUser?.departments?.some(
      (d) =>
        d.departmentName.trim().toLowerCase() === "hr",
    );

  const isLeader =
    isAdmin || !!currentUser?.departments?.some((d) => d.isLeader);

  const filterNavItems = (
    items: NavItem[],
    isAdmin: boolean,
    isLeader: boolean,
  ): NavItem[] => {
    const filtered: NavItem[] = [];

    for (const item of items) {
      if (item.admin && !isAdmin) continue;
      if (item.leader && !isLeader) continue;

      const clonedItem = { ...item };

      if (clonedItem.children) {
        clonedItem.children = filterNavItems(
          clonedItem.children,
          isAdmin,
          isLeader,
        );
        // If it originally had children but now has none after filtering, hide it.
        if (
          item.children &&
          item.children.length > 0 &&
          clonedItem.children.length === 0
        ) {
          continue;
        }
      }

      filtered.push(clonedItem);
    }

    filtered.sort((a, b) => {
      const getRank = (nav: NavItem) => (nav.admin ? 2 : nav.leader ? 1 : 0);
      return getRank(a) - getRank(b);
    });

    return filtered;
  };

  const visibleNavigation = filterNavItems(
    navigation as NavItem[],
    isAdmin,
    isLeader,
  );
  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="border-b p-6">
        <h1 className="text-blue-600">HRAMS</h1>
        <p className="text-sm text-gray-600 mt-1">인사 성과 관리 시스템</p>
      </div>
      <nav className="min-w-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-4">
        {visibleNavigation
          .filter((item) => !item.detailPage)
          .map((item) => (
            <NavItemComponent
              key={item.id}
              item={item}
              pathname={location.pathname}
              search={location.search}
              navigate={navigate}
              setSidebarOpen={setSidebarOpen}
            />
          ))}
      </nav>

      <div className="p-4 border-t space-y-3">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
          <p className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
            {currentUser?.koreanName?.charAt(0)}
          </p>
          <div className="flex-1 min-w-0">
            <div className="truncate">{currentUser?.koreanName}</div>
            <div className="text-sm text-gray-600 truncate">
              {currentUser?.email}
            </div>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full flex items-center gap-2 text-gray-700 hover:text-red-600 hover:border-red-600"
        >
          <LogOut className="w-4 h-4" />
          <span>로그아웃</span>
        </Button>
      </div>
    </div>
  );
}
