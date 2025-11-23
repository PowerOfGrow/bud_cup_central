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
    const [{ data: votes, error: votesError }, { data: contests, error: contestsError }] = await Promise.all([
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
        .select("id, name, status, start_date, location")
        .in("status", ["registration", "judging"])
        .order("start_date", { ascending: true })
        .limit(3),
    ]);

    if (votesError) throw votesError;
    if (contestsError) throw contestsError;

    const scores = (votes ?? []).map((vote) => vote.score ?? 0);

    const payload = {
      totalVotes: scores.length,
      averageScore: average(scores),
      latestVotes: votes ?? [],
      upcomingContests: contests ?? [],
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("viewer-dashboard error", error);
    return new Response(JSON.stringify({ error: error.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

