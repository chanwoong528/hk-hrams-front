import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createBrowserRouter } from "react-router-dom";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import RootLayout from "@/components/layout/RootLayout";
import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";

import Dashboard from "@/pages/Dashboard";
import DepartmentManagement from "@/pages/DepartmentManagement/DepartmentManagement";
import GoalManagement from "@/pages/GoalManagement/GoalManagement";
import PerformanceAppraisal from "@/pages/PerformanceAppraisal/PerformanceAppraisal";
import AppraisalDetail from "@/pages/PerformanceAppraisal/AppraisalDetail/AppraisalDetail";
import UserManagement from "@/pages/UserManagement/UserManagement";
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
            element: <Dashboard />,
          },
          {
            path: "department-management",
            element: <DepartmentManagement />,
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
            element: <PerformanceAppraisal />,
          },
          {
            path: "performance-appraisal/:appraisalId",
            element: <AppraisalDetail />,
          },
          {
            path: "leader-appraisal/reviews",
            element: <LeaderReviewManagement />,
          },
          {
            path: "leader-appraisal/templates",
            element: <TemplateManagement />,
          },
          {
            path: "leader-appraisal/templates/new",
            element: <TemplateGenerator />,
          },
          {
            path: "leader-appraisal/templates/:templateId/edit",
            element: <TemplateGenerator />,
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
            element: <MyLeaderResults />,
          },
          {
            path: "leader-appraisal/results/:reviewId",
            element: <LeaderResultDetail />,
          },
          {
            path: "user-management",
            element: <UserManagement />,
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
