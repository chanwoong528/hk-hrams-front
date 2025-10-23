import { Button } from "./ui/button";
import { Sheet, SheetTrigger } from "./ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import { navigation, type Page } from "@/utils";

export default function Header({ currentPage }: { currentPage: Page }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header className='bg-white border-b px-4 py-3 lg:px-6 lg:py-4'>
      <div className='flex items-center gap-4'>
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant='ghost' size='icon' className='lg:hidden'>
              <Menu className='w-5 h-5' />
            </Button>
          </SheetTrigger>
        </Sheet>
        <h2 className='text-gray-900'>
          {navigation.find((n) => n.id === currentPage)?.name}
        </h2>
      </div>
    </header>
  );
}
