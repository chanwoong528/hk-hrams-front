import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  GET_userCompetencyAssessments,
  PATCH_competencyAssessment,
} from "@/api/competency/competency";
import {
  GET_appraisalsByDistinctType,
  GET_appraisalsOfTeamMembers,
} from "@/api/appraisal/appraisal";
import { useCurrentUserStore } from "@/store/currentUserStore";
import {
  User as UserIcon,
  Users,
  SaveAll,
  Loader2,
  CheckCircle2,
  Circle,
  ChevronRight,
  MessageSquare,
  ClipboardList,
  Building2,
  FileText,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GET_departments } from "@/api/department/department";
import { isHrOrAdminUser } from "@/lib/hrAccess";
import { CompetencyFinalAssessmentDialog } from "./components/CompetencyFinalAssessmentDialog";
import { useCompetencyFinalAssessment } from "./hooks/useCompetencyFinalAssessment";
import { isAppraisalEditableByEndDate } from "../GoalManagement/utils";
import {
  competencyFinalRoundForLeader,
  competencyFinalRoundForSelf,
  normalizeAssessTerm,
} from "@/lib/appraisalMacroWorkflow";

const GRADES = ["O", "E", "M", "P", "N"];

/** HR 제외: 자가는 5단계 이전에 기말 블록 숨김, 리더는 6단계 이전에 기말 숨김 */
function shouldShowCompetencyTermBlock(
  termKey: "mid" | "final",
  ctx: {
    isHr: boolean;
    isSelfTarget: boolean;
    macroPhase: number;
  },
): boolean {
  if (ctx.isHr) return true;
  if (termKey === "final") {
    if (ctx.isSelfTarget) return ctx.macroPhase >= 5;
    return ctx.macroPhase >= 6;
  }
  return true;
}

interface LocalEdit {
  grade?: string;
  comment?: string;
}

export default function CompetencyEvaluation() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useCurrentUserStore();
  const [hrSelectedDeptId, setHrSelectedDeptId] = useState<string>("");

  const handleHrDeptChange = (deptId: string) => {
    setHrSelectedDeptId(deptId);
    setSelectedAppraisalUserId("");
    setLocalEdits({});
  };

  const isHR = useMemo(
    () => isHrOrAdminUser(currentUser?.email, currentUser?.departments),
    [currentUser],
  );

  const [selectedAppraisalUserId, setSelectedAppraisalUserId] =
    useState<string>(searchParams.get("appraisalUserId") || "");

  const [isFinalDialogOpen, setIsFinalDialogOpen] = useState(false);
  const [finalGrade, setFinalGrade] = useState("");

  // Local state for pending edits: Record<assessmentId, LocalEdit>
  const [localEdits, setLocalEdits] = useState<Record<string, LocalEdit>>({});
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch "My" appraisals (to get self participation)
  const { data: myAppraisals, isLoading: isLoadingMyAppraisals } = useQuery({
    queryKey: ["myAppraisals"],
    queryFn: () => GET_appraisalsByDistinctType("my-appraisal"),
    select: (data) => data.data as any[],
  });

  // 2. Fetch Team Members Hierarchy (Rank and Leader base)
  const leaderDeptIds = useMemo(() => {
    return (
      currentUser?.departments
        ?.filter((d) => d.isLeader)
        .map((d) => d.departmentId) || []
    );
  }, [currentUser]);

  const { data: teamData, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["teamMembers", leaderDeptIds],
    queryFn: () => GET_appraisalsOfTeamMembers(leaderDeptIds),
    enabled: !isHR && leaderDeptIds.length > 0,
    select: (data) => data.data as any[],
  });

  // 3. Fetch All Departments (for HR)
  const { data: allDepartments } = useQuery({
    queryKey: ["allDepartments"],
    queryFn: () => GET_departments("flat"),
    enabled: isHR,
    select: (data) => data.data as any[],
  });

  // 4. Fetch HR View Team Members
  const { data: hrTeamData, isLoading: isLoadingHRTeam } = useQuery({
    queryKey: ["hrTeamMembers", hrSelectedDeptId],
    queryFn: () => GET_appraisalsOfTeamMembers([hrSelectedDeptId]),
    enabled: isHR && !!hrSelectedDeptId,
    select: (data) => data.data as any[],
  });

  // Flatten team members
  const teamParticipations = useMemo(() => {
    const activeData = isHR ? hrTeamData : teamData;
    if (!activeData) return [];
    const list: any[] = [];
    activeData.forEach((dept) => {
      dept.appraisal.forEach((appr: any) => {
        appr.user.forEach((user: any) => {
          list.push({
            ...user,
            appraisalTitle: appr.title,
            appraisalId: appr.appraisalId,
            endDate: appr.endDate,
            deptName: dept.departmentName,
          });
        });
      });
    });
    return list;
  }, [teamData, hrTeamData, isHR]);

  const selectedAppraisalMeta = useMemo(() => {
    const self = myAppraisals?.find(
      (a: any) => a.appraisalUserId === selectedAppraisalUserId,
    );
    if (self) return { endDate: self.endDate as string | undefined };
    const team = teamParticipations.find(
      (tp: any) => tp.appraisalUserId === selectedAppraisalUserId,
    );
    if (team) return { endDate: team.endDate as string | undefined };
    return { endDate: undefined as string | undefined };
  }, [myAppraisals, teamParticipations, selectedAppraisalUserId]);

  const editableByDeadline = useMemo(
    () => isAppraisalEditableByEndDate(selectedAppraisalMeta.endDate),
    [selectedAppraisalMeta.endDate],
  );

  // Sync state with URL
  useEffect(() => {
    const idInUrl = searchParams.get("appraisalUserId");
    if (idInUrl && idInUrl !== selectedAppraisalUserId) {
      setSelectedAppraisalUserId(idInUrl || "");
      setLocalEdits({});
    }
  }, [searchParams, selectedAppraisalUserId]);

  // Auto-select based on mode or state
  useEffect(() => {
    if (selectedAppraisalUserId) return;

    const mode = searchParams.get("mode");

    if (mode === "team" && teamParticipations.length > 0) {
      setSelectedAppraisalUserId(teamParticipations[0].appraisalUserId);
    } else if (myAppraisals && myAppraisals.length > 0) {
      const ongoing =
        myAppraisals.find((a) => a.status === "ongoing") || myAppraisals[0];
      if (ongoing.appraisalUserId) {
        setSelectedAppraisalUserId(ongoing.appraisalUserId);
      }
    }
  }, [myAppraisals, teamParticipations, selectedAppraisalUserId, searchParams]);

  // 3. Fetch assessments for the selected target
  const { data: assessments, isLoading: isLoadingAssessments } = useQuery({
    queryKey: ["competencyAssessments", selectedAppraisalUserId],
    queryFn: () => GET_userCompetencyAssessments(selectedAppraisalUserId),
    enabled: !!selectedAppraisalUserId,
  });

  const macroWorkflowPhase = useMemo(() => {
    const raw = (assessments as any)?.[0]?.appraisalUser?.appraisal
      ?.macroWorkflowPhase as number | undefined;
    if (raw == null || !Number.isFinite(Number(raw))) return 1;
    return Math.min(6, Math.max(1, Math.floor(Number(raw))));
  }, [assessments]);

  const handleTargetChange = (val: string) => {
    if (Object.keys(localEdits).length > 0) {
      if (
        !confirm(
          "저장되지 않은 변경사항이 있습니다. 그래도 대상을 변경하시겠습니까?",
        )
      ) {
        return;
      }
    }
    setSelectedAppraisalUserId(val);
    const newParams = new URLSearchParams(searchParams);
    newParams.set("appraisalUserId", val);
    setSearchParams(newParams);
    setLocalEdits({});
  };

  // Grouping for UI
  const assessmentsByDept = useMemo(() => {
    if (!assessments) return {};
    return assessments.reduce((acc: Record<string, any[]>, item) => {
      const deptName =
        item.competencyQuestion?.department?.departmentName || "기타";
      if (!acc[deptName]) acc[deptName] = [];
      acc[deptName].push(item);
      return acc;
    }, {});
  }, [assessments]);

  const deptNames = Object.keys(assessmentsByDept);

  type CompetencyTermBucket = {
    selfRecord?: any;
    myRecord?: any;
    otherRecords: any[];
  };

  const emptyTermBucket = (): CompetencyTermBucket => ({
    otherRecords: [],
  });

  /** 문항 × (중간|기말) — 성과 평가와 동일한 차수 모델 */
  const buildQuestionTermGroups = (items: any[]) => {
    const ownerId = items[0]?.appraisalUser?.owner?.userId as
      | string
      | undefined;
    const groups: Record<
      string,
      {
        competencyId: string;
        question: string;
        mid: CompetencyTermBucket;
        final: CompetencyTermBucket;
      }
    > = {};

    items.forEach((item) => {
      const qId = item.competencyQuestion?.competencyId;
      if (!qId) return;
      if (!groups[qId]) {
        groups[qId] = {
          competencyId: qId,
          question: item.competencyQuestion?.question,
          mid: emptyTermBucket(),
          final: emptyTermBucket(),
        };
      }
      const term = normalizeAssessTerm(item.assessTerm);
      const bucket = term === "mid" ? groups[qId].mid : groups[qId].final;
      const evaluatorId = item.evaluator?.userId;
      const isOwnerSelf = !!(ownerId && evaluatorId && ownerId === evaluatorId);
      const isMeEvaluator = evaluatorId === currentUser?.userId;
      if (isOwnerSelf) {
        bucket.selfRecord = item;
      }
      if (isMeEvaluator) {
        bucket.myRecord = item;
      } else if (!isOwnerSelf) {
        bucket.otherRecords.push(item);
      }
    });

    return Object.values(groups);
  };

  // Identify who we are evaluating
  const currentTargetUser = useMemo(() => {
    const self = myAppraisals?.find(
      (a) => a.appraisalUserId === selectedAppraisalUserId,
    );
    if (self)
      return { name: "본인", isSelf: true, userId: currentUser?.userId };
    const team = teamParticipations.find(
      (tp) => tp.appraisalUserId === selectedAppraisalUserId,
    );
    if (team)
      return { name: team.koreanName, isSelf: false, userId: team.userId };
    return null;
  }, [myAppraisals, teamParticipations, selectedAppraisalUserId, currentUser]);

  const canEditCompetencyAssessmentRow = (row: any | undefined) => {
    if (!row || !editableByDeadline) return false;
    const term = normalizeAssessTerm(row.assessTerm);
    if (currentTargetUser?.isSelf) {
      if (term === "mid") return macroWorkflowPhase === 3;
      return macroWorkflowPhase === 5;
    }
    if (term === "mid") return macroWorkflowPhase === 4;
    return macroWorkflowPhase === 6;
  };

  const competencyFinalSubmissionRound = useMemo((): "mid" | "final" | null => {
    if (!currentTargetUser) return null;
    if (currentTargetUser.isSelf) {
      return competencyFinalRoundForSelf(macroWorkflowPhase);
    }
    return competencyFinalRoundForLeader(macroWorkflowPhase);
  }, [currentTargetUser, macroWorkflowPhase]);

  const competencyFinal = useCompetencyFinalAssessment({
    appraisalUserId: selectedAppraisalUserId,
  });

  const ownerUserId = useMemo(() => {
    const id = assessments?.[0]?.appraisalUser?.owner?.userId as
      | string
      | undefined;
    return id;
  }, [assessments]);

  const finalAssessmentList = useMemo(
    () => (competencyFinal.finalQuery.data?.data ?? []) as any[],
    [competencyFinal.finalQuery.data?.data],
  );

  const myFinalRecord = useMemo(() => {
    const me = currentUser?.userId;
    if (!me || !competencyFinalSubmissionRound) return undefined;
    const r = competencyFinalSubmissionRound;
    return finalAssessmentList.find(
      (row: any) =>
        row.assessedById === me && (row.evaluationRound || "mid") === r,
    );
  }, [
    finalAssessmentList,
    currentUser?.userId,
    competencyFinalSubmissionRound,
  ]);

  const evaluatorCompetencySnapshots = useMemo(() => {
    const me = currentUser?.userId;
    if (!me) return { mid: undefined, final: undefined } as const;
    const toSnap = (row: any) => ({
      grade: String(row?.grade ?? ""),
      updated:
        typeof row?.updated === "string"
          ? row.updated
          : row?.updated
            ? new Date(row.updated).toISOString()
            : undefined,
    });
    const midRow = finalAssessmentList.find(
      (row: any) =>
        row.assessedById === me && (row.evaluationRound || "mid") === "mid",
    );
    const finalRow = finalAssessmentList.find(
      (row: any) =>
        row.assessedById === me && (row.evaluationRound || "mid") === "final",
    );
    return {
      mid: midRow ? toSnap(midRow) : undefined,
      final: finalRow ? toSnap(finalRow) : undefined,
    };
  }, [finalAssessmentList, currentUser?.userId]);

  /** 피평가자(팀원) 역량 최종 자가 — 중간·기말 (리더 화면 요약용) */
  const ownerCompetencySnapshots = useMemo(() => {
    if (!ownerUserId) return { mid: undefined, final: undefined } as const;
    const toSnap = (row: any) => ({
      grade: String(row?.grade ?? ""),
      updated:
        typeof row?.updated === "string"
          ? row.updated
          : row?.updated
            ? new Date(row.updated).toISOString()
            : undefined,
    });
    const midRow = finalAssessmentList.find(
      (row: any) =>
        row.assessedById === ownerUserId &&
        (row.evaluationRound || "mid") === "mid",
    );
    const finalRow = finalAssessmentList.find(
      (row: any) =>
        row.assessedById === ownerUserId &&
        (row.evaluationRound || "mid") === "final",
    );
    return {
      mid: midRow ? toSnap(midRow) : undefined,
      final: finalRow ? toSnap(finalRow) : undefined,
    };
  }, [finalAssessmentList, ownerUserId]);

  const finalButton = useMemo(() => {
    const me = currentUser?.userId;
    if (!selectedAppraisalUserId || !me) return { canOpen: false, title: "" };
    if (!assessments || assessments.length === 0)
      return { canOpen: false, title: "" };

    const isSelf = Boolean(currentTargetUser?.isSelf);

    const ownerId = assessments[0]?.appraisalUser?.owner?.userId as
      | string
      | undefined;
    if (!ownerId) return { canOpen: false, title: "" };

    const round = competencyFinalSubmissionRound;
    const selfRecords = !round
      ? []
      : assessments.filter(
          (a: any) =>
            a.evaluator?.userId === ownerId &&
            normalizeAssessTerm(a.assessTerm) === round,
        );
    const myRecords = !round
      ? []
      : assessments.filter(
          (a: any) =>
            a.evaluator?.userId === me &&
            normalizeAssessTerm(a.assessTerm) === round,
        );

    const isSelfComplete =
      selfRecords.length > 0 &&
      selfRecords.every((r: any) => Boolean((r.grade ?? "").trim()));
    const isMyComplete =
      myRecords.length > 0 &&
      myRecords.every((r: any) => Boolean((r.grade ?? "").trim()));

    const roundOk = competencyFinalSubmissionRound != null;

    if (isSelf) {
      const title =
        competencyFinalSubmissionRound === "final"
          ? "역량 기말 최종 자가 평가"
          : competencyFinalSubmissionRound === "mid"
            ? "역량 중간 최종 자가 평가"
            : "역량 최종 자가 평가";
      return {
        canOpen: isSelfComplete && editableByDeadline && roundOk,
        title,
        requiredDone: isSelfComplete,
      };
    }

    // leader evaluating a team member
    const leaderTitle =
      competencyFinalSubmissionRound === "final"
        ? "역량 기말 최종 평가"
        : competencyFinalSubmissionRound === "mid"
          ? "역량 중간 최종 평가"
          : "역량 최종 평가";
    return {
      canOpen: isSelfComplete && isMyComplete && editableByDeadline && roundOk,
      title: leaderTitle,
      requiredDone: isSelfComplete && isMyComplete,
    };
  }, [
    assessments,
    currentTargetUser?.isSelf,
    currentUser?.userId,
    selectedAppraisalUserId,
    editableByDeadline,
    competencyFinalSubmissionRound,
  ]);

  useEffect(() => {
    if (!isFinalDialogOpen) return;
    setFinalGrade(myFinalRecord?.grade ?? "");
  }, [isFinalDialogOpen, myFinalRecord?.grade]);

  /** 본인 화면: 매크로 3·5단계가 아니면 문항 수정 불가(차수별) */
  const isSelfReadOnly = useMemo(() => {
    if (!currentTargetUser?.isSelf || !assessments?.length) return false;
    if (!editableByDeadline) return true;
    return !assessments.some((a: any) => {
      if (a.evaluator?.userId !== currentUser?.userId) return false;
      const term = normalizeAssessTerm(a.assessTerm);
      if (term === "mid") return macroWorkflowPhase === 3;
      return macroWorkflowPhase === 5;
    });
  }, [
    currentTargetUser?.isSelf,
    assessments,
    currentUser?.userId,
    macroWorkflowPhase,
    editableByDeadline,
  ]);

  // Handle local changes
  const handleLocalUpdate = (assessmentId: string, updates: LocalEdit) => {
    const row = assessments?.find((a: any) => a.assessmentId === assessmentId);
    if (!canEditCompetencyAssessmentRow(row)) return;
    if (isSelfReadOnly) return;
    setLocalEdits((prev) => ({
      ...prev,
      [assessmentId]: {
        ...(prev[assessmentId] || {}),
        ...updates,
      },
    }));
  };

  // Batch save
  const handleSaveAll = async () => {
    const editIds = Object.keys(localEdits);
    if (editIds.length === 0) return;

    setIsSaving(true);
    try {
      await Promise.all(
        editIds.map((id) => {
          const e = localEdits[id];
          const payload: { grade?: string; comment?: string } = {};
          if (e.grade !== undefined) payload.grade = e.grade;
          if (e.comment !== undefined) payload.comment = e.comment;
          return PATCH_competencyAssessment(id, payload);
        }),
      );
      toast.success("모든 평가가 성공적으로 저장되었습니다.");
      setLocalEdits({});
      queryClient.invalidateQueries({ queryKey: ["competencyAssessments"] });
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] });
      queryClient.invalidateQueries({ queryKey: ["hrTeamMembers"] });
    } catch (error) {
      console.error("Batch save failed:", error);
      toast.error("일부 평가 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = Object.keys(localEdits).length > 0;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50/50">
      {/* Sidebar - Target List */}
      <div className="w-80 border-r bg-white flex flex-col shrink-0">
        <div className="p-4 border-b bg-gray-50/50 space-y-3">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            평가 대상 목록
          </h3>
          {isHR && (
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-400 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                부서 선택 (HR 전용)
              </Label>
              <Select
                value={hrSelectedDeptId}
                onValueChange={handleHrDeptChange}
              >
                <SelectTrigger className="h-8 text-xs bg-white">
                  <SelectValue placeholder="조회할 부서 선택" />
                </SelectTrigger>
                <SelectContent>
                  {allDepartments?.map((dept: any) => (
                    <SelectItem
                      key={dept.id}
                      value={dept.id}
                      className="text-xs"
                    >
                      {dept.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <p className="text-xs text-gray-500">
            {isHR
              ? "부서를 선택하면 해당 부서 및 하위 부서 소속 사원만 목록에 표시됩니다."
              : "본인 및 팀원을 선택하여 평가를 진행하세요."}
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-4">
            {/* My Evaluation Section */}
            {myAppraisals && myAppraisals.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  나의 평가
                </div>
                {myAppraisals.map((a) => (
                  <button
                    key={a.appraisalUserId + hrSelectedDeptId}
                    onClick={() => handleTargetChange(a.appraisalUserId)}
                    className={`w-full flex flex-col items-start gap-1 px-3 py-3 rounded-lg transition-all text-left ${
                      selectedAppraisalUserId === a.appraisalUserId
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-semibold text-sm truncate">
                        {a.title}
                      </span>
                      {selectedAppraisalUserId === a.appraisalUserId && (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] py-0 h-4 bg-white"
                      >
                        본인
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Team Evaluation Section */}
            {teamParticipations.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {isHR ? "사원 평가 현황" : "팀원 평가"}
                </div>
                {teamParticipations.map((tp) => {
                  const totalSelf = tp.selfCompetencyTotal || 0;
                  const completedSelf = tp.selfCompetencyCompleted || 0;
                  const isSelfFinished =
                    totalSelf > 0 && totalSelf === completedSelf;

                  const totalMy = tp.myCompetencyTotal || 0;
                  const completedMy = tp.myCompetencyCompleted || 0;
                  const isFinished = totalMy > 0 && totalMy === completedMy;

                  return (
                    <button
                      key={tp.appraisalUserId}
                      onClick={() => handleTargetChange(tp.appraisalUserId)}
                      className={`w-full flex flex-col items-start gap-1 px-3 py-3 rounded-lg transition-all text-left ${
                        selectedAppraisalUserId === tp.appraisalUserId
                          ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-semibold text-sm truncate">
                          {tp.koreanName}
                        </span>
                        {isFinished ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300" />
                        )}
                      </div>
                      <div className="flex items-center justify-between w-full text-[10px]">
                        <span className="opacity-70 truncate">
                          {isHR
                            ? tp.appraisalTitle
                            : isSelfFinished
                              ? "평가 진행률"
                              : "자가평가 대기 중"}
                        </span>
                        <span className="font-bold ml-2 shrink-0">
                          {isHR
                            ? `${completedSelf}/${totalSelf} (자가평가)`
                            : isSelfFinished
                              ? `${completedMy}/${totalMy}`
                              : `${completedSelf}/${totalSelf}`}
                        </span>
                      </div>
                      {/* Progress Bar Mini */}
                      <div className="w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full transition-all ${isFinished ? "bg-green-500" : isHR && isSelfFinished ? "bg-green-500" : "bg-blue-500"}`}
                          style={{
                            width: `${isHR || !isSelfFinished ? (totalSelf > 0 ? (completedSelf / totalSelf) * 100 : 0) : totalMy > 0 ? (completedMy / totalMy) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <UserIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                {currentTargetUser?.name || "대상을 선택하세요"}
                {currentTargetUser?.isSelf && (
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none">
                    나의 역량 평가
                  </Badge>
                )}
              </h2>

              {isSelfReadOnly && (
                <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-700 rounded-full border border-slate-200 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  현재 워크플로 단계에서는 역량 문항을 수정할 수 없습니다
                  (중간=3단계, 기말=5단계).
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isSelfReadOnly && selectedAppraisalUserId && (
              <Button
                variant="outline"
                className="gap-2 text-green-700 border-green-200 hover:bg-green-50"
                onClick={() =>
                  navigate(`/evaluation-report/${selectedAppraisalUserId}`)
                }
              >
                <FileText className="w-4 h-4" />
                리포트 보기
              </Button>
            )}
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200 text-xs font-bold animate-pulse">
                <div className="w-2 h-2 bg-amber-500 rounded-full" />
                {Object.keys(localEdits).length}건 수정됨
              </div>
            )}
            <Button
              onClick={handleSaveAll}
              disabled={!hasUnsavedChanges || isSaving || isSelfReadOnly}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-6 gap-2 h-10"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <SaveAll className="w-4 h-4" />
              )}
              변경사항 모두 저장
            </Button>
          </div>
        </header>

        <CompetencyFinalAssessmentDialog
          open={isFinalDialogOpen}
          onOpenChange={setIsFinalDialogOpen}
          title={finalButton.title}
          grade={finalGrade}
          onGradeChange={setFinalGrade}
          activeRound={competencyFinalSubmissionRound}
          peerSnapshots={evaluatorCompetencySnapshots}
          submitDisabled={
            !finalGrade ||
            !finalButton.requiredDone ||
            !editableByDeadline ||
            competencyFinal.isSaving
          }
          onSubmit={() => {
            if (!selectedAppraisalUserId) return;
            if (!finalGrade) return;
            if (!competencyFinalSubmissionRound) {
              toast.error(
                "지금 워크플로 단계에서는 역량 최종 평가를 제출할 수 없습니다.",
              );
              return;
            }
            competencyFinal.upsertFinal({
              appraisalUserId: selectedAppraisalUserId,
              grade: finalGrade,
              evaluationRound: competencyFinalSubmissionRound,
            });
            setIsFinalDialogOpen(false);
          }}
        />

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {(isLoadingMyAppraisals ||
            isLoadingAssessments ||
            isLoadingTeam ||
            isLoadingHRTeam) && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="font-medium">데이터를 불러오는 중입니다...</p>
            </div>
          )}

          {!isLoadingAssessments && selectedAppraisalUserId ? (
            <div className="max-w-5xl mx-auto space-y-8 pb-20">
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-gray-900">
                      역량 최종 평가
                    </p>
                    <p className="text-xs text-gray-500 [overflow-wrap:anywhere]">
                      {(() => {
                        if (deptNames.length === 0) {
                          return "배정된 역량 평가 문항이 없어 최종 평가를 진행할 수 없습니다.";
                        }
                        if (
                          !editableByDeadline &&
                          selectedAppraisalMeta.endDate
                        ) {
                          return "평가 마감일이 지나 최종 평가를 저장/수정할 수 없습니다.";
                        }
                        if (!competencyFinalSubmissionRound) {
                          return currentTargetUser?.isSelf
                            ? "역량 종합 자가 평가는 워크플로 3단계(중간)·5단계(기말)에서 제출할 수 있습니다."
                            : "역량 종합 평가(리더)는 워크플로 4단계(중간)·6단계(기말)에서 제출할 수 있습니다.";
                        }
                        if (!finalButton.requiredDone) {
                          return currentTargetUser?.isSelf
                            ? "모든 역량 평가 문항의 등급을 먼저 등록하면 ‘최종 자가 평가’를 저장할 수 있습니다."
                            : "팀원 자가평가가 완료되고, 리더가 모든 문항의 등급을 등록한 뒤 ‘최종 평가’를 저장할 수 있습니다.";
                        }
                        return "모든 문항 등급 등록 후, 종합 등급(O/E/M/P/N)을 저장하세요.";
                      })()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {!currentTargetUser?.isSelf ? (
                      <div className="mr-1 flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                        <span className="font-semibold text-slate-600">
                          팀원 최종 자가
                        </span>
                        <span className="tabular-nums text-slate-900">
                          <span className="text-slate-500">중간</span>{" "}
                          <span className="font-bold">
                            {ownerCompetencySnapshots.mid?.grade?.trim() || "—"}
                          </span>
                        </span>
                        <span className="text-slate-300">|</span>
                        <span className="tabular-nums text-slate-900">
                          <span className="text-slate-500">기말</span>{" "}
                          <span className="font-bold">
                            {ownerCompetencySnapshots.final?.grade?.trim() ||
                              "—"}
                          </span>
                        </span>
                      </div>
                    ) : null}
                    <Button
                      variant="outline"
                      disabled={
                        deptNames.length === 0 ||
                        !finalButton.canOpen ||
                        competencyFinal.isSaving
                      }
                      className="gap-2"
                      onClick={() => setIsFinalDialogOpen(true)}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {finalButton.title}
                      {myFinalRecord?.grade ? (
                        <span className="ml-1 font-bold">
                          {myFinalRecord.grade}
                        </span>
                      ) : null}
                    </Button>
                    {!editableByDeadline && selectedAppraisalMeta.endDate ? (
                      <span className="text-xs font-medium text-red-500">
                        마감 후 수정 불가
                      </span>
                    ) : null}
                    {editableByDeadline &&
                    selectedAppraisalMeta.endDate &&
                    myFinalRecord?.grade ? (
                      <span className="text-xs text-slate-600">
                        마감 전까지 수정 가능
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {deptNames.length > 0 ? (
                <Tabs defaultValue={deptNames[0]} className="w-full">
                  <TabsList className="mb-6 bg-white border p-1 rounded-xl shadow-sm">
                    {deptNames.map((dept) => (
                      <TabsTrigger
                        key={dept}
                        value={dept}
                        className="px-8 py-2 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none"
                      >
                        {dept}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {deptNames.map((dept) => (
                    <TabsContent key={dept} value={dept} className="space-y-4">
                      {buildQuestionTermGroups(assessmentsByDept[dept]).map(
                        (group) => {
                          const termBlocks = (
                            ["mid", "final"] as const
                          ).flatMap((termKey) => {
                            if (
                              !shouldShowCompetencyTermBlock(termKey, {
                                isHr: isHR,
                                isSelfTarget: !!currentTargetUser?.isSelf,
                                macroPhase: macroWorkflowPhase,
                              })
                            ) {
                              return [];
                            }
                            const bucket = group[termKey];
                            const myRecord = bucket.myRecord;
                            const selfRecord = bucket.selfRecord;
                            const otherRecords = bucket.otherRecords;
                            const roundLabel =
                              termKey === "mid" ? "중간 평가" : "기말 평가";
                            const hasAny =
                              myRecord || selfRecord || otherRecords.length > 0;
                            if (!hasAny) return [];

                            const currentEdit = myRecord
                              ? localEdits[myRecord.assessmentId]
                              : null;
                            const displayGrade =
                              currentEdit?.grade !== undefined
                                ? currentEdit.grade
                                : myRecord?.grade;
                            const isDirty = !!currentEdit;
                            const rowReadOnly =
                              !canEditCompetencyAssessmentRow(myRecord);

                            return [
                              <div
                                key={`${group.competencyId}-${termKey}`}
                                className="space-y-4 border-t border-dashed border-gray-200 pt-4 first:border-t-0 first:pt-0"
                              >
                                <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                                  <span className="text-[11px] font-bold uppercase tracking-wide text-gray-500">
                                    {roundLabel}
                                  </span>
                                </div>
                                {(currentTargetUser?.isSelf || isHR) &&
                                  otherRecords.length > 0 && (
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-1.5 text-blue-700 font-semibold text-xs">
                                        <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                                        {isHR
                                          ? "평가자별 피드백"
                                          : "동료·리더 피드백"}
                                      </div>
                                      <div className="flex flex-col gap-2">
                                        {otherRecords.map((rec: any) => (
                                          <div
                                            key={rec.assessmentId}
                                            className="bg-blue-50/50 px-3 py-2 rounded-lg border border-blue-100/80 flex items-start gap-2.5"
                                          >
                                            <div className="w-8 h-8 rounded-lg bg-white border border-blue-200 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                                              {rec.grade || "—"}
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-0.5">
                                              <div className="text-[11px] font-semibold text-blue-900">
                                                {rec.evaluator?.koreanName}
                                              </div>
                                              <p className="text-xs text-gray-700 leading-snug">
                                                {rec.comment ||
                                                  "의견이 작성되지 않았습니다."}
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                {!currentTargetUser?.isSelf && selfRecord && (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-1.5 text-green-700 font-semibold text-xs">
                                      <ClipboardList className="w-3.5 h-3.5 shrink-0" />
                                      팀원 자기평가 · {roundLabel}
                                    </div>
                                    <div className="bg-green-50/50 px-3 py-2.5 rounded-lg border border-green-100 flex items-start gap-2.5">
                                      <div className="w-9 h-9 rounded-lg bg-white border border-green-200 flex flex-col items-center justify-center shrink-0">
                                        <span className="text-[9px] text-green-600 font-bold leading-none">
                                          등급
                                        </span>
                                        <span className="text-sm font-black text-green-700 leading-tight">
                                          {selfRecord.grade || "—"}
                                        </span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-700 leading-snug italic">
                                          {selfRecord.comment ||
                                            "팀원이 작성한 의견이 없습니다."}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {myRecord ? (
                                  (() => {
                                    const isLeaderBlocked =
                                      !currentTargetUser?.isSelf &&
                                      (!selfRecord ||
                                        !String(selfRecord.grade ?? "").trim());

                                    if (isLeaderBlocked) {
                                      return (
                                        <div className="bg-gray-50 px-4 py-5 rounded-lg text-center border border-dashed border-gray-300 space-y-1.5">
                                          <ClipboardList className="w-6 h-6 mx-auto text-gray-300" />
                                          <p className="text-xs font-semibold text-gray-600">
                                            팀원이 해당 차수 자가평가를 완료하지
                                            않았습니다
                                          </p>
                                          <p className="text-[11px] text-gray-400">
                                            자가 완료 후 같은 차수의 리더 평가를
                                            진행할 수 있습니다.
                                          </p>
                                        </div>
                                      );
                                    }

                                    return (
                                      <div className="max-w-lg space-y-2.5 border-t border-dashed border-gray-200 pt-3">
                                        <Label className="flex flex-wrap items-baseline gap-x-2 text-xs font-semibold text-gray-800">
                                          평가 등급
                                          <span className="text-[10px] font-normal text-gray-500">
                                            {roundLabel} · 필수
                                          </span>
                                        </Label>
                                        <div
                                          className="grid grid-cols-5 gap-1.5 w-full max-w-xs"
                                          role="group"
                                          aria-label={`${roundLabel} 등급 선택`}
                                        >
                                          {GRADES.map((g) => (
                                            <button
                                              key={g}
                                              type="button"
                                              disabled={
                                                isSaving ||
                                                isSelfReadOnly ||
                                                rowReadOnly
                                              }
                                              onClick={() =>
                                                handleLocalUpdate(
                                                  myRecord.assessmentId,
                                                  { grade: g },
                                                )
                                              }
                                              className={`aspect-square max-h-11 rounded-lg border text-sm font-bold transition-all ${
                                                isSelfReadOnly || rowReadOnly
                                                  ? displayGrade === g
                                                    ? "cursor-not-allowed border-green-700 bg-green-600 text-white"
                                                    : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300"
                                                  : displayGrade === g
                                                    ? isDirty
                                                      ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                                                      : "border-blue-600 bg-blue-600 text-white shadow-sm"
                                                    : "border-gray-200 bg-white text-gray-500 hover:border-blue-300 hover:bg-blue-50/50"
                                              }`}
                                            >
                                              {g}
                                            </button>
                                          ))}
                                        </div>
                                        <p className="text-[10px] text-gray-400">
                                          O / E / M / P / N
                                        </p>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <div className="bg-gray-50 px-3 py-4 rounded-lg text-center text-gray-500 border border-dashed border-gray-200 text-xs">
                                    <Users className="w-5 h-5 mx-auto mb-1 opacity-40" />
                                    이 차수에 대한 평가 권한이 없습니다.
                                  </div>
                                )}
                              </div>,
                            ];
                          });

                          const anyDirty = (["mid", "final"] as const).some(
                            (t) => {
                              if (
                                !shouldShowCompetencyTermBlock(t, {
                                  isHr: isHR,
                                  isSelfTarget: !!currentTargetUser?.isSelf,
                                  macroPhase: macroWorkflowPhase,
                                })
                              ) {
                                return false;
                              }
                              const id = group[t].myRecord?.assessmentId;
                              return id ? !!localEdits[id] : false;
                            },
                          );

                          return (
                            <Card
                              key={group.competencyId}
                              className={`transition-all duration-300 border-none shadow-sm ring-1 ${
                                anyDirty
                                  ? "ring-amber-400 bg-amber-50/10"
                                  : "ring-gray-200"
                              }`}
                            >
                              <CardHeader className="py-3 px-4 border-b bg-gray-50/30">
                                <div className="flex items-start gap-3">
                                  <div className="w-7 h-7 rounded-md bg-white border text-[11px] shadow-sm flex items-center justify-center font-bold text-gray-400 shrink-0 mt-0.5">
                                    Q
                                  </div>
                                  <div className="space-y-0.5 min-w-0">
                                    <CardTitle className="text-base font-bold text-gray-800 leading-snug">
                                      {group.question}
                                    </CardTitle>
                                    {anyDirty && (
                                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[10px] py-0">
                                        저장 대기 중
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="p-4 sm:p-5 space-y-4">
                                {termBlocks}
                              </CardContent>
                            </Card>
                          );
                        },
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-10">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 mb-6">
                    <ClipboardList className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    배정된 역량 평가 항목이 없습니다.
                  </h3>
                  <p className="text-gray-500 mt-2 max-w-sm">
                    평가 주기가 시작되지 않았거나, 현재 부서에 배정된 문항이
                    없을 수 있습니다.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
