import type { VercelRequest, VercelResponse } from '@vercel/node';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

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

    let cover = list.cover_url || 'https://giftzly-web.vercel.app/assets/og-default.png';
    if (!(await validateImage(cover))) {
      cover = 'https://giftzly-web.vercel.app/assets/og-default.png';
    }

    const logoUrl = 'https://giftzly-web.vercel.app/assets/logo-light.png';
    const font = await loadFont();

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
            // BACKGROUND (1 child → OK)
            {
              type: 'img',
              props: {
                src: cover,
                style: {
                  position: 'absolute',
                  width: '1200px',
                  height: '630px',
                  objectFit: 'cover',
                  inset: 0,
                },
              },
            },

            // OVERLAY (1 child → OK)
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

            // CARD (has multiple children → MUST BE FLEX)
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
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '20px',
                  zIndex: 10,
                },
                children: [
                  // TITLE
                  {
                    type: 'div',
                    props: {
                      style: {
                        color: 'white',
                        fontSize: '72px',
                        fontWeight: 700,
                        textShadow: '0 4px 14px rgba(0,0,0,0.45)',
                      },
                      children: title,
                    },
                  },

                  // OWNER
                  {
                    type: 'div',
                    props: {
                      style: {
                        color: 'white',
                        fontSize: '32px',
                        opacity: 0.9,
                      },
                      children: `Créée par ${ownerName}`,
                    },
                  },
                ],
              },
            },

            // LOGO (1 child → OK)
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

    const png = new Resvg(svg, {
      fitTo: { mode: 'width', value: 1200 },
    })
      .render()
      .asPng();

    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(png);
  } catch (err: any) {
    res.status(500).send(err?.message || 'Unknown error');
  }
}
