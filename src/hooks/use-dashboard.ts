import { useQuery } from "@tanstack/react-query";
import { fetchJudgeDashboard, fetchProducerDashboard, fetchViewerDashboard } from "@/services/dashboard";

export const dashboardKeys = {
  base: ["dashboard"] as const,
  viewer: (profileId: string | undefined) => [...dashboardKeys.base, "viewer", profileId ?? "anonymous"] as const,
  producer: (profileId: string | undefined) => [...dashboardKeys.base, "producer", profileId ?? "anonymous"] as const,
  judge: (profileId: string | undefined) => [...dashboardKeys.base, "judge", profileId ?? "anonymous"] as const,
};

export const useViewerDashboard = (profileId?: string) =>
  useQuery({
    queryKey: dashboardKeys.viewer(profileId),
    queryFn: () => {
      if (!profileId) return Promise.resolve(null);
      return fetchViewerDashboard(profileId);
    },
    enabled: Boolean(profileId),
  });

export const useProducerDashboard = (profileId?: string) =>
  useQuery({
    queryKey: dashboardKeys.producer(profileId),
    queryFn: () => {
      if (!profileId) return Promise.resolve(null);
      return fetchProducerDashboard(profileId);
    },
    enabled: Boolean(profileId),
  });

export const useJudgeDashboard = (profileId?: string) =>
  useQuery({
    queryKey: dashboardKeys.judge(profileId),
    queryFn: () => {
      if (!profileId) return Promise.resolve(null);
      return fetchJudgeDashboard(profileId);
    },
    enabled: Boolean(profileId),
  });

