import { http } from "@/api";

export interface CompetencyReportItem {
    competencyId: string;
    question: string;
    department: string;
    selfGrade?: string;
    selfComment?: string;
    leaderGrade?: string;
    leaderComment?: string;
    leaderName?: string;
    /** 신규: 평가자별 전체 기록 */
    evaluations?: {
        evaluatorId: string;
        evaluatorName: string;
        grade: string | null;
        comment: string | null;
        isSelf: boolean;
        assessTerm?: string;
    }[];
}

export interface GoalReportItem {
    goalId: string;
    title: string;
    description: string;
    goalType: string;
    selfGrade?: string;
    selfComment?: string;
    leaderGrade?: string;
    leaderComment?: string;
    leaderName?: string;
    /** 신규: 평가자별 전체 기록 */
    evaluations?: {
        evaluatorId: string;
        evaluatorName: string;
        grade: string | null;
        comment: string | null;
        isSelf: boolean;
        assessTerm?: string;
    }[];
}

export interface FinalAssessmentItem {
    appraisalById: string;
    assessType: string;
    assessTerm: string;
    grade: string;
    comment: string;
    /** 평가자 userId — 본인(self) vs 리더 구분에 사용 */
    assessedById?: string;
    assessedBy: string;
    created: string;
}

function hasNonEmptyGrade(grade: string | undefined | null): boolean {
    return grade != null && String(grade).trim() !== "";
}

/** 리더 기말 성과 종합(AppraisalBy) 존재 여부 — 기말 리포트 공개 게이트 */
export function hasLeaderPerformanceFinalGrade(
    report: EvaluationReportResponse,
): boolean {
    const ownerId = report.owner?.userId;
    const finals = report.finalAssessments ?? [];

    const isPerfFinalGraded = (f: FinalAssessmentItem) =>
        f.assessType === "performance" &&
        f.assessTerm === "final" &&
        hasNonEmptyGrade(f.grade);

    const anyRowHasAssessorId = finals.some(
        (f) => f.assessedById != null && String(f.assessedById).trim() !== "",
    );

    if (anyRowHasAssessorId) {
        return finals.some(
            (f) =>
                isPerfFinalGraded(f) &&
                f.assessedById != null &&
                String(f.assessedById).trim() !== "" &&
                f.assessedById !== ownerId,
        );
    }

    return finals.some((f) => isPerfFinalGraded(f));
}

function normalizeMacroPhase(raw: number | string | null | undefined): number {
    const n = Math.floor(Number(raw ?? 1));
    if (!Number.isFinite(n)) return 1;
    return Math.min(5, Math.max(1, n));
}

export type TeamMemberReportBodyMode = "locked" | "mid_only" | "full";

/**
 * 팀원 본문: 매크로 4단계 이상(3단계 팀장 중간 종료 후)부터 중간 결과 공개,
 * 리더 기말 성과 종합이 있으면 중간+기말 전체 공개.
 * 인사·관리자는 항상 본문 조회(미완료 배너만 표시).
 */
export function getTeamMemberReportBodyMode(
    report: EvaluationReportResponse,
): TeamMemberReportBodyMode {
    const phase = normalizeMacroPhase(report.macroWorkflowPhase);
    if (phase < 4) return "locked";
    if (!hasLeaderPerformanceFinalGrade(report)) return "mid_only";
    return "full";
}

export interface EvaluationReportResponse {
    appraisalUserId: string;
    /** HR 매크로 1~5 (3=팀장 중간, 5=팀장 기말) */
    macroWorkflowPhase?: number;
    owner: { userId: string; koreanName: string };
    appraisalTitle: string;
    appraisalStatus: string;
    userStatus: string | null;
    competency: CompetencyReportItem[];
    goals: GoalReportItem[];
    finalAssessments: FinalAssessmentItem[];
}

export const GET_evaluationReport = async (
    appraisalUserId: string,
): Promise<EvaluationReportResponse> => {
    const response = await http.get(`/evaluation-report/${appraisalUserId}`);
    const body = response.data as Record<string, unknown> | EvaluationReportResponse;
    let report: EvaluationReportResponse;
    if (
        body &&
        typeof body === "object" &&
        "data" in body &&
        body.data &&
        typeof body.data === "object" &&
        body.data !== null &&
        "appraisalUserId" in body.data
    ) {
        report = body.data as EvaluationReportResponse;
    } else {
        report = body as EvaluationReportResponse;
    }
    return {
        ...report,
        macroWorkflowPhase: normalizeMacroPhase(report.macroWorkflowPhase),
        competency: Array.isArray(report.competency) ? report.competency : [],
        goals: Array.isArray(report.goals) ? report.goals : [],
        finalAssessments: Array.isArray(report.finalAssessments)
            ? report.finalAssessments
            : [],
    };
};
