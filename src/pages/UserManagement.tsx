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
import { GET_usersByPagination } from "@/api/user/user";
import { useQuery } from "@tanstack/react-query";

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", searchQuery],
    queryFn: () => GET_usersByPagination(1, 10),
    select: (data) => {
      console.log("@@@ ", data);
      return {
        users: data.data.list,
        total: data.data.total,
      };
    },
  });
  console.log(usersData);

  const [formData, setFormData] = useState({
    koreanName: "",
    email: "",
    departments: [],
    status: "active" as "active" | "inactive",
  });

  const handleAddUser = () => {
    toast.success("사용자가 추가되었습니다");
  };

  const handleEditUser = (user: User) => {
    // setFormData({
    //   koreanName: user.koreanName,
    //   email: user.email,
    //   departments: user.departments || [],
    //   status: user.status,
    // });
  };

  const handleUpdateUser = () => {
    if (selectedUser) {
      // setFormData({
      //   koreanName: "",
      //   email: "",
      //   department: "",
      //   status: "active",
      // });
      toast.success("사용자 정보가 업데이트되었습니다");
    }
  };

  const handleDeleteUser = (userId: string) => {
    toast.success("사용자가 삭제되었습니다");
  };

  if (isLoadingUsers) {
    return <div>Loading...</div>;
  }

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
        {/* <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
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
        </Dialog> */}
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
          <CardTitle>사용자 목록 ({usersData?.total})</CardTitle>
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
                {usersData?.users.map((user: User) => (
                  <TableRow key={user.userId}>
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
                      {/* <div className='flex gap-1 flex-wrap'>
                        {user.departments.map((dept, idx) => (
                          <Badge key={idx} variant='secondary'>
                            {dept}
                          </Badge>
                        ))}
                      </div> */}
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
                      {user.created}
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
                            onClick={() => handleDeleteUser(user.userId)}
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
              {/* <Select
                value={formData.departments}
                onValueChange={(value) =>
                  setFormData({ ...formData, departments: value })
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
              </Select> */}
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
