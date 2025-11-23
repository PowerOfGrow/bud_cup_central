import { useQuery } from "@tanstack/react-query";
import { fetchContestEntries, fetchContests } from "@/services/contests";

export const contestKeys = {
  all: ["contests"] as const,
  list: () => [...contestKeys.all, "list"] as const,
  entries: (contestId: string) => [...contestKeys.all, "entries", contestId] as const,
};

export const useContests = () =>
  useQuery({
    queryKey: contestKeys.list(),
    queryFn: fetchContests,
  });

export const useContestEntries = (contestId?: string) =>
  useQuery({
    queryKey: contestId ? contestKeys.entries(contestId) : [...contestKeys.all, "entries", "none"],
    queryFn: () => {
      if (!contestId) {
        return [];
      }
      return fetchContestEntries(contestId);
    },
    enabled: Boolean(contestId),
  });

