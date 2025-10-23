import { useState } from "react";
import { Search, Plus, Edit, Trash2, Filter, MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface User {
  id: string;
  koreanName: string;
  email: string;
  departments: string[];
  status: "active" | "inactive";
  createdAt: string;
}

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [users, setUsers] = useState<User[]>([
    {
      id: "1",
      koreanName: "김민준",
      email: "kim.minjun@company.com",
      departments: ["영업팀"],
      status: "active",
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      koreanName: "이서연",
      email: "lee.seoyeon@company.com",
      departments: ["마케팅팀"],
      status: "active",
      createdAt: "2024-01-20",
    },
    {
      id: "3",
      koreanName: "박지훈",
      email: "park.jihun@company.com",
      departments: ["기술팀", "R&D팀"],
      status: "active",
      createdAt: "2024-02-01",
    },
    {
      id: "4",
      koreanName: "최유진",
      email: "choi.yujin@company.com",
      departments: ["인사팀"],
      status: "active",
      createdAt: "2024-02-10",
    },
    {
      id: "5",
      koreanName: "정다은",
      email: "jung.daeun@company.com",
      departments: ["재무팀"],
      status: "active",
      createdAt: "2024-02-15",
    },
    {
      id: "6",
      koreanName: "강호민",
      email: "kang.homin@company.com",
      departments: ["영업팀"],
      status: "inactive",
      createdAt: "2024-03-01",
    },
    {
      id: "7",
      koreanName: "윤서준",
      email: "yoon.seojun@company.com",
      departments: ["마케팅팀"],
      status: "active",
      createdAt: "2024-03-10",
    },
    {
      id: "8",
      koreanName: "임지우",
      email: "lim.jiwoo@company.com",
      departments: ["기술팀"],
      status: "active",
      createdAt: "2024-03-15",
    },
  ]);

  const [formData, setFormData] = useState({
    koreanName: "",
    email: "",
    department: "",
    status: "active" as "active" | "inactive",
  });

  const filteredUsers = users.filter(
    (user) =>
      user.koreanName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.departments.some((d) =>
        d.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  const handleAddUser = () => {
    const newUser: User = {
      id: String(users.length + 1),
      koreanName: formData.koreanName,
      email: formData.email,
      departments: formData.department ? [formData.department] : [],
      status: formData.status,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setUsers([...users, newUser]);
    setIsAddDialogOpen(false);
    setFormData({
      koreanName: "",
      email: "",
      department: "",
      status: "active",
    });
    toast.success("사용자가 추가되었습니다");
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      koreanName: user.koreanName,
      email: user.email,
      department: user.departments[0] || "",
      status: user.status,
    });
  };

  const handleUpdateUser = () => {
    if (selectedUser) {
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                ...formData,
                departments: formData.department ? [formData.department] : [],
              }
            : u,
        ),
      );
      setSelectedUser(null);
      setFormData({
        koreanName: "",
        email: "",
        department: "",
        status: "active",
      });
      toast.success("사용자 정보가 업데이트되었습니다");
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter((u) => u.id !== userId));
    toast.success("사용자가 삭제되었습니다");
  };

  return (
    <div className='p-4 lg:p-6 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row gap-4 justify-between'>
        <div>
          <h2 className='text-gray-900'>사용자 관리</h2>
          <p className='text-gray-600 mt-1'>
            시스템의 모든 사용자를 관리합니다
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className='bg-blue-600 hover:bg-blue-700'>
              <Plus className='w-4 h-4 mr-2' />
              사용자 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 사용자 추가</DialogTitle>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label>한글 이름</Label>
                <Input
                  value={formData.koreanName}
                  onChange={(e) =>
                    setFormData({ ...formData, koreanName: e.target.value })
                  }
                  placeholder='홍길동'
                />
              </div>
              <div className='space-y-2'>
                <Label>이메일</Label>
                <Input
                  type='email'
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder='user@company.com'
                />
              </div>
              <div className='space-y-2'>
                <Label>부서</Label>
                <Select
                  value={formData.department}
                  onValueChange={(value) =>
                    setFormData({ ...formData, department: value })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder='부서 선택' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='영업팀'>영업팀</SelectItem>
                    <SelectItem value='마케팅팀'>마케팅팀</SelectItem>
                    <SelectItem value='기술팀'>기술팀</SelectItem>
                    <SelectItem value='인사팀'>인사팀</SelectItem>
                    <SelectItem value='재무팀'>재무팀</SelectItem>
                    <SelectItem value='R&D팀'>R&D팀</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>상태</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") =>
                    setFormData({ ...formData, status: value })
                  }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='active'>활성</SelectItem>
                    <SelectItem value='inactive'>비활성</SelectItem>
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
                onClick={handleAddUser}>
                추가
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-col sm:flex-row gap-3'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                placeholder='이름, 이메일, 부서로 검색...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>
            <Button variant='outline'>
              <Filter className='w-4 h-4 mr-2' />
              필터
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>사용자 목록 ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>한글 이름</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>부서</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead className='text-right'>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600'>
                          {user.koreanName.charAt(0)}
                        </div>
                        <span>{user.koreanName}</span>
                      </div>
                    </TableCell>
                    <TableCell className='text-gray-600'>
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-1 flex-wrap'>
                        {user.departments.map((dept, idx) => (
                          <Badge key={idx} variant='secondary'>
                            {dept}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.status === "active" ? "default" : "secondary"
                        }
                        className={
                          user.status === "active"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : ""
                        }>
                        {user.status === "active" ? "활성" : "비활성"}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-gray-600'>
                      {user.createdAt}
                    </TableCell>
                    <TableCell className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='icon'>
                            <MoreVertical className='w-4 h-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => handleEditUser(user)}>
                            <Edit className='w-4 h-4 mr-2' />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user.id)}
                            className='text-red-600'>
                            <Trash2 className='w-4 h-4 mr-2' />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog
        open={selectedUser !== null}
        onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 수정</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label>한글 이름</Label>
              <Input
                value={formData.koreanName}
                onChange={(e) =>
                  setFormData({ ...formData, koreanName: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>이메일</Label>
              <Input
                type='email'
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label>부서</Label>
              <Select
                value={formData.department}
                onValueChange={(value) =>
                  setFormData({ ...formData, department: value })
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='영업팀'>영업팀</SelectItem>
                  <SelectItem value='마케팅팀'>마케팅팀</SelectItem>
                  <SelectItem value='기술팀'>기술팀</SelectItem>
                  <SelectItem value='인사팀'>인사팀</SelectItem>
                  <SelectItem value='재무팀'>재무팀</SelectItem>
                  <SelectItem value='R&D팀'>R&D팀</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>상태</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "active" | "inactive") =>
                  setFormData({ ...formData, status: value })
                }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='active'>활성</SelectItem>
                  <SelectItem value='inactive'>비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setSelectedUser(null)}>
              취소
            </Button>
            <Button
              className='bg-blue-600 hover:bg-blue-700'
              onClick={handleUpdateUser}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
