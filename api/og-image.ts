// api/og-image.ts — Vercel Serverless Function (Node.js)
// Génère un PNG OG Image dynamique basé sur le token public d’une liste

import type { VercelRequest, VercelResponse } from '@vercel/node';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// Police TTF compatible Satori (Poppins)
const fontUrl =
  'https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf';

let fontData: ArrayBuffer | null = null;

// Fonction utilitaire : fetch de la police
async function loadFont() {
  if (!fontData) {
    const res = await fetch(fontUrl);
    fontData = await res.arrayBuffer();
  }
  return fontData;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const token = req.query.token as string;

    if (!token) {
      res.status(400).send('Missing token');
      return;
    }

    // 1) Récupération de la liste via Supabase Edge Function
    const apiUrl = `${process.env.SUPABASE_URL}/functions/v1/public-list?token=${token}`;
    const publicListRes = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
    });

    if (!publicListRes.ok) {
      res.status(404).send('List not found');
      return;
    }

    const { list } = await publicListRes.json();

    const title = list.title || 'Liste de cadeaux';
    const cover =
      list.cover_url ||
      'https://giftzly-web.vercel.app/assets/og-default.png';

    // 2) Police
    const font = await loadFont();

    // 3) SVG via Satori — VERSION FIXÉE
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
            // IMAGE DE COVER (plein écran – obligatoire pour Satori)
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

            // OVERLAY NOIR
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '1200px',
                  height: '630px',
                  background: 'rgba(0,0,0,0.38)',
                },
              },
            },

            // GRADIENT TEAL
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '1200px',
                  height: '630px',
                  background:
                    'linear-gradient(180deg, rgba(20,184,166,0.35), rgba(0,0,0,0.55))',
                },
              },
            },

            // VIGNETTE (assombrissement)
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '1200px',
                  height: '630px',
                  background:
                    'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.55) 85%)',
                },
              },
            },

            // --- CARTE GLASS ---
            {
              type: 'div',
              props: {
                style: {
                  width: '820px',
                  padding: '60px 40px',
                  borderRadius: '32px',
                  background: 'rgba(255,255,255,0.18)',
                  border: '1px solid rgba(255,255,255,0.22)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  zIndex: 10,
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        color: 'white',
                        fontSize: '72px',
                        fontWeight: 700,
                        textAlign: 'center',
                        lineHeight: 1.2,
                        textShadow: '0 4px 14px rgba(0,0,0,0.45)',
                      },
                      children: title,
                    },
                  },
                ],
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

    // 4) Convert SVG → PNG
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
