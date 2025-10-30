import { GET_appraisalDetailByAppraisalId } from "@/api/appraisal/appraisal";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { useParams } from "react-router";
import { useDebounce } from "@uidotdev/usehooks";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import {
//   Table,
//   TableHeader,
//   TableBody,
//   TableRow,
//   TableCell,
//   TableHead,
// } from "@/components/ui/table";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Eye } from "lucide-react";
// import { Progress } from "@/components/ui/progress";
import { DataTable } from "./widget/DataTable";
// import type { ColumnDef } from "@tanstack/react-table";
import { columns } from "./widget/Column";

export default function AppraisalDetail() {
  const { appraisalId } = useParams();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 1500);

  const [pageInfo, setPageInfo] = useState<{ page: number; limit: number }>({
    page: 1,
    limit: 10,
  });

  const { data: appraisalDetail, isLoading: isLoadingAppraisalDetail } =
    useQuery({
      queryKey: [
        "appraisalDetail",
        appraisalId,
        debouncedSearchQuery,
        pageInfo.page,
        pageInfo.limit,
      ],
      queryFn: () =>
        GET_appraisalDetailByAppraisalId(
          appraisalId as string,
          pageInfo.page,
          pageInfo.limit,
          debouncedSearchQuery,
        ),
      select: (data) => {
        return data.data;
      },
      enabled: !!appraisalId,
    });

  console.log("@@@@@@@@@@@ appraisalDetail>> ", appraisalId, appraisalDetail);
  if (isLoadingAppraisalDetail) return <div>Loading...</div>;

  return (
    <div>
      AppraisalDetailaaaaaa {appraisalId}
      <Card>
        <CardHeader>
          <CardTitle>평가 대상자 목록 ({appraisalDetail?.total}명)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <DataTable columns={columns} data={appraisalDetail?.list || []} />
            {/* <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>대상자</TableHead>
                  <TableHead>부서</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>진행률</TableHead>
                  <TableHead className='text-right'>작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appraisalDetail?.list?.map(
                  (target: {
                    appraisalId: string;
                    appraisalType: string;
                    title: string;
                    description: string;
                    endDate: string;
                    created: string;
                    updated: string;
                    goals: [];
                    appraisalBy: [];
                    assessTarget: {
                      userId: string;
                      koreanName: string;
                      email: string;
                      lv: string;
                      userStatus: string;
                      created: string;
                      updated: string;
                    };
                  }) => (
                    <></>
                  ),
                )}
              </TableBody>
            </Table> */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
