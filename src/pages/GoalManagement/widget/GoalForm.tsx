import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useForm, useFieldArray } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Book, FileText, Save, Trash, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GoalFormData } from "../type.d";
import { useState, useEffect } from "react";
import type { Goal } from "../type";

interface AppraisalInfo {
  title?: string;
  description?: string;
  endDate?: string;
  userName?: string;
  userEmail?: string;
  userDept?: string;
}

interface GoalFormProps {
  // New unified handler
  onSaveAll: (
    newGoals: GoalFormData[],
    updatedGoals: GoalFormData[],
    deletedGoalIds: string[],
  ) => void;
  showLeft?: boolean;
  existingGoals?: Goal[];
  appraisalInfo?: AppraisalInfo;
}

export default function GoalForm({
  onSaveAll,
  showLeft = true,
  existingGoals = [],
  appraisalInfo,
}: GoalFormProps) {
  const { control, register, handleSubmit, reset } = useForm<{
    goals: GoalFormData[];
  }>({
    defaultValues: { goals: [] },
  });

  const { fields, append, remove } = useFieldArray({
    name: "goals",
    control,
  });

  // Track IDs of deleted existing goals
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  // Load existing goals into form
  useEffect(() => {
    if (existingGoals.length > 0) {
      const formattedGoals = existingGoals.map((g) => ({
        goalId: g.goalId,
        title: g.title,
        description: g.description,
      }));
      reset({ goals: formattedGoals });
    } else {
      // Start with one empty row if no existing goals (optional, but good UX)
      // If we want purely "add new" button to trigger, we can start empty.
      // Let's start with one empty if absolutely nothing exists.
      reset({ goals: [] });
    }
  }, [existingGoals, reset]);

  const handleRemove = (index: number) => {
    const field = fields[index];
    if (field && field.goalId) {
      setDeletedIds((prev) => [...prev, field.goalId!]);
    }
    remove(index);
  };

  const handleSave = handleSubmit((data) => {
    const newGoals: GoalFormData[] = [];
    const updatedGoals: GoalFormData[] = [];

    data.goals.forEach((goal) => {
      if (goal.goalId) {
        updatedGoals.push(goal);
      } else {
        newGoals.push(goal);
      }
    });

    onSaveAll(newGoals, updatedGoals, deletedIds);
  });

  return (
    <div className={cn("grid gap-6", showLeft ? "grid-cols-2" : "grid-cols-1")}>
      {/* Appraisal Info (Left Side) - Unchanged */}
      {showLeft && (
        <Card className='h-fit'>
          <CardHeader>
            <CardTitle>인사평가 정보</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Book className='w-4 h-4' />
                <span className='text-gray-900'>인사평가 제목</span>
              </div>
              <div className='text-sm font-medium pl-6 text-gray-700'>
                {appraisalInfo?.title || "-"}
              </div>
            </div>

            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <FileText className='w-4 h-4' />
                <span className='text-gray-600'>인사평가 설명</span>
              </div>
              <div className='text-sm text-gray-600 pl-6 leading-relaxed bg-gray-50 p-2 rounded-md'>
                {appraisalInfo?.description || "설명 없음"}
              </div>
            </div>

            <div className='grid grid-cols-2 gap-4 pt-2'>
              <div className='space-y-2'>
                <Label>담당자</Label>
                <Input
                  disabled
                  value={appraisalInfo?.userName || ""}
                  className='disabled:bg-gray-50'
                />
              </div>
              <div className='space-y-2'>
                <Label>담당자 이메일</Label>
                <Input
                  disabled
                  value={appraisalInfo?.userEmail || ""}
                  className='disabled:bg-gray-50'
                />
              </div>
              <div className='space-y-2'>
                <Label>담당자 부서</Label>
                <Input
                  disabled
                  value={appraisalInfo?.userDept || ""}
                  className='disabled:bg-gray-50'
                />
              </div>
              <div className='space-y-2'>
                <Label>종료일</Label>
                <Input
                  type='date'
                  disabled
                  value={
                    appraisalInfo?.endDate
                      ? appraisalInfo.endDate.split("T")[0]
                      : ""
                  }
                  className='disabled:bg-gray-50'
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unified Goal List (Right Side) */}
      <Card className='border-gray-200 shadow-sm'>
        <CardHeader className='bg-gray-50/50 py-3'>
          <CardTitle className='flex items-center justify-between text-base'>
            <div className='flex items-center gap-2'>
              <Plus className='w-4 h-4 text-blue-600' />
              목표 리스트 작성
              <span className='text-xs font-normal text-muted-foreground ml-1'>
                (총 {fields.length}개)
              </span>
            </div>
            <Button
              size='sm'
              className='bg-green-600 hover:bg-green-700 text-white shadow-sm'
              onClick={handleSave}>
              <Save className='w-4 h-4 mr-2' />
              저장하기
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4 pt-6'>
          {fields.length === 0 && (
            <div className='text-center py-8 text-gray-500 text-sm'>
              등록된 목표가 없습니다. 아래 버튼을 눌러 목표를 추가해주세요.
            </div>
          )}
          {fields.map((field, index) => (
            <div
              key={field.id}
              className='group relative grid gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200'>
              <div className='absolute left-0 top-0 bottom-0 w-1 bg-blue-100 group-hover:bg-blue-500 rounded-l-xl transition-colors' />

              <div className='grid gap-2'>
                <Label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                  목표 제목
                </Label>
                <Input
                  {...register(`goals.${index}.title`, { required: true })}
                  placeholder='목표 제목 입력'
                  className='border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 font-medium'
                />
              </div>

              <div className='grid gap-2'>
                <Label className='text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                  상세 설명
                </Label>
                <Textarea
                  {...register(`goals.${index}.description`)}
                  placeholder='목표에 대한 상세 내용을 작성해주세요.'
                  rows={2}
                  className='resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                />
              </div>

              <div className='flex justify-end pt-2'>
                <Button
                  size='sm'
                  variant='ghost'
                  className='text-red-500 hover:text-red-600 hover:bg-red-50'
                  onClick={() => handleRemove(index)}>
                  <Trash className='w-4 h-4 mr-2' />
                  삭제
                </Button>
              </div>
            </div>
          ))}

          <div className='flex justify-center pt-2'>
            <Button
              variant='outline'
              className='w-full border-dashed border-2 border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 h-12'
              onClick={() => {
                append({ title: "", description: "" });
              }}>
              <Plus className='w-5 h-5 mr-2' />
              목표 항목 추가하기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
