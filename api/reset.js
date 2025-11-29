// /api/reset.js — Route Vercel

export default async function handler(req, res) {
  try {
    const { token_hash, type, redirect_to } = req.query;

    // Vérification des params obligatoires
    if (!token_hash || !type) {
      return res.status(400).json({
        error: "missing_params",
        message: "token_hash and type are required"
      });
    }

    // Redirection propre vers Supabase Auth
    const supabaseProjectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    const target = `${supabaseProjectUrl}/auth/v1/verify?type=${encodeURIComponent(type)}&token_hash=${encodeURIComponent(token_hash)}${redirect_to ? `&redirect_to=${encodeURIComponent(redirect_to)}` : ""}`;

    // On redirige (301 ou 302)
    return res.redirect(302, target);

  } catch (error) {
    console.error("reset.js ERROR:", error);

    return res.status(500).json({
      error: "server_error",
      message: error.message
    });
  }
}
