// api/audio.js — Proxy audio Coran
// Récupère les fichiers MP3 côté serveur (pas bloqué par les CDNs)
export default async function handler(req, res) {
  const { slug, v } = req.query;

  // Sécurité : seulement les slugs connus
  const SLUGS = ['ar.alafasy','ar.husary','ar.abdurrahmaansudais','ar.saoodshuraym','ar.minshawi'];
  if (!SLUGS.includes(slug) || !v || isNaN(Number(v))) {
    return res.status(400).end('Requête invalide');
  }

  const url = `https://cdn.islamic.network/quran/audio/128/${slug}/${v}.mp3`;

  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    if (!r.ok) return res.status(r.status).end('CDN error ' + r.status);

    const buf = await r.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(Buffer.from(buf));
  } catch (e) {
    res.status(500).end('Erreur: ' + e.message);
  }
}

