import { useState } from "react";
import { Building2, Plus, Users, GripVertical } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import DepartmentTree from "@/components/DepartmentTree";

// Department Tree Component

// Main Department Management Component
export default function DepartmentManagement() {
  // State
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(
    new Set(["1"]),
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    leader: "",
    parentId: "",
  });

  // Drag and Drop Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  // Department Data
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: "1",
      name: "본사",
      leader: "김민준",
      memberCount: 248,
      parentId: null,
      children: [
        {
          id: "2",
          name: "영업본부",
          leader: "이서연",
          memberCount: 45,
          parentId: "1",
          children: [
            {
              id: "3",
              name: "영업1팀",
              leader: "박지훈",
              memberCount: 22,
              parentId: "2",
            },
            {
              id: "4",
              name: "영업2팀",
              leader: "최유진",
              memberCount: 23,
              parentId: "2",
            },
          ],
        },
        {
          id: "5",
          name: "기술본부",
          leader: "정다은",
          memberCount: 78,
          parentId: "1",
          children: [
            {
              id: "6",
              name: "개발팀",
              leader: "강호민",
              memberCount: 35,
              parentId: "5",
            },
            {
              id: "7",
              name: "QA팀",
              leader: "윤서준",
              memberCount: 18,
              parentId: "5",
            },
            {
              id: "8",
              name: "DevOps팀",
              leader: "임지우",
              memberCount: 25,
              parentId: "5",
            },
          ],
        },
        {
          id: "9",
          name: "마케팅본부",
          leader: "한지민",
          memberCount: 32,
          parentId: "1",
          children: [
            {
              id: "10",
              name: "디지털마케팅팀",
              leader: "오준서",
              memberCount: 18,
              parentId: "9",
            },
            {
              id: "11",
              name: "브랜드팀",
              leader: "서하윤",
              memberCount: 14,
              parentId: "9",
            },
          ],
        },
        {
          id: "12",
          name: "경영지원본부",
          leader: "양민석",
          memberCount: 35,
          parentId: "1",
          children: [
            {
              id: "13",
              name: "인사팀",
              leader: "조서영",
              memberCount: 12,
              parentId: "12",
            },
            {
              id: "14",
              name: "재무팀",
              leader: "신유진",
              memberCount: 15,
              parentId: "12",
            },
            {
              id: "15",
              name: "총무팀",
              leader: "문준호",
              memberCount: 8,
              parentId: "12",
            },
          ],
        },
      ],
    },
  ]);

  // Helper Functions
  const findDepartmentById = (
    depts: Department[],
    id: string,
  ): Department | null => {
    for (const dept of depts) {
      if (dept.id === id) return dept;
      if (dept.children) {
        const found = findDepartmentById(dept.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const toggleExpand = (deptId: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepts(newExpanded);
  };

  // Drag and Drop Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = () => {
    // Optional: Add visual feedback during drag over
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    // Move department
    moveDepartment(active.id as string, over.id as string);
    setActiveId(null);
  };

  // Move Department Logic
  const moveDepartment = (activeId: string, overId: string) => {
    if (activeId === overId) return;

    const activeDept = findDepartmentById(departments, activeId);
    if (!activeDept) return;

    // Prevent moving a department into its own children
    if (isDescendant(activeDept, overId)) {
      toast.error("부서를 자신의 하위 부서로 이동할 수 없습니다");
      return;
    }

    setDepartments((prev) => {
      const newDepartments = JSON.parse(JSON.stringify(prev));

      // Remove from current position
      const removeFromTree = (depts: Department[]): Department[] => {
        return depts.filter((dept) => {
          if (dept.id === activeId) return false;
          if (dept.children) {
            dept.children = removeFromTree(dept.children);
          }
          return true;
        });
      };

      // Add to new position
      const addToTree = (depts: Department[]): Department[] => {
        return depts.map((dept) => {
          if (dept.id === overId) {
            return {
              ...dept,
              children: [
                ...(dept.children || []),
                { ...activeDept, parentId: overId },
              ],
            };
          }
          if (dept.children) {
            return {
              ...dept,
              children: addToTree(dept.children),
            };
          }
          return dept;
        });
      };

      const afterRemoval = removeFromTree(newDepartments);
      const afterAddition = addToTree(afterRemoval);

      return afterAddition;
    });

    toast.success("부서가 이동되었습니다");
  };

  // Check if target is descendant of active department
  const isDescendant = (ancestor: Department, targetId: string): boolean => {
    if (!ancestor.children) return false;

    for (const child of ancestor.children) {
      if (child.id === targetId) return true;
      if (isDescendant(child, targetId)) return true;
    }
    return false;
  };

  // Event Handlers
  const handleAddDepartment = () => {
    toast.success("부서가 추가되었습니다");
    setIsAddDialogOpen(false);
    setFormData({ name: "", leader: "", parentId: "" });
  };

  const handleUpdateDepartment = () => {
    toast.success("부서 정보가 업데이트되었습니다");
    setSelectedDept(null);
    setFormData({ name: "", leader: "", parentId: "" });
  };

  const handleEdit = (dept: Department) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      leader: dept.leader,
      parentId: dept.parentId || "",
    });
  };

  const handleDelete = () => {
    toast.success("부서가 삭제되었습니다");
  };

  return (
    <div className='p-4 lg:p-6 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row gap-4 justify-between'>
        <div>
          <h2 className='text-gray-900'>부서 관리</h2>
          <p className='text-gray-600 mt-1'>조직 구조를 관리합니다</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className='bg-blue-600 hover:bg-blue-700'>
              <Plus className='w-4 h-4 mr-2' />
              부서 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 부서 추가</DialogTitle>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label>부서명</Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='예: 개발팀'
                />
              </div>
              <div className='space-y-2'>
                <Label>리더</Label>
                <Input
                  value={formData.leader}
                  onChange={(e) =>
                    setFormData({ ...formData, leader: e.target.value })
                  }
                  placeholder='부서 리더 이름'
                />
              </div>
              <div className='space-y-2'>
                <Label>상위 부서</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parentId: value })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder='상위 부서 선택' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='1'>본사</SelectItem>
                    <SelectItem value='2'>영업본부</SelectItem>
                    <SelectItem value='5'>기술본부</SelectItem>
                    <SelectItem value='9'>마케팅본부</SelectItem>
                    <SelectItem value='12'>경영지원본부</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsAddDialogOpen(false)}>
                취소
              </Button>
              <Button
                className='bg-blue-600 hover:bg-blue-700'
                onClick={handleAddDepartment}>
                추가
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Department Statistics */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>전체 부서</p>
                <h3 className='mt-2'>15개</h3>
              </div>
              <div className='w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center'>
                <Building2 className='w-6 h-6 text-blue-600' />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>전체 직원</p>
                <h3 className='mt-2'>248명</h3>
              </div>
              <div className='w-12 h-12 rounded-full bg-green-100 flex items-center justify-center'>
                <Users className='w-6 h-6 text-green-600' />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>평균 부서 인원</p>
                <h3 className='mt-2'>16.5명</h3>
              </div>
              <div className='w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center'>
                <Users className='w-6 h-6 text-orange-600' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Tree */}

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            조직도
            <div className='flex items-center gap-2'>
              <Button variant='outline' onClick={() => setSelectedDept(null)}>
                저장
              </Button>
              <Button variant='outline' onClick={() => setSelectedDept(null)}>
                취소
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentTree />
        </CardContent>
      </Card>

      {/* Edit Department Dialog */}
      <Dialog
        open={selectedDept !== null}
        onOpenChange={(open) => !open && setSelectedDept(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>부서 수정</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>부서명</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>리더</Label>
              <Input
                value={formData.leader}
                onChange={(e) =>
                  setFormData({ ...formData, leader: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>상위 부서</Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) =>
                  setFormData({ ...formData, parentId: value })
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='1'>본사</SelectItem>
                  <SelectItem value='2'>영업본부</SelectItem>
                  <SelectItem value='5'>기술본부</SelectItem>
                  <SelectItem value='9'>마케팅본부</SelectItem>
                  <SelectItem value='12'>경영지원본부</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setSelectedDept(null)}>
              취소
            </Button>
            <Button
              className='bg-blue-600 hover:bg-blue-700'
              onClick={handleUpdateDepartment}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
