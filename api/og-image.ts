import type { VercelRequest, VercelResponse } from '@vercel/node';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Police compatible Satori
const fontUrl =
  'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf';

let fontData: ArrayBuffer | null = null;

async function loadFont() {
  if (!fontData) {
    const res = await fetch(fontUrl);
    fontData = await res.arrayBuffer();
  }
  return fontData;
}

// Vérifie si une image existe réellement (évite les 404)
async function validateImage(url: string) {
  try {
    const r = await fetch(url, { method: 'HEAD' });
    return r.ok;
  } catch (_) {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const token = req.query.token as string;

    if (!token) {
      res.status(400).send('Missing token');
      return;
    }

    // 1) Fetch from Supabase Edge Function
    const apiUrl = `${process.env.SUPABASE_URL}/functions/v1/public-list?token=${token}`;

    const publicListRes = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}` },
    });

    if (!publicListRes.ok) {
      res.status(404).send('List not found');
      return;
    }

    const { list } = await publicListRes.json();

    const title = list.title || 'Liste de cadeaux';
    const ownerName = list.owner_name || 'Un utilisateur Giftzly';

    // 2) Choix du cover (avec fallback intelligent)
    let cover = list.cover_url || 'https://giftzly-web.vercel.app/assets/og-default.png';

    const isValid = await validateImage(cover);
    if (!isValid) {
      cover = 'https://giftzly-web.vercel.app/assets/og-default.png';
    }

    // Logo Giftzly
    const logoUrl = 'https://giftzly-web.vercel.app/assets/logo-light.png';

    const font = await loadFont();

    // 3) SVG (Satori)
    const svg = await satori(
      {
        type: 'div',
        props: {
          style: {
            width: '1200px',
            height: '630px',
            position: 'relative',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontFamily: 'Poppins',
          },
          children: [
            // COVER
            {
              type: 'img',
              props: {
                src: cover,
                style: {
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '1200px',
                  height: '630px',
                  objectFit: 'cover',
                },
              },
            },

            // Overlay
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.45)',
                },
              },
            },

            // Carte glass
            {
              type: 'div',
              props: {
                style: {
                  width: '900px',
                  padding: '60px 50px',
                  borderRadius: '36px',
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                  backdropFilter: 'blur(12px)',
                  textAlign: 'center',
                },
                children: [
                  // TITRE
                  {
                    type: 'div',
                    props: {
                      style: {
                        color: 'white',
                        fontSize: '72px',
                        fontWeight: 700,
                        textShadow: '0 4px 14px rgba(0,0,0,0.45)',
                        marginBottom: '20px',
                      },
                      children: title,
                    },
                  },

                  // Created by XXX
                  {
                    type: 'div',
                    props: {
                      style: {
                        color: 'white',
                        fontSize: '32px',
                        opacity: 0.9,
                        fontWeight: 300,
                        marginTop: '10px',
                      },
                      children: `Créée par ${ownerName}`,
                    },
                  },
                ],
              },
            },

            // Logo Giftzly (bas droite)
            {
              type: 'img',
              props: {
                src: logoUrl,
                style: {
                  position: 'absolute',
                  right: '40px',
                  bottom: '40px',
                  width: '140px',
                  opacity: 0.85,
                },
              },
            },
          ],
        },
      },
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Poppins',
            data: font,
            weight: 400,
            style: 'normal',
          },
        ],
      }
    );

    // 4) SVG -> PNG
    const png = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
    })
      .render()
      .asPng();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(png);
  } catch (err: any) {
    res.status(500).send(err?.message || 'Unknown error');
  }
}
