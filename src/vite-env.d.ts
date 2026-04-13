/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * 최소 로그 심각도: silent | debug | info | warn | error
   * 미설정 시 개발은 debug, 프로덕션은 warn
   */
  readonly VITE_LOG_LEVEL?: string;
}
