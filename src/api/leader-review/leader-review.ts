import { http } from "@/api/index";

export interface LeaderReviewQuestion {
  questionId?: string;
  questionText: string;
  questionType: string; // LIKERT_5, TEXT, YES_NO
  order?: number;
}

export interface LeaderReviewTemplate {
  templateId: string;
  title: string;
  description: string;
  questions: LeaderReviewQuestion[];
  isActive: boolean;
  created: string;
  leaderReviewId?: string | null;
}

export const GET_templates = async (): Promise<LeaderReviewTemplate[]> => {
  const { data } = await http.get<LeaderReviewTemplate[]>("/leader-review/templates");
  return data;
};

export const GET_template = async (templateId: string): Promise<LeaderReviewTemplate> => {
  const { data } = await http.get<LeaderReviewTemplate>(`/leader-review/templates/${templateId}`);
  return data;
};

export const POST_createTemplate = async (payload: {
  title: string;
  description: string;
  questions: LeaderReviewQuestion[];
}) => {
  const { data } = await http.post<LeaderReviewTemplate>("/leader-review/templates", payload);
  return data;
};

export const PUT_updateTemplate = async (templateId: string, payload: {
  title?: string;
  description?: string;
  questions?: LeaderReviewQuestion[];
}) => {
  const { data } = await http.put<LeaderReviewTemplate>(`/leader-review/templates/${templateId}`, payload);
  return data;
};

export const POST_startLeaderReview = async (payload: {
  templateId: string;
  reviewTitle: string;
  reviewDescription?: string;
  excludedUserIds?: string[];
  deadline?: Date;
}) => {
  const { data } = await http.post("/leader-review/start", payload);
  return data;
};

export const GET_leaderReviews = async () => {
  const { data } = await http.get<any[]>("/leader-review/reviews");
  return data;
};
