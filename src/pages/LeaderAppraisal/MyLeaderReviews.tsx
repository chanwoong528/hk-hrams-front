import { useQuery } from "@tanstack/react-query";
import { GET_myLeaderReviewAssignments } from "@/api/leader-review/leader-review";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

export default function MyLeaderReviews() {
  const navigate = useNavigate();
  const { data: assignments, isLoading } = useQuery({
    queryKey: ["myLeaderReviews"],
    queryFn: GET_myLeaderReviewAssignments,
  });

  if (isLoading) {
    return (
      <div className='flex justify-center p-8'>
        <Loader2 className='w-8 h-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='p-6 max-w-5xl mx-auto space-y-6'>
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>리더 다면 평가</h1>
        <p className='text-muted-foreground mt-2'>
          배정된 리더 다면 평가에 참여해주세요. 익명성이 보장됩니다.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {assignments?.length === 0 && (
          <Card className='col-span-full p-8 text-center text-muted-foreground bg-gray-50 border-dashed'>
            배정된 평가가 없습니다.
          </Card>
        )}

        {assignments?.map((assignment) => {
          const isCompleted = assignment.status === "SUBMITTED";
          return (
            <Card
              key={assignment.assignmentId}
              className={`transition-all ${
                isCompleted
                  ? "bg-gray-50 opacity-80"
                  : "hover:shadow-md border-primary/20 bg-white"
              }`}>
              <CardHeader className='pb-3'>
                <div className='flex justify-between items-start'>
                  <Badge
                    variant={isCompleted ? "secondary" : "default"}
                    className={
                      isCompleted ? "" : "bg-blue-600 hover:bg-blue-700"
                    }>
                    {isCompleted ? "제출 완료" : "진행 중"}
                  </Badge>
                  {assignment.leaderReview.cycle?.deadline && (
                    <span className='text-xs text-muted-foreground'>
                      ~{" "}
                      {format(
                        new Date(assignment.leaderReview.cycle.deadline),
                        "yyyy.MM.dd",
                      )}
                    </span>
                  )}
                </div>
                <CardTitle className='mt-2 text-lg'>
                  {assignment.leaderReview.target?.koreanName} 리더님 평가
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-sm text-muted-foreground mb-4'>
                  {assignment.leaderReview.cycle?.title || "정기 다면 평가"}
                </div>

                <Button
                  className='w-full'
                  variant={isCompleted ? "outline" : "default"}
                  disabled={isCompleted}
                  onClick={() =>
                    navigate(
                      `/leader-appraisal/answer/${assignment.assignmentId}`,
                    )
                  }>
                  {isCompleted ? "완료됨" : "평가 시작하기"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
