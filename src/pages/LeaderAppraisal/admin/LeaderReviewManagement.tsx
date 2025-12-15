import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Users, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";

import {
  GET_leaderReviews,
  GET_templates,
  POST_startLeaderReview,
} from "@/api/leader-review/leader-review";
import { GET_leaders } from "@/api/user/user";
import type { HramsUserType } from "@/api/user/user";
import UserMultiSelect from "@/pages/PerformanceAppraisal/widget/UserMultiSelect";

export default function LeaderReviewManagement() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [excludedUsers, setExcludedUsers] = useState<HramsUserType[]>([]);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewDescription, setReviewDescription] = useState("");

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setReviewTitle(`${format(new Date(), "yyyy년 M월")} 리더 평가`);
    setReviewDescription("");
  };

  // Queries
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["leader-reviews"],
    queryFn: GET_leaderReviews,
  });

  const { data: templates } = useQuery({
    queryKey: ["leader-review-templates"],
    queryFn: GET_templates,
  });

  // Fetch only leaders for exclusion list
  const { data: leaders } = useQuery({
    queryKey: ["leaders"],
    queryFn: GET_leaders,
    select: (data: any) => data?.data || [],
  });

  const { mutate: startBatchReview, isPending: isStarting } = useMutation({
    mutationFn: POST_startLeaderReview,
    onSuccess: (response: any) => {
      toast.success(response.message || "리더 평가가 시작되었습니다.");
      setIsModalOpen(false);
      setSelectedTemplate("");
      setExcludedUsers([]);
      setReviewTitle("");
      setReviewDescription("");
      queryClient.invalidateQueries({ queryKey: ["leader-reviews"] });
    },
    onError: (error) => {
      console.error(error);
      toast.error("평가 시작 중 오류가 발생했습니다.");
    },
  });

  const handleStartReview = () => {
    if (!selectedTemplate) {
      toast.error("템플릿을 선택해주세요.");
      return;
    }
    if (!reviewTitle) {
      toast.error("평가 제목을 입력해주세요.");
      return;
    }

    if (
      confirm(
        `선택한 템플릿으로 모든 리더(${leaders?.length || 0}명, 제외 ${
          excludedUsers.length
        }명)에 대한 평가를 시작하시겠습니까?`,
      )
    ) {
      startBatchReview({
        templateId: selectedTemplate,
        reviewTitle: reviewTitle,
        reviewDescription: reviewDescription,
        excludedUserIds: excludedUsers.map((u) => u.userId),
      });
    }
  };

  if (isLoadingReviews) return <div>Loading...</div>;

  return (
    <div className='p-6 space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>리더 평가 관리</h2>
          <p className='text-muted-foreground'>
            진행 중인 리더 평가 현황을 조회하고 새로운 평가를 시작합니다.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenModal}>
              <Plus className='mr-2 h-4 w-4' /> 평가 일괄 시작
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[600px]'>
            <DialogHeader>
              <DialogTitle>리더 평가 일괄 시작</DialogTitle>
              <DialogDescription>
                모든 리더를 대상으로 평가를 시작합니다. 특정 리더를 제외할 수
                있습니다.
              </DialogDescription>
            </DialogHeader>
            <div className='grid gap-6 py-4'>
              <div className='grid gap-2'>
                <Label htmlFor='title'>평가 제목</Label>
                <Input
                  id='title'
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder='예) 2024년 4분기 리더 평가'
                />
              </div>

              <div className='grid gap-2'>
                <Label htmlFor='template'>평가 템플릿 선택</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder='템플릿을 선택하세요' />
                  </SelectTrigger>
                  <SelectContent>
                    {templates?.map((t) => (
                      <SelectItem key={t.templateId} value={t.templateId}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='grid gap-2'>
                <Label>평가 제외 대상 리더 (선택)</Label>
                <div className='text-sm text-gray-500 mb-1'>
                  전체 리더 대상으로 자동 시작됩니다. 제외할 리더만 선택하세요.
                </div>
                <UserMultiSelect
                  value={excludedUsers}
                  onChange={setExcludedUsers}
                  users={leaders || []}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='secondary'
                onClick={() => setIsModalOpen(false)}>
                취소
              </Button>
              <Button onClick={handleStartReview} disabled={isStarting}>
                {isStarting ? "처리중..." : "일괄 시작"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {reviews?.map((review: any) => (
          <Card
            key={review.leaderReviewId}
            className='hover:shadow-md transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {review.target?.koreanName}
              </CardTitle>
              <Badge
                variant={
                  review.status === "COMPLETED" ? "secondary" : "default"
                }>
                {review.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold mb-2'>리더 평가</div>
              <div className='text-xs text-muted-foreground space-y-1'>
                <div className='flex items-center'>
                  <Calendar className='mr-1 h-3 w-3' />
                  {review.createdAt
                    ? format(new Date(review.createdAt), "yyyy.MM.dd", {
                        locale: ko,
                      })
                    : "-"}{" "}
                  시작
                </div>
                <div className='flex items-center'>
                  <Users className='mr-1 h-3 w-3' />
                  {review.assignments?.length || 0} 명의 동료 평가자
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {reviews?.length === 0 && (
          <div className='col-span-3 text-center py-10 text-gray-500'>
            진행 중인 평가가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
