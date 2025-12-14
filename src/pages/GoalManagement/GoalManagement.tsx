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

import { POST_goalAssessmentBy } from "@/api/goal-assessment-by/goal-assessment-by";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useCurrentUserStore } from "@/store/currentUserStore";
import LeaderGradeCard from "./widget/LeaderGradeCard";
import GoalAssessmentItem from "./widget/GoalAssessmentItem";
import { toast } from "sonner";

import type { MyAppraisal, DepartmentAppraisal } from "./type";

export default function GoalManagement() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUserStore();
  const queryClient = useQueryClient();

  // Self Assessment Mutation
  const { mutate: mutateAssessGoal } = useMutation({
    mutationFn: POST_goalAssessmentBy,
    onSuccess: () => {
      toast.success("평가가 저장되었습니다");
      queryClient.invalidateQueries({ queryKey: ["appraisalTypes"] });
    },
    onError: () => {
      toast.error("평가 저장 실패");
    },
  });

  const handleSelfAssessment = (goalId: string, grade: string, comment: string) => {
      if (!currentUser?.userId) {
          toast.error("사용자 정보를 찾을 수 없습니다.");
          return;
      }
      mutateAssessGoal({
          goalId,
          grade,
          comment,
          gradedBy: currentUser.userId
      });
  };

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
                className='border-none shadow-none'>
                <CardContent className='p-0 space-y-4'>
                  
                  {/* Appraisal Header */}
                  <div className='p-5 rounded-lg border bg-white shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center'>
                     <div className='space-y-3 flex-1 min-w-0'>
                        <div className='flex items-center gap-2 flex-wrap'>
                          <Badge className={getStatusColor(appraisal.status)}>
                            {getStatusText(appraisal.status)}
                          </Badge>
                          <h3 className='font-bold text-lg text-gray-900 truncate'>{appraisal.title}</h3>
                        </div>
                        
                        <p className="text-gray-600 text-sm leading-relaxed break-keep">
                          {appraisal.description}
                        </p>

                        <div className='flex items-center gap-3 text-sm text-gray-500 pt-1'>
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-600">
                            {appraisal.appraisalType}
                          </span>
                          <span className="w-px h-3 bg-gray-300"></span>
                          <div className='flex items-center gap-1.5'>
                             <ListChecks className='w-3.5 h-3.5' />
                             <span className="font-medium text-gray-700">목표 {appraisal.goals.length}개</span>
                          </div>
                        </div>
                     </div>
                     <Button
                        variant='outline'
                        onClick={() => {
                          navigate(`/goal-management/${appraisal.appraisalId}`);
                        }}>
                        {appraisal.goals.length > 0 ? (
                          <Pencil className='w-4 h-4 mr-2' />
                        ) : (
                          <Plus className='w-4 h-4 mr-2' />
                        )}
                        {appraisal.goals.length > 0 ? "목표 관리" : "목표 등록"}
                      </Button>
                  </div>

                  {/* Goals List (Self Assessment) */}
                  {appraisal.goals.length > 0 && (
                      <div className="pl-0 lg:pl-6 space-y-4 border-l-2 border-gray-100 ml-4 py-2">
                          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider pl-2 flex items-center gap-2 mb-2">
                             <Star className="w-4 h-4" /> 
                             자신에 대한 평가 (Self Assessment)
                          </h4>
                          {appraisal.goals.map((goal) => (
                              <GoalAssessmentItem 
                                  key={goal.goalId} 
                                  goal={goal} 
                                  currentUserId={currentUser?.userId || ''}
                                  onSave={(goalId, grade, comment) => handleSelfAssessment(goalId, grade, comment)}
                              />
                          ))}
                      </div>
                  )}

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
              currentUserId={currentUser?.userId}
            />
          </CardContent>
        </Card>
      )}

      {/* Assessment Dialog */}

    </div>
  );
}

