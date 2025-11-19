export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("Missing token");
  }

  // Reconstruit l'URL Supabase complète
  const fullURL = `https://wboqgmorfyqfhzonbvkm.supabase.co/auth/v1/verify?type=signup&token=${token}&redirect_to=https://giftzly.app/auth/callback`;

  return res.redirect(307, fullURL);
}
