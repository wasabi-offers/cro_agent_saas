/**
 * CRO product usage tracking.
 * Records what users do in the app: analyses, landings saved, chat, funnels, etc.
 * Fire-and-forget: never throws so it doesn't break the main flow.
 */

import { createClient } from "@supabase/supabase-js";

export type CroUsageEventType =
  | "landing_analyzed"
  | "landing_saved"
  | "chat_message"
  | "cro_analysis"
  | "cro_table_generated"
  | "ab_tests_generated"
  | "rag_query"
  | "page_view"
  | "funnel_created"
  | "funnel_updated"
  | "heatmap_viewed"
  | "explore_ai_query";

export interface CroUsagePayload {
  [key: string]: string | number | boolean | string[] | undefined | null;
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Track a CRO usage event (server-side). Safe to call from API routes.
 * Does nothing if Supabase is not configured.
 */
export async function trackCroUsage(
  eventType: CroUsageEventType,
  payload: CroUsagePayload = {},
  options?: { userId?: string; sessionId?: string }
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    await supabase.from("cro_usage_events").insert({
      event_type: eventType,
      payload: payload as Record<string, unknown>,
      user_id: options?.userId ?? null,
      session_id: options?.sessionId ?? null,
    });
  } catch {
    // Fire-and-forget: do not throw or log in production to avoid noise
  }
}
