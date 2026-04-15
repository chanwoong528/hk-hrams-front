/** 목표/역량/성과 공통: DB assessTerm 정규화 */
export function normalizeAssessTerm(
  raw: string | null | undefined,
): "mid" | "final" {
  return String(raw ?? "")
    .trim()
    .toLowerCase() === "mid"
    ? "mid"
    : "final";
}

/** HR 매크로 단계(1–5) 정규화 — API `AppraisalWorkflowService.normalizeMacroPhase` 와 동일 */
export function normalizeMacroWorkflowPhase(
  value: number | undefined | null,
): number {
  if (value == null || !Number.isFinite(Number(value))) {
    return 1;
  }
  return Math.min(5, Math.max(1, Math.floor(Number(value))));
}

/**
 * 성과 종합 자가(AppraisalBy · performance · 본인)
 * 중간=매크로 2, 기말=매크로 4
 */
export function assessTermForSelfPerformance(
  macroPhase: number | undefined | null,
): "mid" | "final" | null {
  const p = normalizeMacroWorkflowPhase(macroPhase);
  if (p === 2) return "mid";
  if (p === 4) return "final";
  return null;
}

/**
 * 역량 최종(CompetencyFinal) — 자가
 * 중간 라운드=2, 기말 라운드=4
 */
export function competencyFinalRoundForSelf(
  macroPhase: number | undefined | null,
): "mid" | "final" | null {
  const p = normalizeMacroWorkflowPhase(macroPhase);
  if (p === 2) return "mid";
  if (p === 4) return "final";
  return null;
}

/**
 * 역량 최종(CompetencyFinal) — 리더
 * 중간 라운드=3, 기말 라운드=5
 */
export function competencyFinalRoundForLeader(
  macroPhase: number | undefined | null,
): "mid" | "final" | null {
  const p = normalizeMacroWorkflowPhase(macroPhase);
  if (p === 3) return "mid";
  if (p === 5) return "final";
  return null;
}

/** 팀장이 팀원 목표(GoalAssessmentBy)를 작성·수정할 수 있는 단계 — 리더 중간/기말(3·5) */
export function canLeaderMutateMemberGoalAssessment(
  macroPhase: number | undefined | null,
): boolean {
  return competencyFinalRoundForLeader(macroPhase) !== null;
}

/** 역량 문항 자가 — 성과 자가와 동일 단계(2=중간, 4=기말) */
export function assessTermForSelfCompetency(
  macroPhase: number | undefined | null,
): "mid" | "final" | null {
  return assessTermForSelfPerformance(macroPhase);
}

/** 역량 문항 리더 — 성과 리더와 동일 단계(3=중간, 5=기말) */
export function assessTermForLeaderCompetency(
  macroPhase: number | undefined | null,
): "mid" | "final" | null {
  return assessTermForLeaderPerformance(macroPhase);
}

/** 팀장 성과 종합(AppraisalBy performance) — 중간=3, 기말=5 */
export function assessTermForLeaderPerformance(
  macroPhase: number | undefined | null,
): "mid" | "final" | null {
  return competencyFinalRoundForLeader(macroPhase);
}
