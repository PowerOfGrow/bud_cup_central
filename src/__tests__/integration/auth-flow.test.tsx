import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ProtectedRoute from "@/components/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

describe("Auth Flow Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{component}</BrowserRouter>
      </QueryClientProvider>
    );
  };

  it("devrait afficher le formulaire de connexion", () => {
    renderWithProviders(<Login />);
    
    expect(screen.getByLabelText(/email|e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password|mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /se connecter|sign in/i })).toBeInTheDocument();
  });

  it("devrait afficher le formulaire d'inscription", () => {
    renderWithProviders(<Register />);
    
    expect(screen.getByLabelText(/email|e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password|mot de passe/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /s'inscrire|sign up/i })).toBeInTheDocument();
  });

  it("devrait rediriger vers login si non authentifié", async () => {
    (supabase.auth.getSession as any).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    renderWithProviders(
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    );

    // Le composant devrait afficher un loader ou rediriger
    await waitFor(() => {
      // Vérifier que le dashboard n'est pas visible ou qu'il y a une redirection
      const dashboard = screen.queryByText(/dashboard|tableau de bord/i);
      // Si non connecté, le dashboard ne devrait pas être visible
      expect(dashboard).not.toBeInTheDocument();
    });
  });
});

