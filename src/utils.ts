import {
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  Target,
  Users,
} from "lucide-react";

export const navigation = [
  { id: "dashboard" as Page, name: "대시보드", icon: LayoutDashboard },
  { id: "users" as Page, name: "사용자 관리", icon: Users },
  { id: "departments" as Page, name: "부서 관리", icon: Building2 },
  { id: "appraisals" as Page, name: "성과 평가", icon: ClipboardCheck },
  { id: "goals" as Page, name: "목표 관리", icon: Target },
];
export type Page =
  | "dashboard"
  | "users"
  | "departments"
  | "appraisals"
  | "goals";
