// ═══════════════════════════════════════════════════════
// AUDIO D'UN VERSET : lecture complète ou d'un passage choisi, en boucle,
// avec la position de lecture pour l'effet karaoké.
// Le minutage des mots est ESTIMÉ (pas de minutage officiel) : on repère le début et la fin
// de la voix dans l'audio, puis on répartit le temps selon la longueur des mots.
// ═══════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from "react";

/** Poids d'un mot en phonétique : voyelles longues et lettres doublées comptent plus (durée de prononciation). */
export function wordWeight(w) {
  const base = String(w || "").replace(/[^\p{L}ʿʾ']/gu, "");
  const long = (w.match(/[āīūâîû]|aa|ii|uu/gi) || []).length;
  return Math.max(1, base.length) + long * 1.5 + 1; // +1 : petite attaque par mot
}

/** Poids d'un mot arabe : lettres + madd (ا و ي longs, ٓ) + shadda. */
export function arabicWeight(w) {
  const letters = (w.match(/[ء-يٱ]/g) || []).length;
  const madd = (w.match(/[ٰٓ]|ا|ٰ/g) || []).length;
  const shadda = (w.match(/ّ/g) || []).length;
  return Math.max(1, letters) + madd * 0.8 + shadda * 0.6 + 1;
}

/** Bornes de temps [t0, t1, …, tn] pour n mots, réparties entre start et end selon les poids. */
export function wordBounds(weights, start, end) {
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  const out = [start];
  let acc = 0;
  for (const w of weights) { acc += w; out.push(start + ((end - start) * acc) / total); }
  return out;
}

/** Début et fin de la voix dans l'audio (on ignore les silences). */
export function speechRange(buffer) {
  const data = buffer.getChannelData(0);
  const win = Math.max(1, Math.floor(buffer.sampleRate * 0.02));
  const rms = [];
  for (let i = 0; i < data.length; i += win) {
    let s = 0;
    const n = Math.min(win, data.length - i);
    for (let j = 0; j < n; j++) s += data[i + j] * data[i + j];
    rms.push(Math.sqrt(s / n));
  }
  const max = Math.max(...rms, 1e-6);
  const thr = max * 0.08;
  let a = rms.findIndex((v) => v > thr);
  let b = rms.length - 1 - [...rms].reverse().findIndex((v) => v > thr);
  if (a < 0) { a = 0; b = rms.length - 1; }
  const step = win / buffer.sampleRate;
  return { start: Math.max(0, a * step - 0.05), end: Math.min(buffer.duration, (b + 1) * step + 0.05) };
}

const cache = new Map(); // url → { buffer, range }

/**
 * Hook : charge l'audio d'un verset et le joue (en entier ou un passage, N fois, vitesse réglable).
 * pos = position actuelle dans l'audio (secondes) pendant la lecture, sinon null.
 */
export function useVerseAudio() {
  const ctxRef = useRef(null);
  const srcRef = useRef(null);
  const rafRef = useRef(0);
  const runRef = useRef(0);
  const [pos, setPos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null); // { duration, start, end }

  const stop = useCallback(() => {
    runRef.current++;
    cancelAnimationFrame(rafRef.current);
    if (srcRef.current) { try { srcRef.current.onended = null; srcRef.current.stop(); } catch { /* déjà arrêté */ } }
    srcRef.current = null;
    setPos(null);
  }, []);

  useEffect(() => () => { stop(); try { ctxRef.current?.close(); } catch { /* */ } }, [stop]);

  const load = useCallback(async (url) => {
    if (cache.has(url)) { const c = cache.get(url); setInfo({ duration: c.buffer.duration, ...c.range }); return c; }
    if (!ctxRef.current || ctxRef.current.state === "closed") ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    setLoading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("audio");
      const arr = await res.arrayBuffer();
      const buffer = await new Promise((ok, ko) => ctxRef.current.decodeAudioData(arr, ok, ko));
      const c = { buffer, range: speechRange(buffer) };
      cache.set(url, c);
      if (cache.size > 30) cache.delete(cache.keys().next().value);
      setInfo({ duration: buffer.duration, ...c.range });
      return c;
    } finally { setLoading(false); }
  }, []);

  /**
   * Joue [from, to] (secondes) `times` fois (Infinity = en boucle) à la vitesse `rate`.
   * Sans from/to : tout le verset.
   */
  const play = useCallback(async (url, { from, to, times = 1, rate = 1, gap = 0.6, onEnd } = {}) => {
    stop();
    const run = runRef.current;
    let c;
    try { c = await load(url); } catch { onEnd?.(false); return; }
    if (run !== runRef.current) return;
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") await ctx.resume();
    const a = from ?? 0, b = Math.min(to ?? c.buffer.duration, c.buffer.duration);
    let left = times;
    const once = () => {
      if (run !== runRef.current) return;
      const src = ctx.createBufferSource();
      src.buffer = c.buffer;
      src.playbackRate.value = rate;
      src.connect(ctx.destination);
      srcRef.current = src;
      const t0 = ctx.currentTime;
      src.start(0, a, b - a);
      const tick = () => {
        if (run !== runRef.current) return;
        setPos(a + (ctx.currentTime - t0) * rate);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
      src.onended = () => {
        cancelAnimationFrame(rafRef.current);
        if (run !== runRef.current) return;
        left -= 1;
        if (left > 0) { setPos(a); setTimeout(once, gap * 1000); }
        else { setPos(null); srcRef.current = null; onEnd?.(true); }
      };
    };
    once();
  }, [load, stop]);

  return { play, stop, load, pos, loading, info, playing: pos !== null };
}
