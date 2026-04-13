import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GET_appraisalsByDistinctType,
  GET_appraisalsOfTeamMembers,
} from "@/api/appraisal/appraisal";
import { GET_departments } from "@/api/department/department";
import { useCurrentUserStore } from "@/store/currentUserStore";
import LeaderGradeCard from "./widget/LeaderGradeCard";
import type { MyAppraisal, DepartmentAppraisal } from "./type";

// Refactored Components & Hooks
import { DashboardStats } from "./components/DashboardStats";
import { AppraisalCard } from "./components/AppraisalCard";
import { FinalAssessmentDialog } from "./components/FinalAssessmentDialog";
import { useFinalAssessment } from "./hooks/useFinalAssessment";
import { useGoalAssessment } from "./hooks/useGoalAssessment";
import { isHrOrAdminUser } from "@/lib/hrAccess";

export default function GoalManagement() {
  const {
    currentUser,
    // accessToken
  } = useCurrentUserStore();

  const isAdmin = isHrOrAdminUser(currentUser?.email, currentUser?.departments);

  // 1. Data Fetching
  const { data: myAppraisals, isLoading: isLoadingMyAppraisals } = useQuery({
    queryKey: ["appraisalTypes"],
    queryFn: () => GET_appraisalsByDistinctType("my-appraisal"),
    select: (data: { data: MyAppraisal[] }) => data.data,
  });

  const isLeader =
    isAdmin ||
    currentUser?.lv === "reviewer" ||
    currentUser?.lv === "both" ||
    (currentUser?.departments?.some((dept) => dept.isLeader) ?? false);

  // Fetch all departments for admin/HR users
  const { data: allDepartments } = useQuery({
    queryKey: ["allDepartmentsForGoals"],
    queryFn: () => GET_departments("flat"),
    enabled: isAdmin,
    select: (data) => data.data as any[],
  });

  /** 일반 리더: 조직 트리로 하위/형제 부서 통합 탭(전체 등급 분포) 계산 */
  const { data: leaderDepartmentFlat } = useQuery({
    queryKey: ["departmentsFlatForLeaderGoals"],
    queryFn: () => GET_departments("flat"),
    enabled: isLeader && !isAdmin,
    select: (data) => data.data as DepartmentTreeData[],
  });

  const leaderDepartmentIds =
    currentUser?.departments
      ?.filter((dept) => dept.isLeader)
      .map((dept) => dept.departmentId) ?? [];

  const {
    data: teamMembersAppraisals,
    isLoading: isLoadingTeamMembersAppraisals,
  } = useQuery({
    queryKey: ["teamMembersAppraisals", isAdmin, allDepartments?.length],
    queryFn: () => {
      let deptIds: string[];
      if (isAdmin && allDepartments) {
        deptIds = allDepartments.map((dept: any) => dept.id);
      } else {
        deptIds =
          currentUser?.departments
            ?.filter((dept) => dept.isLeader)
            .map((dept) => dept.departmentId) || [];
      }
      return GET_appraisalsOfTeamMembers(deptIds);
    },
    select: (data: { data: DepartmentAppraisal[] }) => data.data,
    enabled: isLeader && (!isAdmin || !!allDepartments),
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
              departmentFlat={
                isAdmin
                  ? (allDepartments as DepartmentTreeData[])
                  : leaderDepartmentFlat
              }
              useHrGroupView={isAdmin}
              leaderDepartmentIds={isAdmin ? undefined : leaderDepartmentIds}
              currentUserId={currentUser?.userId}
            />
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <FinalAssessmentDialog
        open={finalAssessment.isOpen}
        onOpenChange={finalAssessment.onOpenChange}
        jobGroup={finalAssessment.gradeScaleJobGroup}
        grade={finalAssessment.grade}
        onGradeChange={finalAssessment.setGrade}
        comment={finalAssessment.comment}
        onCommentChange={finalAssessment.setComment}
        onSubmit={finalAssessment.handleSubmit}
      />
    </div>
  );
}
