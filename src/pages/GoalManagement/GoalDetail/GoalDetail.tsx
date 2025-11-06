import React from "react";
import { useLocation, useParams } from "react-router";
import GoalForm from "../widget/GoalForm";

export default function GoalDetail() {
  const { appraisalId } = useParams();



  return (
    <div className='p-4 lg:p-6 space-y-6'>
      {appraisalId}

      <GoalForm />
    </div>
  );
}
