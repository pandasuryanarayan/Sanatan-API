// Dashboard usage stats for the logged-in user.
import { Router } from "express";
import { supabaseAdmin, TIERS } from "../config/supabase.js";
import { requireUser } from "../middleware/requireUser.js";

const router = Router();
const TIER = TIERS.free;

function ymd(d) { return d.toISOString().slice(0, 10); }

// GET /usage/stats
router.get("/stats", requireUser, async (req, res, next) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();

    const [month, today, recent, week] = await Promise.all([
      supabaseAdmin.from("api_usage_logs").select("id", { count: "exact", head: true })
        .eq("user_id", req.user.id).gte("timestamp", startOfMonth),
      supabaseAdmin.from("api_usage_logs").select("id", { count: "exact", head: true })
        .eq("user_id", req.user.id).gte("timestamp", startOfDay),
      supabaseAdmin.from("api_usage_logs")
        .select("endpoint, status_code, timestamp")
        .eq("user_id", req.user.id)
        .order("timestamp", { ascending: false })
        .limit(15),
      supabaseAdmin.from("api_usage_logs")
        .select("timestamp")
        .eq("user_id", req.user.id)
        .gte("timestamp", new Date(Date.now() - 7 * 864e5).toISOString()),
    ]);
    for (const r of [month, today, recent, week]) if (r.error) throw r.error;

    // Bucket the last 7 days.
    const buckets = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      buckets[ymd(d)] = 0;
    }
    (week.data || []).forEach((r) => {
      const k = ymd(new Date(r.timestamp));
      if (k in buckets) buckets[k] += 1;
    });

    res.json({
      total_this_month: month.count || 0,
      today: today.count || 0,
      quota: TIER.monthly,
      plan: "Free",
      daily: Object.entries(buckets).map(([date, count]) => ({ date, count })),
      recent: recent.data || [],
    });
  } catch (e) { next(e); }
});

export default router;
