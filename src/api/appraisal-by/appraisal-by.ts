import { http } from "@/api";

export const POST_appraisalBy = async (payload: {
    appraisalId: string;
    assessType: string;
    assessTerm: string;
    grade: string;
    comment: string;
    assessedById: string;
}) => {
    const response = await http.post(`/appraisal-by`, payload);
    return response.data;
};
