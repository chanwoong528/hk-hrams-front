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
import { Badge } from "@/components/ui/badge";
import { getFinalOverallGradeButtonOptions } from "../constants";
import type { PerformanceSummarySnapshot } from "../type";

function PerformanceRoundReadOnly({
  title,
  data,
}: {
  title: string;
  data: PerformanceSummarySnapshot;
}) {
  const hasBody =
    (data.grade ?? "").trim().length > 0 || (data.comment ?? "").trim().length > 0;
  if (!hasBody) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/60 p-4">
        {title.trim() ? (
          <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        ) : null}
        <p className={`text-xs text-slate-500 ${title.trim() ? "mt-2" : ""}`}>
          아직 제출된 내용이 없습니다.
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
          <span className="text-xs font-medium text-slate-600">제출 내역</span>
        )}
        {data.updated ? (
          <span className="text-[10px] text-slate-500">
            {new Date(data.updated).toLocaleString("ko-KR")}
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-600">등급</span>
        <Badge variant="outline" className="bg-white font-semibold">
          {(data.grade ?? "").trim() || "—"}등급
        </Badge>
      </div>
      <div>
        <p className="text-xs font-medium text-slate-600 mb-1">코멘트</p>
        <p className="text-sm text-slate-800 whitespace-pre-wrap rounded-md border border-slate-100 bg-white p-2 min-h-[72px]">
          {(data.comment ?? "").trim() || "—"}
        </p>
      </div>
    </div>
  );
}

interface FinalAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** 평가 대상(본인) 직군 — 사무관리직이면 종합 등급 O/E/M/P/N, 아니면 A/B/C */
  jobGroup?: string | null;
  grade: string;
  onGradeChange: (value: string) => void;
  comment: string;
  onCommentChange: (value: string) => void;
  onSubmit: () => void;
  /** 워크플로에 따라 편집 중인 차수 (mid | final) */
  activeAssessTerm?: "mid" | "final" | null;
  /** 중간·기말 제출 스냅샷(다른 차수는 읽기 전용으로 병렬 표시) */
  peerSelfRounds?: {
    mid?: PerformanceSummarySnapshot;
    final?: PerformanceSummarySnapshot;
  };
}

export function FinalAssessmentDialog({
  open,
  onOpenChange,
  title = "최종 자가 평가 (Self Appraisal)",
  jobGroup,
  grade,
  onGradeChange,
  comment,
  onCommentChange,
  onSubmit,
  activeAssessTerm = null,
  peerSelfRounds,
}: FinalAssessmentDialogProps) {
  const gradeButtons = useMemo(
    () => getFinalOverallGradeButtonOptions(jobGroup),
    [jobGroup],
  );

  const useSplitLayout =
    activeAssessTerm === "mid" || activeAssessTerm === "final";

  const renderGradePicker = () => (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="종합 등급 선택"
    >
      {gradeButtons.map((g) => {
        const isSelected = grade === g.value;
        return (
          <button
            key={g.value}
            type="button"
            aria-label={`${g.label} 선택`}
            aria-pressed={isSelected}
            onClick={() => onGradeChange(g.value)}
            className={`cursor-pointer px-3 py-1.5 rounded-md border text-sm transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              isSelected
                ? `${g.color} ring-2 ring-blue-400 font-bold`
                : "border-gray-200 bg-white hover:border-gray-300 text-gray-600"
            }`}
          >
            <span className="font-semibold">{g.value}</span>
            {g.desc ? (
              <span className="text-xs opacity-80">{g.desc}</span>
            ) : null}
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
          {useSplitLayout ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900">
                  중간 성과 자가 평가
                </h3>
                {activeAssessTerm === "mid" ? (
                  <>
                    <Label>종합 등급</Label>
                    {renderGradePicker()}
                  </>
                ) : peerSelfRounds?.mid ? (
                  <PerformanceRoundReadOnly
                    title=""
                    data={peerSelfRounds.mid}
                  />
                ) : (
                  <p className="text-xs text-slate-500">중간 차수 제출 내역이 없습니다.</p>
                )}
              </div>
              <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900">
                  기말 성과 자가 평가
                </h3>
                {activeAssessTerm === "final" ? (
                  <>
                    <Label>종합 등급</Label>
                    {renderGradePicker()}
                  </>
                ) : peerSelfRounds?.final ? (
                  <PerformanceRoundReadOnly
                    title=""
                    data={peerSelfRounds.final}
                  />
                ) : (
                  <p className="text-xs text-slate-500">기말 차수 제출 내역이 없습니다.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>종합 등급 (Overall Grade)</Label>
              {renderGradePicker()}
            </div>
          )}
          <div className="space-y-2">
            <Label>종합 코멘트 (Overall Comment)</Label>
            <Textarea
              placeholder="본인의 성과에 대한 종합적인 의견을 작성해주세요."
              value={comment}
              onChange={(e) => onCommentChange(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            onClick={onSubmit}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            평가 제출
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
