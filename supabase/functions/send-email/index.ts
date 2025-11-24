// Edge Function pour envoyer des emails de notification
// Note: Cette fonction nécessite la configuration d'un service d'email (Resend, SendGrid, etc.)
// et les secrets correspondants dans Supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  type: string;
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, html, type, userId }: EmailRequest = await req.json();

    // Vérifier les préférences de notification de l'utilisateur
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Récupérer les préférences de notification
    const { data: preferences, error: prefError } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (prefError && prefError.code !== "PGRST116") {
      throw prefError;
    }

    // Si les préférences n'existent pas ou si les emails sont désactivés, ne pas envoyer
    if (!preferences || !preferences.email_enabled) {
      return new Response(
        JSON.stringify({ message: "Email notifications disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Vérifier si ce type de notification est activé
    const emailTypeMap: Record<string, keyof typeof preferences> = {
      contest_created: "email_contest_created",
      entry_approved: "email_entry_approved",
      judge_assigned: "email_judge_assigned",
      results_published: "email_results_published",
      vote_received: "email_vote_received",
      score_received: "email_score_received",
    };

    const preferenceKey = emailTypeMap[type];
    if (preferenceKey && !preferences[preferenceKey]) {
      return new Response(
        JSON.stringify({ message: `Email notifications for ${type} are disabled` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // TODO: Intégrer un service d'email (Resend, SendGrid, etc.)
    // Exemple avec Resend (nécessite RESEND_API_KEY dans les secrets Supabase)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      // En mode développement, on peut juste logger l'email
      console.log("Email would be sent:", { to, subject, html });
      return new Response(
        JSON.stringify({ 
          message: "Email service not configured. Email logged to console.",
          email: { to, subject }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Envoyer l'email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CBD Flower Cup <noreply@cbdflowercup.com>", // À configurer avec votre domaine
        to: [to],
        subject: subject,
        html: html,
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.json();
      throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
    }

    const result = await resendResponse.json();

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

