/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_MODE: string;
  readonly VITE_API_URL: string;
  readonly VITE_API_KEY: string;
  readonly VITE_GA_MEASUREMENT_ID: string;
  readonly VITE_SENTRY_DSN: string;
  readonly VITE_ENABLE_ANALYTICS: string;
  readonly VITE_ENABLE_ERROR_TRACKING: string;
  readonly VITE_ENABLE_WEB_VITALS: string;
  readonly VITE_DEBUG_MODE: string;
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_BUILD_SOURCEMAP: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
