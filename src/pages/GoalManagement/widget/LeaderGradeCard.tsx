import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useState } from "react";
import type { Appraisal, DepartmentAppraisal, Goal, User } from "../type.d";
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
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { POST_commonGoal } from "@/api/goal/goal";
import { useNavigate } from "react-router";

export default function LeaderGradeCard({
  departmentAppraisals,
}: {
  departmentAppraisals: DepartmentAppraisal[];
}) {
  if (departmentAppraisals.length === 0) {
    return <div>평가 대상 부서가 없습니다.</div>;
  }

  return (
    <Tabs
      defaultValue={departmentAppraisals[0].departmentName}
      className='w-full'>
      <div className='flex items-center justify-between mb-4'>
        <TabsList>
          {departmentAppraisals.map((dept) => (
            <TabsTrigger key={dept.departmentName} value={dept.departmentName}>
              {dept.departmentName}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {departmentAppraisals.map((dept) => (
        <TabsContent key={dept.departmentName} value={dept.departmentName}>
          {dept.appraisal.map((appraisal) => (
            <AppraisalSection
              key={appraisal.appraisalId}
              appraisal={appraisal}
              departmentId={dept.departmentId}
            />
          ))}
        </TabsContent>
      ))}
    </Tabs>
  );
}

const AppraisalSection = ({
  appraisal,
  departmentId,
}: {
  appraisal: Appraisal;
  departmentId: string;
}) => {
  const navigate = useNavigate();
  const [isAddCommonGoalModalOpen, setIsAddCommonGoalModalOpen] =
    useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { mutate: mutateAddCommonGoal } = useMutation({
    mutationFn: POST_commonGoal,
    onSuccess: () => {
      toast.success("공통 목표가 추가되었습니다");
      setIsAddCommonGoalModalOpen(false);
    },
    onError: () => {
      toast.error("공통 목표 추가에 실패했습니다");
    },
  });

  const handleApplyCommonGoal = (goals: GoalFormData[]) => {
    mutateAddCommonGoal({
      appraisalId: appraisal.appraisalId,
      departmentId: departmentId,
      goals: goals,
    });
  };

  const handleFinalAssessment = (user: User) => {
    console.log("최종 평가", user);
    // TODO: Implement final assessment logic
  };

  const handleEvaluateGoal = (goal: Goal, user: User) => {
    console.log("목표 평가", goal, user);
    // TODO: Implement goal evaluation logic
  };

  return (
    <Card className='mb-6'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg'>
            {appraisal.title}
            <span className='ml-2 text-sm font-normal text-muted-foreground'>
              {appraisal.appraisalType}
            </span>
          </CardTitle>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => navigate(`/goal-grade/${appraisal.appraisalId}`)}>
              <Search className='w-4 h-4 mr-2' />
              상세 보기
            </Button>
            <Dialog
              open={isAddCommonGoalModalOpen}
              onOpenChange={setIsAddCommonGoalModalOpen}>
              <DialogTrigger asChild>
                <Button size='sm' variant='secondary'>
                  <Plus className='w-4 h-4 mr-2' />
                  공통 목표 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>공통 목표 추가</DialogTitle>
                </DialogHeader>
                <GoalForm
                  onSubmitGoals={handleApplyCommonGoal}
                  showLeft={false}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>직책/직급</TableHead>
              <TableHead>목표 수</TableHead>
              <TableHead>상태</TableHead>
              <TableHead className='text-right'>관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appraisal.user.map((user) => (
              <TableRow key={user.userId}>
                <TableCell className='font-medium'>{user.koreanName}</TableCell>
                <TableCell>-</TableCell> {/* Job Title/Position if available */}
                <TableCell>{user.goals.length}개</TableCell>
                <TableCell>
                  <Badge variant='outline'>평가 대기</Badge>{" "}
                  {/* Dynamic status needed */}
                </TableCell>
                <TableCell className='text-right'>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => setSelectedUser(user)}>
                        <Star className='w-4 h-4 mr-2' />
                        평가하기
                      </Button>
                    </DialogTrigger>
                    <DialogContent className='max-w-3xl max-h-[80vh] overflow-y-auto'>
                      <DialogHeader>
                        <DialogTitle>
                          {user.koreanName}님의 목표 평가
                        </DialogTitle>
                      </DialogHeader>
                      <div className='space-y-6 py-4'>
                        <div className='flex justify-end'>
                          <Button
                            size='sm'
                            className='bg-blue-600 hover:bg-blue-700'
                            onClick={() => handleFinalAssessment(user)}>
                            <CheckCircle className='w-4 h-4 mr-1' />
                            최종 평가
                          </Button>
                        </div>
                        {user.goals.length > 0 ? (
                          user.goals.map((goal) => (
                            <Card key={goal.goalId}>
                              <CardHeader>
                                <CardTitle className='text-base flex items-center gap-2'>
                                  <GoalIcon className='w-5 h-5 text-green-600' />
                                  {goal.title}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className='flex flex-col gap-4'>
                                  <p className='text-sm text-gray-600'>
                                    {goal.description}
                                  </p>
                                  <div className='flex justify-end'>
                                    <Button
                                      size='sm'
                                      className='bg-orange-600 hover:bg-orange-700'
                                      onClick={() =>
                                        handleEvaluateGoal(goal, user)
                                      }>
                                      <Star className='w-4 h-4 mr-1' />
                                      개별 목표 평가
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <div className='text-center py-8 text-gray-500'>
                            등록된 목표가 없습니다.
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
