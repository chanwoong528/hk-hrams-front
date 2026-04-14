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
import { Loader2, RefreshCw, Save, Trash2, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { GET_users } from "@/api/user/user";
import {
  DELETE_leaderReviewEvaluateePoolExtra,
  GET_leaderReviewGlobalEvaluateeMappingBoard,
  PATCH_leaderReviewEvaluationSubject,
  POST_leaderReviewEvaluateeMappingSyncAuto,
  POST_leaderReviewEvaluateePoolExtra,
  PUT_leaderReviewGlobalEvaluateeMappings,
  type EvaluateeUser,
  type GlobalLeaderSubject,
  type LeaderReviewGlobalMappingBoard,
} from "@/api/leader-review-evaluatee-mapping/leader-review-evaluatee-mapping";

const LEADER_X = 32;
const USER_X = 520;
const ROW_GAP = 80;
const Y_TOP = 36;

const FOCUS_DIM_NODE_OPACITY = 0.22;
const FOCUS_DIM_EDGE_OPACITY = 0.12;

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

  const nextNodes = nodes.map((n) => {
    const active = highlightedNodes.has(n.id);
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
};

type MappingEdgeData = { origin: "auto" | "manual" };

function LeaderSubjectNode(props: NodeProps) {
  const data = props.data as LeaderNodeData;
  const inactive = !data.isEvaluationSubject;
  return (
    <div
      className={cn(
        "min-w-[168px] max-w-[220px] rounded-lg border px-3 py-2 text-left shadow-sm",
        inactive
          ? "border-muted-foreground/25 bg-muted/50 opacity-60"
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
} satisfies NodeTypes;

const LEGEND_SAMPLE_LINE_WIDTH_PX = 36;
const LEGEND_LINE_STROKE_CLASS = "border-foreground/75 dark:border-foreground/80";

function MappingConnectionLegend() {
  return (
    <div
      className="rounded-md border bg-card px-3 py-2 shadow-sm"
      role="region"
      aria-label="연결선 종류 안내"
    >
      <p className="text-xs font-medium text-foreground">연결선 범례</p>
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

  const nE = evaluatees.length;
  evaluatees.forEach((e, i) => {
    const y = nE <= 1 ? Y_TOP + 120 : Y_TOP + (i / (nE - 1)) * Math.max(320, (nE - 1) * ROW_GAP);
    nodes.push({
      id: `u-${e.userId}`,
      type: "evaluateeUser",
      position: { x: USER_X, y },
      data: {
        title: e.koreanName,
        subtitle: deptLabel(e.departmentNames),
        poolSource: e.poolSource,
        isAlsoLeader: allLeaderSubjectUserIds.has(e.userId),
      } satisfies EvaluateeNodeData,
    });
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
      /** animated 는 흐르는 점선처럼 보이므로 자동 매핑에만 사용 */
      animated: isAuto,
      deletable: !isAuto,
      selectable: true,
      style: isAuto ? { strokeDasharray: "6 4", strokeWidth: 2 } : { strokeWidth: 2 },
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

export default function MultiRaterEvaluateeMapping() {
  const queryClient = useQueryClient();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  const [leaderListSearch, setLeaderListSearch] = useState("");
  const [evaluateeListSearch, setEvaluateeListSearch] = useState("");
  const [showInactiveOnCanvas, setShowInactiveOnCanvas] = useState(false);
  const [addPoolOpen, setAddPoolOpen] = useState(false);
  const [addPoolKeyword, setAddPoolKeyword] = useState("");
  const debouncedAddKeyword = useDebounce(addPoolKeyword, 400);
  /** 리더 노드 클릭 시 해당 리더·연결만 강조 (패널 클릭으로 해제) */
  const [focusLeaderUserId, setFocusLeaderUserId] = useState<string | null>(null);

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
      const res = await GET_leaderReviewGlobalEvaluateeMappingBoard();
      return res.data;
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

  const leadersForFlow = useMemo(() => {
    if (!boardRes) return [];
    return boardRes.leaderSubjects.filter(
      (l) => showInactiveOnCanvas || l.isEvaluationSubject,
    );
  }, [boardRes, showInactiveOnCanvas]);

  useEffect(() => {
    if (!boardRes) {
      setNodes([]);
      setEdges([]);
      setFocusLeaderUserId(null);
      return;
    }
    const allLeaderSubjectUserIds = new Set(
      boardRes.leaderSubjects.map((l) => l.userId),
    );
    const { nodes: n, edges: ed } = boardToFlow(
      leadersForFlow,
      boardRes.evaluatees,
      boardRes.mappings,
      allLeaderSubjectUserIds,
    );
    setNodes(n);
    setEdges(ed);
    setFocusLeaderUserId(null);
  }, [boardRes, leadersForFlow, setNodes, setEdges]);

  const { nodes: visualNodes, edges: visualEdges } = useMemo(
    () => withLeaderFocusVisuals(nodes, edges, focusLeaderUserId),
    [nodes, edges, focusLeaderUserId],
  );

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
    mutationFn: async (userId: string) => POST_leaderReviewEvaluateePoolExtra(userId),
    onSuccess: () => {
      toast.success("피평가 후보 풀에 추가했습니다.");
      setAddPoolOpen(false);
      setAddPoolKeyword("");
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
      return (res as { data: { list: { userId: string; koreanName: string; email: string }[] } })
        .data.list;
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
            animated: false,
            style: { strokeWidth: 2 },
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

  const filteredLeadersPanel = useMemo(() => {
    if (!board) return [];
    return board.leaderSubjects.filter((l) =>
      matchesSearch(l.koreanName, l.departmentNames, leaderListSearch),
    );
  }, [board, leaderListSearch]);

  const filteredEvaluateesPanel = useMemo(() => {
    if (!board) return [];
    return board.evaluatees.filter((e) =>
      matchesSearch(e.koreanName, e.departmentNames, evaluateeListSearch),
    );
  }, [board, evaluateeListSearch]);

  const flowMinHeight = useMemo(() => {
    if (!board) return 480;
    const n = Math.max(leadersForFlow.length, board.evaluatees.length, 1);
    return Math.min(720, Math.max(480, 80 + n * ROW_GAP));
  }, [board, leadersForFlow.length]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          리더 평가 피평가자 매핑 (전역)
        </h1>
        <p className="mt-1 max-w-4xl text-sm text-muted-foreground">
          조직도 리더는 왼쪽 목록에서 평가 대상 on/off로 배포 여부를 정할 수 있습니다. 임원 등
          기본 후보에 없는 인원은 오른쪽에서 후보 풀에 추가한 뒤 연결하세요. 점선은 자동·실선은
          수동 매핑입니다.
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
              disabled={manualEdgeCount === 0 || saveMutation.isPending}
            >
              <Trash2 className="mr-2 size-4" aria-hidden />
              수동 연결만 지우기
            </Button>
            <Button
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={loadingBoard || saveMutation.isPending || !board}
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
                <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                  <Switch
                    id="show-inactive-flow"
                    checked={showInactiveOnCanvas}
                    onCheckedChange={setShowInactiveOnCanvas}
                  />
                  <Label htmlFor="show-inactive-flow" className="text-xs leading-snug">
                    비활성 리더도 플로우에 표시
                  </Label>
                </div>
                <ScrollArea className="h-[min(52vh,420px)] rounded-md border">
                  <div className="space-y-0 p-2">
                    {filteredLeadersPanel.map((l) => (
                      <div
                        key={l.userId}
                        className="flex items-center gap-2 border-b border-border/60 py-2.5 last:border-b-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{l.koreanName}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {deptLabel(l.departmentNames)}
                          </div>
                        </div>
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
                <MappingConnectionLegend />
                <div
                  className="w-full rounded-lg border bg-muted/20"
                  style={{ height: flowMinHeight }}
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
                    minZoom={0.4}
                    maxZoom={1.25}
                    defaultEdgeOptions={{
                      style: { strokeWidth: 2 },
                    }}
                    deleteKeyCode={["Backspace", "Delete"]}
                    proOptions={{ hideAttribution: true }}
                  >
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
                  <div className="space-y-0 p-2">
                    {filteredEvaluateesPanel.map((e) => (
                      <div
                        key={e.userId}
                        className="flex items-center gap-2 border-b border-border/60 py-2.5 last:border-b-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-medium">{e.koreanName}</span>
                            {e.poolSource === "extra_pool" ? (
                              <span className="shrink-0 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-medium text-sky-900 dark:text-sky-100">
                                추가됨
                              </span>
                            ) : null}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {deptLabel(e.departmentNames)}
                          </div>
                        </div>
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
                    onClick={() => addPoolMutation.mutate(u.userId)}
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
