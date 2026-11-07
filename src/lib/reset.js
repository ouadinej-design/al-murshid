// ═══════════════════════════════════════════════════════
// REPARTIR DE ZÉRO — efface les données choisies (sur ce téléphone uniquement)
// ═══════════════════════════════════════════════════════

export const RESET_GROUPS = [
  { key: "activity", label: "Objectifs du jour, série, XP et statistiques", keys: [], progress: true, def: true },
  { key: "adhkar",   label: "Compteurs d'adhkar du jour", keys: ["adhkar_recited_v2", "adhkar_recited"], def: true },
  { key: "kahf",     label: "Lectures d'Al-Kahf du vendredi", keys: ["kahf_fridays_v1"], def: false },
  { key: "learning", label: "Apprentissage : parcours, mots appris, leçons, versets mémorisés",
    keys: ["path_progress_v1", "anki_cards", "lessons_progress", "mastered_surahs", "memorized_verses_v1"], def: false },
  { key: "quran",    label: "Coran : sourates lues et programme Khatm",
    keys: ["surah_checked_v2", "daily_plan_v1", "juz_program_v3", "current_reading_day"], def: false },
];
// Toujours conservés : réglages (taille du texte, objectifs choisis), favoris, repères, texte du Coran téléchargé.

const PROGRESS_KEY = "almurshid_progress_v1";

/** Efface les groupes choisis. Les réglages sont gardés. */
export function resetData(groups, storage = localStorage) {
  const chosen = RESET_GROUPS.filter((g) => groups.includes(g.key));
  for (const g of chosen) {
    g.keys.forEach((k) => storage.removeItem(k));
    if (g.progress) {
      let settings = {};
      try { settings = JSON.parse(storage.getItem(PROGRESS_KEY))?.settings || {}; } catch { /* */ }
      storage.setItem(PROGRESS_KEY, JSON.stringify({ days: {}, xp: 0, settings }));
    }
  }
  return chosen.map((g) => g.key);
}
