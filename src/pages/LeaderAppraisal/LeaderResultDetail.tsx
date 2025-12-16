import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GET_reviewResult } from "@/api/leader-review/leader-review";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Quote } from "lucide-react";

export default function LeaderResultDetail() {
  const { reviewId } = useParams();
  const navigate = useNavigate();

  const { data: result, isLoading } = useQuery({
    queryKey: ["leaderResult", reviewId],
    queryFn: () => GET_reviewResult(reviewId || ""),
    enabled: !!reviewId,
  });

  if (isLoading)
    return (
      <div className='flex justify-center p-8'>
        <Loader2 className='w-8 h-8 animate-spin' />
      </div>
    );
  if (!result) return <div>결과를 찾을 수 없습니다.</div>;

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-8 pb-20'>
      <div className='space-y-4'>
        <Button
          variant='ghost'
          className='pl-0 gap-2'
          onClick={() => navigate(-1)}>
          <ArrowLeft className='w-4 h-4' /> 목록으로
        </Button>
        <div>
          <h1 className='text-3xl font-bold'>{result.title} 결과 리포트</h1>
          <p className='text-muted-foreground mt-2'>{result.description}</p>

          {/* Participation Stats */}
          <div className='mt-4 flex items-center gap-4 p-4 bg-blue-50 border border-blue-100 rounded-lg'>
            <div className='flex-1'>
              <div className='text-sm text-blue-800 font-semibold mb-1'>
                응답 참여율
              </div>
              <div className='text-2xl font-bold text-blue-900'>
                {result.submittedReviewers} / {result.totalReviewers} 명
                <span className='text-base font-normal text-blue-600 ml-2'>
                  (
                  {Math.round(
                    ((result.submittedReviewers || 0) /
                      (result.totalReviewers || 1)) *
                      100,
                  )}
                  %)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className='space-y-6'>
        {result.questions.map((q, idx) => (
          <Card key={q.questionId}>
            <CardHeader>
              <CardTitle className='text-lg flex gap-2'>
                <span className='text-primary font-bold'>Q{idx + 1}.</span>
                {q.questionText}
              </CardTitle>
              <CardDescription>응답자 수: {q.responseCount}명</CardDescription>
            </CardHeader>

            <CardContent>
              {q.questionType === "LIKERT_5" ? (
                <div className='space-y-6'>
                  <div className='flex items-center gap-4'>
                    <div className='text-4xl font-bold text-blue-600'>
                      {q.average}
                      <span className='text-lg text-gray-400 font-normal ml-1'>
                        / 5.0
                      </span>
                    </div>
                    <div className='flex-1 h-4 bg-gray-100 rounded-full overflow-hidden'>
                      <div
                        className='h-full bg-blue-600 rounded-full transition-all'
                        style={{ width: `${(q.average! / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <h4 className='text-sm font-semibold text-gray-700'>
                      분포도
                    </h4>
                    <div className='grid grid-cols-5 gap-1 h-32 items-end'>
                      {[1, 2, 3, 4, 5].map((score) => {
                        const count = q.distribution?.[score - 1] || 0;
                        const max = Math.max(...(q.distribution || [1]));

                        return (
                          <div
                            key={score}
                            className='flex flex-col items-center gap-1 group'>
                            <div className='text-xs font-semibold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity'>
                              {count}명
                            </div>
                            <div
                              className='w-full bg-blue-100 hover:bg-blue-200 rounded-t-md transition-all relative flex flex-col justify-end'
                              style={{
                                height: `${(count / max) * 100}%`,
                                minHeight: "4px",
                              }}></div>
                            <div className='text-sm font-medium text-gray-600'>
                              {score}점
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className='flex justify-between text-xs text-gray-400 px-2'>
                      <span>전혀 아님</span>
                      <span>매우 그렇다</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='space-y-3'>
                  {q.textAnswers && q.textAnswers.length > 0 ? (
                    q.textAnswers.map((txt, i) => (
                      <div
                        key={i}
                        className='flex gap-3 p-4 bg-gray-50 rounded-lg text-gray-700'>
                        <Quote className='w-5 h-5 text-gray-300 flex-shrink-0' />
                        <p className='whitespace-pre-wrap'>{txt}</p>
                      </div>
                    ))
                  ) : (
                    <div className='text-center py-4 text-gray-400 italic'>
                      답변이 없습니다.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
