import { useState, useCallback } from "react";
import Spreadsheet, { type Matrix, type CellBase } from "react-spreadsheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { POST_bulkUsers } from "@/api/user/user";
import { Plus, Trash2, Users } from "lucide-react";
import DepartmentSelect from "./DepartmentSelect";

const COLUMN_LABELS = ["이름", "이메일", "직군"];
const INITIAL_ROW_COUNT = 5;

function createEmptyRow(): CellBase[] {
  return [{ value: "" }, { value: "" }, { value: "" }];
}

function createInitialData(): Matrix<CellBase> {
  return Array.from({ length: INITIAL_ROW_COUNT }, () => createEmptyRow());
}

interface BulkUserAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BulkUserAddDialog({
  open,
  onOpenChange,
}: BulkUserAddDialogProps) {
  const queryClient = useQueryClient();
  const [data, setData] = useState<Matrix<CellBase>>(createInitialData);
  const [selectedDepartments, setSelectedDepartments] = useState<Department[]>(
    [],
  );

  const { mutate: bulkCreate, isPending } = useMutation({
    mutationFn: POST_bulkUsers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("사용자가 일괄 추가되었습니다");
      handleClose();
    },
    onError: () => {
      toast.error("사용자 일괄 추가에 실패했습니다");
    },
  });

  const handleClose = useCallback(() => {
    setData(createInitialData());
    setSelectedDepartments([]);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleAddRows = useCallback(() => {
    setData((prev: Matrix<CellBase>) => [
      ...prev,
      ...Array.from({ length: 5 }, () => createEmptyRow()),
    ]);
  }, []);

  const handleDeleteLastRow = useCallback(() => {
    setData((prev: Matrix<CellBase>) => {
      if (prev.length <= 1) return prev;
      return prev.slice(0, -1);
    });
  }, []);

  const handleSubmit = useCallback(() => {
    const users = data
      .map((row: (CellBase | undefined)[]) => ({
        koreanName: (row[0]?.value as string)?.trim() ?? "",
        email: (row[1]?.value as string)?.trim() ?? "",
        jobGroup: (row[2]?.value as string)?.trim() ?? "",
      }))
      .filter(
        (u: { koreanName: string; email: string }) =>
          u.koreanName !== "" || u.email !== "",
      );

    if (users.length === 0) {
      toast.warning("추가할 사용자 정보를 입력해주세요");
      return;
    }

    const invalidRows = users.filter(
      (u: { koreanName: string; email: string }) => !u.koreanName || !u.email,
    );
    if (invalidRows.length > 0) {
      toast.warning("이름과 이메일을 모두 입력해주세요");
      return;
    }

    bulkCreate({
      users,
      departments: selectedDepartments,
    });
  }, [data, bulkCreate, selectedDepartments]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[80vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Users className='w-5 h-5' />
            사용자 일괄 추가
          </DialogTitle>
        </DialogHeader>

        <div className='flex-1 overflow-auto py-4'>
          <div className='text-sm text-gray-500 mb-3'>
            아래 스프레드시트에 추가할 사용자 정보를 입력하세요. 빈 행은
            자동으로 무시됩니다.
          </div>

          <div className='space-y-2 mb-4'>
            <DepartmentSelect
              value={selectedDepartments}
              onChange={setSelectedDepartments}
            />
          </div>

          <div className='border rounded-lg overflow-auto'>
            <Spreadsheet
              data={data}
              onChange={setData}
              columnLabels={COLUMN_LABELS}
            />
          </div>

          <div className='flex gap-2 mt-3'>
            <Button
              variant='outline'
              size='sm'
              onClick={handleAddRows}
              type='button'>
              <Plus className='w-4 h-4 mr-1' />5 행 추가
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={handleDeleteLastRow}
              type='button'
              className='text-red-600 hover:text-red-700'>
              <Trash2 className='w-4 h-4 mr-1' />
              마지막 행 삭제
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={handleClose} disabled={isPending}>
            취소
          </Button>
          <Button
            className='bg-blue-600 hover:bg-blue-700'
            onClick={handleSubmit}
            disabled={isPending}>
            {isPending ? "추가 중..." : "일괄 추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
