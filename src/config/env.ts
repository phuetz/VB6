// Centralized, typed access to Vite environment variables

type OptionalString = string | undefined;

const { DEV, PROD, MODE } = import.meta.env;

export const isDev = DEV;
export const isProd = PROD;
export const appMode: string = MODE;

// Public URLs (exposed to the client)
export const apiUrl: OptionalString = import.meta.env.VITE_API_URL;
export const collabUrl: OptionalString = import.meta.env.VITE_COLLAB_URL;
export const aiUrl: OptionalString = import.meta.env.VITE_AI_URL;

// App metadata
export const appVersion: string = import.meta.env.VITE_APP_VERSION ?? 'unknown';
export const appEnv: string = import.meta.env.VITE_APP_ENV ?? MODE;

// Optional observability
export const sentryDsn: OptionalString = import.meta.env.VITE_SENTRY_DSN;
export const logLevel: string = (import.meta.env.VITE_LOG_LEVEL as string) || 'info';

// Basic runtime guards (no-throw; consumers can enforce stricter checks)
export function validateClientEnv(): { ok: boolean; missing: string[] } {
  const required = ['VITE_API_URL'];
  const missing: string[] = required.filter(key => !import.meta.env[key as keyof ImportMetaEnv]);
  return { ok: missing.length === 0, missing };
}
