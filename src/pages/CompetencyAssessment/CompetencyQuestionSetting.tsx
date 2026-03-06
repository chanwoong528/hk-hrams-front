import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Check,
  Settings2,
  Target,
  Building2,
} from "lucide-react";
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
import {
  POST_createCompetencyQuestions,
  GET_competencyQuestions,
} from "@/api/competency/competency";
import type { CompetencyQuestionGroupDto } from "@/api/competency/competency";
import { useCurrentUserStore } from "@/store/currentUserStore";
import { GET_appraisalsByDistinctType } from "@/api/appraisal/appraisal";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function CompetencyQuestionSetting() {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUserStore();

  const [appraisalId, setAppraisalId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);

  // Inline editing state
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingQuestions, setEditingQuestions] = useState<string[]>([]);

  // Fetch appraisals for the dropdown
  const { data: appraisals, isLoading: isLoadingAppraisals } = useQuery({
    queryKey: ["appraisalTypes-for-competency"],
    queryFn: () => GET_appraisalsByDistinctType("", ""),
    select: (data) => data.data || [],
  });

  // Fetch existing competency questions
  const { data: existingQuestionGroups, isLoading: isLoadingGroups } = useQuery(
    {
      queryKey: ["competencyQuestionsGrouped"],
      queryFn: GET_competencyQuestions,
    },
  );

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
      queryClient.invalidateQueries({
        queryKey: ["competencyQuestionsGrouped"],
      });
      // Reset form on success
      setAppraisalId("");
      setQuestions([""]);
      setEditingGroupId(null);
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

  const handleEditGroup = (group: CompetencyQuestionGroupDto) => {
    setEditingGroupId(`${group.appraisalId}-${group.departmentId}`);
    setEditingQuestions([...group.questions]);
  };

  const handleInlineAddQuestion = () => {
    setEditingQuestions([...editingQuestions, ""]);
  };

  const handleInlineRemoveQuestion = (index: number) => {
    setEditingQuestions(editingQuestions.filter((_, i) => i !== index));
  };

  const handleInlineChangeQuestion = (index: number, value: string) => {
    const newQuestions = [...editingQuestions];
    newQuestions[index] = value;
    setEditingQuestions(newQuestions);
  };

  const handleInlineSubmit = (appraisalId: string, departmentId: string) => {
    const filledQuestions = editingQuestions.filter((q) => q.trim() !== "");
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

      <Card className='bg-blue-50/40 border-blue-100 shadow-sm'>
        <CardHeader className='pb-4 border-b border-blue-100/50 mb-4'>
          <CardTitle className='text-lg flex items-center gap-2 text-blue-900'>
            <Settings2 className='w-5 h-5 text-blue-600' />
            평가 배포 대상 설정
          </CardTitle>
          <p className='text-sm text-blue-600/80'>
            어떤 평가와 부서를 대상으로 문항을 작성할지 먼저 선택해주세요.
          </p>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2.5 bg-white p-4 rounded-xl border border-gray-100 shadow-sm'>
              <Label className='flex items-center gap-2 text-sm font-bold text-gray-700'>
                <Target className='w-4 h-4 text-blue-500' />
                참조할 인사 평가 (Appraisal)
              </Label>
              <Select value={appraisalId} onValueChange={setAppraisalId}>
                <SelectTrigger className='h-11 bg-gray-50'>
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

            <div className='space-y-2.5 bg-white p-4 rounded-xl border border-gray-100 shadow-sm'>
              <Label className='flex items-center gap-2 text-sm font-bold text-gray-700'>
                <Building2 className='w-4 h-4 text-blue-500' />
                대상 소속 부서
              </Label>
              <Select
                value={departmentId}
                onValueChange={setDepartmentId}
                disabled={!currentUser?.departments?.length}>
                <SelectTrigger className='h-11 bg-gray-50'>
                  <SelectValue placeholder='부서를 선택하세요' />
                </SelectTrigger>
                <SelectContent>
                  {currentUser?.departments?.map((dept) => (
                    <SelectItem
                      key={dept.departmentId}
                      value={dept.departmentId}>
                      {dept.departmentName} {dept.isLeader ? "(리더 권한)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className='mt-8 pt-6 border-t border-gray-100'>
            <div className='flex flex-row justify-between items-center mb-6'>
              <div>
                <CardTitle className='text-lg flex items-center gap-2 text-gray-800'>
                  평가 문항 작성
                </CardTitle>
                <p className='text-sm text-gray-500 mt-1'>
                  선택한 대상 부서원들에게 배포될 공통 질문을 항목별로 자유롭게
                  작성해주세요.
                </p>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={handleAddQuestion}
                className='bg-white border-dashed border-gray-300 text-blue-600 hover:text-blue-700 hover:bg-blue-50'>
                <Plus className='w-4 h-4 mr-2' />
                문항 추가
              </Button>
            </div>
            <div className='space-y-4'>
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className='flex items-start gap-3 bg-gray-50/50 p-2 rounded-lg group transition-colors hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100'>
                  <span className='font-semibold text-gray-400 w-6 pt-2.5 pl-2 select-none'>
                    {idx + 1}.
                  </span>
                  <Input
                    placeholder='평가 항목을 입력하세요 (예: 팀 내 협업 태도)'
                    value={q}
                    onChange={(e) => handleChangeQuestion(idx, e.target.value)}
                    className='flex-1 min-h-[44px] bg-white'
                  />
                  <Button
                    variant='ghost'
                    className='text-gray-400 hover:text-red-500 hover:bg-red-50 mt-1 min-h-[36px] opacity-0 group-hover:opacity-100 transition-opacity'
                    onClick={() => handleRemoveQuestion(idx)}
                    disabled={questions.length === 1}>
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </div>
              ))}
            </div>

            <div className='flex justify-end mt-8'>
              <Button
                size='lg'
                className='bg-blue-600 hover:bg-blue-700 font-medium px-8 shadow-md'
                onClick={handleSubmit}
                disabled={isPending}>
                <Check className='w-5 h-5 mr-2' />
                항목 저장 및 배포하기
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='pt-8'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-bold text-gray-800'>
            등록된 문항 리스트
          </h3>
          <p className='text-sm text-gray-500'>
            이미 작성 및 배포가 완료된 항목들입니다.
          </p>
        </div>

        {isLoadingGroups ? (
          <div className='text-center py-10 text-gray-500'>
            불러오는 중입니다...
          </div>
        ) : existingQuestionGroups?.length === 0 ? (
          <Card className='bg-gray-50 border-dashed'>
            <CardContent className='flex items-center justify-center h-32 text-gray-400'>
              등록된 문항 리스트가 없습니다.
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-4'>
            {existingQuestionGroups?.map((group) => {
              const groupId = `${group.appraisalId}-${group.departmentId}`;
              const isEditing = editingGroupId === groupId;

              return (
                <Card key={groupId}>
                  <CardHeader className='pb-3 border-b bg-gray-50'>
                    <div className='flex justify-between items-start'>
                      <div>
                        <div className='text-sm text-blue-600 font-semibold mb-1'>
                          {group.appraisalTitle}
                        </div>
                        <CardTitle className='text-base flex items-center gap-2'>
                          {group.departmentName}
                          <div className='flex items-center gap-1.5 ml-2'>
                            <span className='text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded'>
                              작성자:{" "}
                              <span className='font-semibold text-gray-700'>
                                {group.creatorName}
                              </span>
                            </span>
                            {group.lastModifierName &&
                              group.lastModifierId !== group.creatorId && (
                                <span className='text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100'>
                                  최종 수정자:{" "}
                                  <span className='font-semibold'>
                                    {group.lastModifierName}
                                  </span>
                                </span>
                              )}
                          </div>
                        </CardTitle>
                      </div>
                      <div className='flex flex-col items-end gap-2'>
                        <span className='text-xs text-gray-400'>
                          {format(new Date(group.created), "yyyy.MM.dd HH:mm", {
                            locale: ko,
                          })}
                        </span>
                        {isEditing ? (
                          <div className='flex gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => setEditingGroupId(null)}>
                              취소
                            </Button>
                            <Button
                              size='sm'
                              onClick={() =>
                                handleInlineSubmit(
                                  group.appraisalId,
                                  group.departmentId,
                                )
                              }
                              disabled={isPending}>
                              저장
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleEditGroup(group)}>
                            수정하기
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='pt-4'>
                    {isEditing ? (
                      <div className='space-y-4'>
                        {editingQuestions.map((q, qIdx) => (
                          <div key={qIdx} className='flex items-center gap-3'>
                            <span className='font-semibold text-gray-500 w-6'>
                              Q{qIdx + 1}.
                            </span>
                            <Input
                              placeholder='평가 항목을 입력하세요'
                              value={q}
                              onChange={(e) =>
                                handleInlineChangeQuestion(qIdx, e.target.value)
                              }
                            />
                            <Button
                              variant='ghost'
                              className='text-red-500 hover:text-red-600 hover:bg-red-50'
                              onClick={() => handleInlineRemoveQuestion(qIdx)}
                              disabled={editingQuestions.length === 1}>
                              <Trash2 className='w-4 h-4' />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={handleInlineAddQuestion}>
                          <Plus className='w-4 h-4 mr-2' />
                          문항 추가
                        </Button>
                      </div>
                    ) : (
                      <ul className='space-y-2'>
                        {group.questions.map((q, qIdx) => (
                          <li
                            key={qIdx}
                            className='flex items-start gap-2 text-sm text-gray-700'>
                            <span className='font-medium text-gray-400'>
                              Q{qIdx + 1}.
                            </span>
                            {q}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
