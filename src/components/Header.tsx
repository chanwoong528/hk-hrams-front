import { Button } from "./ui/button";
import { Sheet, SheetTrigger } from "./ui/sheet";
import { ArrowLeft, Menu } from "lucide-react";
import { navigation } from "@/utils";
import { useLocation, useNavigate } from "react-router";

const BACK_BUTTON_ROUTERS = ["/performance-appraisal/:appraisalId"];

function isDetailRoute(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    // Convert route pattern to regex
    // e.g., "/performance-appraisal/:appraisalId" -> "^\/performance-appraisal\/[^/]+$"
    const regexPattern = pattern
      .split("/")
      .map((segment) => (segment.startsWith(":") ? "[^/]+" : segment))
      .join("\\/");
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(pathname);
  });
}

export default function Header({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const isDetail = isDetailRoute(location.pathname, BACK_BUTTON_ROUTERS);

  return (
    <header className='bg-white border-b px-4 py-3 lg:px-6 lg:py-4'>
      <div className='flex items-center gap-4'>
        {isDetail ? (
          <Button variant='ghost' onClick={() => navigate(-1)}>
            <ArrowLeft className='w-4 h-4 mr-2' />
            뒤로가기
          </Button>
        ) : (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='lg:hidden'
                onClick={() => setSidebarOpen(true)}>
                <Menu className='w-5 h-5' />
              </Button>
            </SheetTrigger>
          </Sheet>
        )}
        <h2 className='text-gray-900'>
          {navigation.find((n) => n.path === location.pathname)?.name}
        </h2>
      </div>
    </header>
  );
}
