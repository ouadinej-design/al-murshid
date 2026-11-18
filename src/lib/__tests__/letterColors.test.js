import { describe, it, expect } from "vitest";
import { LETTER_COLOR, FAMILIES, colorOf, baseLetter, familyOf } from "../letterColors";

describe("couleurs des lettres", () => {
  it("28 lettres, 28 couleurs différentes", () => {
    expect(Object.keys(LETTER_COLOR)).toHaveLength(28);
    expect(new Set(Object.values(LETTER_COLOR)).size).toBe(28);
    expect(FAMILIES.flatMap((f) => f.letters)).toHaveLength(28);
  });
  it("les formes gardent la couleur de la lettre", () => {
    expect(baseLetter("ـبـ")).toBe("ب");
    expect(colorOf("ـبـ")).toBe(colorOf("ب"));
    expect(colorOf("أ")).toBe(colorOf("ا"));
  });
  it("modes par règle", () => {
    expect(colorOf("ب", "famille")).toBe(colorOf("ث", "famille"));
    expect(colorOf("ر", "egoistes")).not.toBe(colorOf("ب", "egoistes"));
    expect(colorOf("ش", "solaires")).not.toBe(colorOf("ق", "solaires"));
    expect(familyOf("ـنـ").key).toBe("barque");
  });
});
