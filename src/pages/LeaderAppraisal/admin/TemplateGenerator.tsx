import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import {
  POST_createTemplate,
  PUT_updateTemplate,
  GET_template,
} from "@/api/leader-review/leader-review";
import type { LeaderReviewQuestion } from "@/api/leader-review/leader-review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";

export default function TemplateGenerator() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { templateId } = useParams();
  const isEditMode = !!templateId;

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<LeaderReviewQuestion[]>([]);

  // Fetch Logic for Edit Mode
  const { data: existingTemplate, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => GET_template(templateId!),
    enabled: isEditMode,
  });

  // Populate form on data fetch
  useEffect(() => {
    if (existingTemplate) {
      setTitle(existingTemplate.title);
      setDescription(existingTemplate.description || "");
      if (existingTemplate.questions) {
        setQuestions([...existingTemplate.questions.sort((a, b) => (a.order || 0) - (b.order || 0))]);
      }
    }
  }, [existingTemplate]);

  // Mutations
  const { mutate: createTemplate } = useMutation({
    mutationFn: POST_createTemplate,
    onSuccess: () => {
      toast.success("템플릿이 성공적으로 생성되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      navigate("/leader-appraisal/templates");
    },
    onError: () => {
      toast.error("템플릿 생성 실패");
    },
  });

  const { mutate: updateTemplate } = useMutation({
    mutationFn: (payload: any) => PUT_updateTemplate(templateId!, payload),
    onSuccess: () => {
      toast.success("템플릿이 성공적으로 수정되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["templates"] });
      queryClient.invalidateQueries({ queryKey: ["template", templateId] });
      navigate("/leader-appraisal/templates");
    },
    onError: () => {
      toast.error("템플릿 수정 실패");
    },
  });

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: "",
        questionType: "LIKERT_5",
        order: questions.length,
      },
    ]);
  };

  const handleQuestionChange = (
    index: number,
    field: keyof LeaderReviewQuestion,
    value: any
  ) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], [field]: value };
    setQuestions(newQuestions);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!title) {
      toast.error("템플릿 제목을 입력해주세요.");
      return;
    }
    if (questions.some((q) => !q.questionText)) {
      toast.error("모든 문항의 내용을 입력해주세요.");
      return;
    }

    const payload = {
      title,
      description,
      questions: questions.map((q, idx) => ({ ...q, order: idx })),
    };

    if (isEditMode) {
      updateTemplate(payload);
    } else {
      createTemplate(payload);
    }
  };

  if (isEditMode && isLoadingTemplate) {
    return <div>Loading template...</div>;
  }

  return (
    <div className='p-6 space-y-6 max-w-4xl mx-auto pb-24'>
      <div className="flex items-center mb-6">
        <Button variant="ghost" className="mr-4" onClick={() => navigate("/leader-appraisal/templates")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> 목록으로
        </Button>
        <h1 className='text-3xl font-bold tracking-tight'>
          {isEditMode ? "리더 평가 템플릿 수정" : "리더 평가 템플릿 생성기"}
        </h1>
      </div>

      {/* Template Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>1. 템플릿 기본 정보</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='title'>템플릿 제목 *</Label>
            <Input
              id='title'
              placeholder='예: 2024년 상반기 리더십 역량 평가'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>설명</Label>
            <Textarea
              id='description'
              placeholder='평가의 목적이나 지침을 입력하세요'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Question Builder Section */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between'>
          <CardTitle>2. 평가 문항 구성</CardTitle>
          <Button onClick={handleAddQuestion} variant='outline' size='sm'>
            <Plus className='w-4 h-4 mr-2' /> 문항 추가
          </Button>
        </CardHeader>
        <CardContent className='space-y-6'>
          {questions.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground bg-slate-50 rounded-lg border border-dashed'>
              문항이 없습니다. '문항 추가' 버튼을 눌러 시작하세요.
            </div>
          ) : (
            questions.map((q, index) => (
              <div
                key={index}
                className='p-4 border rounded-lg bg-card text-card-foreground shadow-sm relative group'
              >
                <div className='absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity'>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='text-destructive hover:text-destructive/90 hover:bg-destructive/10'
                    onClick={() => handleRemoveQuestion(index)}
                  >
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </div>

                <div className='space-y-4 mr-8'>
                  <div className='flex gap-4'>
                    <div className='flex-1 space-y-2'>
                      <Label>문항 번호 {index + 1}</Label>
                      <Input
                        placeholder='질문 내용을 입력하세요'
                        value={q.questionText}
                        onChange={(e) =>
                          handleQuestionChange(index, "questionText", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className='flex gap-4'>
                    <div className='w-1/3 space-y-2'>
                      <Label>답변 유형</Label>
                      <Select
                        value={q.questionType}
                        onValueChange={(value) =>
                          handleQuestionChange(index, "questionType", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='LIKERT_5'>5점 척도</SelectItem>
                          <SelectItem value='TEXT'>서술형 (텍스트)</SelectItem>
                          <SelectItem value='YES_NO'>예/아니오</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className='flex justify-end'>
        <Button onClick={handleSubmit} size='lg' className='w-40'>
          <Save className='w-4 h-4 mr-2' /> 
          {isEditMode ? "수정 완료" : "템플릿 저장"}
        </Button>
      </div>
    </div>
  );
}
