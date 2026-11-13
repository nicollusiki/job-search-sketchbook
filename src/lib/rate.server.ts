/** Simple per-user rate limit backed by a server-only table. Throws when exceeded. */
export async function rateLimit(userId: string, action: string, max: number, windowMinutes: number) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const since = new Date(Date.now() - windowMinutes * 60_000).toISOString();
  const { count, error } = await supabaseAdmin
    .from("rate_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", since);
  if (error) throw new Error("Please try again later.");
  if ((count ?? 0) >= max) {
    console.warn("rate_limited", { action });
    throw new Error("Too many requests. Please wait a bit and try again.");
  }
  await supabaseAdmin.from("rate_events").insert({ user_id: userId, action });
}
