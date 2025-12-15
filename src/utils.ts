import {
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  Target,
  Users,
} from "lucide-react";

export const navigation = [
  {
    id: "dashboard" as Page,
    name: "대시보드",
    icon: LayoutDashboard,
    path: "/",
  },
  {
    id: "users" as Page,
    name: "사용자 관리",
    icon: Users,
    path: "/user-management",
  },
  {
    id: "departments" as Page,
    name: "부서 관리",
    icon: Building2,
    path: "/department-management",
  },
  {
    id: "appraisals" as Page,
    name: "성과 평가",
    icon: ClipboardCheck,
    path: "/performance-appraisal",
    children: [],
  },
  {
    id: "appraisal-detail" as Page,
    name: "성과 평가 상세",
    icon: ClipboardCheck,
    path: "/performance-appraisal/:appraisalId",
    detailPage: true,
  },

  {
    id: "goals" as Page,
    name: "목표 관리",
    icon: Target,
    path: "/goal-management",
  },
  {
    id: "leader-appraisal" as Page,
    name: "리더 평가 관리",
    icon: Users, // Assuming Users icon for leader appraisal
    children: [
      {
        id: "leader-reviews" as Page,
        name: "평가 및 대상자 관리",
        path: "/leader-appraisal/reviews",
        icon: Users,
      },
      {
        id: "template-management" as Page,
        name: "평가 템플릿 관리",
        path: "/leader-appraisal/templates",
        icon: ClipboardCheck,
      },
    ],
  },
];
export type Page =
  | "dashboard"
  | "users"
  | "departments"
  | "appraisals"
  | "appraisal-detail"
  | "goals"
  | "leader-appraisal"
  | "leader-reviews"
  | "template-management";

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
