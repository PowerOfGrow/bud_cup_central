import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "../use-auth";
import { supabase } from "@/integrations/supabase/client";

// Mock Supabase
const mockUnsubscribe = vi.fn();
const mockSubscription = {
  unsubscribe: mockUnsubscribe,
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: mockSubscription },
      })),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return loading state initially", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);
  });

  it("should handle user authentication", async () => {
    const mockUser = {
      id: "test-user-id",
      email: "test@example.com",
      user_metadata: { display_name: "Test User", role: "viewer" },
    };

    const mockSession = {
      user: mockUser as any,
      access_token: "mock-token",
      refresh_token: "mock-refresh",
    };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });

    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 3000 });
  });
});

