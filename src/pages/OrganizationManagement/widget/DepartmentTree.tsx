import { Tree, type NodeModel } from "@minoru/react-dnd-treeview";
import { useDrop } from "react-dnd";

import {
  Edit,
  Trash2,
  Building2,
  ChevronDown,
  // ChevronRight,
  GripVertical,
  Flag,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function DepartmentTree({
  treeData,
  setTreeData,
  onEdit,
  onDelete,
  onDropUser,
  selectedDepartmentId,
  onSelectDepartment,
}: {
  treeData: DepartmentTreeData[];
  setTreeData: (treeData: DepartmentTreeData[]) => void;
  onEdit: (dept: DepartmentTreeData) => void;
  onDelete: (id: string) => void;
  onDropUser: (userId: string, targetDeptId: string) => void;
  selectedDepartmentId: string | null;
  onSelectDepartment: (id: string | null) => void;
}) {
  const handleDrop = (newTreeData: NodeModel<DepartmentTreeData>[]) =>
    setTreeData(newTreeData as unknown as DepartmentTreeData[]);

  return (
    <Tree
      tree={treeData as unknown as NodeModel<DepartmentTreeData>[]}
      rootId={"0"}
      insertDroppableFirst={false}
      sort={false}
      dropTargetOffset={5}
      canDrop={(_, { dragSource, dropTargetId }) => {
        if (dragSource?.parent === dropTargetId) {
          return true;
        }
      }}
      onDrop={handleDrop}
      dragPreviewRender={(monitorProps) => (
        <div className='p-2 bg-blue-100 rounded opacity-50'>
          <Building2 className='w-5 h-5 text-blue-600' />
          <span className='font-medium text-red-500'>
            {monitorProps.item.text}
          </span>
        </div>
      )}
      placeholderRender={(_, { depth }) => (
        <div
          className='relative bg-blue-500 h-0.5 right-0 transform -translate-y-1/2 top-0'
          style={{
            left: `${depth * 40}px`,
          }}></div>
      )}
      render={(node, { depth, isOpen, onToggle, hasChild, isDropTarget }) => (
        <DraggableDepartmentItem
          node={node as unknown as NodeModel<Department>}
          depth={depth}
          isDropTarget={isDropTarget}
          onToggle={onToggle}
          isOpen={isOpen}
          hasChild={hasChild}
          onEdit={onEdit}
          onDelete={onDelete}
          onDropUser={onDropUser}
          isSelected={selectedDepartmentId === node.id.toString()}
          onSelect={() => {
            const deptId = node.id.toString();
            onSelectDepartment(selectedDepartmentId === deptId ? null : deptId);
          }}
        />
      )}
      classes={{
        root: "box-border h-full py-8 overflow-x-auto overflow-y-hidden",
        draggingSource: "opacity-30",
        dropTarget: "bg-blue-50/50",
      }}
    />
  );
}

// Draggable Department Item Component
interface DraggableDepartmentItemProps {
  node: NodeModel<Department>;
  onToggle: (id: string) => void;
  isOpen: boolean;
  isDropTarget: boolean;
  depth: number;
  hasChild: boolean;
  onEdit: (dept: DepartmentTreeData) => void;
  onDelete: (id: string) => void;
  onDropUser: (userId: string, targetDeptId: string) => void;
  isSelected: boolean;
  onSelect: () => void;
}

function DraggableDepartmentItem({
  node,
  onToggle,
  isOpen,
  isDropTarget,
  depth,
  hasChild,
  onEdit,
  onDelete,
  onDropUser,
  isSelected,
  onSelect,
}: DraggableDepartmentItemProps) {
  const leaderName = node.data?.leader?.koreanName || "없음";
  const userCount = node.data?.teamMembers?.length || 0;

  const [{ isOver }, dropRef] = useDrop({
    accept: "USER",
    drop: (item: { user: any }) => {
      onDropUser(item.user, node.id.toString());
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  const indentSize = 24;

  return (
    <div
      ref={dropRef as any}
      className={`relative py-1 transition-all duration-200 group mr-2`}
      style={{ paddingLeft: `${depth * indentSize}px` }}
      onClick={(e) => e.stopPropagation()}>
      {/* Connecting Lines */}
      {depth > 0 && (
        <>
          {/* Vertical Line from parent */}
          <div
            className='absolute left-0 top-0 w-px bg-gray-200 group-last:h-1/2 h-full'
            style={{ left: `${(depth - 1) * indentSize + 20}px` }}
          />
          {/* Horizontal Line to this item */}
          <div
            className='absolute top-1/2 h-px bg-gray-200'
            style={{
              left: `${(depth - 1) * indentSize + 20}px`,
              width: `${indentSize - 20}px`,
            }}
          />
        </>
      )}

      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className={`relative flex items-center gap-2 p-3 border rounded-xl transition-all duration-300 cursor-pointer overflow-hidden ${
          isSelected
            ? "bg-white border-blue-500 shadow-lg shadow-blue-100 ring-1 ring-blue-500"
            : isDropTarget || isOver
              ? "bg-blue-50 border-blue-300 ring-2 ring-blue-100"
              : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-md"
        }`}>
        {/* Item Decorator (Accent Sidebar) */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1 transition-colors ${
            isSelected ? "bg-blue-500" : "bg-gray-100 group-hover:bg-blue-300"
          }`}
        />

        <div className='flex-1 flex items-center gap-3 min-w-0 ml-1'>
          {/* Drag Handle & Toggle */}
          <div className='flex items-center gap-1 shrink-0'>
            <div
              className={`p-1.5 hover:bg-gray-100 rounded-md cursor-grab active:cursor-grabbing text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity`}>
              <GripVertical className='w-3.5 h-3.5' />
            </div>

            {hasChild ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(node.id.toString());
                }}
                className={`p-1 rounded-md hover:bg-gray-100 transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`}>
                <ChevronDown className='w-4 h-4 text-gray-500' />
              </button>
            ) : (
              <div className='w-6' />
            )}
          </div>

          {/* Department Icon */}
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isSelected ? "bg-blue-500 text-white" : "bg-blue-50 text-blue-600"
            }`}>
            <Building2 className='w-5 h-5' />
          </div>

          {/* Info Section */}
          <div className='flex-1 flex flex-col gap-0.5 min-w-0'>
            <div className='flex items-center gap-2'>
              <span className='font-bold text-gray-900 text-[15px] whitespace-nowrap'>
                {node.text}
              </span>
              {depth === 0 && (
                <Badge
                  variant='secondary'
                  className='bg-purple-50 text-purple-700 border-purple-100 text-[10px] py-0 px-2 h-5 font-semibold shrink-0'>
                  본부
                </Badge>
              )}
              {isOver && (
                <Badge className='bg-blue-500 text-white border-none text-[10px] py-0 px-2 h-5 shrink-0 animate-pulse'>
                  배치하기
                </Badge>
              )}
            </div>
            <div className='flex items-center gap-3 text-xs text-gray-400 font-medium'>
              <div className='flex items-center gap-1 shrink-0'>
                <Flag className='w-3 h-3 text-gray-300' />
                <span className={isSelected ? "text-blue-400" : ""}>
                  {leaderName}
                </span>
              </div>
              <div className='flex items-center gap-1 shrink-0'>
                <Users className='w-3 h-3 text-gray-300' />
                <span>{userCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions (Always Visible) */}
        <div className='flex gap-1 shrink-0 p-1'>
          <Button
            variant='outline'
            size='icon'
            className='h-8 w-8 text-gray-600 hover:text-blue-600 hover:bg-blue-50 border-gray-100 shadow-sm'
            onClick={(e) => {
              e.stopPropagation();
              onEdit(node as unknown as DepartmentTreeData);
            }}>
            <Edit className='w-3.5 h-3.5' />
          </Button>
          <Button
            variant='outline'
            size='icon'
            className='h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 border-gray-100 shadow-sm'
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id.toString());
            }}>
            <Trash2 className='w-3.5 h-3.5' />
          </Button>
        </div>
      </div>
    </div>
  );
}
