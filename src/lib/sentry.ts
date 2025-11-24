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

  try {
    Sentry.init({
      dsn,
      environment,
      // Configuration minimale pour éviter les conflits avec React
      integrations: [
        // Désactiver les intégrations qui peuvent causer des problèmes avec les hooks
        // browserTracingIntegration() et replayIntegration() peuvent être ajoutées plus tard si nécessaire
      ],
      // Performance Monitoring - désactivé temporairement
      tracesSampleRate: 0,
      // Session Replay - désactivé temporairement
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
      // Ignorer les erreurs locales en développement
      beforeSend(event, hint) {
        if (environment === "development") {
          console.error("Sentry Event:", event, hint);
          // Ne pas envoyer les erreurs en développement
          return null;
        }
        return event;
      },
      // Désactiver les fonctionnalités qui peuvent interférer avec React
      autoSessionTracking: false,
    });
  } catch (error) {
    console.error("Failed to initialize Sentry:", error);
  }
}

