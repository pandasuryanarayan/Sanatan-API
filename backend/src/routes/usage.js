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

    const [month, today, recent] = await Promise.all([
      supabaseAdmin.from("api_usage_logs").select("id", { count: "exact", head: true })
        .eq("user_id", req.user.id).gte("timestamp", startOfMonth),
      supabaseAdmin.from("api_usage_logs").select("id", { count: "exact", head: true })
        .eq("user_id", req.user.id).gte("timestamp", startOfDay),
      supabaseAdmin.from("api_usage_logs")
        .select("endpoint, status_code, timestamp")
        .eq("user_id", req.user.id)
        .order("timestamp", { ascending: false })
        .limit(15),
    ]);
    for (const r of [month, today, recent]) if (r.error) throw r.error;

    // 7-day buckets, aggregated inside Postgres (7 rows max).
    // Falls back to bounded row-fetching if usage_rpc.sql wasn't run yet.
    const buckets = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      buckets[ymd(d)] = 0;
    }
    const { data: dailyRpc, error: rpcErr } = await supabaseAdmin
      .rpc("get_usage_daily", { p_user_id: req.user.id, p_days: 7 });
    if (!rpcErr && dailyRpc) {
      for (const row of dailyRpc) {
        if (row.day in buckets) buckets[row.day] = Number(row.cnt) || 0;
      }
    } else {
      const { data: week, error: wErr } = await supabaseAdmin
        .from("api_usage_logs")
        .select("timestamp")
        .eq("user_id", req.user.id)
        .gte("timestamp", new Date(Date.now() - 7 * 864e5).toISOString())
        .limit(5000);
      if (wErr) throw wErr;
      (week || []).forEach((r) => {
        const k = ymd(new Date(r.timestamp));
        if (k in buckets) buckets[k] += 1;
      });
    }

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
