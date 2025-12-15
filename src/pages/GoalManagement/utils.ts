import { APPRAISAL_STATUS } from "./constants";
import type { Goal } from "./type";

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

export const sortGoalsByProgress = (goals: Goal[], currentUserId?: string) => {
    return [...goals].sort((a, b) => {
        const aDone = a.goalAssessmentBy?.some(
            (assess) => assess.gradedBy === currentUserId,
        );
        const bDone = b.goalAssessmentBy?.some(
            (assess) => assess.gradedBy === currentUserId,
        );

        if (!aDone && bDone) return -1;
        if (aDone && !bDone) return 1;
        return 0;
    });
};
