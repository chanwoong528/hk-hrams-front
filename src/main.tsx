import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { createBrowserRouter } from "react-router";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import RootLayout from "./routes/RootLayout";
import Dashboard from "./pages/Dashboard";
import DepartmentManagement from "./pages/DepartmentManagement/DepartmentManagement";
import GoalManagement from "./pages/GoalManagement";
import PerformanceAppraisal from "./pages/PerformanceAppraisal/PerformanceAppraisal";
import AppraisalDetail from "./pages/PerformanceAppraisal/AppraisalDetail/AppraisalDetail";

import UserManagement from "./pages/UserManagement/UserManagement";

import { Toaster } from "@/components/ui/sonner";

import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
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
        path: "performance-appraisal",
        element: <PerformanceAppraisal />,
      },
      {
        path: "performance-appraisal/:appraisalType",
        element: <AppraisalDetail />,
      },
      {
        path: "user-management",
        element: <UserManagement />,
      },
    ],
  },
]);
const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);
