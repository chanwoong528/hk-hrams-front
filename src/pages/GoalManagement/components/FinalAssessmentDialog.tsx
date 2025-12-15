import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { GRADES } from "../constants";

interface FinalAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade: string;
  onGradeChange: (value: string) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
}

export function FinalAssessmentDialog({
  open,
  onOpenChange,
  grade,
  onGradeChange,
  comment,
  onCommentChange,
  onSubmit,
}: FinalAssessmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>최종 자가 평가 (Self Appraisal)</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label>종합 등급 (Overall Grade)</Label>
            <Select value={grade} onValueChange={onGradeChange}>
              <SelectTrigger>
                <SelectValue placeholder='등급 선택' />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map((g) => (
                  <SelectItem key={g.value} value={g.value}>
                    {g.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
