import { APPRAISAL_STATUS } from "./constants";
import type { Goal } from "./type";

/** goal_assessment_by.assessTerm — mid/final만 인정, 그 외(예: goal_approval)는 null */
export function normGoalAssessTerm(
  raw?: string | null,
): "mid" | "final" | null {
  const t = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (t === "mid") return "mid";
  if (t === "final") return "final";
  return null;
}

export function pickGoalAssessmentForUserAndTerm(
  rows: NonNullable<Goal["goalAssessmentBy"]> | undefined,
  gradedBy: string,
  term: "mid" | "final",
) {
  return rows?.find(
    (a) =>
      a.gradedBy === gradedBy && normGoalAssessTerm(a.assessTerm) === term,
  );
}

/** 본인이 아닌 평가자(보통 팀장)의 해당 차수 목표 평가 1건 */
export function pickFirstNonOwnerGoalAssessmentForTerm(
  rows: NonNullable<Goal["goalAssessmentBy"]> | undefined,
  ownerUserId: string,
  term: "mid" | "final",
) {
  return rows?.find(
    (a) =>
      a.gradedBy !== ownerUserId &&
      normGoalAssessTerm(a.assessTerm) === term,
  );
}

export function goalHasUserAssessmentForTerm(
  goal: Goal,
  userId: string | undefined,
  term: "mid" | "final",
): boolean {
  if (!userId) return false;
  return !!goal.goalAssessmentBy?.some(
    (a) =>
      a.gradedBy === userId && normGoalAssessTerm(a.assessTerm) === term,
  );
}

/** 평가 마감일(endDate) 당일 23:59:59(로컬)까지 true — 최종 자가 평가 등 수정 허용에 사용 */
export function isAppraisalEditableByEndDate(
  endDate: string | null | undefined,
): boolean {
  // 마감일 컬럼/입력을 제거한 정책에서는 마감일이 없으면 편집을 허용한다.
  if (!endDate?.trim()) return true;
  const parsed = new Date(endDate);
  if (Number.isNaN(parsed.getTime())) return true;
  const y = parsed.getFullYear();
  const m = parsed.getMonth();
  const d = parsed.getDate();
  const endOfDeadlineDay = new Date(y, m, d, 23, 59, 59, 999);
  return Date.now() <= endOfDeadlineDay.getTime();
}

export const getStatusColor = (status: string) => {
    switch (status) {
        case APPRAISAL_STATUS.FINISHED:
            return "bg-green-100 text-green-700";
        case APPRAISAL_STATUS.ONGOING:
            return "bg-blue-100 text-blue-700";
        case APPRAISAL_STATUS.DRAFT:
            return "bg-orange-100 text-orange-700";
        default:
            return "bg-gray-100 text-gray-700";
    }
};

export const getStatusText = (status: string) => {
    switch (status) {
        case APPRAISAL_STATUS.FINISHED:
            return "완료";
        case APPRAISAL_STATUS.ONGOING:
            return "진행 중";
        case APPRAISAL_STATUS.DRAFT:
            return "대기";
        default:
            return status;
    }
};

export const sortGoalsByProgress = (
  goals: Goal[],
  currentUserId?: string,
  activeAssessTerm?: "mid" | "final" | null,
) => {
  return [...goals].sort((a, b) => {
    const aDone =
      activeAssessTerm != null && currentUserId
        ? goalHasUserAssessmentForTerm(a, currentUserId, activeAssessTerm)
        : !!a.goalAssessmentBy?.some(
            (assess) => assess.gradedBy === currentUserId,
          );
    const bDone =
      activeAssessTerm != null && currentUserId
        ? goalHasUserAssessmentForTerm(b, currentUserId, activeAssessTerm)
        : !!b.goalAssessmentBy?.some(
            (assess) => assess.gradedBy === currentUserId,
          );

    if (!aDone && bDone) return -1;
    if (aDone && !bDone) return 1;
    return 0;
  });
};
