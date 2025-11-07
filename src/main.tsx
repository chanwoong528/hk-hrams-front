import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { createBrowserRouter } from "react-router";

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
