import { describe, it, expect } from "vitest";
import { localDayKey, shiftDayKey, computeStreak, dayTotal, levelFromXp, lastDays } from "../progress";

describe("localDayKey", () => {
  it("utilise l'heure locale (pas UTC)", () => {
    // 4 novembre 00:30 heure locale → toujours le 4, même si UTC est encore le 3
    expect(localDayKey(new Date(2026, 10, 4, 0, 30))).toBe("2026-11-04");
    expect(localDayKey(new Date(2026, 10, 4, 23, 59))).toBe("2026-11-04");
  });
  it("décale correctement les jours, y compris en changeant de mois", () => {
    expect(shiftDayKey("2026-11-01", -1)).toBe("2026-10-31");
    expect(shiftDayKey("2026-12-31", 1)).toBe("2027-01-01");
  });
});

describe("série", () => {
  const now = new Date(2026, 10, 4, 10, 0);
  it("compte les jours consécutifs avec activité", () => {
    const days = { "2026-11-02": { words: 3 }, "2026-11-03": { adhkar: 1 }, "2026-11-04": { quiz: 2 } };
    expect(computeStreak(days, now)).toBe(3);
  });
  it("la série d'hier reste en cours si rien n'est encore fait aujourd'hui", () => {
    const days = { "2026-11-02": { words: 3 }, "2026-11-03": { adhkar: 1 } };
    expect(computeStreak(days, now)).toBe(2);
  });
  it("un jour sans activité casse la série", () => {
    const days = { "2026-11-01": { words: 3 }, "2026-11-03": { adhkar: 1 }, "2026-11-04": { quiz: 1 } };
    expect(computeStreak(days, now)).toBe(2);
  });
  it("aucune activité = 0", () => {
    expect(computeStreak({}, now)).toBe(0);
  });
});

describe("objectif et niveaux", () => {
  it("additionne toutes les activités du jour", () => {
    expect(dayTotal({ words: 4, adhkar: 2, recite: 1, inconnu: 9 })).toBe(7);
  });
  it("calcule le niveau à partir des XP", () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(49).level).toBe(1);
    expect(levelFromXp(50).level).toBe(2);
    expect(levelFromXp(160)).toEqual({ level: 3, into: 10, span: 150 });
  });
  it("renvoie les 7 derniers jours dans l'ordre", () => {
    const w = lastDays({ "2026-11-04": { words: 2 } }, 7, new Date(2026, 10, 4, 9));
    expect(w).toHaveLength(7);
    expect(w[0].key).toBe("2026-10-29");
    expect(w[6]).toEqual({ key: "2026-11-04", total: 2 });
  });
});

import { goalProgress, bestStreak, activityReport } from "../progress";

describe("objectifs personnalisés et rapports", () => {
  const custom = { goalMode: "custom", dailyGoal: 10, goals: { words: 10, adhkar: 2, recite: 0 } };
  it("mode par activité : chaque objectif choisi compte, plafonné à sa cible", () => {
    const g = goalProgress({ words: 15, adhkar: 1, recite: 9 }, custom);
    expect(g.items.map((i) => i.key)).toEqual(["words", "adhkar"]);
    expect(g.done).toBe(11);   // 10 (plafonné) + 1
    expect(g.target).toBe(12);
    expect(g.reached).toBe(false);
    expect(goalProgress({ words: 10, adhkar: 2 }, custom).reached).toBe(true);
  });
  it("mode total : toutes les actions confondues", () => {
    const g = goalProgress({ words: 4, adhkar: 3 }, { goalMode: "total", dailyGoal: 5 });
    expect(g).toMatchObject({ done: 7, target: 5, reached: true, pct: 100 });
  });
  it("meilleure série", () => {
    expect(bestStreak({ "2026-10-01": { words: 1 }, "2026-10-02": { quiz: 1 }, "2026-10-03": { quiz: 1 }, "2026-10-10": { quiz: 1 } })).toBe(3);
  });
  it("rapport sur 7 jours", () => {
    const r = activityReport({ "2026-11-04": { words: 2, adhkar: 1 }, "2026-11-01": { quiz: 3 } }, 7, { goalMode: "total", dailyGoal: 3 }, new Date(2026, 10, 4, 9));
    expect(r.totals.words).toBe(2);
    expect(r.activeDays).toBe(2);
    expect(r.goalDays).toBe(2);
    expect(r.total).toBe(6);
  });
});
