// api/audio.js — Proxy audio Coran pour Vercel (ESM)

const SLUGS_MAP = {
  'ar.alafasy':            'Alafasy_128kbps',
  'ar.husary':             'Husary_128kbps',
  'ar.abdurrahmaansudais': 'Abdul_Basit_Murattal_192kbps',
  'ar.saoodshuraym':       'Ghamadi_40kbps',
  'ar.minshawi':           'Minshawy_Murattal_128kbps',
};

export default async function handler(req, res) {
  const { slug, v } = req.query || {};

  // Test de santé : /api/audio?slug=ar.alafasy&v=0
  if (v === '0') {
    res.setHeader('Content-Type', 'text/plain');
    return res.end('PROXY OK — Node ' + process.version);
  }

  if (!SLUGS_MAP[slug] || !v || isNaN(Number(v))) {
    return res.status(400).end('Params invalides');
  }

  const vNum = parseInt(v);
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120',
    'Accept': 'audio/mpeg, audio/*;q=0.9, */*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    'Referer': 'https://quran.com/',
    'Origin': 'https://quran.com',
  };

  // CDNs à essayer dans l'ordre
  const urls = [
    `https://cdn.islamic.network/quran/audio/128/${slug}/${vNum}.mp3`,
    `https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/${String(vNum).padStart(3,'0')}.mp3`,
  ];

  let lastErr = 'aucun CDN tenté';

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      const r = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeout);

      if (!r.ok) {
        lastErr = `HTTP ${r.status} — ${url}`;
        continue;
      }

      const buf = await r.arrayBuffer();
      if (buf.byteLength < 1000) {
        lastErr = `Réponse trop petite (${buf.byteLength} bytes) — ${url}`;
        continue;
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buf.byteLength);
      res.setHeader('Cache-Control', 'public, max-age=604800');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.end(Buffer.from(buf));
    } catch (e) {
      lastErr = e.message + ' — ' + url;
    }
  }

  // Retourne l'erreur en clair pour diagnostic
  res.status(502).setHeader('Content-Type', 'text/plain');
  res.end('ERREUR PROXY: ' + lastErr);
}
