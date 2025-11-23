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

    if (assignmentsError) throw assignmentsError;
    if (reviewsError) throw reviewsError;

    const payload = {
      assignments: assignments ?? [],
      reviews: reviews ?? [],
      stats: {
        totalReviews: (reviews ?? []).length,
        averageScore: average((reviews ?? []).map((review) => review.overall_score ?? 0)),
      },
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("judge-dashboard error", error);
    return new Response(JSON.stringify({ error: error.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

