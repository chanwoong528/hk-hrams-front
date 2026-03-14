import { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const GRADES = ["S", "A", "B", "C", "D"];

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

  const isHR = useMemo(() => {
    return (
      currentUser?.departments?.some((d) => d.departmentName === "HR") || false
    );
  }, [currentUser]);

  const [selectedAppraisalUserId, setSelectedAppraisalUserId] =
    useState<string>(searchParams.get("appraisalUserId") || "");

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
  const allMyDeptIds = useMemo(() => {
    return (
      currentUser?.departments?.map((d) => d.departmentId) || []
    );
  }, [currentUser]);

  const { data: teamData, isLoading: isLoadingTeam } = useQuery({
    queryKey: ["teamMembers", allMyDeptIds],
    queryFn: () => GET_appraisalsOfTeamMembers(allMyDeptIds),
    enabled: !isHR && allMyDeptIds.length > 0,
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
            deptName: dept.departmentName,
          });
        });
      });
    });
    return list;
  }, [teamData, hrTeamData, isHR]);

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

  // Helper to group by question within a department and identify records
  const getGroupedAssessments = (items: any[]) => {
    const groups: Record<
      string,
      {
        question: string;
        selfRecord?: any;
        myRecord?: any;
        otherRecords: any[];
      }
    > = {};

    items.forEach((item) => {
      const qId = item.competencyQuestion?.competencyId;
      if (!groups[qId]) {
        groups[qId] = {
          question: item.competencyQuestion?.question,
          otherRecords: [],
        };
      }

      const ownerId = item.appraisalUser?.owner?.userId;
      const evaluatorId = item.evaluator?.userId;
      const isOwnerSelf = !!(ownerId && evaluatorId && ownerId === evaluatorId);
      const isMeEvaluator = evaluatorId === currentUser?.userId;

      if (isOwnerSelf) {
        groups[qId].selfRecord = item;
      }

      if (isMeEvaluator) {
        groups[qId].myRecord = item;
      } else if (!isOwnerSelf) {
        groups[qId].otherRecords.push(item);
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

  // Determine if self-assessment should be read-only
  // Read-only when ALL questions have both: (1) self grade completed (2) leader grade completed
  const isSelfReadOnly = useMemo(() => {
    if (!currentTargetUser?.isSelf || !assessments || assessments.length === 0)
      return false;

    // Group all assessments by competencyId
    const grouped: Record<
      string,
      { hasSelfGrade: boolean; hasLeaderGrade: boolean }
    > = {};

    assessments.forEach((item: any) => {
      const qId = item.competencyQuestion?.competencyId;
      if (!qId) return;
      if (!grouped[qId]) {
        grouped[qId] = { hasSelfGrade: false, hasLeaderGrade: false };
      }

      const ownerId = item.appraisalUser?.owner?.userId;
      const evaluatorId = item.evaluator?.userId;
      const isOwnerSelf = !!(ownerId && evaluatorId && ownerId === evaluatorId);

      if (isOwnerSelf && item.grade) {
        grouped[qId].hasSelfGrade = true;
      }
      if (!isOwnerSelf && item.grade) {
        grouped[qId].hasLeaderGrade = true;
      }
    });

    const questionIds = Object.keys(grouped);
    if (questionIds.length === 0) return false;

    return questionIds.every(
      (qId) => grouped[qId].hasSelfGrade && grouped[qId].hasLeaderGrade,
    );
  }, [currentTargetUser?.isSelf, assessments]);

  // Handle local changes
  const handleLocalUpdate = (assessmentId: string, updates: LocalEdit) => {
    if (isSelfReadOnly) return; // Prevent edits when read-only
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
        editIds.map((id) =>
          PATCH_competencyAssessment(id, {
            grade: localEdits[id].grade,
            comment: localEdits[id].comment,
          }),
        ),
      );
      toast.success("모든 평가가 성공적으로 저장되었습니다.");
      setLocalEdits({});
      queryClient.invalidateQueries({ queryKey: ["competencyAssessments"] });
      queryClient.invalidateQueries({ queryKey: ["teamMembers"] }); // Refresh progress
    } catch (error) {
      console.error("Batch save failed:", error);
      toast.error("일부 평가 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = Object.keys(localEdits).length > 0;

  return (
    <div className='flex h-[calc(100vh-64px)] overflow-hidden bg-gray-50/50'>
      {/* Sidebar - Target List */}
      <div className='w-80 border-r bg-white flex flex-col shrink-0'>
        <div className='p-4 border-b bg-gray-50/50 space-y-3'>
          <h3 className='font-bold text-gray-900 flex items-center gap-2'>
            <Users className='w-5 h-5 text-blue-600' />
            평가 대상 목록
          </h3>
          {isHR && (
            <div className='space-y-1.5'>
              <Label className='text-[10px] font-bold text-gray-400 flex items-center gap-1'>
                <Building2 className='w-3 h-3' />
                부서 선택 (HR 전용)
              </Label>
              <Select
                value={hrSelectedDeptId}
                onValueChange={setHrSelectedDeptId}>
                <SelectTrigger className='h-8 text-xs bg-white'>
                  <SelectValue placeholder='조회할 부서 선택' />
                </SelectTrigger>
                <SelectContent>
                  {allDepartments?.map((dept: any) => (
                    <SelectItem
                      key={dept.id}
                      value={dept.id}
                      className='text-xs'>
                      {dept.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <p className='text-xs text-gray-500'>
            {isHR
              ? "부서를 선택하여 전 사원의 평가 현황을 조회하세요."
              : "본인 및 팀원을 선택하여 평가를 진행하세요."}
          </p>
        </div>
        <ScrollArea className='flex-1'>
          <div className='p-2 space-y-4'>
            {/* My Evaluation Section */}
            {myAppraisals && myAppraisals.length > 0 && (
              <div className='space-y-1'>
                <div className='px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider'>
                  나의 평가
                </div>
                {myAppraisals.map((a) => (
                  <button
                    key={a.appraisalUserId}
                    onClick={() => handleTargetChange(a.appraisalUserId)}
                    className={`w-full flex flex-col items-start gap-1 px-3 py-3 rounded-lg transition-all text-left ${
                      selectedAppraisalUserId === a.appraisalUserId
                        ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}>
                    <div className='flex items-center justify-between w-full'>
                      <span className='font-semibold text-sm truncate'>
                        {a.title}
                      </span>
                      {selectedAppraisalUserId === a.appraisalUserId && (
                        <ChevronRight className='w-4 h-4' />
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className='text-[10px] py-0 h-4 bg-white'>
                        본인
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Team Evaluation Section */}
            {teamParticipations.length > 0 && (
              <div className='space-y-1'>
                <div className='px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider'>
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
                      }`}>
                      <div className='flex items-center justify-between w-full'>
                        <span className='font-semibold text-sm truncate'>
                          {tp.koreanName}
                        </span>
                        {isFinished ? (
                          <CheckCircle2 className='w-4 h-4 text-green-500' />
                        ) : (
                          <Circle className='w-4 h-4 text-gray-300' />
                        )}
                      </div>
                      <div className='flex items-center justify-between w-full text-[10px]'>
                        <span className='opacity-70 truncate'>
                          {isHR
                            ? tp.appraisalTitle
                            : isSelfFinished
                              ? "평가 진행률"
                              : "자가평가 대기 중"}
                        </span>
                        <span className='font-bold ml-2 shrink-0'>
                          {isHR
                            ? `${completedSelf}/${totalSelf} (자가평가)`
                            : isSelfFinished
                              ? `${completedMy}/${totalMy}`
                              : `${completedSelf}/${totalSelf}`}
                        </span>
                      </div>
                      {/* Progress Bar Mini */}
                      <div className='w-full h-1 bg-gray-100 rounded-full mt-1 overflow-hidden'>
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
      <div className='flex-1 flex flex-col overflow-hidden'>
        {/* Header */}
        <header className='bg-white border-b px-6 py-4 flex items-center justify-between shrink-0'>
          <div className='flex items-center gap-4'>
            <div className='w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm'>
              <UserIcon className='w-6 h-6' />
            </div>
            <div>
              <h2 className='text-lg font-bold text-gray-900 flex items-center gap-2'>
                {currentTargetUser?.name || "대상을 선택하세요"}
                {currentTargetUser?.isSelf && (
                  <Badge className='bg-blue-100 text-blue-700 hover:bg-blue-100 border-none'>
                    나의 역량 평가
                  </Badge>
                )}
              </h2>
              <p className='text-sm text-gray-500'>
                {currentTargetUser?.isSelf
                  ? "본인의 성과와 역량을 객관적으로 되돌아보며 솔직하게 작성해주세요."
                  : "팀원의 역량 발휘 수준과 기여도를 공정하게 평가해주세요."}
              </p>
              {isSelfReadOnly && (
                <div className='mt-2 flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-bold'>
                  <CheckCircle2 className='w-3.5 h-3.5' />
                  리더 평가 완료 — 자가평가가 확정되었습니다
                </div>
              )}
            </div>
          </div>

          <div className='flex items-center gap-4'>
            {isSelfReadOnly && selectedAppraisalUserId && (
              <Button
                variant='outline'
                className='gap-2 text-green-700 border-green-200 hover:bg-green-50'
                onClick={() =>
                  navigate(`/evaluation-report/${selectedAppraisalUserId}`)
                }>
                <FileText className='w-4 h-4' />
                리포트 보기
              </Button>
            )}
            {hasUnsavedChanges && (
              <div className='flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200 text-xs font-bold animate-pulse'>
                <div className='w-2 h-2 bg-amber-500 rounded-full' />
                {Object.keys(localEdits).length}건 수정됨
              </div>
            )}
            <Button
              onClick={handleSaveAll}
              disabled={!hasUnsavedChanges || isSaving || isSelfReadOnly}
              className='bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-6 gap-2 h-10'>
              {isSaving ? (
                <Loader2 className='w-4 h-4 animate-spin' />
              ) : (
                <SaveAll className='w-4 h-4' />
              )}
              변경사항 모두 저장
            </Button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <main className='flex-1 overflow-y-auto p-6'>
          {(isLoadingMyAppraisals ||
            isLoadingAssessments ||
            isLoadingTeam ||
            isLoadingHRTeam) && (
            <div className='flex flex-col items-center justify-center h-full text-gray-400 gap-4'>
              <Loader2 className='w-10 h-10 animate-spin text-blue-600' />
              <p className='font-medium'>데이터를 불러오는 중입니다...</p>
            </div>
          )}

          {!isLoadingAssessments && deptNames.length > 0 ? (
            <div className='max-w-5xl mx-auto space-y-8 pb-20'>
              <Tabs defaultValue={deptNames[0]} className='w-full'>
                <TabsList className='mb-6 bg-white border p-1 rounded-xl shadow-sm'>
                  {deptNames.map((dept) => (
                    <TabsTrigger
                      key={dept}
                      value={dept}
                      className='px-8 py-2 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none'>
                      {dept}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {deptNames.map((dept) => (
                  <TabsContent key={dept} value={dept} className='space-y-6'>
                    {getGroupedAssessments(assessmentsByDept[dept]).map(
                      (group) => {
                        const myRecord = group.myRecord;
                        const selfRecord = group.selfRecord;
                        const otherRecords = group.otherRecords; // Other evaluators if any

                        // Get current value from local state or original data
                        const currentEdit = myRecord
                          ? localEdits[myRecord.assessmentId]
                          : null;
                        const displayGrade =
                          currentEdit?.grade !== undefined
                            ? currentEdit.grade
                            : myRecord?.grade;
                        const displayComment =
                          currentEdit?.comment !== undefined
                            ? currentEdit.comment
                            : myRecord?.comment;
                        const isDirty = !!currentEdit;

                        return (
                          <Card
                            key={group.question}
                            className={`transition-all duration-300 border-none shadow-sm ring-1 ${
                              isDirty
                                ? "ring-amber-400 bg-amber-50/10"
                                : "ring-gray-200"
                            }`}>
                            <CardHeader className='pb-4 border-b bg-gray-50/30'>
                              <div className='flex items-start gap-4'>
                                <div className='w-8 h-8 rounded-lg bg-white border shadow-sm flex items-center justify-center font-bold text-gray-400 shrink-0 mt-1'>
                                  Q
                                </div>
                                <div className='space-y-1'>
                                  <CardTitle className='text-lg font-bold text-gray-800 leading-snug'>
                                    {group.question}
                                  </CardTitle>
                                  {isDirty && (
                                    <Badge className='bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[10px]'>
                                      저장 대기 중
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className='p-8 space-y-8'>
                              {/* Display Other Feedbacks (Team member view sees Leader feedback, HR sees all) */}
                              {(currentTargetUser?.isSelf || isHR) &&
                                otherRecords.length > 0 && (
                                  <div className='space-y-3'>
                                    <div className='flex items-center gap-2 text-blue-700 font-bold text-sm'>
                                      <MessageSquare className='w-4 h-4' />
                                      {isHR
                                        ? "평가자별 피드백 현황"
                                        : "동료 및 리더 피드백"}
                                    </div>
                                    <div className='grid gap-4'>
                                      {otherRecords.map((rec: any) => (
                                        <div
                                          key={rec.assessmentId}
                                          className='bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start gap-4'>
                                          <div className='w-10 h-10 rounded-full bg-white border border-blue-200 flex items-center justify-center text-blue-600 font-bold shrink-0'>
                                            {rec.grade || "-"}
                                          </div>
                                          <div className='flex-1 space-y-1'>
                                            <div className='text-xs font-bold text-blue-800 flex justify-between'>
                                              <span>
                                                평가자:{" "}
                                                {rec.evaluator?.koreanName}
                                              </span>
                                            </div>
                                            <p className='text-sm text-gray-700 leading-relaxed'>
                                              {rec.comment ||
                                                "의견이 작성되지 않았습니다."}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                              {/* Self Assessment Context for Leader */}
                              {!currentTargetUser?.isSelf && selfRecord && (
                                <div className='space-y-3'>
                                  <div className='flex items-center gap-2 text-green-700 font-bold text-sm'>
                                    <ClipboardList className='w-4 h-4' />
                                    팀원 자기평가 (Self-Assessment)
                                  </div>
                                  <div className='bg-green-50/50 p-5 rounded-2xl border border-green-100 flex items-start gap-4'>
                                    <div className='w-12 h-12 rounded-2xl bg-white border border-green-200 flex flex-col items-center justify-center shrink-0 shadow-sm'>
                                      <span className='text-[10px] text-green-600 font-bold'>
                                        등급
                                      </span>
                                      <span className='text-lg font-black text-green-700'>
                                        {selfRecord.grade || "-"}
                                      </span>
                                    </div>
                                    <div className='flex-1 space-y-1'>
                                      <p className='text-sm text-gray-700 leading-relaxed italic'>
                                        {selfRecord.comment ||
                                          "팀원이 작성한 의견이 없습니다."}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Evaluation Input */}
                              {myRecord ? (
                                (() => {
                                  // Block leader from evaluating until team member completes self-assessment
                                  const isLeaderBlocked =
                                    !currentTargetUser?.isSelf &&
                                    (!selfRecord || !selfRecord.grade);

                                  if (isLeaderBlocked) {
                                    return (
                                      <div className='bg-gray-50 p-8 rounded-2xl text-center border border-dashed border-gray-300 space-y-2'>
                                        <ClipboardList className='w-8 h-8 mx-auto text-gray-300' />
                                        <p className='text-sm font-bold text-gray-500'>
                                          팀원이 자가평가를 완료하지 않았습니다
                                        </p>
                                        <p className='text-xs text-gray-400'>
                                          팀원의 자가평가가 완료된 후 리더
                                          평가를 진행할 수 있습니다.
                                        </p>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className='grid grid-cols-1 lg:grid-cols-12 gap-10 pt-4 border-t border-dashed'>
                                      <div className='lg:col-span-5 space-y-4'>
                                        <Label className='text-sm font-bold text-gray-700 flex items-center gap-2'>
                                          평가 등급 선택
                                          <span className='text-xs font-normal text-gray-400'>
                                            (필수 항목)
                                          </span>
                                        </Label>
                                        <div className='flex flex-wrap gap-2'>
                                          {GRADES.map((g) => (
                                            <button
                                              key={g}
                                              disabled={
                                                isSaving || isSelfReadOnly
                                              }
                                              onClick={() =>
                                                handleLocalUpdate(
                                                  myRecord.assessmentId,
                                                  { grade: g },
                                                )
                                              }
                                              className={`flex-1 min-w-[60px] py-4 rounded-xl text-center font-black text-lg transition-all border-2 ${
                                                isSelfReadOnly
                                                  ? displayGrade === g
                                                    ? "bg-green-600 text-white border-green-700 cursor-not-allowed"
                                                    : "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed"
                                                  : displayGrade === g
                                                    ? isDirty
                                                      ? "bg-amber-500 text-white border-amber-600 shadow-lg -translate-y-1"
                                                      : "bg-blue-600 text-white border-blue-700 shadow-lg -translate-y-1"
                                                    : "bg-white text-gray-400 border-gray-100 hover:border-blue-200 hover:bg-blue-50/30"
                                              }`}>
                                              {g}
                                            </button>
                                          ))}
                                        </div>
                                        <p className='text-[10px] text-gray-400 text-center'>
                                          S: 탁월함 | A: 우수함 | B: 보통 | C:
                                          지원 필요 | D: 개선 필요
                                        </p>
                                      </div>
                                      <div className='lg:col-span-7 space-y-4'>
                                        <Label className='text-sm font-bold text-gray-700'>
                                          상세 의견 작성
                                        </Label>
                                        <Textarea
                                          disabled={isSaving || isSelfReadOnly}
                                          value={displayComment || ""}
                                          onChange={(e) =>
                                            handleLocalUpdate(
                                              myRecord.assessmentId,
                                              { comment: e.target.value },
                                            )
                                          }
                                          placeholder={
                                            currentTargetUser?.isSelf
                                              ? "본인의 역량에 대해 구체적인 사례와 함께 의견을 남겨주세요."
                                              : `${currentTargetUser?.name}님의 역량 발휘 수준에 대한 리더의 의견을 남겨주세요.`
                                          }
                                          className={`min-h-[160px] rounded-2xl focus:ring-2 focus:ring-blue-500 border-gray-200 transition-colors bg-gray-50/50 hover:bg-white focus:bg-white text-sm leading-relaxed ${
                                            isDirty
                                              ? "bg-amber-50/30 border-amber-200"
                                              : ""
                                          }`}
                                        />
                                      </div>
                                    </div>
                                  );
                                })()
                              ) : (
                                <div className='bg-gray-100 p-8 rounded-2xl text-center text-gray-500 border border-dashed border-gray-300'>
                                  <Users className='w-8 h-8 mx-auto mb-2 opacity-30' />
                                  본 문항에 대한 평가 권한이 없습니다.
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      },
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          ) : (
            !isLoadingAssessments &&
            selectedAppraisalUserId && (
              <div className='flex flex-col items-center justify-center h-full text-center p-20'>
                <div className='w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 mb-6'>
                  <ClipboardList className='w-10 h-10' />
                </div>
                <h3 className='text-xl font-bold text-gray-800'>
                  배정된 역량 평가 항목이 없습니다.
                </h3>
                <p className='text-gray-500 mt-2 max-w-sm'>
                  평가 주기가 시작되지 않았거나, 현재 부서에 배정된 문항이 없을
                  수 있습니다.
                </p>
              </div>
            )
          )}
        </main>
      </div>
    </div>
  );
}
