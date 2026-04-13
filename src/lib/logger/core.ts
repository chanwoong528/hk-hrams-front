/**
 * 프론트 로깅 정책 (요약)
 * - `createLogger("모듈명")`으로 스코프를 붙이고, `debug` / `info` / `warn` / `error`만 사용한다.
 * - 액세스 토큰·리프레시 토큰·비밀번호·주민번호 등 식별/인증 값은 로그에 넣지 않는다.
 * - 사용자 이메일·실명 등 PII는 기본적으로 남기지 않는다. 불가피하면 마스킹한다.
 * - 일회성 디버그는 `debug`로 남기고, 배포 전에 제거하거나 레벨을 올린다.
 * - `VITE_LOG_LEVEL`로 배포 환경에서도 상세도를 조절한다 (기본: prod = warn, dev = debug).
 */

export type LogLevelName = "silent" | "debug" | "info" | "warn" | "error";

const SEVERITY: Record<Exclude<LogLevelName, "silent">, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const DEFAULT_LEVEL: LogLevelName = import.meta.env.DEV ? "debug" : "warn";

function normalizeLevel(raw: string | undefined): LogLevelName {
  if (!raw) {
    return DEFAULT_LEVEL;
  }
  const key = raw.trim().toLowerCase();
  if (
    key === "silent" ||
    key === "debug" ||
    key === "info" ||
    key === "warn" ||
    key === "error"
  ) {
    return key;
  }
  return DEFAULT_LEVEL;
}

function activeThreshold(): number | "silent" {
  const level = normalizeLevel(import.meta.env.VITE_LOG_LEVEL);
  if (level === "silent") {
    return "silent";
  }
  return SEVERITY[level];
}

function shouldEmit(method: Exclude<LogLevelName, "silent">): boolean {
  const threshold = activeThreshold();
  if (threshold === "silent") {
    return false;
  }
  return SEVERITY[method] >= threshold;
}

function formatPrefix(scope: string): string {
  return `[HRAMS][${scope}]`;
}

type ConsoleMethod = "debug" | "info" | "warn" | "error";

const CONSOLE_BY_LEVEL: Record<
  ConsoleMethod,
  (...args: unknown[]) => void
> = {
  debug: console.debug.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

function emit(
  method: Exclude<LogLevelName, "silent">,
  scope: string,
  message: string,
  details?: unknown,
): void {
  if (!shouldEmit(method)) {
    return;
  }
  const prefix = formatPrefix(scope);
  const logFn = CONSOLE_BY_LEVEL[method];
  if (details !== undefined) {
    logFn(prefix, message, details);
    return;
  }
  logFn(prefix, message);
}

export type ScopedLogger = {
  debug: (message: string, details?: unknown) => void;
  info: (message: string, details?: unknown) => void;
  warn: (message: string, details?: unknown) => void;
  error: (message: string, details?: unknown) => void;
};

export function createLogger(scope: string): ScopedLogger {
  return {
    debug: (message, details) => emit("debug", scope, message, details),
    info: (message, details) => emit("info", scope, message, details),
    warn: (message, details) => emit("warn", scope, message, details),
    error: (message, details) => emit("error", scope, message, details),
  };
}

export const logger = createLogger("app");
