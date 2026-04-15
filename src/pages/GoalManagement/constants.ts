export const APPRAISAL_STATUS = {
    FINISHED: "finished",
    ONGOING: "ongoing",
    DRAFT: "draft",
    SUBMITTED: "submitted",
} as const;

/** 개인 목표 작성·수정 가능한 HR 매크로 단계 (API Goal 규칙과 동일) */
export const PERSONAL_GOAL_MACRO_PHASES: readonly number[] = [2, 4];

export function canMutatePersonalGoalsInMacroPhase(
    phase?: number | null,
): boolean {
    const p = phase ?? 1;
    return PERSONAL_GOAL_MACRO_PHASES.includes(p);
}

export const PERSONAL_GOALS_PHASE_HINT =
    "개인 목표는 워크플로 2·4단계(팀원 중간/최종)에서만 작성·수정할 수 있습니다.";

export const APPRAISAL_TYPES = {
    PERFORMANCE: "performance",
} as const;

/** 최종 자가/최종 평가 종합 등급: 사무관리직 → O E M P N, 그 외 → A B C */
export type FinalOverallGradeOption = { value: string; label: string };

export type FinalOverallGradeButtonOption = {
    value: string;
    label: string;
    desc: string;
    /** Tailwind classes for selected state (GoalAssessmentItem과 동일 톤) */
    color: string;
};

const FINAL_OVERALL_BUTTONS_OFFICE: FinalOverallGradeButtonOption[] = [
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

const FINAL_OVERALL_BUTTONS_DEFAULT: FinalOverallGradeButtonOption[] = [
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

export function getFinalOverallGradeButtonOptions(
    jobGroup?: string | null,
): FinalOverallGradeButtonOption[] {
    return (jobGroup ?? "").trim() === "사무관리직"
        ? FINAL_OVERALL_BUTTONS_OFFICE
        : FINAL_OVERALL_BUTTONS_DEFAULT;
}

export function getFinalOverallGradeOptions(
    jobGroup?: string | null,
): FinalOverallGradeOption[] {
    return getFinalOverallGradeButtonOptions(jobGroup).map(({ value, label }) => ({
        value,
        label,
    }));
}
