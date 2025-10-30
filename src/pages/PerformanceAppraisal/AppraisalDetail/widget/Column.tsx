import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

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

export const columns: ColumnDef<any>[] = [
  {
    accessorKey: "assessTarget",
    header: () => <div className='text-left pl-2'>대상자</div>,
    cell: ({ row }) => {
      return (
        <div className='flex items-center gap-2 pl-2'>
          <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600'>
            {row.original.owner?.koreanName.charAt(0)}
          </div>
          <span className='text-gray-900 text-center'>
            {row.original.owner?.koreanName}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "department",
    header: () => <div className='text-center'>Department</div>,
    cell: ({ row }) => {
      return (
        <div className='text-center font-medium flex gap-2 justify-center'>
          {row.original.departments?.map((department: Department) => (
            <Badge key={department.departmentId}>
              {department.departmentName}
            </Badge>
          ))}
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
    accessorKey: "endDate",
    header: () => <div className='text-center'>End Date</div>,
    cell: ({ row }) => {
      return (
        <div className='text-center font-medium'>
          {row.original.appraisal.endDate}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => <div className='text-right pr-2'>Status</div>,
    cell: ({ row }) => {
      return (
        <div className='text-right font-medium pr-2'>
          {row.original.status ?? "진행중"}
        </div>
      );
    },
  },
];
