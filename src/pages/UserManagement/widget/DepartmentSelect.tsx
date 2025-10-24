import { useQuery } from "@tanstack/react-query";

import { GET_departments } from "@/api/department/department";

import { Label } from "@/components/ui/label";

import { MultiSelect } from "@/components/ui/multi-select";

export default function DepartmentSelect({
  value,
  onChange,
}: {
  value: Department[];
  onChange: (value: Department[]) => void;
}) {
  const { data: departments, isLoading: isLoadingDepartments } = useQuery({
    queryKey: ["departments", "flat"],
    queryFn: () => GET_departments("flat"),
    select: (data) => {
      return data.data.map((d: DepartmentTreeData) => d.data);
    },
  });

  const items =
    departments && departments.length > 0
      ? departments.map((d: Department) => ({
          value: d.departmentId,
          label: d.departmentName,
        }))
      : [];

  return (
    <>
      <Label>부서</Label>
      {isLoadingDepartments ? (
        <div>Loading...</div>
      ) : (
        <MultiSelect
          defaultValue={value?.map((v) => v.departmentId) ?? []}
          options={items}
          placeholder={
            isLoadingDepartments ? "Loading..." : "Select Department"
          }
          // defaultValue={value.map((v) => v.departmentId) ?? []}
          searchable={true}
          onValueChange={(values) => {
            onChange(
              values.map(
                (v) =>
                  departments?.find((d: Department) => d.departmentId === v) ??
                  null,
              ),
            );
          }}
        />
      )}
    </>
  );
}
