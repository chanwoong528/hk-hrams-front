import { useState } from "react";
import { navigation } from "@/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, ChevronDown, ChevronRight } from "lucide-react";
import { useCurrentUserStore } from "@/store/currentUserStore";

type NavItem = {
  id: string;
  name: string;
  icon?: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: NavItem[];
  detailPage?: boolean;
};

function isPathMatch(pathname: string, pattern?: string): boolean {
  // Exact match
  if (!pattern) return false;
  
  if (pathname === pattern) return true;

  // Convert route pattern to regex
  // e.g., "/performance-appraisal/:appraisalId" -> "^\/performance-appraisal\/[^/]+$"
  const regexPattern = pattern
    .split("/")
    .map((segment) => (segment.startsWith(":") ? "[^/]+" : segment))
    .join("\\/");
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(pathname);
}

function isRouteActive(pathname: string, item: NavItem): boolean {
  // Check if current path matches this item
  if (isPathMatch(pathname, item.path)) return true;

  // Check if any child route matches
  if (item.children) {
    return item.children.some((child) => isRouteActive(pathname, child));
  }

  return false;
}

function NavItemComponent({
  item,
  pathname,
  navigate,
  setSidebarOpen,
  level = 0,
}: {
  item: NavItem;
  pathname: string;
  navigate: (path: string) => void;
  setSidebarOpen: (open: boolean) => void;
  level?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(() => {
    // Auto-expand if any child is active
    if (item.children) {
      return item.children.some((child) => isRouteActive(pathname, child));
    }
    return false;
  });

  const isActive = isRouteActive(pathname, item);
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;
  const isChildActive =
    hasChildren &&
    item.children!.some((child) => isRouteActive(pathname, child));

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
    <div>
      <div className='flex items-center gap-1'>
        <button
          onClick={handleItemClick}
          className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
            isActive && !hasChildren
              ? "bg-blue-600 text-white"
              : isChildActive || (isActive && hasChildren)
              ? "bg-blue-50 text-blue-700"
              : "text-gray-700 hover:bg-gray-100"
          }`}
          style={{ paddingLeft: `${1 + level * 1}rem` }}>
          {Icon ? <Icon className='w-5 h-5' /> : <div className='w-5 h-5' />}
          <span className='font-medium'>{item.name}</span>
        </button>
        {hasChildren && (
          <button
            onClick={handleChevronClick}
            className='p-2 rounded-lg transition-colors cursor-pointer hover:bg-gray-100 flex items-center justify-center'>
            {isExpanded ? (
              <ChevronDown className='w-4 h-4' />
            ) : (
              <ChevronRight className='w-4 h-4' />
            )}
          </button>
        )}
      </div>
      {hasChildren && isExpanded && (
        <div className='ml-4 space-y-1 mt-1'>
          {item.children!.map((child) => (
            <NavItemComponent
              key={child.id}
              item={child}
              pathname={pathname}
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
  const { currentUser, clearAccessToken, clearRefreshToken } =
    useCurrentUserStore();

  const handleLogout = () => {
    clearAccessToken();
    clearRefreshToken();
    navigate("/login");
  };
  return (
    <div className='flex h-full flex-col'>
      <div className='p-6 border-b'>
        <h1 className='text-blue-600'>HRAMS</h1>
        <p className='text-sm text-gray-600 mt-1'>인사 성과 관리 시스템</p>
      </div>
      <nav className='flex-1 p-4 space-y-1 overflow-y-auto'>
        {navigation
          .filter((item) => !item.detailPage)
          .map((item) => (
            <NavItemComponent
              key={item.id}
              item={item as NavItem}
              pathname={location.pathname}
              navigate={navigate}
              setSidebarOpen={setSidebarOpen}
            />
          ))}
      </nav>

      <div className='p-4 border-t space-y-3'>
        <div className='flex items-center gap-3 p-3 rounded-lg bg-gray-50'>
          <div className='w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white'>
            {currentUser?.koreanName?.charAt(0)}
          </div>
          <div className='flex-1 min-w-0'>
            <div className='truncate'>{currentUser?.koreanName}</div>
            <div className='text-sm text-gray-600 truncate'>
              {currentUser?.email}
            </div>
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant='outline'
          className='w-full flex items-center gap-2 text-gray-700 hover:text-red-600 hover:border-red-600'>
          <LogOut className='w-4 h-4' />
          <span>로그아웃</span>
        </Button>
      </div>
    </div>
  );
}
