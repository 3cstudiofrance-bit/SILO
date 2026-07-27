/**
 * Legacy endpoint intentionally disabled.
 *
 * The Replit prototype returned a placeholder JWT and trusted project/user IDs
 * from the request body. Video access must instead be issued by the canonical
 * API after authorizeProject() validates the Clerk identity and project role.
 */
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const allowedOrigin = Deno.env.get("APP_ORIGIN") ?? "";

serve((request: Request) => {
  const origin = request.headers.get("origin") ?? "";
  const corsHeaders =
    allowedOrigin && origin === allowedOrigin
      ? {
          "Access-Control-Allow-Origin": allowedOrigin,
          "Access-Control-Allow-Headers":
            "authorization, content-type",
          Vary: "Origin",
        }
      : {};

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: origin === allowedOrigin ? 204 : 403,
      headers: corsHeaders,
    });
  }

  return new Response(
    JSON.stringify({
      error:
        "Visioconférence désactivée jusqu’à l’émission de jetons depuis l’API SILO autorisée par projet.",
    }),
    {
      status: 503,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
});
