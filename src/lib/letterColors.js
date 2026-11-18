// ═══════════════════════════════════════════════════════
// COULEURS DES LETTRES — pour mémoriser l'alphabet
// Chaque lettre a SA couleur ; les lettres de même forme (même « famille »)
// ont des teintes voisines. D'autres modes colorent selon une règle.
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from "react";

export const FAMILIES = [
  { key: "alif",   name: "Alif",                 letters: "ا",      hint: "Un simple trait vertical" },
  { key: "barque", name: "Famille de la barque", letters: "بتثنی",  hint: "Même forme, seuls les points changent" },
  { key: "coupe",  name: "Famille de la coupe",  letters: "جحخ",    hint: "Point dessous, rien, point dessus" },
  { key: "dal",    name: "Famille du dāl",       letters: "دذ",     hint: "Petit angle, sans ou avec point" },
  { key: "ra",     name: "Famille du rāʾ",       letters: "رز",     hint: "Petite courbe qui descend" },
  { key: "sin",    name: "Famille des dents",    letters: "سش",     hint: "3 petites dents, sans ou avec 3 points" },
  { key: "sad",    name: "Famille de la boucle", letters: "صض",     hint: "Grande boucle couchée" },
  { key: "ta",     name: "Famille du tāʾ lourd", letters: "طظ",     hint: "Boucle + bâton vertical" },
  { key: "ayn",    name: "Famille de l'œil",     letters: "عغ",     hint: "Un « œil » ouvert en haut" },
  { key: "fa",     name: "Famille du fāʾ",       letters: "فق",     hint: "Petite tête ronde : 1 ou 2 points" },
  { key: "kaf",    name: "Kāf et Lām",           letters: "كل",     hint: "Grands traits verticaux" },
  { key: "mim",    name: "Mīm",                  letters: "م",      hint: "Petite tête ronde et queue" },
  { key: "ha",     name: "Hāʾ",                  letters: "ه",      hint: "Change beaucoup de forme !" },
  { key: "waw",    name: "Wāw",                  letters: "و",      hint: "Tête ronde et queue courbée" },
].map((f) => ({ ...f, letters: [...f.letters.replace("ی", "ي")] }));

/** Couleur propre à chaque lettre (teintes voisines dans une même famille, lisibles sur fond clair). */
export const LETTER_COLOR = {
  "ا": "#B45309",
  "ب": "#1D4ED8", "ت": "#0E7490", "ث": "#4338CA", "ن": "#0284C7", "ي": "#7C3AED",
  "ج": "#15803D", "ح": "#65A30D", "خ": "#166534",
  "د": "#EA580C", "ذ": "#9A3412",
  "ر": "#DC2626", "ز": "#991B1B",
  "س": "#C026D3", "ش": "#86198F",
  "ص": "#A16207", "ض": "#713F12",
  "ط": "#0D9488", "ظ": "#115E59",
  "ع": "#DB2777", "غ": "#9D174D",
  "ف": "#6D28D9", "ق": "#4C1D95",
  "ك": "#334155", "ل": "#E11D48",
  "م": "#CA8A04",
  "ه": "#0891B2",
  "و": "#059669",
};

export const NON_JOINING = new Set([..."ادذرزو"]);
export const SUN = new Set([..."تثدذرزسشصضطظلن"]);

export const COLOR_MODES = [
  { key: "lettre",   label: "🎨 Une couleur par lettre" },
  { key: "famille",  label: "👪 Familles (même forme)" },
  { key: "egoistes", label: "✋ Lettres égoïstes" },
  { key: "solaires", label: "☀️ Solaires / 🌙 lunaires" },
  { key: "noir",     label: "⚫ Sans couleur" },
];

const FAMILY_OF = Object.fromEntries(FAMILIES.flatMap((f) => f.letters.map((l) => [l, f])));
const FAMILY_COLOR = Object.fromEntries(FAMILIES.map((f) => [f.key, LETTER_COLOR[f.letters[0]]]));

export function familyOf(ar) {
  return FAMILY_OF[baseLetter(ar)] || null;
}

/** Lettre de base d'une forme (« ـبـ » → « ب », « أ » → « ا »). */
export function baseLetter(s) {
  const c = String(s || "").replace(/[ـ‍ً-ْٰ]/g, "").replace(/[أإآٱ]/g, "ا").replace("ى", "ي");
  return c[0] || "";
}

/** Couleur d'une lettre (ou d'une de ses formes) selon le mode choisi. */
export function colorOf(ar, mode = "lettre") {
  const l = baseLetter(ar);
  if (!LETTER_COLOR[l] || mode === "noir") return "#1A1A1A";
  if (mode === "famille") return FAMILY_COLOR[FAMILY_OF[l]?.key] || "#1A1A1A";
  if (mode === "egoistes") return NON_JOINING.has(l) ? "#E30613" : "#0F4C9B";
  if (mode === "solaires") return SUN.has(l) ? "#C2410C" : "#1D4ED8";
  return LETTER_COLOR[l];
}

/** Légende à afficher sous le sélecteur. */
export function legendOf(mode) {
  if (mode === "egoistes") return [
    { color: "#E30613", ar: "ا د ذ ر ز و", text: "ne s'attachent JAMAIS à la lettre suivante (2 formes seulement)" },
    { color: "#0F4C9B", text: "Les 22 autres — s'attachent des deux côtés (4 formes)" },
  ];
  if (mode === "solaires") return [
    { color: "#C2410C", text: "Solaires : le « l » de « al- » ne se prononce pas (ash-shams)" },
    { color: "#1D4ED8", text: "Lunaires : le « l » de « al- » se prononce (al-qamar)" },
  ];
  if (mode === "famille") return FAMILIES.filter((f) => f.letters.length > 1).map((f) => ({ color: FAMILY_COLOR[f.key], ar: f.letters.join(" "), text: f.hint }));
  if (mode === "lettre") return [{ color: "#1D4ED8", text: "Chaque lettre a sa couleur ; les lettres de même forme ont des couleurs voisines. Associe la couleur au son pour mieux retenir." }];
  return [];
}

const KEY = "letter_color_mode_v1";
const EVT = "letter-color-mode";
export function getColorMode() {
  try { return localStorage.getItem(KEY) || "lettre"; } catch { return "lettre"; }
}
export function setColorMode(mode) {
  try { localStorage.setItem(KEY, mode); } catch { /* stockage indisponible */ }
  window.dispatchEvent(new CustomEvent(EVT, { detail: mode }));
}
/** Mode de couleur partagé par toute l'app (Alphabet, jeux…). */
export function useColorMode() {
  const [mode, setMode] = useState(getColorMode);
  useEffect(() => {
    const on = (e) => setMode(e.detail);
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  return [mode, setColorMode];
}

/**
 * Découpe un mot (lettres sans voyelles) en morceaux d'une lettre chacun, avec des
 * « liants invisibles » (ZWJ) pour que chaque lettre garde sa forme attachée même
 * quand on la met dans sa propre couleur.
 */
export function joinedSegments(letters) {
  return letters.map((c, i) => {
    const prev = i > 0 && !NON_JOINING.has(letters[i - 1]);
    const next = i < letters.length - 1 && !NON_JOINING.has(c);
    return (prev ? "‍" : "") + c + (next ? "‍" : "");
  });
}
