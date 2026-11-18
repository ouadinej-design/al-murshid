import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, RotateCcw } from "lucide-react";
import { FullScreen, speak, vibrate } from "./shared";
import { ABC, DOTTED, traceScore, getPlay, savePlay, nextLetter, recordLetter } from "../../lib/play";
import { logActivity } from "../../lib/progress";
import { colorOf, useColorMode } from "../../lib/letterColors";

const SIZE = 280;     // taille du cadre (px CSS)
const GRID = 56;      // résolution de la comparaison
const FONT = `${Math.round(SIZE * 0.62)}px "Amiri Quran", "Scheherazade New", serif`;

function drawLetter(ctx, letter, size) {
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = FONT.replace(/^\d+px/, `${Math.round(size * 0.62)}px`);
  ctx.fillText(letter, size / 2, size * 0.48);
}

/** Pixels de la lettre modèle, un peu élargis pour être tolérant. */
function letterMask(letter) {
  const c = document.createElement("canvas");
  c.width = c.height = GRID;
  const ctx = c.getContext("2d");
  ctx.fillStyle = ctx.strokeStyle = "#000";
  ctx.lineWidth = GRID * 0.07; ctx.lineJoin = "round";
  drawLetter(ctx, letter, GRID);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.strokeText(letter, GRID / 2, GRID * 0.48);
  const d = ctx.getImageData(0, 0, GRID, GRID).data;
  return Array.from({ length: GRID * GRID }, (_, i) => (d[i * 4 + 3] > 40 ? 1 : 0));
}
function inkMask(canvas) {
  const c = document.createElement("canvas");
  c.width = c.height = GRID;
  const ctx = c.getContext("2d");
  ctx.drawImage(canvas, 0, 0, GRID, GRID);
  const d = ctx.getImageData(0, 0, GRID, GRID).data;
  return Array.from({ length: GRID * GRID }, (_, i) => (d[i * 4 + 3] > 40 ? 1 : 0));
}
/** Élargit un masque de r pixels (tolérance du doigt). */
function dilate(m, r = 2) {
  const out = new Array(m.length).fill(0);
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
    if (!m[y * GRID + x]) continue;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      const X = x + dx, Y = y + dy;
      if (X >= 0 && Y >= 0 && X < GRID && Y < GRID) out[Y * GRID + X] = 1;
    }
  }
  return out;
}

/**
 * Tracer : on trace la lettre au doigt sur son modèle ; l'app vérifie que le tracé
 * recouvre la lettre (points compris) sans trop déborder.
 */
export default function TraceLetter({ onClose, stage = "mots" }) {
  const [idx, setIdx] = useState(() => {
    // débutant : on commence par la lettre en cours d'apprentissage
    if (stage === "lettres") { const n = nextLetter(); if (n) return ABC.findIndex((l) => l.ar === n.ar); }
    const t = getPlay().traced || {};
    const i = ABC.findIndex((l) => !t[l.ar]);
    return i < 0 ? 0 : i;
  });
  const [verdict, setVerdict] = useState(null);
  const [cmode] = useColorMode();
  const [traced, setTraced] = useState(() => getPlay().traced || {});
  const guide = useRef(null), ink = useRef(null), drawing = useRef(false), hasInk = useRef(false);
  const letter = ABC[idx];

  const setup = (cv) => {
    const dpr = window.devicePixelRatio || 1;
    cv.width = cv.height = SIZE * dpr;
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  };

  useEffect(() => {
    let alive = true;
    const paint = () => {
      if (!alive || !guide.current) return;
      const g = setup(guide.current);
      g.fillStyle = "rgba(15,76,155,0.18)";
      drawLetter(g, letter.ar, SIZE);
      setup(ink.current);
      hasInk.current = false; setVerdict(null);
    };
    paint();
    document.fonts?.load(FONT).then(paint).catch(() => {});
    speak(letter.ar, 0.5);
    return () => { alive = false; };
  }, [letter.ar]);

  const pos = (e) => {
    const r = ink.current.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * SIZE, ((e.clientY - r.top) / r.height) * SIZE];
  };
  const down = (e) => {
    e.preventDefault(); ink.current.setPointerCapture?.(e.pointerId);
    drawing.current = true; hasInk.current = true; setVerdict(null);
    const ctx = ink.current.getContext("2d");
    const [x, y] = pos(e);
    ctx.strokeStyle = "#F58220"; ctx.lineWidth = 14; ctx.lineCap = ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.1, y); ctx.stroke();
  };
  const move = (e) => {
    if (!drawing.current) return;
    const ctx = ink.current.getContext("2d");
    const [x, y] = pos(e);
    ctx.lineTo(x, y); ctx.stroke();
  };
  const up = () => { drawing.current = false; };
  const clear = () => { setup(ink.current); hasInk.current = false; setVerdict(null); };

  const check = () => {
    if (!hasInk.current) { setVerdict({ ok: false, msg: "Trace la lettre dans le cadre ✍️" }); return; }
    const mask = letterMask(letter.ar), raw = inkMask(ink.current);
    // couverture : tracé élargi sur la lettre ; débordement : tracé brut hors de la lettre élargie
    const s = { coverage: traceScore(mask, dilate(raw, 2)).coverage, outside: traceScore(dilate(mask, 3), raw).outside };
    s.ok = s.coverage >= 0.6 && s.outside <= 0.3;
    if (s.ok) {
      vibrate([15, 30, 15]); speak(letter.ar, 0.5);
      const t = { ...traced, [letter.ar]: true };
      setTraced(t); savePlay({ traced: t }); recordLetter(letter.ar, true); logActivity("games");
      setVerdict({ ok: true, msg: `Bravo ! ${letter.name} est bien tracée ✨` });
    } else {
      vibrate([40, 60, 40]);
      setVerdict({ ok: false, msg: s.coverage < 0.5 ? "✗ Dessine davantage — trace toute la lettre !" : "✗ Trace mieux la lettre : reste sur le modèle." });
    }
  };

  const doneCount = Object.keys(traced).length;
  return (
    <FullScreen title="✍️ Tracer les lettres" onClose={onClose} right={<span className="text-xs font-bold text-slate-500">{doneCount}/28</span>}>
      <div className="flex flex-1 flex-col items-center px-5 pb-6">
        <div className="mt-2 flex w-full max-w-xs items-center justify-between">
          <div>
            <p className="font-display text-2xl font-extrabold">{letter.name}</p>
            <p className="text-sm text-slate-500">se prononce « {letter.sound} »</p>
          </div>
          <button onClick={() => speak(letter.ar, 0.5)} aria-label="Écouter la lettre" className="rounded-full bg-bleu/10 p-3 text-bleu"><Volume2 className="h-5 w-5" /></button>
        </div>
        {DOTTED.has(letter.ar) && <p className="mt-2 rounded-full bg-jaune/30 px-3 py-1 text-xs font-bold text-amber-800">📍 Les points font toujours partie de la lettre</p>}

        <div className="relative mt-3 rounded-3xl border-2 border-dashed border-bleu/30 bg-white shadow-sm" style={{ width: SIZE, height: SIZE, touchAction: "none" }}>
          <canvas ref={guide} className="absolute inset-0" style={{ width: SIZE, height: SIZE }} />
          <canvas ref={ink} aria-label={`Zone pour tracer la lettre ${letter.name}`} className="absolute inset-0 cursor-crosshair" style={{ width: SIZE, height: SIZE, touchAction: "none", opacity: 0.75 }}
            onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up} />
        </div>

        <div className="mt-3 min-h-[44px] text-center">
          {verdict && <motion.p initial={{ y: 6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`text-sm font-bold ${verdict.ok ? "text-vert" : "text-rouge"}`}>{verdict.msg}</motion.p>}
        </div>

        <div className="flex w-full max-w-xs gap-2">
          <button onClick={clear} aria-label="Effacer" className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4"><RotateCcw className="h-5 w-5" /></button>
          {verdict?.ok
            ? <button onClick={() => setIdx((idx + 1) % ABC.length)} className="flex-1 rounded-2xl bg-vert py-3.5 font-display font-bold text-white shadow-md">Lettre suivante →</button>
            : <button onClick={check} className="flex-1 rounded-2xl bg-bleu py-3.5 font-display font-bold text-white shadow-md">Vérifier</button>}
        </div>

        <div dir="rtl" className="mt-5 flex w-full max-w-xs flex-wrap justify-center gap-1">
          {ABC.map((l, i) => (
            <button key={l.ar} onClick={() => setIdx(i)} aria-label={l.name}
              className={`h-8 w-8 rounded-lg text-lg ${i === idx ? "bg-bleu text-white" : traced[l.ar] ? "bg-vert/15 text-vert" : "bg-white text-slate-500 border border-slate-200"}`}
              style={{ fontFamily: "'Amiri Quran',serif", color: i === idx ? undefined : colorOf(l.ar, cmode) }}>{l.ar}</button>
          ))}
        </div>
      </div>
    </FullScreen>
  );
}
