import { http } from "..";

export interface LeaderReviewTemplate {
  templateId: string;
  title: string;
  description: string;
  questions?: LeaderReviewQuestion[];
  isActive: boolean;
}

export interface LeaderReviewQuestion {
  questionId: string;
  questionText: string;
  questionType: string; // 'LIKERT_5' | 'TEXT'
  order: number;
}

export interface LeaderReview {
  leaderReviewId: string;
  status: string;
  target?: {
    userId: string;
    koreanName: string;
  };
  createdAt?: string; // Added
  cycle?: {
    title: string;
    description?: string; // Added
    deadline?: string;
  };
  templates?: LeaderReviewTemplate[];
  assignments?: ReviewAssignment[]; // Added
}

export interface ReviewAssignment {
  assignmentId: string;
  status: string; // 'NOT_STARTED' | 'SUBMITTED'
  deadline?: string;
  createdAt: string;
  leaderReview: LeaderReview;
}

// Get My Assignments
export const GET_myLeaderReviewAssignments = async () => {
  // Assuming backend returns array of ReviewAssignment
  const response = await http.get<ReviewAssignment[]>("/leader-review/assignments/my");
  return response.data;
};

// Get Detail
export const GET_leaderReviewAssignmentDetail = async (assignmentId: string) => {
  const response = await http.get<ReviewAssignment>(`/leader-review/assignments/${assignmentId}`);
  return response.data;
};

// Submit
export const POST_submitLeaderReviewAssignment = async ({
  assignmentId,
  answers
}: {
  assignmentId: string;
  answers: { questionId: string; answer: string }[];
}) => {
  const response = await http.post(`/leader-review/assignments/${assignmentId}/submit`, { answers });
  return response.data;
};

// --- Admin / Template Management (Restored) ---

export const GET_templates = async () => {
  // Assuming GET /leader-review/templates
  const response = await http.get<LeaderReviewTemplate[]>("/leader-review/templates");
  return response.data;
};

export const GET_template = async (templateId: string) => {
  const response = await http.get<LeaderReviewTemplate>(`/leader-review/templates/${templateId}`);
  return response.data;
};

export const POST_createTemplate = async (data: any) => {
  const response = await http.post("/leader-review/templates", data);
  return response.data;
};

export const PUT_updateTemplate = async (templateId: string, data: any) => {
  const response = await http.put(`/leader-review/templates/${templateId}`, data);
  return response.data;
};

export const POST_startLeaderReview = async (data: {
  templateId: string;
  reviewTitle: string;
  reviewDescription?: string;
  excludedUserIds?: string[];
}) => {
  const response = await http.post("/leader-review/start", data);
  return response.data; // Expected { message }
};

export const GET_leaderReviews = async () => {
  const response = await http.get("/leader-review/reviews");
  return response.data;
};

// --- Result View ---

export interface LeaderReviewResult {
  reviewId: string;
  title: string;
  description: string;
  createdAt: string;
  totalReviewers?: number;
  submittedReviewers?: number;
  questions: {
    questionId: string;
    questionText: string;
    questionType: string;
    responseCount: number;
    average?: number;
    distribution?: number[];
    textAnswers?: string[];
  }[];
}

export const GET_myResultReviews = async () => {
  const response = await http.get<LeaderReview[]>("/leader-review/results/my");
  return response.data;
};

export const GET_reviewResult = async (reviewId: string) => {
  const response = await http.get<LeaderReviewResult>(`/leader-review/results/${reviewId}`);
  return response.data;
};
