import { Tree, type NodeModel } from "@minoru/react-dnd-treeview";
import { useDrop } from "react-dnd";

import {
  Edit,
  Trash2,
  Building2,
  ChevronDown,
  ChevronRight,
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
  onDropUser,
  selectedDepartmentId,
  onSelectDepartment,
}: {
  treeData: DepartmentTreeData[];
  setTreeData: (treeData: DepartmentTreeData[]) => void;
  onEdit: (dept: DepartmentTreeData) => void;
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
          onDropUser={onDropUser}
          isSelected={selectedDepartmentId === node.id.toString()}
          onSelect={() => {
            const deptId = node.id.toString();
            onSelectDepartment(selectedDepartmentId === deptId ? null : deptId);
          }}
        />
      )}
      classes={{
        root: "box-border h-full py-8",
        draggingSource: "bg-blue-50",
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

  return (
    <div
      ref={dropRef as any}
      className={`transition-all duration-200 my-4 `}
      style={{ paddingInlineStart: `${depth * 32}px` }}>
      <div
        onClick={onSelect}
        className={`flex items-center gap-3 p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer ${
          isSelected
            ? "bg-blue-50 border-blue-400 ring-2 ring-blue-200"
            : isDropTarget || isOver
              ? "bg-blue-50 border-blue-300"
              : "bg-white"
        }`}>
        <div className='flex-1 flex items-center gap-3 '>
          {/* Drag Handle */}
          <div
            className={`cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded `}>
            <GripVertical className='w-4 h-4 text-gray-400' />
          </div>

          {hasChild ? (
            <button
              onClick={() => onToggle(node.id.toString())}
              className='text-gray-400 hover:text-gray-600'>
              {isOpen ? (
                <ChevronDown className='w-5 h-5 text-gray-600' />
              ) : (
                <ChevronRight className='w-5 h-5 text-gray-600' />
              )}
            </button>
          ) : (
            <div className='w-5' />
          )}

          <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
            <Building2 className={`w-5 h-5 text-blue-600`} />
          </div>

          <div className='flex-1'>
            <div className='flex items-center gap-2'>
              <h3 className={`text-gray-900`}>{node.text}</h3>
              {depth === 0 && (
                <Badge className='bg-purple-100 text-purple-700'>본부</Badge>
              )}
              {isOver && (
                <Badge className='bg-blue-100 text-blue-700 animate-pulse'>
                  배치하기
                </Badge>
              )}
            </div>
            <div className='flex items-center gap-4 text-sm text-gray-600 mt-1'>
              <span className='flex items-center gap-1'>
                <Flag className='w-4 h-4' />
                {leaderName}
              </span>
              <span className='flex items-center gap-1'>
                <Users className='w-4 h-4' />
                {userCount}
              </span>
            </div>
          </div>
        </div>

        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => onEdit(node as unknown as DepartmentTreeData)}>
            <Edit className='w-4 h-4' />
          </Button>
          {depth > 0 && (
            <Button
              variant='outline'
              size='sm'
              className='text-red-600 hover:text-red-700'>
              <Trash2 className='w-4 h-4' />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
