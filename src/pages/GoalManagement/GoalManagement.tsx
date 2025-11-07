import {
  Star,
  MessageSquare,
  TrendingUp,
  Pencil,
  // CheckCircle2,
  ListChecks,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import {
  GET_appraisalsByDistinctType,
  GET_appraisalsOfTeamMembers,
} from "@/api/appraisal/appraisal";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useCurrentUserStore } from "@/store/currentUserStore";
import LeaderGradeCard from "./widget/LeaderGradeCard";

import type { DepartmentAppraisal } from "./type.d";

export default function GoalManagement() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUserStore();
  const { data: myAppraisals, isLoading: isLoadingMyAppraisals } = useQuery({
    queryKey: ["appraisalTypes"],
    queryFn: () => GET_appraisalsByDistinctType("my-appraisal"),
    select: (data: { data: MyAppraisal[] }) => {
      return data.data;
    },
  });
  const isLeader =
    currentUser?.departments.some((dept) => dept.isLeader) ?? false;

  const {
    data: teamMembersAppraisals,
    isLoading: isLoadingTeamMembersAppraisals,
  } = useQuery({
    queryKey: ["teamMembersAppraisals"],
    queryFn: () =>
      GET_appraisalsOfTeamMembers(
        currentUser?.departments.map((dept) => dept.departmentId) || [],
      ),
    select: (data: { data: DepartmentAppraisal[] }) => data.data,

    enabled: isLeader,
  });

  console.log(teamMembersAppraisals);

  if (isLoadingMyAppraisals || isLoadingTeamMembersAppraisals) {
    return <div>Loading...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "finished":
        return "bg-green-100 text-green-700";
      case "ongoing":
        return "bg-blue-100 text-blue-700";
      case "draft":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "finished":
        return "완료";
      case "ongoing":
        return "진행 중";
      case "draft":
        return "대기";
      default:
        return status;
    }
  };

  return (
    <div className='p-4 lg:p-6 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row gap-4 justify-between'>
        <div>
          <h2 className='text-gray-900'>목표 관리</h2>
          <p className='text-gray-600 mt-1'>목표를 설정하고 평가합니다</p>
        </div>
      </div>

      {/* Statistics */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>전체 목표</p>
                <h3 className='mt-2'>{myAppraisals?.length || 0}개</h3>
              </div>
              <Star className='w-8 h-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>완료</p>
                <h3 className='mt-2'>
                  {myAppraisals?.filter(
                    (appraisal) => appraisal.status === "finished",
                  ).length || 0}
                  개
                </h3>
              </div>
              <TrendingUp className='w-8 h-8 text-green-600' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>진행 중</p>
                <h3 className='mt-2'>
                  {myAppraisals?.filter(
                    (appraisal) => appraisal.status === "ongoing",
                  ).length || 0}
                  개
                </h3>
              </div>
              <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center'>
                <div className='w-4 h-4 bg-blue-600 rounded-full animate-pulse' />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>평가 완료</p>
                <h3 className='mt-2'>
                  {myAppraisals?.filter(
                    (appraisal) => appraisal.status === "finished",
                  ).length || 0}
                  개
                </h3>
              </div>
              <MessageSquare className='w-8 h-8 text-orange-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            나의 평가 작성 목록 ({myAppraisals?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {myAppraisals?.map((appraisal) => (
              <Card
                key={appraisal.appraisalId}
                className='hover:shadow-md transition-shadow'>
                <CardContent className='p-4'>
                  <div className='flex flex-col lg:flex-row gap-4'>
                    <div className='flex-1 space-y-3'>
                      <div className='flex items-start justify-between gap-4'>
                        <div className='flex flex-col gap-2 flex-1'>
                          <div className='flex items-center gap-2'>
                            <Badge className={getStatusColor(appraisal.status)}>
                              {getStatusText(appraisal.status)}
                            </Badge>
                            <p className='text-gray-900'>{appraisal.title}</p>
                          </div>
                          <div className='flex flex-col flex-wrap gap-2 mt-2 text-sm text-gray-600'>
                            <p className='text-gray-900'>
                              {appraisal.description}
                            </p>
                            <p className='text-gray-600'>
                              {appraisal.appraisalType}
                            </p>
                          </div>
                          <div>
                            <div className='flex items-center gap-4'>
                              <div className='flex items-center gap-1 text-gray-600'>
                                <ListChecks className='w-4 h-4' />
                                <span>목표 {appraisal.goals.length}개</span>
                              </div>
                              {/* <div className='flex items-center gap-1 text-green-600'>
                                <CheckCircle2 className='w-4 h-4' />
                                //TODO: 평가 당한 목표 개수 표시
                              </div> */}
                            </div>
                          </div>
                        </div>
                        <div className='flex items-center gap-2 shrink-0'></div>
                      </div>
                    </div>

                    <div className='flex lg:flex-col gap-2 '>
                      <Button
                        variant='outline'
                        className='flex-1 lg:flex-none'
                        onClick={() => {
                          navigate(`/goal-management/${appraisal.appraisalId}`);
                        }}>
                        {appraisal.goals.length > 0 ? (
                          <Pencil className='w-4 h-4 mr-2' />
                        ) : (
                          <Plus className='w-4 h-4 mr-2' />
                        )}
                        {appraisal.goals.length > 0 ? "목표 수정" : "목표 작성"}
                      </Button>

                      {/* <Button
                        className='flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700'
                        onClick={() => {
                          setSelectedGoal(goal);
                          setIsAssessDialogOpen(true);
                        }}>
                        <Star className='w-4 h-4 mr-2' />
                        평가하기
                      </Button> */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {isLeader && (
        <Card>
          <CardHeader>
            <CardTitle>팀원 평가 진행하기</CardTitle>
          </CardHeader>
          <CardContent>
            <LeaderGradeCard
              departmentAppraisals={
                teamMembersAppraisals as DepartmentAppraisal[]
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Assessment Dialog */}

      {/* <Dialog open={isAssessDialogOpen} onOpenChange={setIsAssessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>목표 평가</DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <div className='space-y-4 py-4'>
              <div className='p-4 bg-gray-50 rounded-lg'>
                <Label>목표</Label>
                <p className='mt-1'>{selectedGoal.description}</p>
              </div>
              <div className='space-y-2'>
                <Label>등급 선택</Label>
                <RadioGroup
                  value={assessmentFormData.grade}
                  onValueChange={(value) =>
                    setAssessmentFormData({
                      ...assessmentFormData,
                      grade: value,
                    })
                  }>
                  <div className='space-y-2'>
                    <div className='flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer'>
                      <RadioGroupItem value='S' id='grade-s' />
                      <Label
                        htmlFor='grade-s'
                        className='flex-1 cursor-pointer'>
                        <div className='flex items-center justify-between'>
                          <span>S등급</span>
                          <Badge className='bg-green-100 text-green-700'>
                            탁월
                          </Badge>
                        </div>
                        <p className='text-sm text-gray-600 mt-1'>
                          목표를 크게 초과 달성
                        </p>
                      </Label>
                    </div>
                    <div className='flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer'>
                      <RadioGroupItem value='A' id='grade-a' />
                      <Label
                        htmlFor='grade-a'
                        className='flex-1 cursor-pointer'>
                        <div className='flex items-center justify-between'>
                          <span>A등급</span>
                          <Badge className='bg-blue-100 text-blue-700'>
                            우수
                          </Badge>
                        </div>
                        <p className='text-sm text-gray-600 mt-1'>
                          목표를 달성
                        </p>
                      </Label>
                    </div>
                    <div className='flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer'>
                      <RadioGroupItem value='B' id='grade-b' />
                      <Label
                        htmlFor='grade-b'
                        className='flex-1 cursor-pointer'>
                        <div className='flex items-center justify-between'>
                          <span>B등급</span>
                          <Badge className='bg-orange-100 text-orange-700'>
                            보통
                          </Badge>
                        </div>
                        <p className='text-sm text-gray-600 mt-1'>
                          목표를 부분적으로 달성
                        </p>
                      </Label>
                    </div>
                    <div className='flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer'>
                      <RadioGroupItem value='C' id='grade-c' />
                      <Label
                        htmlFor='grade-c'
                        className='flex-1 cursor-pointer'>
                        <div className='flex items-center justify-between'>
                          <span>C등급</span>
                          <Badge className='bg-red-100 text-red-700'>
                            미흡
                          </Badge>
                        </div>
                        <p className='text-sm text-gray-600 mt-1'>
                          목표 달성 미흡
                        </p>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              <div className='space-y-2'>
                <Label>평가 의견</Label>
                <Textarea
                  value={assessmentFormData.comments}
                  onChange={(e) =>
                    setAssessmentFormData({
                      ...assessmentFormData,
                      comments: e.target.value,
                    })
                  }
                  placeholder='평가에 대한 의견을 작성하세요'
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsAssessDialogOpen(false)}>
              취소
            </Button>
            <Button
              className='bg-blue-600 hover:bg-blue-700'
              onClick={handleSubmitAssessment}>
              평가 제출
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
    </div>
  );
}
