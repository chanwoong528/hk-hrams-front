import { useState } from "react";
import BulkUserAddDialog from "./BulkUserAddDialog";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  MoreVertical,
  GripVertical,
  Users,
} from "lucide-react";
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
import { GET_usersByPagination, PATCH_user, POST_user } from "@/api/user/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DepartmentSelect from "./DepartmentSelect";
import { symmetricDiffBy } from "@/utils";
import { useDebounce } from "@uidotdev/usehooks";

import { TablePagination } from "../../PerformanceAppraisal/AppraisalDetail/widget/TablePagination";
import { useDrag } from "react-dnd";

function DraggableUserRow({
  user,
  onEdit,
}: {
  user: User;
  onEdit: (u: User) => void;
}) {
  const [{ isDragging }, dragRef] = useDrag({
    type: "USER",
    item: { user },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <TableRow
      ref={dragRef as any}
      className={`cursor-grab active:cursor-grabbing ${isDragging ? "opacity-30 bg-gray-50" : ""}`}>
      <TableCell className='w-12 text-center p-0 align-middle'>
        <GripVertical className='w-4 h-4 text-gray-400 mx-auto' />
      </TableCell>
      <TableCell>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0'>
            {user.koreanName.charAt(0)}
          </div>
          <span className='font-medium'>{user.koreanName}</span>
        </div>
      </TableCell>
      <TableCell className='text-gray-600 hidden sm:table-cell'>
        {user.email}
      </TableCell>
      <TableCell>
        <div className='flex gap-1 flex-wrap'>
          {user.departments?.length > 0 ? (
            user.departments.map((dept, idx) => (
              <Badge
                key={idx}
                variant='secondary'
                className='text-xs font-normal'>
                {dept.departmentName}
              </Badge>
            ))
          ) : (
            <span className='text-gray-400 text-sm'>미배정</span>
          )}
        </div>
      </TableCell>
      <TableCell className='hidden md:table-cell'>
        <Badge
          variant={user.userStatus === "active" ? "default" : "secondary"}
          className={
            user.userStatus === "active"
              ? "bg-green-100 text-green-700 hover:bg-green-100 font-normal"
              : "font-normal"
          }>
          {user.userStatus === "active" ? "활성" : "비활성"}
        </Badge>
      </TableCell>
      <TableCell className='text-right'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon'>
              <MoreVertical className='w-4 h-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Edit className='w-4 h-4 mr-2' />
              수정
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {}} className='text-red-600'>
              <Trash2 className='w-4 h-4 mr-2' />
              삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export default function UserListWidget({
  filterDepartmentId,
  onClearFilter,
}: {
  filterDepartmentId: string | null;
  onClearFilter: () => void;
}) {
  const queryClient = useQueryClient();
  const [modalType, setModalType] = useState<"add" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 1000);

  const [pageInfo, setPageInfo] = useState<{
    page: number;
    limit: number;
  }>({
    page: 1,
    limit: 10,
  });

  const [formData, setFormData] = useState<{
    koreanName: string;
    email: string;
    departments: Department[];
    userStatus: "active" | "inactive";
  }>({
    koreanName: "",
    email: "",
    departments: [],
    userStatus: "active",
  });

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: [
      "users",
      debouncedSearchQuery,
      pageInfo.page,
      pageInfo.limit,
      filterDepartmentId,
    ],
    queryFn: () =>
      GET_usersByPagination(
        pageInfo.page,
        pageInfo.limit,
        debouncedSearchQuery,
        filterDepartmentId || undefined,
      ),
    select: (data) => {
      return {
        users: data.data.list,
        total: data.data.total,
      };
    },
  });

  const { mutate: postUser } = useMutation({
    mutationFn: (payload: {
      koreanName: string;
      email: string;
      departments: Department[];
    }) => POST_user(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("사용자가 추가되었습니다");
      setModalType(null);
      setFormData({
        koreanName: "",
        email: "",
        departments: [],
        userStatus: "active",
      });
    },
    onError: () => {
      toast.error("사용자 추가에 실패했습니다");
    },
  });

  const { mutate: patchUser } = useMutation({
    mutationFn: (payload: {
      userId: string;
      koreanName: string;
      email: string;
      tobeDeletedDepartments: string[];
      tobeAddedDepartments: string[];
      userStatus: "active" | "inactive";
    }) => PATCH_user(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("사용자 정보가 업데이트되었습니다");
      setSelectedUser(null);
      setFormData({
        koreanName: "",
        email: "",
        departments: [],
        userStatus: "active",
      });
    },
    onError: () => {
      toast.error("사용자 정보 업데이트에 실패했습니다");
    },
  });

  const handleAddUser = () => {
    postUser({
      koreanName: formData.koreanName,
      email: formData.email,
      departments: formData.departments,
    });
  };

  const handlePageChange = (page: number) => {
    setPageInfo({ ...pageInfo, page });
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      koreanName: user.koreanName,
      email: user.email,
      departments: user.departments || [],
      userStatus: user.userStatus,
    });
  };

  const handleUpdateUser = () => {
    if (selectedUser) {
      const diffs = symmetricDiffBy(
        (selectedUser.departments || []).map((d) => ({ id: d.departmentId })),
        (formData.departments || []).map((d) => ({ id: d.departmentId })),
        (x: { id: string }) => x.id,
      );
      const { onlyInA: tobeDeleted, onlyInB: tobeAdded } = diffs;

      patchUser({
        userId: selectedUser.userId,
        koreanName: formData.koreanName,
        email: formData.email,
        tobeDeletedDepartments: tobeDeleted.map((d) => d.id),
        tobeAddedDepartments: tobeAdded.map((d) => d.id),
        userStatus: formData.userStatus,
      });
    }
  };

  return (
    <Card className='h-full flex flex-col border-0 shadow-none lg:shadow-sm lg:border overflow-hidden'>
      {/* Header */}
      <CardHeader className='flex-shrink-0 border-b pb-4'>
        <div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center'>
          <div>
            <CardTitle>사용자 목록</CardTitle>
          </div>
          <div className='flex gap-2'>
            <Dialog
              open={modalType === "add"}
              onOpenChange={(open) => setModalType(open ? "add" : null)}>
              <DialogTrigger asChild>
                <Button size='sm' className='bg-blue-600 hover:bg-blue-700'>
                  <Plus className='w-4 h-4 mr-1' />
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
                    <DepartmentSelect
                      value={formData.departments}
                      onChange={(value) => {
                        setFormData({
                          ...formData,
                          departments: value,
                        });
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant='outline' onClick={() => setModalType(null)}>
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
            <Button
              size='sm'
              variant='outline'
              className='border-blue-600 text-blue-600 hover:bg-blue-50'
              onClick={() => setIsBulkDialogOpen(true)}>
              <Users className='w-4 h-4 mr-1' />
              일괄 추가
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className='flex-1 flex flex-col p-0 overflow-hidden'>
        {/* Search and Filter */}
        <div className='p-4 border-b flex-shrink-0'>
          <div className='flex flex-col sm:flex-row gap-3'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                placeholder='이름, 이메일, 부서로 검색...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9 h-9'
              />
            </div>
            <Button
              variant={filterDepartmentId ? "default" : "outline"}
              size='sm'
              onClick={onClearFilter}
              className={
                filterDepartmentId ? "bg-blue-600 hover:bg-blue-700" : ""
              }>
              <Filter className='w-4 h-4 mr-2' />
              {filterDepartmentId ? "필터 해제" : "필터"}
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className='flex-1 overflow-auto'>
          {isLoadingUsers ? (
            <div className='h-full flex items-center justify-center text-gray-400'>
              Loading...
            </div>
          ) : (
            <Table>
              <TableHeader className='sticky top-0 bg-white z-10 shadow-sm'>
                <TableRow>
                  <TableHead className='w-12'></TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead className='hidden sm:table-cell'>이메일</TableHead>
                  <TableHead>부서</TableHead>
                  <TableHead className='hidden md:table-cell'>상태</TableHead>
                  <TableHead className='text-right'>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersData?.users?.length ? (
                  usersData.users.map((user: User) => (
                    <DraggableUserRow
                      key={user.userId}
                      user={user}
                      onEdit={handleEditUser}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className='text-center py-8 text-gray-500'>
                      검색 결과가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination Wrapper */}
        <div className='border-t p-3 flex-shrink-0 bg-white'>
          <TablePagination
            total={usersData?.total ?? 0}
            page={pageInfo.page}
            limit={pageInfo.limit}
            onPageChange={handlePageChange}
          />
        </div>
      </CardContent>

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
              <DepartmentSelect
                value={formData.departments}
                onChange={(value) => {
                  setFormData({
                    ...formData,
                    departments: value,
                  });
                }}
              />
            </div>
            <div className='space-y-2'>
              <Label>상태</Label>
              <Select
                value={formData.userStatus}
                onValueChange={(value: "active" | "inactive") =>
                  setFormData({ ...formData, userStatus: value })
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

      {/* Bulk Add Dialog */}
      <BulkUserAddDialog
        open={isBulkDialogOpen}
        onOpenChange={setIsBulkDialogOpen}
      />
    </Card>
  );
}
