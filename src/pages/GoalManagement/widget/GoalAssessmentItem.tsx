import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Goal as GoalIcon, Pencil } from "lucide-react";
import { useState, Fragment, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Goal } from "../type";
import {
  normGoalAssessTerm,
  pickFirstNonOwnerGoalAssessmentForTerm,
  pickGoalAssessmentForUserAndTerm,
} from "../utils";

const newEditingKey = (term: "mid" | "final", role: "self" | "leader") =>
  `NEW:${term}:${role}`;

function parseNewEditingKey(
  key: string | null,
): { term: "mid" | "final"; role: "self" | "leader" } | null {
  if (!key?.startsWith("NEW:")) return null;
  const p = key.split(":");
  if (p.length !== 3) return null;
  const term = p[1] === "mid" ? "mid" : "final";
  const role = p[2] === "leader" ? "leader" : "self";
  return { term, role };
}

interface GoalAssessmentItemProps {
  goal: Goal;
  onSave: (
    goalId: string,
    grade: string,
    comment: string,
    gradedByUserId?: string,
    kpiAchievementRate?: string,
    assessTerm?: "mid" | "final" | "goal_approval",
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
  /** 현재 작성 가능한 차수(자가: 매크로 2·4, 팀장: 3·5). 없으면 표는 보이되 입력 비활성 */
  writableAssessTerm?: "mid" | "final" | null;
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
  writableAssessTerm = undefined,
}: GoalAssessmentItemProps) => {
  const OFFICE_ADMIN_JOB_GROUP = "사무관리직";
  const isOfficeAdmin =
    (targetUserJobGroup ?? "").trim() === OFFICE_ADMIN_JOB_GROUP;
  const isCommonGoal =
    String(goal.goalType ?? "")
      .trim()
      .toLowerCase() === "common";

  const selfUserId =
    targetUserId && currentUserId ? targetUserId : currentUserId ?? "";

  const [editingKey, setEditingKey] = useState<string | null>(null);

  const [grade, setGrade] = useState("");
  const [comment, setComment] = useState("");
  const [kpiAchievementRate, setKpiAchievementRate] = useState("");
  const [editBadgeLabel, setEditBadgeLabel] = useState("내 평가");

  const rows = goal.goalAssessmentBy ?? [];

  const peerSelfDoneForTerm = (term: "mid" | "final") =>
    !!pickGoalAssessmentForUserAndTerm(rows, selfUserId, term);

  useEffect(() => {
    if (!editingKey) return;
    const nk = parseNewEditingKey(editingKey);
    if (nk) {
      setGrade("");
      setComment("");
      setKpiAchievementRate("");
      setEditBadgeLabel(
        nk.role === "leader"
          ? `팀장 · ${nk.term === "mid" ? "중간" : "기말"}`
          : `본인 · ${nk.term === "mid" ? "중간" : "기말"}`,
      );
      return;
    }
    const row = rows.find((a) => a.goalAssessId === editingKey);
    if (!row) return;
    setGrade(row.grade || "");
    setComment(row.comment || "");
    setKpiAchievementRate(row.kpiAchievementRate ?? "");
    const isSelfRow = selfUserId && row.gradedBy === selfUserId;
    const name =
      row.gradedByUser?.koreanName?.trim() ||
      (isSelfRow ? "본인" : "평가자");
    const isHrEdit =
      hrCanEditOthersGrades &&
      row.gradedBy !== currentUserId &&
      !isSelfRow;
    const termLabel = (() => {
      const t = normGoalAssessTerm(row.assessTerm);
      if (t === "mid") return "중간";
      if (t === "final") return "기말";
      return "승인";
    })();
    setEditBadgeLabel(
      isHrEdit ? `${name} · ${termLabel} (HR)` : `${name} · ${termLabel}`,
    );
  }, [
    editingKey,
    rows,
    selfUserId,
    currentUserId,
    hrCanEditOthersGrades,
  ]);

  const shouldOfferKpiAchievementField = (
    key: string | null | undefined,
  ): boolean => {
    if ((targetUserJobGroup ?? "").trim() !== OFFICE_ADMIN_JOB_GROUP)
      return false;
    if (!key) return false;
    const nk = parseNewEditingKey(key);
    if (nk) {
      if (nk.role !== "self") return false;
      return !targetUserId;
    }
    const row = rows.find((a) => a.goalAssessId === key);
    if (!row) return false;
    if (!targetUserId) return row.gradedBy === currentUserId;
    return row.gradedBy === targetUserId;
  };

  const handleSave = () => {
    if (disabled) return;
    if (!grade) {
      toast.error("등급을 선택해주세요");
      return;
    }
    const kpiPayload = shouldOfferKpiAchievementField(editingKey)
      ? kpiAchievementRate.trim()
      : undefined;

    const nk = parseNewEditingKey(editingKey);
    if (nk) {
      if (nk.role === "leader") {
        if (!currentUserId) return;
        if (!peerSelfDoneForTerm(nk.term)) {
          toast.error("해당 차수의 팀원 본인 평가가 먼저 완료되어야 합니다.");
          return;
        }
        onSave(
          goal.goalId,
          grade,
          comment,
          currentUserId,
          kpiPayload,
          nk.term,
        );
      } else {
        if (!currentUserId) return;
        onSave(
          goal.goalId,
          grade,
          comment,
          currentUserId,
          kpiPayload,
          nk.term,
        );
      }
      setEditingKey(null);
      return;
    }

    if (editingKey) {
      const row = rows.find((a) => a.goalAssessId === editingKey);
      if (!row) return;
      onSave(
        goal.goalId,
        grade,
        comment,
        row.gradedBy,
        kpiPayload,
        normGoalAssessTerm(row.assessTerm) ?? "final",
      );
    }
    setEditingKey(null);
  };

  const handleCancel = () => {
    setEditingKey(null);
    setGrade("");
    setComment("");
    setKpiAchievementRate("");
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

  const renderEditRow = () => {
    const showKpiAchievementField = shouldOfferKpiAchievementField(editingKey);

    return (
      <div className="space-y-4 border-t border-blue-100 bg-blue-50/50 p-4 sm:p-5">
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
          {editBadgeLabel}
        </Badge>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold text-slate-600">등급</p>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="등급 선택">
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

  const slotCanWrite = (term: "mid" | "final") =>
    !disabled &&
    !isSpectator &&
    writableAssessTerm != null &&
    writableAssessTerm === term &&
    !hrCannotSubmitOwnGoalGrade;

  const slotEditableSelf = (term: "mid" | "final") =>
    slotCanWrite(term) && !targetUserId;

  const slotEditableLeader = (term: "mid" | "final") =>
    slotCanWrite(term) &&
    !!targetUserId &&
    peerSelfDoneForTerm(term);

  const canHrEditAssessment = (
    a: NonNullable<Goal["goalAssessmentBy"]>[number],
  ) =>
    hrCanEditOthersGrades &&
    !disabled &&
    !isSpectator &&
    a.gradedBy !== selfUserId;

  const renderAssessmentCell = (args: {
    term: "mid" | "final";
    role: "self" | "leader";
  }) => {
    const { term, role } = args;
    const isSelfCol = role === "self";
    const selfAssessment = pickGoalAssessmentForUserAndTerm(rows, selfUserId, term);

    const leaderRowsForTerm = rows
      .filter(
        (a) =>
          a.gradedBy !== selfUserId && normGoalAssessTerm(a.assessTerm) === term,
      )
      .sort((a, b) => {
        const at = new Date(a.updated ?? a.created ?? "").getTime();
        const bt = new Date(b.updated ?? b.created ?? "").getTime();
        return bt - at;
      });

    const myLeaderRow =
      currentUserId && !isSelfCol
        ? leaderRowsForTerm.find((a) => a.gradedBy === currentUserId)
        : undefined;

    const canWriteNew = isSelfCol
      ? slotEditableSelf(term) && !selfAssessment
      : slotEditableLeader(term) && !myLeaderRow;

    const isLeaderCell = !isSelfCol;
    const hasAnyRow = isSelfCol ? !!selfAssessment : leaderRowsForTerm.length > 0;
    const leaderNewEditingKey = newEditingKey(term, "leader");
    const isInlineLeaderNewEditing =
      isLeaderCell && editingKey === leaderNewEditingKey;

    if (!isLeaderCell) {
      const row = selfAssessment;
      const showNew = canWriteNew;
      const selfNewEditingKey = newEditingKey(term, "self");
      const isInlineSelfNewEditing = editingKey === selfNewEditingKey;
      const isInlineSelfRowEditing = !!row && editingKey === row.goalAssessId;
      const isInlineSelfEditing = isInlineSelfNewEditing || isInlineSelfRowEditing;
      const showKpiAchievementField = shouldOfferKpiAchievementField(editingKey);
      const showPencilOwn =
        !!row &&
        !disabled &&
        !isSpectator &&
        writableAssessTerm != null &&
        writableAssessTerm === term &&
        !hrCannotSubmitOwnGoalGrade &&
        row.gradedBy === selfUserId &&
        !targetUserId;
      const showHrPencil = !!row && canHrEditAssessment(row);

      const shouldShowKpiRate =
        isOfficeAdmin && row && row.gradedBy === selfUserId;
      const kpiRateDisplay = shouldShowKpiRate
        ? row.kpiAchievementRate?.trim() || "—"
        : null;

      return (
        <td className="border border-slate-200 bg-white p-2 align-top sm:p-3">
          {!row ? (
            isInlineSelfNewEditing ? (
              <div className="space-y-3 rounded-md border border-blue-200 bg-blue-50/60 p-3">
                <p className="text-xs font-semibold text-blue-800">
                  본인평가 입력 필요
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="등급 선택">
                  {grades.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGrade(g.value)}
                      className={cn(
                        "rounded-md border px-2.5 py-1.5 text-xs",
                        grade === g.value
                          ? cn(g.color, "font-bold ring-2 ring-blue-400/50")
                          : "border-gray-200 bg-white text-gray-600",
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="본인평가 코멘트를 입력하세요."
                  className="min-h-[72px] resize-y bg-white text-sm"
                  aria-label="본인평가 코멘트"
                />
                {showKpiAchievementField ? (
                  <Input
                    value={kpiAchievementRate}
                    onChange={(e) => setKpiAchievementRate(e.target.value)}
                    placeholder="KPI 달성률"
                    className="bg-white text-sm"
                    aria-label="KPI 달성률"
                  />
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={handleCancel}>
                    취소
                  </Button>
                  <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[72px] flex-col items-stretch justify-center gap-2">
                <span className="text-center text-xs text-slate-400">—</span>
                {showNew ? (
                  <Button
                    size="sm"
                    variant="default"
                    className="h-9 text-sm bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => setEditingKey(selfNewEditingKey)}
                  >
                    본인 입력
                  </Button>
                ) : null}
              </div>
            )
          ) : (
            isInlineSelfEditing ? (
              <div className="space-y-3 rounded-md border border-blue-200 bg-blue-50/60 p-3">
                <p className="text-xs font-semibold text-blue-800">
                  본인평가 수정
                </p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="등급 선택">
                  {grades.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGrade(g.value)}
                      className={cn(
                        "rounded-md border px-2.5 py-1.5 text-xs",
                        grade === g.value
                          ? cn(g.color, "font-bold ring-2 ring-blue-400/50")
                          : "border-gray-200 bg-white text-gray-600",
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="본인평가 코멘트를 입력하세요."
                  className="min-h-[72px] resize-y bg-white text-sm"
                  aria-label="본인평가 코멘트"
                />
                {showKpiAchievementField ? (
                  <Input
                    value={kpiAchievementRate}
                    onChange={(e) => setKpiAchievementRate(e.target.value)}
                    placeholder="KPI 달성률"
                    className="bg-white text-sm"
                    aria-label="KPI 달성률"
                  />
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={handleCancel}>
                    취소
                  </Button>
                  <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                    저장
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-start justify-end gap-1">
                    {showPencilOwn ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 hover:text-blue-600"
                        aria-label="목표 평가 수정"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingKey(row.goalAssessId);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                    {showHrPencil ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 shrink-0 hover:text-purple-600"
                        aria-label="HR — 타 평가자 등급 수정"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingKey(row.goalAssessId);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                  {isOfficeAdmin ? (
                    <dl className="grid grid-cols-1 gap-2">
                      <div>
                        <dt className="text-[10px] font-semibold text-slate-500">
                          등급
                        </dt>
                        <dd className="mt-1 flex flex-wrap">
                          {renderGradeReadChip(row.grade)}
                        </dd>
                      </div>
                      {kpiRateDisplay != null ? (
                        <div>
                          <dt className="text-[10px] font-semibold text-slate-500">
                            KPI 달성률
                          </dt>
                          <dd className="mt-1 text-xs font-semibold tabular-nums text-slate-900">
                            {kpiRateDisplay}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : (
                    <div className="flex flex-wrap justify-center sm:justify-start">
                      {renderGradeReadChip(row.grade)}
                    </div>
                  )}
                </div>
                {row.comment ? (
                  <div className="rounded-md border border-slate-100 bg-slate-50/90 p-2">
                    <p className="text-[10px] font-semibold text-slate-500">
                      코멘트
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-800 [overflow-wrap:anywhere]">
                      {row.comment}
                    </p>
                  </div>
                ) : null}
              </div>
            )
          )}
        </td>
      );
    }

    // Leader cell: show list (team leader + upper leaders) for this term.
    return (
      <td className="border border-slate-200 bg-white p-2 align-top sm:p-3">
        {!hasAnyRow ? (
          isInlineLeaderNewEditing ? (
            <div className="space-y-3 rounded-md border border-blue-200 bg-blue-50/60 p-3">
              <p className="text-xs font-semibold text-blue-800">
                1차평가 입력 필요
              </p>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="등급 선택"
              >
                {grades.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGrade(g.value)}
                    className={cn(
                      "rounded-md border px-2.5 py-1.5 text-xs",
                      grade === g.value
                        ? cn(g.color, "font-bold ring-2 ring-blue-400/50")
                        : "border-gray-200 bg-white text-gray-600",
                    )}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="1차평가 코멘트를 입력하세요."
                className="min-h-[72px] resize-y bg-white text-sm"
                aria-label="1차평가 코멘트"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  취소
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  저장
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[72px] flex-col items-stretch justify-center gap-2">
              <p className="text-center text-xs font-semibold text-amber-700">
                아직 1차평가가 없습니다
              </p>
              {canWriteNew ? (
                <Button
                  size="sm"
                  variant="default"
                  className="h-9 text-sm bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={() => setEditingKey(leaderNewEditingKey)}
                >
                  1차평가 입력
                </Button>
              ) : (
                <span className="text-center text-xs text-slate-400">—</span>
              )}
            </div>
          )
        ) : (
          <div className="space-y-2">
            <div className="flex flex-wrap items-start justify-end gap-1">
              {canWriteNew && !isInlineLeaderNewEditing ? (
                <Button
                  size="sm"
                  variant="default"
                  className="h-8 px-3 text-xs bg-amber-600 hover:bg-amber-700 text-white"
                  aria-label="리더 목표 평가 입력"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingKey(leaderNewEditingKey);
                  }}
                >
                  1차평가 입력
                </Button>
              ) : null}
              {myLeaderRow ? (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 shrink-0 hover:text-blue-600"
                  aria-label="내 리더 목표 평가 수정"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingKey(myLeaderRow.goalAssessId);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              ) : null}
            </div>
            {isInlineLeaderNewEditing ? (
              <div className="space-y-3 rounded-md border border-blue-200 bg-blue-50/60 p-3">
                <p className="text-xs font-semibold text-blue-800">
                  1차평가 입력 필요
                </p>
                <div
                  className="flex flex-wrap gap-2"
                  role="group"
                  aria-label="등급 선택"
                >
                  {grades.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGrade(g.value)}
                      className={cn(
                        "rounded-md border px-2.5 py-1.5 text-xs",
                        grade === g.value
                          ? cn(g.color, "font-bold ring-2 ring-blue-400/50")
                          : "border-gray-200 bg-white text-gray-600",
                      )}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="1차평가 코멘트를 입력하세요."
                  className="min-h-[72px] resize-y bg-white text-sm"
                  aria-label="1차평가 코멘트"
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={handleCancel}>
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    저장
                  </Button>
                </div>
              </div>
            ) : null}

            <ul className="space-y-2">
              {leaderRowsForTerm.map((r) => {
                const name =
                  r.gradedByUser?.koreanName?.trim() ||
                  `평가자 ${String(r.gradedBy).slice(0, 8)}…`;
                const showHrPencil = canHrEditAssessment(r);
                const isMe = !!currentUserId && r.gradedBy === currentUserId;
                const isEditingThisRow = editingKey === r.goalAssessId;
                return (
                  <li
                    key={r.goalAssessId}
                    className="rounded-md border border-slate-100 bg-slate-50/60 p-2"
                  >
                    {isEditingThisRow ? (
                      <div className="space-y-3 rounded-md border border-blue-200 bg-blue-50/60 p-3">
                        <p className="text-xs font-semibold text-blue-800">
                          {name}
                          {isMe ? " (나)" : ""} · 1차평가 수정
                        </p>
                        <div
                          className="flex flex-wrap gap-2"
                          role="group"
                          aria-label="등급 선택"
                        >
                          {grades.map((g) => (
                            <button
                              key={g.value}
                              type="button"
                              onClick={() => setGrade(g.value)}
                              className={cn(
                                "rounded-md border px-2.5 py-1.5 text-xs",
                                grade === g.value
                                  ? cn(g.color, "font-bold ring-2 ring-blue-400/50")
                                  : "border-gray-200 bg-white text-gray-600",
                              )}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                        <Textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="1차평가 코멘트를 입력하세요."
                          className="min-h-[72px] resize-y bg-white text-sm"
                          aria-label="1차평가 코멘트"
                        />
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={handleCancel}>
                            취소
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleSave}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            저장
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold text-slate-600 truncate">
                              {name}
                              {isMe ? " (나)" : ""}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              {renderGradeReadChip(r.grade)}
                            </div>
                          </div>
                          <div className="shrink-0 flex items-center gap-1">
                            {showHrPencil ? (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 shrink-0 hover:text-purple-600"
                                aria-label="HR — 타 평가자 등급 수정"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingKey(r.goalAssessId);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
                          </div>
                        </div>

                        {r.comment?.trim() ? (
                          <div className="mt-2 rounded-md border border-slate-100 bg-white p-2">
                            <p className="text-[10px] font-semibold text-slate-500">
                              코멘트
                            </p>
                            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-800 [overflow-wrap:anywhere]">
                              {r.comment}
                            </p>
                          </div>
                        ) : null}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </td>
    );
  };

  const goalApproval = useMemo(() => {
    const currentVersion = Math.floor(Number(goal.approvalVersion ?? 1)) || 1;
    const approvals = (rows ?? []).filter(
      (a) =>
        String(a.assessTerm ?? "")
          .trim()
          .toLowerCase() === "goal_approval" && a.gradedBy !== selfUserId,
    );
    if (approvals.length === 0) return null;
    const currentRows = approvals.filter(
      (a) => (a.targetApprovalVersion ?? -1) === currentVersion,
    );
    if (currentRows.length === 0) return null;
    const sorted = [...currentRows].sort((a, b) => {
      const at = new Date(a.updated ?? a.created ?? "").getTime();
      const bt = new Date(b.updated ?? b.created ?? "").getTime();
      return bt - at;
    });
    return sorted[0];
  }, [rows, selfUserId, goal.approvalVersion]);

  const goalApprovalStatus = (() => {
    const g = String(goalApproval?.grade ?? "")
      .trim()
      .toUpperCase();
    if (g === "T") return "approved" as const;
    if (g === "F") return "rejected" as const;
    return "pending" as const;
  })();

  const shouldRenderBottomEditor = false;

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

      {/* 목표 승인 정보는 한 줄 요약으로 축소 (핵심은 목표 설명 + 평가표) */}
      <div className="flex flex-wrap items-center gap-2 text-xs" role="status">
        {isCommonGoal ? (
          <Badge className="h-6 rounded-full bg-slate-100 px-2 text-slate-700 hover:bg-slate-100 border-none">
            공통 목표
          </Badge>
        ) : (
          <>
            <span className="font-semibold text-slate-500">목표 승인</span>
            {goalApprovalStatus === "approved" ? (
              <Badge className="h-6 rounded-full bg-emerald-100 px-2 text-emerald-800 hover:bg-emerald-100 border-none">
                승인(T)
              </Badge>
            ) : goalApprovalStatus === "rejected" ? (
              <Badge className="h-6 rounded-full bg-red-100 px-2 text-red-800 hover:bg-red-100 border-none">
                반려(F)
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="h-6 rounded-full px-2 text-slate-600">
                승인 대기
              </Badge>
            )}
            {goalApproval?.gradedByUser?.koreanName?.trim() ? (
              <span className="text-slate-600">
                · {goalApproval.gradedByUser.koreanName}
              </span>
            ) : null}
            {goalApprovalStatus === "rejected" && goalApproval?.comment?.trim() ? (
              <span className="w-full text-red-700 [overflow-wrap:anywhere]">
                반려 사유: {goalApproval.comment}
              </span>
            ) : null}
          </>
        )}
      </div>

      <section
        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        aria-label="목표별 평가">
        <Accordion type="multiple" defaultValue={["mid", "final"]} className="w-full">
          <AccordionItem value="mid" className="border-b border-slate-200">
            <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-slate-800 hover:no-underline">
              중간평가
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <tbody>
                  <tr>
                    <th
                      className="w-[96px] border border-slate-200 bg-slate-100/80 px-2 py-2 text-center text-xs font-bold text-slate-800 align-top"
                      scope="row"
                    >
                      본인평가
                    </th>
                    {renderAssessmentCell({ term: "mid", role: "self" })}
                  </tr>
                  <tr>
                    <th
                      className="w-[96px] border border-slate-200 bg-slate-100/80 px-2 py-2 text-center text-xs font-bold text-slate-800 align-top"
                      scope="row"
                    >
                      1차평가
                    </th>
                    {renderAssessmentCell({ term: "mid", role: "leader" })}
                  </tr>
                </tbody>
              </table>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="final" className="border-b-0">
            <AccordionTrigger className="px-4 py-3 text-sm font-semibold text-slate-800 hover:no-underline">
              최종평가
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <tbody>
                  <tr>
                    <th
                      className="w-[96px] border border-slate-200 bg-slate-100/80 px-2 py-2 text-center text-xs font-bold text-slate-800 align-top"
                      scope="row"
                    >
                      본인평가
                    </th>
                    {renderAssessmentCell({ term: "final", role: "self" })}
                  </tr>
                  <tr>
                    <th
                      className="w-[96px] border border-slate-200 bg-slate-100/80 px-2 py-2 text-center text-xs font-bold text-slate-800 align-top"
                      scope="row"
                    >
                      1차평가
                    </th>
                    {renderAssessmentCell({ term: "final", role: "leader" })}
                  </tr>
                </tbody>
              </table>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {shouldRenderBottomEditor ? <Fragment>{renderEditRow()}</Fragment> : null}
      </section>
    </div>
  );
};

export default GoalAssessmentItem;
