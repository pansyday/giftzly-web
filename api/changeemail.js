export default async function handler(req, res) {
  const { token_hash } = req.query;

  if (!token_hash) {
    return res.status(400).send("Missing token hash");
  }

  const fullURL = `https://wboqgmorfyqfhzonbvkm.supabase.co/auth/v1/verify?type=email_change&token_hash=${token_hash}`;

  return res.redirect(307, fullURL);
}
