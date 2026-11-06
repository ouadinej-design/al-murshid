import { describe, it, expect, beforeEach } from "vitest";
import { UNITS, LEVELS, RANKED, completeUnit, nextUnit, isUnlocked, getPath, makeOptions, pathStats } from "../path";

const store = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } };
});

describe("parcours des 500 mots", () => {
  it("100 leçons de 5 mots, 10 niveaux, les plus fréquents d'abord", () => {
    expect(UNITS).toHaveLength(100);
    expect(UNITS.every((u) => u.length === 5)).toBe(true);
    expect(LEVELS).toHaveLength(10);
    expect(RANKED[0].freq).toBeGreaterThanOrEqual(RANKED[1].freq);
  });
  it("débloque la leçon suivante et ajoute les mots à la révision (pour demain)", () => {
    expect(nextUnit()).toBe(0);
    expect(isUnlocked(1)).toBe(false);
    const { stars } = completeUnit(0, 0.8, new Date(2026, 10, 6, 21));
    expect(stars).toBe(2);
    expect(nextUnit()).toBe(1);
    expect(isUnlocked(1)).toBe(true);
    const cards = JSON.parse(store.anki_cards);
    const w = UNITS[0][0];
    expect(cards[w.id].reps).toBe(1);
    expect(new Date(cards[w.id].nextReview).getDate()).toBe(7);
    expect(pathStats()).toMatchObject({ doneUnits: 1, words: 5 });
  });
  it("garde la meilleure note quand on refait une leçon", () => {
    completeUnit(0, 1); completeUnit(0, 0.5);
    expect(getPath().done[0].stars).toBe(3);
  });
  it("4 choix de réponse distincts dont la bonne", () => {
    const w = UNITS[3][2];
    const opts = makeOptions(w, "fr");
    expect(opts).toHaveLength(4);
    expect(new Set(opts.map((o) => o.fr)).size).toBe(4);
    expect(opts.some((o) => o.id === w.id)).toBe(true);
  });
});
