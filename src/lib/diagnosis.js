// ═══════════════════════════════════════════════════════
// DIAGNOSTIC DE RÉCITATION : où ça a coincé, et pourquoi
// ═══════════════════════════════════════════════════════

// Confusions de lettres fréquentes chez les francophones, avec un conseil.
const PAIRS = [
  [["ح", "ه"], "ح (ḥ) se prononce du milieu de la gorge, souffle serré ; ه (h) est un souffle léger."],
  [["ح", "خ"], "ح (ḥ) est un souffle de gorge sans frottement ; خ (kh) frotte au fond de la bouche, comme la jota espagnole."],
  [["ع", "ا"], "ع (ʿ) est un son de gorge contracté : ne le remplace pas par une simple voyelle."],
  [["ع", "ء"], "ع (ʿ) vient de la gorge (contractée) ; ء (hamza) est un simple coup de glotte."],
  [["ق", "ك"], "ق (q) se prononce tout au fond de la gorge ; ك (k) plus en avant, comme en français."],
  [["ط", "ت"], "ط (ṭ) est emphatique : langue plaquée, son grave ; ت (t) est léger."],
  [["ص", "س"], "ص (ṣ) est emphatique et grave ; س (s) est léger."],
  [["ض", "د"], "ض (ḍ) est emphatique, langue sur les côtés des molaires ; د (d) est léger."],
  [["ظ", "ز"], "ظ (ẓ) : bout de la langue entre les dents, son emphatique ; ز (z) est un simple z."],
  [["ذ", "ز"], "ذ (dh) : bout de la langue entre les dents (comme « this » en anglais) ; ز (z) sans les dents."],
  [["ذ", "د"], "ذ (dh) : langue entre les dents ; د (d) : langue derrière les dents."],
  [["ث", "س"], "ث (th) : langue entre les dents (comme « think ») ; س (s) sans les dents."],
  [["ث", "ت"], "ث (th) : langue entre les dents ; ت (t) : langue derrière les dents."],
  [["غ", "ر"], "غ (gh) se prononce au fond de la gorge (r grasseyé) ; ر (r) est roulé du bout de la langue."],
  [["غ", "خ"], "غ (gh) est voisé (la gorge vibre) ; خ (kh) est soufflé, sans vibration."],
  [["ج", "ي"], "ج (j) se prononce clairement comme « dj » ; ne l'avale pas."],
];

const iso = (t) => t.replace(/([\u0621-\u064A])/g, "\u2068$1\u2069"); // isole chaque lettre arabe dans le texte français

function lettersDiff(expected, heard) {
  const e = [...expected], h = [...heard];
  const tips = [];
  for (const [[a, b], tip] of PAIRS) {
    const eA = e.includes(a) && !h.includes(a) && h.includes(b);
    const eB = e.includes(b) && !h.includes(b) && h.includes(a);
    if (eA || eB) tips.push({ letters: eA ? `${a} → ${b}` : `${b} → ${a}`, expected: eA ? a : b, said: eA ? b : a, tip: iso(tip) });
  }
  return tips;
}

/**
 * À partir des résultats mot par mot (compareWords), liste les mots à retravailler.
 * Renvoie [{ index, word, spoken, status, label, tips }] dans l'ordre du verset.
 */
export function diagnose(results) {
  return (results || [])
    .map((r, index) => ({ ...r, index }))
    .filter((r) => r.status !== "correct")
    .map((r) => {
      const label = r.status === "missing" ? "Mot oublié ou pas entendu"
        : r.status === "close" ? "Presque juste (une lettre)"
        : "Mal prononcé";
      const tips = r.spoken ? lettersDiff(r.word, r.spoken) : [];
      return { index: r.index, word: r.word, spoken: r.spoken || "", status: r.status, label, tips };
    });
}

/** Résumé pour le professeur (à l'oral). */
export function diagnosisSentence(problems, total) {
  if (!problems.length) return "";
  const pos = problems.slice(0, 3).map((p) => p.index + 1);
  const where = pos.length === 1 ? `au mot ${pos[0]}` : `aux mots ${pos.slice(0, -1).join(", ")} et ${pos[pos.length - 1]}`;
  const missing = problems.filter((p) => p.status === "missing").length;
  const extra = missing ? ` Tu as sauté ${missing} mot${missing > 1 ? "s" : ""}.` : "";
  return `Ça a coincé ${where}, sur ${total} mots.${extra} Regarde le détail et travaille ces mots.`;
}
