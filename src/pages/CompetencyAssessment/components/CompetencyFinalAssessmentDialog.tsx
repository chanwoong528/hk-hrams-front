import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const COMPETENCY_FINAL_GRADES = ["O", "E", "M", "P", "N"] as const;

export type CompetencyFinalPeerSnapshot = {
  grade: string;
  updated?: string;
};

function CompetencyRoundReadOnly({
  title,
  data,
}: {
  title: string;
  data: CompetencyFinalPeerSnapshot;
}) {
  const g = (data.grade ?? "").trim();
  if (!g) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-4">
        {title.trim() ? (
          <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        ) : null}
        <p className={`text-xs text-slate-500 ${title.trim() ? "mt-2" : ""}`}>
          아직 제출된 등급이 없습니다.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {title.trim() ? (
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
        ) : (
          <span className="text-xs font-medium text-slate-600">제출 등급</span>
        )}
        {data.updated ? (
          <span className="text-[10px] text-slate-500">
            {new Date(data.updated).toLocaleString("ko-KR")}
          </span>
        ) : null}
      </div>
      <Badge variant="outline" className="bg-white font-semibold">
        {g} 등급
      </Badge>
    </div>
  );
}

export function CompetencyFinalAssessmentDialog({
  open,
  onOpenChange,
  title,
  grade,
  onGradeChange,
  onSubmit,
  submitDisabled,
  activeRound = null,
  peerSnapshots,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  grade: string;
  onGradeChange: (value: string) => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
  activeRound?: "mid" | "final" | null;
  peerSnapshots?: {
    mid?: CompetencyFinalPeerSnapshot;
    final?: CompetencyFinalPeerSnapshot;
  };
}) {
  const gradeOptions = useMemo(() => COMPETENCY_FINAL_GRADES, []);

  const useSplit =
    activeRound === "mid" || activeRound === "final";

  const renderPicker = () => (
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
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {useSplit ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900">
                  역량 중간 최종
                </h3>
                {activeRound === "mid" ? (
                  <>
                    <Label>종합 등급</Label>
                    {renderPicker()}
                  </>
                ) : peerSnapshots?.mid ? (
                  <CompetencyRoundReadOnly
                    title=""
                    data={peerSnapshots.mid}
                  />
                ) : (
                  <p className="text-xs text-slate-500">중간 차수 제출 없음</p>
                )}
              </div>
              <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900">
                  역량 기말 최종
                </h3>
                {activeRound === "final" ? (
                  <>
                    <Label>종합 등급</Label>
                    {renderPicker()}
                  </>
                ) : peerSnapshots?.final ? (
                  <CompetencyRoundReadOnly
                    title=""
                    data={peerSnapshots.final}
                  />
                ) : (
                  <p className="text-xs text-slate-500">기말 차수 제출 없음</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>종합 등급</Label>
              {renderPicker()}
            </div>
          )}
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
