import { Card, CardContent } from "@/components/ui/card";
import { Star, TrendingUp, MessageSquare } from "lucide-react";
import { APPRAISAL_STATUS } from "../constants";
import type { MyAppraisal } from "../type";

interface DashboardStatsProps {
  appraisals: MyAppraisal[];
}

export function DashboardStats({ appraisals }: DashboardStatsProps) {
  const total = appraisals.length;
  const finished = appraisals.filter(
    (a) => a.status === APPRAISAL_STATUS.FINISHED,
  ).length;
  const ongoing = appraisals.filter(
    (a) => a.status === APPRAISAL_STATUS.ONGOING,
  ).length;

  return (
    <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
      <Card>
        <CardContent className='p-6'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-600'>전체 목표</p>
              <h3 className='mt-2'>{total}개</h3>
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
              <h3 className='mt-2'>{finished}개</h3>
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
              <h3 className='mt-2'>{ongoing}개</h3>
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
              <h3 className='mt-2'>{finished}개</h3>
            </div>
            <MessageSquare className='w-8 h-8 text-orange-600' />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
