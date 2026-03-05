import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
import { User as UserIcon, Users, Save, SaveAll, Loader2 } from "lucide-react";

const GRADES = ["S", "A", "B", "C", "D"];

interface LocalEdit {
  grade?: string;
  comment?: string;
}

export default function CompetencyEvaluation() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useCurrentUserStore();

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

  // 2. Fetch Team Members if leader
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
    enabled: leaderDeptIds.length > 0,
    select: (data) => data.data as any[],
  });

  // Flatten team members
  const teamParticipations = useMemo(() => {
    if (!teamData) return [];
    const list: any[] = [];
    teamData.forEach((dept) => {
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
  }, [teamData]);

  // Sync state with URL
  useEffect(() => {
    const idInUrl = searchParams.get("appraisalUserId");
    if (idInUrl && idInUrl !== selectedAppraisalUserId) {
      setSelectedAppraisalUserId(idInUrl || "");
      setLocalEdits({}); // Clear edits when target changes to prevent cross-contamination
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
  const {
    data: assessments,
    isLoading: isLoadingAssessments,
    isError,
  } = useQuery({
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
    setLocalEdits({}); // Reset local edits
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

  // Handle local changes
  const handleLocalUpdate = (assessmentId: string, updates: LocalEdit) => {
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
    } catch (error) {
      console.error("Batch save failed:", error);
      toast.error("일부 평가 저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedChanges = Object.keys(localEdits).length > 0;

  return (
    <div className='p-4 lg:p-6 space-y-6'>
      <div className='flex flex-col sm:flex-row gap-4 justify-between items-start'>
        <div>
          <h2 className='text-gray-900 font-bold text-2xl flex items-center gap-2'>
            <Users className='w-6 h-6 text-blue-600' />
            역량 평가 수행
          </h2>
          <p className='text-gray-600 mt-1'>
            {currentTargetUser?.isSelf
              ? "나의 역량 지표에 대해 스스로 평가하고 의견을 작성합니다."
              : `${currentTargetUser?.name || "팀원"}님의 역량 지표에 대해 리더로서 평가를 진행합니다.`}
          </p>
        </div>

        <div className='flex items-center gap-3'>
          {hasUnsavedChanges && (
            <span className='text-amber-600 text-sm font-bold animate-pulse'>
              저장되지 않은 변경사항이 {Object.keys(localEdits).length}건
              있습니다.
            </span>
          )}
          <Button
            onClick={handleSaveAll}
            disabled={!hasUnsavedChanges || isSaving}
            className='bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-lg'>
            {isSaving ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <SaveAll className='w-4 h-4' />
            )}
            평가 일괄 저장
          </Button>
        </div>
      </div>

      <div className='flex flex-wrap gap-4 items-end bg-white p-4 rounded-lg shadow-sm border'>
        <div className='w-full sm:w-80 space-y-2'>
          <Label className='text-xs font-bold text-gray-500'>
            평가 대상 선택 (본인 및 팀원)
          </Label>
          <Select
            value={selectedAppraisalUserId}
            onValueChange={handleTargetChange}>
            <SelectTrigger className='w-full'>
              <SelectValue placeholder='평가 대상자를 선택하세요' />
            </SelectTrigger>
            <SelectContent>
              {myAppraisals && myAppraisals.length > 0 && (
                <>
                  <SelectItem
                    value='header-self'
                    disabled
                    className='font-bold text-blue-600'>
                    --- 본인 평가 ---
                  </SelectItem>
                  {myAppraisals.map((a) => (
                    <SelectItem
                      key={a.appraisalUserId}
                      value={a.appraisalUserId}>
                      <span className='flex items-center gap-2'>
                        <UserIcon className='w-3 h-3' />
                        {a.title} (본인)
                      </span>
                    </SelectItem>
                  ))}
                </>
              )}
              {teamParticipations.length > 0 && (
                <>
                  <SelectItem
                    value='header-team'
                    disabled
                    className='font-bold text-green-600 mt-2'>
                    --- 팀원 평가 ---
                  </SelectItem>
                  {teamParticipations.map((tp) => (
                    <SelectItem
                      key={tp.appraisalUserId}
                      value={tp.appraisalUserId}>
                      <span className='flex items-center gap-2'>
                        {tp.koreanName} - {tp.appraisalTitle}
                      </span>
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {(isLoadingMyAppraisals || isLoadingAssessments || isLoadingTeam) && (
        <div className='text-center py-20'>평가 데이터를 불러오는 중...</div>
      )}

      {isError && (
        <div className='text-red-500 text-center py-20 bg-red-50 rounded-lg border'>
          데이터 조회에 실패했습니다. 권한이 없거나 만료된 세션일 수 있습니다.
        </div>
      )}

      {!isLoadingAssessments && deptNames.length > 0 ? (
        <Tabs defaultValue={deptNames[0]} className='w-full'>
          <TabsList className='mb-4 bg-gray-100 p-1'>
            {deptNames.map((dept) => (
              <TabsTrigger key={dept} value={dept} className='px-6'>
                {dept}
              </TabsTrigger>
            ))}
          </TabsList>

          {deptNames.map((dept) => (
            <TabsContent
              key={dept}
              value={dept}
              className='space-y-6 animate-in fade-in h-full'>
              {getGroupedAssessments(assessmentsByDept[dept]).map((group) => {
                const myRecord = group.myRecord;
                const selfRecord = group.selfRecord;

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
                    className={`overflow-hidden border-l-4 shadow-md transition-all duration-300 ${isDirty ? "border-l-amber-500 ring-1 ring-amber-100" : myRecord ? "border-l-blue-500" : "border-l-gray-300"}`}>
                    <CardHeader className='pb-4 border-b bg-gray-50/50'>
                      <div className='flex justify-between items-start'>
                        <CardTitle className='text-lg text-gray-800 flex items-start gap-3'>
                          <span
                            className={`token ${myRecord ? (isDirty ? "bg-amber-500" : "bg-blue-600") : "bg-gray-400"} text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5`}>
                            Q
                          </span>
                          {group.question}
                        </CardTitle>
                        {isDirty && (
                          <span className='text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200'>
                            저장 대기 중
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className='p-6 bg-white space-y-6'>
                      {/* Self Assessment Context (for Leader) or others */}
                      {!currentTargetUser?.isSelf && selfRecord && (
                        <div className='bg-green-50 p-4 rounded-lg border border-green-100 space-y-2'>
                          <div className='flex items-center gap-2 text-green-800 font-bold text-sm'>
                            <UserIcon className='w-4 h-4' />
                            팀원 스스로의 평가 (Self-Assessment)
                          </div>
                          <div className='flex flex-wrap gap-4 text-sm'>
                            <div className='bg-white px-3 py-1 rounded border border-green-200'>
                              <span className='text-gray-500 mr-2'>등급:</span>
                              <span className='font-bold text-green-700'>
                                {selfRecord.grade || "-"}
                              </span>
                            </div>
                            <div className='bg-white px-3 py-1 rounded border border-green-200 flex-1'>
                              <span className='text-gray-500 mr-2'>의견:</span>
                              <span className='text-gray-700'>
                                {selfRecord.comment || "(의견 없음)"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {!myRecord && (
                        <div className='bg-amber-50 p-3 rounded text-amber-800 text-sm flex items-center gap-2'>
                          <span className='token bg-amber-500 text-white w-4 h-4 rounded-full flex items-center justify-center text-[10px]'>
                            !
                          </span>
                          이 문항에 대한 평가 권한이 없습니다 (평가자로 지정되지
                          않음).
                        </div>
                      )}

                      <div
                        className={`grid grid-cols-1 lg:grid-cols-4 gap-8 ${!myRecord || isSaving ? "opacity-50 pointer-events-none" : ""}`}>
                        <div className='lg:col-span-1 space-y-3'>
                          <Label className='text-sm font-bold text-gray-700 flex items-center gap-2'>
                            {currentTargetUser?.isSelf
                              ? "나의 등급 선택"
                              : "리더 등급 선택"}
                          </Label>
                          <div className='grid grid-cols-5 lg:grid-cols-1 gap-2'>
                            {GRADES.map((g) => (
                              <button
                                key={g}
                                disabled={!myRecord || isSaving}
                                onClick={() =>
                                  myRecord &&
                                  handleLocalUpdate(myRecord.assessmentId, {
                                    grade: g,
                                  })
                                }
                                className={`py-2 px-3 rounded-md text-center font-bold transition-all border ${
                                  displayGrade === g
                                    ? isDirty
                                      ? "bg-amber-500 text-white border-amber-600"
                                      : "bg-blue-600 text-white border-blue-600 shadow-inner scale-95"
                                    : "bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                                }`}>
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className='lg:col-span-3 space-y-3'>
                          <Label className='text-sm font-bold text-gray-700'>
                            평가 의견 (선택사항)
                          </Label>
                          <Textarea
                            disabled={!myRecord || isSaving}
                            value={displayComment || ""}
                            onChange={(e) =>
                              myRecord &&
                              handleLocalUpdate(myRecord.assessmentId, {
                                comment: e.target.value,
                              })
                            }
                            placeholder={
                              myRecord
                                ? `${currentTargetUser?.name || "대상자"}님의 역량 발휘 수준에 대한 구체적인 의견을 남겨주세요.`
                                : "평가 권한이 없습니다."
                            }
                            className={`min-h-[120px] focus:ring-2 focus:ring-blue-500 border-gray-300 transition-colors ${isDirty ? "bg-amber-50/30 border-amber-200" : ""}`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          ))}

          <div className='mt-8 flex justify-center pb-20'>
            <Button
              size='lg'
              onClick={handleSaveAll}
              disabled={!hasUnsavedChanges || isSaving}
              className='bg-blue-600 hover:bg-blue-700 text-white gap-2 h-14 px-12 text-lg shadow-xl'>
              {isSaving ? (
                <Loader2 className='w-5 h-5 animate-spin' />
              ) : (
                <Save className='w-5 h-5' />
              )}
              전체 평가 저장하기
            </Button>
          </div>
        </Tabs>
      ) : (
        !isLoadingAssessments &&
        selectedAppraisalUserId && (
          <div className='text-center text-gray-500 py-32 bg-gray-50 rounded-xl border-4 border-dashed border-gray-200'>
            <Users className='w-12 h-12 mx-auto text-gray-300 mb-4' />
            <p className='text-xl font-medium'>
              배정된 역량 평가 항목이 없습니다.
            </p>
            <p className='mt-2'>
              부서장이 해당 주기의 역량 평가 문항을 아직 생성하지 않았을 수
              있습니다.
            </p>
          </div>
        )
      )}
    </div>
  );
}
