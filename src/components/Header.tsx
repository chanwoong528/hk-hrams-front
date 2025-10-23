import { Button } from "./ui/button";
import { Sheet, SheetTrigger } from "./ui/sheet";
import { Menu } from "lucide-react";
import { navigation } from "@/utils";
import { useLocation } from "react-router";

export default function Header({
  sidebarOpen,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}) {
  const location = useLocation();
  return (
    <header className='bg-white border-b px-4 py-3 lg:px-6 lg:py-4'>
      <div className='flex items-center gap-4'>
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
        <h2 className='text-gray-900'>
          {navigation.find((n) => n.path === location.pathname)?.name}
        </h2>
      </div>
    </header>
  );
}
