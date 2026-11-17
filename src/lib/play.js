// ═══════════════════════════════════════════════════════
// JOUER & APPRENDRE — méthode « jeu » : accueil personnalisé, Mot du jour,
// flamme de série, Survie, Lettres qui tombent, tracer / relier.
// Fonctions pures (testées) + petit stockage local.
// ═══════════════════════════════════════════════════════
import VOCAB from "../vocabData";
import { localDayKey, shiftDayKey, isActiveDay } from "./progress";

const KEY = "play_v1";

export const LETTERS = [..."ابتثجحخدذرزسشصضطظعغفقكلمنهوي"];
const LETTER_SET = new Set(LETTERS);

/** Squelette d'un mot : sans voyelles ni signes, alifs hamzés ramenés à ا. */
export function skeleton(ar) {
  return (ar || "")
    .normalize("NFC")
    .replace(/[ً-ٰٟۖ-ۭـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/\s+/g, "");
}

/** Mots jouables : uniquement les 28 lettres de base, 3 à 6 lettres. */
export const PLAYABLE = VOCAB.filter((w) => {
  const s = [...skeleton(w.ar)];
  return s.length >= 3 && s.length <= 6 && s.every((c) => LETTER_SET.has(c));
});

/** Hachage simple et stable d'une chaîne. */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Le mot du jour : le même pour tout le monde un jour donné, jamais deux jours de suite. */
export function dailyWord(dayKey = localDayKey(), pool = PLAYABLE) {
  let i = hash(dayKey) % pool.length;
  const prev = hash(shiftDayKey(dayKey, -1)) % pool.length;
  if (i === prev) i = (i + 1) % pool.length;
  return pool[i];
}

/** Numéro du mot du jour (n° 1 = 1er novembre 2026). */
export function dailyNumber(dayKey = localDayKey()) {
  const [y, m, d] = dayKey.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d) - new Date(2026, 10, 1)) / 86400000) + 1;
}

/**
 * Note un essai lettre par lettre (comme un Wordle) :
 * "ok" bonne place, "near" lettre présente ailleurs, "no" absente.
 * Renvoie aussi la proximité (0 à 100) pour la barre « proche / loin ».
 */
export function scoreGuess(guess, answer) {
  const g = [...guess], a = [...answer];
  const marks = g.map(() => "no");
  const left = {};
  a.forEach((c, i) => { if (g[i] === c) marks[i] = "ok"; else left[c] = (left[c] || 0) + 1; });
  g.forEach((c, i) => { if (marks[i] !== "ok" && left[c] > 0) { marks[i] = "near"; left[c]--; } });
  const pts = marks.reduce((s, m) => s + (m === "ok" ? 2 : m === "near" ? 1 : 0), 0);
  const lenPenalty = Math.abs(g.length - a.length) * 0.5;
  const closeness = Math.max(0, Math.min(100, Math.round(((pts - lenPenalty) / (a.length * 2)) * 100)));
  return { marks, closeness, solved: guess === answer };
}

// ── Flamme de série : la couleur change avec la longueur de la série ──
export const FLAMES = [
  { min: 0,   name: "Éteinte",          color: "#94A3B8", glow: "#CBD5E1" },
  { min: 1,   name: "Flamme orange",    color: "#F58220", glow: "#FFD100" },
  { min: 7,   name: "Flamme rouge",     color: "#E30613", glow: "#F58220" },
  { min: 30,  name: "Flamme verte",     color: "#00A19A", glow: "#7EE0D9" },
  { min: 100, name: "Flamme bleue",     color: "#0F4C9B", glow: "#5B9BEA" },
  { min: 365, name: "Flamme violette",  color: "#7C3AED", glow: "#C4B5FD" },
  { min: 1000, name: "Flamme d'or",     color: "#B8860B", glow: "#FFD100" },
];
export function flameFor(streak) {
  let i = 0;
  while (i + 1 < FLAMES.length && streak >= FLAMES[i + 1].min) i++;
  return { ...FLAMES[i], index: i, next: FLAMES[i + 1] || null };
}

/**
 * Raviver la flamme (1 fois par mois) : possible si hier est vide mais avant-hier actif
 * (la série vient juste de casser) et si le rattrapage du mois n'a pas été utilisé.
 */
export function canRestore(days, lastRestoreMonth, now = new Date()) {
  const today = localDayKey(now);
  const y1 = shiftDayKey(today, -1), y2 = shiftDayKey(today, -2);
  return !isActiveDay(days[y1]) && isActiveDay(days[y2]) && lastRestoreMonth !== today.slice(0, 7);
}

// ── Accueil personnalisé et projection ──
export const GOALS = [
  { key: "comprendre", icon: "📖", label: "Comprendre le Coran" },
  { key: "reciter",    icon: "🎙️", label: "Mieux réciter" },
  { key: "priere",     icon: "🕌", label: "Comprendre ma prière" },
  { key: "lire",       icon: "✍️", label: "Apprendre à lire l'arabe" },
  { key: "enfants",    icon: "👨‍👧", label: "Transmettre à mes enfants" },
];
export const LEVELS_START = [
  { key: "zero",   label: "Je ne lis pas encore l'arabe" },
  { key: "lent",   label: "Je lis lentement" },
  { key: "bien",   label: "Je lis bien, je veux comprendre" },
];
export const MINUTES = [5, 10, 20, 30];

/**
 * Projection « si tu joues X min par jour » : mots du Coran connus à 1, 3 et 6 mois
 * (plafonnée aux 500 mots du parcours) et part des mots du Coran que cela couvre.
 */
export function projection(minutes, startWords = 0, total = 500) {
  const perDay = Math.max(1, Math.round(minutes / 3)); // ~1 mot nouveau toutes les 3 min (révisions comprises)
  const at = (days) => Math.min(total, startWords + perDay * days);
  const points = [
    { label: "Aujourd'hui", words: Math.min(total, startWords) },
    { label: "1 mois", words: at(30) },
    { label: "3 mois", words: at(91) },
    { label: "6 mois", words: at(182) },
  ];
  return { perDay, points };
}

// ── Survie : vagues de 5 mots, chrono qui raccourcit, mots plus rares ──
export function survieWave(wave) {
  return {
    seconds: Math.max(4, 10 - (wave - 1)),      // 10 s, 9 s… jusqu'à 4 s
    poolSize: Math.min(500, 40 + (wave - 1) * 40), // d'abord les mots les plus fréquents
    size: 5,
  };
}

// ── Lettres qui tombent : lettres du mot + leurres ──
export function fallingLetters(word, decoys = 3, rand = Math.random) {
  const target = [...skeleton(word.ar)];
  const others = LETTERS.filter((c) => !target.includes(c)).sort(() => rand() - 0.5).slice(0, decoys);
  return { target, tokens: [...target, ...others].sort(() => rand() - 0.5) };
}

// ── Tracer : comparaison entre le tracé et la lettre modèle ──
/**
 * mask : tableau (0/1) des pixels de la lettre modèle ; ink : tableau (0/1) du tracé (même taille).
 * coverage = part de la lettre recouverte ; outside = part du tracé hors de la lettre.
 */
export function traceScore(mask, ink) {
  let letter = 0, covered = 0, inkTotal = 0, out = 0;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) { letter++; if (ink[i]) covered++; }
    if (ink[i]) { inkTotal++; if (!mask[i]) out++; }
  }
  const coverage = letter ? covered / letter : 0;
  const outside = inkTotal ? out / inkTotal : 1;
  return { coverage, outside, ok: coverage >= 0.5 && outside <= 0.4 };
}

// ── Stockage ──
const EMPTY = { profile: null, daily: {}, best: { survie: 0, ninja: 0 }, restoreMonth: null, traced: {}, linked: 0 };

export function getPlay() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw), best: { ...EMPTY.best, ...(JSON.parse(raw).best || {}) } } : { ...EMPTY };
  } catch { return { ...EMPTY }; }
}
export function savePlay(patch) {
  const next = { ...getPlay(), ...patch };
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* stockage indisponible */ }
  return next;
}
export function saveBest(game, score) {
  const p = getPlay();
  if (score <= (p.best[game] || 0)) return false;
  savePlay({ best: { ...p.best, [game]: score } });
  return true;
}

// ── Lettres pour tracer / relier (nom, son, forme au début du mot) ──
export const ABC = [
  ["ا","Alif","a / ā","ا"],["ب","Bāʾ","b","بـ"],["ت","Tāʾ","t","تـ"],["ث","Thāʾ","th","ثـ"],["ج","Jīm","dj","جـ"],
  ["ح","Ḥāʾ","ḥ","حـ"],["خ","Khāʾ","kh","خـ"],["د","Dāl","d","د"],["ذ","Dhāl","dh","ذ"],["ر","Rāʾ","r","ر"],
  ["ز","Zayn","z","ز"],["س","Sīn","s","سـ"],["ش","Shīn","sh","شـ"],["ص","Ṣād","ṣ","صـ"],["ض","Ḍād","ḍ","ضـ"],
  ["ط","Ṭāʾ","ṭ","طـ"],["ظ","Ẓāʾ","ẓ","ظـ"],["ع","ʿAyn","ʿ","عـ"],["غ","Ghayn","gh","غـ"],["ف","Fāʾ","f","فـ"],
  ["ق","Qāf","q","قـ"],["ك","Kāf","k","كـ"],["ل","Lām","l","لـ"],["م","Mīm","m","مـ"],["ن","Nūn","n","نـ"],
  ["ه","Hāʾ","h","هـ"],["و","Wāw","w / ū","و"],["ي","Yāʾ","y / ī","يـ"],
].map(([ar, name, sound, ini]) => ({ ar, name, sound, ini }));

/** Lettres à points : rappel « les points font toujours partie de la lettre ». */
export const DOTTED = new Set([..."بتثجخذزشضظغفقني"]);

/** Une manche « relier » : n lettres prises dans une fenêtre qui avance avec les manches. */
export function linkRound(roundIndex, n = 4, rand = Math.random) {
  const start = (roundIndex * 3) % ABC.length;
  const window = Array.from({ length: 8 }, (_, i) => ABC[(start + i) % ABC.length]);
  return window.sort(() => rand() - 0.5).slice(0, n);
}

// ═══════════════════════════════════════════════════════
// NIVEAU ADAPTATIF : Lettres → Syllabes → Mots
// Une lettre est « connue » après 3 bonnes réponses (une erreur en retire une).
// Les jeux ne proposent que les lettres débloquées : 4 au départ, puis +1 par lettre connue.
// ═══════════════════════════════════════════════════════
export const STAGES = [
  { key: "lettres",  icon: "ا",  label: "Lettres",  desc: "Reconnaître les 28 lettres et leur son" },
  { key: "syllabes", icon: "بَ", label: "Syllabes", desc: "Lire une lettre avec sa voyelle : ba, bi, bu" },
  { key: "mots",     icon: "📖", label: "Mots",     desc: "Lire et comprendre les mots du Coran" },
];
export const KNOWN_AT = 3;                 // bonnes réponses pour connaître une lettre
export const LETTERS_FOR_SYLLABES = 20;    // lettres connues pour passer aux syllabes
export const SYLLABES_FOR_MOTS = 40;       // syllabes réussies pour passer aux mots

export function knownLetters(p = getPlay()) {
  return ABC.filter((l) => (p.letters?.[l.ar] || 0) >= KNOWN_AT);
}

/** Lettres proposées dans les jeux : les connues + 4 nouvelles (dans l'ordre de l'alphabet). */
export function unlockedLetters(p = getPlay()) {
  const known = new Set(knownLetters(p).map((l) => l.ar));
  const out = ABC.filter((l) => known.has(l.ar));
  for (const l of ABC) { if (out.length >= known.size + 4) break; if (!known.has(l.ar)) out.push(l); }
  return ABC.filter((l) => out.includes(l)); // garde l'ordre de l'alphabet
}

/** La prochaine lettre à apprendre (première non connue). */
export function nextLetter(p = getPlay()) {
  return ABC.find((l) => (p.letters?.[l.ar] || 0) < KNOWN_AT) || null;
}

/** Étape actuelle : choisie dans le profil, sinon déduite du niveau de départ et des progrès. */
export function currentStage(p = getPlay()) {
  if (p.profile?.stage) return p.profile.stage;
  const level = p.profile?.level;
  if (level === "bien") return "mots";
  if (level === "zero" && knownLetters(p).length < LETTERS_FOR_SYLLABES) return "lettres";
  if ((p.syll || 0) < SYLLABES_FOR_MOTS) return "syllabes";
  return "mots";
}

/** Enregistre une réponse sur une lettre (bonne : +1, jusqu'à 5 ; erreur : −1). */
export function recordLetter(ar, ok) {
  const p = getPlay();
  const cur = p.letters?.[ar] || 0;
  return savePlay({ letters: { ...(p.letters || {}), [ar]: Math.max(0, Math.min(5, cur + (ok ? 1 : -1))) } });
}
export function recordSyllable(ok) {
  if (!ok) return getPlay();
  return savePlay({ syll: (getPlay().syll || 0) + 1 });
}

const VOWELS = [
  { mark: "َ", v: "a", name: "fatḥa" },
  { mark: "ِ", v: "i", name: "kasra" },
  { mark: "ُ", v: "u", name: "ḍamma" },
];
const CONSONANT = { "ا": "", "ج": "j", "و": "w", "ي": "y", "ع": "ʿ" };

/** Syllabes d'une lettre : بَ ba, بِ bi, بُ bu (alif → أَ a, إِ i, أُ u). */
export function syllablesOf(l) {
  return VOWELS.map((vw) => {
    const base = l.ar === "ا" ? (vw.v === "i" ? "إ" : "أ") : l.ar;
    const c = l.ar in CONSONANT ? CONSONANT[l.ar] : l.sound.split(" ")[0];
    return { id: l.ar + vw.v, ar: base + vw.mark, fr: c + vw.v, letter: l.ar, vowel: vw.name };
  });
}

/** Lettres utilisées pour les syllabes : 6 au départ, puis 1 de plus toutes les 3 syllabes réussies. */
export function syllableLetters(p = getPlay()) {
  const known = knownLetters(p);
  const n = Math.min(28, 6 + Math.floor((p.syll || 0) / 3));
  return known.length >= n ? known : ABC.slice(0, n);
}

/**
 * Éléments de jeu pour une étape : { id, ar, fr } (fr = ce qu'il faut reconnaître).
 * null pour l'étape « mots » (les jeux utilisent alors le vocabulaire du Coran).
 */
export function stageItems(stage, p = getPlay()) {
  if (stage === "lettres") return unlockedLetters(p).map((l) => ({ id: l.ar, ar: l.ar, fr: `${l.name} · ${l.sound}`, letter: l.ar }));
  if (stage === "syllabes") return syllableLetters(p).flatMap(syllablesOf);
  return null;
}

/** 4 choix (la bonne réponse + 3 autres au libellé différent) parmi les éléments. */
export function itemOptions(item, pool, rand = Math.random) {
  const seen = new Set([item.fr]);
  const others = [];
  for (const x of [...pool].sort(() => rand() - 0.5)) {
    if (others.length >= 3) break;
    if (!seen.has(x.fr)) { seen.add(x.fr); others.push(x); }
  }
  return [item, ...others].sort(() => rand() - 0.5);
}

/** Formes d'une lettre : isolée, début, milieu, fin (les 6 lettres « qui ne s'attachent pas à gauche » n'ont que 2 formes). */
const NON_JOINING = new Set([..."اددذرزو"]);
export function letterForms(ar) {
  if (NON_JOINING.has(ar)) return [{ label: "Isolée", f: ar }, { label: "Fin", f: "ـ" + ar }];
  return [{ label: "Isolée", f: ar }, { label: "Début", f: ar + "ـ" }, { label: "Milieu", f: "ـ" + ar + "ـ" }, { label: "Fin", f: "ـ" + ar }];
}
