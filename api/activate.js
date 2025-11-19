export default async function handler(req, res) {
  const { link } = req.query;

  if (!link) {
    return res.status(400).send("Missing link");
  }

  // Décoder l’URL complète envoyée par Supabase
  const decoded = decodeURIComponent(link);

  // Redirection vers Supabase pour confirmation de signup
  return res.redirect(307, decoded);
}
