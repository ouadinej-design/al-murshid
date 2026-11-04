// ═══════════════════════════════════════════════════════
// ARABE — normalisation et comparaison de récitation (coach vocal)
// ═══════════════════════════════════════════════════════

/**
 * Normalise un texte arabe pour comparer ce qui est attendu (souvent en écriture uthmani,
 * avec harakat et signes coraniques) avec ce que renvoie la reconnaissance vocale
 * (écriture courante, sans voyelles).
 */
export function normalizeAr(text = "") {
  return String(text)
    // harakat, tanwin, shadda, sukun, alif suscrit (ٰ)
    .replace(/[ً-ٰٟ]/g, "")
    // signes coraniques : pauses, petits waw/ya, sajda, fin de verset…
    .replace(/[ؐ-ؚۖ-ۭ࣓-ࣿ]/g, "")
    // tatweel
    .replace(/ـ/g, "")
    // variantes d'alif (dont alif wasla ٱ)
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ء/g, "")
    // tout ce qui n'est pas une lettre arabe devient un espace (chiffres, ۝, ponctuation)
    .replace(/[^ء-ي\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Squelette d'un mot sans alif long : absorbe les différences d'orthographe uthmani (ٱلْعَٰلَمِينَ ↔ العالمين). */
function skeleton(w) {
  return w.replace(/ا/g, "");
}

function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

/** Compare deux mots normalisés : "correct", "close" (une lettre d'écart) ou "wrong". */
export function compareWord(expected, heard) {
  if (!heard) return "missing";
  if (expected === heard || skeleton(expected) === skeleton(heard)) return "correct";
  const d = Math.min(levenshtein(expected, heard), levenshtein(skeleton(expected), skeleton(heard)));
  const len = Math.max(expected.length, heard.length);
  if (d <= 1 || d / len <= 0.2) return "close";
  return "wrong";
}

const COST = { correct: 0, close: 0.4, wrong: 1 };

/**
 * Aligne le verset attendu avec ce qui a été entendu (comme un correcteur).
 * Un mot oublié ne décale plus tout le reste : seul ce mot est marqué « manquant ».
 * Renvoie un tableau { word, status, spoken? } par mot attendu.
 */
export function compareWords(expected, spoken) {
  const E = normalizeAr(expected).split(" ").filter(Boolean);
  const S = normalizeAr(spoken).split(" ").filter(Boolean);
  const m = E.length, n = S.length;
  // dp[i][j] = coût minimal pour aligner E[0..i) avec S[0..j)
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  const st = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(null));
  for (let i = 1; i <= m; i++) dp[i][0] = i;
  for (let j = 1; j <= n; j++) dp[0][j] = j * 0.6; // mot en trop : pénalité plus légère
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const s = compareWord(E[i - 1], S[j - 1]);
      st[i][j] = s;
      dp[i][j] = Math.min(
        dp[i - 1][j - 1] + COST[s],
        dp[i - 1][j] + 1,        // mot attendu manquant
        dp[i][j - 1] + 0.6       // mot entendu en trop
      );
    }
  }
  // remontée
  const out = [];
  let i = m, j = n;
  while (i > 0) {
    if (j > 0 && Math.abs(dp[i][j] - (dp[i - 1][j - 1] + COST[st[i][j]])) < 1e-9) {
      const s = st[i][j];
      out.push(s === "correct" ? { word: E[i - 1], status: s } : { word: E[i - 1], status: s, spoken: S[j - 1] });
      i--; j--;
    } else if (j > 0 && Math.abs(dp[i][j] - (dp[i][j - 1] + 0.6)) < 1e-9) {
      j--;
    } else {
      out.push({ word: E[i - 1], status: "missing" });
      i--;
    }
  }
  return out.reverse();
}

/** Score sur 100 : 1 point par mot juste, ½ point par mot presque juste. */
export function calcScore(results) {
  if (!results.length) return 0;
  const pts = results.reduce((a, r) => a + (r.status === "correct" ? 1 : r.status === "close" ? 0.5 : 0), 0);
  return Math.round((pts / results.length) * 100);
}

/**
 * La reconnaissance vocale propose plusieurs transcriptions possibles :
 * on garde celle qui correspond le mieux au verset (au lieu de les coller bout à bout).
 */
export function bestTranscript(expected, alternatives) {
  const alts = (alternatives || []).map((a) => String(a || "").trim()).filter(Boolean);
  if (!alts.length) return { heard: "", results: compareWords(expected, ""), score: 0 };
  let best = null;
  for (const heard of alts) {
    const results = compareWords(expected, heard);
    const score = calcScore(results);
    if (!best || score > best.score) best = { heard, results, score };
  }
  return best;
}
