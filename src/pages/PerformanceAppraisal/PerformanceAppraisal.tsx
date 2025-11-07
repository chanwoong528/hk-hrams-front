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
  Rocket,
  Check,
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

import { useNavigate } from "react-router";

// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import UserMultiSelect from "./widget/UserMultiSelect";
import {
  GET_appraisalsByDistinctType,
  PATCH_appraisal,
  POST_appraisal,
  POST_startAppraisal,
} from "@/api/appraisal/appraisal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@uidotdev/usehooks";
import { Progress } from "@/components/ui/progress";

interface AppraisalFormData {
  title: string;
  // excludedUsers: User[];
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
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 1500);

  const [modalType, setModalType] = useState<"add" | "user-select" | null>(
    null,
  );

  const [formData, setFormData] = useState<AppraisalFormData>({
    title: "",
    description: "",
    endDate: "",
    appraisalYear: new Date().getFullYear().toString(),
    appraisalType: APPRRAISAL_TYPES[0].value,
    appraisalTerm: APPRRAISAL_TERMS[0].value,
  });

  const [excludedUsers, setExcludedUsers] = useState<User[]>([]);
  const [patchFormData, setPatchFormData] = useState<{
    title?: string;
    description?: string;
    endDate?: string;
  }>({
    title: "",
    description: "",
    endDate: "",
  });

  const { data: appraisalTypes, isLoading: isLoadingAppraisalTypes } = useQuery(
    {
      queryKey: ["appraisalTypes", debouncedSearchQuery],
      queryFn: () => GET_appraisalsByDistinctType("", debouncedSearchQuery),
      select: (data) => {
        return data.data;
      },
    },
  );

  const { mutate: postAppraisal } = useMutation({
    mutationFn: (payload: AppraisalFormData) => POST_appraisal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appraisalTypes", debouncedSearchQuery],
      });
      toast.success("평가가 생성되었습니다");
    },
    onSettled: () => {
      setModalType(null);
      setFormData({
        title: "",
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

  const { mutate: patchAppraisal } = useMutation({
    mutationFn: (payload: {
      appraisalId: string;
      title?: string;
      description?: string;
      endDate?: string;
      status?: string;
    }) => PATCH_appraisal(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appraisalTypes", debouncedSearchQuery],
      });
      setPatchFormData({
        title: "",
        description: "",
        endDate: "",
      });
      toast.success("평가가 수정되었습니다");
    },
    onSettled: () => {
      setPatchFormData({
        title: "",
        description: "",
        endDate: "",
      });
      setModalType(null);
    },
    onError: () => {
      toast.error("평가 수정에 실패했습니다");
    },
  });
  const { mutate: postStartAppraisal } = useMutation({
    mutationFn: (payload: { appraisalId: string; excludedUsers: User[] }) =>
      POST_startAppraisal(payload),
    onSuccess: () => toast.success("평가가 시작되었습니다"),
    onSettled: () => {
      setExcludedUsers([]);
      setModalType(null);
    },
    onError: () => {
      toast.error("평가 시작에 실패했습니다");
    },
  });

  const handleStartAppraisal = (appraisalId: string) => {
    const confirm = window.confirm(
      "인사평가를 실행하시겠습니까? 제외 대상자: " + excludedUsers.length,
    );
    if (!confirm) {
      return;
    }
    if (
      Object.keys(patchFormData).some(
        (key) => patchFormData[key as keyof typeof patchFormData] !== "",
      )
    ) {
      handleEditAppraisal(appraisalId, "ongoing");
    }

    postStartAppraisal({ appraisalId, excludedUsers });
    patchAppraisal({ appraisalId, status: "ongoing" });
  };

  const handleEditAppraisal = (appraisalId: string, status?: string) => {
    patchAppraisal({ appraisalId, ...patchFormData, status });
  };

  const handleExcludedUsersChange = useCallback((value: User[]) => {
    setExcludedUsers(value);
  }, []);

  const handleAddAppraisal = () => {
    postAppraisal(formData);
  };

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
        <Dialog
          open={modalType === "add"}
          onOpenChange={(open) => setModalType(open ? "add" : null)}>
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

              {/* <div className='space-y-2'>
                <UserMultiSelect
                  value={formData.excludedUsers}
                  onChange={handleExcludedUsersChange}
                />
              </div> */}

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
              <Button variant='outline' onClick={() => setModalType(null)}>
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
          appraisalTypes?.map((appraisal: Appraisal) => (
            <Card
              key={appraisal.appraisalId}
              className='hover:shadow-lg transition-shadow'>
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <CardTitle className='text-lg flex items-center gap-2'>
                    {appraisal.title}
                  </CardTitle>
                  <Badge
                    variant={
                      appraisal.status === "ongoing" ? "default" : "secondary"
                    }
                    className={
                      appraisal.status !== "ongoing"
                        ? "bg-green-100 text-green-700 hover:bg-green-100"
                        : ""
                    }>
                    {appraisal.status !== "ongoing" ? "진행중" : "완료"}
                  </Badge>
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
                  {/* <div className='flex items-center gap-2 text-sm text-gray-600'>
                      <User className='w-4 h-4' />
                      <span>{appraisal.count}</span>
                    </div> */}
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
                <div className='flex flex-col gap-2 text-sm text-gray-600'>
                  <Progress
                    value={
                      (appraisal.submittedCount / appraisal.totalCount) * 100 ||
                      0
                    }
                  />
                  <p className='flex items-center gap-2'>
                    <User className='w-4 h-4' />
                    {appraisal.submittedCount} / {appraisal.totalCount}
                  </p>
                </div>

                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    className='flex-1'
                    onClick={() => {
                      navigate(
                        `/performance-appraisal/${appraisal.appraisalId}`,
                      );
                    }}>
                    <Eye className='w-4 h-4 mr-2' />
                    상세보기
                  </Button>

                  <Dialog
                    open={modalType === "user-select"}
                    onOpenChange={(open) =>
                      setModalType(open ? "user-select" : null)
                    }>
                    <DialogTrigger asChild>
                      {appraisal.status === "ongoing" ? (
                        <Button
                          variant='outline'
                          disabled
                          className='bg-green-600 hover:bg-green-700 text-white hover:text-white disabled:opacity-100 disabled:cursor-not-allowed'>
                          <Check className='w-4 h-4 mr-2' />
                          진행중
                        </Button>
                      ) : (
                        <Button
                          variant='outline'
                          className='bg-blue-600 hover:bg-blue-700 text-white hover:text-white'>
                          <Rocket className='w-4 h-4 mr-2' />
                          인사평가 실행
                        </Button>
                      )}
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>제외 대상자 선택</DialogTitle>
                      </DialogHeader>
                      <div className='space-y-2'>
                        <Label>{appraisal.title} 평가 실행</Label>
                      </div>
                      <div className='space-y-2'>
                        <Label>마감일</Label>
                        {/* <p>form: {patchFormData.endDate}</p>
                        <p>api: {appraisal.endDate}</p> */}
                        <Input
                          type='date'
                          value={
                            patchFormData.endDate ||
                            new Date(appraisal.endDate)
                              .toISOString()
                              .split("T")[0]
                          }
                          onChange={(e) => {
                            setPatchFormData({
                              ...patchFormData,
                              endDate: e.target.value,
                            });
                          }}
                        />
                      </div>
                      <UserMultiSelect
                        value={excludedUsers}
                        onChange={handleExcludedUsersChange}
                      />
                      <DialogFooter>
                        <Button
                          variant='outline'
                          onClick={() => setModalType(null)}>
                          취소
                        </Button>
                        <Button
                          variant='outline'
                          className='bg-blue-600 hover:bg-blue-700 text-white'
                          onClick={() =>
                            handleStartAppraisal(appraisal.appraisalId)
                          }>
                          인사평가 실행
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  );
}
