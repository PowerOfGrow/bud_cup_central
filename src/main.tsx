import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@tanstack/react-query";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.tsx";
import "./index.css";
import { queryClient } from "@/lib/queryClient";
import { initSentry } from "@/lib/sentry";

// Initialiser Sentry avant tout (de manière sécurisée)
try {
  initSentry();
} catch (error) {
  console.error("Failed to initialize Sentry:", error);
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <App />
        <Analytics />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
