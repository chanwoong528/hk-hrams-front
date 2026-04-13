import { createLogger, type ScopedLogger } from "./core";

function serializeReason(reason: unknown): unknown {
  if (reason instanceof Error) {
    return {
      name: reason.name,
      message: reason.message,
      stack: reason.stack,
    };
  }
  return reason;
}

/**
 * 처리되지 않은 예외·Promise 거부를 콘솔(및 추후 원격 로그)로 남긴다.
 * 앱 부트스트랩 시 한 번만 호출한다.
 */
export function installGlobalErrorListeners(
  log: ScopedLogger = createLogger("global"),
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("unhandledrejection", (event) => {
    log.error("Unhandled promise rejection", {
      reason: serializeReason(event.reason),
    });
  });

  window.addEventListener("error", (event) => {
    log.error("Uncaught error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: serializeReason(event.error),
    });
  });
}
