// ═══════════════════════════════════════════════════════
// PROGRESSION — objectif du jour, série, XP, réglages
// Tout est calculé en HEURE LOCALE (la journée change à minuit chez l'utilisateur).
// ═══════════════════════════════════════════════════════
import { useSyncExternalStore } from "react";

const KEY = "almurshid_progress_v1";

/** "AAAA-MM-JJ" en heure locale (pas UTC). */
export function localDayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Début de la journée locale (minuit) en ms. */
export function startOfLocalDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Ajoute n jours à une clé de jour, en restant en heure locale. */
export function shiftDayKey(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  return localDayKey(new Date(y, m - 1, d + n));
}

// Types d'activité comptés dans l'objectif du jour, et XP gagnés
export const ACTIVITIES = {
  words:   { label: "Mots révisés",     icon: "📖", xp: 2  },
  quiz:    { label: "Réponses de quiz", icon: "🎯", xp: 1  },
  adhkar:  { label: "Adhkar complétés", icon: "📿", xp: 5  },
  recite:  { label: "Versets récités",  icon: "🎙️", xp: 3  },
  lessons: { label: "Leçons finies",    icon: "📚", xp: 10 },
  reading: { label: "Lectures",         icon: "🕌", xp: 10 },
};

const DEFAULT_SETTINGS = { dailyGoal: 10, arabicScale: 1 };

function emptyState() {
  return { days: {}, xp: 0, settings: { ...DEFAULT_SETTINGS } };
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const s = JSON.parse(raw);
    return { ...emptyState(), ...s, settings: { ...DEFAULT_SETTINGS, ...(s.settings || {}) } };
  } catch {
    return emptyState();
  }
}

let state = read();
const listeners = new Set();

function commit(next) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* stockage plein ou privé */ }
  listeners.forEach((l) => l());
}

export function subscribe(l) {
  listeners.add(l);
  const onStorage = (e) => { if (e.key === KEY) { state = read(); l(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}

export function getState() { return state; }

/** Enregistre une activité (ex : logActivity("words")). */
export function logActivity(type, n = 1, now = new Date()) {
  if (!ACTIVITIES[type] || n <= 0) return;
  const day = localDayKey(now);
  const today = { ...(state.days[day] || {}) };
  today[type] = (today[type] || 0) + n;
  // on ne garde que ~120 jours d'historique pour rester léger
  const days = { ...state.days, [day]: today };
  const keys = Object.keys(days).sort();
  if (keys.length > 120) keys.slice(0, keys.length - 120).forEach((k) => delete days[k]);
  commit({ ...state, days, xp: state.xp + ACTIVITIES[type].xp * n });
}

export function updateSettings(patch) {
  commit({ ...state, settings: { ...state.settings, ...patch } });
}

export function dayTotal(dayEntry) {
  if (!dayEntry) return 0;
  return Object.keys(ACTIVITIES).reduce((a, k) => a + (dayEntry[k] || 0), 0);
}

/**
 * Série : nombre de jours consécutifs avec au moins une activité.
 * Si rien n'est encore fait aujourd'hui, la série d'hier reste « en cours ».
 */
export function computeStreak(days, now = new Date()) {
  let key = localDayKey(now);
  if (dayTotal(days[key]) === 0) key = shiftDayKey(key, -1);
  let n = 0;
  while (dayTotal(days[key]) > 0) { n++; key = shiftDayKey(key, -1); }
  return n;
}

/** Les 7 derniers jours (du plus ancien au plus récent) pour le mini-graphe. */
export function lastDays(days, count = 7, now = new Date()) {
  const today = localDayKey(now);
  return Array.from({ length: count }, (_, i) => {
    const key = shiftDayKey(today, i - (count - 1));
    return { key, total: dayTotal(days[key]) };
  });
}

export const LEVELS = [0, 50, 150, 300, 500, 800, 1200, 1700, 2300, 3000, 4000];
export function levelFromXp(xp) {
  let lvl = 0;
  while (lvl + 1 < LEVELS.length && xp >= LEVELS[lvl + 1]) lvl++;
  const base = LEVELS[lvl];
  const next = LEVELS[lvl + 1] ?? base + 1000;
  return { level: lvl + 1, into: xp - base, span: next - base };
}

/** Hook React : se met à jour dès qu'une activité est enregistrée, partout dans l'app. */
export function useProgress() {
  const s = useSyncExternalStore(subscribe, getState);
  const todayKey = localDayKey();
  const today = s.days[todayKey] || {};
  const done = dayTotal(today);
  return {
    xp: s.xp,
    settings: s.settings,
    today,
    done,
    goal: s.settings.dailyGoal,
    goalReached: done >= s.settings.dailyGoal,
    streak: computeStreak(s.days),
    week: lastDays(s.days),
    level: levelFromXp(s.xp),
  };
}

/** Applique la taille du texte arabe (variable CSS lue par index.css). */
export function applyArabicScale(scale) {
  document.documentElement.style.setProperty("--ar-scale", String(scale));
}
