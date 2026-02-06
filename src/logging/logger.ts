import { appEnv, appVersion, logLevel as cfgLevel } from '@/config/env';

type Level = 'debug' | 'info' | 'warn' | 'error';

const endpoint = (import.meta.env.VITE_LOG_ENDPOINT as string) || '';
const enabled = Boolean(endpoint);
const levelOrder: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const minLevel = (['debug', 'info', 'warn', 'error'] as Level[]).includes(cfgLevel as Level)
  ? (cfgLevel as Level)
  : 'info';

interface LogEvent {
  ts: number;
  level: Level;
  category: string;
  message: string;
  data?: Record<string, unknown>;
  v: string; // app version
  env: string; // app env
}

const buffer: LogEvent[] = [];
const MAX_BUFFER = 50;
let timer: number | undefined;

function shouldLog(level: Level) {
  return levelOrder[level] >= levelOrder[minLevel];
}

export function logEvent(
  category: string,
  level: Level,
  message: string,
  data?: Record<string, unknown>
) {
  try {
    if (!shouldLog(level)) return;
    const evt: LogEvent = {
      ts: Date.now(),
      level,
      category,
      message,
      data,
      v: appVersion,
      env: appEnv,
    };
    // Always console in dev; respect level
    if (import.meta.env.DEV) {
      const fn = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';

      console[fn](`[${evt.level}] ${evt.category}: ${evt.message}`, evt.data || '');
    }
    if (!enabled) return;
    buffer.push(evt);
    if (buffer.length >= MAX_BUFFER) flush();
    scheduleFlush();
  } catch {
    // Never throw from logger
  }
}

function scheduleFlush() {
  if (timer) return;
  timer = window.setTimeout(() => {
    timer = undefined;
    flush();
  }, 3000) as unknown as number;
}

export function flush() {
  if (!enabled || buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);
  const body = JSON.stringify({ events: batch });
  try {
    if ('sendBeacon' in navigator) {
      // @ts-expect-error sendBeacon exists in modern browsers
      const ok = navigator.sendBeacon(endpoint, body);
      if (ok) return;
    }
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body,
    }).catch(() => {});
  } catch {
    // swallow
  }
}

export function trackPageView(url: string) {
  logEvent('analytics', 'info', 'page_view', { url });
}
