import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  GET_leaderReviewAssignmentDetail,
  POST_submitLeaderReviewAssignment,
} from "@/api/leader-review/leader-review";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LeaderReviewForm() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const { data: assignment, isLoading } = useQuery({
    queryKey: ["leaderReviewAssignment", assignmentId],
    queryFn: () => GET_leaderReviewAssignmentDetail(assignmentId || ""),
    enabled: !!assignmentId,
  });

  const { mutate: submitReview, isPending: isSubmitting } = useMutation({
    mutationFn: POST_submitLeaderReviewAssignment,
    onSuccess: () => {
      toast.success("평가가 제출되었습니다.");
      navigate("/leader-appraisal/my");
    },
    onError: () => {
      toast.error("제출 중 오류가 발생했습니다.");
    },
  });

  if (isLoading)
    return (
      <div className='flex justify-center p-8'>
        <Loader2 className='w-8 h-8 animate-spin' />
      </div>
    );
  if (!assignment) return <div>평가 정보를 찾을 수 없습니다.</div>;

  const questions = assignment.leaderReview?.templates?.[0]?.questions || [];

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    // Validation
    const unanswered = questions.filter((q) => !answers[q.questionId]);
    if (unanswered.length > 0) {
      toast.error("모든 항목에 응답해주세요.");
      return;
    }

    if (window.confirm("제출하시겠습니까? 제출 후에는 수정할 수 없습니다.")) {
      submitReview({
        assignmentId: assignmentId!,
        answers: Object.entries(answers).map(([qid, ans]) => ({
          questionId: qid,
          answer: ans,
        })),
      });
    }
  };

  return (
    <div className='max-w-3xl mx-auto p-6 space-y-6'>
      <Button
        variant='ghost'
        className='pl-0 gap-2 mb-4'
        onClick={() => navigate(-1)}>
        <ArrowLeft className='w-4 h-4' /> 뒤로가기
      </Button>

      <div className='space-y-2'>
        <h1 className='text-2xl font-bold'>리더 다면 평가</h1>
        <div className='flex items-center gap-2 text-muted-foreground'>
          <span className='font-semibold text-foreground'>
            {assignment.leaderReview.target?.koreanName}
          </span>{" "}
          리더님에 대한 평가입니다.
        </div>
        <Alert className='bg-blue-50 border-blue-100 text-blue-800'>
          <AlertDescription>
            응답 내용은 철저히 익명으로 처리되며, 리더에게는 종합된 결과만
            전달됩니다. 솔직하게 답변 부탁드립니다.
          </AlertDescription>
        </Alert>
      </div>

      <div className='space-y-6'>
        {questions.map((q, idx) => (
          <Card key={q.questionId}>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base font-medium flex gap-3 leading-relaxed'>
                <span className='text-primary font-bold'>{idx + 1}.</span>
                {q.questionText}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {q.questionType === "LIKERT_5" ? (
                <RadioGroup
                  value={answers[q.questionId] || ""}
                  onValueChange={(val) =>
                    handleAnswerChange(q.questionId, val)
                  }>
                  <div className='flex flex-col gap-3 pt-2'>
                    {[
                      { val: "5", label: "매우 그렇다" },
                      { val: "4", label: "그렇다" },
                      { val: "3", label: "보통이다" },
                      { val: "2", label: "그렇지 않다" },
                      { val: "1", label: "전혀 그렇지 않다" },
                    ].map((opt) => (
                      <div
                        key={opt.val}
                        className='flex items-center space-x-2'>
                        <RadioGroupItem
                          value={opt.val}
                          id={`${q.questionId}-${opt.val}`}
                        />
                        <Label
                          htmlFor={`${q.questionId}-${opt.val}`}
                          className='font-normal cursor-pointer'>
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              ) : (
                <Textarea
                  placeholder='답변을 입력해주세요.'
                  className='min-h-[100px]'
                  value={answers[q.questionId] || ""}
                  onChange={(e) =>
                    handleAnswerChange(q.questionId, e.target.value)
                  }
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='flex justify-end gap-4 pb-10'>
        <Button variant='outline' onClick={() => navigate(-1)}>
          취소
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className='w-4 h-4 animate-spin mr-2' />
          ) : null}
          평가 제출하기
        </Button>
      </div>
    </div>
  );
}
