import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  GET_departments,
  PATCH_manyDepartments,
  POST_department,
} from "@/api/department/department";
import { PATCH_user } from "@/api/user/user";
import { pickChangedOnly } from "@/utils";
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
import DepartmentTree from "./DepartmentTree";
import LeaderSelect from "./LeaderSelect";

export default function DepartmentTreeWidget({
  selectedDepartmentId,
  onSelectDepartment,
}: {
  selectedDepartmentId: string | null;
  onSelectDepartment: (id: string | null) => void;
}) {
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

  const { mutate: postDepartment } = useMutation({
    mutationFn: (department: { departmentName: string; leaderId?: string }) =>
      POST_department(department),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", "flat"] });
      toast.success("부서 정보가 추가되었습니다");
      setModalType(null);
      setFormData({
        name: "",
        leaderName: "",
        leaderId: "",
        departmentId: "",
      });
    },
    onError: () => {
      toast.error("부서 정보 추가에 실패했습니다");
    },
  });

  const { mutate: patchManyDepartments } = useMutation({
    mutationFn: (departments: DepartmentTreeData[]) =>
      PATCH_manyDepartments(departments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments", "flat"] });
      toast.success("부서 정보가 업데이트되었습니다");
      setModalType(null);
      setFormData({
        name: "",
        leaderName: "",
        leaderId: "",
        departmentId: "",
      });
    },
    onError: () => {
      toast.error("부서 정보 업데이트에 실패했습니다");
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
      queryClient.invalidateQueries({ queryKey: ["departments", "flat"] });
      toast.success("사용자가 해당 부서에 추가되었습니다");
    },
    onError: () => {
      toast.error("사용자 부서 추가에 실패했습니다");
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

  const handleDropUser = (user: any, deptId: string) => {
    if (user.departments?.some((d: any) => d.departmentId === deptId)) {
      toast.info("이미 해당 부서에 소속된 사용자입니다.");
      return;
    }
    patchUser({
      userId: user.userId,
      koreanName: user.koreanName,
      email: user.email,
      userStatus: user.userStatus,
      tobeDeletedDepartments: [],
      tobeAddedDepartments: [deptId],
    });
  };

  const hasChangedDepartments = flatData
    ? pickChangedOnly(flatData, treeData).length > 0
    : false;

  if (isLoadingDepartments) {
    return (
      <div className='h-full flex items-center justify-center'>Loading...</div>
    );
  }

  return (
    <Card className='h-full flex flex-col gap-0 border-0 shadow-none lg:shadow-sm lg:border'>
      <CardHeader className='flex-shrink-0'>
        <div className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center'>
          <div>
            <CardTitle>조직도 관리</CardTitle>
          </div>
          <div className='flex items-center gap-2'>
            <Dialog
              open={modalType === "add"}
              onOpenChange={(open) => setModalType(open ? "add" : null)}>
              <DialogTrigger asChild>
                <Button size='sm' className='bg-blue-600 hover:bg-blue-700'>
                  <Plus className='w-4 h-4 mr-1' />
                  추가
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
                      value={{
                        name: formData.leaderName,
                        id: formData.leaderId,
                      }}
                      onChange={(value) => {
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

            <Button
              size='sm'
              variant='outline'
              className='bg-blue-600 hover:bg-blue-700 text-white'
              disabled={!hasChangedDepartments}
              onClick={() =>
                handleSave(treeData as unknown as DepartmentTreeData[])
              }>
              저장
            </Button>
            <Button
              size='sm'
              disabled={!hasChangedDepartments}
              variant='outline'
              onClick={handleCancel}>
              취소
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent
        className='flex-1 overflow-y-auto px-2 sm:px-6'
        onClick={() => onSelectDepartment(null)}>
        <div
          className='bg-blue-50/50 p-3 rounded-lg flex items-center gap-3 mb-4 text-sm text-blue-800'
          onClick={(e) => e.stopPropagation()}>
          <Building2 className='w-5 h-5 text-blue-600 flex-shrink-0' />
          <p>사용자를 끌어다 부서에 놓으면 부서원이 추가됩니다.</p>
        </div>
        <DepartmentTree
          treeData={treeData}
          setTreeData={setTreeData}
          onEdit={handleOpenEdit}
          onDropUser={handleDropUser}
          selectedDepartmentId={selectedDepartmentId}
          onSelectDepartment={onSelectDepartment}
        />
      </CardContent>

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
    </Card>
  );
}
