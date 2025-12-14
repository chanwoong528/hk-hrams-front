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
import { POST_commonGoal, PATCH_commonGoal,  DELETE_commonGoal } from '@/api/goal/goal';
import { POST_goalAssessmentBy } from '@/api/goal-assessment-by/goal-assessment-by';
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
  const [isAddCommonGoalModalOpen, setIsAddCommonGoalModalOpen] = useState(false);
  const queryClient = useQueryClient();
  // ... mutations ...
  const { mutate: mutateAddCommonGoal } = useMutation({
    mutationFn: POST_commonGoal,
    onSuccess: () => {
      toast.success("공통 목표가 추가되었습니다");
      setIsAddCommonGoalModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["teamMembersAppraisals"] });
    },
    onError: () => {
      toast.error("공통 목표 추가에 실패했습니다");
    },
  });

  const { mutate: mutateEditCommonGoal } = useMutation({
    mutationFn: PATCH_commonGoal,
    onSuccess: () => {
      toast.success("공통 목표가 수정되었습니다");
      queryClient.invalidateQueries({ queryKey: ["teamMembersAppraisals"] });
    },
    onError: () => {
      toast.error("공통 목표 수정에 실패했습니다");
    },
  });

  const { mutate: mutateDeleteCommonGoal } = useMutation({
    mutationFn: DELETE_commonGoal,
    onSuccess: () => {
      toast.success("공통 목표가 삭제되었습니다");
      queryClient.invalidateQueries({ queryKey: ["teamMembersAppraisals"] });
    },
    onError: () => {
      toast.error("공통 목표 삭제에 실패했습니다");
    },
  });

  const handleApplyCommonGoal = (goals: GoalFormData[]) => {
    mutateAddCommonGoal({
      appraisalId: appraisal.appraisalId,
      departmentId: departmentId,
      goals: goals,
    });
  };

  const handleUpdateCommonGoal = (oldTitle: string, newTitle: string, newDescription: string) => {
    mutateEditCommonGoal({
      appraisalId: appraisal.appraisalId,
      departmentId: departmentId,
      oldTitle: oldTitle,
      newTitle: newTitle,
      newDescription: newDescription,
    });
  };

  const handleDeleteCommonGoal = (title: string) => {
    if (confirm(`'${title}' 목표를 정말 삭제하시겠습니까? 해당 목표를 가진 모든 팀원에서 삭제됩니다.`)) {
      mutateDeleteCommonGoal({
        appraisalId: appraisal.appraisalId,
        departmentId: departmentId,
        title: title,
      });
    }
  };

  const handleFinalAssessment = (user: User) => {
    console.log("최종 평가", user);
    // TODO: Implement final assessment logic
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

  const handleSaveAssessment = (goalId: string, grade: string, comment: string) => {
    if (!currentUserId) {
        toast.error("사용자 정보를 찾을 수 없습니다.");
        return;
    }

    mutateAssessGoal({
        goalId: goalId,
        grade: grade,
        gradedBy: currentUserId,
        comment: comment
    });
  };


  // Logic to find common goals (goals with same title across *some* users)
  const allGoals = appraisal.user.flatMap((u) => u.goals);
  const goalCounts = allGoals.reduce(
    (acc, goal) => {
      acc[goal.title] = (acc[goal.title] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const commonGoals = Object.entries(goalCounts)
    .filter(([_, count]) => count > 0) 
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
      <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b pb-4">
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg font-bold flex flex-col sm:flex-row sm:items-center gap-2'>
            {appraisal.title}
            <Badge variant="secondary" className="w-fit font-normal text-gray-500 bg-white border shadow-sm">
                {appraisal.appraisalType}
            </Badge>
          </CardTitle>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              className="bg-white hover:bg-gray-50 text-gray-700"
              onClick={() => navigate(`/goal-grade/${appraisal.appraisalId}`)}>
              <Search className='w-3.5 h-3.5 mr-1.5' />
              상세 보기
            </Button>
            <Dialog
              open={isAddCommonGoalModalOpen}
              onOpenChange={setIsAddCommonGoalModalOpen}>
              <DialogTrigger asChild>
                <Button size='sm' variant='secondary' className="bg-white border hover:bg-gray-50 text-purple-700 border-purple-100 hover:text-purple-800">
                  <Plus className='w-3.5 h-3.5 mr-1.5' />
                  공통 목표 관리
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto px-4 sm:px-6'>
                <DialogHeader>
                  <DialogTitle>
                    공통 목표 관리
                    <span className="ml-2 text-sm text-gray-500 font-normal">
                      - {departmentName}
                    </span>
                  </DialogTitle>
                </DialogHeader>
                <GoalForm
                  onSubmitGoals={handleApplyCommonGoal}
                  showLeft={false}
                  existingGoals={commonGoals as any} 
                  onUpdateGoal={(oldTitle, newTitle, newDescription) => {
                    handleUpdateCommonGoal(oldTitle, newTitle, newDescription);
                  }}
                  onDeleteGoal={(title) => handleDeleteCommonGoal(title)}
                  teamName={departmentName} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
              <TableHead className="w-[150px]">이름</TableHead>
              <TableHead className="w-[120px]">직책/직급</TableHead>
              <TableHead className="w-[100px]">목표 수</TableHead>
              <TableHead>평가 현황</TableHead>
              <TableHead className='text-right'>관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appraisal.user.map((user) => {
                // Calculate assessment progress
                const totalGoals = user.goals.length;
                const assessedGoals = user.goals.filter(g => g.goalAssessmentBy?.some(a => a.gradedBy === currentUserId)).length;
                const isFullyAssessed = totalGoals > 0 && totalGoals === assessedGoals;

                return (
              <TableRow key={user.userId} className="group hover:bg-blue-50/30 transition-colors">
                <TableCell className='font-semibold text-gray-900'>
                    <div className="flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                             {user.koreanName[0]}
                         </div>
                         {user.koreanName}
                    </div>
                </TableCell>
                <TableCell className="text-gray-500">-</TableCell> 
                <TableCell>
                    <Badge variant="outline" className="bg-white w-full justify-center">
                        {totalGoals}개
                    </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                       <span className={`text-sm font-medium ${isFullyAssessed ? 'text-green-600' : 'text-gray-500'}`}>
                           {assessedGoals} / {totalGoals} 완료
                       </span>
                       {/* Simple Progress Bar */}
                       <div className="h-1.5 w-24 bg-gray-100 rounded-full overflow-hidden">
                           <div 
                                className={`h-full rounded-full transition-all duration-500 ${isFullyAssessed ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${totalGoals > 0 ? (assessedGoals / totalGoals) * 100 : 0}%` }}
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
                        className={isFullyAssessed ? "text-gray-600 hover:bg-gray-50" : "bg-blue-600 hover:bg-blue-700 shadow-sm"}
                        >
                        {isFullyAssessed ? <CheckCircle className='w-3.5 h-3.5 mr-1.5 text-green-600' /> : <Star className='w-3.5 h-3.5 mr-1.5' />}
                        평가하기
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-4xl max-h-[85vh] overflow-y-auto bg-slate-50 p-0 gap-0'>
                      <DialogHeader className="p-6 pb-4 bg-white border-b sticky top-0 z-10">
                        <DialogTitle className="text-xl font-bold flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg">
                                    {user.koreanName[0]}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        {user.koreanName}
                                        <Badge variant="outline" className="font-normal text-gray-500">팀원</Badge>
                                    </div>
                                    <p className="text-sm text-gray-400 font-normal mt-0.5">목표 평가 및 피드백 작성</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="text-right px-4 border-r">
                                    <p className="text-gray-500">전체 목표</p>
                                    <p className="font-bold text-gray-900">{totalGoals}건</p>
                                </div>
                                <div className="text-right px-1">
                                    <p className="text-gray-500">평가 완료</p>
                                    <p className={`font-bold ${isFullyAssessed ? 'text-green-600' : 'text-blue-600'}`}>{assessedGoals}건</p>
                                </div>
                            </div>
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className='p-6 space-y-6'>
                        {user.goals.length > 0 ? (
                          <div className="grid gap-5">
                             {user.goals.map((goal) => (
                                <GoalAssessmentItem 
                                    key={goal.goalId} 
                                    goal={goal} 
                                    currentUserId={currentUserId}
                                    onSave={handleSaveAssessment}
                                />
                             ))}
                          </div>
                        ) : (
                          <div className='text-center py-16 bg-white rounded-xl border border-dashed'>
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                               <GoalIcon className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">등록된 목표가 없습니다</h3>
                            <p className="text-gray-500 mt-2 max-w-sm mx-auto">팀원이 아직 목표를 등록하지 않았습니다. 목표가 등록되면 평가를 진행할 수 있습니다.</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Footer Actions if needed, e.g. Final Submission */}
                      <div className="p-4 bg-white border-t flex justify-end gap-2 sticky bottom-0 z-10">
                          {/* <Button variant="ghost">닫기</Button>
                          <Button className="bg-blue-600">평가 완료</Button> */}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
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
        <TabsContent key={dept.departmentName} value={dept.departmentName} className="mt-0">
          {dept.appraisal.map((appraisal) => (
            <AppraisalSection
              key={appraisal.appraisalId}
              appraisal={appraisal}
              departmentId={dept.departmentId}
              departmentName={dept.departmentName}
              currentUserId={currentUserId || ''}
            />
          ))}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default LeaderGradeCard;
