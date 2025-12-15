import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useState } from "react";

export default function AuthenticatedLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className='flex h-screen bg-gray-50'>
      <aside className='hidden lg:flex w-64 bg-white border-r flex-col'>
        <Sidebar setSidebarOpen={setSidebarOpen} />
      </aside>

      {/* Mobile Sidebar */}

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side='left' className='w-64 p-0'>
          <Sidebar setSidebarOpen={setSidebarOpen} />
        </SheetContent>
      </Sheet>
      {/* Mobile Sidebar */}

      <div className='flex-1 flex flex-col overflow-hidden'>
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className='flex-1 overflow-auto'>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
