import { useQuery } from "@tanstack/react-query";
import { GET_myResultReviews } from "@/api/leader-review/leader-review";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Loader2, TrendingUp } from "lucide-react";

export default function MyLeaderResults() {
  const navigate = useNavigate();
  const { data: results, isLoading } = useQuery({
    queryKey: ["myLeaderResults"],
    queryFn: GET_myResultReviews,
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
        <h1 className='text-2xl font-bold tracking-tight'>
          나의 리더십 평가 결과
        </h1>
        <p className='text-muted-foreground mt-2'>
          동료들이 평가한 리더십 리뷰 결과를 확인할 수 있습니다. 모든 답변은
          익명으로 집계됩니다.
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {results?.length === 0 && (
          <Card className='col-span-full p-8 text-center text-muted-foreground bg-gray-50 border-dashed'>
            완료된 평가 결과가 없습니다.
          </Card>
        )}

        {results?.map((review) => {
          return (
            <Card
              key={review.leaderReviewId}
              className='hover:shadow-md transition-shadow'>
              <CardHeader className='pb-3'>
                <div className='flex justify-between items-start'>
                  <Badge variant='secondary'>{review.status}</Badge>
                  <span className='text-xs text-muted-foreground'>
                    {format(
                      new Date(review.createdAt || new Date()),
                      "yyyy.MM.dd",
                    )}
                  </span>
                </div>
                <CardTitle className='mt-2 text-lg'>
                  {review.cycle?.title || "리더십 평가"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-sm text-muted-foreground mb-4 min-h-[40px]'>
                  {review.cycle?.description || "설명 없음"}
                </div>

                <div className='mb-4 pt-4 border-t'>
                  <div className='flex justify-between items-center text-sm'>
                    <span className='text-gray-500'>응답 참여율</span>
                    <span className='font-semibold text-blue-700'>
                      {review.assignments?.filter(
                        (a) => a.status === "SUBMITTED",
                      ).length || 0}{" "}
                      / {review.assignments?.length || 0}
                      <span className='text-gray-400 ml-1'>
                        (
                        {Math.round(
                          ((review.assignments?.filter(
                            (a) => a.status === "SUBMITTED",
                          ).length || 0) /
                            (review.assignments?.length || 1)) *
                            100,
                        )}
                        %)
                      </span>
                    </span>
                  </div>
                  {/* Progress Bar */}
                  <div className='mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-blue-600 rounded-full'
                      style={{
                        width: `${
                          ((review.assignments?.filter(
                            (a) => a.status === "SUBMITTED",
                          ).length || 0) /
                            (review.assignments?.length || 1)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <Button
                  className='w-full'
                  onClick={() =>
                    navigate(
                      `/leader-appraisal/results/${review.leaderReviewId}`,
                    )
                  }>
                  <TrendingUp className='w-4 h-4 mr-2' />
                  결과 상세 보기
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
