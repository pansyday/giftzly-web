import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.query.token as string;

  if (!token) {
    res.setHeader("Content-Type", "text/html");
    return res.status(200).send(``);
  }

  const ogUrl = `https://giftzly-web.vercel.app/api/og-image?token=${token}`;

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(`
    <meta property="og:image" content="${ogUrl}">
    <meta property="twitter:image" content="${ogUrl}">
    <meta name="twitter:card" content="summary_large_image">
  `);
}
