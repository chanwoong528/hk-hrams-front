import { useState, useCallback } from "react";
import {
  Search,
  Plus,
  Eye,
  // Edit,
  Calendar,
  User,
  // Target,
  Code,
  Book,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

import { useNavigate } from "react-router";

// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import UserMultiSelect from "./widget/UserMultiSelect";
import {
  GET_appraisalsByDistinctType,
  POST_appraisal,
} from "@/api/appraisal/appraisal";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@uidotdev/usehooks";

interface AppraisalFormData {
  title: string;
  excludedUsers: User[];
  description: string;
  endDate: string;
  appraisalYear: string;
  appraisalType: string;
  appraisalTerm: string;
}

const APPRRAISAL_TYPES = [
  {
    value: "demo",
    label: "데모",
  },
  {
    value: "performance",
    label: "성과평가",
  },
  {
    value: "competency",
    label: "역량평가",
  },
];

const APPRRAISAL_TERMS = [
  {
    value: "mid",
    label: "중간",
  },
  {
    value: "final",
    label: "최종",
  },
];

export default function PerformanceAppraisal() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 1500);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState<AppraisalFormData>({
    title: "",
    excludedUsers: [],
    description: "",
    endDate: "",
    appraisalYear: new Date().getFullYear().toString(),
    appraisalType: APPRRAISAL_TYPES[0].value,
    appraisalTerm: APPRRAISAL_TERMS[0].value,
  });

  const { data: appraisalTypes, isLoading: isLoadingAppraisalTypes } = useQuery(
    {
      queryKey: ["appraisalTypes", debouncedSearchQuery],
      queryFn: () => GET_appraisalsByDistinctType(debouncedSearchQuery),
      select: (data) => {
        return data.data;
      },
    },
  );

  const { mutate: postAppraisal } = useMutation({
    mutationFn: (payload: AppraisalFormData) => POST_appraisal(payload),
    onSuccess: () => toast.success("평가가 생성되었습니다"),
    onSettled: () => {
      setIsAddDialogOpen(false);
      setFormData({
        title: "",
        excludedUsers: [],
        description: "",
        endDate: "",
        appraisalYear: new Date().getFullYear().toString(),
        appraisalType: APPRRAISAL_TYPES[0].value,
        appraisalTerm: APPRRAISAL_TERMS[0].value,
      });
    },

    onError: () => {
      toast.error("평가 생성에 실패했습니다");
    },
  });

  const handleExcludedUsersChange = useCallback((value: User[]) => {
    setFormData((prev) => ({
      ...prev,
      excludedUsers: value,
    }));
  }, []);

  // const filteredAppraisals = appraisals.filter(
  //   (a) =>
  //     a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     a.targetUser.toLowerCase().includes(searchQuery.toLowerCase()),
  // );

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case "completed":
  //       return "bg-green-100 text-green-700";
  //     case "in-progress":
  //       return "bg-blue-100 text-blue-700";
  //     case "draft":
  //       return "bg-gray-100 text-gray-700";
  //     default:
  //       return "bg-gray-100 text-gray-700";
  //   }
  // };

  // const getStatusText = (status: string) => {
  //   switch (status) {
  //     case "completed":
  //       return "완료";
  //     case "in-progress":
  //       return "진행 중";
  //     case "draft":
  //       return "임시저장";
  //     default:
  //       return status;
  //   }
  // };

  // const getGradeBadgeColor = (grade: string) => {
  //   switch (grade) {
  //     case "S":
  //       return "bg-green-100 text-green-700";
  //     case "A":
  //       return "bg-blue-100 text-blue-700";
  //     case "B":
  //       return "bg-orange-100 text-orange-700";
  //     case "C":
  //       return "bg-red-100 text-red-700";
  //     default:
  //       return "bg-gray-100 text-gray-700";
  //   }
  // };

  const handleAddAppraisal = () => {
    postAppraisal(formData);
  };

  console.log("@@@@@@@@@@@ ", appraisalTypes);
  if (isLoadingAppraisalTypes) return <div>Loading...</div>;

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
          <DialogContent onInteractOutside={(e) => e.preventDefault()}>
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
                <Label>평가 유형</Label>
                <div className='flex items-center gap-2'>
                  <Input
                    type='text'
                    value={formData.appraisalYear}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        appraisalType: e.target.value,
                      })
                    }
                    disabled
                  />
                  <Select
                    value={formData.appraisalType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, appraisalType: value })
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a type' />
                    </SelectTrigger>
                    <SelectContent>
                      {APPRRAISAL_TYPES.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              appraisalType: type.value,
                            })
                          }>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.appraisalTerm}
                    onValueChange={(value) =>
                      setFormData({ ...formData, appraisalTerm: value })
                    }>
                    <SelectTrigger>
                      <SelectValue placeholder='Select a type' />
                    </SelectTrigger>
                    <SelectContent>
                      {APPRRAISAL_TERMS.map((type) => (
                        <SelectItem
                          key={type.value}
                          value={type.value}
                          onClick={() =>
                            setFormData({
                              ...formData,
                              appraisalTerm: type.value,
                            })
                          }>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='space-y-2'>
                <UserMultiSelect
                  value={formData.excludedUsers}
                  onChange={handleExcludedUsersChange}
                />
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
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
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
        {appraisalTypes &&
          appraisalTypes?.map(
            (appraisal: {
              title: string;
              appraisalType: string;
              description: string;
              count: number;
              endDate: string;
            }) => (
              <Card
                key={appraisal.appraisalType}
                className='hover:shadow-lg transition-shadow'>
                <CardHeader>
                  <div className='flex items-start justify-between'>
                    <CardTitle className='text-lg'>{appraisal.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <Code className='w-4 h-4' />
                      <span>{appraisal.appraisalType}</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <Book className='w-4 h-4' />
                      <span>{appraisal.description}</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <User className='w-4 h-4' />
                      <span>{appraisal.count}</span>
                    </div>
                    <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <Calendar className='w-4 h-4' />
                      <span>
                        마감:
                        {Intl.DateTimeFormat("ko-KR").format(
                          new Date(appraisal.endDate),
                        )}
                      </span>
                    </div>
                  </div>

                  <div className='flex gap-2'>
                    <Button
                      variant='outline'
                      className='flex-1'
                      onClick={() => {
                        navigate(
                          `/performance-appraisal/${appraisal.appraisalType}`,
                        );
                      }}>
                      <Eye className='w-4 h-4 mr-2' />
                      상세보기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ),
          )}
      </div>
    </div>
  );
}
