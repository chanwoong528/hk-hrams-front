import { useState } from "react";
import { Building2, Plus, Users } from "lucide-react";

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

import { toast } from "sonner";
import DepartmentTree from "@/components/DepartmentTree";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GET_departments,
  PATCH_manyDepartments,
  POST_department,
} from "@/api/department/department";
import { pickChangedOnly } from "@/utils";

import { GET_users } from "@/api/user/user";

import { useDebounce } from "@uidotdev/usehooks";

import { AutoComplete } from "@/components/ui/autocomplete";

function LeaderSelect({
  value,
  onChange,
}: {
  value: { name: string; id: string };
  onChange: (value: { name: string; id: string }) => void;
}) {
  const [searchValue, setSearchValue] = useState<string>(value.name);

  const debouncedSearchTerm = useDebounce(searchValue, 1000);

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", debouncedSearchTerm],
    queryFn: () => GET_users(debouncedSearchTerm || ""),
    select: (data) => data.data,
    enabled: !!debouncedSearchTerm,
  });

  return (
    <>
      <Label>리더</Label>
      <AutoComplete
        selectedValue={value.id}
        onSelectedValueChange={(selectValue) => {
          const selectedUser = users?.find(
            (u: User) => u.userId === selectValue,
          );
          onChange?.({
            name: selectedUser?.koreanName || "",
            id: selectValue,
          });
          setSearchValue(selectedUser?.koreanName || "");
        }}
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
        items={
          users?.map((u: User) => ({ value: u.userId, label: u.koreanName })) ||
          []
        }
        isLoading={isLoadingUsers}
      />
    </>
  );
}

// Department Tree Component
export default function DepartmentManagement() {
  const queryClient = useQueryClient();
  const [modalType, setModalType] = useState<"add" | "edit" | null>(null);

  const [treeData, setTreeData] = useState<DepartmentTreeData[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    leaderName: "",
    leaderId: "",
    departmentId: "",
  });

  const { data: flatData, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["departments", "flat"],
    queryFn: () => GET_departments(),
    select: (data) => {
      setTreeData(data.data);
      return data.data;
    },
  });

  const {
    mutate: postDepartment,
    // isPending: isPostingDepartment
  } = useMutation({
    mutationFn: (department: { departmentName: string; leaderId?: string }) =>
      POST_department(department),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", "flat"] });
      toast.success("부서 정보가 추가되었습니다");
    },
    onError: () => {
      toast.error("부서 정보 추가에 실패했습니다");
    },
  });

  const {
    mutate: patchManyDepartments,
    //  isPending: isPatchingManyDepartments
  } = useMutation({
    mutationFn: (departments: DepartmentTreeData[]) =>
      PATCH_manyDepartments(departments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", "flat"] });
      toast.success("부서 정보가 업데이트되었습니다");
    },
    onError: () => {
      toast.error("부서 정보 업데이트에 실패했습니다");
    },
  });

  const handleSave = (treeData: DepartmentTreeData[]) => {
    const diffs = pickChangedOnly(flatData, treeData);
    patchManyDepartments(diffs as unknown as DepartmentTreeData[]);
  };

  const handleAddDepartment = () => {
    postDepartment({
      departmentName: formData.name,
      leaderId: formData.leaderId,
    });
  };

  const handleSaveEdit = () => {
    patchManyDepartments([
      {
        id: formData.departmentId,
        text: formData.name,
        data: {
          departmentId: formData.departmentId,
          departmentName: formData.name,
          leaderId: formData.leaderId,
        },
      },
    ] as unknown as DepartmentTreeData[]);
  };

  const handleCancel = () => {
    setTreeData(flatData);
  };

  const handleOpenEdit = (dept: DepartmentTreeData) => {
    setModalType("edit");
    setFormData({
      name: dept.data.departmentName,
      leaderName: dept.data.leader?.koreanName || "",
      leaderId: dept.data.leader?.userId || "",
      departmentId: dept.data.departmentId,
    });
  };

  const hasChangedDepartments = flatData
    ? pickChangedOnly(flatData, treeData).length > 0
    : false;

  if (isLoadingDepartments) {
    return <div>Loading...</div>;
  }

  return (
    <div className='p-4 lg:p-6 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row gap-4 justify-between'>
        <div>
          <h2 className='text-gray-900'>부서 관리</h2>
          <p className='text-gray-600 mt-1'>조직 구조를 관리합니다</p>
        </div>
        <Dialog
          open={modalType === "add"}
          onOpenChange={(open) => setModalType(open ? "add" : null)}>
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
                <LeaderSelect
                  value={{ name: formData.leaderName, id: formData.leaderId }}
                  onChange={(value) => {
                    console.log("@@@value>> ", value);
                    setFormData({
                      ...formData,
                      leaderName: value.name,
                      leaderId: value.id,
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
              <Button
                variant='outline'
                disabled={!hasChangedDepartments}
                onClick={() =>
                  handleSave(treeData as unknown as DepartmentTreeData[])
                }>
                저장
              </Button>
              <Button
                disabled={!hasChangedDepartments}
                variant='outline'
                onClick={handleCancel}>
                취소
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DepartmentTree
            treeData={treeData}
            setTreeData={setTreeData}
            onEdit={handleOpenEdit}
          />
        </CardContent>
      </Card>

      {/* Edit Department Dialog */}
      <Dialog
        open={modalType === "edit"}
        onOpenChange={(open) => setModalType(open ? "edit" : null)}>
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
              <LeaderSelect
                value={{ name: formData.leaderName, id: formData.leaderId }}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    leaderName: value.name,
                    leaderId: value.id,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setModalType(null)}>
              취소
            </Button>
            <Button
              className='bg-blue-600 hover:bg-blue-700'
              onClick={handleSaveEdit}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
