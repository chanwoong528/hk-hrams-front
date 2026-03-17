import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  FileText,
  Save,
  ArrowLeft,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  GET_competencyTemplates,
  POST_createCompetencyTemplate,
  DELETE_competencyTemplate,
} from "@/api/competency/competency";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function CompetencyTemplateManagement() {
  const queryClient = useQueryClient();

  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobGroup, setJobGroup] = useState("");
  const [questions, setQuestions] = useState<string[]>([""]);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["competencyTemplates"],
    queryFn: GET_competencyTemplates,
  });

  const { mutate: saveTemplate, isPending: isSaving } = useMutation({
    mutationFn: (payload: { title: string; description?: string; jobGroup?: string; questions: string[] }) =>
      POST_createCompetencyTemplate(payload),
    onSuccess: () => {
      toast.success("템플릿이 저장되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["competencyTemplates"] });
      resetForm();
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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setJobGroup("");
    setQuestions([""]);
    setIsCreating(false);
  };

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
    if (!title.trim()) {
      toast.error("템플릿 제목을 입력해주세요.");
      return;
    }
    if (filledQuestions.length === 0) {
      toast.error("최소 1개 이상의 문항을 작성해주세요.");
      return;
    }
    saveTemplate({
      title,
      description,
      jobGroup,
      questions: filledQuestions,
    });
  };

  const filteredTemplates = templates?.filter((t) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.jobGroup?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='p-4 lg:p-6 space-y-6'>
      <div className='flex flex-col sm:flex-row gap-4 justify-between items-start'>
        <div>
          <h2 className='text-gray-900 font-bold text-2xl'>역량 평가 템플릿 관리</h2>
          <p className='text-gray-600 mt-1'>
            부서별, 직군별로 사용될 공통 역량 평가 문항들을 템플릿으로 관리하세요.
          </p>
        </div>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            새 템플릿 만들기
          </Button>
        )}
      </div>

      {isCreating ? (
        <Card className="border-blue-100 shadow-sm overflow-hidden">
          <CardHeader className="bg-blue-50/50 border-b border-blue-100 flex flex-row items-center justify-between py-4">
            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              템플릿 정보 입력
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              목록으로 돌아가기
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <Label className="font-semibold text-gray-700">템플릿 제목</Label>
                <Input
                  placeholder="예: 공통 업무 역량 (개발직군)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-gray-700">직군 (Job Group)</Label>
                <Input
                  placeholder="예: development, design, product 등"
                  value={jobGroup}
                  onChange={(e) => setJobGroup(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="font-semibold text-gray-700">설명 (선택)</Label>
                <Input
                  placeholder="이 템플릿이 어떤 평가에 사용되는지 설명을 적어주세요."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">평가 문항 작성</h3>
                <Button variant="outline" size="sm" onClick={handleAddQuestion} className="border-blue-200 text-blue-600 hover:bg-blue-50">
                  <Plus className="w-4 h-4 mr-2" />
                  문항 추가
                </Button>
              </div>
              <div className="space-y-4 max-w-4xl">
                {questions.map((q, idx) => (
                  <div key={idx} className="flex gap-3 items-start group">
                    <span className="w-8 pt-2.5 font-bold text-gray-400 text-center">{idx + 1}</span>
                    <Input
                      placeholder="평가 문항을 입력하세요"
                      value={q}
                      onChange={(e) => handleChangeQuestion(idx, e.target.value)}
                      className="min-h-[44px]"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveQuestion(idx)}
                      disabled={questions.length === 1}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-10 pt-6 border-t">
              <Button variant="outline" onClick={resetForm}>취소</Button>
              <Button onClick={handleSubmit} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 px-8">
                <Save className="w-4 h-4 mr-2" />
                템플릿 저장하기
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="shadow-sm border-gray-100">
            <CardContent className="py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="템플릿 제목, 설명, 직군으로 검색..."
                  className="pl-10 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="text-center py-20 text-gray-400">데이터를 불러오고 있습니다...</div>
          ) : filteredTemplates?.length === 0 ? (
            <Card className="border-dashed h-64 flex flex-col items-center justify-center text-gray-400">
              <FileText className="w-12 h-12 mb-4 opacity-20" />
              <p>등록된 템플릿이 없습니다.</p>
              {searchTerm && <p className="text-sm mt-1">검색어를 확인해주세요.</p>}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTemplates?.map((t) => (
                <Card key={t.templateId} className="hover:shadow-md transition-shadow group border-gray-200 overflow-hidden flex flex-col">
                  <CardHeader className="pb-3 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="min-w-0">
                        <CardTitle className="text-lg font-bold text-gray-800 truncate">{t.title}</CardTitle>
                        {t.jobGroup && (
                          <span className="inline-block mt-1 text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                            {t.jobGroup}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 shrink-0"
                        onClick={() => {
                          if (confirm("정말 이 템플릿을 삭제하시겠습니까?")) {
                            deleteTemplate(t.templateId);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 flex-1 flex flex-col">
                    {t.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-10 italic">
                        "{t.description}"
                      </p>
                    )}
                    <div className="flex-1">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">평가 문항 ({t.questions.length})</h4>
                      <ul className="space-y-2">
                        {t.questions.slice(0, 3).map((q, qIdx) => (
                          <li key={q.questionId} className="text-sm text-gray-700 flex gap-2 min-w-0">
                            <span className="text-blue-500 font-bold shrink-0">{qIdx + 1}.</span>
                            <span className="truncate">{q.question}</span>
                          </li>
                        ))}
                        {t.questions.length > 3 && (
                          <li className="text-xs text-gray-400 pl-6">외 {t.questions.length - 3}개의 문항 더보기...</li>
                        )}
                      </ul>
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                      <span>작성자: {t.creator.koreanName}</span>
                      <span>{format(new Date(t.created), "yyyy.MM.dd", { locale: ko })}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
