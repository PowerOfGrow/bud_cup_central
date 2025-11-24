import * as Sentry from "@sentry/react";

/**
 * Initialise Sentry pour le logging des erreurs
 * 
 * @param dsn - DSN Sentry (optionnel, peut être fourni via VITE_SENTRY_DSN)
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE || "development";

  // Ne pas initialiser Sentry si le DSN n'est pas fourni
  if (!dsn) {
    console.warn("Sentry DSN not configured. Error tracking disabled.");
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: environment === "production" ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: environment === "production" ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    // Ignorer les erreurs locales en développement
    beforeSend(event, hint) {
      if (environment === "development") {
        console.error("Sentry Event:", event, hint);
        // Ne pas envoyer les erreurs en développement
        return null;
      }
      return event;
    },
  });
}

