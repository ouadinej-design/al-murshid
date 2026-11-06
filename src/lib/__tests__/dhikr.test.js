import { describe, it, expect } from "vitest";
import { cycleInfo } from "../dhikr";
import { ADHKAR_MALIKITES } from "../../appData";

describe("adhkar en cycle (Ikhlāṣ, Falaq, Nās × 3)", () => {
  const d = ADHKAR_MALIKITES.find((x) => x.id === 2);
  it("9 récitations au total", () => expect(d.repetition).toBe(9));
  it("alterne les trois sourates sur 3 tours", () => {
    const seq = Array.from({ length: 9 }, (_, c) => cycleInfo(d, c));
    expect(seq.map((x) => x.name)).toEqual(["Al-Ikhlāṣ", "Al-Falaq", "An-Nās", "Al-Ikhlāṣ", "Al-Falaq", "An-Nās", "Al-Ikhlāṣ", "Al-Falaq", "An-Nās"]);
    expect(seq.map((x) => x.round)).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3]);
    expect(seq[1].arabic.startsWith("﴿ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ")).toBe(true);
    expect(seq[0].transliteration.startsWith("Qul huwa")).toBe(true);
  });
  it("sans cycle : rien", () => expect(cycleInfo({ repetition: 3 }, 0)).toBe(null));
});
