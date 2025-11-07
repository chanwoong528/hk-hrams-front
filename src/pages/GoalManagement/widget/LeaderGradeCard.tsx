import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useState } from "react";

import type { Appraisal, DepartmentAppraisal, Goal, User } from "../type.d";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle, Goal as GoalIcon, Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  return (
    <Accordion type='multiple'>
      {departmentAppraisals.map((departmentAppraisal) => (
        <AccordionItem
          key={departmentAppraisal.departmentName}
          value={departmentAppraisal.departmentName}>
          <AccordionTrigger>
            <CardTitle>
              <div>{departmentAppraisal.departmentName}</div>
            </CardTitle>
          </AccordionTrigger>
          <AccordionContent>
            {departmentAppraisal.appraisal.map((appraisal) => (
              <AppraisalCard
                key={appraisal.appraisalId}
                appraisal={appraisal}
                departmentId={departmentAppraisal.departmentId}
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

const AppraisalCard = ({
  appraisal,
  departmentId,
}: {
  appraisal: Appraisal;
  departmentId: string;
}) => {
  const navigate = useNavigate();
  const [isAddCommonGoalModalOpen, setIsAddCommonGoalModalOpen] =
    useState(false);

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

  const handleFinalAssessment = (user: User) => {
    console.log("최종 평가", user);
  };
  const handleEvaluateGoal = (goal: Goal, user: User) => {
    console.log("목표 평가", goal, user);
  };
  const handleAddCommonGoal = (goals: GoalFormData[]) => {
    mutateAddCommonGoal({
      appraisalId: appraisal.appraisalId,
      departmentId: departmentId,
      goals: goals,
    });
  };

  return (
    <div className='flex flex-col gap-2 pl-4'>
      <Accordion type='multiple'>
        <AccordionItem value={appraisal.appraisalId}>
          <AccordionTrigger>
            <CardTitle>
              <Button
                onClick={() =>
                  navigate(`/goal-grade/${appraisal.appraisalId}`)
                }>
                인사평가 : {appraisal.title}
              </Button>
            </CardTitle>
          </AccordionTrigger>
          <div className='flex items-center justify-end gap-2 mb-2'>
            <Dialog
              open={isAddCommonGoalModalOpen}
              onOpenChange={setIsAddCommonGoalModalOpen}>
              <DialogTrigger asChild>
                <Button
                  variant='outline'
                  className='flex-1 lg:flex-none'
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsAddCommonGoalModalOpen(true);
                  }}>
                  <Plus className='w-4 h-4 mr-2' />
                  공통 목표 추가
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>공통 목표 추가</DialogTitle>
                </DialogHeader>
                <GoalForm
                  onSubmitGoals={handleAddCommonGoal}
                  showLeft={false}
                />
              </DialogContent>
            </Dialog>
          </div>
          <AccordionContent>
            {appraisal.user.map((user) => (
              <Card key={user.userId}>
                <CardHeader>
                  <CardTitle>
                    <div className='flex items-center justify-between gap-2'>
                      <p>평가 대상자: {user.koreanName}</p>
                      <Button
                        size='sm'
                        className='bg-blue-600 hover:bg-blue-700'
                        onClick={() => handleFinalAssessment(user)}>
                        <CheckCircle className='w-4 h-4 mr-1' />
                        최종 평가
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-2'>
                  {user.goals.length > 0 ? (
                    user.goals.map((goal) => (
                      <Card key={goal.goalId}>
                        <CardHeader>
                          <CardTitle>
                            <p className='flex items-center gap-2 text-lg font-bold'>
                              <GoalIcon className='w-6 h-6 mr-1 text-green-600' />
                              {goal.title}
                            </p>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className='flex items-center justify-between gap-2 '>
                            <p>{goal.description}</p>
                            <Button
                              size='sm'
                              className='bg-orange-600 hover:bg-orange-700'
                              onClick={() => handleEvaluateGoal(goal, user)}>
                              <Star className='w-4 h-4 mr-1' />
                              평가
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p>목표가 없습니다.</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
