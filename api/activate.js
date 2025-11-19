export default async function handler(req, res) {
  const { link, redirect_to } = req.query;

  if (!link) return res.status(400).send("Missing link");

  const decodedLink = decodeURIComponent(link);

  // Ajoute redirect_to à l’URL Supabase si fourni
  const finalUrl = redirect_to
    ? `${decodedLink}&redirect_to=${encodeURIComponent(redirect_to)}`
    : decodedLink;

  return res.redirect(307, finalUrl);
}
