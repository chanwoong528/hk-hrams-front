import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Goal as GoalIcon, Pencil, ChevronDown, ChevronUp } from "lucide-react";
import { useState, Fragment, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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

  const selfUserId =
    targetUserId && currentUserId ? targetUserId : currentUserId ?? "";

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [expandedAssessments, setExpandedAssessments] = useState<Set<string>>(
    new Set(),
  );

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
    const assessment = isSelfCol
      ? pickGoalAssessmentForUserAndTerm(rows, selfUserId, term)
      : currentUserId
        ? pickGoalAssessmentForUserAndTerm(rows, currentUserId, term)
        : undefined;

    const displayLeader =
      !isSelfCol && !targetUserId
        ? pickFirstNonOwnerGoalAssessmentForTerm(rows, selfUserId, term)
        : assessment;

    const row = isSelfCol ? assessment : targetUserId ? assessment : displayLeader;

    const isExpanded = row ? expandedAssessments.has(row.goalAssessId) : false;
    const canWriteNew = isSelfCol
      ? slotEditableSelf(term)
      : slotEditableLeader(term);
    const showNew = canWriteNew && !row;
    const showPencilOwn =
      canWriteNew &&
      !!row &&
      row.gradedBy === (isSelfCol ? selfUserId : currentUserId);
    const showHrPencil = !!row && canHrEditAssessment(row);

    const shouldShowKpiRate =
      isOfficeAdmin &&
      row &&
      (row.gradedBy === selfUserId ||
        (!targetUserId && row.gradedBy === currentUserId));
    const kpiRateDisplay = shouldShowKpiRate
      ? row.kpiAchievementRate?.trim() || "—"
      : null;

    return (
      <td className="border border-slate-200 bg-white p-2 align-top sm:p-3">
        {!row ? (
          <div className="flex min-h-[72px] flex-col items-stretch justify-center gap-2">
            <span className="text-center text-xs text-slate-400">—</span>
            {showNew ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() =>
                  setEditingKey(newEditingKey(term, role))
                }>
                입력
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            <div
              className={cn(
                "flex flex-col gap-2",
                row.comment ? "cursor-pointer" : "",
              )}
              onClick={() => {
                if (row.comment) toggleExpansion(row.goalAssessId);
              }}>
              <div className="flex flex-wrap items-start justify-end gap-1">
                {row.comment ? (
                  <span className="text-slate-400" aria-hidden>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </span>
                ) : null}
                {showPencilOwn ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 hover:text-blue-600"
                    aria-label="목표 평가 수정"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingKey(row.goalAssessId);
                    }}>
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
                    }}>
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
            {isExpanded && row.comment ? (
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
        )}
      </td>
    );
  };

  const definitionText = [goal.title, goal.description?.trim()]
    .filter(Boolean)
    .join("\n\n");

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

      {/* 목표 승인(신규 2단계) — 기존 중간/기말 평가와 분리 노출 */}
      <div
        className={cn(
          "rounded-xl border px-4 py-3 text-sm",
          goalApprovalStatus === "approved"
            ? "border-emerald-200 bg-emerald-50/70 text-emerald-950"
            : goalApprovalStatus === "rejected"
              ? "border-red-200 bg-red-50/70 text-red-950"
              : "border-slate-200 bg-slate-50/70 text-slate-800",
        )}
        role="status"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs font-bold uppercase tracking-wide opacity-80">
              목표 승인
            </p>
            <p className="text-sm font-semibold">
              {goalApprovalStatus === "approved"
                ? "승인 완료 (T)"
                : goalApprovalStatus === "rejected"
                  ? "거절됨 (F) — 목표 수정이 필요합니다"
                  : "승인 대기"}
              {goalApproval?.gradedByUser?.koreanName?.trim()
                ? ` · ${goalApproval.gradedByUser.koreanName}`
                : null}
            </p>
          </div>
          {goalApprovalStatus === "approved" ? (
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">
              T
            </Badge>
          ) : goalApprovalStatus === "rejected" ? (
            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none">
              F
            </Badge>
          ) : (
            <Badge variant="outline" className="text-slate-600">
              대기
            </Badge>
          )}
        </div>

        {goalApprovalStatus === "rejected" && goalApproval?.comment?.trim() ? (
          <div className="mt-2 rounded-md border border-red-100 bg-white/60 px-3 py-2">
            <p className="text-[11px] font-semibold text-red-700">거절 사유</p>
            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-900 [overflow-wrap:anywhere]">
              {goalApproval.comment}
            </p>
            <p className="mt-2 text-[11px] text-slate-600">
              목표를 수정·저장하면 기존 승인/거절은 무효화되고, 다시 승인을 받아야
              합니다.
            </p>
          </div>
        ) : null}
      </div>

      <section
        className="overflow-hidden rounded-xl border border-slate-200 bg-white"
        aria-label="목표별 평가">
        <div className="border-b border-slate-200 bg-slate-50/90 px-4 py-3 sm:px-5">
          <h5 className="text-xs font-semibold leading-snug text-slate-600">
            중간·기말 목표 평가
            <span className="mt-0.5 block font-normal text-slate-500 sm:mt-0 sm:ml-1 sm:inline">
              · 코멘트가 있으면 셀을 눌러 펼칩니다
            </span>
          </h5>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-100/80">
                <th
                  rowSpan={2}
                  className="border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 sm:px-4 sm:py-3"
                  scope="col">
                  목표 정의
                </th>
                <th
                  colSpan={2}
                  className="border border-slate-200 px-2 py-2 text-center text-xs font-bold text-slate-800 sm:px-3"
                  scope="colgroup">
                  중간평가
                </th>
                <th
                  colSpan={2}
                  className="border border-slate-200 px-2 py-2 text-center text-xs font-bold text-slate-800 sm:px-3"
                  scope="colgroup">
                  최종평가
                </th>
              </tr>
              <tr className="bg-slate-50">
                <th
                  className="border border-slate-200 px-2 py-2 text-center text-[11px] font-semibold text-slate-600 sm:text-xs"
                  scope="col">
                  본인평가
                </th>
                <th
                  className="border border-slate-200 px-2 py-2 text-center text-[11px] font-semibold text-slate-600 sm:text-xs"
                  scope="col">
                  1차평가
                </th>
                <th
                  className="border border-slate-200 px-2 py-2 text-center text-[11px] font-semibold text-slate-600 sm:text-xs"
                  scope="col">
                  본인평가
                </th>
                <th
                  className="border border-slate-200 px-2 py-2 text-center text-[11px] font-semibold text-slate-600 sm:text-xs"
                  scope="col">
                  1차평가
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="max-w-[280px] border border-slate-200 bg-white p-3 align-top text-xs leading-relaxed text-slate-800 sm:max-w-[360px] sm:p-4 sm:text-sm [overflow-wrap:anywhere] whitespace-pre-wrap">
                  {definitionText}
                </td>
                {renderAssessmentCell({ term: "mid", role: "self" })}
                {renderAssessmentCell({ term: "mid", role: "leader" })}
                {renderAssessmentCell({ term: "final", role: "self" })}
                {renderAssessmentCell({ term: "final", role: "leader" })}
              </tr>
            </tbody>
          </table>
        </div>

        {editingKey ? <Fragment>{renderEditRow()}</Fragment> : null}
      </section>
    </div>
  );
};

export default GoalAssessmentItem;
