import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const COMPETENCY_FINAL_GRADES = ["O", "E", "M", "P", "N"] as const;

export function CompetencyFinalAssessmentDialog({
  open,
  onOpenChange,
  title,
  grade,
  onGradeChange,
  onSubmit,
  submitDisabled,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  grade: string;
  onGradeChange: (value: string) => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
}) {
  const gradeOptions = useMemo(() => COMPETENCY_FINAL_GRADES, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>종합 등급</Label>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="종합 등급 선택"
            >
              {gradeOptions.map((g) => {
                const isSelected = grade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    aria-label={`${g} 등급 선택`}
                    aria-pressed={isSelected}
                    onClick={() => onGradeChange(g)}
                    className={`cursor-pointer rounded-md border px-3 py-2 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
                      isSelected
                        ? "border-blue-200 bg-blue-50 text-blue-800 font-bold ring-2 ring-blue-400/40"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {g} 등급
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitDisabled}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            저장
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

