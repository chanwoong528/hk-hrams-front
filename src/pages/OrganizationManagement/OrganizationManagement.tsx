import { useState } from "react";
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

  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <div className='p-4 lg:p-6 h-[calc(100vh-theme(spacing.16))]'>
        <ResizablePanelGroup direction='horizontal'>
          {/* Department section on left */}
          <ResizablePanel
            defaultSize={35}
            minSize={20}
            maxSize={60}
            className='pr-3 flex flex-col h-full overflow-hidden'>
            <DepartmentTreeWidget
              selectedDepartmentId={selectedDepartmentId}
              onSelectDepartment={setSelectedDepartmentId}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* User list section on right */}
          <ResizablePanel
            defaultSize={65}
            minSize={30}
            className='pl-3 flex flex-col h-full overflow-hidden'>
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
