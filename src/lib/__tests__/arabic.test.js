import { describe, it, expect } from "vitest";
import { normalizeAr, compareWords, calcScore, bestTranscript } from "../arabic";

const FATIHA_2_UTHMANI = "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ";
const FATIHA_7 = "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ";

describe("normalizeAr", () => {
  it("retire harakat, alif wasla et signes coraniques", () => {
    expect(normalizeAr("ٱلْحَمْدُ لِلَّهِ")).toBe("الحمد لله");
    expect(normalizeAr("ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ ۛ فِيهِ ۛ")).toBe("ذلك الكتب لا ريب فيه");
    expect(normalizeAr("مَالِكِ ۝٤")).toBe("مالك");
  });
});

describe("compareWords", () => {
  it("récitation parfaite (texte uthmani vs transcription courante) = 100", () => {
    const r = compareWords(FATIHA_2_UTHMANI, "الحمد لله رب العالمين");
    expect(r.every((w) => w.status === "correct")).toBe(true);
    expect(calcScore(r)).toBe(100);
  });

  it("un mot oublié ne décale pas la suite", () => {
    const r = compareWords(FATIHA_7, "صراط الذين انعمت عليهم المغضوب عليهم ولا الضالين");
    expect(r.map((w) => w.status)).toEqual(["correct", "correct", "correct", "correct", "missing", "correct", "correct", "correct", "correct"]);
    expect(calcScore(r)).toBe(89);
  });

  it("un mot en trop ne pénalise pas les mots justes", () => {
    const r = compareWords("قُلْ هُوَ اللَّهُ أَحَدٌ", "قل قل هو الله احد");
    expect(calcScore(r)).toBe(100);
  });

  it("une lettre d'écart = presque juste", () => {
    const r = compareWords("قُلْ هُوَ اللَّهُ أَحَدٌ", "قل هو الله احت");
    expect(r[3].status).toBe("close");
    expect(calcScore(r)).toBe(88);
  });

  it("rien entendu = 0", () => {
    expect(calcScore(compareWords("قُلْ هُوَ اللَّهُ أَحَدٌ", ""))).toBe(0);
  });
});

describe("bestTranscript", () => {
  it("garde la meilleure des transcriptions proposées", () => {
    const best = bestTranscript("قُلْ هُوَ اللَّهُ أَحَدٌ", ["كل هو الله", "قل هو الله احد", "قول هو"]);
    expect(best.heard).toBe("قل هو الله احد");
    expect(best.score).toBe(100);
  });
});
