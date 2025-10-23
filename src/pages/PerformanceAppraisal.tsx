import { useState } from "react";
import { Search, Plus, Eye, Edit, Calendar, User, Target } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

interface Appraisal {
  id: string;
  title: string;
  targetUser: string;
  description: string;
  status: "draft" | "in-progress" | "completed";
  dueDate: string;
  progress: number;
  goalCount: number;
  assessmentCount: number;
}

interface Goal {
  id: string;
  appraisalId: string;
  description: string;
  grade: string | null;
  assessedBy: string[];
}

interface Assessment {
  id: string;
  appraisalId: string;
  type: "performance" | "competency";
  term: "mid" | "final";
  grade: string;
  comments: string;
  assessor: string;
  date: string;
}

export default function PerformanceAppraisal() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [appraisals, setAppraisals] = useState<Appraisal[]>([
    {
      id: "1",
      title: "2024년 상반기 성과평가",
      targetUser: "김민준",
      description: "2024년 1월 ~ 6월 성과 평가",
      status: "completed",
      dueDate: "2024-06-30",
      progress: 100,
      goalCount: 5,
      assessmentCount: 2,
    },
    {
      id: "2",
      title: "2024년 하반기 성과평가",
      targetUser: "이서연",
      description: "2024년 7월 ~ 12월 성과 평가",
      status: "in-progress",
      dueDate: "2024-12-31",
      progress: 60,
      goalCount: 4,
      assessmentCount: 1,
    },
    {
      id: "3",
      title: "2024년 Q1 목표 평가",
      targetUser: "박지훈",
      description: "1분기 목표 달성도 평가",
      status: "in-progress",
      dueDate: "2024-03-31",
      progress: 75,
      goalCount: 3,
      assessmentCount: 1,
    },
    {
      id: "4",
      title: "2024년 연간 종합평가",
      targetUser: "최유진",
      description: "연간 종합 성과 평가",
      status: "draft",
      dueDate: "2024-12-31",
      progress: 25,
      goalCount: 6,
      assessmentCount: 0,
    },
  ]);

  const [goals] = useState<Goal[]>([
    {
      id: "1",
      appraisalId: "1",
      description: "Q2 매출 목표 150% 달성",
      grade: "S",
      assessedBy: ["이서연", "박지훈"],
    },
    {
      id: "2",
      appraisalId: "1",
      description: "신규 고객 20개사 확보",
      grade: "A",
      assessedBy: ["이서연"],
    },
    {
      id: "3",
      appraisalId: "1",
      description: "팀원 교육 프로그램 운영",
      grade: "A",
      assessedBy: ["박지훈"],
    },
  ]);

  const [assessments] = useState<Assessment[]>([
    {
      id: "1",
      appraisalId: "1",
      type: "performance",
      term: "mid",
      grade: "A",
      comments: "목표 달성도가 우수하며, 적극적인 업무 태도를 보여주었습니다.",
      assessor: "이서연",
      date: "2024-03-15",
    },
    {
      id: "2",
      appraisalId: "1",
      type: "competency",
      term: "final",
      grade: "S",
      comments: "탁월한 리더십과 문제 해결 능력을 발휘했습니다.",
      assessor: "박지훈",
      date: "2024-06-20",
    },
  ]);

  const [formData, setFormData] = useState({
    title: "",
    targetUser: "",
    description: "",
    dueDate: "",
  });

  const filteredAppraisals = appraisals.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.targetUser.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "in-progress":
        return "bg-blue-100 text-blue-700";
      case "draft":
        return "bg-gray-100 text-gray-700";
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
      case "draft":
        return "임시저장";
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

  const handleAddAppraisal = () => {
    const newAppraisal: Appraisal = {
      id: String(appraisals.length + 1),
      title: formData.title,
      targetUser: formData.targetUser,
      description: formData.description,
      status: "draft",
      dueDate: formData.dueDate,
      progress: 0,
      goalCount: 0,
      assessmentCount: 0,
    };
    setAppraisals([...appraisals, newAppraisal]);
    setIsAddDialogOpen(false);
    setFormData({ title: "", targetUser: "", description: "", dueDate: "" });
    toast.success("평가가 생성되었습니다");
  };

  const selectedAppraisalGoals = selectedAppraisal
    ? goals.filter((g) => g.appraisalId === selectedAppraisal.id)
    : [];

  const selectedAppraisalAssessments = selectedAppraisal
    ? assessments.filter((a) => a.appraisalId === selectedAppraisal.id)
    : [];

  return (
    <div className='p-4 lg:p-6 space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row gap-4 justify-between'>
        <div>
          <h2 className='text-gray-900'>성과 평가</h2>
          <p className='text-gray-600 mt-1'>
            직원들의 성과를 평가하고 관리합니다
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className='bg-blue-600 hover:bg-blue-700'>
              <Plus className='w-4 h-4 mr-2' />
              평가 생성
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 성과 평가 생성</DialogTitle>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label>평가 제목</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder='예: 2024년 상반기 성과평가'
                />
              </div>
              <div className='space-y-2'>
                <Label>평가 대상자</Label>
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
                    <SelectItem value='정다은'>정다은</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>설명</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder='평가에 대한 설명을 입력하세요'
                  rows={3}
                />
              </div>
              <div className='space-y-2'>
                <Label>마감일</Label>
                <Input
                  type='date'
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                />
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
                onClick={handleAddAppraisal}>
                생성
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className='p-4'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
            <Input
              placeholder='제목 또는 평가 대상자로 검색...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className='pl-9'
            />
          </div>
        </CardContent>
      </Card>

      {/* Appraisals Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {filteredAppraisals.map((appraisal) => (
          <Card
            key={appraisal.id}
            className='hover:shadow-lg transition-shadow'>
            <CardHeader>
              <div className='flex items-start justify-between'>
                <CardTitle className='text-lg'>{appraisal.title}</CardTitle>
                <Badge className={getStatusColor(appraisal.status)}>
                  {getStatusText(appraisal.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <User className='w-4 h-4' />
                  <span>{appraisal.targetUser}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Calendar className='w-4 h-4' />
                  <span>마감: {appraisal.dueDate}</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Target className='w-4 h-4' />
                  <span>
                    목표 {appraisal.goalCount}개 · 평가{" "}
                    {appraisal.assessmentCount}건
                  </span>
                </div>
              </div>

              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-600'>진행률</span>
                  <span className='text-gray-900'>{appraisal.progress}%</span>
                </div>
                <Progress value={appraisal.progress} className='h-2' />
              </div>

              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  className='flex-1'
                  onClick={() => {
                    setSelectedAppraisal(appraisal);
                    setIsDetailOpen(true);
                  }}>
                  <Eye className='w-4 h-4 mr-2' />
                  상세보기
                </Button>
                <Button variant='outline' size='icon'>
                  <Edit className='w-4 h-4' />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Appraisal Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{selectedAppraisal?.title}</DialogTitle>
          </DialogHeader>
          {selectedAppraisal && (
            <Tabs defaultValue='overview' className='w-full'>
              <TabsList className='grid w-full grid-cols-3'>
                <TabsTrigger value='overview'>개요</TabsTrigger>
                <TabsTrigger value='goals'>
                  목표 ({selectedAppraisalGoals.length})
                </TabsTrigger>
                <TabsTrigger value='assessments'>
                  평가 ({selectedAppraisalAssessments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value='overview' className='space-y-4'>
                <div className='space-y-3'>
                  <div>
                    <Label>평가 대상자</Label>
                    <p className='mt-1'>{selectedAppraisal.targetUser}</p>
                  </div>
                  <div>
                    <Label>설명</Label>
                    <p className='mt-1 text-gray-600'>
                      {selectedAppraisal.description}
                    </p>
                  </div>
                  <div>
                    <Label>마감일</Label>
                    <p className='mt-1'>{selectedAppraisal.dueDate}</p>
                  </div>
                  <div>
                    <Label>상태</Label>
                    <div className='mt-1'>
                      <Badge
                        className={getStatusColor(selectedAppraisal.status)}>
                        {getStatusText(selectedAppraisal.status)}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label>진행률</Label>
                    <div className='mt-2 space-y-2'>
                      <Progress
                        value={selectedAppraisal.progress}
                        className='h-2'
                      />
                      <p className='text-sm text-gray-600'>
                        {selectedAppraisal.progress}% 완료
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value='goals' className='space-y-4'>
                {selectedAppraisalGoals.length === 0 ? (
                  <p className='text-center text-gray-500 py-8'>
                    등록된 목표가 없습니다
                  </p>
                ) : (
                  <div className='space-y-3'>
                    {selectedAppraisalGoals.map((goal) => (
                      <Card key={goal.id}>
                        <CardContent className='p-4'>
                          <div className='flex items-start justify-between gap-4'>
                            <div className='flex-1'>
                              <p className='text-gray-900'>
                                {goal.description}
                              </p>
                              <div className='flex items-center gap-2 mt-2 text-sm text-gray-600'>
                                <span>
                                  평가자: {goal.assessedBy.join(", ")}
                                </span>
                              </div>
                            </div>
                            {goal.grade && (
                              <Badge className={getGradeBadgeColor(goal.grade)}>
                                {goal.grade}등급
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value='assessments' className='space-y-4'>
                {selectedAppraisalAssessments.length === 0 ? (
                  <p className='text-center text-gray-500 py-8'>
                    등록된 평가가 없습니다
                  </p>
                ) : (
                  <div className='space-y-3'>
                    {selectedAppraisalAssessments.map((assessment) => (
                      <Card key={assessment.id}>
                        <CardContent className='p-4 space-y-3'>
                          <div className='flex items-start justify-between'>
                            <div>
                              <div className='flex items-center gap-2'>
                                <Badge variant='secondary'>
                                  {assessment.type === "performance"
                                    ? "성과평가"
                                    : "역량평가"}
                                </Badge>
                                <Badge variant='outline'>
                                  {assessment.term === "mid" ? "중간" : "최종"}
                                </Badge>
                              </div>
                              <p className='text-sm text-gray-600 mt-2'>
                                평가자: {assessment.assessor} ·{" "}
                                {assessment.date}
                              </p>
                            </div>
                            <Badge
                              className={getGradeBadgeColor(assessment.grade)}>
                              {assessment.grade}등급
                            </Badge>
                          </div>
                          <div>
                            <Label>의견</Label>
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
    </div>
  );
}
