import { describe, it, expect } from "vitest";
import { diagnose, diagnosisSentence } from "../diagnosis";
import { compareWords } from "../arabic";

describe("diagnostic de récitation", () => {
  it("liste les mots ratés dans l'ordre, avec ce qui a été entendu", () => {
    const res = compareWords("الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", "الهمد لله العالمين");
    const p = diagnose(res);
    expect(p.map((x) => [x.index, x.status])).toEqual([[0, "close"], [2, "missing"]]);
    expect(p[0].spoken).toBe("الهمد");
    expect(p[0].tips[0].letters).toBe("ح → ه");
  });
  it("repère ق prononcé ك", () => {
    const p = diagnose(compareWords("قُلْ هُوَ اللَّهُ أَحَدٌ", "كل هو الله احد"));
    expect(p[0].tips.map((t) => t.letters)).toContain("ق → ك");
  });
  it("phrase du professeur", () => {
    expect(diagnosisSentence([{ index: 0, status: "close" }, { index: 2, status: "missing" }], 4))
      .toBe("Ça a coincé aux mots 1 et 3, sur 4 mots. Tu as sauté 1 mot. Regarde le détail et travaille ces mots.");
  });
});
