import {
  Users,
  ClipboardCheck,
  Target,
  Building2,
  TrendingUp,
  Activity,
} from "lucide-react";
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

  const recentActivities = [
    {
      user: "김민준",
      action: "목표를 생성했습니다",
      target: "Q2 매출 목표",
      time: "5분 전",
    },
    {
      user: "이서연",
      action: "평가를 완료했습니다",
      target: "김민준 - 중간 평가",
      time: "23분 전",
    },
    {
      user: "박지훈",
      action: "목표 등급을 부여했습니다",
      target: "A등급",
      time: "1시간 전",
    },
    {
      user: "최유진",
      action: "부서를 업데이트했습니다",
      target: "기술팀",
      time: "2시간 전",
    },
    {
      user: "정다은",
      action: "새로운 사용자를 추가했습니다",
      target: "강호민",
      time: "3시간 전",
    },
  ];

  const topPerformers = [
    { name: "김민준", department: "영업팀", score: 95, grade: "S" },
    { name: "이서연", department: "마케팅팀", score: 92, grade: "S" },
    { name: "박지훈", department: "기술팀", score: 90, grade: "A" },
    { name: "최유진", department: "인사팀", score: 88, grade: "A" },
    { name: "정다은", department: "재무팀", score: 86, grade: "A" },
  ];

  const getGradeBadgeColor = (grade: string) => {
    switch (grade) {
      case "S":
        return "bg-green-100 text-green-700";
      case "A":
        return "bg-blue-100 text-blue-700";
      case "B":
        return "bg-orange-100 text-orange-700";
      case "C":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

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

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Recent Activities */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle>최근 활동</CardTitle>
            <Activity className='w-5 h-5 text-gray-400' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {recentActivities.map((activity, index) => (
                <div
                  key={index}
                  className='flex items-start gap-3 pb-4 border-b last:border-b-0 last:pb-0'>
                  <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0'>
                    {activity.user.charAt(0)}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm'>
                      <span className='text-gray-900'>{activity.user}</span>
                      <span className='text-gray-600'> {activity.action}</span>
                    </p>
                    <p className='text-sm text-gray-600 mt-1'>
                      {activity.target}
                    </p>
                    <p className='text-xs text-gray-400 mt-1'>
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <CardTitle>우수 평가자</CardTitle>
            <TrendingUp className='w-5 h-5 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {topPerformers.map((performer, index) => (
                <div key={index} className='flex items-center gap-3'>
                  <div className='text-lg text-gray-400 w-6'>{index + 1}</div>
                  <div className='w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shrink-0'>
                    {performer.name.charAt(0)}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='text-gray-900'>{performer.name}</div>
                    <div className='text-sm text-gray-600'>
                      {performer.department}
                    </div>
                  </div>
                  <div className='text-right shrink-0'>
                    <div
                      className={`inline-block px-2 py-1 rounded text-sm ${getGradeBadgeColor(
                        performer.grade,
                      )}`}>
                      {performer.grade}등급
                    </div>
                    <div className='text-sm text-gray-600 mt-1'>
                      {performer.score}점
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

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
