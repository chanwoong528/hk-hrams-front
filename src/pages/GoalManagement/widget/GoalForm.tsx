import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useForm, useFieldArray } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Book, FileText, Save, Trash } from "lucide-react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GoalFormData } from "../type.d";

interface GoalFormProps {
  onSubmitGoals: (goals: GoalFormData[]) => void;
  showLeft?: boolean;
}

export default function GoalForm({
  onSubmitGoals,
  showLeft = true,
}: GoalFormProps) {
  const { control, register, handleSubmit } = useForm({
    defaultValues: { goals: [{ title: "", description: "" }] },
  });
  const { fields, append, remove } = useFieldArray<{ goals: GoalFormData[] }>({
    name: "goals",
    control,
  });

  const handleSave = handleSubmit((data) => {
    onSubmitGoals(data.goals);
  });

  return (
    <>
      <div
        className={cn("grid gap-6", showLeft ? "grid-cols-2" : "grid-cols-1")}>
        {/* 목표 정보 */}

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
              </div>

              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <FileText className='w-4 h-4' />
                  <span className='text-gray-600'>인사평가 설명</span>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>담당자 *</Label>
                  <Input
                    placeholder='이름'
                    disabled
                    value={"홍길동"}
                    className='disabled:text-gray-900 disabled:opacity-100'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>담당자 이메일</Label>
                  <Input
                    type='email'
                    disabled
                    value={"honggildong@company.com"}
                    className='disabled:text-gray-900 disabled:opacity-100'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>담당자 부서</Label>
                  <Input
                    disabled
                    value={"인사팀"}
                    className='disabled:text-gray-900 disabled:opacity-100'
                  />
                </div>
                <div className='space-y-2'>
                  <Label>종료일 *</Label>
                  <Input
                    type='date'
                    disabled
                    value={"2025-12-31"}
                    className='disabled:text-gray-900 disabled:opacity-100'
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 과제 관리 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center justify-between gap-2'>
              목표 관리 (0개)
              <Button
                variant='outline'
                className='bg-white hover:bg-green-700 text-green-700 hover:text-white border-green-700 hover:border-green-700'
                onClick={() => {
                  handleSave();
                }}>
                <Save className='w-8 h-8 mr-2' strokeWidth={2} />
                저장
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className='space-y-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200'>
                <Input
                  {...register(`goals.${index}.title`)}
                  placeholder='목표 제목 '
                />
                <Textarea
                  {...register(`goals.${index}.description`)}
                  placeholder='목표 설명'
                  rows={2}
                />
                <Button
                  size='sm'
                  className='ml-auto bg-white hover:bg-destructive/10 text-destructive hover:text-destructive border-destructive hover:border-destructive/10'
                  onClick={() => {
                    remove(index);
                  }}>
                  <Trash className='w-4 h-4' color='#ff0000' />
                </Button>
              </div>
            ))}
            <div className='flex justify-between'>
              <Button
                size='sm'
                className=' bg-blue-600 hover:bg-blue-700 '
                onClick={() => {
                  append({ title: "", description: "" });
                }}>
                <Plus className='w-4 h-4 mr-2' />
                목표 추가
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
