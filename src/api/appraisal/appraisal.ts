import { http } from "@/api";
import type { HramsUserType } from "@/api/user/user";

export const POST_startAppraisal = async (payload: {
  appraisalId: string;
  excludedUsers: HramsUserType[];
}) => {
  const response = await http.post(`/appraisal-user`, {
    appraisalId: payload.appraisalId,
    exceptionUserList: payload.excludedUsers.map((user) => user.userId),
  });
  return response.data;
};

/** 진행 중인 평가에 피평가자만 추가 (이미 있으면 API에서 건너뜀). HR/관리자 전용. */
export const POST_addAppraisalUsersToOngoing = async (payload: {
  appraisalId: string;
  userIds: string[];
}) => {
  const response = await http.post(`/appraisal-user/add-users`, payload);
  return response.data;
};

export const POST_appraisal = async (payload: {
  title: string;
  description: string;
  minGradeRank?: number;
  maxGradeRank?: number;
}) => {
  const response = await http.post("/appraisal", {
    title: payload.title,
    description: payload.description,
    minGradeRank: payload.minGradeRank,
    maxGradeRank: payload.maxGradeRank,
  });
  return response.data;
};

export const PATCH_appraisal = async (payload: {
  appraisalId: string;
  title?: string;
  description?: string;
  status?: string;
  minGradeRank?: number;
  maxGradeRank?: number;
  macroWorkflowPhase?: number;
}) => {
  console.log("@@@@@@@@@@@@@@@ payload>> ", payload);

  const payloadToSend = {
    ...(payload.title && { title: payload.title }),
    ...(payload.description && { description: payload.description }),
    ...(payload.status && { status: payload.status }),
    ...(payload.minGradeRank !== undefined && {
      minGradeRank: payload.minGradeRank,
    }),
    ...(payload.maxGradeRank !== undefined && {
      maxGradeRank: payload.maxGradeRank,
    }),
    ...(payload.macroWorkflowPhase !== undefined && {
      macroWorkflowPhase: payload.macroWorkflowPhase,
    }),
  };
  const response = await http.patch(
    `/appraisal/${payload.appraisalId}`,
    payloadToSend,
  );
  return response.data;
};
export const GET_appraisalsByDistinctType = async (
  type: string,
  keyword?: string,
) => {
  // console.log("@@@@@@@@@@@@@@@ keyword>> ", keyword);
  const response = await http.get("/appraisal", {
    params: {
      type: type ? type : "distinct",
      ...(keyword && { keyword }),
    },
  });
  return response.data;
};

export const GET_appraisalDetail = async (
  appraisalId: string,
  page: number = 1,
  limit: number = 10,
  keyword?: string,
) => {
  const response = await http.get(`/appraisal/${appraisalId}`, {
    params: {
      page,
      limit,
      ...(keyword && { keyword }),
    },
  });
  return response.data;
};

export const GET_appraisalDetailByAppraisalId = async (
  appraisalId: string,
  page: number = 1,
  limit: number = 10,
  keyword?: string,
  sortBy?: string,
  sortOrder?: "asc" | "desc",
) => {
  const response = await http.get(`/appraisal-user/${appraisalId}`, {
    params: {
      page,
      limit,
      ...(keyword && { keyword }),
      ...(sortBy && sortOrder && { sortBy, sortOrder }),
    },
  });
  return response.data;
};

export const GET_appraisalsOfTeamMembers = async (departments: string[]) => {
  const response = await http.get("/appraisal-team-members", {
    params: {
      departments: departments.join(","),
    },
  });
  return response.data;
};

// export const GET_myAppraisals = async () => {
//   const response = await http.get(`/appraisal/my-appraisal`);
//   return response.data;
// };

export const DELETE_appraisal = async (appraisalId: string) => {
  const response = await http.delete(`/appraisal/${appraisalId}`);
  return response.data;
};
