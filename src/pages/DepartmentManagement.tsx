import { useState } from "react";
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Users,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

interface Department {
  id: string;
  name: string;
  leader: string;
  memberCount: number;
  parentId: string | null;
  children?: Department[];
}

export default function DepartmentManagement() {
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(
    new Set(["1"]),
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

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

  const [formData, setFormData] = useState({
    name: "",
    leader: "",
    parentId: "",
  });

  const toggleExpand = (deptId: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepts(newExpanded);
  };

  const renderDepartment = (dept: Department, level: number = 0) => {
    const hasChildren = dept.children && dept.children.length > 0;
    const isExpanded = expandedDepts.has(dept.id);

    return (
      <div key={dept.id} className='mb-2'>
        <div
          className='flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow'
          style={{ marginLeft: `${level * 32}px` }}>
          <div className='flex-1 flex items-center gap-3'>
            {hasChildren ? (
              <button
                onClick={() => toggleExpand(dept.id)}
                className='text-gray-400 hover:text-gray-600'>
                {isExpanded ? (
                  <ChevronDown className='w-5 h-5' />
                ) : (
                  <ChevronRight className='w-5 h-5' />
                )}
              </button>
            ) : (
              <div className='w-5' />
            )}

            <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
              <Building2 className='w-5 h-5 text-blue-600' />
            </div>

            <div className='flex-1'>
              <div className='flex items-center gap-2'>
                <h3 className='text-gray-900'>{dept.name}</h3>
                {level === 0 && (
                  <Badge className='bg-purple-100 text-purple-700'>본부</Badge>
                )}
              </div>
              <div className='flex items-center gap-4 text-sm text-gray-600 mt-1'>
                <span>리더: {dept.leader}</span>
                <span className='flex items-center gap-1'>
                  <Users className='w-4 h-4' />
                  {dept.memberCount}명
                </span>
              </div>
            </div>
          </div>

          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                setSelectedDept(dept);
                setFormData({
                  name: dept.name,
                  leader: dept.leader,
                  parentId: dept.parentId || "",
                });
              }}>
              <Edit className='w-4 h-4' />
            </Button>
            {level > 0 && (
              <Button
                variant='outline'
                size='sm'
                className='text-red-600 hover:text-red-700'>
                <Trash2 className='w-4 h-4' />
              </Button>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className='mt-2'>
            {dept.children!.map((child) => renderDepartment(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

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
          <CardTitle>조직도</CardTitle>
        </CardHeader>
        <CardContent>
          {departments.map((dept) => renderDepartment(dept))}
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
