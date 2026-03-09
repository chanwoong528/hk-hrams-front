import { useState, useEffect } from "react";
import { MultiBackend, getBackendOptions } from "@minoru/react-dnd-treeview";
import { DndProvider } from "react-dnd";
import DepartmentTreeWidget from "./widget/DepartmentTreeWidget";
import UserListWidget from "./widget/UserListWidget";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function OrganizationManagement() {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <div className='p-4 lg:p-6 h-[calc(100vh-theme(spacing.16))]'>
        <ResizablePanelGroup direction={isMobile ? "vertical" : "horizontal"}>
          {/* Department section on left */}
          <ResizablePanel
            defaultSize={isMobile ? 40 : 35}
            minSize={isMobile ? 25 : 20}
            maxSize={isMobile ? 70 : 60}
            className={`flex flex-col h-full overflow-hidden ${isMobile ? "pb-3" : "pr-3"}`}>
            <DepartmentTreeWidget
              selectedDepartmentId={selectedDepartmentId}
              onSelectDepartment={setSelectedDepartmentId}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* User list section on right */}
          <ResizablePanel
            defaultSize={isMobile ? 60 : 65}
            minSize={isMobile ? 30 : 30}
            className={`flex flex-col h-full overflow-hidden ${isMobile ? "pt-3" : "pl-3"}`}>
            <UserListWidget
              filterDepartmentId={selectedDepartmentId}
              onClearFilter={() => setSelectedDepartmentId(null)}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </DndProvider>
  );
}
