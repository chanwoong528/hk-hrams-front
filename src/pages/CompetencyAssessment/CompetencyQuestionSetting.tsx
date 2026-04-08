import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Check,
  Settings2,
  Target,
  Building2,
  FileText,
  Save,
  Download,
  Users,
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
  GET_competencyTemplates,
  POST_createCompetencyTemplate,
  DELETE_competencyTemplate,
} from "@/api/competency/competency";
import type { CompetencyTemplateDto } from "@/api/competency/competency";
import { useCurrentUserStore } from "@/store/currentUserStore";
import { GET_appraisalsByDistinctType } from "@/api/appraisal/appraisal";
import { GET_usersByPagination } from "@/api/user/user";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CompetencyQuestionSetting() {
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUserStore();

  const [appraisalId, setAppraisalId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [jobGroup, setJobGroup] = useState("all");
  const [questions, setQuestions] = useState<string[]>([""]);

  // Inline editing state
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingQuestions, setEditingQuestions] = useState<string[]>([]);

  // Template state
  const [isTemplateLoadOpen, setIsTemplateLoadOpen] = useState(false);
  const [isTemplateSaveOpen, setIsTemplateSaveOpen] = useState(false);
  const [templateTitle, setTemplateTitle] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");

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

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["competencyTemplates"],
    queryFn: GET_competencyTemplates,
  });
  
  // Fetch users of selected department to get available job groups
  const { data: deptUsers, isLoading: isLoadingDeptUsers } = useQuery({
    queryKey: ["users-for-jobgroups", departmentId],
    queryFn: () => GET_usersByPagination(1, 1000, "", departmentId),
    enabled: !!departmentId,
  });

  const availableJobGroups = Array.from(
    new Set(
      deptUsers?.data?.list
        ?.map((u: any) => u.jobGroup)
        .filter((jg: string | undefined) => !!jg) || []
    )
  ) as string[];

  // Automatically select the first leader department if available
  useEffect(() => {
    if (currentUser?.departments?.length) {
      const leaderDept = currentUser.departments.find((d) => d.isLeader);
      if (leaderDept) setDepartmentId(leaderDept.departmentId);
      else setDepartmentId(currentUser.departments[0].departmentId); // Fallback
    }
  }, [currentUser]);
  
  // Reactive Loading: Load existing questions when selection criteria change
  useEffect(() => {
    if (appraisalId && departmentId && existingQuestionGroups) {
      const targetJg = jobGroup === 'all' ? null : jobGroup;
      const match = existingQuestionGroups.find(
        (g: any) =>
          g.appraisalId === appraisalId &&
          g.departmentId === departmentId &&
          (g.jobGroup === targetJg)
      );
      
      if (match) {
        setQuestions([...match.questions]);
      } else {
        // If no match found for current combination, clear the inputs unless it's a first load
        setQuestions([""]);
      }
    }
  }, [appraisalId, departmentId, jobGroup, existingQuestionGroups]);

  const { mutate: createQuestions, isPending } = useMutation({
    mutationFn: (payload: {
      appraisalId: string;
      departmentId: string;
      jobGroup: string;
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
      setJobGroup("all");
      setEditingGroupId(null);
    },
    onError: () => {
      toast.error("문항 저장 및 배포에 실패했습니다.");
    },
  });

  const { mutate: saveTemplate, isPending: isSavingTemplate } = useMutation({
    mutationFn: (payload: { title: string; description?: string; jobGroup?: string; questions: string[] }) =>
      POST_createCompetencyTemplate(payload),
    onSuccess: () => {
      toast.success("템플릿이 저장되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["competencyTemplates"] });
      setIsTemplateSaveOpen(false);
      setTemplateTitle("");
      setTemplateDesc("");
    },
    onError: () => {
      toast.error("템플릿 저장에 실패했습니다.");
    },
  });

  const { mutate: deleteTemplate } = useMutation({
    mutationFn: (templateId: string) => DELETE_competencyTemplate(templateId),
    onSuccess: () => {
      toast.success("템플릿이 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["competencyTemplates"] });
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
    if (!jobGroup) {
      toast.error("직군을 선택하여 해당 직군 인원들에게 배포할 문항을 작성해주세요.");
      return;
    }
    if (filledQuestions.length === 0) {
      toast.error("최소 1개 이상의 평가 문항을 작성해주세요.");
      return;
    }
    createQuestions({ appraisalId, departmentId, jobGroup, questions: filledQuestions });
  };

  const handleApplyTemplate = (template: CompetencyTemplateDto) => {
    setQuestions(template.questions.map((q) => q.question));
    setJobGroup(template.jobGroup || 'all');
    setIsTemplateLoadOpen(false);
    toast.info(`'${template.title}' 템플릿 문항을 불러왔습니다 (직군: ${template.jobGroup || '전체'}).`);
  };

  const handleSaveAsTemplate = () => {
    const filledQuestions = questions.filter((q) => q.trim() !== "");
    if (filledQuestions.length === 0) {
      toast.error("저장할 문항이 없습니다.");
      return;
    }
    if (!templateTitle.trim()) {
      toast.error("템플릿 제목을 입력해주세요.");
      return;
    }
    saveTemplate({
      title: templateTitle,
      description: templateDesc,
      jobGroup: jobGroup,
      questions: filledQuestions,
    });
  };

  const handleEditGroup = (group: any) => {
    const displayGroup = group.displayJobGroup || group.jobGroup || 'all';
    setEditingGroupId(`${group.appraisalId}-${group.departmentId}-${displayGroup}`);
    setEditingQuestions([...group.questions]);
    // Synchronize the jobGroup state so new additions/templates follow the same target
    setJobGroup(group.jobGroup || 'all');
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

  const handleInlineSubmit = (appraisalId: string, departmentId: string, itemJobGroup: string) => {
    const filledQuestions = editingQuestions.filter((q) => q.trim() !== "");
    if (filledQuestions.length === 0) {
      toast.error("최소 1개 이상의 평가 문항을 작성해주세요.");
      return;
    }
    createQuestions({ appraisalId, departmentId, jobGroup: itemJobGroup || 'all', questions: filledQuestions });
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
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
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
                      {app.title}
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

            <div className='space-y-2.5 bg-white p-4 rounded-xl border border-gray-100 shadow-sm'>
              <Label className='flex items-center gap-2 text-sm font-bold text-gray-700'>
                <Users className='w-4 h-4 text-blue-500' />
                대상 직군 (Job Group)
              </Label>
              <Select
                value={jobGroup}
                onValueChange={setJobGroup}
                disabled={!departmentId || isLoadingDeptUsers}>
                <SelectTrigger className='h-11 bg-gray-50'>
                  <SelectValue placeholder={departmentId ? (isLoadingDeptUsers ? '불러오는 중...' : (availableJobGroups.length === 0 ? '직군 정보가 없습니다' : '직군을 선택하세요')) : '부서를 먼저 선택하세요'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 (All)</SelectItem>
                  {availableJobGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
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
            
            <div className='flex gap-2 mb-4'>
              <Dialog open={isTemplateLoadOpen} onOpenChange={setIsTemplateLoadOpen}>
                <DialogTrigger asChild>
                  <Button variant='outline' size='sm' className='text-gray-600'>
                    <Download className='w-4 h-4 mr-2' />
                    템플릿 불러오기
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>역량 평가 문항 템플릿</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh] mt-4">
                    <div className="space-y-4 pr-4">
                      {isLoadingTemplates ? (
                        <div className="text-center py-8 text-gray-400">불러오는 중...</div>
                      ) : templates?.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
                          저장된 템플릿이 없습니다.
                        </div>
                      ) : (
                        templates?.map((t) => (
                          <div key={t.templateId} className="p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50/30 transition-all cursor-pointer group" onClick={() => handleApplyTemplate(t)}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-blue-500" />
                                  {t.title}
                                </h4>
                                {t.description && <p className="text-sm text-gray-500 mt-1">{t.description}</p>}
                                <p className="text-xs text-blue-600 mt-2 font-medium">문항 {t.questions.length}개</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm("정말 이 템플릿을 삭제하시겠습니까?")) {
                                    deleteTemplate(t.templateId);
                                  }
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>

              <Dialog open={isTemplateSaveOpen} onOpenChange={setIsTemplateSaveOpen}>
                <DialogTrigger asChild>
                  <Button variant='outline' size='sm' className='text-gray-600'>
                    <Save className='w-4 h-4 mr-2' />
                    현재 문항을 템플릿으로 저장
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>템플릿으로 저장</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>템플릿 제목</Label>
                      <Input
                        placeholder="예: 개발직군 공통 협업 역량"
                        value={templateTitle}
                        onChange={(e) => setTemplateTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>설명 (선택)</Label>
                      <Input
                        placeholder="이 템플릿에 대한 간단한 설명을 적어주세요"
                        value={templateDesc}
                        onChange={(e) => setTemplateDesc(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant='outline' onClick={() => setIsTemplateSaveOpen(false)}>취소</Button>
                    <Button onClick={handleSaveAsTemplate} disabled={isSavingTemplate}>저장하기</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
            {existingQuestionGroups?.map((group: any) => {
              const displayGroup = group.displayJobGroup || group.jobGroup || 'all';
              const groupId = `${group.appraisalId}-${group.departmentId}-${displayGroup}`;
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
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            displayGroup === 'all' 
                              ? 'bg-gray-100 text-gray-600 border-gray-200' 
                              : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                            직군: {displayGroup === 'all' ? '전체' : displayGroup}
                          </span>
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
                                  group.jobGroup || 'all',
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
                        {group.questions.map((q: string, qIdx: number) => (
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
