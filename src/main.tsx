import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { RouterProvider } from "react-router";
import { createBrowserRouter } from "react-router";

import RootLayout from "./routes/RootLayout";
import Dashboard from "./pages/Dashboard";
import DepartmentManagement from "./pages/DepartmentManagement";
import GoalManagement from "./pages/GoalManagement";
import PerformanceAppraisal from "./pages/PerformanceAppraisal";
import UserManagement from "./pages/UserManagement";

import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
    </QueryClientProvider>
  </StrictMode>,
);
