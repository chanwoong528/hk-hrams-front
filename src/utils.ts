import {
  ClipboardCheck,
  LayoutDashboard,
  Target,
  Users,
  TrendingUp,
  ListTodo,
  Settings,
  FileCog,
  UserCheck,
  Award,
  UserCog,
  LayoutTemplate,
  ClipboardEdit,
  FileText,
} from "lucide-react";

// admin true
// leader true

export const navigation = [
  {
    id: "dashboard" as Page,
    name: "대시보드",
    icon: LayoutDashboard,
    path: "/",
    admin: true,
  },
  {
    id: "dashboard-todo" as Page,
    name: "todo 대시보드",
    icon: ListTodo,
    path: "/todo",
  },

  {
    id: "organization-management" as Page,
    name: "조직 관리",
    icon: Users,
    path: "/organization-management",
    admin: true,
  },

  {
    id: "appraisals" as Page,
    name: "인사 평가",
    icon: ClipboardCheck,

    children: [
      {
        id: "appraisal-management" as Page,
        name: "인사 평가 관리",
        icon: Settings,
        path: "/performance-appraisal",
        admin: true,
      },
      {
        id: "goals" as Page,
        name: "목표 관리",
        icon: Target,
        path: "/goal-management",
      },
      {
        id: "competency-setting" as Page,
        name: "역량평가 문항 설정",
        path: "/competency-setting",
        icon: FileCog,
        // admin: true,
        leader: true,
      },
      {
        id: "competency-template-management" as Page,
        name: "역량 템플릿 관리",
        path: "/competency-template",
        icon: LayoutTemplate,
        leader: true,
      },
      {
        id: "competency-evaluation-self" as Page,
        name: "나의 역량 평가",
        path: "/competency-evaluation?mode=self",
        icon: UserCheck,
      },
      {
        id: "evaluation-report" as Page,
        name: "나의 평가 리포트",
        path: "/evaluation-report",
        icon: FileText,
      },
    ],
  },

  {
    id: "leader-appraisal" as Page,
    name: "리더 평가",
    icon: Award,
    children: [
      {
        id: "leader-reviews" as Page,
        name: "평가 및 대상자 관리",
        path: "/leader-appraisal/reviews",
        icon: UserCog,
        admin: true,
      },
      {
        id: "template-management" as Page,
        name: "평가 템플릿 관리",
        path: "/leader-appraisal/templates",
        icon: LayoutTemplate,
        admin: true,
      },
      {
        id: "my-leader-reviews" as Page,
        name: "나의 리더 평가",
        icon: ClipboardEdit,
        path: "/leader-appraisal/my",
      },
      {
        id: "my-leader-results" as Page,
        name: "나의 리더 평가 결과",
        icon: TrendingUp,
        path: "/leader-appraisal/results/my",
        admin: true,
      },
    ],
  },
];
export type Page =
  | "dashboard"
  | "dashboard-todo"
  | "users"
  | "departments"
  | "appraisals"
  | "appraisal-detail"
  | "goals"
  | "leader-appraisal"
  | "leader-reviews"
  | "template-management"
  | "my-leader-reviews"
  | "my-leader-results"
  | "competency-management"
  | "competency-setting"
  | "competency-evaluation-self"
  | "competency-evaluation-team";

export function pickChangedOnly<T extends { id: string | number }>(
  previousArray: ReadonlyArray<T>,
  newArray: ReadonlyArray<T>,
): T[] {
  const prevMap = new Map(previousArray.map((i) => [i.id, i]));
  const changed: T[] = [];

  for (const next of newArray) {
    const prev = prevMap.get(next.id);
    if (!prev) continue; // new item → skip (not "different from previous")
    if (!deepEqual(prev, next)) changed.push(next);
  }
  return changed;
}

/** Deep equality for plain data (objects/arrays/primitives). */
function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    a === null ||
    typeof b !== "object" ||
    b === null
  )
    return false;

  // Arrays
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }

  // Plain objects
  const ak = Object.keys(a as Record<string, unknown>);
  const bk = Object.keys(b as Record<string, unknown>);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (
      !deepEqual(
        (a as Record<string, unknown>)[k],
        (b as Record<string, unknown>)[k],
      )
    )
      return false;
  }
  return true;
}
export function symmetricDiffBy<T, K>(
  a: ReadonlyArray<T>,
  b: ReadonlyArray<T>,
  keySelector: (x: T) => K,
): { onlyInA: T[]; onlyInB: T[] } {
  const aKeys = new Set(a.map(keySelector));
  const bKeys = new Set(b.map(keySelector));
  return {
    onlyInA: a.filter((x) => !bKeys.has(keySelector(x))),
    onlyInB: b.filter((x) => !aKeys.has(keySelector(x))),
  };
}
