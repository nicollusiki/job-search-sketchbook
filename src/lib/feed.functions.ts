import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cvSchema, type CV } from "./cv";

export type FeedJob = {
  id: string;
  role: string;
  company: string;
  city: string;
  remote: string;
  contract_type: string;
  pay_min: number;
  pay_max: number;
  pay_period: string;
  description: string;
  source_name: string;
  source_url: string;
  is_sample: boolean;
  posted_at: string;
  score: number | null;
  rank: number | null;
  reason: string | null;
  avg_rating: number | null;
  review_count: number;
  stage: string | null;
  user_job_id: string | null;
};

const MATCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    reason: { type: "string" },
  },
  required: ["score", "reason"],
};

/** Only the data the model needs: skills, languages, studies, experience titles and preferences. */
function minimalProfile(cv: CV) {
  return {
    education: cv.education.map((e) => ({ level: e.level, field: e.field })),
    experience: cv.experience.items.map((x) => ({ title: x.title, description: x.description })),
    skills: cv.skills,
    languages: cv.languages,
    certificates: cv.certificates.map((c) => c.name),
    preferences: cv.preferences,
  };
}

/** AI task 2: score each listing against the CV. Results are logged in job_matches. */
export const refreshMatches = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: cvRow } = await supabase
      .from("cv_answers")
      .select("data, updated_at, completed")
      .eq("user_id", userId)
      .maybeSingle();
    if (!cvRow?.completed) return { updated: 0, needsCv: true };
    const cv = cvSchema.parse(cvRow.data);
    if (cv.skills.length === 0 && cv.languages.length === 0) return { updated: 0, needsCv: true };

    const [{ data: jobs }, { data: existing }] = await Promise.all([
      supabase.from("jobs").select("id, role, company, city, remote, contract_type, pay_min, pay_max, pay_period, description, skills, languages"),
      supabase.from("job_matches").select("job_id, cv_version").eq("user_id", userId),
    ]);
    const fresh = new Set(
      (existing ?? []).filter((m) => new Date(m.cv_version) >= new Date(cvRow.updated_at)).map((m) => m.job_id),
    );
    const todo = (jobs ?? []).filter((j) => !fresh.has(j.id));
    if (todo.length === 0) return { updated: 0, needsCv: false };

    const { rateLimit } = await import("./rate.server");
    await rateLimit(userId, "match_refresh", 10, 60);
    const { aiJson, untrusted, AI_MODEL } = await import("./ai.server");
    const profile = JSON.stringify(minimalProfile(cv));
    const system =
      "You rate how well a job seeker fits one job listing, from 0 (no fit) to 100 (perfect fit), using only skills, languages, studies, experience and stated preferences. " +
      "Never consider age, gender, nationality, photo or any protected trait. " +
      "Reason: one plain sentence under 20 words naming the matching skills or languages, e.g. 'Matches your Excel and Spanish'.";

    const results = await Promise.allSettled(
      todo.map(async (job) => {
        const raw = (await aiJson({
          system,
          name: "match_score",
          schema: MATCH_SCHEMA,
          content: [
            { type: "input_text", text: untrusted("candidate_profile", profile) },
            { type: "input_text", text: untrusted("job_listing", JSON.stringify(job)) },
          ],
        })) as { score?: unknown; reason?: unknown };
        const score = Math.max(0, Math.min(100, Math.round(Number(raw.score))));
        const reason = String(raw.reason ?? "").replace(/\s+/g, " ").trim().slice(0, 200);
        if (!Number.isFinite(score) || !reason) throw new Error("bad output");
        return { user_id: userId, job_id: job.id, score, reason, model: AI_MODEL, cv_version: cvRow.updated_at, created_at: new Date().toISOString() };
      }),
    );
    const rows = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
    if (rows.length) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("job_matches").upsert(rows);
    }
    return { updated: rows.length, needsCv: false, failed: todo.length - rows.length };
  });

export const getFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ jobs: FeedJob[]; newCount: number }> => {
    const { supabase, userId } = context;
    const [jobsQ, matchesQ, ratingsQ, ujQ, rejQ] = await Promise.all([
      supabase.from("jobs").select("*"),
      supabase.from("job_matches").select("job_id, score, reason").eq("user_id", userId),
      supabase.rpc("get_job_ratings"),
      supabase.from("user_jobs").select("id, job_id, stage").eq("user_id", userId),
      supabase.from("rejections").select("role").eq("user_id", userId),
    ]);
    const matches = new Map((matchesQ.data ?? []).map((m) => [m.job_id, m]));
    const ratings = new Map((ratingsQ.data ?? []).map((r) => [r.job_id, r]));
    const uj = new Map((ujQ.data ?? []).filter((u) => u.job_id).map((u) => [u.job_id!, u]));
    const allJobs = jobsQ.data ?? [];

    // Mild signals: dismissed jobs and logged rejections lower similar jobs a little (max -10).
    const dismissed = allJobs.filter((j) => uj.get(j.id)?.stage === "dismissed");
    const rejectedRoles = (rejQ.data ?? []).map((r) => r.role.toLowerCase());
    const penalty = (j: (typeof allJobs)[number]) => {
      let p = 0;
      for (const d of dismissed) if (d.id !== j.id && d.contract_type === j.contract_type && d.skills.some((s) => j.skills.includes(s))) p += 3;
      for (const r of rejectedRoles) if (r && j.role.toLowerCase().includes(r.split(" ")[0] ?? "")) p += 2;
      return Math.min(10, p);
    };

    const jobs: FeedJob[] = allJobs.map((j) => {
      const m = matches.get(j.id);
      const r = ratings.get(j.id);
      const u = uj.get(j.id);
      return {
        id: j.id, role: j.role, company: j.company, city: j.city, remote: j.remote,
        contract_type: j.contract_type, pay_min: j.pay_min, pay_max: j.pay_max, pay_period: j.pay_period,
        description: j.description, source_name: j.source_name, source_url: j.source_url,
        is_sample: j.is_sample, posted_at: j.posted_at,
        score: m?.score ?? null,
        rank: m ? m.score - penalty(j) : null,
        reason: m?.reason ?? null,
        avg_rating: r ? Number(r.avg_rating) : null,
        review_count: r?.review_count ?? 0,
        stage: u?.stage ?? null,
        user_job_id: u?.id ?? null,
      };
    });
    jobs.sort((a, b) => (b.rank ?? -1) - (a.rank ?? -1));
    const newCount = jobs.filter((j) => !j.stage && (j.score ?? 0) >= 60).length;
    return { jobs, newCount };
  });
