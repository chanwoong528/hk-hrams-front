import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";

export default function AuthenticatedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className='flex h-screen bg-gray-50 print:h-auto print:min-h-0 print:bg-white'>
      <aside className='hidden min-w-0 w-64 shrink-0 flex-col border-r bg-white lg:flex print:hidden'>
        <Sidebar setSidebarOpen={setSidebarOpen} />
      </aside>

      {/* Mobile Sidebar */}

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side='left' className='w-64 min-w-0 p-0 print:hidden'>
          <Sidebar setSidebarOpen={setSidebarOpen} />
        </SheetContent>
      </Sheet>
      {/* Mobile Sidebar */}

      <div className='flex-1 flex flex-col overflow-hidden print:overflow-visible'>
        <div className='print:hidden'>
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </div>
        <main className='flex-1 overflow-auto print:overflow-visible print:flex-none'>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
