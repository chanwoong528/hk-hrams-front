import { Users, ClipboardCheck, Target, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function Dashboard() {
  const metrics = [
    {
      title: "전체 사용자",
      value: "248",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100",
      change: "+12%",
    },
    {
      title: "진행 중인 평가",
      value: "32",
      icon: ClipboardCheck,
      color: "text-green-600",
      bg: "bg-green-100",
      change: "+5%",
    },
    {
      title: "대기 중인 목표",
      value: "18",
      icon: Target,
      color: "text-orange-600",
      bg: "bg-orange-100",
      change: "-3%",
    },
    {
      title: "부서 수",
      value: "15",
      icon: Building2,
      color: "text-purple-600",
      bg: "bg-purple-100",
      change: "0%",
    },
  ];

  const gradeDistribution = [
    { name: "S등급", value: 15, color: "#10B981" },
    { name: "A등급", value: 45, color: "#3B82F6" },
    { name: "B등급", value: 78, color: "#F59E0B" },
    { name: "C등급", value: 32, color: "#EF4444" },
  ];

  const monthlyPerformance = [
    { month: "1월", performance: 75, competency: 82 },
    { month: "2월", performance: 78, competency: 85 },
    { month: "3월", performance: 82, competency: 88 },
    { month: "4월", performance: 85, competency: 90 },
    { month: "5월", performance: 88, competency: 92 },
    { month: "6월", performance: 90, competency: 95 },
  ];

  return (
    <div className='p-4 lg:p-6 space-y-6'>
      {/* Metrics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card key={index}>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm text-gray-600'>{metric.title}</p>
                    <h3 className='mt-2'>{metric.value}</h3>
                    <p className='text-sm text-gray-600 mt-1'>
                      {metric.change} from last month
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-full ${metric.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Grade Distribution */}
        <Card className='lg:col-span-1'>
          <CardHeader>
            <CardTitle>등급 분포</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={240}>
              <PieChart>
                <Pie
                  data={gradeDistribution}
                  cx='50%'
                  cy='50%'
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(Number(percent) * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill='#8884d8'
                  dataKey='value'>
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Performance Trends */}
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>월별 성과 추이</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={240}>
              <BarChart data={monthlyPerformance}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='month' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey='performance' name='성과 평가' fill='#2563EB' />
                <Bar dataKey='competency' name='역량 평가' fill='#10B981' />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'></div> */}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>빠른 작업</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
            <Button className='h-auto py-4 flex-col gap-2 bg-blue-600 hover:bg-blue-700'>
              <Users className='w-5 h-5' />
              <span>사용자 추가</span>
            </Button>
            <Button className='h-auto py-4 flex-col gap-2 bg-green-600 hover:bg-green-700'>
              <ClipboardCheck className='w-5 h-5' />
              <span>평가 생성</span>
            </Button>
            <Button className='h-auto py-4 flex-col gap-2 bg-orange-600 hover:bg-orange-700'>
              <Target className='w-5 h-5' />
              <span>목표 설정</span>
            </Button>
            <Button className='h-auto py-4 flex-col gap-2 bg-purple-600 hover:bg-purple-700'>
              <Building2 className='w-5 h-5' />
              <span>부서 관리</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
