import { describe, it, expect } from "vitest";
import { wordBounds, wordWeight, arabicWeight } from "../verseAudio";

describe("minutage estimé des mots (karaoké)", () => {
  it("répartit le temps entre début et fin de la voix", () => {
    const b = wordBounds([1, 1, 2], 1, 5);
    expect(b).toEqual([1, 2, 3, 5]);
  });
  it("les voyelles longues durent plus longtemps", () => {
    expect(wordWeight("raḥīm")).toBeGreaterThan(wordWeight("raḥim"));
    expect(arabicWeight("الرَّحِيمِ")).toBeGreaterThan(arabicWeight("لَهُ"));
  });
});
