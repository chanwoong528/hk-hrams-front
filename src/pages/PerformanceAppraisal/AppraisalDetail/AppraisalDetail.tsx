import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";

import { useDebounce } from "@uidotdev/usehooks";

import { Search, UserPlus } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";

import {
  GET_appraisalDetail,
  GET_appraisalDetailByAppraisalId,
  PATCH_appraisal,
  POST_addAppraisalUsersToOngoing,
} from "@/api/appraisal/appraisal";
import { GET_usersByPagination } from "@/api/user/user";
import type { HramsUserType } from "@/api/user/user";
import { useCurrentUserStore } from "@/store/currentUserStore";
import { isHrOrAdminUser } from "@/lib/hrAccess";
import { toast } from "sonner";

import { DataTable } from "./widget/DataTable";
import { getColumns } from "./widget/Column";
import { TablePagination } from "./widget/TablePagination";

function getApiErrorMessage(error: unknown, fallback: string): string {
  const err = error as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const apiMessage = err?.response?.data?.message;
  if (Array.isArray(apiMessage)) {
    const first = apiMessage.find(
      (message): message is string =>
        typeof message === "string" && message.trim().length > 0,
    );
    if (first) return first.trim();
  }
  if (typeof apiMessage === "string" && apiMessage.trim()) {
    return apiMessage.trim();
  }
  if (typeof err?.message === "string" && err.message.trim()) {
    return err.message.trim();
  }
  return fallback;
}

function getAddAppraisalUsersCounts(res: unknown): {
  createdLen: number;
  skipped: number;
} {
  if (!res || typeof res !== "object") {
    return { createdLen: 0, skipped: 0 };
  }
  const envelope = res as {
    data?: { created?: unknown[]; skippedUserIds?: string[] };
    created?: unknown[];
    skippedUserIds?: string[];
  };
  const inner = envelope.data ?? envelope;
  return {
    createdLen: inner.created?.length ?? 0,
    skipped: inner.skippedUserIds?.length ?? 0,
  };
}

const WORKFLOW_PHASES = [
  { phase: 1, label: "팀장 역량 배포" },
  { phase: 2, label: "팀원 목표 작성·팀장 승인" },
  { phase: 3, label: "팀원 본인(중간)" },
  { phase: 4, label: "팀장·상위 평가(중간)" },
  { phase: 5, label: "팀원 본인(기말)" },
  { phase: 6, label: "팀장·상위 평가(기말)" },
] as const;

export default function AppraisalDetail() {
  const { appraisalId } = useParams();
  const queryClient = useQueryClient();
  const { currentUser } = useCurrentUserStore();
  const canAddParticipants = isHrOrAdminUser(
    currentUser?.email,
    currentUser?.departments,
  );

  const [addParticipantsOpen, setAddParticipantsOpen] = useState(false);
  const [addParticipantsDialogKey, setAddParticipantsDialogKey] = useState(0);
  const [usersToAdd, setUsersToAdd] = useState<HramsUserType[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 1500);

  const [pageInfo, setPageInfo] = useState<{ page: number; limit: number }>({
    page: 1,
    limit: 10,
  });

  const [sortInfo, setSortInfo] = useState<{
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }>({
    sortBy: undefined,
    sortOrder: undefined,
  });

  const handlePageChange = (page: number) => {
    setPageInfo((prev) => ({ ...prev, page }));
  };

  const handleSortChange = (sortBy: string, sortOrder: "asc" | "desc") => {
    setSortInfo({ sortBy, sortOrder });
    setPageInfo((prev) => ({ ...prev, page: 1 }));
  };

  const navigate = useNavigate();
  const columns = getColumns(
    {
      sortBy: sortInfo.sortBy,
      sortOrder: sortInfo.sortOrder,
      onSortChange: handleSortChange,
    },
    navigate,
  );

  const { data: appraisalDetail, isLoading: isLoadingAppraisalDetail } =
    useQuery({
      queryKey: [
        "appraisalDetail",
        appraisalId,
        debouncedSearchQuery,
        pageInfo.page,
        pageInfo.limit,
        sortInfo.sortBy,
        sortInfo.sortOrder,
      ],
      queryFn: () =>
        GET_appraisalDetailByAppraisalId(
          appraisalId as string,
          pageInfo.page,
          pageInfo.limit,
          debouncedSearchQuery,
          sortInfo.sortBy,
          sortInfo.sortOrder,
        ),
      select: (data) => data.data,
      enabled: !!appraisalId,
    });

  const { data: appraisalMeta } = useQuery({
    queryKey: ["appraisalMeta", appraisalId],
    queryFn: () => GET_appraisalDetail(appraisalId as string, 1, 1),
    select: (res) => res.data?.list?.[0] as { macroWorkflowPhase?: number } | undefined,
    enabled: !!appraisalId,
  });

  const macroPhase = (() => {
    const fromList = appraisalDetail?.list?.[0]?.appraisal as
      | { macroWorkflowPhase?: number }
      | undefined;
    const p = fromList?.macroWorkflowPhase ?? appraisalMeta?.macroWorkflowPhase;
    if (p == null || !Number.isFinite(Number(p))) return 1;
    return Math.min(6, Math.max(1, Math.floor(Number(p))));
  })();

  const { mutate: patchMacroPhase, isPending: isPatchingPhase } = useMutation({
    mutationFn: (next: number) =>
      PATCH_appraisal({
        appraisalId: appraisalId as string,
        macroWorkflowPhase: next,
      }),
    onSuccess: async () => {
      toast.success("워크플로 단계가 변경되었습니다.");
      await queryClient.invalidateQueries({ queryKey: ["appraisalDetail"] });
      await queryClient.invalidateQueries({ queryKey: ["appraisalMeta"] });
      await queryClient.invalidateQueries({ queryKey: ["appraisalTypes"] });
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "단계 변경에 실패했습니다."));
    },
  });

  const { data: allUsersList } = useQuery({
    queryKey: ["users", "appraisal-add-participants"],
    // 대상 추가 드롭다운은 전체 사용자 목록이 필요함 (기본 /user limit=10 회피)
    queryFn: () => GET_usersByPagination(1, 1000),
    select: (data) => (data.data?.list ?? []) as HramsUserType[],
    enabled: addParticipantsOpen && canAddParticipants,
  });

  const existingParticipantUserIds = useMemo(() => {
    const ids = new Set<string>();
    (appraisalDetail?.list ?? []).forEach((row: any) => {
      const id = row?.owner?.userId;
      if (typeof id === "string" && id) ids.add(id);
    });
    return ids;
  }, [appraisalDetail?.list]);

  const userMultiOptions = useMemo(
    () =>
      (allUsersList ?? [])
        .filter((u) => !existingParticipantUserIds.has(u.userId))
        .map((u) => ({
          value: u.userId,
          label: `${u.koreanName} · ${u.email}`,
        })),
    [allUsersList, existingParticipantUserIds],
  );

  const { mutate: addParticipants, isPending: isAddingParticipants } =
    useMutation({
      mutationFn: POST_addAppraisalUsersToOngoing,
      onSuccess: async (res) => {
        const { createdLen, skipped } = getAddAppraisalUsersCounts(res);
        toast.success(
          skipped
            ? `신규 ${createdLen}명 반영 · 이미 포함 ${skipped}명은 건너뜀`
            : `신규 ${createdLen}명을 평가 대상에 추가했습니다.`,
        );
        setAddParticipantsOpen(false);
        setUsersToAdd([]);
        setPageInfo((prev) => ({ ...prev, page: 1 }));

        await queryClient.invalidateQueries({ queryKey: ["appraisalDetail"] });
        if (appraisalId) {
          await queryClient.refetchQueries({
            queryKey: ["appraisalDetail", appraisalId],
          });
        }
        await queryClient.invalidateQueries({ queryKey: ["appraisalTypes"] });
        await queryClient.invalidateQueries({
          queryKey: ["teamMembersAppraisals"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["users", "appraisal-add-participants"],
        });
      },
      onError: () => {
        toast.error("대상자 추가에 실패했습니다.");
      },
    });

  if (isLoadingAppraisalDetail && !appraisalDetail)
    return <div>Loading...</div>;

  const handleRowClick = (appraisalUserId: string) => {
    console.log(" appraisalUserId>> ", appraisalUserId);
  };

  const macroPhaseDescription = (() => {
    switch (macroPhase) {
      case 1:
        return "1단계: 팀장 역량 배포";
      case 2:
        return "2단계: 팀원 목표 작성·팀장 승인";
      case 3:
        return "3단계: 팀원 본인(중간)";
      case 4:
        return "4단계: 팀장·상위 평가(중간)";
      case 5:
        return "5단계: 팀원 본인(기말)";
      case 6:
        return "6단계: 팀장·상위 평가(기말)";
      default:
        return "";
    }
  })();

  const handleSelectMacroPhase = (nextPhase: number) => {
    if (isPatchingPhase) return;
    if (nextPhase === macroPhase) return;
    const nextPhaseLabel =
      WORKFLOW_PHASES.find((workflowPhase) => workflowPhase.phase === nextPhase)
        ?.label ?? `${nextPhase}단계`;
    const shouldProceed = window.confirm(
      `워크플로를 ${nextPhase}단계(${nextPhaseLabel})로 변경할까요?`,
    );
    if (!shouldProceed) return;
    patchMacroPhase(nextPhase);
  };

  return (
    <div className='p-4 lg:p-6 space-y-6'>
      <div className='flex flex-col sm:flex-row gap-4 justify-between'>
        <div>
          <h2 className='text-gray-900'>성과 평가</h2>
          <p className='text-gray-600 mt-1'>
            직원들의 성과를 평가하고 관리합니다
          </p>
        </div>
        {canAddParticipants && appraisalId && (
          <div className='flex flex-col items-stretch sm:items-end gap-2 rounded-lg border bg-muted/30 px-3 py-2'>
            <p className='text-xs text-muted-foreground text-center sm:text-right'>
              HR 워크플로 단계
            </p>
            <div className='flex flex-wrap items-center gap-2 justify-center sm:justify-end'>
              {WORKFLOW_PHASES.map((workflowPhase) => {
                const isCurrentPhase = workflowPhase.phase === macroPhase;
                return (
                  <Button
                    key={workflowPhase.phase}
                    type='button'
                    variant={isCurrentPhase ? "default" : "outline"}
                    size='sm'
                    className='min-w-[44px]'
                    disabled={isPatchingPhase}
                    onClick={() => handleSelectMacroPhase(workflowPhase.phase)}
                    aria-label={`${workflowPhase.phase}단계 선택`}>
                    {workflowPhase.phase}
                  </Button>
                );
              })}
            </div>
            <p className='text-xs text-muted-foreground text-center sm:text-right max-w-xs'>
              {macroPhase} / 6 · {macroPhaseDescription}
            </p>
          </div>
        )}
      </div>

      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-col sm:flex-row gap-3'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <Input
                placeholder='이름, 이메일, 부서로 검색...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-9'
              />
            </div>
            {/* <Button variant='outline'>
              <Filter className='w-4 h-4 mr-2' />
              필터
            </Button> */}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>
              평가 대상자 목록 ({appraisalDetail?.total}명)
            </CardTitle>
            {canAddParticipants && appraisalId && (
              <Dialog
                open={addParticipantsOpen}
                onOpenChange={(open) => {
                  setAddParticipantsOpen(open);
                  if (open) {
                    setAddParticipantsDialogKey((k) => k + 1);
                  } else {
                    setUsersToAdd([]);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5"
                  >
                    <UserPlus className="h-4 w-4" aria-hidden />
                    진행 중 대상자 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>진행 중 평가에 대상 추가</DialogTitle>
                  </DialogHeader>
                  <p className="text-sm text-muted-foreground">
                    이미 이 평가에 포함된 사람은 자동으로 건너뜁니다. 공통 목표·역량
                    항목은 소속 부서 설정에 따라 리더/인사에서 별도 반영이 필요할 수
                    있습니다.
                  </p>
                  <div className="space-y-2 py-2">
                    <Label>추가할 직원</Label>
                    <MultiSelect
                      key={addParticipantsDialogKey}
                      defaultValue={[]}
                      modalPopover
                      searchable
                      options={userMultiOptions}
                      onValueChange={(ids) => {
                        setUsersToAdd(
                          ids
                            .map((id) =>
                              allUsersList?.find((u) => u.userId === id),
                            )
                            .filter(Boolean) as HramsUserType[],
                        );
                      }}
                      placeholder="이름으로 검색·선택"
                    />
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setAddParticipantsOpen(false)}
                    >
                      취소
                    </Button>
                    <Button
                      type="button"
                      disabled={
                        usersToAdd.length === 0 || isAddingParticipants
                      }
                      onClick={() => {
                        if (!appraisalId || usersToAdd.length === 0) return;
                        addParticipants({
                          appraisalId,
                          userIds: usersToAdd.map((u) => u.userId),
                        });
                      }}
                    >
                      {isAddingParticipants ? "추가 중…" : "추가"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            {/* Search and Filter */}

            <DataTable
              key={`${pageInfo.page}-${pageInfo.limit}-${debouncedSearchQuery}-${sortInfo.sortBy}-${sortInfo.sortOrder}`}
              columns={columns}
              data={appraisalDetail?.list ?? []}
              getRowId={(row) => row.appraisalUserId}
              onClickRow={handleRowClick}
            />

            <TablePagination
              total={appraisalDetail?.total ?? 0}
              page={pageInfo.page}
              limit={pageInfo.limit}
              onPageChange={handlePageChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
