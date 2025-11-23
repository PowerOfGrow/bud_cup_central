// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
}

const supabase = createClient(supabaseUrl ?? "", serviceRoleKey ?? "");

const average = (values: number[]) => {
  if (!values.length) return null;
  const total = values.reduce((acc, value) => acc + value, 0);
  return Math.round((total / values.length) * 10) / 10;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Supabase credentials missing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const profileId = url.searchParams.get("profileId");

  if (!profileId) {
    return new Response(JSON.stringify({ error: "Missing profileId query param" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { data, error } = await supabase
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
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const entries = data ?? [];
    const totals = {
      totalEntries: entries.length,
      approved: entries.filter((entry) => entry.status === "approved").length,
      submitted: entries.filter((entry) => entry.status === "submitted" || entry.status === "under_review").length,
      draft: entries.filter((entry) => entry.status === "draft").length,
    };

    const judgeAverages = entries
      .map((entry) => average((entry.judge_scores ?? []).map((score: any) => score.overall_score)))
      .filter((value): value is number => value !== null);

    const nextDeadline = entries
      .map((entry) => entry.contest?.registration_close_date)
      .filter(Boolean)
      .sort()[0] ?? null;

    const normalizedEntries = entries.map((entry) => {
      const judgeScores = (entry.judge_scores ?? []).map((score: any) => score.overall_score);
      const publicVotes = (entry.public_votes ?? []).map((vote: any) => vote.score);
      return {
        ...entry,
        judgeAverage: average(judgeScores),
        judgeScoresCount: judgeScores.length,
        publicAverage: average(publicVotes),
        publicVotesCount: publicVotes.length,
      };
    });

    const payload = {
      totals,
      overallAverage: average(judgeAverages),
      nextDeadline,
      entries: normalizedEntries,
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("producer-dashboard error", error);
    return new Response(JSON.stringify({ error: error.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

