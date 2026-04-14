import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "@uidotdev/usehooks";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Handle,
  Position,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChevronDown, Loader2, MapPin, RefreshCw, Save, Trash2, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { GET_users, type HramsUserType } from "@/api/user/user";
import {
  DELETE_leaderReviewEvaluateePoolExtra,
  GET_leaderReviewGlobalEvaluateeMappingBoard,
  PATCH_leaderReviewEvaluationSubject,
  POST_leaderReviewEvaluateeMappingSyncAuto,
  POST_leaderReviewEvaluateePoolExtra,
  PUT_leaderReviewGlobalEvaluateeMappings,
  applyExtraPoolUserIdsToEvaluatees,
  collectLeaderReviewExtraPoolUserIdsFromPayload,
  type EvaluateeUser,
  type GlobalLeaderSubject,
  type LeaderReviewGlobalMappingBoard,
} from "@/api/leader-review-evaluatee-mapping/leader-review-evaluatee-mapping";

const LEADER_X = 32;
/** 넓은 간격으로 엣지가 덜 겹쳐 보이게 */
const USER_X = 600;
const ROW_GAP = 80;
const Y_TOP = 36;

const FOCUS_DIM_NODE_OPACITY = 0.5;
const FOCUS_DIM_EDGE_OPACITY = 0.38;
/** 보드에 그려질 때 자동 매핑(점선) 엣지 기본 불투명도 */
const SAVED_AUTO_MAPPING_EDGE_OPACITY = 0.78;
/** 중앙 맵 영역 높이 (뷰포트 기준) */
const MAP_CANVAS_HEIGHT_CLASS =
  "h-[calc(100vh-20rem)] min-h-[400px] w-full max-h-[min(72vh,880px)]";

/** 그룹 헤더 노드 높이 + 아래 여백(대략) — 레이아웃 간격 계산용 */
const GROUP_HEADER_BLOCK = 44;
const GROUP_AFTER_GAP = 18;

type LeaderNodeData = {
  title: string;
  subtitle: string;
  isEvaluationSubject: boolean;
};

type EvaluateeNodeData = {
  title: string;
  subtitle: string;
  poolSource: "default" | "extra_pool";
  /** 조직도에서 리더로 지정된 경우(왼쪽 리더 목록에도 해당) */
  isAlsoLeader: boolean;
  /** 플로우·포커스에서 부서 그룹 단위로 묶기 위한 인덱스 */
  groupIndex: number;
};

type EvaluateeGroupLabelData = {
  label: string;
  memberCount: number;
  groupIndex: number;
};

type MappingEdgeData = { origin: "auto" | "manual" };

function readNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const t = value.trim();
  return t.length > 0 ? t : undefined;
}

function readDepartmentNamesFromUnknown(raw: unknown): string[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const t = item.trim();
      if (t) {
        out.push(t);
      }
      continue;
    }
    if (item && typeof item === "object" && "departmentName" in item) {
      const t = readNonEmptyString((item as { departmentName?: unknown }).departmentName);
      if (t) {
        out.push(t);
      }
    }
  }
  return out;
}

/** API가 camelCase / snake_case / 래핑 형태로 줄 때 보드를 한 형태로 맞춤 */
function unwrapGlobalMappingBoardPayload(res: unknown): LeaderReviewGlobalMappingBoard | null {
  if (!res || typeof res !== "object") {
    return null;
  }
  const top = res as Record<string, unknown>;
  const inner = top.data;
  const candidates: unknown[] = [top];
  if (inner && typeof inner === "object") {
    candidates.push(inner);
  }
  for (const c of candidates) {
    const o = c as Record<string, unknown>;
    const leaderSubjects = o.leaderSubjects ?? o.leader_subjects;
    const evaluatees = o.evaluatees ?? o.evaluatee_users ?? o.evaluateeUsers;
    const mappings = o.mappings ?? o.mapping_list;
    if (
      Array.isArray(leaderSubjects) &&
      Array.isArray(evaluatees) &&
      Array.isArray(mappings)
    ) {
      return {
        leaderSubjects: leaderSubjects as GlobalLeaderSubject[],
        evaluatees: evaluatees as EvaluateeUser[],
        mappings: mappings as LeaderReviewGlobalMappingBoard["mappings"],
      };
    }
  }
  return null;
}

function evaluateePrimaryGroupKey(departmentNames: string[]): string {
  if (!departmentNames.length) {
    return "부서 미지정";
  }
  const first = departmentNames[0]?.trim();
  return first || "부서 미지정";
}

function normalizeEvaluateePoolSource(raw: unknown): "default" | "extra_pool" {
  if (raw === true || raw === 1) {
    return "extra_pool";
  }
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase().replace(/-/g, "_");
    const extraLike = new Set([
      "extra_pool",
      "extrapool",
      "extra",
      "manual_pool",
      "pool_extra",
      "extra_candidate",
      "candidate_extra",
      "supplement",
      "additional_pool",
    ]);
    if (extraLike.has(s)) {
      return "extra_pool";
    }
  }
  return "default";
}

function readPoolSourceRawFromEvaluateeRecord(o: Record<string, unknown>): unknown {
  if (o.isExtraPool === true || o.fromExtraPool === true || o.inExtraPool === true) {
    return true;
  }
  return (
    o.poolSource ??
    o.pool_source ??
    o.poolType ??
    o.pool_type ??
    o.evaluateePoolSource ??
    o.evaluatee_pool_source
  );
}

function normalizeEvaluateeUserFromApi(raw: unknown): EvaluateeUser | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const uidRaw = o.userId ?? o.user_id;
  const userId =
    typeof uidRaw === "string"
      ? readNonEmptyString(uidRaw)
      : uidRaw != null && uidRaw !== ""
        ? String(uidRaw).trim() || undefined
        : undefined;
  const koreanName =
    readNonEmptyString(o.koreanName) ??
    readNonEmptyString(o.korean_name) ??
    readNonEmptyString(o.name);
  if (!userId || !koreanName) {
    return null;
  }
  const departmentNamesFromNames =
    readDepartmentNamesFromUnknown(o.departmentNames).length > 0
      ? readDepartmentNamesFromUnknown(o.departmentNames)
      : readDepartmentNamesFromUnknown(o.department_names);
  const departmentNames =
    departmentNamesFromNames.length > 0
      ? departmentNamesFromNames
      : readDepartmentNamesFromUnknown(o.departments);

  const poolSource = normalizeEvaluateePoolSource(readPoolSourceRawFromEvaluateeRecord(o));

  return {
    userId,
    koreanName,
    departmentNames,
    poolSource,
  };
}

function normalizeLeaderReviewMappingBoard(
  board: LeaderReviewGlobalMappingBoard,
): LeaderReviewGlobalMappingBoard {
  const mapped = (board.evaluatees ?? [])
    .map((e) => {
      const coerced = normalizeEvaluateeUserFromApi(e);
      if (coerced) {
        return coerced;
      }
      const x = e as Partial<EvaluateeUser> & Record<string, unknown>;
      if (typeof x.userId === "string" && typeof x.koreanName === "string") {
        return {
          userId: x.userId,
          koreanName: x.koreanName,
          departmentNames: Array.isArray(x.departmentNames)
            ? (x.departmentNames as string[])
            : [],
          poolSource: normalizeEvaluateePoolSource(
            readPoolSourceRawFromEvaluateeRecord(x) ?? x.poolSource,
          ),
        } satisfies EvaluateeUser;
      }
      return null;
    })
    .filter((e): e is EvaluateeUser => e !== null);
  return {
    ...board,
    evaluatees: mapped,
  };
}

function departmentNamesFromSearchUser(user: HramsUserType): string[] {
  if (!Array.isArray(user.departments)) {
    return [];
  }
  return user.departments
    .map((d) =>
      typeof d === "object" && d !== null && "departmentName" in d
        ? String((d as { departmentName?: string }).departmentName ?? "")
        : "",
    )
    .filter(Boolean);
}

function buildLeaderConnectedEvaluateeIds(
  board: LeaderReviewGlobalMappingBoard,
  leaderUserId: string,
  edgesSnapshot: Edge[],
): Set<string> {
  const src = `l-${leaderUserId}`;
  const ids = new Set<string>();
  for (const m of board.mappings) {
    if (m.leaderUserId === leaderUserId) {
      ids.add(m.evaluateeUserId);
    }
  }
  for (const e of edgesSnapshot) {
    if (e.source === src && e.target.startsWith("u-")) {
      ids.add(e.target.replace(/^u-/, ""));
    }
  }
  return ids;
}

/**
 * 맵·오른쪽 목록: 선택 리더와 연결된 피평가자 + extra 풀에만 있어 아직 그 리더와 연결되지 않은 인원.
 */
function collectEvaluateesForLeaderCanvas(
  board: LeaderReviewGlobalMappingBoard,
  leaderUserId: string,
  edgesSnapshot: Edge[],
): EvaluateeUser[] {
  const connected = buildLeaderConnectedEvaluateeIds(board, leaderUserId, edgesSnapshot);
  const byId = new Map<string, EvaluateeUser>();
  for (const e of board.evaluatees) {
    if (connected.has(e.userId)) {
      byId.set(e.userId, e);
    }
  }
  for (const e of board.evaluatees) {
    if (normalizeEvaluateePoolSource(e.poolSource) === "extra_pool" && !byId.has(e.userId)) {
      byId.set(e.userId, e);
    }
  }
  return [...byId.values()].sort((a, b) => a.koreanName.localeCompare(b.koreanName, "ko"));
}

function buildEvaluateeGroups(evaluatees: EvaluateeUser[]): {
  key: string;
  members: EvaluateeUser[];
}[] {
  const map = new Map<string, EvaluateeUser[]>();
  for (const e of evaluatees) {
    const k = evaluateePrimaryGroupKey(e.departmentNames);
    if (!map.has(k)) {
      map.set(k, []);
    }
    map.get(k)!.push(e);
  }
  const keys = [...map.keys()].sort((a, b) => a.localeCompare(b, "ko"));
  return keys.map((key) => ({
    key,
    members: (map.get(key) ?? []).sort((a, b) =>
      a.koreanName.localeCompare(b.koreanName, "ko"),
    ),
  }));
}

function collectHighlightedGroupIndices(
  highlightedIds: Set<string>,
  nodes: Node[],
): Set<number> {
  const indices = new Set<number>();
  for (const id of highlightedIds) {
    if (!id.startsWith("u-")) {
      continue;
    }
    const n = nodes.find((x) => x.id === id);
    const gi = (n?.data as EvaluateeNodeData | undefined)?.groupIndex;
    if (typeof gi === "number") {
      indices.add(gi);
    }
  }
  return indices;
}

function buildFocusHighlightNodeIds(leaderUserId: string, edges: Edge[]): Set<string> {
  const leaderNodeId = `l-${leaderUserId}`;
  const ids = new Set<string>([leaderNodeId]);
  for (const e of edges) {
    if (e.source === leaderNodeId) {
      ids.add(e.target);
    }
  }
  return ids;
}

function withLeaderFocusVisuals(
  nodes: Node[],
  edges: Edge[],
  focusLeaderUserId: string | null,
): { nodes: Node[]; edges: Edge[] } {
  if (!focusLeaderUserId) {
    return { nodes, edges };
  }
  const leaderNodeId = `l-${focusLeaderUserId}`;
  const highlightedNodes = buildFocusHighlightNodeIds(focusLeaderUserId, edges);
  const highlightedGroupIndices = collectHighlightedGroupIndices(
    highlightedNodes,
    nodes,
  );

  const nextNodes = nodes.map((n) => {
    let active = highlightedNodes.has(n.id);
    if (!active && n.type === "evaluateeGroupLabel") {
      const gi = (n.data as EvaluateeGroupLabelData).groupIndex;
      active = highlightedGroupIndices.has(gi);
    }
    const baseStyle = (n.style ?? {}) as CSSProperties;
    return {
      ...n,
      zIndex: active ? 2 : 0,
      style: {
        ...baseStyle,
        opacity: active ? 1 : FOCUS_DIM_NODE_OPACITY,
      },
    };
  });

  const nextEdges = edges.map((e) => {
    const active = e.source === leaderNodeId;
    const baseStyle = (e.style ?? {}) as CSSProperties;
    return {
      ...e,
      zIndex: active ? 1 : 0,
      style: {
        ...baseStyle,
        opacity: active ? 1 : FOCUS_DIM_EDGE_OPACITY,
      },
    };
  });

  return { nodes: nextNodes, edges: nextEdges };
}

function deptLabel(names: string[]) {
  if (!names.length) return "부서 미지정";
  return names.join(", ");
}

function matchesSearch(
  name: string,
  deptNames: string[],
  q: string,
): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const dept = deptNames.join(" ").toLowerCase();
  return name.toLowerCase().includes(s) || dept.includes(s);
}

function EvaluateeGroupLabelNode(props: NodeProps) {
  const data = props.data as EvaluateeGroupLabelData;
  return (
    <div
      className="pointer-events-none min-w-[188px] max-w-[240px] rounded-md border border-dashed border-slate-300/90 bg-slate-100/95 px-2.5 py-1.5 shadow-sm dark:border-slate-600 dark:bg-slate-900/80"
      aria-hidden
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        부서 그룹
      </div>
      <div className="mt-0.5 line-clamp-2 text-xs font-medium text-foreground">{data.label}</div>
      <div className="mt-0.5 text-[10px] text-muted-foreground">{data.memberCount}명</div>
    </div>
  );
}

function LeaderSubjectNode(props: NodeProps) {
  const data = props.data as LeaderNodeData;
  const inactive = !data.isEvaluationSubject;
  return (
    <div
      className={cn(
        "min-w-[168px] max-w-[220px] rounded-lg border px-3 py-2 text-left shadow-sm",
        inactive
          ? "border-muted-foreground/30 bg-muted/55 opacity-85"
          : "border-amber-200 bg-amber-50/90 dark:border-amber-900/50 dark:bg-amber-950/40",
      )}
    >
      <div
        className={cn(
          "text-xs font-semibold uppercase tracking-wide",
          inactive
            ? "text-muted-foreground"
            : "text-amber-800 dark:text-amber-200",
        )}
      >
        리더 (평가 대상)
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{data.title}</div>
      <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
        {data.subtitle}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!h-3 !w-3 !border-2 !border-background",
          inactive
            ? "pointer-events-none !bg-muted-foreground/40"
            : "!bg-amber-600",
        )}
        aria-label="피평가자로 연결"
      />
    </div>
  );
}

function EvaluateeUserNode(props: NodeProps) {
  const data = props.data as EvaluateeNodeData;
  return (
    <div className="min-w-[168px] max-w-[220px] rounded-lg border border-sky-200 bg-sky-50/90 px-3 py-2 text-left shadow-sm dark:border-sky-900/50 dark:bg-sky-950/40">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-background !bg-sky-600"
        aria-label="리더에서 연결"
      />
      <div className="flex items-start justify-between gap-1">
        <div className="text-xs font-semibold uppercase tracking-wide text-sky-800 dark:text-sky-200">
          피평가자
        </div>
        <div className="flex max-w-[min(100%,9.5rem)] shrink-0 flex-wrap items-center justify-end gap-1">
          {data.isAlsoLeader ? (
            <span
              className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-950 dark:bg-amber-400/15 dark:text-amber-100"
              title="조직도에서 리더로 지정된 인원입니다."
            >
              리더
            </span>
          ) : null}
          {data.poolSource === "extra_pool" ? (
            <span className="rounded bg-sky-900/10 px-1.5 py-0.5 text-[10px] font-medium text-sky-900 dark:bg-sky-300/15 dark:text-sky-100">
              추가
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-1 text-sm font-medium text-foreground">{data.title}</div>
      <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
        {data.subtitle}
      </div>
    </div>
  );
}

const nodeTypes = {
  leaderSubject: LeaderSubjectNode,
  evaluateeUser: EvaluateeUserNode,
  evaluateeGroupLabel: EvaluateeGroupLabelNode,
} satisfies NodeTypes;

const LEGEND_SAMPLE_LINE_WIDTH_PX = 36;
const LEGEND_LINE_STROKE_CLASS = "border-foreground/75 dark:border-foreground/80";

function MappingConnectionLegend({
  autoEdgeCount,
  manualEdgeCount,
}: {
  autoEdgeCount: number;
  manualEdgeCount: number;
}) {
  return (
    <div
      className="rounded-md border bg-card px-3 py-2 shadow-sm"
      role="region"
      aria-label="연결선 종류 안내"
    >
      <p className="text-xs font-medium text-foreground">연결선 범례</p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        현재 연결: 자동 {autoEdgeCount} · 수동 {manualEdgeCount}
      </p>
      <ul className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-2">
        <li className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="sr-only">점선 연결:</span>
          <span
            className={cn(
              "box-border block h-0 shrink-0 border-t-2 border-dashed bg-transparent",
              LEGEND_LINE_STROKE_CLASS,
            )}
            style={{ width: LEGEND_SAMPLE_LINE_WIDTH_PX }}
            aria-hidden
          />
          <span>
            <span className="font-medium text-foreground">점선</span>
            — 자동 매핑(조직도 기반). 삭제로 끊을 수 없습니다.
          </span>
        </li>
        <li className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="sr-only">실선 연결:</span>
          <span
            className={cn(
              "box-border block h-0 shrink-0 border-t-2 border-solid bg-transparent",
              LEGEND_LINE_STROKE_CLASS,
            )}
            style={{ width: LEGEND_SAMPLE_LINE_WIDTH_PX }}
            aria-hidden
          />
          <span>
            <span className="font-medium text-foreground">실선</span>
            — 수동 매핑(직접 연결). 선택 후 삭제할 수 있습니다.
          </span>
        </li>
      </ul>
    </div>
  );
}

function boardToFlow(
  leaders: GlobalLeaderSubject[],
  evaluatees: EvaluateeUser[],
  mappings: LeaderReviewGlobalMappingBoard["mappings"],
  /** 캔버스에 비활성 리더를 숨겨도, 조직 리더 여부 판별에는 전체 목록 기준 */
  allLeaderSubjectUserIds: ReadonlySet<string>,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const leaderIdSet = new Set(leaders.map((l) => l.userId));
  const evaluateeIdSet = new Set(evaluatees.map((e) => e.userId));

  const nL = leaders.length;
  leaders.forEach((l, i) => {
    const y = nL <= 1 ? Y_TOP + 120 : Y_TOP + (i / (nL - 1)) * Math.max(320, (nL - 1) * ROW_GAP);
    nodes.push({
      id: `l-${l.userId}`,
      type: "leaderSubject",
      position: { x: LEADER_X, y },
      data: {
        title: l.koreanName,
        subtitle: deptLabel(l.departmentNames),
        isEvaluationSubject: l.isEvaluationSubject,
      } satisfies LeaderNodeData,
    });
  });

  const groups = buildEvaluateeGroups(evaluatees);
  let cursorY = Y_TOP;
  groups.forEach((g, groupIndex) => {
    nodes.push({
      id: `grp-${groupIndex}`,
      type: "evaluateeGroupLabel",
      position: { x: USER_X - 10, y: cursorY },
      draggable: false,
      selectable: false,
      focusable: false,
      data: {
        label: g.key,
        memberCount: g.members.length,
        groupIndex,
      } satisfies EvaluateeGroupLabelData,
    });
    cursorY += GROUP_HEADER_BLOCK;
    for (const e of g.members) {
      nodes.push({
        id: `u-${e.userId}`,
        type: "evaluateeUser",
        position: { x: USER_X, y: cursorY },
        data: {
          title: e.koreanName,
          subtitle: deptLabel(e.departmentNames),
          poolSource: e.poolSource,
          isAlsoLeader: allLeaderSubjectUserIds.has(e.userId),
          groupIndex,
        } satisfies EvaluateeNodeData,
      });
      cursorY += ROW_GAP;
    }
    cursorY += GROUP_AFTER_GAP;
  });

  for (const m of mappings) {
    if (!leaderIdSet.has(m.leaderUserId) || !evaluateeIdSet.has(m.evaluateeUserId)) {
      continue;
    }
    const isAuto = m.isAutoGenerated === true;
    edges.push({
      id: `saved-${m.leaderUserId}-${m.evaluateeUserId}`,
      source: `l-${m.leaderUserId}`,
      target: `u-${m.evaluateeUserId}`,
      type: "default",
      /** 대량 데이터에서 움직이는 점선은 시각적·성능 부담이 커서 끔 */
      animated: false,
      deletable: !isAuto,
      selectable: true,
      // theme 토큰은 oklch — SVG stroke 에는 var(--token) 만 쓰면 됨 (hsl(var(--primary)/α) 는 무효)
      style: isAuto
        ? {
            strokeDasharray: "6 4",
            strokeWidth: 1.65,
            stroke: "var(--muted-foreground)",
            opacity: SAVED_AUTO_MAPPING_EDGE_OPACITY,
          }
        : {
            strokeWidth: 2.25,
            stroke: "var(--primary)",
          },
      data: { origin: isAuto ? "auto" : "manual" } satisfies MappingEdgeData,
    });
  }

  return { nodes, edges };
}

function edgesToManualLinks(edges: Edge[]) {
  const links: Array<{ leaderUserId: string; evaluateeUserId: string }> = [];

  for (const e of edges) {
    const origin = (e.data as MappingEdgeData | undefined)?.origin;
    if (origin === "auto") {
      continue;
    }
    if (!e.source.startsWith("l-") || !e.target.startsWith("u-")) {
      continue;
    }
    links.push({
      leaderUserId: e.source.replace(/^l-/, ""),
      evaluateeUserId: e.target.replace(/^u-/, ""),
    });
  }
  return links;
}

type PanTarget =
  | null
  | { kind: "node"; id: string }
  | { kind: "group"; groupIndex: number };

function MappingFlowViewport({
  panTarget,
  onPanHandled,
}: {
  panTarget: PanTarget;
  onPanHandled: () => void;
}) {
  const { fitView, getNode, getNodes } = useReactFlow();

  useEffect(() => {
    if (!panTarget) {
      return;
    }
    let cancelled = false;
    const done = () => {
      if (!cancelled) {
        onPanHandled();
      }
    };

    if (panTarget.kind === "node") {
      const node = getNode(panTarget.id);
      if (!node) {
        done();
        return;
      }
      void fitView({
        nodes: [node],
        padding: 0.42,
        duration: 300,
        maxZoom: 1.05,
        minZoom: 0.35,
      }).finally(done);
    } else {
      const groupNodes = getNodes().filter((n) => {
        const d = n.data as { groupIndex?: number } | undefined;
        return typeof d?.groupIndex === "number" && d.groupIndex === panTarget.groupIndex;
      });
      if (groupNodes.length === 0) {
        done();
        return;
      }
      void fitView({
        nodes: groupNodes,
        padding: 0.36,
        duration: 300,
        maxZoom: 1,
        minZoom: 0.28,
      }).finally(done);
    }

    return () => {
      cancelled = true;
    };
  }, [panTarget, fitView, getNode, getNodes, onPanHandled]);

  return null;
}

export default function MultiRaterEvaluateeMapping() {
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  const [leaderListSearch, setLeaderListSearch] = useState("");
  const [evaluateeListSearch, setEvaluateeListSearch] = useState("");
  const [addPoolOpen, setAddPoolOpen] = useState(false);
  const [addPoolKeyword, setAddPoolKeyword] = useState("");
  const debouncedAddKeyword = useDebounce(addPoolKeyword, 400);
  /** 리더 노드 클릭 시 해당 리더·연결만 강조 (패널 클릭으로 해제) */
  const [focusLeaderUserId, setFocusLeaderUserId] = useState<string | null>(null);
  /** 왼쪽에서 리더 선택 시 맵·피평가 목록을 그 리더 연결만으로 한정 */
  const [panelLeaderFilterUserId, setPanelLeaderFilterUserId] = useState<string | null>(null);
  /** 사이드 목록에서 이름 클릭 시 해당 노드로 뷰 이동 */
  const [panTarget, setPanTarget] = useState<PanTarget>(null);

  const onFlowPanHandled = useCallback(() => {
    setPanTarget(null);
  }, []);

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) =>
        applyEdgeChanges(
          changes.filter((ch) => {
            if (ch.type !== "remove") {
              return true;
            }
            const edge = eds.find((item) => item.id === ch.id);
            return (edge?.data as MappingEdgeData | undefined)?.origin !== "auto";
          }),
          eds,
        ),
      );
    },
    [setEdges],
  );

  const { data: boardRes, isLoading: loadingBoard, isError, error } = useQuery<
    LeaderReviewGlobalMappingBoard,
    Error
  >({
    queryKey: ["leader-review-global-evaluatee-mapping-board"],
    queryFn: async () => {
      const boardHttpData = await GET_leaderReviewGlobalEvaluateeMappingBoard();
      const raw =
        unwrapGlobalMappingBoardPayload(boardHttpData) ??
        unwrapGlobalMappingBoardPayload((boardHttpData as { data?: unknown }).data);
      if (!raw) {
        throw new Error("매핑 보드 응답이 비어 있거나 형식이 올바르지 않습니다.");
      }
      const extraUserIds = new Set(
        collectLeaderReviewExtraPoolUserIdsFromPayload(boardHttpData),
      );
      const normalized = normalizeLeaderReviewMappingBoard(raw);
      return applyExtraPoolUserIdsToEvaluatees(normalized, extraUserIds);
    },
  });

  const boardErrorToastRef = useRef(false);
  useEffect(() => {
    if (!isError || !error) {
      return;
    }
    if (boardErrorToastRef.current) return;
    boardErrorToastRef.current = true;
    const err = error as {
      message?: string;
      response?: { data?: { message?: string } };
    };
    const msg =
      err.response?.data?.message ??
      err.message ??
      "매핑 데이터를 불러오지 못했습니다.";
    toast.error(msg);
  }, [isError, error]);

  useEffect(() => {
    if (!isError) {
      boardErrorToastRef.current = false;
    }
  }, [isError]);

  const panelLeaderFilterResolved = useMemo(() => {
    if (!panelLeaderFilterUserId || !boardRes) {
      return null;
    }
    return boardRes.leaderSubjects.some((l) => l.userId === panelLeaderFilterUserId)
      ? panelLeaderFilterUserId
      : null;
  }, [panelLeaderFilterUserId, boardRes]);

  useEffect(() => {
    if (panelLeaderFilterResolved !== panelLeaderFilterUserId) {
      setPanelLeaderFilterUserId(panelLeaderFilterResolved);
    }
  }, [panelLeaderFilterResolved, panelLeaderFilterUserId]);

  const filteredLeaderConnectedIdsKey = useMemo(() => {
    if (!panelLeaderFilterResolved || !boardRes) {
      return "";
    }
    const ids = buildLeaderConnectedEvaluateeIds(
      boardRes,
      panelLeaderFilterResolved,
      edges,
    );
    return [...ids].sort().join("|");
  }, [panelLeaderFilterResolved, boardRes, edges]);

  useEffect(() => {
    if (!boardRes) {
      setNodes([]);
      setEdges([]);
      setFocusLeaderUserId(null);
      return;
    }
    const filterId = panelLeaderFilterResolved;
    if (!filterId) {
      setNodes([]);
      setEdges([]);
      setFocusLeaderUserId(null);
      return;
    }

    const allLeaderSubjectUserIds = new Set(
      boardRes.leaderSubjects.map((l) => l.userId),
    );

    const leaderRecord = boardRes.leaderSubjects.find((x) => x.userId === filterId);
    const leadersPayload = leaderRecord ? [leaderRecord] : [];
    const mappingsPayload = boardRes.mappings.filter((m) => m.leaderUserId === filterId);
    const evaluateesPayload = collectEvaluateesForLeaderCanvas(boardRes, filterId, edges);

    const { nodes: n, edges: ed } = boardToFlow(
      leadersPayload,
      evaluateesPayload,
      mappingsPayload,
      allLeaderSubjectUserIds,
    );
    setNodes(n);
    setEdges((prev) => {
      const connectionKey = (e: Edge) => `${e.source}|${e.target}`;
      const merged = new Map<string, Edge>();
      const usedConnections = new Set<string>();
      for (const e of ed) {
        merged.set(e.id, e);
        usedConnections.add(connectionKey(e));
      }
      for (const e of prev) {
        if ((e.data as MappingEdgeData | undefined)?.origin !== "manual") {
          continue;
        }
        if (e.source !== `l-${filterId}`) {
          continue;
        }
        if (merged.has(e.id)) {
          continue;
        }
        const ck = connectionKey(e);
        if (usedConnections.has(ck)) {
          continue;
        }
        usedConnections.add(ck);
        merged.set(e.id, e);
      }
      return [...merged.values()];
    });
  }, [boardRes, panelLeaderFilterResolved, filteredLeaderConnectedIdsKey, setNodes, setEdges]);

  const focusLeaderForVisuals = focusLeaderUserId ?? panelLeaderFilterResolved;

  const { nodes: visualNodes, edges: visualEdgesAfterFocus } = useMemo(
    () => withLeaderFocusVisuals(nodes, edges, focusLeaderForVisuals),
    [nodes, edges, focusLeaderForVisuals],
  );

  const visualEdges = useMemo(() => visualEdgesAfterFocus, [visualEdgesAfterFocus]);

  const onNodeClick = useCallback(
    (_event: ReactMouseEvent, node: Node) => {
      if (node.type !== "leaderSubject" || !node.id.startsWith("l-")) {
        return;
      }
      const id = node.id.slice(2);
      setFocusLeaderUserId((cur) => (cur === id ? null : id));
    },
    [],
  );

  const onPaneClick = useCallback(() => {
    setFocusLeaderUserId(null);
  }, []);

  const subjectMutation = useMutation({
    mutationFn: async (payload: { userId: string; isEvaluationSubject: boolean }) =>
      PATCH_leaderReviewEvaluationSubject(payload.userId, payload.isEvaluationSubject),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["leader-review-global-evaluatee-mapping-board"],
      });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "설정을 저장하지 못했습니다.";
      toast.error(msg);
    },
  });

  const addPoolMutation = useMutation({
    mutationFn: async (user: HramsUserType) => {
      await POST_leaderReviewEvaluateePoolExtra(user.userId);
      return user;
    },
    onSuccess: (user) => {
      toast.success("피평가 후보 풀에 추가했습니다.");
      setAddPoolOpen(false);
      setAddPoolKeyword("");
      queryClient.setQueryData<LeaderReviewGlobalMappingBoard | undefined>(
        ["leader-review-global-evaluatee-mapping-board"],
        (old) => {
          if (!old) {
            return old;
          }
          const idx = old.evaluatees.findIndex((e) => e.userId === user.userId);
          if (idx >= 0) {
            const prevRow = old.evaluatees[idx]!;
            const depts = departmentNamesFromSearchUser(user);
            const nextRow: EvaluateeUser = {
              ...prevRow,
              koreanName: user.koreanName || prevRow.koreanName,
              departmentNames: depts.length > 0 ? depts : prevRow.departmentNames,
              poolSource: "extra_pool",
            };
            const nextEvaluatees = [...old.evaluatees];
            nextEvaluatees[idx] = nextRow;
            return normalizeLeaderReviewMappingBoard({
              ...old,
              evaluatees: nextEvaluatees,
            });
          }
          const nextEvaluatee: EvaluateeUser = {
            userId: user.userId,
            koreanName: user.koreanName,
            departmentNames: departmentNamesFromSearchUser(user),
            poolSource: "extra_pool",
          };
          return normalizeLeaderReviewMappingBoard({
            ...old,
            evaluatees: [...old.evaluatees, nextEvaluatee],
          });
        },
      );
      void queryClient.invalidateQueries({
        queryKey: ["leader-review-global-evaluatee-mapping-board"],
      });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "추가에 실패했습니다.";
      toast.error(msg);
    },
  });

  const removePoolMutation = useMutation({
    mutationFn: async (userId: string) => DELETE_leaderReviewEvaluateePoolExtra(userId),
    onSuccess: () => {
      toast.success("후보 풀에서 제거했습니다.");
      void queryClient.invalidateQueries({
        queryKey: ["leader-review-global-evaluatee-mapping-board"],
      });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "제거에 실패했습니다.";
      toast.error(msg);
    },
  });

  const { data: userSearchResults, isFetching: userSearchLoading } = useQuery({
    queryKey: ["leader-mapping-user-search", debouncedAddKeyword],
    queryFn: async () => {
      const res = await GET_users(debouncedAddKeyword.trim());
      return (res as { data: { list: HramsUserType[] } }).data.list;
    },
    enabled: addPoolOpen && debouncedAddKeyword.trim().length >= 1,
  });

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) {
        return;
      }
      if (!connection.source.startsWith("l-") || !connection.target.startsWith("u-")) {
        toast.error("리더 노드에서 피평가자 노드로만 연결할 수 있습니다.");
        return;
      }

      const leaderId = connection.source.replace(/^l-/, "");
      const leader = boardRes?.leaderSubjects.find((l) => l.userId === leaderId);
      if (leader && !leader.isEvaluationSubject) {
        toast.error("평가 대상에서 제외된 리더에서는 연결할 수 없습니다.");
        return;
      }

      setEdges((eds) => {
        const isDup = eds.some(
          (e) =>
            e.source === connection.source && e.target === connection.target,
        );
        if (isDup) {
          toast.info("이미 같은 피평가자와 연결되어 있습니다.");
          return eds;
        }
        return addEdge(
          {
            ...connection,
            id: `conn-${connection.source}-${connection.target}`,
            type: "default",
            animated: false,
            style: {
              strokeWidth: 2.25,
              stroke: "var(--primary)",
            },
            data: { origin: "manual" } satisfies MappingEdgeData,
          },
          eds,
        );
      });
    },
    [setEdges, boardRes?.leaderSubjects],
  );

  const clearManualEdges = useCallback(() => {
    setEdges((eds) => eds.filter((e) => (e.data as MappingEdgeData)?.origin !== "manual"));
  }, [setEdges]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const body = await PUT_leaderReviewGlobalEvaluateeMappings(
        edgesToManualLinks(edges),
      );
      return body as { data?: { saved?: number } };
    },
    onSuccess: (body) => {
      const n = body?.data?.saved ?? 0;
      toast.success(`${n}건의 매핑을 저장했습니다.`);
      void queryClient.invalidateQueries({
        queryKey: ["leader-review-global-evaluatee-mapping-board"],
      });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "저장에 실패했습니다.";
      toast.error(msg);
    },
  });

  const syncAutoMutation = useMutation({
    mutationFn: async () => POST_leaderReviewEvaluateeMappingSyncAuto(),
    onSuccess: (res) => {
      const n = res?.data?.leaders ?? 0;
      toast.success(res?.message ?? `자동 매핑을 ${n}명의 리더 기준으로 갱신했습니다.`);
      void queryClient.invalidateQueries({
        queryKey: ["leader-review-global-evaluatee-mapping-board"],
      });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "자동 매핑 갱신에 실패했습니다.";
      toast.error(msg);
    },
  });

  const board = boardRes;
  const manualEdgeCount = edges.filter(
    (e) => (e.data as MappingEdgeData | undefined)?.origin === "manual",
  ).length;
  const autoEdgeCount = edges.filter(
    (e) => (e.data as MappingEdgeData | undefined)?.origin === "auto",
  ).length;

  const filteredLeadersPanel = useMemo(() => {
    if (!board) return [];
    return board.leaderSubjects.filter((l) =>
      matchesSearch(l.koreanName, l.departmentNames, leaderListSearch),
    );
  }, [board, leaderListSearch]);

  const evaluateePoolForPanel = useMemo(() => {
    if (!board || !panelLeaderFilterResolved) {
      return [];
    }
    return collectEvaluateesForLeaderCanvas(board, panelLeaderFilterResolved, edges);
  }, [board, panelLeaderFilterResolved, edges]);

  const evaluateeGroupsForPanel = useMemo(() => {
    if (!board) {
      return [] as Array<{
        key: string;
        groupIndex: number;
        members: EvaluateeUser[];
      }>;
    }
    const groups = buildEvaluateeGroups(evaluateePoolForPanel);
    const q = evaluateeListSearch.trim();
    return groups
      .map((g, groupIndex) => ({
        key: g.key,
        groupIndex,
        members: q
          ? g.members.filter((e) =>
              matchesSearch(e.koreanName, e.departmentNames, evaluateeListSearch),
            )
          : g.members,
      }))
      .filter((g) => g.members.length > 0);
  }, [board, evaluateePoolForPanel, evaluateeListSearch]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          리더 평가 피평가자 매핑 (전역)
        </h1>
        <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
          조직도 리더는 왼쪽 목록에서 평가 대상 on/off로 배포 여부를 정할 수 있습니다. 임원 등
          기본 후보에 없는 인원은 오른쪽에서 후보 풀에 추가한 뒤 연결하세요. 점선은 자동·실선은
          수동 매핑입니다. 연결선은 곡선으로 그려져 겹침을 줄입니다. 피평가자는 조직도상 첫 번째
          부서명 기준으로 묶어 보여 줍니다. 맵은 왼쪽에서
          다면평가 대상 리더를 선택한 뒤에만 표시됩니다.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <CardTitle>전역 매핑</CardTitle>
            
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => syncAutoMutation.mutate()}
              disabled={
                loadingBoard ||
                syncAutoMutation.isPending ||
                saveMutation.isPending ||
                !board
              }
            >
              {syncAutoMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="mr-2 size-4" aria-hidden />
              )}
              자동 매핑 새로고침
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={clearManualEdges}
              disabled={
                !panelLeaderFilterResolved ||
                manualEdgeCount === 0 ||
                saveMutation.isPending
              }
            >
              <Trash2 className="mr-2 size-4" aria-hidden />
              수동 연결만 지우기
            </Button>
            <Button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={
                loadingBoard ||
                saveMutation.isPending ||
                !board ||
                !panelLeaderFilterResolved
              }
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              ) : (
                <Save className="mr-2 size-4" aria-hidden />
              )}
              저장
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingBoard ? (
            <div className="flex h-[480px] items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" aria-hidden />
              불러오는 중…
            </div>
          ) : board && board.leaderSubjects.length === 0 ? (
            <p className="text-sm text-amber-800 dark:text-amber-200">
              조직에서 리더로 지정된 사용자가 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <div className="space-y-3 xl:col-span-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-medium">리더 · 평가 대상</Label>
                </div>
                <Input
                  placeholder="이름·부서 검색"
                  value={leaderListSearch}
                  onChange={(e) => setLeaderListSearch(e.target.value)}
                  aria-label="리더 목록 검색"
                />
                <ScrollArea className="h-[min(52vh,420px)] rounded-md border">
                  <div className="space-y-0 p-2">
                    {filteredLeadersPanel.map((l) => (
                      <div
                        key={l.userId}
                        className="flex items-center gap-2 border-b border-border/60 py-2.5 last:border-b-0"
                      >
                        <button
                          type="button"
                          aria-pressed={panelLeaderFilterUserId === l.userId}
                          className={cn(
                            "min-w-0 flex-1 rounded-md px-1 py-0.5 text-left outline-none hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring",
                            panelLeaderFilterUserId === l.userId &&
                              "bg-blue-50 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:ring-blue-800",
                          )}
                          onClick={() => {
                            setPanelLeaderFilterUserId(l.userId);
                            setFocusLeaderUserId(l.userId);
                            setPanTarget({ kind: "node", id: `l-${l.userId}` });
                          }}
                        >
                          <div className="truncate text-sm font-medium">{l.koreanName}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {deptLabel(l.departmentNames)}
                          </div>
                        </button>
                        <div className="flex shrink-0 flex-col items-end gap-0.5">
                          <span className="text-[10px] text-muted-foreground">대상</span>
                          <Switch
                            checked={l.isEvaluationSubject}
                            disabled={subjectMutation.isPending}
                            onCheckedChange={(checked) => {
                              subjectMutation.mutate({
                                userId: l.userId,
                                isEvaluationSubject: checked,
                              });
                            }}
                            aria-label={`${l.koreanName} 리더 평가 대상`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <div className="flex min-h-0 flex-col gap-2 xl:col-span-6">
                {panelLeaderFilterResolved ? (
                  <>
                    <MappingConnectionLegend
                      autoEdgeCount={autoEdgeCount}
                      manualEdgeCount={manualEdgeCount}
                    />
                    <p className="text-xs text-muted-foreground">
                      오른쪽 부서 헤더의 맵은 그 부서 그룹 전체가 보이도록 맞춥니다. 맵에서 리더를
                      클릭하면 연결만 강조됩니다 (빈 곳 클릭 시 해제).
                    </p>
                    <div
                      className={cn(
                        MAP_CANVAS_HEIGHT_CLASS,
                        "rounded-lg border bg-muted/20",
                      )}
                      role="application"
                      aria-label="리더와 피평가자 연결 맵"
                    >
                      <ReactFlow
                        nodes={visualNodes}
                        edges={visualEdges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        onConnect={onConnect}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ padding: 0.15 }}
                        minZoom={0.28}
                        maxZoom={1.35}
                        defaultEdgeOptions={{
                          type: "default",
                          style: { strokeWidth: 2, stroke: "var(--foreground)" },
                          interactionWidth: 22,
                        }}
                        deleteKeyCode={["Backspace", "Delete"]}
                        proOptions={{ hideAttribution: true }}
                      >
                        <MappingFlowViewport
                          panTarget={panTarget}
                          onPanHandled={onFlowPanHandled}
                        />
                        <Background gap={16} />
                        <Controls />
                        <MiniMap
                          zoomable
                          pannable
                          className="!bg-card"
                          maskColor="rgb(0 0 0 / 12%)"
                        />
                      </ReactFlow>
                    </div>
                  </>
                ) : (
                  <div
                    className={cn(
                      MAP_CANVAS_HEIGHT_CLASS,
                      "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-muted-foreground/25 bg-muted/10 px-6 py-12 text-center",
                    )}
                    role="region"
                    aria-label="리더 선택 안내"
                  >
                    <p className="text-base font-semibold text-foreground">
                      왼쪽에서 다면평가 대상 리더를 선택하세요
                    </p>
                    <p className="max-w-md text-sm text-muted-foreground">
                      리더를 선택하기 전에는 연결 맵에 노드를 표시하지 않습니다. 리더를 고르면 그
                      리더와 연결된 피평가자와, 후보 풀(extra)에만 있어 아직 연결되지 않은 인원이
                      맵·오른쪽 목록에 나타납니다.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3 xl:col-span-3">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-medium">피평가 후보</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0 gap-1"
                    onClick={() => setAddPoolOpen(true)}
                  >
                    <UserPlus className="size-3.5" aria-hidden />
                    추가
                  </Button>
                </div>
                <Input
                  placeholder="이름·부서 검색"
                  value={evaluateeListSearch}
                  onChange={(e) => setEvaluateeListSearch(e.target.value)}
                  aria-label="피평가자 목록 검색"
                />
                <ScrollArea className="h-[min(52vh,420px)] rounded-md border">
                  <div className="space-y-2 p-2">
                    {evaluateeGroupsForPanel.length === 0 ? (
                      <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                        {evaluateeListSearch.trim()
                          ? "검색과 일치하는 피평가자가 없습니다."
                          : panelLeaderFilterResolved
                            ? "이 리더와 연결된 피평가자가 없고, 후보 풀(extra)에도 아직 추가된 인원이 없습니다. 맵에서 연결하거나 후보를 추가해 보세요."
                            : "왼쪽에서 다면평가 대상 리더를 선택하면 연결된 피평가자와 후보 풀(extra) 인원이 여기에 표시됩니다."}
                      </p>
                    ) : null}
                    {evaluateeGroupsForPanel.map((g) => (
                      <Collapsible key={g.key} defaultOpen={g.groupIndex < 4}>
                        <div className="overflow-hidden rounded-md border border-border/70 bg-muted/15">
                          <div className="flex items-stretch gap-0 border-b border-border/50 bg-muted/30">
                            <CollapsibleTrigger
                              type="button"
                              className="flex min-w-0 flex-1 items-center gap-1.5 px-2 py-2 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring [&[data-state=closed]>svg]:-rotate-90 [&[data-state=open]>svg]:rotate-0"
                            >
                              <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
                              <div className="min-w-0 flex-1">
                                <div className="truncate text-xs font-semibold text-foreground">
                                  {g.key}
                                </div>
                                <div className="text-[10px] text-muted-foreground">
                                  {g.members.length}명
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto shrink-0 rounded-none border-l border-border/50 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                              onClick={() =>
                                setPanTarget({ kind: "group", groupIndex: g.groupIndex })
                              }
                              aria-label={`맵에서 ${g.key} 그룹으로 이동`}
                            >
                              <MapPin className="mr-1 size-3.5" aria-hidden />
                              맵
                            </Button>
                          </div>
                          <CollapsibleContent>
                            <div className="divide-y divide-border/50">
                              {g.members.map((e) => (
                                <div
                                  key={e.userId}
                                  className="flex items-center gap-2 py-2 pl-2 pr-1"
                                >
                                  <button
                                    type="button"
                                    className="min-w-0 flex-1 rounded-md px-1 py-0.5 text-left outline-none hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring"
                                    onClick={() => {
                                      setFocusLeaderUserId(null);
                                      setPanTarget({ kind: "node", id: `u-${e.userId}` });
                                    }}
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="truncate text-sm font-medium">
                                        {e.koreanName}
                                      </span>
                                      {e.poolSource === "extra_pool" ? (
                                        <span className="shrink-0 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-medium text-sky-900 dark:text-sky-100">
                                          추가됨
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="truncate text-xs text-muted-foreground">
                                      {deptLabel(e.departmentNames)}
                                    </div>
                                  </button>
                                  {e.poolSource === "extra_pool" ? (
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                                      disabled={removePoolMutation.isPending}
                                      onClick={() => removePoolMutation.mutate(e.userId)}
                                      aria-label={`${e.koreanName} 후보 풀에서 제거`}
                                    >
                                      <X className="size-4" />
                                    </Button>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={addPoolOpen} onOpenChange={setAddPoolOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>피평가 후보에 사용자 추가</DialogTitle>
            <DialogDescription>
              임원 등 기본 후보에 없는 사용자를 검색해 추가합니다. 추가된 사용자만 수동 연결
              저장이 가능합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="add-pool-search">이름 또는 이메일</Label>
            <Input
              id="add-pool-search"
              value={addPoolKeyword}
              onChange={(e) => setAddPoolKeyword(e.target.value)}
              placeholder="검색어 입력"
            />
            <ScrollArea className="h-48 rounded-md border">
              <div className="p-1">
                {userSearchLoading ? (
                  <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    검색 중…
                  </div>
                ) : null}
                {!userSearchLoading &&
                debouncedAddKeyword.trim() &&
                (userSearchResults?.length ?? 0) === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">검색 결과가 없습니다.</p>
                ) : null}
                {userSearchResults?.map((u) => (
                  <button
                    key={u.userId}
                    type="button"
                    className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => addPoolMutation.mutate(u)}
                    disabled={addPoolMutation.isPending}
                  >
                    <span className="font-medium">{u.koreanName}</span>
                    <span className="text-xs text-muted-foreground">{u.email}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddPoolOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
