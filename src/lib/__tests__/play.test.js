import { describe, it, expect } from "vitest";
import { skeleton, PLAYABLE, dailyWord, dailyNumber, scoreGuess, flameFor, canRestore, projection, survieWave, fallingLetters, traceScore, LETTERS } from "../play";
import { computeStreak } from "../progress";

describe("skeleton", () => {
  it("retire voyelles et signes, ramène les alifs hamzés à ا", () => {
    expect(skeleton("الْأَرْضِ")).toBe("الارض");
    expect(skeleton("قَالَ")).toBe("قال");
  });
  it("les mots jouables n'utilisent que les 28 lettres", () => {
    expect(PLAYABLE.length).toBeGreaterThan(300);
    for (const w of PLAYABLE) for (const c of skeleton(w.ar)) expect(LETTERS).toContain(c);
  });
});

describe("mot du jour", () => {
  it("est stable pour un jour donné et change le lendemain", () => {
    expect(dailyWord("2026-11-17")).toBe(dailyWord("2026-11-17"));
    expect(dailyWord("2026-11-17")).not.toBe(dailyWord("2026-11-18"));
  });
  it("numérote à partir du 1er novembre 2026", () => {
    expect(dailyNumber("2026-11-01")).toBe(1);
    expect(dailyNumber("2026-12-01")).toBe(31);
  });
});

describe("scoreGuess", () => {
  it("marque bonne place, présente ailleurs, absente", () => {
    const r = scoreGuess("قلا", "قال");
    expect(r.marks).toEqual(["ok", "near", "near"]);
    expect(r.solved).toBe(false);
  });
  it("ne compte une lettre en double qu'autant de fois qu'elle existe", () => {
    expect(scoreGuess("ببب", "باب").marks).toEqual(["ok", "no", "ok"]);
  });
  it("proximité 100 si trouvé, 0 si rien en commun", () => {
    expect(scoreGuess("قال", "قال")).toMatchObject({ closeness: 100, solved: true });
    expect(scoreGuess("ثغظ", "قال").closeness).toBe(0);
  });
});

describe("flamme", () => {
  it("change de couleur avec la série", () => {
    expect(flameFor(0).name).toBe("Éteinte");
    expect(flameFor(3).name).toBe("Flamme orange");
    expect(flameFor(7).name).toBe("Flamme rouge");
    expect(flameFor(1000).next).toBeNull();
  });
  it("raviver : seulement si la série vient de casser, une fois par mois", () => {
    const now = new Date(2026, 10, 17, 10);
    const days = { "2026-11-14": { words: 1 }, "2026-11-15": { quiz: 1 } };
    expect(canRestore(days, null, now)).toBe(true);
    expect(canRestore(days, "2026-11", now)).toBe(false);
    expect(canRestore({ "2026-11-16": { quiz: 1 } }, null, now)).toBe(false);
    expect(canRestore({}, null, now)).toBe(false);
  });
  it("un jour ravivé recolle la série", () => {
    const now = new Date(2026, 10, 17, 10);
    const days = { "2026-11-14": { words: 1 }, "2026-11-15": { quiz: 1 }, "2026-11-16": { restored: 1 }, "2026-11-17": { games: 1 } };
    expect(computeStreak(days, now)).toBe(4);
  });
});

describe("projection", () => {
  it("augmente avec le temps et plafonne à 500 mots", () => {
    const p = projection(10);
    const w = p.points.map((x) => x.words);
    expect(w[0]).toBe(0);
    expect(w[1]).toBeLessThan(w[2]);
    expect(projection(30).points[3].words).toBe(500);
  });
});

describe("jeux", () => {
  it("Survie : le chrono raccourcit sans descendre sous 4 s", () => {
    expect(survieWave(1).seconds).toBe(10);
    expect(survieWave(20).seconds).toBe(4);
    expect(survieWave(3).poolSize).toBeGreaterThan(survieWave(1).poolSize);
  });
  it("Lettres qui tombent : contient les lettres du mot et des leurres absents du mot", () => {
    const { target, tokens } = fallingLetters({ ar: "قَالَ" }, 3, () => 0.3);
    expect(target).toEqual(["ق", "ا", "ل"]);
    expect(tokens).toHaveLength(6);
    expect(tokens.filter((c) => !target.includes(c))).toHaveLength(3);
  });
  it("Tracer : accepte un tracé qui suit la lettre, refuse un gribouillis à côté", () => {
    const mask = [1, 1, 1, 1, 0, 0, 0, 0];
    expect(traceScore(mask, [1, 1, 1, 0, 0, 0, 0, 0]).ok).toBe(true);
    expect(traceScore(mask, [0, 0, 0, 0, 1, 1, 1, 1]).ok).toBe(false);
    expect(traceScore(mask, [1, 1, 1, 1, 1, 1, 1, 1]).ok).toBe(false);
  });
});

import { ABC, linkRound } from "../play";
describe("relier", () => {
  it("28 lettres et des manches de 4 lettres différentes", () => {
    expect(ABC).toHaveLength(28);
    const r = linkRound(2, 4, () => 0.4);
    expect(new Set(r.map((l) => l.ar)).size).toBe(4);
  });
});
