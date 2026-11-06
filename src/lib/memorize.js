// ═══════════════════════════════════════════════════════
// MÉMORISATION — versets validés avec le professeur (score ≥ 80 %)
// Stockage : { [sourate]: { [verset]: "AAAA-MM-JJ" (date de validation) } }
// ═══════════════════════════════════════════════════════
import { localDayKey, shiftDayKey } from "./progress";

const KEY = "memorized_verses_v1";
export const KAHF = { number: 18, verses: 110, name: "Al-Kahf" };
export const MEMO_THRESHOLD = 80;

function read() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

export function getMemorized(surah) {
  return read()[surah] || {};
}

/** Enregistre un verset comme appris (la première date de validation est conservée). */
export function markVerseLearned(surah, verse, now = new Date()) {
  const all = read();
  const s = all[surah] || {};
  if (s[verse]) return false;
  all[surah] = { ...s, [verse]: localDayKey(now) };
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch { /* stockage indisponible */ }
  return true;
}

/** Début de la « semaine du vendredi » : le samedi qui suit le vendredi précédent. */
export function weekStartKey(now = new Date()) {
  const today = localDayKey(now);
  const back = (now.getDay() + 1) % 7; // samedi = 0 jour en arrière, vendredi = 6
  return shiftDayKey(today, -back);
}

/** Progression d'une sourate : total appris, appris cette semaine, prochain verset à apprendre. */
export function memoProgress(surah, totalVerses, now = new Date()) {
  const m = getMemorized(surah);
  const since = weekStartKey(now);
  const learned = Object.keys(m).length;
  const thisWeek = Object.values(m).filter((d) => d >= since).length;
  let next = 1;
  while (next <= totalVerses && m[next]) next++;
  return { learned, thisWeek, next: next > totalVerses ? null : next, total: totalVerses };
}

/** Vendredi, ou jeudi soir (le vendredi commence au coucher du soleil). */
export function isKahfTime(now = new Date()) {
  return now.getDay() === 5 || (now.getDay() === 4 && now.getHours() >= 18);
}
