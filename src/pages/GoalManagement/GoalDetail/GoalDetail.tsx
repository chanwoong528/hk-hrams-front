import { useNavigate, useParams } from "react-router";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import GoalForm from "../widget/GoalForm";
import { POST_goals } from "@/api/goal/goal";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function GoalDetail() {
  const { appraisalId } = useParams();
  const navigate = useNavigate();

  const { mutate: postGoals } = useMutation({
    mutationFn: (payload: {
      appraisalId: string;
      goals: { title: string; description: string }[];
    }) => POST_goals(payload),
    onSuccess: () => {
      toast.success("목표가 저장되었습니다");
    },
  });

  const handleSubmitGoals = (
    goals: { title: string; description: string }[],
  ) => {
    console.log(goals);
    console.log(appraisalId);
    if (!appraisalId) {
      toast.error("평가 ID가 없습니다");
      return;
    }

    postGoals({ appraisalId, goals });
  };

  return (
    <div className='p-4 lg:p-6 space-y-6'>
      {appraisalId}
      <div className='flex items-center gap-4'>
        <Button
          variant='ghost'
          size='icon'
          onClick={() => {
            navigate(-1);
          }}>
          <ArrowLeft className='w-5 h-5' />
        </Button>
        <div>
          <h2 className='text-gray-900'>목표 관리</h2>
        </div>
      </div>
      <GoalForm onSubmitGoals={handleSubmitGoals} />
    </div>
  );
}
