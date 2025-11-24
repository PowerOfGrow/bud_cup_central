import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface OrganizerAnalytics {
  // Statistiques globales
  totalContests: number;
  activeContests: number;
  totalEntries: number;
  totalProducers: number;
  totalJudges: number;
  totalVotes: number;
  
  // Statistiques par concours
  contestsStats: Array<{
    id: string;
    name: string;
    status: string;
    entriesCount: number;
    votesCount: number;
    judgesCount: number;
    averageScore: number | null;
  }>;
  
  // Participation
  participation: {
    totalProducers: number;
    activeProducers: number; // Producteurs ayant soumis au moins une entrée
    totalViewers: number;
    activeVoters: number; // Viewers ayant voté au moins une fois
  };
  
  // Engagement
  engagement: {
    averageVotesPerEntry: number;
    averageScoresPerEntry: number;
    completionRate: number; // % d'entrées évaluées par les juges
  };
  
  // Évolution temporelle (30 derniers jours)
  timeline: Array<{
    date: string;
    entries: number;
    votes: number;
    scores: number;
  }>;
}

export const useOrganizerAnalytics = () => {
  return useQuery({
    queryKey: ["organizer-analytics"],
    queryFn: async (): Promise<OrganizerAnalytics> => {
      // Récupérer tous les concours
      const { data: contests, error: contestsError } = await supabase
        .from("contests")
        .select("*")
        .order("created_at", { ascending: false });

      if (contestsError) throw contestsError;

      const contestIds = contests?.map((c) => c.id) || [];

      // Statistiques globales
      const { data: entries, error: entriesError } = contestIds.length > 0
        ? await supabase
            .from("entries")
            .select("id, contest_id, producer_id, status, created_at")
            .in("contest_id", contestIds)
        : { data: [], error: null };

      if (entriesError) throw entriesError;

      const entryIds = entries?.map((e) => e.id) || [];
      const { data: votes, error: votesError } = entryIds.length > 0
        ? await supabase
            .from("public_votes")
            .select("id, entry_id, voter_profile_id, created_at")
            .in("entry_id", entryIds)
        : { data: [], error: null };

      if (votesError) throw votesError;

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, role");

      if (profilesError) throw profilesError;

      const { data: judges, error: judgesError } = contestIds.length > 0
        ? await supabase
            .from("contest_judges")
            .select("id, contest_id, judge_id")
            .in("contest_id", contestIds)
        : { data: [], error: null };

      if (judgesError) throw judgesError;

      const { data: scores, error: scoresError } = entryIds.length > 0
        ? await supabase
            .from("judge_scores")
            .select("id, entry_id, overall_score, created_at")
            .in("entry_id", entryIds)
        : { data: [], error: null };

      if (scoresError) throw scoresError;

      // Calculer les statistiques par concours
      const contestsStats = (contests || []).map((contest) => {
        const contestEntries = entries?.filter((e) => e.contest_id === contest.id) || [];
        const contestVotes = votes?.filter((v) =>
          contestEntries.some((e) => e.id === v.entry_id)
        ) || [];
        const contestJudges = judges?.filter((j) => j.contest_id === contest.id) || [];
        const contestScores = scores?.filter((s) =>
          contestEntries.some((e) => e.id === s.entry_id)
        ) || [];

        const averageScore =
          contestScores.length > 0
            ? contestScores.reduce((sum, s) => sum + (s.overall_score || 0), 0) /
              contestScores.length
            : null;

        return {
          id: contest.id,
          name: contest.name,
          status: contest.status,
          entriesCount: contestEntries.length,
          votesCount: contestVotes.length,
          judgesCount: contestJudges.length,
          averageScore: averageScore ? Math.round(averageScore * 10) / 10 : null,
        };
      });

      // Participation
      const uniqueProducers = new Set(entries?.map((e) => e.producer_id) || []);
      const activeProducers = new Set(
        entries?.filter((e) => e.status !== "draft").map((e) => e.producer_id) || []
      );
      const totalViewers = profiles?.filter((p) => p.role === "viewer").length || 0;
      const uniqueVoters = new Set(votes?.map((v) => v.voter_profile_id).filter(Boolean) || []);

      // Engagement
      const approvedEntries = entries?.filter((e) => e.status === "approved") || [];
      const averageVotesPerEntry =
        approvedEntries.length > 0 ? (votes?.length || 0) / approvedEntries.length : 0;
      const averageScoresPerEntry =
        approvedEntries.length > 0 ? (scores?.length || 0) / approvedEntries.length : 0;
      const completionRate =
        approvedEntries.length > 0
          ? (approvedEntries.filter((e) =>
              scores?.some((s) => s.entry_id === e.id)
            ).length /
              approvedEntries.length) *
            100
          : 0;

      // Timeline (simplifié - dernières 30 entrées/votes)
      const timeline: Array<{ date: string; entries: number; votes: number; scores: number }> = [];
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split("T")[0];
      });

      last30Days.forEach((date) => {
        const dayEntries =
          entries?.filter((e) => {
            const entryDate = new Date(e.created_at || "").toISOString().split("T")[0];
            return entryDate === date;
          }).length || 0;

        const dayVotes =
          votes?.filter((v) => {
            const voteDate = new Date(v.created_at || "").toISOString().split("T")[0];
            return voteDate === date;
          }).length || 0;

        const dayScores =
          scores?.filter((s) => {
            const scoreDate = new Date(s.created_at || "").toISOString().split("T")[0];
            return scoreDate === date;
          }).length || 0;

        timeline.push({
          date,
          entries: dayEntries,
          votes: dayVotes,
          scores: dayScores,
        });
      });

      return {
        totalContests: contests?.length || 0,
        activeContests:
          contests?.filter((c) => c.status === "registration" || c.status === "judging").length ||
          0,
        totalEntries: entries?.length || 0,
        totalProducers: profiles?.filter((p) => p.role === "producer").length || 0,
        totalJudges: profiles?.filter((p) => p.role === "judge").length || 0,
        totalVotes: votes?.length || 0,
        contestsStats,
        participation: {
          totalProducers: profiles?.filter((p) => p.role === "producer").length || 0,
          activeProducers: activeProducers.size,
          totalViewers,
          activeVoters: uniqueVoters.size,
        },
        engagement: {
          averageVotesPerEntry: Math.round(averageVotesPerEntry * 10) / 10,
          averageScoresPerEntry: Math.round(averageScoresPerEntry * 10) / 10,
          completionRate: Math.round(completionRate * 10) / 10,
        },
        timeline,
      };
    },
    refetchInterval: 60000, // Rafraîchir toutes les minutes
  });
};

