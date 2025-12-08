// api/reset-exchange.js

const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  try {
    // Auth v3 → le paramètre est maintenant "code", plus "token"
    const code = req.query.code;

    if (!code) {
      return res.status(400).send("Invalid reset link: missing code.");
    }

    // Supabase server client (SERVICE ROLE)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    // Exchange PKCE code for a server-side session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("SUPABASE EXCHANGE ERROR:", error);
      return res.status(401).send("Invalid or expired recovery link.");
    }

    // Write cookies for the browser
    res.setHeader("Set-Cookie", [
      `giftzly_access_token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      `giftzly_refresh_token=${data.session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax`,
    ]);

    // Redirect to the reset-password UI
    return res.redirect(302, "/reset-password");

  } catch (err) {
    console.error("FATAL ERROR:", err);
    return res.status(500).send("Server internal error.");
  }
};
