// api/audio.js — Proxy audio Coran (CommonJS pour Vercel)
const https = require('https');
const http = require('http');

module.exports = async function handler(req, res) {
  const { slug, v } = req.query;

  const SLUGS = ['ar.alafasy','ar.husary','ar.abdurrahmaansudais','ar.saoodshuraym','ar.minshawi'];
  if (!SLUGS.includes(slug) || !v || isNaN(Number(v))) {
    res.status(400).end('Requête invalide');
    return;
  }

  const url = `https://cdn.islamic.network/quran/audio/128/${slug}/${v}.mp3`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
        'Accept': 'audio/mpeg, audio/*, */*',
      }
    });

    if (!response.ok) {
      res.status(response.status).end('CDN error ' + response.status);
      return;
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(Buffer.from(buffer));
  } catch (e) {
    res.status(500).end('Erreur proxy: ' + e.message);
  }
};
