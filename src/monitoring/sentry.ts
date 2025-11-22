// Optional Sentry initialization (loaded only if DSN provided)
import { isProd, sentryDsn, appVersion } from '@/config/env';

export async function initSentryIfEnabled(): Promise<void> {
  if (!isProd || !sentryDsn) return;

  // Sentry is currently disabled as the package is not installed
  // To enable Sentry monitoring:
  // 1. npm install @sentry/react
  // 2. Uncomment the code below

  /*
  try {
    const Sentry = await import('@sentry/react');
    const { BrowserTracing } = await import('@sentry/react');
    Sentry.init({
      dsn: sentryDsn,
      release: appVersion,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    });
    console.info('Sentry initialized');
  } catch (err) {
    console.info('Sentry not enabled or dependency missing:', err);
  }
  */

  console.info('Sentry monitoring is currently disabled');
}

