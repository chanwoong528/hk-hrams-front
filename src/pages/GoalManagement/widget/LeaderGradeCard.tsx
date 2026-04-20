import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useCurrentUserStore } from "@/store/currentUserStore";
import type {
  Appraisal,
  DepartmentAppraisal,
  Goal,
  PerformanceSummarySnapshot,
  User,
} from "../type";
import { CheckCircle, Goal as GoalIcon, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import GoalForm from "./GoalForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  POST_commonGoal,
  PATCH_commonGoal,
  DELETE_commonGoal,
} from "@/api/goal/goal";
import { POST_goalAssessmentBy } from "@/api/goal-assessment-by/goal-assessment-by";
import { POST_appraisalBy } from "@/api/appraisal-by/appraisal-by";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import GoalAssessmentItem from "./GoalAssessmentItem";
import { goalHasUserAssessmentForTerm } from "../utils";
import { isHrOrAdminUser, shouldBlockHrSelfGrading } from "@/lib/hrAccess";
import { getFinalOverallGradeButtonOptions } from "../constants";
import {
  OrganizationGradeStackedBar,
  pickRankBasedDisplayAssessment,
} from "@/lib/organizationGradeDistribution";
import {
  assessTermForLeaderPerformance,
  canLeaderMutateMemberGoalAssessment,
} from "@/lib/appraisalMacroWorkflow";

function formatFinalAppraisalContext(row: {
  assessType?: string;
  assessTerm?: string;
}): string {
  const parts: string[] = [];
  if (row.assessType === "performance") parts.push("성과");
  else if (row.assessType === "competency") parts.push("역량");
  if (row.assessTerm === "mid") parts.push("중간");
  else if (row.assessTerm === "final") parts.push("기말");
  return parts.length > 0 ? parts.join(" ") : "평가";
}

const parseDbDateToMs = (raw: unknown): number => {
  const s = String(raw ?? "").trim();
  if (!s) return Number.NaN;

  const isoMs = Date.parse(s);
  if (!Number.isNaN(isoMs)) return isoMs;

  // "YYYY-MM-DD HH:mm:ss.SSSSSS" → "YYYY-MM-DDTHH:mm:ss.SSS"
  const normalized = s.replace(" ", "T").replace(/(\.\d{3})\d+$/, "$1");
  return Date.parse(normalized);
};

type GraderGradeLine = {
  key: string;
  name: string;
  grade: string;
  context: string;
  /** 피평가자 본인이 아닌 리더 등 — HR/관리자가 배지 클릭으로 수정 가능 */
  hrEditableAssessedById?: string;
  assessTerm?: string;
};

/** 목표별 점수 제외 — AppraisalBy(중간·기말) + 본인 자가(참고) */
function collectGraderGradeLinesForMember(user: User): GraderGradeLine[] {
  const lines: GraderGradeLine[] = [];

  (user.assessments ?? []).forEach((row, idx) => {
    if (!row.assessedById) return;
    if (row.assessedById === user.userId) return;

    const name =
      row.assessedByUser?.koreanName?.trim() ||
      `평가자 ${row.assessedById.slice(0, 8)}…`;
    const grade = row.grade?.trim() || "—";
    lines.push({
      key: `appr-${row.assessedById}-${idx}-${row.assessType ?? ""}-${row.assessTerm ?? ""}`,
      name,
      grade,
      context: formatFinalAppraisalContext(row),
      hrEditableAssessedById: row.assessedById,
      assessTerm: row.assessTerm,
    });
  });

  lines.sort((a, b) => {
    const byName = a.name.localeCompare(b.name, "ko");
    if (byName !== 0) return byName;
    return a.context.localeCompare(b.context, "ko");
  });

  const selfGrade = user.selfAssessment?.grade?.trim();
  if (selfGrade) {
    lines.unshift({
      key: `self-${user.appraisalUserId ?? user.userId}`,
      name: `${user.koreanName} (본인)`,
      grade: selfGrade,
      context: "자가 평가",
    });
  }

  return lines;
}

function isPerformanceSummaryRow(
  a: NonNullable<User["assessments"]>[number],
): boolean {
  const t = (a.assessType ?? "").trim();
  return !t || t === "performance";
}

function PerformanceSelfSummaryPanel({
  title,
  snapshot,
}: {
  title: string;
  snapshot?: PerformanceSummarySnapshot | null;
}) {
  const grade = (snapshot?.grade ?? "").trim();
  const comment = (snapshot?.comment ?? "").trim();
  const isEmpty = !grade && !comment;
  if (isEmpty) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 p-3">
        <h5 className="text-xs font-semibold text-gray-700 mb-1">{title}</h5>
        <p className="text-xs text-gray-400">미작성</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <h5 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
        {title}
      </h5>
      {grade ? (
        <div className="mb-2 flex items-center gap-2 text-sm">
          <span className="text-gray-500">등급</span>
          <Badge variant="outline" className="bg-white">
            {grade}등급
          </Badge>
        </div>
      ) : null}
      <div className="rounded border border-gray-100 bg-white p-2 text-xs whitespace-pre-wrap text-gray-600">
        {comment || "코멘트 없음"}
      </div>
    </div>
  );
}

/**
 * 워크플로 2단계(목표 승인): 팀원별로, 로그인 팀장이 **현재 목표 버전**에 대해 남긴
 * `goal_approval` 건수(승인 T / 반려 F).
 */
function countCurrentGoalApprovalByLeaderForUser(
  user: User,
  leaderUserId: string | null | undefined,
): { approved: number; rejected: number } {
  const scopedLeaderId = leaderUserId?.trim() || null;
  let approved = 0;
  let rejected = 0;
  for (const goal of user.goals ?? []) {
    const ver = Math.floor(Number(goal.approvalVersion ?? 1)) || 1;
    const row = (goal.goalAssessmentBy ?? []).find(
      (a) =>
        String(a.assessTerm ?? "")
          .trim()
          .toLowerCase() === "goal_approval" &&
        (scopedLeaderId ? a.gradedBy === scopedLeaderId : true) &&
        (a.targetApprovalVersion ?? -1) === ver,
    );
    const g = String(row?.grade ?? "")
      .trim()
      .toUpperCase();
    if (g === "T") approved += 1;
    else if (g === "F") rejected += 1;
  }
  return { approved, rejected };
}

const AppraisalSection = ({
  appraisal,
  departmentId,
  departmentName,
  currentUserId,
  hideCommonGoalManagement = false,
  departmentFlat,
}: {
  appraisal: Appraisal;
  departmentId: string;
  departmentName: string;
  currentUserId: string;
  /** 여러 하위 부서를 합친 뷰일 때 공통 목표 API 대상이 불명확하여 숨김 */
  hideCommonGoalManagement?: boolean;
  /** 선택 부서 기준 prefill 타깃 계산용(직계 하위부서 리더 식별) */
  departmentFlat?: DepartmentTreeData[];
}) => {
  const [isAddCommonGoalModalOpen, setIsAddCommonGoalModalOpen] =
    useState(false);
  const [selectedUserForFinal, setSelectedUserForFinal] = useState<User | null>(
    null,
  );
  const [finalOverrideAssessedById, setFinalOverrideAssessedById] = useState<
    string | null
  >(null);
  const [finalGrade, setFinalGrade] = useState("");
  const [finalComment, setFinalComment] = useState("");

  const { currentUser } = useCurrentUserStore();

  const isAdmin = isHrOrAdminUser(currentUser?.email, currentUser?.departments);

  const hrCannotSelfGrade = shouldBlockHrSelfGrading(
    currentUser?.email,
    currentUser?.departments,
  );

  const currentUserRank =
    currentUser?.departments?.reduce(
      (min, d) => Math.min(min, d.rank ?? 99),
      99,
    ) ?? 99;

  // Corrected Rank Filtering Logic:
  // If 0 is CEO (Top). Smaller number = more senior.
  // User says: Max Rank 2 should block Rank 1 and 2.
  // This means: Allowed if rank > 2.
  // And for Min Rank (Bottom limit): Allowed if rank <= minGradeRank.
  const rankAllowed =
    (appraisal.minGradeRank == null ||
      currentUserRank <= appraisal.minGradeRank) &&
    (appraisal.maxGradeRank == null ||
      currentUserRank >= appraisal.maxGradeRank);

  const isSpectator = !isAdmin && !rankAllowed;

  const progressLikeSpectator = isSpectator || hrCannotSelfGrade;

  const leaderGoalAssessmentAllowed = canLeaderMutateMemberGoalAssessment(
    appraisal.macroWorkflowPhase,
  );

  const leaderPerfAssessTerm = assessTermForLeaderPerformance(
    appraisal.macroWorkflowPhase,
  );

  const isGoalApprovalPhase = appraisal.macroWorkflowPhase === 2;

  const [goalApprovalDrafts, setGoalApprovalDrafts] = useState<
    Record<string, string>
  >({});
  const [goalApprovalGradeDrafts, setGoalApprovalGradeDrafts] = useState<
    Record<string, "T" | "F" | null | undefined>
  >({});
  const [goalApprovalCommentTouched, setGoalApprovalCommentTouched] = useState<
    Record<string, boolean | undefined>
  >({});
  const [goalApprovalGradeTouched, setGoalApprovalGradeTouched] = useState<
    Record<string, boolean | undefined>
  >({});

  const queryClient = useQueryClient();

  const { mutate: mutateAddCommonGoal } = useMutation({
    mutationFn: POST_commonGoal,
    onSuccess: () => {
      setIsAddCommonGoalModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["teamMembersAppraisals"] });
    },
  });

  const { mutate: mutateEditCommonGoal } = useMutation({
    mutationFn: PATCH_commonGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembersAppraisals"] });
    },
  });

  const { mutate: mutateDeleteCommonGoal } = useMutation({
    mutationFn: DELETE_commonGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMembersAppraisals"] });
    },
  });

  const { mutate: mutateAssessGoal } = useMutation({
    mutationFn: POST_goalAssessmentBy,
    onSuccess: () => {
      toast.success("목표 평가/승인이 저장되었습니다");
      queryClient.invalidateQueries({ queryKey: ["teamMembersAppraisals"] });
    },
    onError: () => {
      toast.error("목표 평가 저장에 실패했습니다");
    },
  });

  const resetGoalApprovalDraftState = useCallback(() => {
    setGoalApprovalDrafts({});
    setGoalApprovalGradeDrafts({});
    setGoalApprovalCommentTouched({});
    setGoalApprovalGradeTouched({});
  }, []);

  const { mutate: mutateAppraisalAssessment } = useMutation({
    mutationFn: POST_appraisalBy,
    onSuccess: () => {
      toast.success("최종 평가가 완료되었습니다");
      setSelectedUserForFinal(null);
      setFinalOverrideAssessedById(null);
      setFinalGrade("");
      setFinalComment("");
      queryClient.invalidateQueries({ queryKey: ["teamMembersAppraisals"] });
    },
    onError: () => {
      toast.error("최종 평가 저장에 실패했습니다");
    },
  });

  const handleFinalAssessment = () => {
    if (!selectedUserForFinal) return;
    if (
      selectedUserForFinal.status !== "submitted" &&
      selectedUserForFinal.status !== "finished"
    ) {
      toast.error("평가 대상자가 아직 최종 평가를 제출하지 않았습니다.");
      return;
    }
    if (!finalGrade) {
      toast.error("등급을 선택해주세요");
      return;
    }

    const assessorId = hrCannotSelfGrade
      ? finalOverrideAssessedById
      : (finalOverrideAssessedById ?? currentUserId);

    if (!assessorId) {
      toast.error(
        hrCannotSelfGrade
          ? "수정할 평가자(리더)를 선택하세요."
          : "사용자 정보를 찾을 수 없습니다.",
      );
      return;
    }

    const mustHaveExistingLeaderRow =
      hrCannotSelfGrade ||
      (!!finalOverrideAssessedById &&
        finalOverrideAssessedById !== currentUserId);

    const perfTerm = assessTermForLeaderPerformance(
      appraisal.macroWorkflowPhase,
    );
    if (!perfTerm) {
      toast.error(
        "지금 워크플로 단계에서는 팀장 성과 종합 평가를 제출할 수 없습니다. (중간: 4단계, 기말: 6단계)",
      );
      return;
    }

    if (mustHaveExistingLeaderRow) {
      const exists = selectedUserForFinal.assessments?.some(
        (a) =>
          a.assessedById === assessorId &&
          a.assessTerm === perfTerm &&
          (a.assessType === "performance" || !a.assessType),
      );
      if (!exists) {
        toast.error("선택한 평가자의 해당 차수 성과 평가가 없습니다.");
        return;
      }
    }

    mutateAppraisalAssessment({
      appraisalId: selectedUserForFinal.appraisalUserId!,
      assessedById: assessorId,
      assessType: "performance",
      assessTerm: perfTerm,
      grade: finalGrade,
      comment: finalComment,
    });
  };

  const handleSaveAssessment = (
    goalId: string,
    grade: string,
    comment: string,
    gradedByUserId?: string,
    kpiAchievementRate?: string,
    assessTerm?: "mid" | "final" | "goal_approval",
  ) => {
    const gradedBy = gradedByUserId ?? currentUserId;
    if (!gradedBy) {
      toast.error("사용자 정보를 찾을 수 없습니다.");
      return;
    }
    const term = assessTerm ?? leaderPerfAssessTerm;
    if (!term) {
      toast.error(
        "지금 워크플로 단계에서는 팀장 목표 평가를 저장할 수 없습니다.",
      );
      return;
    }
    mutateAssessGoal({
      goalId: goalId,
      grade: grade,
      gradedBy: gradedBy,
      comment: comment,
      assessTerm: term,
      ...(kpiAchievementRate !== undefined ? { kpiAchievementRate } : {}),
    });
  };

  const commonGoals = useMemo(() => {
    const directChildLeaderIds = (() => {
      if (!departmentFlat?.length) return [];
      return departmentFlat
        .filter((node) => String(node.parent) === departmentId)
        .map((node) => node.data?.leader?.userId)
        .filter((id): id is string => !!id);
    })();

    // 상위 부서(직계 하위부서 존재): 직계 하위부서 리더들의 공통목표만 prefill
    // 리프 부서: 해당 부서의 일반 팀원(비리더) 공통목표를 prefill
    const prefillTargetUsers =
      directChildLeaderIds.length > 0
        ? appraisal.user.filter((u) => directChildLeaderIds.includes(u.userId))
        : appraisal.user.filter((u) => !u.isDepartmentLeader);

    const allGoals = prefillTargetUsers.flatMap((u) => u.goals ?? []);
    const seenKeys = new Set<string>();
    const deduped: Goal[] = [];

    for (const goal of allGoals) {
      if (goal.goalType !== "common") continue;
      // 같은 부서/평가 공통 목표가 팀원마다 복제되어 내려오므로 제목+설명(+KPI) 단위로 화면상 중복 제거
      const key = [
        goal.title ?? "",
        goal.description ?? "",
        goal.kpi ?? "",
        goal.achieveIndicator ?? "",
      ].join("|");
      if (seenKeys.has(key)) continue;
      seenKeys.add(key);
      deduped.push(goal);
    }

    return deduped;
  }, [appraisal.user, departmentFlat, departmentId]);

  return (
    <Card className="mb-6 border-none shadow-sm ring-1 ring-gray-100">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b pb-4">
        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle className="text-lg font-bold flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap">
              {appraisal.title}
              {hideCommonGoalManagement && (
                <Badge
                  variant="outline"
                  className="text-xs font-normal text-gray-600 border-gray-200"
                >
                  하위 부서 인원 포함
                </Badge>
              )}
            </CardTitle>
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              {!isSpectator && !hideCommonGoalManagement && (
                <Dialog
                  open={isAddCommonGoalModalOpen}
                  onOpenChange={setIsAddCommonGoalModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-white border hover:bg-gray-50 text-purple-700 border-purple-100 hover:text-purple-800"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      평가 항목 관리
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto px-4 sm:px-6">
                    <DialogHeader>
                      <DialogTitle>
                        평가 항목 관리
                        <span className="ml-2 text-sm text-gray-500 font-normal">
                          - {departmentName}
                        </span>
                      </DialogTitle>
                    </DialogHeader>
                    <GoalForm
                      onSaveAll={async (
                        newGoals,
                        updatedGoals,
                        deletedGoalIds,
                      ) => {
                        if (newGoals.length > 0) {
                          mutateAddCommonGoal({
                            appraisalId: appraisal.appraisalId,
                            departmentId: departmentId,
                            goals: newGoals,
                          });
                        }
                        updatedGoals.forEach((goal) => {
                          const originalGoal = commonGoals.find(
                            (g) => g.goalId === goal.goalId,
                          );
                          if (
                            originalGoal &&
                            (originalGoal.title !== goal.title ||
                              originalGoal.description !== goal.description)
                          ) {
                            mutateEditCommonGoal({
                              appraisalId: appraisal.appraisalId,
                              departmentId: departmentId,
                              oldTitle: originalGoal.title,
                              newTitle: goal.title,
                              newDescription: goal.description,
                            });
                          }
                        });
                        deletedGoalIds.forEach((id) => {
                          const originalGoal = commonGoals.find(
                            (g) => g.goalId === id,
                          );
                          if (originalGoal) {
                            mutateDeleteCommonGoal({
                              appraisalId: appraisal.appraisalId,
                              departmentId: departmentId,
                              title: originalGoal.title,
                            });
                          }
                        });
                        toast.success("공통 목표 변경 사항이 저장되었습니다.");
                      }}
                      showLeft={false}
                      existingGoals={commonGoals as any}
                      appraisalInfo={{
                        title: `[${departmentName}] 평가 항목 관리`,
                        description:
                          "이곳에서 등록하는 목표는 해당 부서의 모든 팀원에게 일괄 적용됩니다.",
                      }}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
          <OrganizationGradeStackedBar users={appraisal.user} />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
              <TableHead className="w-[150px]">이름</TableHead>
              <TableHead className="w-[120px]" scope="col">
                역할
              </TableHead>
              <TableHead className="w-[100px]">목표 수</TableHead>
              {isGoalApprovalPhase ? (
                <>
                  <TableHead
                    className="w-[72px] text-center whitespace-nowrap"
                    scope="col"
                    title="현재 버전 기준 팀장 승인(T) 목표 수"
                  >
                    승인
                  </TableHead>
                  <TableHead
                    className="w-[72px] text-center whitespace-nowrap"
                    scope="col"
                    title="현재 버전 기준 팀장 반려(F) 목표 수"
                  >
                    반려
                  </TableHead>
                </>
              ) : null}
              <TableHead>평가 현황</TableHead>
              <TableHead className="min-w-[180px] max-w-[260px]" scope="col">
                최종 평가
              </TableHead>
              <TableHead
                className="w-[96px] text-center whitespace-nowrap"
                scope="col"
                title="HR 제외 조직 랭크가 가장 높은 평가자의 기말 등급"
              >
                조직 기준
              </TableHead>
              <TableHead className="text-right min-w-[200px]" scope="col">
                {/* 목표 · 최종 */}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appraisal.user.map((user) => {
              const totalGoals = user.goals.length;
              const commonGoalsCount = user.goals.filter(
                (g) =>
                  String(g.goalType ?? "personal")
                    .trim()
                    .toLowerCase() === "common",
              ).length;
              const personalGoalsCount = totalGoals - commonGoalsCount;
              const goalApprovalCounts = isGoalApprovalPhase
                ? countCurrentGoalApprovalByLeaderForUser(
                    user,
                    // 어드민/HR: 특정 팀장이 아니라 "현재 버전 승인/반려 현황"을 집계
                    isAdmin ? null : currentUserId,
                  )
                : null;
              const assessedGoals = user.goals.filter((g) =>
                progressLikeSpectator
                  ? !!(g.goalAssessmentBy && g.goalAssessmentBy.length > 0)
                  : !!(
                      leaderPerfAssessTerm != null &&
                      goalHasUserAssessmentForTerm(
                        g,
                        currentUserId,
                        leaderPerfAssessTerm,
                      )
                    ),
              ).length;
              const isFullyAssessed =
                totalGoals > 0 && totalGoals === assessedGoals;
              const leaderPerformanceAssessments = (
                user.assessments ?? []
              ).filter(
                (a) =>
                  !!a.assessedById &&
                  a.assessedById !== user.userId &&
                  (a.assessType === "performance" || !a.assessType),
              );
              const hasLeaderPerformanceForRound =
                leaderPerfAssessTerm != null &&
                leaderPerformanceAssessments.some(
                  (a) => a.assessTerm === leaderPerfAssessTerm,
                );
              const isRoundAssessedByLeader =
                leaderPerfAssessTerm != null &&
                !!user.assessments?.some(
                  (a) =>
                    a.assessedById === currentUserId &&
                    a.assessTerm === leaderPerfAssessTerm &&
                    (a.assessType === "performance" || !a.assessType),
                );
              const graderGradeLines = collectGraderGradeLinesForMember(user);

              const myFinalAssessment =
                leaderPerfAssessTerm != null
                  ? user.assessments?.find(
                      (a) =>
                        a.assessedById === currentUserId &&
                        a.assessTerm === leaderPerfAssessTerm &&
                        (a.assessType === "performance" || !a.assessType),
                    )
                  : undefined;
              const displayFinalAssessment = pickRankBasedDisplayAssessment(
                user.assessments,
                user.userId,
              );
              const isSubmittedOrFinished =
                user.status === "submitted" || user.status === "finished";

              /** 팀원이 제출·완료된 뒤에도 해당 차수(중간/기말)에서는 성과 종합을 계속 수정 가능 */
              const canEditFinal =
                !isSpectator &&
                !hrCannotSelfGrade &&
                isSubmittedOrFinished &&
                leaderPerfAssessTerm != null;

              const finalButtonDisabled =
                !isSpectator &&
                (leaderPerfAssessTerm === null ||
                  !isSubmittedOrFinished ||
                  (!canEditFinal && !hrCannotSelfGrade));

              const finalButtonLooksComplete = hrCannotSelfGrade
                ? hasLeaderPerformanceForRound
                : isRoundAssessedByLeader;

              return (
                <TableRow
                  key={user.appraisalUserId ?? user.userId}
                  className="group hover:bg-blue-50/30 transition-colors"
                >
                  <TableCell className="font-semibold text-gray-900">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                        {user.koreanName[0]}
                      </div>
                      {user.koreanName}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {user.isDepartmentLeader ? "리더" : "팀원"}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge
                        variant="outline"
                        className="bg-white w-full justify-center"
                      >
                        {totalGoals}개
                      </Badge>
                      <p className="text-[11px] text-slate-500 text-center whitespace-nowrap">
                        공통 {commonGoalsCount} / 개인 {personalGoalsCount}
                      </p>
                    </div>
                  </TableCell>
                  {isGoalApprovalPhase && goalApprovalCounts ? (
                    <>
                      <TableCell className="text-center align-middle">
                        <Badge
                          variant="outline"
                          className="min-w-[2.25rem] justify-center border-emerald-200 bg-emerald-50 text-emerald-900"
                        >
                          {goalApprovalCounts.approved}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <Badge
                          variant="outline"
                          className="min-w-[2.25rem] justify-center border-red-200 bg-red-50 text-red-900"
                        >
                          {goalApprovalCounts.rejected}
                        </Badge>
                      </TableCell>
                    </>
                  ) : null}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-medium ${
                          isFullyAssessed ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {assessedGoals} / {totalGoals} 완료
                      </span>
                      <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFullyAssessed ? "bg-green-500" : "bg-blue-500"
                          }`}
                          style={{
                            width: `${
                              totalGoals > 0
                                ? (assessedGoals / totalGoals) * 100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    {graderGradeLines.length === 0 ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <ul className="text-xs text-gray-700 space-y-2 max-w-[280px]">
                        {graderGradeLines.map((line) => {
                          const canClickGradeBadge =
                            isAdmin &&
                            !!line.hrEditableAssessedById &&
                            isSubmittedOrFinished;
                          const openFinalEditForLine = () => {
                            if (!line.hrEditableAssessedById) return;
                            if (!isSubmittedOrFinished) {
                              toast.error(
                                "평가 대상자가 아직 최종 평가를 제출하지 않았습니다.",
                              );
                              return;
                            }
                            const row = user.assessments?.find(
                              (a) =>
                                a.assessedById ===
                                  line.hrEditableAssessedById &&
                                a.assessTerm ===
                                  (line.assessTerm ?? leaderPerfAssessTerm),
                            );
                            setFinalOverrideAssessedById(
                              line.hrEditableAssessedById,
                            );
                            if (row) {
                              setFinalGrade(row.grade);
                              setFinalComment(row.comment);
                            } else {
                              setFinalGrade("");
                              setFinalComment("");
                            }
                            setSelectedUserForFinal(user);
                          };

                          return (
                            <li key={line.key} className="leading-snug">
                              <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
                                <span className="font-semibold text-gray-900">
                                  {line.name}
                                </span>
                                <span className="text-muted-foreground">·</span>
                                {canClickGradeBadge ? (
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    title="클릭하여 이 평가자의 등급 수정"
                                    aria-label={`${line.name} 등급 ${line.grade}, 클릭하여 수정`}
                                    className="h-6 min-w-6 px-0 rounded-full text-[10px] font-bold shrink-0 hover:ring-2 hover:ring-purple-400 focus-visible:ring-2 focus-visible:ring-purple-500"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openFinalEditForLine();
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        openFinalEditForLine();
                                      }
                                    }}
                                  >
                                    {line.grade}
                                  </Button>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="h-5 px-1.5 text-[10px] font-bold shrink-0 rounded-full min-w-5 justify-center"
                                  >
                                    {line.grade}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground mt-0.5 pl-0.5">
                                {line.context}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </TableCell>
                  <TableCell className="text-center align-middle">
                    {displayFinalAssessment ? (
                      <Badge
                        variant="secondary"
                        className="text-white bg-purple-500 rounded-md shrink-0"
                        title="HR 제외 조직 랭크가 가장 높은 평가자의 기말 등급"
                      >
                        {displayFinalAssessment.grade}등급
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant={isFullyAssessed ? "outline" : "default"}
                            className={
                              isFullyAssessed &&
                              (user.status === "submitted" ||
                                user.status === "finished")
                                ? "text-gray-600 hover:bg-gray-50 bg-white border border-gray-200"
                                : "bg-blue-600 hover:bg-blue-700 shadow-sm text-white"
                            }
                          >
                            {isFullyAssessed ? (
                              <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                            ) : (
                              <Star className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            {user.status === "submitted" ||
                            user.status === "finished"
                              ? "목표 평가"
                              : "목표 확인"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="w-[96vw] max-w-6xl max-h-[90vh] overflow-y-auto bg-slate-50 p-0 gap-0">
                          <DialogHeader className="p-6 pb-4 bg-white border-b sticky top-0 z-10">
                            <DialogTitle className="text-xl font-bold flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg">
                                  {user.koreanName[0]}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    {user.koreanName}
                                    <Badge
                                      variant="outline"
                                      className="font-normal text-gray-500"
                                    >
                                      {user.isDepartmentLeader
                                        ? "리더"
                                        : "팀원"}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-400 font-normal mt-0.5">
                                    목표 평가 및 피드백 작성
                                  </p>
                                </div>
                              </div>
                            </DialogTitle>
                          </DialogHeader>

                          <div className="min-w-0 space-y-6 p-4 sm:p-6">
                            {!isSpectator && isGoalApprovalPhase ? (
                              <div
                                role="status"
                                className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-950 [overflow-wrap:anywhere]"
                              >
                                이 단계에서는 팀원이 작성한 목표를{" "}
                                <strong>직속 팀장</strong>이 승인(T) 또는
                                반려(F)합니다. 목표가 수정되면 기존 승인/반려는
                                자동으로 무효화되며, 승인 대상 목표가 모두
                                승인(T)되어야 인사/관리자가 다음 단계로 넘어갈
                                수 있습니다. (기자직의 공통 목표는 승인/반려
                                없이 진행 가능)
                              </div>
                            ) : null}

                            {!isSpectator &&
                            !isGoalApprovalPhase &&
                            !leaderGoalAssessmentAllowed ? (
                              <p
                                role="status"
                                className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 [overflow-wrap:anywhere]"
                              >
                                팀장 목표 평가는 워크플로
                                4단계(중간)·6단계(기말)에서만 작성·수정할 수
                                있습니다. 현재는 조회만 가능합니다.
                              </p>
                            ) : null}
                            {user.goals.length > 0 ? (
                              isGoalApprovalPhase ? (
                                <div className="grid min-w-0 gap-4">
                                  {[...user.goals].map((goal) => {
                                    const isCommonGoal =
                                      String(goal.goalType ?? "personal")
                                        .trim()
                                        .toLowerCase() === "common";
                                    const currentVersion =
                                      Math.floor(
                                        Number(goal.approvalVersion ?? 1),
                                      ) || 1;
                                    const allApprovalRows = (
                                      goal.goalAssessmentBy ?? []
                                    ).filter(
                                      (a) =>
                                        String(a.assessTerm ?? "")
                                          .trim()
                                          .toLowerCase() === "goal_approval",
                                    );

                                    const rowsSortedByLatestDbWrite = [
                                      ...allApprovalRows,
                                    ].sort((a, b) => {
                                      const at = parseDbDateToMs(
                                        a.updated ?? a.created,
                                      );
                                      const bt = parseDbDateToMs(
                                        b.updated ?? b.created,
                                      );
                                      const aValid = Number.isFinite(at);
                                      const bValid = Number.isFinite(bt);
                                      if (aValid && bValid) return bt - at;
                                      if (aValid && !bValid) return -1;
                                      if (!aValid && bValid) return 1;

                                      // If timestamps aren't parsable, fall back to version desc.
                                      const av = Number(
                                        a.targetApprovalVersion ?? -1,
                                      );
                                      const bv = Number(
                                        b.targetApprovalVersion ?? -1,
                                      );
                                      if (av !== bv) return bv - av;
                                      return 0;
                                    });

                                    const approvalRowsForMe = currentUserId
                                      ? rowsSortedByLatestDbWrite.filter(
                                          (a) => a.gradedBy === currentUserId,
                                        )
                                      : [];

                                    // 최신 DB 저장 row (가능하면 내 row 우선)
                                    const latestDbApprovalRow =
                                      approvalRowsForMe[0] ??
                                      rowsSortedByLatestDbWrite[0] ??
                                      null;

                                    // 현재 버전 row (가능하면 내 row 우선)
                                    const approvalRow =
                                      (currentUserId
                                        ? allApprovalRows.find(
                                            (a) =>
                                              a.gradedBy === currentUserId &&
                                              (a.targetApprovalVersion ??
                                                -1) === currentVersion,
                                          )
                                        : null) ??
                                      allApprovalRows.find(
                                        (a) =>
                                          (a.targetApprovalVersion ?? -1) ===
                                          currentVersion,
                                      ) ??
                                      null;
                                    const approvalGrade = String(
                                      approvalRow?.grade ?? "",
                                    )
                                      .trim()
                                      .toUpperCase();
                                    const approvalStatus =
                                      approvalGrade === "T"
                                        ? ("approved" as const)
                                        : approvalGrade === "F"
                                          ? ("rejected" as const)
                                          : ("pending" as const);

                                    const baseRow =
                                      approvalRow ??
                                      latestDbApprovalRow ??
                                      null;

                                    const savedComment = baseRow?.comment ?? "";
                                    const draft =
                                      goalApprovalDrafts[goal.goalId] ?? "";
                                    const isCommentTouched =
                                      !!goalApprovalCommentTouched[goal.goalId];
                                    const effectiveComment = isCommentTouched
                                      ? draft
                                      : savedComment;
                                    const draftGrade =
                                      goalApprovalGradeDrafts[goal.goalId];
                                    const currentSavedGrade =
                                      String(baseRow?.grade ?? "")
                                        .trim()
                                        .toUpperCase() === "T"
                                        ? ("T" as const)
                                        : String(baseRow?.grade ?? "")
                                              .trim()
                                              .toUpperCase() === "F"
                                          ? ("F" as const)
                                          : null;
                                    const selectedGrade =
                                      draftGrade ?? currentSavedGrade;
                                    const isSaveReady = selectedGrade != null;
                                    const isGradeTouched =
                                      !!goalApprovalGradeTouched[goal.goalId];
                                    const hasGradeDraft =
                                      isGradeTouched &&
                                      (draftGrade ?? null) !==
                                        currentSavedGrade;
                                    const hasCommentDraft =
                                      isCommentTouched &&
                                      effectiveComment !== savedComment;
                                    const isDirty =
                                      hasGradeDraft || hasCommentDraft;
                                    const approvalHistoryRows =
                                      rowsSortedByLatestDbWrite
                                        .filter(
                                          (a) =>
                                            (a.targetApprovalVersion ?? -1) !==
                                            currentVersion,
                                        )
                                        .sort((a, b) => {
                                          const av = Number(
                                            a.targetApprovalVersion ?? -1,
                                          );
                                          const bv = Number(
                                            b.targetApprovalVersion ?? -1,
                                          );
                                          if (av !== bv) return bv - av;
                                          const at = new Date(
                                            a.updated ?? a.created ?? "",
                                          ).getTime();
                                          const bt = new Date(
                                            b.updated ?? b.created ?? "",
                                          ).getTime();
                                          return bt - at;
                                        });

                                    const statusBadge = (() => {
                                      if (isCommonGoal) {
                                        return (
                                          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none">
                                            공통목표
                                          </Badge>
                                        );
                                      }
                                      if (approvalStatus === "approved") {
                                        return (
                                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">
                                            승인됨 (T)
                                          </Badge>
                                        );
                                      }
                                      if (approvalStatus === "rejected") {
                                        return (
                                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none">
                                            반려됨 (F)
                                          </Badge>
                                        );
                                      }
                                      return (
                                        <Badge
                                          variant="outline"
                                          className="text-slate-600"
                                        >
                                          승인 대기
                                        </Badge>
                                      );
                                    })();

                                    return (
                                      <Card
                                        key={goal.goalId}
                                        className="border-none shadow-sm ring-1 ring-slate-200"
                                      >
                                        <CardHeader className="py-3 px-4 border-b bg-slate-50/40">
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                              <p className="font-bold text-slate-900 truncate">
                                                {goal.title}
                                              </p>
                                              <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                                                {goal.description}
                                              </p>
                                            </div>
                                            {statusBadge ? (
                                              <div className="shrink-0">
                                                {statusBadge}
                                              </div>
                                            ) : null}
                                          </div>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-3">
                                          {!isCommonGoal ? (
                                            <>
                                              <div className="flex flex-wrap gap-2">
                                            <Button
                                              type="button"
                                              size="sm"
                                              className={
                                                selectedGrade === "T"
                                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                                  : "bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-800 border border-emerald-200"
                                              }
                                              variant={
                                                selectedGrade === "T"
                                                  ? "default"
                                                  : "outline"
                                              }
                                              onClick={() => (
                                                setGoalApprovalGradeTouched(
                                                  (prev) => ({
                                                    ...prev,
                                                    [goal.goalId]: true,
                                                  }),
                                                ),
                                                setGoalApprovalGradeDrafts(
                                                  (prev) => ({
                                                    ...prev,
                                                    [goal.goalId]: "T",
                                                  }),
                                                )
                                              )}
                                            >
                                              승인 (T)
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="outline"
                                              className={
                                                selectedGrade === "F"
                                                  ? "bg-red-600 text-white hover:bg-red-700 border-red-600"
                                                  : "border-red-200 text-red-700 hover:bg-red-50"
                                              }
                                              onClick={() => (
                                                setGoalApprovalGradeTouched(
                                                  (prev) => ({
                                                    ...prev,
                                                    [goal.goalId]: true,
                                                  }),
                                                ),
                                                setGoalApprovalGradeDrafts(
                                                  (prev) => ({
                                                    ...prev,
                                                    [goal.goalId]: "F",
                                                  }),
                                                )
                                              )}
                                            >
                                              반려 (F)
                                            </Button>
                                            <Button
                                              type="button"
                                              size="sm"
                                              className="ml-auto"
                                              disabled={
                                                !currentUserId ||
                                                !isSaveReady ||
                                                !isDirty
                                              }
                                              onClick={() => {
                                                if (!currentUserId) return;
                                                if (!selectedGrade) return;
                                                mutateAssessGoal({
                                                  goalId: goal.goalId,
                                                  gradedBy: currentUserId,
                                                  assessTerm: "goal_approval",
                                                  grade: selectedGrade,
                                                  comment: effectiveComment,
                                                });
                                              }}
                                            >
                                              저장
                                            </Button>
                                              </div>

                                              <div className="space-y-1">
                                                <Label className="text-xs text-slate-600">
                                                  승인/반려 코멘트 (선택)
                                                </Label>
                                                <Textarea
                                                  value={effectiveComment}
                                                  onChange={(e) => (
                                                    setGoalApprovalCommentTouched(
                                                      (prev) => ({
                                                        ...prev,
                                                        [goal.goalId]: true,
                                                      }),
                                                    ),
                                                    setGoalApprovalDrafts(
                                                      (prev) => ({
                                                        ...prev,
                                                        [goal.goalId]:
                                                          e.target.value,
                                                      }),
                                                    )
                                                  )}
                                                  rows={3}
                                                  className="text-sm"
                                                  placeholder="반려 사유 또는 승인 메모를 남겨주세요."
                                                />
                                              </div>

                                              {approvalHistoryRows.length > 0 ? (
                                                <Accordion
                                                  type="single"
                                                  collapsible
                                                >
                                                  <AccordionItem
                                                    value={`approval-history-${goal.goalId}`}
                                                  >
                                                    <AccordionTrigger className="py-2 text-xs text-slate-700 hover:no-underline">
                                                      반려 이력 보기
                                                    </AccordionTrigger>
                                                    <AccordionContent className="pb-0">
                                                      <div className="space-y-2">
                                                        {approvalHistoryRows.map(
                                                          (row) => {
                                                        const rowGrade = String(
                                                          row.grade ?? "",
                                                        )
                                                          .trim()
                                                          .toUpperCase();
                                                        const rowVersion =
                                                          Number(
                                                            row.targetApprovalVersion ??
                                                              -1,
                                                          ) || -1;
                                                        const isCurrent =
                                                          rowVersion ===
                                                          currentVersion;
                                                        const rowUpdated =
                                                          row.updated ??
                                                          row.created ??
                                                          "";
                                                        const label =
                                                          rowGrade === "T"
                                                            ? "승인 (T)"
                                                            : rowGrade === "F"
                                                              ? "반려 (F)"
                                                              : row.grade;
                                                        return (
                                                          <div
                                                            key={`${row.goalAssessId}`}
                                                            className="rounded-md border border-slate-200 bg-white px-3 py-2"
                                                          >
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                              <div className="flex flex-wrap items-center gap-2">
                                                                <Badge
                                                                  variant="outline"
                                                                  className="text-xs"
                                                                >
                                                                  v{rowVersion}
                                                                  {isCurrent
                                                                    ? " (현재)"
                                                                    : ""}
                                                                </Badge>
                                                                <span className="text-xs font-medium text-slate-900">
                                                                  {label}
                                                                </span>
                                                              </div>
                                                              {rowUpdated ? (
                                                                <span className="text-xs text-slate-500">
                                                                  {new Date(
                                                                    rowUpdated,
                                                                  ).toLocaleString()}
                                                                </span>
                                                              ) : null}
                                                            </div>
                                                            {row.comment?.trim() ? (
                                                              <p className="mt-1 text-xs text-slate-700 whitespace-pre-wrap">
                                                                {row.comment}
                                                              </p>
                                                            ) : (
                                                              <p className="mt-1 text-xs text-slate-400">
                                                                코멘트 없음
                                                              </p>
                                                            )}
                                                          </div>
                                                        );
                                                          },
                                                        )}
                                                      </div>
                                                    </AccordionContent>
                                                  </AccordionItem>
                                                </Accordion>
                                              ) : null}
                                            </>
                                          ) : null}
                                        </CardContent>
                                      </Card>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="grid min-w-0 gap-5">
                                  {[...user.goals].map((goal) => (
                                    <GoalAssessmentItem
                                      key={goal.goalId}
                                      goal={goal}
                                      currentUserId={currentUserId}
                                      targetUserId={user.userId}
                                      targetUserJobGroup={user.jobGroup}
                                      onSave={handleSaveAssessment}
                                      disabled={
                                        !isSpectator &&
                                        !leaderGoalAssessmentAllowed
                                      }
                                      writableAssessTerm={
                                        leaderPerfAssessTerm ?? undefined
                                      }
                                      isSpectator={isSpectator}
                                      hrCanEditOthersGrades={isAdmin}
                                      hrCannotSubmitOwnGoalGrade={
                                        hrCannotSelfGrade
                                      }
                                    />
                                  ))}
                                </div>
                              )
                            ) : (
                              <div className="text-center py-16 bg-white rounded-xl border border-dashed">
                                <GoalIcon className="w-8 h-8 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900">
                                  등록된 목표가 없습니다
                                </h3>
                              </div>
                            )}
                          </div>

                          <div className="p-4 bg-white border-t flex justify-end gap-2 sticky bottom-0 z-10">
                            <DialogClose asChild>
                              <Button variant="ghost">닫기</Button>
                            </DialogClose>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        size="sm"
                        disabled={finalButtonDisabled}
                        className={
                          finalButtonDisabled && !isSpectator
                            ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                            : isSpectator
                              ? "bg-purple-100 text-purple-700 border border-purple-200"
                              : finalButtonLooksComplete
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : "bg-purple-600 hover:bg-purple-700 text-white"
                        }
                        onClick={() => {
                          if (!isSubmittedOrFinished) {
                            toast.error(
                              "평가 대상자가 아직 최종 평가를 제출하지 않았습니다.",
                            );
                            return;
                          }
                          if (leaderPerfAssessTerm == null) {
                            toast.error(
                              "팀장 성과 종합 평가는 3단계(중간)·5단계(기말)에서만 진행할 수 있습니다.",
                            );
                            return;
                          }
                          if (hrCannotSelfGrade) {
                            const first =
                              leaderPerformanceAssessments.find(
                                (a) => a.assessTerm === leaderPerfAssessTerm,
                              ) ?? leaderPerformanceAssessments[0];
                            setFinalOverrideAssessedById(
                              first?.assessedById ?? null,
                            );
                            if (first) {
                              setFinalGrade(first.grade);
                              setFinalComment(first.comment);
                            } else {
                              setFinalGrade("");
                              setFinalComment("");
                            }
                          } else if (myFinalAssessment) {
                            setFinalOverrideAssessedById(null);
                            setFinalGrade(myFinalAssessment.grade);
                            setFinalComment(myFinalAssessment.comment);
                          } else {
                            setFinalOverrideAssessedById(null);
                            setFinalGrade("");
                            setFinalComment("");
                          }
                          // 목표 승인(2단계) 모달은 "마지막 저장 상태"를 기준으로 열려야 한다.
                          // 이전에 입력하던 draft/touched 상태가 남아있으면 빈 값이 보일 수 있어서 여기서 초기화한다.
                          resetGoalApprovalDraftState();
                          setSelectedUserForFinal(user);
                        }}
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        {!isSubmittedOrFinished
                          ? "제출 대기"
                          : hrCannotSelfGrade
                            ? hasLeaderPerformanceForRound
                              ? "등급 수정 (HR)"
                              : "리더 평가 대기"
                            : !isRoundAssessedByLeader
                              ? "최종 평가"
                              : "평가 수정"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog
        open={!!selectedUserForFinal}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedUserForFinal(null);
            setFinalOverrideAssessedById(null);
            setFinalGrade("");
            setFinalComment("");
            resetGoalApprovalDraftState();
          }
        }}
      >
        <DialogContent className="flex max-h-[90vh] max-w-2xl flex-col gap-4 overflow-hidden p-6 sm:max-w-2xl">
          <DialogHeader className="shrink-0 space-y-1.5 text-left">
            <DialogTitle>
              {leaderPerfAssessTerm === "mid"
                ? `중간 성과 종합 평가 (${selectedUserForFinal?.koreanName})`
                : leaderPerfAssessTerm === "final"
                  ? `기말 성과 종합 평가 (${selectedUserForFinal?.koreanName})`
                  : `성과 종합 평가 (${selectedUserForFinal?.koreanName})`}
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
            {selectedUserForFinal ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600">
                  피평가자 성과 종합 자가 (참고)
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <PerformanceSelfSummaryPanel
                    title="중간 자가"
                    snapshot={selectedUserForFinal.selfPerformanceMid}
                  />
                  <PerformanceSelfSummaryPanel
                    title="기말 자가"
                    snapshot={
                      selectedUserForFinal.selfPerformanceFinal ??
                      (!selectedUserForFinal.selfPerformanceMid &&
                      selectedUserForFinal.selfAssessment
                        ? {
                            grade: selectedUserForFinal.selfAssessment.grade,
                            comment:
                              selectedUserForFinal.selfAssessment.comment,
                            updated:
                              selectedUserForFinal.selfAssessment.updated,
                          }
                        : undefined)
                    }
                  />
                </div>
              </div>
            ) : null}
            {selectedUserForFinal ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-600">
                  팀장 성과 종합 제출 내역 (참고)
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {(() => {
                    const rows = selectedUserForFinal.assessments ?? [];
                    const leaderMid = rows.find(
                      (a) =>
                        isPerformanceSummaryRow(a) &&
                        a.assessedById === currentUserId &&
                        (a.assessTerm ?? "final") === "mid",
                    );
                    const leaderFinal = rows.find(
                      (a) =>
                        isPerformanceSummaryRow(a) &&
                        a.assessedById === currentUserId &&
                        (a.assessTerm ?? "final") === "final",
                    );
                    const toSnap = (
                      a: NonNullable<User["assessments"]>[number] | undefined,
                    ): PerformanceSummarySnapshot | undefined =>
                      a
                        ? {
                            grade: a.grade,
                            comment: a.comment ?? "",
                            updated: a.updated,
                          }
                        : undefined;
                    return (
                      <>
                        <PerformanceSelfSummaryPanel
                          title="중간 팀장 평가"
                          snapshot={toSnap(leaderMid)}
                        />
                        <PerformanceSelfSummaryPanel
                          title="기말 팀장 평가"
                          snapshot={toSnap(leaderFinal)}
                        />
                      </>
                    );
                  })()}
                </div>
              </div>
            ) : null}
            <div className="space-y-4">
              <Label>기존 평가 내역</Label>
              <div className="space-y-3">
                {selectedUserForFinal?.assessments
                  ?.filter(
                    (a) => a.assessedById !== selectedUserForFinal.userId,
                  )
                  .map((as, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {as.assessedByUser?.koreanName || "평가자"}
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-purple-50 text-purple-700 border-purple-100"
                          >
                            {as.grade}등급
                          </Badge>
                        </div>
                        {as.updated && (
                          <span className="text-[10px] text-gray-400 font-normal">
                            {new Date(as.updated).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                        {as.comment || "코멘트 없음"}
                      </p>
                    </div>
                  ))}
                {(!selectedUserForFinal?.assessments ||
                  selectedUserForFinal.assessments.length === 0) && (
                  <div className="text-center py-4 text-xs text-gray-400 italic">
                    아직 등록된 종합 평가가 없습니다.
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-gray-100 my-4" />

            {selectedUserForFinal &&
              (hrCannotSelfGrade || !!finalOverrideAssessedById) && (
                <div className="space-y-2">
                  <Label>수정할 평가자 (리더)</Label>
                  <Select
                    value={finalOverrideAssessedById ?? ""}
                    onValueChange={(id) => {
                      setFinalOverrideAssessedById(id);
                      const row = selectedUserForFinal.assessments?.find(
                        (a) =>
                          a.assessedById === id &&
                          leaderPerfAssessTerm &&
                          a.assessTerm === leaderPerfAssessTerm &&
                          (a.assessType === "performance" || !a.assessType),
                      );
                      if (row) {
                        setFinalGrade(row.grade);
                        setFinalComment(row.comment);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="평가자 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {(selectedUserForFinal.assessments ?? [])
                        .filter(
                          (a) =>
                            !!a.assessedById &&
                            a.assessedById !== selectedUserForFinal.userId &&
                            !!leaderPerfAssessTerm &&
                            a.assessTerm === leaderPerfAssessTerm &&
                            (a.assessType === "performance" || !a.assessType),
                        )
                        .map((a) => (
                          <SelectItem
                            key={
                              a.appraisalById ??
                              `${a.assessedById}-${a.assessType ?? ""}-${a.assessTerm ?? ""}`
                            }
                            value={a.assessedById!}
                          >
                            {a.assessedByUser?.koreanName ?? a.assessedById}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {(selectedUserForFinal.assessments ?? []).filter(
                    (a) =>
                      !!a.assessedById &&
                      a.assessedById !== selectedUserForFinal.userId &&
                      !!leaderPerfAssessTerm &&
                      a.assessTerm === leaderPerfAssessTerm &&
                      (a.assessType === "performance" || !a.assessType),
                  ).length === 0 && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-md p-2">
                      선택한 차수의 리더 성과 평가가 없어 등급을 수정할 수
                      없습니다.
                    </p>
                  )}
                </div>
              )}

            <div className="space-y-2">
              <Label>
                {isSpectator
                  ? "등급 (조회)"
                  : hrCannotSelfGrade || finalOverrideAssessedById
                    ? "선택한 평가자 등급"
                    : "나의 평가 등급"}
              </Label>
              <div
                className={`flex flex-wrap gap-2 ${
                  isSpectator ? "pointer-events-none opacity-70" : ""
                }`}
                role="group"
                aria-label="종합 등급 선택"
                aria-disabled={isSpectator}
              >
                {getFinalOverallGradeButtonOptions(
                  selectedUserForFinal?.jobGroup,
                ).map((g) => {
                  const isSelected = finalGrade === g.value;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      disabled={isSpectator}
                      aria-label={`${g.label} 선택`}
                      aria-pressed={isSelected}
                      onClick={() => setFinalGrade(g.value)}
                      className={`cursor-pointer px-3 py-1.5 rounded-md border text-sm transition-all flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed ${
                        isSelected
                          ? `${g.color} ring-2 ring-blue-400 font-bold`
                          : "border-gray-200 bg-white hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      <span className="font-semibold">{g.value}</span>
                      {g.desc ? (
                        <span className="text-xs opacity-80">{g.desc}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              <Label>
                {isSpectator
                  ? "종합 코멘트 (조회)"
                  : hrCannotSelfGrade || finalOverrideAssessedById
                    ? "선택한 평가자 코멘트"
                    : "나의 종합 코멘트"}
              </Label>
              <Textarea
                disabled={isSpectator}
                placeholder={
                  isSpectator
                    ? "평가 내역이 없습니다."
                    : "종합 평가 의견을 작성해주세요."
                }
                value={finalComment}
                onChange={(e) => setFinalComment(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedUserForFinal(null);
                setFinalOverrideAssessedById(null);
                setFinalGrade("");
                setFinalComment("");
              }}
            >
              취소
            </Button>
            {!isSpectator &&
              (!hrCannotSelfGrade || !!finalOverrideAssessedById) && (
                <Button
                  onClick={handleFinalAssessment}
                  disabled={leaderPerfAssessTerm == null}
                  className="bg-blue-600"
                >
                  {hrCannotSelfGrade
                    ? "등급 저장 (HR)"
                    : selectedUserForFinal?.assessments?.some(
                          (a) =>
                            a.assessedById === currentUserId &&
                            leaderPerfAssessTerm &&
                            a.assessTerm === leaderPerfAssessTerm &&
                            (a.assessType === "performance" || !a.assessType),
                        )
                      ? "종합 평가 수정"
                      : "평가 제출"}
                </Button>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

type LeaderGradeTab = {
  value: string;
  label: string;
  departments: DepartmentAppraisal[];
  hideCommonGoalManagement?: boolean;
  /** HR: 루트→현재 부서 전체 경로 (툴팁) */
  hierarchyTitle?: string;
  /** HR: 현재 부서를 제외한 상위 경로만 (칩 보조 줄) */
  ancestorTrail?: string;
};

type HrLeaderGradeCluster = {
  rootId: string;
  rootLabel: string;
  tabs: LeaderGradeTab[];
};

function buildChildrenByParent(
  flat: DepartmentTreeData[],
): Map<string, DepartmentTreeData[]> {
  const byId = new Map(flat.map((n) => [n.id, n]));
  const m = new Map<string, DepartmentTreeData[]>();
  for (const n of flat) {
    const p =
      n.parent != null && String(n.parent) !== "0" ? String(n.parent) : null;
    if (!p) continue;
    if (!byId.has(p)) continue;
    if (!m.has(p)) m.set(p, []);
    m.get(p)!.push(n);
  }
  for (const [, arr] of m) {
    arr.sort((a, b) => a.text.localeCompare(b.text, "ko"));
  }
  return m;
}

/** parent가 없거나(0) flat에 부모가 없으면 최상위로 간주 */
function getRootDepartmentNodes(
  flat: DepartmentTreeData[],
): DepartmentTreeData[] {
  const byId = new Map(flat.map((n) => [n.id, n]));
  return flat
    .filter((n) => {
      const p =
        n.parent != null && String(n.parent) !== "0" ? String(n.parent) : null;
      if (!p) return true;
      if (!byId.has(p)) return true;
      return false;
    })
    .sort((a, b) => a.text.localeCompare(b.text, "ko"));
}

function getDescendantDepartmentIdsIncludingSelf(
  rootId: string,
  flat: DepartmentTreeData[],
): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const n of flat) {
    const p =
      n.parent != null && String(n.parent) !== "0" ? String(n.parent) : null;
    if (!p) continue;
    if (!childrenByParent.has(p)) childrenByParent.set(p, []);
    childrenByParent.get(p)!.push(n.id);
  }
  const out = new Set<string>();
  const walk = (id: string) => {
    out.add(id);
    for (const c of childrenByParent.get(id) ?? []) walk(c);
  };
  walk(rootId);
  return out;
}

/** 하위 부서 여러 개의 appraisal.user 를 appraisalId 기준으로 합침 (중복 인원 제거) */
function mergeSubtreeDepartmentAppraisals(
  rootId: string,
  rootLabel: string,
  relevant: DepartmentAppraisal[],
): DepartmentAppraisal {
  type Bucket = { base: Appraisal; users: User[]; seen: Set<string> };
  const byAppraisalId = new Map<string, Bucket>();

  for (const da of relevant) {
    for (const appr of da.appraisal) {
      if (!byAppraisalId.has(appr.appraisalId)) {
        byAppraisalId.set(appr.appraisalId, {
          base: appr,
          users: [],
          seen: new Set(),
        });
      }
      const bucket = byAppraisalId.get(appr.appraisalId)!;
      for (const u of appr.user) {
        const k = u.appraisalUserId ?? u.userId;
        if (!bucket.seen.has(k)) {
          bucket.seen.add(k);
          bucket.users.push(u);
        }
      }
    }
  }

  const mergedAppraisal: Appraisal[] = [...byAppraisalId.values()].map((b) => ({
    ...b.base,
    user: b.users,
  }));

  return {
    departmentId: rootId,
    departmentName: rootLabel,
    appraisal: mergedAppraisal,
  };
}

function buildLeaderGradeTabForNode(
  node: DepartmentTreeData,
  appraisals: DepartmentAppraisal[],
  departmentFlat: DepartmentTreeData[],
): LeaderGradeTab {
  const subtreeIds = getDescendantDepartmentIdsIncludingSelf(
    node.id,
    departmentFlat,
  );
  const relevant = appraisals.filter((a) => subtreeIds.has(a.departmentId));

  if (relevant.length === 0) {
    return {
      value: `dept:${node.id}`,
      label: node.text,
      departments: [],
    };
  }

  const onlySelf =
    relevant.length === 1 && relevant[0].departmentId === node.id;

  if (onlySelf) {
    return {
      value: `dept:${node.id}`,
      label: node.text,
      departments: [relevant[0]],
      hideCommonGoalManagement: false,
    };
  }

  return {
    value: `dept:${node.id}`,
    label: node.text,
    departments: [
      mergeSubtreeDepartmentAppraisals(node.id, node.text, relevant),
    ],
    hideCommonGoalManagement: false,
  };
}

/** 루트에서 node까지 이름 경로 (루트→…→node) */
function getPathLabelsRootToNode(
  nodeId: string,
  rootId: string,
  flat: DepartmentTreeData[],
): string[] {
  const byId = new Map(flat.map((n) => [n.id, n]));
  const path: string[] = [];
  let cur: DepartmentTreeData | undefined = byId.get(nodeId);
  while (cur) {
    path.unshift(cur.text);
    if (cur.id === rootId) break;
    const p =
      cur.parent != null && String(cur.parent) !== "0"
        ? String(cur.parent)
        : null;
    if (!p) break;
    cur = byId.get(p);
  }
  return path;
}

function preorderTabsWithHierarchy(
  rootId: string,
  nodeId: string,
  childrenByParent: Map<string, DepartmentTreeData[]>,
  tabByNodeId: Map<string, LeaderGradeTab>,
  flat: DepartmentTreeData[],
): LeaderGradeTab[] {
  const tab = tabByNodeId.get(nodeId);
  const out: LeaderGradeTab[] = [];
  if (tab) {
    const path = getPathLabelsRootToNode(nodeId, rootId, flat);
    const hierarchyTitle = path.join(" › ");
    const ancestorTrail =
      path.length > 1 ? path.slice(0, -1).join(" › ") : undefined;
    out.push({ ...tab, hierarchyTitle, ancestorTrail });
  }
  const children = childrenByParent.get(nodeId) ?? [];
  for (const child of children) {
    out.push(
      ...preorderTabsWithHierarchy(
        rootId,
        child.id,
        childrenByParent,
        tabByNodeId,
        flat,
      ),
    );
  }
  return out;
}

/**
 * HR: 조직 트리 루트마다 클러스터. 각 클러스터 안 탭은 전위 순회 + 경로(상위 › 하위) 메타.
 * 상위 부서는 자기 + 모든 하위 부서 인원을 합쳐 표시(기존과 동일).
 */
function buildHrLeaderGradeClusters(
  appraisals: DepartmentAppraisal[],
  departmentFlat: DepartmentTreeData[],
): HrLeaderGradeCluster[] {
  const roots = getRootDepartmentNodes(departmentFlat);
  const childrenByParent = buildChildrenByParent(departmentFlat);
  const tabByNodeId = new Map<string, LeaderGradeTab>();
  for (const node of departmentFlat) {
    tabByNodeId.set(
      node.id,
      buildLeaderGradeTabForNode(node, appraisals, departmentFlat),
    );
  }
  return roots.map((root) => ({
    rootId: root.id,
    rootLabel: root.text,
    tabs: preorderTabsWithHierarchy(
      root.id,
      root.id,
      childrenByParent,
      tabByNodeId,
      departmentFlat,
    ),
  }));
}

/** 리더: API로 내려온 본인 팀(부서) 탭만 */
function buildLeaderGradeTabs(
  appraisals: DepartmentAppraisal[],
): LeaderGradeTab[] {
  if (!appraisals.length) return [];
  return appraisals.map((d) => ({
    value: `dept:${d.departmentId}`,
    label: d.departmentName,
    departments: [d],
  }));
}

/** 형제 부서들이 모두 동일한 직계 부모를 가지면 그 부모 id, 아니면 null */
function getCommonParentIdIfAllShareSameParent(
  departmentIds: string[],
  flat: DepartmentTreeData[],
): string | null {
  const unique = [...new Set(departmentIds)];
  if (unique.length < 2) return null;
  const byId = new Map(flat.map((n) => [n.id, n]));
  let commonParent: string | null = null;
  for (const id of unique) {
    const n = byId.get(id);
    const p =
      n?.parent != null && String(n.parent) !== "0" ? String(n.parent) : null;
    if (!p) return null;
    if (commonParent === null) commonParent = p;
    else if (commonParent !== p) return null;
  }
  return commonParent;
}

/**
 * 리더: 하위 부서가 여러 개이거나, 리더로 묶인 형제 부서가 2개 이상이면
 * 맨 앞에 통합 탭(등급 분포·표 전체 합산)을 둔다.
 */
function buildLeaderGradeTabsWithCombined(
  appraisals: DepartmentAppraisal[],
  departmentFlat: DepartmentTreeData[],
  leaderDepartmentIds: string[],
): LeaderGradeTab[] {
  const perDept = buildLeaderGradeTabs(appraisals);
  if (!departmentFlat.length || !leaderDepartmentIds.length) {
    return perDept;
  }

  let mergedDepartments: DepartmentAppraisal[] | null = null;
  let label = "전체 팀";
  let hierarchyTitle: string | undefined;

  let best: { leaderId: string; relevant: DepartmentAppraisal[] } | null = null;
  for (const leaderId of leaderDepartmentIds) {
    const subtree = getDescendantDepartmentIdsIncludingSelf(
      leaderId,
      departmentFlat,
    );
    const relevant = appraisals.filter((a) => subtree.has(a.departmentId));
    if (relevant.length >= 2) {
      if (!best || relevant.length > best.relevant.length) {
        best = { leaderId, relevant };
      }
    }
  }

  if (best) {
    const node = departmentFlat.find((n) => n.id === best!.leaderId);
    label = node?.text ? `${node.text} 전체` : "전체 팀";
    hierarchyTitle = `${label} · 하위 부서 통합`;
    mergedDepartments = [
      mergeSubtreeDepartmentAppraisals(
        best.leaderId,
        node?.text ?? label,
        best.relevant,
      ),
    ];
  } else if (appraisals.length >= 2) {
    const ids = appraisals.map((a) => a.departmentId);
    const uniqueDeptIds = [...new Set(ids)];
    const allFromLeaderRoles = uniqueDeptIds.every((id) =>
      leaderDepartmentIds.includes(id),
    );
    const parentId = getCommonParentIdIfAllShareSameParent(
      uniqueDeptIds,
      departmentFlat,
    );
    if (allFromLeaderRoles && parentId && uniqueDeptIds.length >= 2) {
      const parentNode = departmentFlat.find((n) => n.id === parentId);
      label = parentNode?.text ? `${parentNode.text} 소속 전체` : "전체 팀";
      hierarchyTitle = `${label} · 같은 상위 부서 팀 통합`;
      mergedDepartments = [
        mergeSubtreeDepartmentAppraisals(parentId, label, appraisals),
      ];
    }
  }

  if (!mergedDepartments) {
    return perDept;
  }

  const combinedTab: LeaderGradeTab = {
    value: "leader-tab:combined",
    label,
    departments: mergedDepartments,
    hideCommonGoalManagement: true,
    hierarchyTitle,
  };

  /* 맨 뒤: 기본 선택이 첫 부서 탭으로 유지되고, 트리 로드 후에도 포커스가 어색하게 바뀌지 않음 */
  return [...perDept, combinedTab];
}

const triggerClass =
  "data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm shrink-0 bg-white border border-gray-200 px-4 py-2 text-sm shadow-sm rounded-lg transition-all hover:bg-gray-50";

function renderLeaderGradeTabContent(
  tab: LeaderGradeTab,
  currentUserId: string,
  departmentFlat?: DepartmentTreeData[],
) {
  if (tab.departments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/60 py-12 text-center text-sm text-muted-foreground">
        이 부서의 팀원 평가 데이터가 없습니다.
      </div>
    );
  }
  return (
    <>
      {tab.departments.map((dept) => (
        <div key={dept.departmentId} className="space-y-4">
          {dept.appraisal.map((appraisal) => (
            <AppraisalSection
              key={`${dept.departmentId}-${appraisal.appraisalId}`}
              appraisal={appraisal}
              departmentId={dept.departmentId}
              departmentName={dept.departmentName}
              currentUserId={currentUserId || ""}
              hideCommonGoalManagement={tab.hideCommonGoalManagement}
              departmentFlat={departmentFlat}
            />
          ))}
        </div>
      ))}
    </>
  );
}

const LeaderGradeCard = ({
  departmentAppraisals,
  currentUserId,
  departmentFlat,
  useHrGroupView = false,
  leaderDepartmentIds,
}: {
  departmentAppraisals: DepartmentAppraisal[];
  currentUserId?: string;
  /** GET_departments("flat") — HR일 때 탭 목록(팀 단위)과 동일 소스; 일반 리더는 통합 탭용 */
  departmentFlat?: DepartmentTreeData[];
  /** HR/관리자만 true: flat 부서마다 탭(역량 HR 부서 선택과 대응) */
  useHrGroupView?: boolean;
  /** 일반 리더: isLeader 부서 id 목록(통합 탭 판별용). HR 뷰에서는 생략 */
  leaderDepartmentIds?: string[];
}) => {
  const hrClusters = useMemo(
    () =>
      useHrGroupView && departmentFlat?.length
        ? buildHrLeaderGradeClusters(departmentAppraisals ?? [], departmentFlat)
        : null,
    [useHrGroupView, departmentFlat, departmentAppraisals],
  );

  const leaderTabs = useMemo(() => {
    const raw = departmentAppraisals ?? [];
    if (useHrGroupView) return [];
    if (leaderDepartmentIds?.length && departmentFlat?.length) {
      return buildLeaderGradeTabsWithCombined(
        raw,
        departmentFlat,
        leaderDepartmentIds,
      );
    }
    return buildLeaderGradeTabs(raw);
  }, [
    departmentAppraisals,
    useHrGroupView,
    departmentFlat,
    leaderDepartmentIds,
  ]);

  const [activeTab, setActiveTab] = useState<string>("");
  const [activeRootTab, setActiveRootTab] = useState<string>("");
  const [activeDeptTab, setActiveDeptTab] = useState<string>("");

  useEffect(() => {
    if (hrClusters) return;
    if (!leaderTabs.length) return;
    setActiveTab((prev) =>
      prev && leaderTabs.some((t) => t.value === prev)
        ? prev
        : leaderTabs[0].value,
    );
  }, [leaderTabs, hrClusters]);

  useEffect(() => {
    if (!hrClusters?.length) return;
    setActiveRootTab((prev) =>
      prev && hrClusters.some((c) => c.rootId === prev)
        ? prev
        : hrClusters[0].rootId,
    );
  }, [hrClusters]);

  useEffect(() => {
    if (!hrClusters?.length || !activeRootTab) return;
    const cluster = hrClusters.find((c) => c.rootId === activeRootTab);
    if (!cluster?.tabs.length) return;
    setActiveDeptTab((prev) =>
      cluster.tabs.some((t) => t.value === prev) ? prev : cluster.tabs[0].value,
    );
  }, [hrClusters, activeRootTab]);

  const handleHrRootChange = useCallback(
    (rootId: string) => {
      setActiveRootTab(rootId);
      const cluster = hrClusters?.find((c) => c.rootId === rootId);
      if (cluster?.tabs[0]) {
        setActiveDeptTab(cluster.tabs[0].value);
      }
    },
    [hrClusters],
  );

  if (!departmentAppraisals) return null;

  if (hrClusters) {
    if (!hrClusters.length) return null;

    const activeCluster = hrClusters.find((c) => c.rootId === activeRootTab);

    return (
      <div className="w-full space-y-4">
        <Tabs
          value={activeRootTab}
          onValueChange={handleHrRootChange}
          className="w-full"
        >
          <TabsList className="flex h-auto w-full min-w-0 flex-wrap gap-2 bg-transparent p-0">
            {hrClusters.map((cluster) => (
              <TabsTrigger
                key={cluster.rootId}
                value={cluster.rootId}
                className={triggerClass}
              >
                {cluster.rootLabel}
              </TabsTrigger>
            ))}
          </TabsList>
          {hrClusters.map((cluster) => (
            <TabsContent
              key={cluster.rootId}
              value={cluster.rootId}
              className="mt-0 outline-none"
            >
              <span className="sr-only">{cluster.rootLabel} 선택됨</span>
            </TabsContent>
          ))}
        </Tabs>

        {activeCluster ? (
          <Tabs
            key={activeCluster.rootId}
            value={activeDeptTab}
            onValueChange={setActiveDeptTab}
            className="w-full"
          >
            <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
              <TabsList className="flex h-auto w-full min-w-0 flex-row flex-wrap content-start items-stretch gap-2 bg-transparent p-0">
                {activeCluster.tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    title={tab.hierarchyTitle}
                    className={`${triggerClass} h-auto min-h-0 shrink-0 flex-col items-stretch gap-1 py-2.5 text-left`}
                  >
                    <span className="truncate text-sm font-medium leading-tight">
                      {tab.label}
                    </span>
                    {tab.ancestorTrail ? (
                      <span
                        className="max-w-[16rem] truncate text-left text-[11px] font-normal leading-snug text-muted-foreground"
                        title={tab.ancestorTrail}
                      >
                        {tab.ancestorTrail}
                      </span>
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {activeCluster.tabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className="mt-4 outline-none"
              >
                {renderLeaderGradeTabContent(
                  tab,
                  currentUserId || "",
                  departmentFlat,
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : null}
      </div>
    );
  }

  if (!leaderTabs.length) return null;

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-4 flex flex-wrap h-auto gap-2 bg-transparent justify-start p-0">
        {leaderTabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className={triggerClass}
            title={tab.hierarchyTitle ?? tab.label}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {leaderTabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-0">
          {renderLeaderGradeTabContent(
            tab,
            currentUserId || "",
            departmentFlat,
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default LeaderGradeCard;
