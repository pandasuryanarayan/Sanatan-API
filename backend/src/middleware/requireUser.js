// Verifies the Supabase access token sent as `Authorization: Bearer <jwt>`.
// Used to protect dashboard/key-management endpoints.
import { supabaseAdmin } from "../config/supabase.js";

export async function requireUser(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing bearer token" });

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data || !data.user) {
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    req.user = data.user;

    // Make sure a profile row exists (belt-and-braces; a DB trigger also does this).
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: data.user.id, email: data.user.email }, { onConflict: "id", ignoreDuplicates: true });

    next();
  } catch (e) {
    next(e);
  }
}
