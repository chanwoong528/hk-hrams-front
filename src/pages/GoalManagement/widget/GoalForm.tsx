import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useForm, useFieldArray } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Book, FileText, Save, Trash, X, Check } from "lucide-react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GoalFormData } from "../type.d";
import { useState } from "react";

interface GoalFormProps {
  onSubmitGoals: (goals: GoalFormData[]) => void;
  showLeft?: boolean;
  existingGoals?: {
    title: string;
    description: string;
    count: number;
    totalUsers: number;
    goalId?: string;
  }[];
  onUpdateGoal?: (
    oldTitle: string,
    newTitle: string,
    newDescription: string
  ) => void;
  onDeleteGoal?: (title: string) => void;
  teamName?: string;
}

export default function GoalForm({
  onSubmitGoals,
  showLeft = true,
  existingGoals = [],
  onUpdateGoal,
  onDeleteGoal,
  teamName,
}: GoalFormProps) {
  const { control, register, handleSubmit } = useForm({
    defaultValues: { goals: [{ title: "", description: "" }] },
  });
  console.log('GoalForm Rendered. onDeleteGoal:', !!onDeleteGoal);
  const { fields, append, remove } = useFieldArray<{ goals: GoalFormData[] }>({
    name: "goals",
    control,
  });

  // State for inline editing
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState({ title: "", description: "" });

  const handleSave = handleSubmit((data) => {
    onSubmitGoals(data.goals);
  });

  const startEditing = (idx: number, goal: { title: string; description: string }) => {
    setEditingIndex(idx);
    setEditValues({ title: goal.title, description: goal.description });
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditValues({ title: "", description: "" });
  };

  const saveEditing = (oldTitle: string) => {
    if (onUpdateGoal) {
      onUpdateGoal(oldTitle, editValues.title, editValues.description);
      setEditingIndex(null);
    }
  };

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

        {/* 기존 공통 목표 리스트 (참고용) */}
        {!showLeft && existingGoals && existingGoals.length > 0 && (
          <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="bg-indigo-50/50 pb-2 pt-3 px-4">
              <CardTitle className='text-xs text-indigo-900 flex items-center justify-between gap-2'>
                <div className="flex items-center gap-2">
                  <Book className="w-3.5 h-3.5 text-indigo-600" />
                  기존에 등록된 목표 <span className="text-gray-500 font-normal">({existingGoals.length}건)</span>
                </div>
                {/* Optional: Add Team Name here if passed in context, but user asked for "Team Name" display which suggests it might be better in the header of the modal itself, but here is good for context too if specific to this list */}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 p-0">
               {/* Scrollable Area with max-height */}
              <div className='max-h-[200px] overflow-y-auto p-3 space-y-2 bg-slate-50/50 shadow-inner custom-scrollbar'>
                {existingGoals.map((goal, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'p-2.5 bg-white rounded-md border shadow-sm transition-all',
                      editingIndex === idx 
                        ? 'border-blue-400 ring-2 ring-blue-100' 
                        : 'border-indigo-100 hover:border-indigo-300'
                    )}>
                    
                    {editingIndex === idx ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1">
                          <span className='text-[10px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100'>
                            수정 중
                          </span>
                        </div>
                        <Input 
                          value={editValues.title}
                          onChange={(e) => setEditValues(prev => ({...prev, title: e.target.value}))}
                          className="h-7 text-xs font-semibold"
                          placeholder="목표 제목"
                          autoFocus
                        />
                        <Textarea 
                          value={editValues.description}
                          onChange={(e) => setEditValues(prev => ({...prev, description: e.target.value}))}
                          className="text-xs min-h-[50px] resize-none"
                          placeholder="목표 설명"
                        />
                        <div className="flex justify-end gap-1.5 pt-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 w-6 p-0 rounded-full hover:bg-gray-100 text-gray-500"
                            onClick={cancelEditing}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            size="sm" 
                            className="h-6 bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2.5"
                            onClick={() => saveEditing(goal.title)}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            저장
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className='font-semibold mb-0.5 flex justify-between items-start'>
                          <span className="text-gray-800 text-xs">{goal.title}</span>
                          <span className='text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full border border-indigo-100 whitespace-nowrap ml-2'>
                            {goal.count}/{goal.totalUsers}명
                          </span>
                        </div>
                        <div className='text-[11px] text-gray-600 line-clamp-1 mb-1.5'>
                          {goal.description}
                        </div>
                        <div className='flex justify-end items-center gap-1 pt-1.5 border-t border-gray-50'>
                          {onUpdateGoal && (
                            <Button
                              size='sm'
                              variant='ghost'
                              className='h-5 text-[10px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 px-1.5'
                              onClick={() => startEditing(idx, goal)}>
                              수정
                            </Button>
                          )}
                          {onDeleteGoal && (
                             <Button
                              size='sm'
                              variant='ghost'
                              className='h-5 w-5 p-0 text-red-500 hover:text-red-600 hover:bg-red-50'
                              onClick={() => onDeleteGoal(goal.title)}
                             >
                                <Trash className="w-3 h-3" />
                             </Button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 과제 관리 */}
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="bg-gray-50/50 pb-3">
            <CardTitle className='flex items-center justify-between gap-2 text-base text-gray-900'>
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                새로운 목표 추가
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  (총 {fields.length}개 작성 중)
                </span>
              </div>
              <Button
                size="sm"
                className='bg-green-600 hover:bg-green-700 text-white shadow-sm'
                onClick={() => {
                  handleSave();
                }}>
                <Save className='w-4 h-4 mr-2' />
                전체 저장
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4 pt-6'>
            {fields.map((field, index) => (
              <div
                key={field.id}
                className='group relative grid gap-4 p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200'>
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-100 group-hover:bg-blue-500 rounded-l-xl transition-colors" />
                
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">목표 제목</Label>
                  <Input
                    {...register(`goals.${index}.title`)}
                    placeholder='예: 상반기 프로젝트 완료'
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">상세 설명</Label>
                  <Textarea
                    {...register(`goals.${index}.description`)}
                    placeholder='목표에 대한 구체적인 내용을 작성해주세요.'
                    rows={3}
                    className="resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    size='sm'
                    variant="ghost"
                    className='text-red-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent'
                    disabled={fields.length <= 1}
                    onClick={() => {
                      remove(index);
                    }}>
                    <Trash className='w-4 h-4 mr-2' />
                    삭제
                  </Button>
                </div>
              </div>
            ))}
            
            <div className='flex justify-center pt-2'>
              <Button
                variant="outline"
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
    </>
  );
}
