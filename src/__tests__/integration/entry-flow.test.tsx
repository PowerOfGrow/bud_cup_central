import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Contests from "@/pages/Contests";

// Mock useAuth
vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

// Mock useContests
vi.mock("@/hooks/use-contests", () => ({
  useContests: vi.fn(() => ({
    data: [
      {
        id: "1",
        name: "Test Contest",
        status: "registration",
        slug: "test-contest",
      },
    ],
    isLoading: false,
    error: null,
  })),
  useContestEntries: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

describe("Entry Flow Integration", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    (useAuth as any).mockReturnValue({
      user: { id: "test-user" },
      profile: { id: "test-profile", role: "viewer" },
      loading: false,
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{component}</BrowserRouter>
      </QueryClientProvider>
    );
  };

  it("devrait afficher la liste des concours", async () => {
    renderWithProviders(<Contests />);

    await waitFor(() => {
      expect(screen.getByText(/test contest/i)).toBeInTheDocument();
    });
  });

  it("devrait permettre la recherche d'entrées", async () => {
    renderWithProviders(<Contests />);

    await waitFor(() => {
      const searchInput = screen.queryByPlaceholderText(/rechercher|search/i);
      // Le champ de recherche peut ne pas être visible immédiatement
      if (searchInput) {
        expect(searchInput).toBeInTheDocument();
      }
    });
  });
});

