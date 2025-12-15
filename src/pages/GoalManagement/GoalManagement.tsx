import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GET_appraisalsByDistinctType,
  GET_appraisalsOfTeamMembers,
} from "@/api/appraisal/appraisal";
import { useCurrentUserStore } from "@/store/currentUserStore";
import LeaderGradeCard from "./widget/LeaderGradeCard";
import type { MyAppraisal, DepartmentAppraisal } from "./type";

// Refactored Components & Hooks
import { DashboardStats } from "./components/DashboardStats";
import { AppraisalCard } from "./components/AppraisalCard";
import { FinalAssessmentDialog } from "./components/FinalAssessmentDialog";
import { useFinalAssessment } from "./hooks/useFinalAssessment";
import { useGoalAssessment } from "./hooks/useGoalAssessment";

export default function GoalManagement() {
  const { currentUser } = useCurrentUserStore();

  // 1. Data Fetching
  const { data: myAppraisals, isLoading: isLoadingMyAppraisals } = useQuery({
    queryKey: ["appraisalTypes"],
    queryFn: () => GET_appraisalsByDistinctType("my-appraisal"),
    select: (data: { data: MyAppraisal[] }) => data.data,
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

  // 2. Custom Hooks for Logic
  const { handleSelfAssessment } = useGoalAssessment({
    currentUserId: currentUser?.userId,
  });

  const finalAssessment = useFinalAssessment({
    currentUserId: currentUser?.userId,
  });

  if (isLoadingMyAppraisals || isLoadingTeamMembersAppraisals) {
    return <div>Loading...</div>;
  }

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
      <DashboardStats appraisals={myAppraisals || []} />

      {/* Self Appraisals List */}
      <Card>
        <CardHeader>
          <CardTitle>
            나의 평가 작성 목록 ({myAppraisals?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {myAppraisals?.map((appraisal) => (
              <AppraisalCard
                key={appraisal.appraisalId}
                appraisal={appraisal}
                currentUserId={currentUser?.userId}
                onSaveGoalAssessment={handleSelfAssessment}
                onOpenFinalAssessment={finalAssessment.openDialog}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leader View (if applicable) */}
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

      {/* Dialogs */}
      <FinalAssessmentDialog
        open={finalAssessment.isOpen}
        onOpenChange={finalAssessment.onOpenChange}
        grade={finalAssessment.grade}
        onGradeChange={finalAssessment.setGrade}
        comment={finalAssessment.comment}
        onCommentChange={finalAssessment.setComment}
        onSubmit={finalAssessment.handleSubmit}
      />
    </div>
  );
}
