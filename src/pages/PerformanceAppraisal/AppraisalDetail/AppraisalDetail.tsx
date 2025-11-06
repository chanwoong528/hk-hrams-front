import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";

import { useDebounce } from "@uidotdev/usehooks";

import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

import { GET_appraisalDetailByAppraisalId } from "@/api/appraisal/appraisal";

import { DataTable } from "./widget/DataTable";
import { getColumns } from "./widget/Column";
import { TablePagination } from "./widget/TablePagination";

export default function AppraisalDetail() {
  const { appraisalId } = useParams();
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

  const columns = getColumns({
    sortBy: sortInfo.sortBy,
    sortOrder: sortInfo.sortOrder,
    onSortChange: handleSortChange,
  });

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

  if (isLoadingAppraisalDetail && !appraisalDetail)
    return <div>Loading...</div>;

  const handleRowClick = (appraisalUserId: string) => {
    console.log(" appraisalUserId>> ", appraisalUserId);
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
          <CardTitle>평가 대상자 목록 ({appraisalDetail?.total}명)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            {/* Search and Filter */}

            <DataTable
              key={`${pageInfo.page}-${pageInfo.limit}-${debouncedSearchQuery}-${sortInfo.sortBy}-${sortInfo.sortOrder}`}
              columns={columns}
              data={appraisalDetail?.list ?? []}
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
