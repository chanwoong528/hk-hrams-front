import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { POST_appraisalBy } from "@/api/appraisal-by/appraisal-by";
import { APPRAISAL_TYPES } from "../constants";

interface UseFinalAssessmentProps {
    currentUserId?: string;
}

export function useFinalAssessment({ currentUserId }: UseFinalAssessmentProps) {
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedAppraisalId, setSelectedAppraisalId] = useState<string | null>(
        null,
    );
    const [grade, setGrade] = useState("");
    const [comment, setComment] = useState("");

    const { mutate: submitAssessment, isPending } = useMutation({
        mutationFn: POST_appraisalBy,
        onSuccess: () => {
            toast.success("최종 자가 평가가 저장되었습니다");
            closeDialog();
            queryClient.invalidateQueries({ queryKey: ["appraisalTypes"] });
        },
        onError: () => {
            toast.error("최종 평가 저장 실패");
        },
    });

    const openDialog = (
        appraisalId: string,
        initialGrade?: string,
        initialComment?: string,
    ) => {
        setSelectedAppraisalId(appraisalId);
        setGrade(initialGrade || "");
        setComment(initialComment || "");
        setIsOpen(true);
    };

    const closeDialog = () => {
        setIsOpen(false);
        setSelectedAppraisalId(null);
        setGrade("");
        setComment("");
    };

    const handleSubmit = () => {
        if (!currentUserId || !selectedAppraisalId) return;
        if (!grade) {
            toast.error("등급을 선택해주세요");
            return;
        }

        submitAssessment({
            appraisalId: selectedAppraisalId,
            assessedById: currentUserId,
            assessType: APPRAISAL_TYPES.PERFORMANCE,
            assessTerm: "final",
            grade,
            comment,
        });
    };

    return {
        isOpen,
        grade,
        comment,
        isPending,
        setGrade,
        setComment,
        openDialog,
        closeDialog,
        handleSubmit,
        onOpenChange: (open: boolean) => (open ? setIsOpen(true) : closeDialog()),
    };
}
