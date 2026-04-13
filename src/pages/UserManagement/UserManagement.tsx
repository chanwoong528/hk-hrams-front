import { useState } from "react";
import { Search, Plus, Edit, UserX, UserCheck, Filter, MoreVertical } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { GET_usersByPagination, PATCH_user, POST_user } from "@/api/user/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DepartmentSelect from "./widget/DepartmentSelect";
import { symmetricDiffBy } from "@/utils";
import { useDebounce } from "@uidotdev/usehooks";

import { TablePagination } from "../PerformanceAppraisal/AppraisalDetail/widget/TablePagination";

export default function UserManagement() {
  const queryClient = useQueryClient();
  const [modalType, setModalType] = useState<"add" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userStatusConfirm, setUserStatusConfirm] = useState<{
    user: User;
    nextStatus: "active" | "inactive";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearchQuery = useDebounce(searchQuery, 1500);

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
    jobGroup: string;
    employeeId: string;
    phoneNumber: string;
  }>({
    koreanName: "",
    email: "",
    departments: [],
    userStatus: "active",
    jobGroup: "",
    employeeId: "",
    phoneNumber: "",
  });
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", debouncedSearchQuery, pageInfo.page, pageInfo.limit],
    queryFn: () =>
      GET_usersByPagination(
        pageInfo.page,
        pageInfo.limit,
        debouncedSearchQuery,
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
      jobGroup?: string;
      employeeId?: string;
      phoneNumber?: string;
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
        jobGroup: "",
        employeeId: "",
        phoneNumber: "",
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
      jobGroup?: string;
      employeeId?: string;
      phoneNumber?: string;
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
        jobGroup: "",
        employeeId: "",
        phoneNumber: "",
      });
    },
    onError: () => {
      toast.error("사용자 정보 업데이트에 실패했습니다");
    },
  });

  const { mutate: applyUserStatus, isPending: isApplyingUserStatus } = useMutation({
    mutationFn: ({
      user,
      nextStatus,
    }: {
      user: User;
      nextStatus: "active" | "inactive";
    }) =>
      PATCH_user({
        userId: user.userId,
        koreanName: user.koreanName,
        email: user.email,
        tobeDeletedDepartments: [],
        tobeAddedDepartments: [],
        userStatus: nextStatus,
        jobGroup: user.jobGroup,
        employeeId: user.employeeId,
        phoneNumber: user.phoneNumber,
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success(
        variables.nextStatus === "active"
          ? "사용자가 활성화되었습니다."
          : "사용자가 비활성화되었습니다.",
      );
      setUserStatusConfirm(null);
    },
    onError: (_err, variables) => {
      toast.error(
        variables.nextStatus === "active"
          ? "활성화에 실패했습니다."
          : "비활성화에 실패했습니다.",
      );
    },
  });

  const handleAddUser = () => {
    postUser({
      koreanName: formData.koreanName,
      email: formData.email,
      departments: formData.departments,
      jobGroup: formData.jobGroup,
      employeeId: formData.employeeId,
      phoneNumber: formData.phoneNumber,
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
      departments: user.departments,
      userStatus: user.userStatus as "active" | "inactive",
      jobGroup: user.jobGroup || "",
      employeeId: user.employeeId || "",
      phoneNumber: user.phoneNumber || "",
    });
  };

  const handleUpdateUser = () => {
    if (selectedUser) {
      const diffs = symmetricDiffBy(
        selectedUser.departments.map((d) => ({ id: d.departmentId })),
        formData.departments.map((d) => ({ id: d.departmentId })),
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
        jobGroup: formData.jobGroup,
        employeeId: formData.employeeId,
        phoneNumber: formData.phoneNumber,
      });
    }
  };

  // const handleDeleteUser = (userId: string) => {
  //   toast.success("사용자가 삭제되었습니다");
  // };

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
        <Dialog
          open={modalType === "add"}
          onOpenChange={(open) => setModalType(open ? "add" : null)}>
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
                <Label>직군</Label>
                <Input
                  value={formData.jobGroup}
                  onChange={(e) =>
                    setFormData({ ...formData, jobGroup: e.target.value })
                  }
                  placeholder='개발 / 디자인 / 경영지원 등'
                />
              </div>
              <div className='space-y-2'>
                <Label>사번</Label>
                <Input
                  value={formData.employeeId}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeId: e.target.value })
                  }
                  placeholder='2023001'
                />
              </div>
              <div className='space-y-2'>
                <Label>휴대폰 번호</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  placeholder='010-1234-5678'
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
                  <TableHead>직군</TableHead>
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
                    <TableCell className='text-gray-600 font-medium'>
                      {user.jobGroup || "-"}
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-1 flex-wrap'>
                        {user.departments.map((dept, idx) => (
                          <Badge key={idx} variant='secondary'>
                            {dept.departmentName}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.userStatus === "active" ? "default" : "secondary"
                        }
                        className={
                          user.userStatus === "active"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : ""
                        }>
                        {user.userStatus === "active" ? "활성" : "비활성"}
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
                          {user.userStatus === "active" ? (
                            <DropdownMenuItem
                              onClick={() =>
                                setUserStatusConfirm({ user, nextStatus: "inactive" })
                              }
                              className='text-amber-700 focus:text-amber-700'>
                              <UserX className='w-4 h-4 mr-2' />
                              비활성화
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                setUserStatusConfirm({ user, nextStatus: "active" })
                              }
                              className='text-blue-700 focus:text-blue-700'>
                              <UserCheck className='w-4 h-4 mr-2' />
                              활성화
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              total={usersData?.total ?? 0}
              page={pageInfo.page}
              limit={pageInfo.limit}
              onPageChange={handlePageChange}
            />
          </div>
          {/* <Pagination>
            <PaginationContent>
              {Array.from({
                length: Math.ceil((usersData?.total ?? 0) / pageInfo.limit),
              }).map((_, index) => (
                <PaginationItem key={index}>
                  <PaginationLink
                    isActive={pageInfo.page === index + 1}
                    onClick={() =>
                      setPageInfo({ ...pageInfo, page: index + 1 })
                    }>
                    {index + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
            </PaginationContent>
          </Pagination> */}
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
            <div className='space-y-2'>
              <Label>직군</Label>
              <Input
                value={formData.jobGroup}
                onChange={(e) =>
                  setFormData({ ...formData, jobGroup: e.target.value })
                }
                placeholder='개발 / 디자인 / 경영지원 등'
              />
            </div>
            <div className='space-y-2'>
              <Label>사번</Label>
              <Input
                value={formData.employeeId}
                onChange={(e) =>
                  setFormData({ ...formData, employeeId: e.target.value })
                }
                placeholder='2023001'
              />
            </div>
            <div className='space-y-2'>
              <Label>휴대폰 번호</Label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                placeholder='010-1234-5678'
              />
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

      <AlertDialog
        open={userStatusConfirm !== null}
        onOpenChange={(open) => {
          if (!open) setUserStatusConfirm(null);
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userStatusConfirm?.nextStatus === "active"
                ? "사용자 활성화"
                : "사용자 비활성화"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userStatusConfirm
                ? userStatusConfirm.nextStatus === "active"
                  ? `"${userStatusConfirm.user.koreanName}" 님을 활성화할까요? 로그인 및 역량·목표 등 평가 진행이 다시 가능합니다.`
                  : `"${userStatusConfirm.user.koreanName}" 님을 비활성화할까요? 계정은 유지되며, 역량·목표 등 평가 진행에서 제외됩니다.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isApplyingUserStatus}>취소</AlertDialogCancel>
            <AlertDialogAction
              disabled={isApplyingUserStatus || !userStatusConfirm}
              className={
                userStatusConfirm?.nextStatus === "active"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }
              onClick={(e) => {
                e.preventDefault();
                if (userStatusConfirm) {
                  applyUserStatus({
                    user: userStatusConfirm.user,
                    nextStatus: userStatusConfirm.nextStatus,
                  });
                }
              }}>
              {userStatusConfirm?.nextStatus === "active" ? "활성화" : "비활성화"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
