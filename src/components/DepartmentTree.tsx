import { useState } from "react";
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
  Users,
  Building2,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

// import { useDraggable, useDroppable } from "@dnd-kit/core";
// import {
//   Building2,
//   Edit,
//   Trash2,
//   Users,
//   ChevronRight,
//   ChevronDown,
//   GripVertical,
// } from "lucide-react";
// import { Button } from "./ui/button";
// import { Badge } from "./ui/badge";

// interface DepartmentTreeProps {
//   departments: Department[];
//   expandedDepts: Set<string>;
//   onToggleExpand: (id: string) => void;
//   onEdit: (dept: Department) => void;
//   onDelete: (id: string) => void;
// }

export default function DepartmentTree() {
  const [treeData, setTreeData] = useState<
    NodeModel<{ name: string; color: string }>[]
  >([
    {
      id: 1,
      parent: 0,
      droppable: true,
      text: "A",
      data: {
        name: "A",
        color: "red",
      },
    },
    {
      id: 2,
      parent: 1,
      droppable: true,
      text: "B",
      data: {
        name: "B",
        color: "green",
      },
    },
    {
      id: 3,
      parent: 1,
      droppable: true,
      text: "C",
      data: {
        name: "C",
        color: "blue",
      },
    },
    {
      id: 4,
      parent: 0,
      droppable: true,
      text: "D",
      data: {
        name: "D",
        color: "yellow",
      },
    },
    {
      id: "5",
      parent: 4,
      droppable: true,
      text: "E",
      data: {
        name: "E",
        color: "purple",
      },
    },
    {
      id: "6",
      parent: "5",
      droppable: true,
      text: "F",
      data: {
        name: "F",
        color: "orange",
      },
    },
  ]);
  const handleDrop = (
    newTreeData: NodeModel<{ name: string; color: string }>[],
  ) => setTreeData(newTreeData);

  const handleEdit = (node: NodeModel<{ name: string; color: string }>) => {
    console.log(node);
  };

  return (
    <DndProvider backend={MultiBackend} options={getBackendOptions()}>
      <Tree
        tree={treeData}
        rootId={
          0
          // treeData[0].id
        }
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
            node={node}
            depth={depth}
            isDropTarget={isDropTarget}
            onToggle={onToggle}
            isOpen={isOpen}
            hasChild={hasChild}
            onEdit={handleEdit}
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
  node: NodeModel<{ name: string; color: string }>;
  onToggle: (id: string) => void;
  isOpen: boolean;
  isDropTarget: boolean;
  depth: number;
  hasChild: boolean;
  onEdit: (node: NodeModel<{ name: string; color: string }>) => void;
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
              {/* <span>리더: {node.leader}</span> */}
              <span className='flex items-center gap-1'>
                <Users className='w-4 h-4' />
                {/* {depth.memberCount}명 */}
              </span>
            </div>
          </div>
        </div>

        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={() => onEdit(node)}>
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
