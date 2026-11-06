// ═══════════════════════════════════════════════════════
// RECONNAÎTRE UN VERSET (« le Shazam du Coran »)
// On compare ce que la reconnaissance vocale a entendu avec les 6 236 versets.
// Le texte du Coran (sans voyelles) est téléchargé une seule fois puis gardé sur le téléphone.
// ═══════════════════════════════════════════════════════
import { normalizeAr, compareWord } from "./arabic";

const CORPUS_KEY = "quran_corpus_simple_v1";
const TR_KEY = "quran_verse_cache_v1";
const BASMALA = "بسم الله الرحمن الرحيم";
const API = "https://api.alquran.cloud/v1";

const skel = (w) => w.replace(/ا/g, "");

/** Prépare le corpus : [{ s, v, toks }] à partir d'un tableau de sourates [[texte v1, texte v2…], …]. */
export function buildCorpus(surahs) {
  const out = [];
  surahs.forEach((verses, si) => {
    verses.forEach((text, vi) => {
      let t = normalizeAr(text);
      if (si > 0 && vi === 0 && t.startsWith(BASMALA + " ")) t = t.slice(BASMALA.length + 1); // basmala en tête de sourate
      const toks = t.split(" ").filter(Boolean);
      const ske = toks.map(skel);
      out.push({ s: si + 1, v: vi + 1, toks, ske, sk: new Set(ske) });
    });
  });
  return out;
}

/** Plus longue suite de mots en commun (dans l'ordre), avec tolérance d'une lettre. */
function fuzzyLcs(a, b) {
  const m = a.length, n = b.length;
  let prev = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    const cur = new Array(n + 1).fill(0);
    for (let j = 1; j <= n; j++) {
      cur[j] = compareWord(a[i - 1], b[j - 1]) !== "wrong" ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    prev = cur;
  }
  return prev[n];
}

/**
 * Cherche les versets les plus proches de ce qui a été entendu.
 * Renvoie [{ s, v, score (0-100), matched }] du plus probable au moins probable.
 */
export function searchVerse(corpus, heard, n = 3) {
  const q = normalizeAr(heard).split(" ").filter(Boolean);
  if (q.length < 2 || !corpus?.length) return [];
  const qs = q.map(skel);
  const bigrams = new Set(qs.slice(1).map((w, i) => qs[i] + " " + w));

  // 1. pré-sélection rapide : mots et paires de mots en commun
  const pre = [];
  for (const e of corpus) {
    let hits = 0;
    for (const w of qs) if (e.sk.has(w)) hits++;
    if (hits < Math.min(2, qs.length)) continue;
    let bi = 0;
    const es = e.ske;
    for (let i = 1; i < es.length; i++) if (bigrams.has(es[i - 1] + " " + es[i])) bi++;
    pre.push({ e, quick: hits + bi * 2 });
  }
  pre.sort((a, b) => b.quick - a.quick);

  // 2. classement fin : suite de mots en commun, dans l'ordre
  const ranked = pre.slice(0, 40).map(({ e }) => {
    const lcs = fuzzyLcs(q, e.toks);
    const ofHeard = lcs / q.length;                 // part de ce qui a été dit retrouvée dans le verset
    const ofVerse = lcs / Math.max(1, e.toks.length); // part du verset récitée
    return { s: e.s, v: e.v, matched: lcs, score: Math.round((ofHeard * 0.75 + ofVerse * 0.25) * 100) };
  });
  ranked.sort((a, b) => b.score - a.score || b.matched - a.matched);
  return ranked.slice(0, n).filter((r) => r.matched >= 2);
}

let memo = null;
/** Charge le corpus (téléphone, sinon internet une seule fois). onProgress(texte) pour l'affichage. */
export async function loadCorpus(onProgress) {
  if (memo) return memo;
  try {
    const cached = localStorage.getItem(CORPUS_KEY);
    if (cached) { memo = buildCorpus(JSON.parse(cached)); return memo; }
  } catch { /* cache illisible */ }
  onProgress?.("Téléchargement du Coran (une seule fois)…");
  const res = await fetch(`${API}/quran/quran-simple-clean`);
  if (!res.ok) throw new Error("réseau");
  const json = await res.json();
  const surahs = json.data.surahs.map((s) => s.ayahs.map((a) => a.text));
  try { localStorage.setItem(CORPUS_KEY, JSON.stringify(surahs)); } catch { /* stockage plein : on garde en mémoire */ }
  memo = buildCorpus(surahs);
  return memo;
}

/** Texte uthmani + traduction française d'un verset (gardés en cache). */
export async function loadVerseDetails(s, v) {
  const key = `${s}:${v}`;
  let cache = {};
  try { cache = JSON.parse(localStorage.getItem(TR_KEY)) || {}; } catch { /* */ }
  if (cache[key]) return cache[key];
  const res = await fetch(`${API}/ayah/${key}/editions/quran-uthmani,fr.hamidullah`);
  if (!res.ok) throw new Error("réseau");
  const json = await res.json();
  const [ar, fr] = json.data;
  const out = { arabic: ar.text, french: fr.text, global: ar.number };
  cache[key] = out;
  const keys = Object.keys(cache);
  if (keys.length > 300) delete cache[keys[0]];
  try { localStorage.setItem(TR_KEY, JSON.stringify(cache)); } catch { /* */ }
  return out;
}
