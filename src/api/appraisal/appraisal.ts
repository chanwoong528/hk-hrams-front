import { http } from "@/api";

export const POST_appraisal = async (payload: {
  title: string;
  excludedUsers: User[];
  description: string;
  endDate: string;
  appraisalYear: string;
  appraisalType: string;
  appraisalTerm: string;
}) => {
  const response = await http.post("/performance-appraisal", {
    title: payload.title,
    appraisalType: `${payload.appraisalYear}-${payload.appraisalType}-${payload.appraisalTerm}`,
    description: payload.description,
    endDate: payload.endDate,
    exceptionUserList: payload.excludedUsers.map((user) => user.userId),
  });
  return response.data;
};

export const GET_appraisalsByDistinctType = async (keyword?: string) => {
  console.log("@@@@@@@@@@@@@@@ keyword>> ", keyword);
  const response = await http.get("/performance-appraisal", {
    params: {
      type: "distinct",
      ...(keyword && { keyword }),
    },
  });
  return response.data;
};

export const GET_appraisalDetail = async (
  appraisalType: string,
  page: number = 1,
  limit: number = 10,
  keyword?: string,
) => {
  console.log(
    "@@@@@@@@@@@ appraisalType>> ",
    appraisalType,
    page,
    limit,
    keyword,
  );

  const response = await http.get(`/performance-appraisal/${appraisalType}`, {
    params: {
      page,
      limit,
      ...(keyword && { keyword }),
    },
  });
  return response.data;
};
