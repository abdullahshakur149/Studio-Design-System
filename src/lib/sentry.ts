import * as Sentry from '@sentry/react';
import { env } from './env';

export function initSentry(): void {
  if (!env.VITE_SENTRY_DSN) {
    if (import.meta.env.DEV) {
      console.warn('VITE_SENTRY_DSN not set — Sentry is disabled');
    }
    return;
  }
  Sentry.init({
    dsn: env.VITE_SENTRY_DSN,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    environment: import.meta.env.MODE,
  });
}

export { Sentry };
