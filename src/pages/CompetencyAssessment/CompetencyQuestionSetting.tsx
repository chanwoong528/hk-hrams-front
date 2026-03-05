import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Plus, Trash2, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { POST_createCompetencyQuestions } from "@/api/competency/competency";
import { useCurrentUserStore } from "@/store/currentUserStore";
import { GET_appraisalsByDistinctType } from "@/api/appraisal/appraisal";

export default function CompetencyQuestionSetting() {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUserStore();

  const [appraisalId, setAppraisalId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);

  // Fetch appraisals for the dropdown
  const { data: appraisals, isLoading: isLoadingAppraisals } = useQuery({
    queryKey: ["appraisalTypes-for-competency"],
    queryFn: () => GET_appraisalsByDistinctType("", ""),
    select: (data) => data.data || [],
  });

  // Automatically select the first leader department if available
  useEffect(() => {
    if (currentUser?.departments?.length) {
      const leaderDept = currentUser.departments.find((d) => d.isLeader);
      if (leaderDept) setDepartmentId(leaderDept.departmentId);
      else setDepartmentId(currentUser.departments[0].departmentId); // Fallback
    }
  }, [currentUser]);

  const { mutate: createQuestions, isPending } = useMutation({
    mutationFn: (payload: {
      appraisalId: string;
      departmentId: string;
      questions: string[];
    }) => POST_createCompetencyQuestions(payload),
    onSuccess: () => {
      toast.success("역량 평가 문항이 부서원들에게 배포되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["competencyAssessments"] });
    },
    onError: () => {
      toast.error("문항 저장 및 배포에 실패했습니다.");
    },
  });

  const handleAddQuestion = () => {
    setQuestions([...questions, ""]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleChangeQuestion = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index] = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = () => {
    const filledQuestions = questions.filter((q) => q.trim() !== "");
    if (!appraisalId) {
      toast.error("진행 중인 평가(Appraisal ID)를 선택해주세요.");
      return;
    }
    if (!departmentId) {
      toast.error("선택된 부서가 없습니다.");
      return;
    }
    if (filledQuestions.length === 0) {
      toast.error("최소 1개 이상의 평가 문항을 작성해주세요.");
      return;
    }
    createQuestions({ appraisalId, departmentId, questions: filledQuestions });
  };

  return (
    <div className='p-4 lg:p-6 space-y-6'>
      <div className='flex flex-col sm:flex-row gap-4 justify-between'>
        <div>
          <h2 className='text-gray-900'>역량 평가 문항 설정 (부서장용)</h2>
          <p className='text-gray-600 mt-1'>
            소속 부서원들의 역량 평가를 위한 공통 질의 항목을 작성하세요.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>평가 배포 설정</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label>참조할 평가 (Appraisal)</Label>
            <Select value={appraisalId} onValueChange={setAppraisalId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    isLoadingAppraisals
                      ? "불러오는 중..."
                      : "진행중인 평가를 선택하세요"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {appraisals?.map((app: any) => (
                  <SelectItem key={app.appraisalId} value={app.appraisalId}>
                    {app.title} ({app.appraisalType})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-2'>
            <Label>소속 부서</Label>
            <Select
              value={departmentId}
              onValueChange={setDepartmentId}
              disabled={!currentUser?.departments?.length}>
              <SelectTrigger>
                <SelectValue placeholder='부서를 선택하세요' />
              </SelectTrigger>
              <SelectContent>
                {currentUser?.departments?.map((dept) => (
                  <SelectItem key={dept.departmentId} value={dept.departmentId}>
                    {dept.departmentName} {dept.isLeader ? "(리더)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row justify-between items-center'>
          <CardTitle className='text-lg'>평가 문항 작성</CardTitle>
          <Button variant='outline' size='sm' onClick={handleAddQuestion}>
            <Plus className='w-4 h-4 mr-2' />
            문항 추가
          </Button>
        </CardHeader>
        <CardContent className='space-y-4'>
          {questions.map((q, idx) => (
            <div key={idx} className='flex items-center gap-3'>
              <span className='font-semibold text-gray-500 w-6'>
                {idx + 1}.
              </span>
              <Input
                placeholder='평가 항목을 입력하세요 (예: 팀 내 협업 태도)'
                value={q}
                onChange={(e) => handleChangeQuestion(idx, e.target.value)}
              />
              <Button
                variant='ghost'
                className='text-red-500 hover:text-red-600 hover:bg-red-50'
                onClick={() => handleRemoveQuestion(idx)}
                disabled={questions.length === 1}>
                <Trash2 className='w-4 h-4' />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className='flex justify-end'>
        <Button
          className='bg-blue-600 hover:bg-blue-700'
          onClick={handleSubmit}
          disabled={isPending}>
          <Check className='w-4 h-4 mr-2' />
          저장 및 부서원 배포
        </Button>
      </div>
    </div>
  );
}
