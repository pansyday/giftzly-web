// File: api/reset-exchange.js

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export default async function handler(req, res) {
  try {
    const token = req.query.token;
    const type = req.query.type;

    if (!token || type !== "recovery") {
      return res.status(400).send("Invalid reset link.");
    }

    // Configuration Supabase (server-side!)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY, // important
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1️⃣ Échange du code PKCE côté serveur
    const { data, error } = await supabase.auth.exchangeCodeForSession(token);

    if (error) {
      console.error("PKCE exchange error:", error);
      return res.status(401).send("Invalid or expired recovery link.");
    }

    // data.session contient {access_token, refresh_token, ...}

    // 2️⃣ On stocke access_token dans un cookie HTTP Only
    // Pour que ton HTML puisse utiliser updateUser() sans refaire l’échange
    res.setHeader("Set-Cookie", [
      `giftzly_access_token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      `giftzly_refresh_token=${data.session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax`
    ]);

    // 3️⃣ Redirection vers ta page reset-password
    return res.redirect(302, "/reset-password");

  } catch (err) {
    console.error("Unexpected error:", err);
    return res.status(500).send("Internal server error.");
  }
}
