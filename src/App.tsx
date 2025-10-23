// import { useState } from "react";

import Dashboard from "./pages/Dashboard";
import DepartmentManagement from "./pages/DepartmentManagement";
import GoalManagement from "./pages/GoalManagement";
import PerformanceAppraisal from "./pages/PerformanceAppraisal";
import UserManagement from "./pages/UserManagement";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import { Sheet, SheetContent } from "./components/ui/sheet";

function App() {
  return (
    <div className='flex h-screen bg-gray-50'>
      <aside className='hidden lg:flex w-64 bg-white border-r flex-col'>
        <Sidebar
          currentPage='dashboard'
          setCurrentPage={() => {}}
          setSidebarOpen={() => {}}
        />
      </aside>

      {/* Mobile Sidebar */}
      {/* <Sheet open={true} onOpenChange={() => {}}>
        <SheetContent side='left' className='w-64 p-0'>
          <Sidebar
            currentPage='dashboard'
            setCurrentPage={() => {}}
            setSidebarOpen={() => {}}
          />
        </SheetContent>
      </Sheet> */}
      {/* Mobile Sidebar */}

      <div className='flex-1 flex flex-col overflow-hidden'>
        <Header currentPage='dashboard' />
        <main className='flex-1 overflow-auto'>
          <PerformanceAppraisal />
        </main>
      </div>
    </div>
  );
}

export default App;
