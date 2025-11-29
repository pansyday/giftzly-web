// /api/reset.js — Compatible Vercel Node 18 / Edge, Outlook, Apple Mail, etc.

export default async function handler(req, res) {
  try {
    // 1) Récupération de la query string brute
    const url = new URL(req.url, `https://${req.headers.host}`);

    let rawQuery = url.search.replace(/^\?/, "");

    // 2) Corrections nécessaires pour Outlook / Apple Mail
    rawQuery = rawQuery.replace(/&amp;/g, "&");

    // 3) Parsing propre via URLSearchParams
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

    // 4) Redirection vers Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

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
