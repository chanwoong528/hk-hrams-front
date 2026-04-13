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

/**
 * 팀원 리포트 본문 공개 조건: 리더(피평가자 본인이 아닌 평가자)가 제출한
 * 성과(performance) 최종(final) 종합 평가가 1건 이상이고 등급이 있어야 함.
 * (AppraisalBy에 역량·중간 등 다른 행이 있어도 전부 채워질 필요 없음.)
 * assessedById가 없는 구버전 응답이면: 성과+최종+등급 1건 이상으로 완화.
 */
export function isTeamMemberReportUnlocked(
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

export interface EvaluationReportResponse {
    appraisalUserId: string;
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
        competency: Array.isArray(report.competency) ? report.competency : [],
        goals: Array.isArray(report.goals) ? report.goals : [],
        finalAssessments: Array.isArray(report.finalAssessments)
            ? report.finalAssessments
            : [],
    };
};
