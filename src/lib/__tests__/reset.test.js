import { describe, it, expect } from "vitest";
import { resetData } from "../reset";

function mem(init) {
  const s = { ...init };
  return { s, getItem: (k) => s[k] ?? null, setItem: (k, v) => { s[k] = String(v); }, removeItem: (k) => { delete s[k]; } };
}

describe("repartir de zéro", () => {
  it("efface l'activité et les adhkar, garde les réglages et l'apprentissage", () => {
    const st = mem({
      almurshid_progress_v1: JSON.stringify({ days: { "2026-11-06": { words: 5 } }, xp: 120, settings: { dailyGoal: 15, arabicScale: 1.2 } }),
      adhkar_recited_v2: "{}", anki_cards: "{\"1\":{}}", adhkar_favs: "{\"3\":true}",
    });
    resetData(["activity", "adhkar"], st);
    const p = JSON.parse(st.s.almurshid_progress_v1);
    expect(p).toEqual({ days: {}, xp: 0, settings: { dailyGoal: 15, arabicScale: 1.2 } });
    expect(st.s.adhkar_recited_v2).toBeUndefined();
    expect(st.s.anki_cards).toBeDefined();
    expect(st.s.adhkar_favs).toBeDefined();
  });
  it("peut aussi effacer l'apprentissage", () => {
    const st = mem({ anki_cards: "{}", path_progress_v1: "{}", memorized_verses_v1: "{}" });
    resetData(["learning"], st);
    expect(Object.keys(st.s)).toEqual([]);
  });
});
