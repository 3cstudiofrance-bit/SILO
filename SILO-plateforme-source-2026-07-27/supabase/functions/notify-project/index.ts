/**
 * Supabase Edge Function — notify-project
 * Crée une notification en base + envoie un email si nécessaire.
 *
 * Peut être appelée via supabase.functions.invoke('notify-project', { body: {...} })
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { userId, type, title, body, data, projectId } = await req.json() as {
      userId: string; type: string; title: string;
      body?: string; data?: Record<string, unknown>; projectId?: string;
    };

    // Insérer la notification
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      type,
      title,
      body,
      data,
      project_id: projectId,
    });

    if (error) throw error;

    // Récupérer les préférences email de l'utilisateur
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("email, notification_preferences")
      .eq("id", userId)
      .single();

    const prefs = profile?.notification_preferences as { email?: boolean } | null;
    if (prefs?.email && profile?.email) {
      // Déclencher l'envoi email via la function send-email
      await supabase.functions.invoke("send-email", {
        body: { to: profile.email, subject: title, html: `<p>${body ?? title}</p>` },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
