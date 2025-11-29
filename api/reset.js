export default async function handler(req, res) {
  try {
    const url = new URL(req.url, `https://${req.headers.host}`);

    let rawQuery = url.search.replace(/^\?/, "");
    rawQuery = rawQuery.replace(/&amp;/g, "&");

    const params = new URLSearchParams(rawQuery);

    const token_hash = params.get("token_hash");
    const type = params.get("type");
    const redirect_to = params.get("redirect_to");

    if (!token_hash || !type) {
      return res.status(400).json({
        error: "missing_params",
        message: "token_hash and type are required"
      });
    }

    // 🚨 RÉCUPÉRATION SÉCURISÉE DE L’URL SUPABASE
    let supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      null;

    if (!supabaseUrl) {
      return res.status(500).json({
        error: "missing_supabase_url",
        message: "NEXT_PUBLIC_SUPABASE_URL is not configured in Vercel"
      });
    }

    supabaseUrl = supabaseUrl.replace(/\/$/, ""); // retirer trailing slash

    const target =
      `${supabaseUrl}/auth/v1/verify` +
      `?type=${encodeURIComponent(type)}` +
      `&token_hash=${encodeURIComponent(token_hash)}` +
      (redirect_to
        ? `&redirect_to=${encodeURIComponent(redirect_to)}`
        : "");

    return res.redirect(307, target);
  } catch (error) {
    console.error("reset.js ERROR:", error);
    return res.status(500).json({
      error: "server_error",
      message: error.message
    });
  }
}
