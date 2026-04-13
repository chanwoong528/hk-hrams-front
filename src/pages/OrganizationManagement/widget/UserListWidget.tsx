import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import BulkUserAddDialog from "./BulkUserAddDialog";
import * as xlsx from "xlsx";
import {
  Search,
  Plus,
  Edit,
  UserX,
  UserCheck,
  Filter,
  MoreVertical,
  GripVertical,
  Users,
  FileUp,
  ArrowUp,
  ArrowDown,
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
import { GET_usersByPagination, PATCH_user, POST_user, POST_bulkUsers } from "@/api/user/user";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import DepartmentSelect from "./DepartmentSelect";
import { symmetricDiffBy } from "@/utils";
import { useDebounce } from "@uidotdev/usehooks";
import { useSearchParams } from "react-router-dom";

import { TablePagination } from "../../PerformanceAppraisal/AppraisalDetail/widget/TablePagination";
import { useDrag } from "react-dnd";

type SortDirection = "asc" | "desc";
type SortKey = "koreanName" | "employeeId" | "jobGroup" | "department";
type SortState = { key: SortKey; direction: SortDirection } | null;

// 정렬은 서버에서 처리. (페이지네이션/검색과 일관성 유지)

const QS_PAGE = "page";
const QS_LIMIT = "limit";
const QS_KEYWORD = "keyword";
const QS_SORT_KEY = "sortKey";
const QS_SORT_DIR = "sortDir";

function parsePositiveInt(value: string | null, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  if (!Number.isInteger(n)) return fallback;
  if (n <= 0) return fallback;
  return n;
}

function isSortKey(v: string | null): v is SortKey {
  return (
    v === "koreanName" ||
    v === "employeeId" ||
    v === "jobGroup" ||
    v === "department"
  );
}

function isSortDir(v: string | null): v is SortDirection {
  return v === "asc" || v === "desc";
}

function SortableHead({
  label,
  sortKey,
  sortState,
  onToggle,
  className,
}: {
  label: string;
  sortKey: SortKey;
  sortState: SortState;
  onToggle: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = sortState?.key === sortKey;
  const direction = isActive ? sortState?.direction : null;
  const ariaSort = (() => {
    if (!isActive) return "none" as const;
    return direction === "asc" ? ("ascending" as const) : ("descending" as const);
  })();

  const Icon = !isActive ? null : direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <TableHead className={className} aria-sort={ariaSort}>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 font-medium text-left hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
        onClick={() => onToggle(sortKey)}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          onToggle(sortKey);
        }}
        aria-label={`${label} 정렬 ${!isActive ? "설정" : direction === "asc" ? "내림차순으로 변경" : "오름차순으로 변경"}`}
      >
        <span>{label}</span>
        {Icon ? <Icon className="w-3.5 h-3.5 text-gray-500" aria-hidden /> : null}
      </button>
    </TableHead>
  );
}

function DraggableUserRow({
  user,
  onEdit,
  onRequestUserStatusChange,
}: {
  user: User;
  onEdit: (u: User) => void;
  onRequestUserStatusChange: (u: User, nextStatus: "active" | "inactive") => void;
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
      <TableCell className='text-gray-600 font-medium'>
        {user.employeeId || "-"}
      </TableCell>
      <TableCell className='text-gray-600 hidden sm:table-cell'>
        {user.email}
      </TableCell>
      <TableCell className='text-gray-600 hidden xl:table-cell'>
        {user.phoneNumber || "-"}
      </TableCell>
      <TableCell className='text-gray-600 font-medium'>
        {user.jobGroup || "-"}
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
            {user.userStatus === "active" ? (
              <DropdownMenuItem
                onClick={() => onRequestUserStatusChange(user, "inactive")}
                className='text-amber-700 focus:text-amber-700'>
                <UserX className='w-4 h-4 mr-2' />
                비활성화
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => onRequestUserStatusChange(user, "active")}
                className='text-blue-700 focus:text-blue-700'>
                <UserCheck className='w-4 h-4 mr-2' />
                활성화
              </DropdownMenuItem>
            )}
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
  const [searchParams, setSearchParams] = useSearchParams();

  const urlPage = parsePositiveInt(searchParams.get(QS_PAGE), 1);
  const urlLimit = parsePositiveInt(searchParams.get(QS_LIMIT), 10);
  const urlKeyword = (searchParams.get(QS_KEYWORD) ?? "").trim();
  const urlSortKey = searchParams.get(QS_SORT_KEY);
  const urlSortDir = searchParams.get(QS_SORT_DIR);

  const sortState: SortState =
    isSortKey(urlSortKey) && isSortDir(urlSortDir)
      ? { key: urlSortKey, direction: urlSortDir }
      : null;

  const [modalType, setModalType] = useState<"add" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userStatusConfirm, setUserStatusConfirm] = useState<{
    user: User;
    nextStatus: "active" | "inactive";
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState(urlKeyword);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 1000);

  // URL의 keyword만 반영(뒤로가기 등). searchQuery를 deps에 넣으면
  // 디바운스 전에 url이 빈 값일 때 매 입력마다 입력창이 초기화된다.
  useEffect(() => {
    setSearchQuery(urlKeyword);
  }, [urlKeyword]);

  // debouncedSearchQuery를 URL에 기록 (페이지는 유지)
  useEffect(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const keyword = debouncedSearchQuery.trim();
      if (keyword) next.set(QS_KEYWORD, keyword);
      else next.delete(QS_KEYWORD);
      return next;
    }, { replace: true });
  }, [debouncedSearchQuery, setSearchParams]);

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
    queryKey: [
      "users",
      debouncedSearchQuery,
      urlPage,
      urlLimit,
      filterDepartmentId,
      sortState?.key,
      sortState?.direction,
    ],
    queryFn: () =>
      GET_usersByPagination(
        urlPage,
        urlLimit,
        debouncedSearchQuery,
        filterDepartmentId || undefined,
        sortState
          ? { sortKey: sortState.key, sortDir: sortState.direction }
          : null,
      ),
    select: (data) => {
      return {
        users: data.data.list,
        total: data.data.total,
      };
    },
  });

  // 필터/검색/정렬로 total page 수가 줄어들어도,
  // 가능한 한 "현재 페이지"를 유지하되 범위를 벗어나면 마지막 페이지로 보정한다.
  useEffect(() => {
    if (isLoadingUsers) return;
    if (usersData?.total == null) return;
    const total = usersData.total;
    const totalPages = Math.max(1, Math.ceil(total / urlLimit));
    if (urlPage <= totalPages) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(QS_PAGE, String(totalPages));
      return next;
    }, { replace: true });
  }, [isLoadingUsers, setSearchParams, urlLimit, urlPage, usersData?.total]);

  const onToggleSort = useCallback((key: SortKey) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const prevKey = next.get(QS_SORT_KEY);
      const prevDir = next.get(QS_SORT_DIR);
      const isSameKey = prevKey === key;
      const nextDir: SortDirection = !isSameKey
        ? "asc"
        : prevDir === "asc"
          ? "desc"
          : "asc";
      next.set(QS_SORT_KEY, key);
      next.set(QS_SORT_DIR, nextDir);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // 정렬은 서버에서 처리. (페이지네이션/검색과 일관성 유지)
  const sortedUsers = useMemo(() => usersData?.users ?? [], [usersData?.users]);

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
      queryClient.invalidateQueries({ queryKey: ["departments"] });
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
      queryClient.invalidateQueries({ queryKey: ["departments"] });
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
      queryClient.invalidateQueries({ queryKey: ["departments"] });
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

  const { mutate: bulkCreateFromExcel, isPending: isUploadingExcel } = useMutation({
    mutationFn: (payload: { users: any[], departments: any[] }) => POST_bulkUsers(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("엑셀 데이터를 통해 사용자가 일괄 추가되었습니다");
    },
    onError: () => {
      toast.error("사용자 일괄 추가에 실패했습니다");
    },
  });

  const handleExcelDirectUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = xlsx.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const parsedData = xlsx.utils.sheet_to_json<string[]>(sheet, { header: 1 });

        const users: any[] = [];
        
        for (let i = 1; i < parsedData.length; i++) {
          const row = parsedData[i];
          if (!row || row.length === 0) continue;
          
          const u = {
            employeeId: (row[0] ? String(row[0]) : "")?.trim(),
            company: (row[1] ? String(row[1]) : "")?.trim(),
            koreanName: (row[2] ? String(row[2]) : "")?.trim(),
            jobGroup: (row[3] ? String(row[3]) : "")?.trim(),
            email: (row[4] ? String(row[4]) : "")?.trim(),
            phoneNumber: (row[5] ? String(row[5]) : "")?.trim(),
            // optional column (엑셀): 부서이름
            departmentName: (row[6] ? String(row[6]) : "")?.trim(),
          };
          
          if (Object.values(u).some(val => val !== "")) {
            users.push(u);
          }
        }

        if (users.length === 0) {
          toast.error("데이터가 없거나 엑셀 파싱에 실패했습니다.");
          return;
        }

        const invalidRows = users.filter(
          (u) =>
            !u.employeeId ||
            !u.company ||
            !u.koreanName ||
            !u.jobGroup ||
            !u.email ||
            !u.phoneNumber
        );
        
        if (invalidRows.length > 0) {
          toast.warning("엑셀에 사원번호, 회사, 이름, 직군, 이메일, 핸드폰 번호 중 누락된 항목이 있습니다.");
          return;
        }

        bulkCreateFromExcel({
          users,
          departments: [],
        });
      } catch (error) {
        console.error(error);
        toast.error("엑셀 파일을 읽는 데 실패했습니다.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(QS_PAGE, String(page));
      return next;
    }, { replace: true });
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      koreanName: user.koreanName,
      email: user.email,
      departments: user.departments || [],
      userStatus: user.userStatus as "active" | "inactive",
      jobGroup: user.jobGroup || "",
      employeeId: user.employeeId || "",
      phoneNumber: user.phoneNumber || "",
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
        jobGroup: formData.jobGroup,
        employeeId: formData.employeeId,
        phoneNumber: formData.phoneNumber,
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
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              ref={fileInputRef}
              onChange={handleExcelDirectUpload}
            />
            <Button
              size='sm'
              variant='outline'
              className='border-green-600 text-green-600 hover:bg-green-50'
              disabled={isUploadingExcel}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className='w-4 h-4 mr-1' />
              {isUploadingExcel ? "처리 중..." : "엑셀 즉시 추가"}
            </Button>
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
                  <SortableHead
                    label="이름"
                    sortKey="koreanName"
                    sortState={sortState}
                    onToggle={onToggleSort}
                  />
                  <SortableHead
                    label="사번"
                    sortKey="employeeId"
                    sortState={sortState}
                    onToggle={onToggleSort}
                  />
                  <TableHead className='hidden sm:table-cell'>이메일</TableHead>
                  <TableHead className='hidden xl:table-cell'>전화번호</TableHead>
                  <SortableHead
                    label="직군"
                    sortKey="jobGroup"
                    sortState={sortState}
                    onToggle={onToggleSort}
                  />
                  <SortableHead
                    label="부서"
                    sortKey="department"
                    sortState={sortState}
                    onToggle={onToggleSort}
                  />
                  <TableHead className='hidden md:table-cell'>상태</TableHead>
                  <TableHead className='text-right'>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.length ? (
                  sortedUsers.map((user: User) => (
                    <DraggableUserRow
                      key={user.userId}
                      user={user}
                      onEdit={handleEditUser}
                      onRequestUserStatusChange={(u, nextStatus) =>
                        setUserStatusConfirm({ user: u, nextStatus })
                      }
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
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
            page={urlPage}
            limit={urlLimit}
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
    </Card>
  );
}
