import { http } from "@/api";
import { convertDepartmentToTreeData } from "./adaptor";

export const GET_departments = async (viewType: "flat" | "tree" = "flat") => {
  const response = await http.get("/department", {
    params: { viewType },
  });

  if (viewType === "flat") {
    return {
      ...response.data,
      data: convertDepartmentToTreeData(response.data.data),
    };
  }

  return response.data;
};

export const POST_department = async (department: {
  departmentName: string;
  leaderId?: string;
}) => {
  const response = await http.post("/department", {
    departmentName: department.departmentName,
    ...(department.leaderId && { leaderId: department.leaderId }),
  });
  return response.data;
};

export const PATCH_manyDepartments = async (
  departments: DepartmentTreeData[],
) => {
  return await Promise.all(
    departments.map((department) => PATCH_departmentById(department)),
  );
};

export const PATCH_departmentById = async (department: DepartmentTreeData) => {
  try {
    console.log("@@@department>> ", department.data.leaderId);
    const parentId =
      department.parent === "0" ? "NA" : department.parent?.toString() || "";

    const response = await http.patch(`/department/${department.id}`, {
      departmentName: department.text,
      ...(parentId && { parentId: parentId }),
      ...(department.data.leaderId && {
        leaderId: department.data.leaderId,
      }),
    });
    return response.data;
  } catch (error) {
    console.error("@@@error>> ", error);
    throw error;
  }
};
