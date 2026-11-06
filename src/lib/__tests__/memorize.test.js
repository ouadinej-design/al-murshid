import { describe, it, expect, beforeEach } from "vitest";
import { markVerseLearned, memoProgress, weekStartKey, isKahfTime } from "../memorize";

const store = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } };
});

describe("mémorisation Al-Kahf", () => {
  it("la semaine du vendredi commence le samedi", () => {
    expect(weekStartKey(new Date(2026, 10, 6, 12))).toBe("2026-10-31"); // vendredi 6 → samedi 31
    expect(weekStartKey(new Date(2026, 10, 7, 9))).toBe("2026-11-07");  // samedi 7 → lui-même
  });
  it("compte les versets appris, ceux de la semaine et le prochain à apprendre", () => {
    markVerseLearned(18, 1, new Date(2026, 9, 20));
    markVerseLearned(18, 2, new Date(2026, 10, 2));
    markVerseLearned(18, 3, new Date(2026, 10, 5));
    expect(markVerseLearned(18, 3, new Date(2026, 10, 6))).toBe(false); // déjà appris
    expect(memoProgress(18, 110, new Date(2026, 10, 6, 12))).toEqual({ learned: 3, thisWeek: 2, next: 4, total: 110 });
  });
  it("vendredi, et jeudi à partir de 18 h", () => {
    expect(isKahfTime(new Date(2026, 10, 6, 8))).toBe(true);
    expect(isKahfTime(new Date(2026, 10, 5, 19))).toBe(true);
    expect(isKahfTime(new Date(2026, 10, 5, 12))).toBe(false);
    expect(isKahfTime(new Date(2026, 10, 7, 12))).toBe(false);
  });
});
