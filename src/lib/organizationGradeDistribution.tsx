import type { User } from "@/pages/GoalManagement/type";

const RANK_SENTINEL_NO_ELIGIBLE = 999;

/** HR 소속 제외 평가자 중 department.rank 최소(가장 상위)인 사람의 성과 종합 평가(기말 우선, 없으면 중간) */
export function pickRankBasedDisplayAssessment(
  assessments: User["assessments"] | undefined,
  revieweeUserId: string,
): NonNullable<User["assessments"]>[number] | undefined {
  if (!assessments?.length) return undefined;
  const leaderPerf = assessments.filter(
    (a) =>
      a.assessedById &&
      a.assessedById !== revieweeUserId &&
      (a.assessType === "performance" || !a.assessType),
  );
  const finals = leaderPerf.filter((a) => a.assessTerm === "final");
  const mids = leaderPerf.filter((a) => a.assessTerm === "mid");
  const pool = finals.length > 0 ? finals : mids;
  if (!pool.length) return undefined;

  const withNonHrRank = pool.filter(
    (a) =>
      typeof a.assessorMinRankNonHr === "number" &&
      a.assessorMinRankNonHr < RANK_SENTINEL_NO_ELIGIBLE,
  );
  if (!withNonHrRank.length) return undefined;

  const sorted = [...withNonHrRank].sort((a, b) => {
    const ra = a.assessorMinRankNonHr ?? RANK_SENTINEL_NO_ELIGIBLE;
    const rb = b.assessorMinRankNonHr ?? RANK_SENTINEL_NO_ELIGIBLE;
    if (ra !== rb) return ra - rb;
    return (
      new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime()
    );
  });

  return sorted[0];
}

const PERFORMANCE_GRADE_LETTERS = [
  "O",
  "E",
  "M",
  "P",
  "N",
  "A",
  "B",
  "C",
] as const;

const GRADE_STACK_COLORS: Record<string, string> = {
  O: "bg-purple-500",
  E: "bg-blue-500",
  M: "bg-emerald-500",
  P: "bg-amber-500",
  N: "bg-red-500",
  A: "bg-indigo-500",
  B: "bg-sky-500",
  C: "bg-teal-500",
  기타: "bg-slate-400",
  미정: "bg-gray-200",
};

export function normalizePerformanceGradeLetter(
  grade: string | undefined,
): string | null {
  if (!grade) return null;
  const first = grade.trim().toUpperCase().charAt(0);
  if (
    PERFORMANCE_GRADE_LETTERS.includes(
      first as (typeof PERFORMANCE_GRADE_LETTERS)[number],
    )
  ) {
    return first;
  }
  return null;
}

export type GradeStackSegment = {
  key: string;
  count: number;
  pct: number;
  barClass: string;
};

export function buildOrganizationGradeStack(users: User[]): {
  segments: GradeStackSegment[];
  total: number;
  ariaSummary: string;
} {
  const total = users.length;
  if (total === 0) {
    return { segments: [], total: 0, ariaSummary: "데이터 없음" };
  }

  const letterCounts = new Map<string, number>();
  let undecided = 0;

  for (const u of users) {
    const disp = pickRankBasedDisplayAssessment(u.assessments, u.userId);
    const letter = normalizePerformanceGradeLetter(disp?.grade);
    if (!letter) {
      undecided += 1;
      continue;
    }
    letterCounts.set(letter, (letterCounts.get(letter) ?? 0) + 1);
  }

  const segments: GradeStackSegment[] = [];

  for (const g of PERFORMANCE_GRADE_LETTERS) {
    const count = letterCounts.get(g) ?? 0;
    if (count === 0) continue;
    segments.push({
      key: g,
      count,
      pct: (count / total) * 100,
      barClass: GRADE_STACK_COLORS[g] ?? GRADE_STACK_COLORS.기타,
    });
  }

  if (undecided > 0) {
    segments.push({
      key: "미정",
      count: undecided,
      pct: (undecided / total) * 100,
      barClass: GRADE_STACK_COLORS.미정,
    });
  }

  const ariaSummary = segments
    .map((s) => `${s.key} ${s.count}명 ${s.pct.toFixed(0)}퍼센트`)
    .join(", ");

  return { segments, total, ariaSummary };
}

export function OrganizationGradeStackedBar({ users }: { users: User[] }) {
  const { segments, total, ariaSummary } = buildOrganizationGradeStack(users);

  if (total === 0) {
    return null;
  }

  if (segments.length === 0) {
    return (
      <div className='w-full space-y-1.5'>
        <p className='text-xs text-muted-foreground'>
          조직 기준 등급이 있는 인원이 없습니다.
        </p>
        <div
          className='h-2.5 w-full rounded-full bg-gray-100 ring-1 ring-inset ring-gray-200'
          role='img'
          aria-label='등급 분포 없음'
        />
      </div>
    );
  }

  return (
    <div className='w-full space-y-2'>
      <div className='flex flex-wrap items-baseline justify-between gap-2'>
        <p className='text-xs font-medium text-gray-500'>조직 기준 등급 분포</p>
        <span className='text-[11px] text-muted-foreground tabular-nums'>
          전체 {total}명
        </span>
      </div>
      <div
        className='flex h-3 w-full overflow-hidden rounded-full bg-gray-100 ring-1 ring-inset ring-gray-200'
        role='img'
        aria-label={`조직 기준 등급 비율: ${ariaSummary}`}>
        {segments.map((s) => (
          <div
            key={s.key}
            style={{ width: `${s.pct}%` }}
            className={`${s.barClass} min-w-px shrink-0 transition-[width] duration-300`}
            title={`${s.key}: ${s.count}명 (${s.pct.toFixed(1)}%)`}
          />
        ))}
      </div>
      <ul className='flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-gray-600 list-none p-0 m-0'>
        {segments.map((s) => (
          <li
            key={s.key}
            className='inline-flex items-center gap-1.5 tabular-nums'>
            <span
              className={`size-2 shrink-0 rounded-full ${s.barClass}`}
              aria-hidden
            />
            <span className='font-medium text-gray-800'>{s.key}</span>
            <span className='text-muted-foreground'>
              {s.pct.toFixed(0)}% · {s.count}명
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
