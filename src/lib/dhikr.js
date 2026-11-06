// Adhkar « en cycle » : plusieurs textes récités à tour de rôle
// (ex. Al-Ikhlāṣ → Al-Falaq → An-Nās, 3 tours = 9 récitations).
// Les textes sont séparés par une ligne vide dans arabic / transliteration / french.

const split = (t) => String(t || "").split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
const stripName = (t) => t.replace(/^[^:]{2,30}:\s*/, "");

export function cycleInfo(d, count) {
  if (!d?.cycle) return null;
  const ar = split(d.arabic), tr = split(d.transliteration), fr = split(d.french);
  const n = ar.length;
  if (n < 2) return null;
  const pos = Math.min(count, d.repetition - 1);
  const k = pos % n;
  return {
    n,
    index: k,
    round: Math.floor(pos / n) + 1,
    rounds: Math.ceil(d.repetition / n),
    names: tr.map((t) => (t.match(/^([^:]{2,30}):/) || [])[1]?.trim() || ""),
    name: (tr[k]?.match(/^([^:]{2,30}):/) || [])[1]?.trim() || `Texte ${k + 1}`,
    arabic: ar[k],
    transliteration: stripName(tr[k] || ""),
    french: stripName(fr[k] || ""),
  };
}
