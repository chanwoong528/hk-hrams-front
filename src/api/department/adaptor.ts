export const convertDepartmentToTreeData = (
  departments: Department[],
): DepartmentTreeData[] => {
  return departments.map((department) => ({
    id: department.departmentId,
    ...(department.parent?.departmentId
      ? { parent: department.parent.departmentId }
      : { parent: "0" }),
    droppable: true,
    text: department.departmentName,
    data: department,
  }));
};
