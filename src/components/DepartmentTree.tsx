import {
  Tree,
  getBackendOptions,
  MultiBackend,
} from "@minoru/react-dnd-treeview";
import type { NodeModel } from "@minoru/react-dnd-treeview";
import { DndProvider } from "react-dnd";
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
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
// import { GET_departments } from "@/api/department/department";
// import { useQuery } from "@tanstack/react-query";

export default function DepartmentTree({
  treeData,
  setTreeData,
  onEdit,
}: {
  treeData: DepartmentTreeData[];
  setTreeData: (treeData: DepartmentTreeData[]) => void;
  onEdit: (dept: DepartmentTreeData) => void;
}) {
  // const [treeData, setTreeData] = useState<NodeModel<DepartmentTreeData>[]>([]);
  // const { data: departments, isLoading: isLoadingDepartments } = useQuery({
  //   queryKey: ["departments", "flat"],
  //   queryFn: () => GET_departments(),
  //   select: (data) => setTreeData(data.data),
  // });

  const handleDrop = (newTreeData: NodeModel<DepartmentTreeData>[]) =>
    setTreeData(newTreeData as unknown as DepartmentTreeData[]);

  // if (isLoadingDepartments) {
  //   return <div>Loading...</div>;
  // }

  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <Tree
        tree={treeData as unknown as NodeModel<DepartmentTreeData>[]}
        rootId={"0"}
        insertDroppableFirst={false}
        sort={false}
        dropTargetOffset={5}
        canDrop={(tree, { dragSource, dropTargetId }) => {
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
        placeholderRender={(node, { depth }) => (
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
          />
        )}
        classes={{
          root: "box-border h-full py-8",
          draggingSource: "bg-blue-50",
        }}
      />
    </DndProvider>
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
}

function DraggableDepartmentItem({
  node,
  onToggle,
  isOpen,
  isDropTarget,
  depth,
  hasChild,
  onEdit,
}: DraggableDepartmentItemProps) {
  const leaderName = node.data?.leader?.koreanName || "없음";

  return (
    <div
      className={`transition-all duration-200 my-4 `}
      style={{ paddingInlineStart: `${depth * 32}px` }}>
      <div
        className={`flex items-center gap-3 p-4 border rounded-lg hover:shadow-md transition-shadow ${
          isDropTarget ? "bg-blue-50" : "bg-white"
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
            </div>
            <div className='flex items-center gap-4 text-sm text-gray-600 mt-1'>
              <span className='flex items-center gap-1'>
                <Flag className='w-4 h-4' />
                {leaderName}
              </span>
              <span className='flex items-center gap-1'>
                <Users className='w-4 h-4' />
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
              className='text-red-600 hover:text-red-700'
              // onClick={() => onDelete(node.id.toString())}
            >
              <Trash2 className='w-4 h-4' />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
