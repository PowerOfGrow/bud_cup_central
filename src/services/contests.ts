import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type ContestRow = Tables<"contests">;
type EntryRow = Tables<"entries">;
type ProfileRow = Tables<"profiles">;

type ContestQueryRow = ContestRow & {
  entries?: { count: number }[] | null;
  contest_judges?: { count: number }[] | null;
};

type EntryQueryRow = EntryRow & {
  producer?: Pick<ProfileRow, "display_name" | "organization"> | null;
  judge_scores?: { overall_score: number }[] | null;
  public_votes?: { score: number }[] | null;
};

export type ContestSummary = ContestRow & {
  entriesCount: number;
  judgesCount: number;
};

export type ContestEntry = EntryRow & {
  producerName: string;
  producerOrganization: string | null;
  judgeAverage: number | null;
  judgeScoresCount: number;
  publicAverage: number | null;
  publicVotesCount: number;
};

const extractCount = (value?: { count: number }[] | null) => value?.[0]?.count ?? 0;

const average = (numbers: number[]) => {
  if (!numbers.length) return null;
  const total = numbers.reduce((acc, num) => acc + num, 0);
  return Math.round((total / numbers.length) * 10) / 10;
};

export async function fetchContests(): Promise<ContestSummary[]> {
  const { data, error } = await supabase
    .from("contests")
    .select(
      `
        *,
        entries:entries(count),
        contest_judges:contest_judges(count)
      `,
    )
    .neq("status", "draft")
    .order("start_date", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as ContestQueryRow[]).map((contest) => ({
    ...contest,
    entriesCount: extractCount(contest.entries),
    judgesCount: extractCount(contest.contest_judges),
  }));
}

export async function fetchContestEntries(contestId: string): Promise<ContestEntry[]> {
  const { data, error } = await supabase
    .from("entries")
    .select(
      `
        *,
        producer:profiles!entries_producer_id_fkey(display_name, organization),
        judge_scores(overall_score),
        public_votes(score)
      `,
    )
    .eq("contest_id", contestId)
    .in("status", ["approved", "archived"]);

  if (error) {
    throw new Error(error.message);
  }

  return (data as EntryQueryRow[]).map((entry) => {
    const judgeScores = entry.judge_scores?.map((score) => score.overall_score) ?? [];
    const publicVotes = entry.public_votes?.map((vote) => vote.score) ?? [];

    return {
      ...entry,
      producerName: entry.producer?.display_name ?? "Producteur anonyme",
      producerOrganization: entry.producer?.organization ?? null,
      judgeAverage: average(judgeScores),
      judgeScoresCount: judgeScores.length,
      publicAverage: average(publicVotes),
      publicVotesCount: publicVotes.length,
    };
  });
}

