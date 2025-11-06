import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
}

export type SortConfig = {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
};

export const getColumns = (
  sortConfig: SortConfig,
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
  {
    accessorKey: "appraisal",
    header: () => <p className='text-center'>End Date</p>,
    cell: ({ row }) => {
      return (
        <div className='text-center font-medium'>
          {(row.getValue("appraisal") as Appraisal)?.endDate}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => <p className='text-right pr-2'>Status</p>,
    cell: ({ row }) => {
      return (
        <div className='text-right font-medium pr-2'>
          {(row.getValue("status") as string) ?? "진행중"}
        </div>
      );
    },
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
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(
                  row.getValue("appraisalUserId") as string,
                )
              }>
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
