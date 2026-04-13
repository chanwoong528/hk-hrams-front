import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { getFinalOverallGradeButtonOptions } from "../constants";

interface FinalAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 평가 대상(본인) 직군 — 사무관리직이면 종합 등급 O/E/M/P/N, 아니면 A/B/C */
  jobGroup?: string | null;
  grade: string;
  onGradeChange: (value: string) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
}

export function FinalAssessmentDialog({
  open,
  onOpenChange,
  jobGroup,
  grade,
  onGradeChange,
  comment,
  onCommentChange,
  onSubmit,
}: FinalAssessmentDialogProps) {
  const gradeButtons = useMemo(
    () => getFinalOverallGradeButtonOptions(jobGroup),
    [jobGroup],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>최종 자가 평가 (Self Appraisal)</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label>종합 등급 (Overall Grade)</Label>
            <div
              className='flex flex-wrap gap-2'
              role='group'
              aria-label='종합 등급 선택'>
              {gradeButtons.map((g) => {
                const isSelected = grade === g.value;
                return (
                  <button
                    key={g.value}
                    type='button'
                    aria-label={`${g.label} 선택`}
                    aria-pressed={isSelected}
                    onClick={() => onGradeChange(g.value)}
                    className={`cursor-pointer px-3 py-1.5 rounded-md border text-sm transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                      isSelected
                        ? `${g.color} ring-2 ring-blue-400 font-bold`
                        : "border-gray-200 bg-white hover:border-gray-300 text-gray-600"
                    }`}>
                    <span className='font-semibold'>{g.value}</span>
                    {g.desc ? (
                      <span className='text-xs opacity-80'>{g.desc}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
          <div className='space-y-2'>
            <Label>종합 코멘트 (Overall Comment)</Label>
            <Textarea
              placeholder='본인의 성과에 대한 종합적인 의견을 작성해주세요.'
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              className='min-h-[120px]'
            />
          </div>
        </div>
        <div className='flex justify-end gap-2'>
          <Button variant='ghost' onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={onSubmit}
            className='bg-indigo-600 hover:bg-indigo-700 text-white'>
            평가 제출
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
