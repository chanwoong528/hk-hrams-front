import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import RootLayout from "@/components/layout/RootLayout";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";

import Dashboard from "@/pages/Dashboard";
import OrganizationManagement from "@/pages/OrganizationManagement/OrganizationManagement";
import GoalManagement from "@/pages/GoalManagement/GoalManagement";
import PerformanceAppraisal from "@/pages/PerformanceAppraisal/PerformanceAppraisal";
import AppraisalDetail from "@/pages/PerformanceAppraisal/AppraisalDetail/AppraisalDetail";
import Login from "@/pages/Login/Login";
import GoalDetail from "@/pages/GoalManagement/GoalDetail/GoalDetail";
import GoalGrade from "./pages/GoalManagement/GoalGrade/GoalGrade";
import TemplateGenerator from "@/pages/LeaderAppraisal/admin/TemplateGenerator";
import LeaderReviewManagement from "./pages/LeaderAppraisal/admin/LeaderReviewManagement";
import TemplateManagement from "@/pages/LeaderAppraisal/admin/TemplateManagement";
import MyLeaderReviews from "@/pages/LeaderAppraisal/MyLeaderReviews";
import LeaderReviewForm from "@/pages/LeaderAppraisal/LeaderReviewForm";
import MyLeaderResults from "@/pages/LeaderAppraisal/MyLeaderResults";
import LeaderResultDetail from "@/pages/LeaderAppraisal/LeaderResultDetail";

import CompetencyQuestionSetting from "@/pages/CompetencyAssessment/CompetencyQuestionSetting";
import CompetencyEvaluation from "@/pages/CompetencyAssessment/CompetencyEvaluation";
import RoleRoute from "@/components/auth/RoleRoute";

import { Toaster } from "@/components/ui/sonner";

import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "",
        element: <AuthenticatedLayout />,
        children: [
          {
            index: true,
            element: (
              <RoleRoute adminOnly>
                <Dashboard />
              </RoleRoute>
            ),
          },
          {
            path: "organization-management",
            element: (
              <RoleRoute adminOnly>
                <OrganizationManagement />
              </RoleRoute>
            ),
          },
          {
            path: "goal-management",
            element: <GoalManagement />,
          },
          {
            path: "goal-management/:appraisalId",
            element: <GoalDetail />,
          },
          {
            path: "goal-grade/:appraisalId",
            element: <GoalGrade />,
          },
          {
            path: "performance-appraisal",
            element: (
              <RoleRoute adminOnly>
                <PerformanceAppraisal />
              </RoleRoute>
            ),
          },
          {
            path: "performance-appraisal/:appraisalId",
            element: (
              <RoleRoute adminOnly>
                <AppraisalDetail />
              </RoleRoute>
            ),
          },
          {
            path: "leader-appraisal/reviews",
            element: (
              <RoleRoute adminOnly>
                <LeaderReviewManagement />
              </RoleRoute>
            ),
          },
          {
            path: "leader-appraisal/templates",
            element: (
              <RoleRoute adminOnly>
                <TemplateManagement />
              </RoleRoute>
            ),
          },
          {
            path: "leader-appraisal/templates/new",
            element: (
              <RoleRoute adminOnly>
                <TemplateGenerator />
              </RoleRoute>
            ),
          },
          {
            path: "leader-appraisal/templates/:templateId/edit",
            element: (
              <RoleRoute adminOnly>
                <TemplateGenerator />
              </RoleRoute>
            ),
          },
          {
            path: "leader-appraisal/my",
            element: <MyLeaderReviews />,
          },
          {
            path: "leader-appraisal/answer/:assignmentId",
            element: <LeaderReviewForm />,
          },
          {
            path: "leader-appraisal/results/my",
            element: (
              <RoleRoute adminOnly>
                <MyLeaderResults />
              </RoleRoute>
            ),
          },
          {
            path: "leader-appraisal/results/:reviewId",
            element: (
              <RoleRoute adminOnly>
                <LeaderResultDetail />
              </RoleRoute>
            ),
          },
          {
            path: "competency-setting",
            element: (
              <RoleRoute adminOnly leaderOnly>
                <CompetencyQuestionSetting />
              </RoleRoute>
            ),
          },
          {
            path: "competency-evaluation",
            element: <CompetencyEvaluation />,
          },
        ],
      },
    ],
  },

  // {
  //   path: "/",
  //   element: <AuthenticatedLayout />,
  //   children: [
  //     {
  //       index: true,
  //       element: <Dashboard />,
  //     },
  //     {
  //       path: "login",
  //     },
  //     {
  //       path: "department-management",
  //       element: <DepartmentManagement />,
  //     },
  //     {
  //       path: "goal-management",
  //       element: <GoalManagement />,
  //     },
  //     {
  //       path: "performance-appraisal",
  //       element: <PerformanceAppraisal />,
  //     },
  //     {
  //       path: "performance-appraisal/:appraisalId",
  //       element: <AppraisalDetail />,
  //     },
  //     {
  //       path: "user-management",
  //       element: <UserManagement />,
  //     },
  //   ],
  // },
]);
const queryClient = new QueryClient();

// queryClient.setDefaultOptions();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);
