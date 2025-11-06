import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  FieldSet,
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

import { useForm, type SubmitHandler } from "react-hook-form";

interface GoalFormData {
  title: string;
  description: string;
}

interface GoalsFormData {
  goals: GoalFormData[];
}

export default function GoalForm() {
  const [goalsForm, setGoalsForm] = useState<GoalFormData[]>([
    { title: "", description: "" },
  ]);

  const form = useForm<GoalsFormData>({
    defaultValues: {
      goals: goalsForm,
    },
  });

  const { register, handleSubmit } = form;

  const onSubmit: SubmitHandler<GoalsFormData> = (data) => {
    console.log(data);
  };

  const handleAddGoal = () => {
    const newGoals = [...goalsForm, { title: "", description: "" }];
    setGoalsForm(newGoals);
    form.setValue("goals", newGoals);
  };

  return (
    <>
      <Button onClick={handleAddGoal}>+ 목표 추가</Button>
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {goalsForm.map((_, idx) => (
            <FieldSet key={idx}>
              <FieldGroup className='grid grid-cols-2 gap-4 mt-4' key={idx}>
                <Field>
                  <FieldLabel htmlFor='title'>목표</FieldLabel>
                  <Input
                    {...register(`goals.${idx}.title`)}
                    id='title'
                    placeholder='목표를 입력해주세요.'
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor='description'>세부과제</FieldLabel>
                  <Textarea
                    {...register(`goals.${idx}.description`)}
                    id='description'
                    placeholder='세부과제를 입력해주세요.'
                    rows={4}
                  />
                </Field>
              </FieldGroup>
            </FieldSet>
          ))}
          <Button className='mt-4' type='submit'>
            저장
          </Button>
        </form>
      </Form>
    </>
  );
}
