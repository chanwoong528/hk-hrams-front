import type { ColumnDef } from "@tanstack/react-table";
import type { Appraisal, User } from "@/pages/GoalManagement/type";
import type { Department } from "@/api/user/user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// const columns: ColumnDef<AppraisalTarget>[] = [
//   {
//     accessorKey: "targetUser",
//     header: ({ column }) => {
//       return (
//         <Button
//           variant='ghost'
//           onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
//           대상자
//           <ArrowUpDown className='ml-2 h-4 w-4' />
//         </Button>
//       );
//     },
//     cell: ({ row }) => (
//       <div className='flex items-center gap-2'>
//         <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600'>
//           {row.original.targetUser.charAt(0)}
//         </div>
//         <span className='text-gray-900'>{row.original.targetUser}</span>
//       </div>
//     ),
//   },
//   {
//     accessorKey: "department",
//     header: "부서",
//     cell: ({ row }) => (
//       <Badge variant='secondary'>{row.original.department}</Badge>
//     ),
//   },
//   {
//     accessorKey: "assessor",
//     header: "평가자",
//     cell: ({ row }) => (
//       <span className='text-gray-600'>{row.original.assessor}</span>
//     ),
//   },
//   {
//     accessorKey: "status",
//     header: "상태",
//     cell: ({ row }) => (
//       <Badge className={getStatusColor(row.original.status)}>
//         {getStatusText(row.original.status)}
//       </Badge>
//     ),
//   },
//   {
//     accessorKey: "progress",
//     header: "진행률",
//     cell: ({ row }) => (
//       <div className='space-y-1 min-w-[120px]'>
//         <div className='flex justify-between text-sm'>
//           <span className='text-gray-900'>{row.original.progress}%</span>
//         </div>
//         <Progress value={row.original.progress} className='h-2' />
//       </div>
//     ),
//   },
//   {
//     accessorKey: "completedGoals",
//     header: "목표 달성",
//     cell: ({ row }) => (
//       <span className='text-gray-600'>
//         {row.original.completedGoals} / {row.original.goalCount}
//       </span>
//     ),
//   },
//   {
//     accessorKey: "lastUpdated",
//     header: "최종 업데이트",
//     cell: ({ row }) => (
//       <span className='text-gray-600'>{row.original.lastUpdated}</span>
//     ),
//   },
//   {
//     id: "actions",
//     header: "작업",
//     cell: ({ row }) => (
//       <Button
//         variant='outline'
//         size='sm'
//         onClick={() => {
//           setSelectedTarget(row.original);
//           setIsDetailOpen(true);
//         }}>
//         <Eye className='w-4 h-4 mr-2' />
//         상세
//       </Button>
//     ),
//   },
// ];

interface DetailColumn {
  appraisalUserId: string;
  endDate: string;
  status: string;
  appraisal: Appraisal;
  owner: User;
  departments: Department[];
  competencyTotal: number;
  competencySubmitted: number;
  perfMidSelfDone?: boolean;
  perfFinalSelfDone?: boolean;
  perfMidLeaderDone?: boolean;
  perfFinalLeaderDone?: boolean;
  compFinalMidSelfDone?: boolean;
  compFinalFinalSelfDone?: boolean;
  compFinalMidLeaderDone?: boolean;
  compFinalFinalLeaderDone?: boolean;
}

const GOAL_APPROVAL_ASSESS_TERM = "goal_approval";

function getGoalSummary(owner?: User): {
  totalGoals: number;
  commonGoals: number;
  personalGoals: number;
  approvedCount: number;
  rejectedCount: number;
} {
  const goals = owner?.goals ?? [];
  const totalGoals = goals.length;

  let commonGoals = 0;
  let personalGoals = 0;
  let approvedCount = 0;
  let rejectedCount = 0;

  goals.forEach((goal) => {
    const isCommonGoal =
      String(goal.goalType ?? "")
        .trim()
        .toLowerCase() === "common";

    if (isCommonGoal) {
      commonGoals += 1;
      return;
    }
    personalGoals += 1;

    const currentVersion = Math.floor(Number(goal.approvalVersion ?? 1)) || 1;
    const currentApprovalRow = (goal.goalAssessmentBy ?? []).find((assessment) => {
      const isGoalApproval =
        String(assessment.assessTerm ?? "")
          .trim()
          .toLowerCase() === GOAL_APPROVAL_ASSESS_TERM;
      const isCurrentVersion =
        Number(assessment.targetApprovalVersion ?? -1) === currentVersion;
      return isGoalApproval && isCurrentVersion;
    });

    const grade = String(currentApprovalRow?.grade ?? "")
      .trim()
      .toUpperCase();
    if (grade === "T") approvedCount += 1;
    if (grade === "F") rejectedCount += 1;
  });

  return {
    totalGoals,
    commonGoals,
    personalGoals,
    approvedCount,
    rejectedCount,
  };
}

function resolveGoalOwner(row: DetailColumn): User | undefined {
  const rowOwner = row.owner;
  if (!rowOwner) return undefined;

  if ((rowOwner.goals ?? []).length > 0) return rowOwner;

  const appraisalUsers = row.appraisal?.user ?? [];
  const matchedByAppraisalUserId = appraisalUsers.find(
    (user) =>
      user.appraisalUserId &&
      rowOwner.appraisalUserId &&
      user.appraisalUserId === rowOwner.appraisalUserId,
  );
  if (matchedByAppraisalUserId) return matchedByAppraisalUserId;

  const matchedByUserId = appraisalUsers.find(
    (user) => user.userId === rowOwner.userId,
  );
  return matchedByUserId ?? rowOwner;
}

function workflowDoneBadge(done?: boolean) {
  if (done === true) {
    return (
      <Badge
        variant='outline'
        className='text-xs whitespace-nowrap border-green-300 text-green-700 bg-green-50 hover:bg-green-50'>
        완료
      </Badge>
    );
  }
  return (
    <Badge variant='secondary' className='text-xs whitespace-nowrap'>
      미완료
    </Badge>
  );
}

export type SortConfig = {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
};

export const getColumns = (
  sortConfig: SortConfig,
  navigate?: (path: string) => void,
): ColumnDef<DetailColumn>[] => [
  {
    id: "appraisalUserId",
    accessorKey: "appraisalUserId",
  },
  {
    accessorKey: "owner",
    id: "owner",
    header: () => (
      <Button
        variant='ghost'
        onClick={() => {
          const newOrder =
            sortConfig.sortBy === "owner" && sortConfig.sortOrder === "asc"
              ? "desc"
              : "asc";
          sortConfig.onSortChange("owner", newOrder);
        }}>
        대상자
        <ArrowUpDown
          className={`ml-2 h-4 w-4 ${
            sortConfig.sortBy === "owner" ? "text-primary" : "text-gray-400"
          }`}
        />
      </Button>
    ),
    cell: ({ row }) => {
      return (
        <div className='flex items-center gap-2 pl-2'>
          <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600'>
            {(row.getValue("owner") as User)?.koreanName.charAt(0)}
          </div>
          <span className='text-gray-900 text-center'>
            {(row.getValue("owner") as User)?.koreanName}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "departments",
    header: () => <p className='text-center'>Department</p>,
    cell: ({ row }) => {
      return (
        <div className='text-center font-medium flex gap-2 justify-center'>
          {(row.getValue("departments") as Department[])?.length > 0 ? (
            (row.getValue("departments") as Department[])?.map(
              (department: Department) => (
                <Badge key={department.departmentId}>
                  {department.departmentName}
                </Badge>
              ),
            )
          ) : (
            <span className='text-gray-400'>No departments</span>
          )}
        </div>
      );
    },
  },
  // {
  //   accessorKey: "title",
  //   header: () => <div className='text-center'>Title</div>,
  //   cell: ({ row }) => {
  //     return (
  //       <div className='text-right font-medium'>
  //         {row.getValue("title") as string}
  //       </div>
  //     );
  //   },
  // },
  // {
  //   accessorKey: "appraisal",
  //   header: () => <p className='text-center'>End Date</p>,
  //   cell: ({ row }) => {
  //     return (
  //       <div className='text-center font-medium'>
  //         {(row.getValue("appraisal") as Appraisal)?.endDate}
  //       </div>
  //     );
  //   },
  // },
  {
    accessorKey: "goalSummary",
    header: () => <p className='text-center'>목표 현황</p>,
    cell: ({ row }) => {
      const goalOwner = resolveGoalOwner(row.original);
      const summary = getGoalSummary(goalOwner);

      return (
        <div className='mx-auto w-full max-w-[220px] rounded-xl border border-slate-200 bg-white p-2'>
          <div className='grid grid-cols-3 gap-2 text-center'>
            <div className='space-y-1'>
              <p className='text-[11px] font-medium text-slate-500'>목표 수</p>
              <Badge
                variant='outline'
                className='min-w-[60px] justify-center font-semibold'>
                {summary.totalGoals}개
              </Badge>
            </div>
            <div className='space-y-1'>
              <p className='text-[11px] font-medium text-slate-500'>승인</p>
              <Badge className='min-w-[52px] justify-center border border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-100'>
                {summary.approvedCount}
              </Badge>
            </div>
            <div className='space-y-1'>
              <p className='text-[11px] font-medium text-slate-500'>반려</p>
              <Badge className='min-w-[52px] justify-center border border-rose-300 bg-rose-100 text-rose-800 hover:bg-rose-100'>
                {summary.rejectedCount}
              </Badge>
            </div>
          </div>
          <p className='mt-2 text-center text-xs text-slate-500'>
            공통 {summary.commonGoals} / 개인 {summary.personalGoals}
          </p>
        </div>
      );
    },
  },
  {
    id: "midPerfSelf",
    header: () => (
      <p className='text-center text-xs max-w-[5.5rem] leading-tight'>
        중간·성과 자가
      </p>
    ),
    cell: ({ row }) => (
      <div className='flex justify-center'>
        {workflowDoneBadge(row.original.perfMidSelfDone)}
      </div>
    ),
  },
  {
    id: "midPerfLeader",
    header: () => (
      <p className='text-center text-xs max-w-[5.5rem] leading-tight'>
        중간·성과 리더
      </p>
    ),
    cell: ({ row }) => (
      <div className='flex justify-center'>
        {workflowDoneBadge(row.original.perfMidLeaderDone)}
      </div>
    ),
  },
  {
    id: "midCompFinalSelf",
    header: () => (
      <p className='text-center text-xs max-w-[5.5rem] leading-tight'>
        중간·역량최종 자가
      </p>
    ),
    cell: ({ row }) => (
      <div className='flex justify-center'>
        {workflowDoneBadge(row.original.compFinalMidSelfDone)}
      </div>
    ),
  },
  {
    id: "midCompFinalLeader",
    header: () => (
      <p className='text-center text-xs max-w-[5.5rem] leading-tight'>
        중간·역량최종 리더
      </p>
    ),
    cell: ({ row }) => (
      <div className='flex justify-center'>
        {workflowDoneBadge(row.original.compFinalMidLeaderDone)}
      </div>
    ),
  },
  {
    id: "finalPerfSelf",
    header: () => (
      <p className='text-center text-xs max-w-[5.5rem] leading-tight'>
        기말·성과 자가
      </p>
    ),
    cell: ({ row }) => (
      <div className='flex justify-center'>
        {workflowDoneBadge(row.original.perfFinalSelfDone)}
      </div>
    ),
  },
  {
    id: "finalPerfLeader",
    header: () => (
      <p className='text-center text-xs max-w-[5.5rem] leading-tight'>
        기말·성과 리더
      </p>
    ),
    cell: ({ row }) => (
      <div className='flex justify-center'>
        {workflowDoneBadge(row.original.perfFinalLeaderDone)}
      </div>
    ),
  },
  {
    id: "finalCompFinalSelf",
    header: () => (
      <p className='text-center text-xs max-w-[5.5rem] leading-tight'>
        기말·역량최종 자가
      </p>
    ),
    cell: ({ row }) => (
      <div className='flex justify-center'>
        {workflowDoneBadge(row.original.compFinalFinalSelfDone)}
      </div>
    ),
  },
  {
    id: "finalCompFinalLeader",
    header: () => (
      <p className='text-center text-xs max-w-[5.5rem] leading-tight'>
        기말·역량최종 리더
      </p>
    ),
    cell: ({ row }) => (
      <div className='flex justify-center'>
        {workflowDoneBadge(row.original.compFinalFinalLeaderDone)}
      </div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem
              onClick={() => {
                const appraisalUserId = row.getValue(
                  "appraisalUserId",
                ) as string;
                const path = `/competency-evaluation?appraisalUserId=${appraisalUserId}`;
                if (navigate) {
                  navigate(path);
                } else {
                  window.location.href = path;
                }
              }}>
              역량 평가 수행 (리더)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
