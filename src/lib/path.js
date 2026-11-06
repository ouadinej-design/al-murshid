// ═══════════════════════════════════════════════════════
// PARCOURS — les 500 mots en 100 leçons de 5 mots (les plus fréquents d'abord),
// regroupées en 10 niveaux. Méthode : Découvrir → Reconnaître → Retrouver,
// puis les mots entrent dans la révision espacée.
// ═══════════════════════════════════════════════════════
import VOCAB from "../vocabData";
import { localDayKey, startOfLocalDay } from "./progress";

export const WORDS_PER_UNIT = 5;
export const UNITS_PER_LEVEL = 10;
const KEY = "path_progress_v1";
const ANKI = "anki_cards";

export const RANKED = [...VOCAB].sort((a, b) => (b.freq || 0) - (a.freq || 0));
export const UNITS = Array.from({ length: Math.ceil(RANKED.length / WORDS_PER_UNIT) }, (_, i) =>
  RANKED.slice(i * WORDS_PER_UNIT, (i + 1) * WORDS_PER_UNIT));

export const LEVEL_NAMES = [
  "Les incontournables", "Les piliers", "Les mots du quotidien", "Récits et prophètes", "Foi et adoration",
  "Le monde créé", "Actions et paroles", "L'au-delà", "Nuances et détails", "Vers la maîtrise",
];
export const LEVELS = Array.from({ length: Math.ceil(UNITS.length / UNITS_PER_LEVEL) }, (_, l) => ({
  index: l,
  name: LEVEL_NAMES[l] || `Niveau ${l + 1}`,
  units: Array.from({ length: UNITS_PER_LEVEL }, (_, k) => l * UNITS_PER_LEVEL + k).filter((u) => u < UNITS.length),
}));

function read(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* stockage indisponible */ }
}

export function getPath() {
  return read(KEY, { done: {} });
}

/** Leçon à faire ensuite (la première non terminée). */
export function nextUnit(path = getPath()) {
  const i = UNITS.findIndex((_, k) => !path.done[k]);
  return i < 0 ? null : i;
}

export function isUnlocked(unit, path = getPath()) {
  return unit === 0 || !!path.done[unit - 1] || !!path.done[unit];
}

/**
 * Termine une leçon : enregistre le score (1 à 3 étoiles) et ajoute les mots
 * à la révision espacée (prochaine révision : demain).
 */
export function completeUnit(unit, accuracy, now = new Date()) {
  const path = getPath();
  const stars = accuracy >= 0.95 ? 3 : accuracy >= 0.75 ? 2 : 1;
  const prev = path.done[unit];
  path.done[unit] = { stars: Math.max(stars, prev?.stars || 0), date: localDayKey(now) };
  write(KEY, path);

  const cards = read(ANKI, {});
  const tomorrow = startOfLocalDay(new Date(now.getTime() + 86400000));
  for (const w of UNITS[unit] || []) {
    const c = cards[w.id];
    if (!c || !(c.reps > 0)) cards[w.id] = { interval: 1, ease: 2.5, reps: 1, nextReview: tomorrow, lastQuality: 2 };
  }
  write(ANKI, cards);
  return { stars, path };
}

export function pathStats(path = getPath()) {
  const doneUnits = Object.keys(path.done).length;
  return { doneUnits, words: Math.min(RANKED.length, doneUnits * WORDS_PER_UNIT), totalUnits: UNITS.length };
}

/** Choix de réponses : la bonne + 3 autres sens différents (pris dans la leçon puis ailleurs). */
export function makeOptions(word, field, pool = RANKED, rand = Math.random) {
  const seen = new Set([word[field]]);
  const others = [];
  const shuffled = [...pool].sort(() => rand() - 0.5);
  for (const w of shuffled) {
    if (others.length >= 3) break;
    if (!seen.has(w[field])) { seen.add(w[field]); others.push(w); }
  }
  return [word, ...others].sort(() => rand() - 0.5);
}
