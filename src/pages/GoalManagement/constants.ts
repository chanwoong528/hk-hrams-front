export const APPRAISAL_STATUS = {
    FINISHED: "finished",
    ONGOING: "ongoing",
    DRAFT: "draft",
    SUBMITTED: "submitted",
} as const;

export const APPRAISAL_TYPES = {
    PERFORMANCE: "performance",
} as const;

export const GRADES = [
    { value: "S", label: "S등급 (탁월)" },
    { value: "A", label: "A등급 (우수)" },
    { value: "B", label: "B등급 (보통)" },
    { value: "C", label: "C등급 (미흡)" },
    { value: "D", label: "D등급 (부족)" },
] as const;
