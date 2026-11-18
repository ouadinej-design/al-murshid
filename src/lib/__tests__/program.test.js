import { describe, it, expect, beforeEach } from "vitest";
import { getProgram, saveProgram, todayItems, getManualDone, setManualDone, DEFAULT_ITEMS } from "../program";

const store = {};
beforeEach(() => {
  Object.keys(store).forEach((k) => delete store[k]);
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } };
});

describe("programme du jour", () => {
  it("programme par défaut, puis celui enregistré", () => {
    expect(getProgram()).toEqual(DEFAULT_ITEMS);
    saveProgram([{ id: "x", type: "custom", label: "Duʿā'", icon: "🤲" }]);
    expect(getProgram()).toHaveLength(1); // retiré par l'utilisateur : pas rajouté
  });
  it("ajoute une seule fois le jeu des 4 formes à un ancien programme", () => {
    localStorage.setItem("daily_program_v1", JSON.stringify([{ id: "a", type: "custom", label: "X", icon: "•" }]));
    expect(getProgram().map((i) => i.type)).toEqual(["custom", "forms"]);
    saveProgram([{ id: "a", type: "custom", label: "X", icon: "•" }]);
    expect(getProgram()).toHaveLength(1);
  });
  it("n'affiche Al-Kahf que le vendredi", () => {
    const lundi = new Date(2026, 10, 9), vendredi = new Date(2026, 10, 13);
    expect(todayItems(DEFAULT_ITEMS, lundi).some((i) => i.type === "kahf")).toBe(false);
    expect(todayItems(DEFAULT_ITEMS, vendredi).some((i) => i.type === "kahf")).toBe(true);
  });
  it("les cases cochées repartent à zéro le lendemain", () => {
    const j1 = new Date(2026, 10, 9, 8), j2 = new Date(2026, 10, 10, 8);
    setManualDone("d1", true, j1);
    expect(getManualDone(j1)).toEqual(["d1"]);
    expect(getManualDone(j2)).toEqual([]);
    expect(setManualDone("d1", false, j1)).toEqual([]);
  });
});
