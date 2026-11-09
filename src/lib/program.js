// ═══════════════════════════════════════════════════════
// MON PROGRAMME DU JOUR — raccourcis réglés à l'avance, cochés chaque jour
// Item : { id, type, ref?, label, icon, days? }  (days : jours de la semaine 0=dim … 6=sam ; vide = tous les jours)
// Types : adhkarTab (ref = onglet), dhikr (ref = id), reading, kahf, lesson, revision, recite, custom
// ═══════════════════════════════════════════════════════
import { localDayKey } from "./progress";

const KEY = "daily_program_v1";
const DONE_KEY = "daily_program_done_v1";

export const DEFAULT_ITEMS = [
  { id: "d1", type: "adhkarTab", ref: "matin", label: "Adhkar du matin", icon: "🌅" },
  { id: "d2", type: "reading", label: "Lecture du jour (Khatm)", icon: "📅" },
  { id: "d3", type: "lesson", label: "Leçon du parcours (5 mots)", icon: "🎓" },
  { id: "d4", type: "adhkarTab", ref: "soir", label: "Adhkar du soir", icon: "🌇" },
  { id: "d5", type: "kahf", label: "Sourate Al-Kahf", icon: "🕌", days: [5] },
];

export const DAY_LETTERS = ["D", "L", "M", "M", "J", "V", "S"];

function read(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
function write(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* stockage indisponible */ }
}

export function getProgram() {
  return read(KEY, null) || DEFAULT_ITEMS;
}
export function saveProgram(items) {
  write(KEY, items);
}

/** Items prévus aujourd'hui (selon les jours choisis). */
export function todayItems(items = getProgram(), now = new Date()) {
  const d = now.getDay();
  return items.filter((it) => !it.days?.length || it.days.includes(d));
}

/** Cases cochées à la main aujourd'hui (remises à zéro chaque jour à minuit). */
export function getManualDone(now = new Date()) {
  const saved = read(DONE_KEY, null);
  return saved && saved.day === localDayKey(now) ? saved.ids : [];
}
export function setManualDone(id, done, now = new Date()) {
  const ids = new Set(getManualDone(now));
  if (done) ids.add(id); else ids.delete(id);
  write(DONE_KEY, { day: localDayKey(now), ids: [...ids] });
  return [...ids];
}

export function newId() {
  return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}
