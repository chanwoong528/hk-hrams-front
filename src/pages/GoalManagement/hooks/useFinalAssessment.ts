import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { POST_appraisalBy } from "@/api/appraisal-by/appraisal-by";
import { APPRAISAL_TYPES, getFinalOverallGradeOptions } from "../constants";
import { assessTermForSelfPerformance } from "@/lib/appraisalMacroWorkflow";
import type { PerformanceSummarySnapshot } from "../type";

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
    const [gradeScaleJobGroup, setGradeScaleJobGroup] = useState<
        string | null | undefined
    >(undefined);
    const [macroWorkflowPhase, setMacroWorkflowPhase] = useState<
        number | undefined
    >(undefined);
    const [peerSelfRounds, setPeerSelfRounds] = useState<
        | {
              mid?: PerformanceSummarySnapshot;
              final?: PerformanceSummarySnapshot;
          }
        | undefined
    >(undefined);

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

    const assessTerm = useMemo(
        () => assessTermForSelfPerformance(macroWorkflowPhase),
        [macroWorkflowPhase],
    );

    const dialogTitle = useMemo(() => {
        if (assessTerm === "mid") return "중간 성과 종합 자가 평가";
        if (assessTerm === "final") return "기말 성과 종합 자가 평가";
        return "성과 종합 자가 평가";
    }, [assessTerm]);

    const openDialog = (
        appraisalId: string,
        initialGrade?: string,
        initialComment?: string,
        jobGroup?: string | null,
        macroPhase?: number,
        peerRounds?: {
            mid?: PerformanceSummarySnapshot;
            final?: PerformanceSummarySnapshot;
        },
    ) => {
        setSelectedAppraisalId(appraisalId);
        setMacroWorkflowPhase(macroPhase);
        setPeerSelfRounds(peerRounds);
        setGradeScaleJobGroup(jobGroup);
        const allowed = getFinalOverallGradeOptions(jobGroup).map((o) => o.value);
        const nextGrade =
            initialGrade && allowed.includes(initialGrade) ? initialGrade : "";
        setGrade(nextGrade);
        setComment(initialComment || "");
        setIsOpen(true);
    };

    const closeDialog = () => {
        setIsOpen(false);
        setSelectedAppraisalId(null);
        setGrade("");
        setComment("");
        setGradeScaleJobGroup(undefined);
        setMacroWorkflowPhase(undefined);
        setPeerSelfRounds(undefined);
    };

    const handleSubmit = () => {
        if (!currentUserId || !selectedAppraisalId) return;
        if (!grade) {
            toast.error("등급을 선택해주세요");
            return;
        }

        const term = assessTermForSelfPerformance(macroWorkflowPhase);
        if (!term) {
            toast.error(
                "지금 워크플로 단계에서는 성과 종합 자가 평가를 제출할 수 없습니다. (중간: 2단계, 기말: 4단계)",
            );
            return;
        }

        submitAssessment({
            appraisalId: selectedAppraisalId,
            assessedById: currentUserId,
            assessType: APPRAISAL_TYPES.PERFORMANCE,
            assessTerm: term,
            grade,
            comment,
        });
    };

    return {
        isOpen,
        grade,
        comment,
        gradeScaleJobGroup,
        dialogTitle,
        assessTerm,
        peerSelfRounds,
        isPending,
        setGrade,
        setComment,
        openDialog,
        closeDialog,
        handleSubmit,
        onOpenChange: (open: boolean) => (open ? setIsOpen(true) : closeDialog()),
    };
}
