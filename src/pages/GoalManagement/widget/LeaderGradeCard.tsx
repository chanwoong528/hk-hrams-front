import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import type { Appraisal, DepartmentAppraisal, Goal, User } from "../type";
import {
  CheckCircle,
  Goal as GoalIcon,
  Plus,
  Star,
  Search,
} from "lucide-react";
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
import type { GoalFormData } from "../type.d";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useNavigate } from "react-router";

// ... existing code ...

import GoalAssessmentItem from "./GoalAssessmentItem";

const AppraisalSection = ({
  appraisal,
  departmentId,
  departmentName,
  currentUserId,
}: {
  appraisal: Appraisal;
  departmentId: string;
  departmentName: string;
  currentUserId: string;
}) => {
  const navigate = useNavigate();
  // ... existing state ...
  const [isAddCommonGoalModalOpen, setIsAddCommonGoalModalOpen] =
    useState(false);
  const [selectedUserForFinal, setSelectedUserForFinal] = useState<User | null>(
    null,
  );
  const [finalGrade, setFinalGrade] = useState("");
  const [finalComment, setFinalComment] = useState("");

  const queryClient = useQueryClient();
  // ... mutations ...
  const { mutate: mutateAddCommonGoal } = useMutation({
    mutationFn: POST_commonGoal,
    onSuccess: () => {
      // toast.success("공통 목표가 추가되었습니다");
      setIsAddCommonGoalModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["teamMembersAppraisals"] });
    },
    onError: () => {
      // toast.error("공통 목표 추가에 실패했습니다");
    },
  });

  const { mutate: mutateEditCommonGoal } = useMutation({
    mutationFn: PATCH_commonGoal,
    onSuccess: () => {
      // toast.success("공통 목표가 수정되었습니다");
      queryClient.invalidateQueries({ queryKey: ["teamMembersAppraisals"] });
    },
    onError: () => {
      // toast.error("공통 목표 수정에 실패했습니다");
    },
  });

  const { mutate: mutateDeleteCommonGoal } = useMutation({
    mutationFn: DELETE_commonGoal,
    onSuccess: () => {
      // toast.success("공통 목표가 삭제되었습니다");
      queryClient.invalidateQueries({ queryKey: ["teamMembersAppraisals"] });
    },
    onError: () => {
      // toast.error("공통 목표 삭제에 실패했습니다");
    },
  });

  const handleApplyCommonGoal = (goals: GoalFormData[]) => {
    mutateAddCommonGoal({
      appraisalId: appraisal.appraisalId,
      departmentId: departmentId,
      goals: goals,
    });
  };

  const handleUpdateCommonGoal = (
    oldTitle: string,
    newTitle: string,
    newDescription: string,
  ) => {
    mutateEditCommonGoal({
      appraisalId: appraisal.appraisalId,
      departmentId: departmentId,
      oldTitle: oldTitle,
      newTitle: newTitle,
      newDescription: newDescription,
    });
  };

  const handleDeleteCommonGoal = (title: string) => {
    if (
      confirm(
        `'${title}' 목표를 정말 삭제하시겠습니까? 해당 목표를 가진 모든 팀원에서 삭제됩니다.`,
      )
    ) {
      mutateDeleteCommonGoal({
        appraisalId: appraisal.appraisalId,
        departmentId: departmentId,
        title: title,
      });
    }
  };

  const { mutate: mutateAssessGoal } = useMutation({
    mutationFn: POST_goalAssessmentBy,
    onSuccess: () => {
      toast.success("목표 평가가 저장되었습니다");
      queryClient.invalidateQueries({ queryKey: ["teamMembersAppraisals"] });
    },
    onError: () => {
      toast.error("목표 평가 저장에 실패했습니다");
    },
  });

  const { mutate: mutateAppraisalAssessment } = useMutation({
    mutationFn: POST_appraisalBy,
    onSuccess: () => {
      toast.success("최종 평가가 완료되었습니다");
      setSelectedUserForFinal(null);
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

    if (selectedUserForFinal.status !== "submitted") {
      toast.error("평가 대상자가 아직 최종 평가를 제출하지 않았습니다.");
      return;
    }

    if (!finalGrade) {
      toast.error("등급을 선택해주세요");
      return;
    }

    // Check if user is evaluating themselves or a leader is evaluating a member
    // Logic: If currentUserId == selectedUserForFinal.userId, it's Self Assessment. else Leader Assessment.
    // However, the backend might infer role, or we pass types.
    // Usually 'assessType' and 'assessTerm' are needed. Let's hardcode or infer.
    // Assuming 'performance' and 'final' for now based on context.

    mutateAppraisalAssessment({
      appraisalId: selectedUserForFinal.appraisalUserId!, // Use appraisalUserId not appraisalId
      assessedById: currentUserId,
      assessType: "performance", // TODO: Dynamic?
      assessTerm: "final", // TODO: Dynamic?
      grade: finalGrade,
      comment: finalComment,
    });
  };

  const handleSaveAssessment = (
    goalId: string,
    grade: string,
    comment: string,
  ) => {
    if (!currentUserId) {
      toast.error("사용자 정보를 찾을 수 없습니다.");
      return;
    }

    mutateAssessGoal({
      goalId: goalId,
      grade: grade,
      gradedBy: currentUserId,
      comment: comment,
    });
  };

  // Logic to find common goals (goals with same title across *some* users)
  const allGoals = appraisal.user.flatMap((u) => u.goals);
  const goalCounts = allGoals.reduce((acc, goal) => {
    acc[goal.title] = (acc[goal.title] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const commonGoals = Object.entries(goalCounts)
    .filter(([_, count]) => count > 1) // Only goals shared by more than 1 person
    .map(([title, count]) => {
      const goal = allGoals.find((g) => g.title === title);
      return {
        ...goal,
        count,
        totalUsers: appraisal.user.length,
      };
    });

  return (
    <Card className='mb-6 border-none shadow-sm ring-1 ring-gray-100'>
      <CardHeader className='bg-gradient-to-r from-gray-50 to-white border-b pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg font-bold flex flex-col sm:flex-row sm:items-center gap-2'>
            {appraisal.title}
            <Badge
              variant='secondary'
              className='w-fit font-normal text-gray-500 bg-white border shadow-sm'>
              {appraisal.appraisalType}
            </Badge>
          </CardTitle>
          <div className='flex gap-2'>
            {/* <Button
              variant='outline'
              size='sm'
              className='bg-white hover:bg-gray-50 text-gray-700'
              onClick={() => navigate(`/goal-grade/${appraisal.appraisalId}`)}>
              <Search className='w-3.5 h-3.5 mr-1.5' />
              상세 보기
            </Button> */}
            <Dialog
              open={isAddCommonGoalModalOpen}
              onOpenChange={setIsAddCommonGoalModalOpen}>
              <DialogTrigger asChild>
                <Button
                  size='sm'
                  variant='secondary'
                  className='bg-white border hover:bg-gray-50 text-purple-700 border-purple-100 hover:text-purple-800'>
                  <Plus className='w-3.5 h-3.5 mr-1.5' />
                  공통 목표 관리
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto px-4 sm:px-6'>
                <DialogHeader>
                  <DialogTitle>
                    공통 목표 관리
                    <span className='ml-2 text-sm text-gray-500 font-normal'>
                      - {departmentName}
                    </span>
                  </DialogTitle>
                </DialogHeader>
                <GoalForm
                  onSaveAll={async (newGoals, updatedGoals, deletedGoalIds) => {
                    const promises = [];

                    // 1. Create New Common Goals
                    if (newGoals.length > 0) {
                      promises.push(
                        mutateAddCommonGoal({
                          appraisalId: appraisal.appraisalId,
                          departmentId: departmentId,
                          goals: newGoals,
                        }),
                      );
                    }

                    // 2. Update Existing Common Goals
                    updatedGoals.forEach((goal) => {
                      // We need the old title to identify the goal for update
                      // But the unified form only gives us the new state.
                      // This is tricky because `updateCommonGoalByLeader` expects `oldTitle`.
                      // However, `GoalForm` tracks goals by ID now if we provided IDs.
                      // `commonGoals` passed to `GoalForm` has IDs?
                      // Let's check `commonGoals` construction.
                      // It maps `allGoals`. `allGoals` have `goalId`.
                      // So `updatedGoals` will have `goalId`.
                      // But `FEATURE GAP`: Common Goal Update API (`PATCH_commonGoal`) asks for `oldTitle`.
                      // It should probably ask for `goalId`?
                      // Or `GoalService.updateCommonGoalByLeader` logic relies on `oldTitle` to update *all user's* matching goals.
                      // Updating by `goalId` only updates ONE specific user's goal.
                      // WE NEED TO FIX THE API OR THE FORM.
                      //
                      // Given I cannot easily change the "update by title" logic instantly without breaking semantics (Common Goal = Shared Title),
                      // I will temporarily fetch the OLD title using the ID from the original list?
                      // But `GoalForm` doesn't pass old title.
                      //
                      // ALTERNATIVE:
                      // `GoalForm` passes `updatedGoals`.
                      // I can find the original goal in `commonGoals` list by `goalId`?
                      // `commonGoals` is derived inside the render.
                      // I should probably memoize it or just find it.
                      //
                      // WAIT: `commonGoals` is constructed on the fly.
                      // I will implement a lookup here.

                      const originalGoal = commonGoals.find(
                        (g) => g.goalId === goal.goalId,
                      );
                      if (originalGoal) {
                        // Only call update if title or description changed
                        if (
                          originalGoal.title !== goal.title ||
                          originalGoal.description !== goal.description
                        ) {
                          mutateEditCommonGoal({
                            appraisalId: appraisal.appraisalId,
                            departmentId: departmentId,
                            oldTitle: originalGoal.title, // Use original title
                            newTitle: goal.title,
                            newDescription: goal.description,
                          });
                        }
                      }
                    });

                    // 3. Delete Common Goals
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

                    await Promise.all(promises);
                    const actionSummaries = [];
                    if (newGoals.length > 0)
                      actionSummaries.push(`추가 ${newGoals.length}건`);
                    if (updatedGoals.length > 0)
                      actionSummaries.push(`수정 ${updatedGoals.length}건`);
                    if (deletedGoalIds.length > 0)
                      actionSummaries.push(`삭제 ${deletedGoalIds.length}건`);

                    if (actionSummaries.length > 0) {
                      toast.success(
                        `공통 목표가 저장되었습니다 (${actionSummaries.join(
                          ", ",
                        )})`,
                      );
                    } else {
                      toast.info("변경사항이 없습니다");
                    }
                  }}
                  showLeft={false}
                  existingGoals={commonGoals as any}
                  appraisalInfo={{
                    title: `[${departmentName}] 공통 목표 관리`,
                    description:
                      "이곳에서 등록하는 목표는 해당 부서의 모든 팀원에게 일괄 적용됩니다.",
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className='p-0'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50/50 hover:bg-gray-50/50'>
              <TableHead className='w-[150px]'>이름</TableHead>
              <TableHead className='w-[120px]'>직책/직급</TableHead>
              <TableHead className='w-[100px]'>목표 수</TableHead>
              <TableHead>평가 현황</TableHead>
              <TableHead className='text-right'>관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appraisal.user.map((user) => {
              // Calculate assessment progress
              const totalGoals = user.goals.length;
              const assessedGoals = user.goals.filter((g) =>
                g.goalAssessmentBy?.some((a) => a.gradedBy === currentUserId),
              ).length;
              const isFullyAssessed =
                totalGoals > 0 && totalGoals === assessedGoals;

              // Check if Final Assessment is already done by current user
              const isFinalAssessed = user.assessments?.some(
                (a) => a.assessedById === currentUserId,
              );

              return (
                <TableRow
                  key={user.userId}
                  className='group hover:bg-blue-50/30 transition-colors'>
                  <TableCell className='font-semibold text-gray-900'>
                    <div className='flex items-center gap-2'>
                      <div className='w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600'>
                        {user.koreanName[0]}
                      </div>
                      {user.koreanName}
                    </div>
                  </TableCell>
                  <TableCell className='text-gray-500'>-</TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className='bg-white w-full justify-center'>
                      {totalGoals}개
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <span
                        className={`text-sm font-medium ${
                          isFullyAssessed ? "text-green-600" : "text-gray-500"
                        }`}>
                        {assessedGoals} / {totalGoals} 완료
                      </span>
                      {/* Simple Progress Bar */}
                      <div className='h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden'>
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
                  <TableCell className='text-right'>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size='sm'
                          variant={isFullyAssessed ? "outline" : "default"}
                          disabled={user.status !== "submitted"}
                          className={
                            isFullyAssessed && user.status === "submitted"
                              ? "text-gray-600 hover:bg-gray-50 bg-white border border-gray-200" // Added explicit styles for finished state
                              : "bg-blue-600 hover:bg-blue-700 shadow-sm disabled:bg-gray-300 text-white"
                          }>
                          {isFullyAssessed ? ( // Simplified check: if fully assessed, show check
                            <CheckCircle className='w-3.5 h-3.5 mr-1.5 text-green-600' />
                          ) : (
                            <Star className='w-3.5 h-3.5 mr-1.5' />
                          )}
                          목표 평가
                        </Button>
                      </DialogTrigger>
                      <DialogContent className='max-w-4xl max-h-[85vh] overflow-y-auto bg-slate-50 p-0 gap-0'>
                        <DialogHeader className='p-6 pb-4 bg-white border-b sticky top-0 z-10'>
                          <DialogTitle className='text-xl font-bold flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                              <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg'>
                                {user.koreanName[0]}
                              </div>
                              <div>
                                <div className='flex items-center gap-2'>
                                  {user.koreanName}
                                  <Badge
                                    variant='outline'
                                    className='font-normal text-gray-500'>
                                    팀원
                                  </Badge>
                                </div>
                                <p className='text-sm text-gray-400 font-normal mt-0.5'>
                                  목표 평가 및 피드백 작성
                                </p>
                              </div>
                            </div>
                            <div className='flex items-center gap-3 text-sm'>
                              <div className='text-right px-4 border-r'>
                                <p className='text-gray-500'>전체 목표</p>
                                <p className='font-bold text-gray-900'>
                                  {totalGoals}건
                                </p>
                              </div>
                              <div className='text-right px-1'>
                                <p className='text-gray-500'>평가 완료</p>
                                <p
                                  className={`font-bold ${
                                    isFullyAssessed
                                      ? "text-green-600"
                                      : "text-blue-600"
                                  }`}>
                                  {assessedGoals}건
                                </p>
                              </div>
                            </div>
                          </DialogTitle>
                        </DialogHeader>

                        <div className='p-6 space-y-6'>
                          {user.goals.length > 0 ? (
                            <div className='grid gap-5'>
                              {[...user.goals]
                                .sort((a, b) => {
                                  // Check status for Goal A
                                  const aLeaderAssessed =
                                    a.goalAssessmentBy?.some(
                                      (assess) =>
                                        assess.gradedBy === currentUserId,
                                    );
                                  const aMemberAssessed =
                                    a.goalAssessmentBy?.some(
                                      (assess) =>
                                        assess.gradedBy === user.userId,
                                    );

                                  // Check status for Goal B
                                  const bLeaderAssessed =
                                    b.goalAssessmentBy?.some(
                                      (assess) =>
                                        assess.gradedBy === currentUserId,
                                    );
                                  const bMemberAssessed =
                                    b.goalAssessmentBy?.some(
                                      (assess) =>
                                        assess.gradedBy === user.userId,
                                    );

                                  // Priority 1: Both Not Assessed (Not Started)
                                  const aNotStarted =
                                    !aMemberAssessed && !aLeaderAssessed;
                                  const bNotStarted =
                                    !bMemberAssessed && !bLeaderAssessed;
                                  if (aNotStarted && !bNotStarted) return -1;
                                  if (!aNotStarted && bNotStarted) return 1;

                                  // Priority 2: Member Done, Leader Not (Ready for Leader)
                                  const aReady =
                                    aMemberAssessed && !aLeaderAssessed;
                                  const bReady =
                                    bMemberAssessed && !bLeaderAssessed;
                                  if (aReady && !bReady) return -1;
                                  if (!aReady && bReady) return 1;

                                  return 0; // Equal priority (e.g. both Done)
                                })
                                .map((goal) => (
                                  <GoalAssessmentItem
                                    key={goal.goalId}
                                    goal={goal}
                                    currentUserId={currentUserId}
                                    targetUserId={user.userId}
                                    onSave={handleSaveAssessment}
                                  />
                                ))}
                            </div>
                          ) : (
                            <div className='text-center py-16 bg-white rounded-xl border border-dashed'>
                              <div className='w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4'>
                                <GoalIcon className='w-8 h-8 text-gray-300' />
                              </div>
                              <h3 className='text-lg font-semibold text-gray-900'>
                                등록된 목표가 없습니다
                              </h3>
                              <p className='text-gray-500 mt-2 max-w-sm mx-auto'>
                                팀원이 아직 목표를 등록하지 않았습니다. 목표가
                                등록되면 평가를 진행할 수 있습니다.
                              </p>
                            </div>
                          )}
                        </div>

                        <div className='p-4 bg-white border-t flex justify-end gap-2 sticky bottom-0 z-10'>
                          <DialogClose asChild>
                            <Button variant='ghost'>닫기</Button>
                          </DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Final Assessment Button */}
                    {(() => {
                      const existingAssessment = user.assessments?.find(
                        (a) => a.assessedById === currentUserId,
                      );

                      // Edit Logic:
                      // 1. If not assessed yet -> Enabled (if user submitted)
                      // 2. If assessed -> Check timestamps
                      //    - If user.selfAssessment.updated > existingAssessment.updated -> Enabled (New data)
                      //    - Else -> Disabled (Locked)

                      const isSubmittedOrFinished =
                        user.status === "submitted" ||
                        user.status === "finished";

                      let canEdit = false;
                      if (isSubmittedOrFinished) {
                        if (!isFinalAssessed) {
                          canEdit = true;
                        } else if (
                          existingAssessment &&
                          user.selfAssessment?.updated &&
                          existingAssessment.updated
                        ) {
                          const userTime = new Date(
                            user.selfAssessment.updated,
                          ).getTime();
                          const leaderTime = new Date(
                            existingAssessment.updated,
                          ).getTime();
                          if (userTime > leaderTime) {
                            canEdit = true;
                          }
                        }
                      }

                      return (
                        <Button
                          size='sm'
                          variant={
                            isFullyAssessed && canEdit ? "default" : "secondary"
                          }
                          className={`ml-2 ${
                            !canEdit
                              ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                              : isFinalAssessed
                              ? "bg-purple-100 text-purple-700 hover:bg-purple-100 border border-purple-200"
                              : "bg-purple-600 hover:bg-purple-700 text-white"
                          }`}
                          disabled={!canEdit}
                          onClick={() => {
                            if (!isSubmittedOrFinished) {
                              toast.error(
                                "평가 대상자가 아직 최종 평가를 제출하지 않았습니다.",
                              );
                              return;
                            }

                            if (existingAssessment) {
                              setFinalGrade(existingAssessment.grade);
                              setFinalComment(existingAssessment.comment);
                            } else {
                              setFinalGrade("");
                              setFinalComment("");
                            }

                            setSelectedUserForFinal(user);
                          }}>
                          <CheckCircle className='w-3.5 h-3.5 mr-1.5' />
                          {!isSubmittedOrFinished
                            ? "제출 대기"
                            : !isFinalAssessed
                            ? "최종 평가"
                            : canEdit
                            ? "평가 수정"
                            : "평가 완료"}
                        </Button>
                      );
                    })()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog
        open={!!selectedUserForFinal}
        onOpenChange={(open) => !open && setSelectedUserForFinal(null)}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>
              최종 평가 ({selectedUserForFinal?.koreanName})
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            {selectedUserForFinal?.selfAssessment && (
              <div className='bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4'>
                <h5 className='text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2'>
                  <span className='w-1.5 h-1.5 rounded-full bg-blue-500'></span>
                  본인 평가 (참고용)
                </h5>
                <div className='text-sm'>
                  <div className='flex items-center gap-2 mb-1'>
                    <span className='text-gray-500'>등급:</span>
                    <Badge variant='outline' className='bg-white'>
                      {selectedUserForFinal.selfAssessment.grade}등급
                    </Badge>
                  </div>
                  <div className='text-gray-600 bg-white p-2 rounded border border-gray-100 mt-1 whitespace-pre-wrap'>
                    {selectedUserForFinal.selfAssessment.comment ||
                      "코멘트 없음"}
                  </div>
                </div>
              </div>
            )}
            <div className='space-y-2'>
              <Label>등급</Label>
              <Select value={finalGrade} onValueChange={setFinalGrade}>
                <SelectTrigger>
                  <SelectValue placeholder='등급 선택' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='S'>S등급 (탁월)</SelectItem>
                  <SelectItem value='A'>A등급 (우수)</SelectItem>
                  <SelectItem value='B'>B등급 (보통)</SelectItem>
                  <SelectItem value='C'>C등급 (미흡)</SelectItem>
                  <SelectItem value='D'>D등급 (부족)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label>종합 코멘트</Label>
              <Textarea
                placeholder='종합 평가 의견을 작성해주세요.'
                value={finalComment}
                onChange={(e) => setFinalComment(e.target.value)}
                className='min-h-[100px]'
              />
            </div>
          </div>
          <div className='flex justify-end gap-2'>
            <Button
              variant='ghost'
              onClick={() => setSelectedUserForFinal(null)}>
              취소
            </Button>
            <Button onClick={handleFinalAssessment} className='bg-blue-600'>
              평가 제출
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

const LeaderGradeCard = ({
  departmentAppraisals,
  currentUserId,
}: {
  departmentAppraisals: DepartmentAppraisal[];
  currentUserId?: string;
}) => {
  if (!departmentAppraisals) return null;

  if (currentUserId) {
    console.log("Logged as:", currentUserId);
  }

  return (
    <Tabs
      defaultValue={departmentAppraisals[0]?.departmentName}
      className='w-full'>
      <TabsList className='mb-4 flex flex-wrap h-auto gap-2 bg-transparent justify-start p-0'>
        {departmentAppraisals.map((dept) => (
          <TabsTrigger
            key={dept.departmentName}
            value={dept.departmentName}
            className='data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 shadow-sm rounded-lg transition-all'>
            {dept.departmentName}
          </TabsTrigger>
        ))}
      </TabsList>
      {departmentAppraisals.map((dept) => (
        <TabsContent
          key={dept.departmentName}
          value={dept.departmentName}
          className='mt-0'>
          {dept.appraisal.map((appraisal) => (
            <AppraisalSection
              key={appraisal.appraisalId}
              appraisal={appraisal}
              departmentId={dept.departmentId}
              departmentName={dept.departmentName}
              currentUserId={currentUserId || ""}
            />
          ))}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default LeaderGradeCard;
