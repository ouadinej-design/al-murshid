import { describe, it, expect } from "vitest";
import { buildCorpus, searchVerse } from "../verseSearch";
import { EMBEDDED_VERSES } from "../../appData";

// corpus de test : les sourates intégrées à l'app (Al-Fātiḥa + 93 à 114)
const surahs = Array.from({ length: 114 }, (_, i) => (EMBEDDED_VERSES[i + 1] || []).map((v) => v.arabic));
const corpus = buildCorpus(surahs);
const top = (heard) => { const r = searchVerse(corpus, heard)[0]; return r && `${r.s}:${r.v}`; };

describe("reconnaître un verset", () => {
  it("trouve un verset récité en entier", () => {
    expect(top("الحمد لله رب العالمين")).toBe("1:2");
    expect(top("قل اعوذ برب الناس")).toBe("114:1");
    expect(top("قل اعوذ برب الفلق")).toBe("113:1");
  });
  it("tolère une erreur de prononciation", () => {
    expect(top("انا اعطيناك الكوتر")).toBe("108:1");
  });
  it("trouve un début de verset", () => {
    expect(top("ان الانسان لفي")).toBe("103:2");
  });
  it("ne répond rien pour un seul mot ou du bruit", () => {
    expect(searchVerse(corpus, "الله")).toEqual([]);
    expect(searchVerse(corpus, "")).toEqual([]);
  });
});
