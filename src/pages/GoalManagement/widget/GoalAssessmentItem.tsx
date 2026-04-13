import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Goal as GoalIcon, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { useState, Fragment, useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Goal } from "../type";

const NEW_ASSESSMENT_ID = "NEW";

interface GoalAssessmentItemProps {
  goal: Goal;
  onSave: (
    goalId: string,
    grade: string,
    comment: string,
    gradedByUserId?: string,
    /** 사무관리직·본인 자가 평가 시 KPI 달성률 등 */
    kpiAchievementRate?: string,
  ) => void;
  disabled?: boolean;
  targetUserId?: string;
  targetUserJobGroup?: string;
  currentUserId?: string;
  isSpectator?: boolean;
  /** HR/관리자: 다른 평가자가 남긴 목표 등급 수정 */
  hrCanEditOthersGrades?: boolean;
  /** 인사팀 등: 본인 명의로 새 목표 평가 제출 불가 */
  hrCannotSubmitOwnGoalGrade?: boolean;
}

const GoalAssessmentItem = ({
  goal,
  currentUserId,
  onSave,
  disabled = false,
  targetUserId,
  targetUserJobGroup,
  isSpectator = false,
  hrCanEditOthersGrades = false,
  hrCannotSubmitOwnGoalGrade = false,
}: GoalAssessmentItemProps) => {
  const OFFICE_ADMIN_JOB_GROUP = "사무관리직";
  const isOfficeAdmin =
    (targetUserJobGroup ?? "").trim() === OFFICE_ADMIN_JOB_GROUP;

  const myAssessment = isSpectator
    ? goal.goalAssessmentBy?.[0]
    : goal.goalAssessmentBy?.find((a) => a.gradedBy === currentUserId);

  const hasUserAssessed = targetUserId
    ? goal.goalAssessmentBy?.some((a) => a.gradedBy === targetUserId)
    : true;

  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(
    null,
  );
  const [expandedAssessments, setExpandedAssessments] = useState<Set<string>>(
    new Set(),
  );

  const [grade, setGrade] = useState(myAssessment?.grade || "");
  const [comment, setComment] = useState(myAssessment?.comment || "");
  const [kpiAchievementRate, setKpiAchievementRate] = useState(
    myAssessment?.kpiAchievementRate ?? "",
  );
  const [editBadgeLabel, setEditBadgeLabel] = useState("내 평가");

  useEffect(() => {
    if (!editingAssessmentId) return;
    if (editingAssessmentId === NEW_ASSESSMENT_ID) {
      setGrade("");
      setComment("");
      setKpiAchievementRate("");
      setEditBadgeLabel("내 평가");
      return;
    }
    const row = goal.goalAssessmentBy?.find(
      (a) => a.goalAssessId === editingAssessmentId,
    );
    if (!row) return;
    setGrade(row.grade || "");
    setComment(row.comment || "");
    setKpiAchievementRate(row.kpiAchievementRate ?? "");
    const isSelfRow = targetUserId && row.gradedBy === targetUserId;
    const name =
      row.gradedByUser?.koreanName?.trim() ||
      (isSelfRow ? "본인" : "평가자");
    const isHrEdit =
      hrCanEditOthersGrades &&
      row.gradedBy !== currentUserId &&
      !isSelfRow;
    setEditBadgeLabel(isHrEdit ? `${name} 평가 수정 (HR)` : "내 평가");
  }, [
    editingAssessmentId,
    goal.goalAssessmentBy,
    targetUserId,
    currentUserId,
    hrCanEditOthersGrades,
  ]);

  const shouldOfferKpiAchievementField = (
    editId: string | null | undefined,
  ): boolean => {
    if ((targetUserJobGroup ?? "").trim() !== OFFICE_ADMIN_JOB_GROUP)
      return false;
    if (!editId) return false;
    if (editId === NEW_ASSESSMENT_ID) {
      return !targetUserId;
    }
    const row = goal.goalAssessmentBy?.find((a) => a.goalAssessId === editId);
    if (!row) return false;
    if (!targetUserId) return row.gradedBy === currentUserId;
    return row.gradedBy === targetUserId;
  };

  const handleSave = () => {
    if (!grade) {
      toast.error("등급을 선택해주세요");
      return;
    }
    const kpiPayload = shouldOfferKpiAchievementField(editingAssessmentId)
      ? kpiAchievementRate.trim()
      : undefined;
    if (editingAssessmentId === NEW_ASSESSMENT_ID) {
      onSave(goal.goalId, grade, comment, undefined, kpiPayload);
    } else if (editingAssessmentId) {
      const row = goal.goalAssessmentBy?.find(
        (a) => a.goalAssessId === editingAssessmentId,
      );
      if (!row) return;
      onSave(goal.goalId, grade, comment, row.gradedBy, kpiPayload);
    }
    setEditingAssessmentId(null);
  };

  const handleCancel = () => {
    setEditingAssessmentId(null);
    setGrade(myAssessment?.grade || "");
    setComment(myAssessment?.comment || "");
    setKpiAchievementRate(myAssessment?.kpiAchievementRate ?? "");
  };

  const toggleExpansion = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSet = new Set(expandedAssessments);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedAssessments(newSet);
  };

  const grades = (() => {
    if (isOfficeAdmin) {
      return [
        {
          value: "O",
          label: "O등급",
          desc: "",
          color: "text-purple-700 bg-purple-50 border-purple-200",
        },
        {
          value: "E",
          label: "E등급",
          desc: "",
          color: "text-blue-700 bg-blue-50 border-blue-200",
        },
        {
          value: "M",
          label: "M등급",
          desc: "",
          color: "text-green-700 bg-green-50 border-green-200",
        },
        {
          value: "P",
          label: "P등급",
          desc: "",
          color: "text-orange-700 bg-orange-50 border-orange-200",
        },
        {
          value: "N",
          label: "N등급",
          desc: "",
          color: "text-red-700 bg-red-50 border-red-200",
        },
      ];
    }
    return [
      {
        value: "A",
        label: "A등급",
        desc: "우수",
        color: "text-blue-700 bg-blue-50 border-blue-200",
      },
      {
        value: "B",
        label: "B등급",
        desc: "보통",
        color: "text-green-700 bg-green-50 border-green-200",
      },
      {
        value: "C",
        label: "C등급",
        desc: "미흡",
        color: "text-orange-700 bg-orange-50 border-orange-200",
      },
    ];
  })();

  const renderGradeReadChip = (value: string | undefined) => {
    const g = grades.find((x) => x.value === value);
    const label = g?.label ?? (value ? `${value} 등급` : "—");
    return (
      <span
        className={cn(
          "inline-flex max-w-full items-center rounded-md border px-3 py-1.5 text-sm font-semibold tabular-nums shadow-none",
          g?.color ?? "border-gray-200 bg-white text-gray-700",
        )}
        aria-label={label}>
        <span className="break-all">{g ? `${g.value} 등급` : label}</span>
      </span>
    );
  };

  const renderEditRow = (key?: string) => {
    const showKpiAchievementField =
      shouldOfferKpiAchievementField(editingAssessmentId);

    return (
      <div
        key={key}
        className="space-y-4 border-t border-blue-100 bg-blue-50/50 p-4 sm:p-5">
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {editBadgeLabel}
        </Badge>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">등급</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="등급 선택">
              {grades.map((g) => (
                <div
                  key={g.value}
                  role="button"
                  tabIndex={0}
                  aria-label={`${g.label} 선택`}
                  aria-pressed={grade === g.value}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setGrade(g.value);
                    }
                  }}
                  onClick={() => setGrade(g.value)}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-2 text-sm transition-all",
                    grade === g.value
                      ? cn(
                          g.color,
                          "font-bold ring-2 ring-blue-400/50 ring-offset-1",
                        )
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                  )}>
                  <span>{g.label}</span>
                </div>
              ))}
            </div>
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="[세부 진행 경과]. [하반기 추진 계획]"
            className="min-h-[72px] resize-y bg-white text-sm"
            aria-label="평가 코멘트"
          />
          {showKpiAchievementField ? (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600">
                KPI 달성률
              </Label>
              <Input
                value={kpiAchievementRate}
                onChange={(e) => setKpiAchievementRate(e.target.value)}
                placeholder="예: 105%, 달성 등"
                className="bg-white text-sm"
                aria-label="KPI 달성률"
              />
            </div>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              취소
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700">
              저장
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const showAddOwnRow =
    !myAssessment &&
    !hrCannotSubmitOwnGoalGrade &&
    !isSpectator &&
    editingAssessmentId !== NEW_ASSESSMENT_ID;

  return (
    <div className="min-w-0 space-y-5 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-6">
      <div className="min-w-0 space-y-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <GoalIcon className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <h4 className="break-words text-lg font-semibold leading-snug text-slate-900 [overflow-wrap:anywhere]">
              {goal.title}
            </h4>
            {goal.description?.trim() ? (
              <p className="break-words text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
                {goal.description}
              </p>
            ) : null}
          </div>
        </div>

        {isOfficeAdmin ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-x-8">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">KPI</p>
                <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-relaxed text-slate-900 [overflow-wrap:anywhere]">
                  {goal.kpi?.trim() ? goal.kpi : "—"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">목표달성</p>
                <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-relaxed text-slate-900 [overflow-wrap:anywhere]">
                  {goal.achieveIndicator?.trim() ? goal.achieveIndicator : "—"}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <section
        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        aria-label="목표별 평가">
        <div className="border-b border-slate-200 bg-slate-50/90 px-4 py-3 sm:px-5">
          <h5 className="text-xs font-semibold leading-snug text-slate-600">
            평가 내역
            <span className="mt-0.5 block font-normal text-slate-500 sm:mt-0 sm:ml-1 sm:inline">
              · 코멘트가 있으면 행을 눌러 펼칩니다
            </span>
          </h5>
        </div>

        <div className="divide-y divide-slate-100">
          {goal.goalAssessmentBy?.map((assessment) => {
            const isMe = assessment.gradedBy === currentUserId;
            const isTargetUser = assessment.gradedBy === targetUserId;
            const isLeaderRow = !!targetUserId && !isTargetUser;
            const canHrEditThisRow =
              hrCanEditOthersGrades && isLeaderRow && !isMe && !disabled;
            const showOwnPencil =
              isMe && !isSpectator && !disabled && !hrCannotSubmitOwnGoalGrade;
            const isExpanded = expandedAssessments.has(assessment.goalAssessId);

            if (editingAssessmentId === assessment.goalAssessId) {
              return renderEditRow(assessment.goalAssessId);
            }

            const name =
              assessment.gradedByUser?.koreanName ||
              (isTargetUser ? "본인" : "평가자");
            const shouldShowKpiRate =
              isTargetUser || (!targetUserId && isMe);
            const kpiRateDisplay = shouldShowKpiRate
              ? assessment.kpiAchievementRate?.trim() || "—"
              : "—";

            return (
              <Fragment key={assessment.goalAssessId}>
                <div
                  className={cn(
                    "p-4 transition-colors sm:p-5",
                    assessment.comment
                      ? "cursor-pointer hover:bg-slate-50/80"
                      : "cursor-default",
                  )}
                  onClick={(e) => {
                    if (!assessment.comment) return;
                    toggleExpansion(assessment.goalAssessId, e);
                  }}>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 gap-y-1">
                          <span
                            className={cn(
                              "break-words text-base font-semibold text-slate-900 [overflow-wrap:anywhere]",
                              !isMe && !isTargetUser && "font-medium text-slate-800",
                            )}>
                            {name}
                          </span>
                          {isTargetUser ? (
                            <Badge
                              variant="outline"
                              className="shrink-0 rounded-md border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">
                              피평가자
                            </Badge>
                          ) : isMe ? (
                            <Badge
                              variant="secondary"
                              className="shrink-0 rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                              내 평가
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {assessment.comment ? (
                          <span className="text-slate-400" aria-hidden>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </span>
                        ) : null}
                        {showOwnPencil ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 shrink-0 hover:text-blue-600"
                            aria-label="내 목표 평가 수정"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAssessmentId(assessment.goalAssessId);
                            }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        ) : null}
                        {canHrEditThisRow ? (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-9 w-9 shrink-0 hover:text-purple-600"
                            aria-label="HR — 타 평가자 등급 수정"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAssessmentId(assessment.goalAssessId);
                            }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    {isOfficeAdmin ? (
                      <dl
                        className={cn(
                          "grid grid-cols-1 gap-4",
                          shouldShowKpiRate ? "sm:grid-cols-2" : "sm:grid-cols-1",
                        )}>
                        <div className="min-w-0">
                          <dt className="text-xs font-semibold text-slate-500">
                            등급
                          </dt>
                          <dd className="mt-2 flex flex-wrap items-center gap-2">
                            {renderGradeReadChip(assessment.grade)}
                          </dd>
                        </div>
                        {shouldShowKpiRate ? (
                          <div className="min-w-0">
                            <dt className="text-xs font-semibold text-slate-500">
                              KPI 달성률
                            </dt>
                            <dd className="mt-2 break-words text-base font-semibold tabular-nums text-slate-900 [overflow-wrap:anywhere]">
                              {kpiRateDisplay}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {renderGradeReadChip(assessment.grade)}
                      </div>
                    )}
                  </div>
                </div>

                {isExpanded && assessment.comment ? (
                  <div className="border-t border-slate-100 bg-slate-50/90 px-4 py-3 sm:px-5">
                    <p className="text-xs font-semibold text-slate-500">
                      평가 코멘트
                    </p>
                    <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-relaxed text-slate-800 [overflow-wrap:anywhere]">
                      {assessment.comment}
                    </p>
                  </div>
                ) : null}
              </Fragment>
            );
          })}

          {showAddOwnRow ? (
            <div
              className={cn(
                "p-4 sm:p-5",
                !hasUserAssessed
                  ? "cursor-not-allowed bg-slate-50/90 opacity-70"
                  : "cursor-pointer hover:bg-slate-50/80",
              )}
              onClick={() => {
                if (hasUserAssessed) setEditingAssessmentId(NEW_ASSESSMENT_ID);
                else toast.error("팀원이 먼저 평가를 완료해야 합니다.");
              }}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-base font-semibold text-slate-800">
                    본인
                  </span>
                  <p className="break-words text-sm text-slate-500 [overflow-wrap:anywhere]">
                    {!hasUserAssessed
                      ? "팀원 평가 대기 중 — 팀원이 먼저 평가하면 본인 평가를 작성할 수 있습니다."
                      : targetUserId
                        ? "팀원 평가가 작성되지 않았습니다."
                        : "아직 본인 평가를 작성하지 않았습니다."}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <Button
                    size="sm"
                    disabled={!hasUserAssessed}
                    className="h-9 bg-blue-600 text-xs hover:bg-blue-700 disabled:bg-slate-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (hasUserAssessed)
                        setEditingAssessmentId(NEW_ASSESSMENT_ID);
                    }}>
                    평가하기
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {editingAssessmentId === NEW_ASSESSMENT_ID
            ? renderEditRow("new-assessment")
            : null}
        </div>
      </section>
    </div>
  );
};

export default GoalAssessmentItem;
