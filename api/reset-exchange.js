// api/reset-exchange.js

const { createClient } = require("@supabase/supabase-js");

module.exports = async function handler(req, res) {
  try {
    const { token, type } = req.query;

    if (!token || type !== "recovery") {
      return res.status(400).send("Invalid reset link.");
    }

    // Supabase server client (SERVICE ROLE)
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Exchange PKCE token server-side
    const { data, error } = await supabase.auth.exchangeCodeForSession(token);

    if (error) {
      console.error("SUPABASE ERROR:", error);
      return res.status(401).send("Invalid or expired recovery link.");
    }

    // Write cookies
    res.setHeader("Set-Cookie", [
      `giftzly_access_token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      `giftzly_refresh_token=${data.session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax`,
    ]);

    // Redirect to your HTML page
    return res.redirect(302, "/reset-password");
  } catch (err) {
    console.error("FATAL ERROR:", err);
    return res.status(500).send("Server internal error.");
  }
};
