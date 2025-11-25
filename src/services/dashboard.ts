import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

type ContestRow = Tables<"contests">;
type EntryRow = Tables<"entries">;
type PublicVoteRow = Tables<"public_votes">;

type VoteQueryRow = PublicVoteRow & {
  entry: (Pick<EntryRow, "id" | "strain_name" | "category" | "contest_id"> & {
    contest: Pick<ContestRow, "id" | "name" | "status" | "start_date"> | null;
  }) | null;
};

type ProducerEntryRow = EntryRow & {
  contest: Pick<ContestRow, "id" | "name" | "status" | "start_date" | "registration_close_date"> | null;
  judge_scores?: { overall_score: number }[] | null;
  public_votes?: { score: number }[] | null;
};

type JudgeScoreRow = {
  id: string;
  overall_score: number;
  created_at: string;
  entry: (Pick<EntryRow, "id" | "strain_name" | "category" | "contest_id"> & {
    contest: Pick<ContestRow, "id" | "name" | "status" | "start_date"> | null;
  }) | null;
};

const average = (numbers: number[]) => {
  if (!numbers.length) return null;
  const total = numbers.reduce((acc, num) => acc + num, 0);
  return Math.round((total / numbers.length) * 10) / 10;
};

export async function fetchViewerDashboard(profileId: string) {
  const [{ data: votes, error: votesError }, { data: upcoming, error: contestsError }] = await Promise.all([
    supabase
      .from("public_votes")
      .select(
        `
        id,
        score,
        comment,
        created_at,
        entry:entries (
          id,
          strain_name,
          category,
          contest:contests (
            id,
            name,
            status,
            start_date
          )
        )
      `,
      )
      .eq("voter_profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("contests")
      .select("*")
      .in("status", ["registration", "judging"])
      .order("start_date", { ascending: true })
      .limit(3),
  ]);

  if (votesError) throw new Error(votesError.message);
  if (contestsError) throw new Error(contestsError.message);

  const scores = (votes as VoteQueryRow[]).map((vote) => vote.score);

  return {
    totalVotes: scores.length,
    averageScore: average(scores),
    latestVotes: votes as VoteQueryRow[],
    upcomingContests: upcoming ?? [],
  };
}

export async function fetchProducerDashboard(profileId: string) {
  const [{ data: entriesData, error: entriesError }, { data: contestsData, error: contestsError }] = await Promise.all([
    supabase
      .from("entries")
      .select(
        `
      *,
      contest:contests (
        id,
        name,
        status,
        start_date,
        registration_close_date
      ),
      judge_scores(overall_score),
      public_votes(score)
    `,
      )
      .eq("producer_id", profileId)
      .order("updated_at", { ascending: false }),
    // Récupérer tous les concours en cours d'inscription pour les deadlines
    supabase
      .from("contests")
      .select("id, name, status, start_date, registration_close_date, end_date")
      .eq("status", "registration")
      .not("registration_close_date", "is", null)
      .gt("registration_close_date", new Date().toISOString())
      .order("registration_close_date", { ascending: true }),
  ]);

  if (entriesError) throw new Error(entriesError.message);
  if (contestsError) throw new Error(contestsError.message);

  const entries = (entriesData as ProducerEntryRow[]) ?? [];
  const totals = {
    totalEntries: entries.length,
    approved: entries.filter((entry) => entry.status === "approved").length,
    submitted: entries.filter((entry) => entry.status === "submitted" || entry.status === "under_review").length,
    draft: entries.filter((entry) => entry.status === "draft").length,
  };

  const judgeAverages = entries
    .map((entry) => average(entry.judge_scores?.map((score) => score.overall_score) ?? []))
    .filter((value): value is number => value !== null);
  const overallAverage = average(judgeAverages);

  const nextDeadline = entries
    .map((entry) => entry.contest?.registration_close_date)
    .filter(Boolean)
    .sort()[0];

  const normalizedEntries = entries.map((entry) => {
    const judgeScores = entry.judge_scores?.map((score) => score.overall_score) ?? [];
    const publicScores = entry.public_votes?.map((vote) => vote.score) ?? [];
    return {
      ...entry,
      judgeAverage: average(judgeScores),
      judgeScoresCount: judgeScores.length,
      publicAverage: average(publicScores),
      publicVotesCount: publicScores.length,
    };
  });

  // Compter les entrées par concours pour les deadlines
  const entriesByContest = new Map<string, number>();
  entries.forEach((entry) => {
    if (entry.contest?.id) {
      entriesByContest.set(entry.contest.id, (entriesByContest.get(entry.contest.id) || 0) + 1);
    }
  });

  // Formater les deadlines avec le nombre d'entrées
  const deadlines = (contestsData || []).map((contest) => ({
    contest_id: contest.id,
    contest_name: contest.name,
    contest_status: contest.status,
    registration_close_date: contest.registration_close_date,
    start_date: contest.start_date,
    end_date: contest.end_date,
    entries_count: entriesByContest.get(contest.id) || 0,
  }));

  return {
    totals,
    overallAverage,
    nextDeadline: nextDeadline ?? null,
    entries: normalizedEntries,
    deadlines,
  };
}

export async function fetchJudgeDashboard(profileId: string) {
  const [{ data: assignments, error: assignmentsError }, { data: reviews, error: reviewsError }] = await Promise.all([
    supabase
      .from("contest_judges")
      .select(
        `
        invitation_status,
        created_at,
        contest:contests (
          id,
          name,
          status,
          start_date,
          end_date,
          location
        )
      `,
      )
      .eq("judge_id", profileId)
      .order("created_at", { ascending: true }),
    supabase
      .from("judge_scores")
      .select(
        `
        id,
        overall_score,
        created_at,
        entry:entries (
          id,
          strain_name,
          category,
          contest:contests (
            id,
            name,
            status,
            start_date
          )
        )
      `,
      )
      .eq("judge_id", profileId)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  if (assignmentsError) throw new Error(assignmentsError.message);
  if (reviewsError) throw new Error(reviewsError.message);

  const totalReviews = reviews?.length ?? 0;
  const averageScore = average((reviews as JudgeScoreRow[]).map((review) => review.overall_score));

  return {
    assignments: assignments ?? [],
    reviews: (reviews as JudgeScoreRow[]) ?? [],
    stats: {
      totalReviews,
      averageScore,
    },
  };
}

