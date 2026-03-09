import { useQuery } from "@tanstack/react-query";
import { GET_myTodos, type TodoItem } from "@/api/todo/todo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardList,
  Target,
  UserCheck,
  Users,
  Loader2,
} from "lucide-react";

export default function TodoDashboard() {
  const navigate = useNavigate();

  const { data: todos, isLoading } = useQuery({
    queryKey: ["myTodos"],
    queryFn: GET_myTodos,
  });

  if (isLoading) {
    return (
      <div className='flex flex-col items-center justify-center p-12 text-gray-500'>
        <Loader2 className='w-8 h-8 animate-spin mb-4 text-blue-600' />
        <p>나의 할 일 목록을 불러오는 중입니다...</p>
      </div>
    );
  }

  const allTodosCount =
    (todos?.selfCompetency?.length || 0) +
    (todos?.selfGoal?.length || 0) +
    (todos?.leaderReview?.length || 0) +
    (todos?.teamCompetency?.length || 0) +
    (todos?.teamGoal?.length || 0);

  const handleNavigate = (item: TodoItem) => {
    switch (item.type) {
      case "COMPETENCY_SELF":
        navigate(
          `/competency-evaluation?appraisalUserId=${item.appraisalUserId || item.id}&mode=self`,
        );
        break;
      case "GOAL_SELF":
        navigate(`/goal-management`);
        break;
      case "LEADER_REVIEW":
        navigate(`/leader-appraisal/answer/${item.assignmentId}`);
        break;
      case "TEAM_COMPETENCY":
        navigate(`/competency-evaluation?mode=team`);
        break;
      case "TEAM_GOAL":
        navigate(`/goal-management`);
        break;
    }
  };

  const TodoSection = ({
    title,
    items,
    icon: Icon,
    emptyText,
    colorClass,
  }: {
    title: string;
    items?: TodoItem[];
    icon: any;
    emptyText: string;
    colorClass: string;
  }) => {
    if (!items || items.length === 0) {
      return (
        <Card className='border-none shadow-sm ring-1 ring-gray-100 bg-gray-50/50'>
          <CardHeader className={`pb-3 border-b border-gray-100`}>
            <div className='flex items-center gap-3'>
              <div className={`p-2 rounded-lg bg-gray-100 text-gray-400`}>
                <Icon className='w-5 h-5' />
              </div>
              <CardTitle className='text-lg font-bold text-gray-500'>
                {title}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className='p-8 text-center text-sm text-gray-400'>
            {emptyText}
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className='border-none shadow-sm ring-1 ring-gray-200 overflow-hidden'>
        <CardHeader className={`pb-3 ${colorClass} bg-opacity-10 border-b`}>
          <div className='flex items-center gap-3'>
            <div
              className={`p-2 rounded-lg bg-white shadow-sm ${colorClass.replace("bg-", "text-")}`}>
              <Icon className='w-5 h-5' />
            </div>
            <CardTitle className='text-lg font-bold text-gray-800 flex items-center gap-2'>
              {title}
              <span className='bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-bold'>
                {items.length}
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='divide-y divide-gray-100'>
            {items.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleNavigate(item)}
                className='p-4 hover:bg-gray-50 flex items-center justify-between cursor-pointer transition-colors'>
                <div className='flex items-center gap-3'>
                  <div className='w-2 h-2 rounded-full bg-red-400 shrink-0' />
                  <span className='text-sm font-medium text-gray-700'>
                    {item.title}
                  </span>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  className='text-blue-600 hover:text-blue-700 hover:bg-blue-50 shrink-0'>
                  작성하러 가기 &rarr;
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className='p-4 lg:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      <div className='flex items-start justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2'>
            나의 할 일 (To-Do)
            {allTodosCount > 0 && (
              <span className='bg-red-500 text-white text-sm px-3 py-1 rounded-full'>
                {allTodosCount}
              </span>
            )}
          </h1>
          <p className='text-gray-500 mt-1'>
            진행하셔야 할 평가 및 리뷰 항목들을 확인하고 완료해주세요.
          </p>
        </div>
      </div>

      {allTodosCount === 0 ? (
        <Card className='border-dashed border-2 bg-gray-50/50'>
          <CardContent className='flex flex-col items-center justify-center py-20 text-center'>
            <div className='w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-600 mb-6 shadow-sm'>
              <CheckCircle2 className='w-10 h-10' />
            </div>
            <h3 className='text-xl font-bold text-gray-900 mb-2'>
              모든 할 일을 완료했습니다!
            </h3>
            <p className='text-gray-500 max-w-sm'>
              현재 제출해야 할 리뷰나 역량 평가가 없습니다. <br />
              수고하셨습니다 👏
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6'>
          <TodoSection
            title='나의 역량 평가'
            items={todos?.selfCompetency}
            icon={ClipboardList}
            emptyText='진행할 본인 역량 평가가 없습니다.'
            colorClass='bg-blue-50 text-blue-600'
          />
          <TodoSection
            title='나의 목표/성과 평가'
            items={todos?.selfGoal}
            icon={Target}
            emptyText='진행할 본인 성과 평가가 없습니다.'
            colorClass='bg-purple-50 text-purple-600'
          />
          {todos?.leaderReview && (
            <TodoSection
              title='나의 리더 평가'
              items={todos?.leaderReview}
              icon={UserCheck}
              emptyText='배정된 리더 평가가 없습니다.'
              colorClass='bg-amber-50 text-amber-600'
            />
          )}
          {todos?.teamCompetency && (
            <TodoSection
              title='부서원 역량 평가 (리더 전용)'
              items={todos?.teamCompetency}
              icon={Users}
              emptyText='진행할 팀원 평가가 없습니다.'
              colorClass='bg-green-50 text-green-600'
            />
          )}
          {todos?.teamGoal && (
            <TodoSection
              title='부서원 목표/성과 평가 (리더 전용)'
              items={todos?.teamGoal}
              icon={Users}
              emptyText='진행할 팀원 성과 평가가 없습니다.'
              colorClass='bg-teal-50 text-teal-600'
            />
          )}
        </div>
      )}
    </div>
  );
}
