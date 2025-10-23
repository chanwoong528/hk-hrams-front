import { useState } from "react";
import {
  Search,
  Plus,
  Eye,
  Star,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface Goal {
  id: string;
  description: string;
  appraisalTitle: string;
  targetUser: string;
  status: "pending" | "in-progress" | "completed";
  progress: number;
  grade: string | null;
  assessments: GoalAssessment[];
}

interface GoalAssessment {
  id: string;
  goalId: string;
  assessor: string;
  grade: string;
  comments: string;
  date: string;
}

export default function GoalManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAssessDialogOpen, setIsAssessDialogOpen] = useState(false);

  const [goals, setGoals] = useState<Goal[]>([
    {
      id: "1",
      description: "Q2 매출 목표 150% 달성",
      appraisalTitle: "2024년 상반기 성과평가",
      targetUser: "김민준",
      status: "completed",
      progress: 100,
      grade: "S",
      assessments: [
        {
          id: "1",
          goalId: "1",
          assessor: "이서연",
          grade: "S",
          comments: "목표를 초과 달성했습니다.",
          date: "2024-06-15",
        },
        {
          id: "2",
          goalId: "1",
          assessor: "박지훈",
          grade: "S",
          comments: "탁월한 성과입니다.",
          date: "2024-06-20",
        },
      ],
    },
    {
      id: "2",
      description: "신규 고객 20개사 확보",
      appraisalTitle: "2024년 상반기 성과평가",
      targetUser: "김민준",
      status: "completed",
      progress: 100,
      grade: "A",
      assessments: [
        {
          id: "3",
          goalId: "2",
          assessor: "이서연",
          grade: "A",
          comments: "목표를 달성했습니다.",
          date: "2024-06-16",
        },
      ],
    },
    {
      id: "3",
      description: "팀원 교육 프로그램 운영",
      appraisalTitle: "2024년 상반기 성과평가",
      targetUser: "김민준",
      status: "in-progress",
      progress: 75,
      grade: null,
      assessments: [],
    },
    {
      id: "4",
      description: "고객 만족도 95% 이상 유지",
      appraisalTitle: "2024년 하반기 성과평가",
      targetUser: "이서연",
      status: "in-progress",
      progress: 60,
      grade: null,
      assessments: [],
    },
    {
      id: "5",
      description: "신제품 개발 완료",
      appraisalTitle: "2024년 Q1 목표 평가",
      targetUser: "박지훈",
      status: "pending",
      progress: 30,
      grade: null,
      assessments: [],
    },
  ]);

  const [formData, setFormData] = useState({
    description: "",
    appraisalTitle: "",
    targetUser: "",
  });

  const [assessmentFormData, setAssessmentFormData] = useState({
    grade: "",
    comments: "",
  });

  const filteredGoals = goals.filter(
    (g) =>
      g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.targetUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.appraisalTitle.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in-progress":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "완료";
      case "in-progress":
        return "진행 중";
      case "pending":
        return "대기";
      default:
        return status;
    }
  };

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case "S":
        return "bg-green-100 text-green-700";
      case "A":
        return "bg-blue-100 text-blue-700";
      case "B":
        return "bg-orange-100 text-orange-700";
      case "C":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const handleAddGoal = () => {
    const newGoal: Goal = {
      id: String(goals.length + 1),
      description: formData.description,
      appraisalTitle: formData.appraisalTitle,
      targetUser: formData.targetUser,
      status: "pending",
      progress: 0,
      grade: null,
      assessments: [],
    };
    setGoals([...goals, newGoal]);
    setIsAddDialogOpen(false);
    setFormData({ description: "", appraisalTitle: "", targetUser: "" });
    toast.success("목표가 추가되었습니다");
  };

  const handleSubmitAssessment = () => {
    if (selectedGoal) {
      const newAssessment: GoalAssessment = {
        id: String(Date.now()),
        goalId: selectedGoal.id,
        assessor: "관리자",
        grade: assessmentFormData.grade,
        comments: assessmentFormData.comments,
        date: new Date().toISOString().split("T")[0],
      };

      setGoals(
        goals.map((g) =>
          g.id === selectedGoal.id
            ? {
                ...g,
                assessments: [...g.assessments, newAssessment],
                grade: assessmentFormData.grade,
              }
            : g,
        ),
      );

      setIsAssessDialogOpen(false);
      setAssessmentFormData({ grade: "", comments: "" });
      toast.success("평가가 제출되었습니다");
    }
  };

  // Calculate grade distribution
  const gradeDistribution = goals.reduce((acc, goal) => {
    if (goal.grade) {
      acc[goal.grade] = (acc[goal.grade] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className='p-4 lg:p-6 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row gap-4 justify-between'>
        <div>
          <h2 className='text-gray-900'>목표 관리</h2>
          <p className='text-gray-600 mt-1'>목표를 설정하고 평가합니다</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className='bg-blue-600 hover:bg-blue-700'>
              <Plus className='w-4 h-4 mr-2' />
              목표 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 목표 추가</DialogTitle>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label>목표 설명</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder='목표를 구체적으로 작성하세요'
                  rows={3}
                />
              </div>
              <div className='space-y-2'>
                <Label>연결된 평가</Label>
                <Select
                  value={formData.appraisalTitle}
                  onValueChange={(value) =>
                    setFormData({ ...formData, appraisalTitle: value })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder='평가 선택' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='2024년 상반기 성과평가'>
                      2024년 상반기 성과평가
                    </SelectItem>
                    <SelectItem value='2024년 하반기 성과평가'>
                      2024년 하반기 성과평가
                    </SelectItem>
                    <SelectItem value='2024년 Q1 목표 평가'>
                      2024년 Q1 목표 평가
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>대상자</Label>
                <Select
                  value={formData.targetUser}
                  onValueChange={(value) =>
                    setFormData({ ...formData, targetUser: value })
                  }>
                  <SelectTrigger>
                    <SelectValue placeholder='대상자 선택' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='김민준'>김민준</SelectItem>
                    <SelectItem value='이서연'>이서연</SelectItem>
                    <SelectItem value='박지훈'>박지훈</SelectItem>
                    <SelectItem value='최유진'>최유진</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                onClick={() => setIsAddDialogOpen(false)}>
                취소
              </Button>
              <Button
                className='bg-blue-600 hover:bg-blue-700'
                onClick={handleAddGoal}>
                추가
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>전체 목표</p>
                <h3 className='mt-2'>{goals.length}개</h3>
              </div>
              <Star className='w-8 h-8 text-blue-600' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>완료</p>
                <h3 className='mt-2'>
                  {goals.filter((g) => g.status === "completed").length}개
                </h3>
              </div>
              <TrendingUp className='w-8 h-8 text-green-600' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>진행 중</p>
                <h3 className='mt-2'>
                  {goals.filter((g) => g.status === "in-progress").length}개
                </h3>
              </div>
              <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center'>
                <div className='w-4 h-4 bg-blue-600 rounded-full animate-pulse' />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>평가 완료</p>
                <h3 className='mt-2'>
                  {goals.filter((g) => g.grade !== null).length}개
                </h3>
              </div>
              <MessageSquare className='w-8 h-8 text-orange-600' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className='p-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
            <Input
              placeholder='목표, 대상자, 평가 제목으로 검색...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9'
            />
          </div>
        </CardContent>
      </Card>

      {/* Goals List */}
      <Card>
        <CardHeader>
          <CardTitle>목표 목록 ({filteredGoals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {filteredGoals.map((goal) => (
              <Card key={goal.id} className='hover:shadow-md transition-shadow'>
                <CardContent className='p-4'>
                  <div className='flex flex-col lg:flex-row gap-4'>
                    <div className='flex-1 space-y-3'>
                      <div className='flex items-start justify-between gap-4'>
                        <div className='flex-1'>
                          <p className='text-gray-900'>{goal.description}</p>
                          <div className='flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600'>
                            <span>{goal.appraisalTitle}</span>
                            <span>·</span>
                            <span>{goal.targetUser}</span>
                          </div>
                        </div>
                        <div className='flex items-center gap-2 flex-shrink-0'>
                          <Badge className={getStatusColor(goal.status)}>
                            {getStatusText(goal.status)}
                          </Badge>
                          {goal.grade && (
                            <Badge className={getGradeBadgeColor(goal.grade)}>
                              {goal.grade}등급
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className='space-y-2'>
                        <div className='flex justify-between text-sm'>
                          <span className='text-gray-600'>진행률</span>
                          <span className='text-gray-900'>
                            {goal.progress}%
                          </span>
                        </div>
                        <Progress value={goal.progress} className='h-2' />
                      </div>

                      {goal.assessments.length > 0 && (
                        <div className='flex items-center gap-2 text-sm text-gray-600'>
                          <MessageSquare className='w-4 h-4' />
                          <span>평가 {goal.assessments.length}건</span>
                        </div>
                      )}
                    </div>

                    <div className='flex lg:flex-col gap-2 flex-shrink-0'>
                      <Button
                        variant='outline'
                        className='flex-1 lg:flex-none'
                        onClick={() => {
                          setSelectedGoal(goal);
                          setIsDetailOpen(true);
                        }}>
                        <Eye className='w-4 h-4 mr-2' />
                        상세보기
                      </Button>
                      <Button
                        className='flex-1 lg:flex-none bg-blue-600 hover:bg-blue-700'
                        onClick={() => {
                          setSelectedGoal(goal);
                          setIsAssessDialogOpen(true);
                        }}>
                        <Star className='w-4 h-4 mr-2' />
                        평가하기
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goal Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>목표 상세</DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <Tabs defaultValue='info' className='w-full'>
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value='info'>기본 정보</TabsTrigger>
                <TabsTrigger value='assessments'>
                  평가 내역 ({selectedGoal.assessments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value='info' className='space-y-4'>
                <div className='space-y-3'>
                  <div>
                    <Label>목표 설명</Label>
                    <p className='mt-1'>{selectedGoal.description}</p>
                  </div>
                  <div>
                    <Label>연결된 평가</Label>
                    <p className='mt-1'>{selectedGoal.appraisalTitle}</p>
                  </div>
                  <div>
                    <Label>대상자</Label>
                    <p className='mt-1'>{selectedGoal.targetUser}</p>
                  </div>
                  <div>
                    <Label>상태</Label>
                    <div className='mt-1'>
                      <Badge className={getStatusColor(selectedGoal.status)}>
                        {getStatusText(selectedGoal.status)}
                      </Badge>
                    </div>
                  </div>
                  {selectedGoal.grade && (
                    <div>
                      <Label>최종 등급</Label>
                      <div className='mt-1'>
                        <Badge
                          className={getGradeBadgeColor(selectedGoal.grade)}>
                          {selectedGoal.grade}등급
                        </Badge>
                      </div>
                    </div>
                  )}
                  <div>
                    <Label>진행률</Label>
                    <div className='mt-2 space-y-2'>
                      <Progress value={selectedGoal.progress} className='h-2' />
                      <p className='text-sm text-gray-600'>
                        {selectedGoal.progress}% 완료
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='assessments' className='space-y-4'>
                {selectedGoal.assessments.length === 0 ? (
                  <p className='text-center text-gray-500 py-8'>
                    평가 내역이 없습니다
                  </p>
                ) : (
                  <div className='space-y-3'>
                    {selectedGoal.assessments.map((assessment) => (
                      <Card key={assessment.id}>
                        <CardContent className='p-4 space-y-3'>
                          <div className='flex items-start justify-between'>
                            <div>
                              <p className='text-gray-900'>
                                {assessment.assessor}
                              </p>
                              <p className='text-sm text-gray-600 mt-1'>
                                {assessment.date}
                              </p>
                            </div>
                            <Badge
                              className={getGradeBadgeColor(assessment.grade)}>
                              {assessment.grade}등급
                            </Badge>
                          </div>
                          <div>
                            <Label>평가 의견</Label>
                            <p className='mt-1 text-gray-600'>
                              {assessment.comments}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Assessment Dialog */}
      <Dialog open={isAssessDialogOpen} onOpenChange={setIsAssessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>목표 평가</DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <div className='space-y-4 py-4'>
              <div className='p-4 bg-gray-50 rounded-lg'>
                <Label>목표</Label>
                <p className='mt-1'>{selectedGoal.description}</p>
              </div>
              <div className='space-y-2'>
                <Label>등급 선택</Label>
                <RadioGroup
                  value={assessmentFormData.grade}
                  onValueChange={(value) =>
                    setAssessmentFormData({
                      ...assessmentFormData,
                      grade: value,
                    })
                  }>
                  <div className='space-y-2'>
                    <div className='flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer'>
                      <RadioGroupItem value='S' id='grade-s' />
                      <Label
                        htmlFor='grade-s'
                        className='flex-1 cursor-pointer'>
                        <div className='flex items-center justify-between'>
                          <span>S등급</span>
                          <Badge className='bg-green-100 text-green-700'>
                            탁월
                          </Badge>
                        </div>
                        <p className='text-sm text-gray-600 mt-1'>
                          목표를 크게 초과 달성
                        </p>
                      </Label>
                    </div>
                    <div className='flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer'>
                      <RadioGroupItem value='A' id='grade-a' />
                      <Label
                        htmlFor='grade-a'
                        className='flex-1 cursor-pointer'>
                        <div className='flex items-center justify-between'>
                          <span>A등급</span>
                          <Badge className='bg-blue-100 text-blue-700'>
                            우수
                          </Badge>
                        </div>
                        <p className='text-sm text-gray-600 mt-1'>
                          목표를 달성
                        </p>
                      </Label>
                    </div>
                    <div className='flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer'>
                      <RadioGroupItem value='B' id='grade-b' />
                      <Label
                        htmlFor='grade-b'
                        className='flex-1 cursor-pointer'>
                        <div className='flex items-center justify-between'>
                          <span>B등급</span>
                          <Badge className='bg-orange-100 text-orange-700'>
                            보통
                          </Badge>
                        </div>
                        <p className='text-sm text-gray-600 mt-1'>
                          목표를 부분적으로 달성
                        </p>
                      </Label>
                    </div>
                    <div className='flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer'>
                      <RadioGroupItem value='C' id='grade-c' />
                      <Label
                        htmlFor='grade-c'
                        className='flex-1 cursor-pointer'>
                        <div className='flex items-center justify-between'>
                          <span>C등급</span>
                          <Badge className='bg-red-100 text-red-700'>
                            미흡
                          </Badge>
                        </div>
                        <p className='text-sm text-gray-600 mt-1'>
                          목표 달성 미흡
                        </p>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              <div className='space-y-2'>
                <Label>평가 의견</Label>
                <Textarea
                  value={assessmentFormData.comments}
                  onChange={(e) =>
                    setAssessmentFormData({
                      ...assessmentFormData,
                      comments: e.target.value,
                    })
                  }
                  placeholder='평가에 대한 의견을 작성하세요'
                  rows={4}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsAssessDialogOpen(false)}>
              취소
            </Button>
            <Button
              className='bg-blue-600 hover:bg-blue-700'
              onClick={handleSubmitAssessment}>
              평가 제출
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
