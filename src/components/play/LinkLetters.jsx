import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { FullScreen, AR, speak, vibrate } from "./shared";
import { linkRound, getPlay, savePlay, unlockedLetters, recordLetter } from "../../lib/play";
import { logActivity } from "../../lib/progress";

const ROUNDS = 5;
const MODES = [
  { key: "name", label: "Relie la lettre à son nom", right: (l) => `${l.name} · ${l.sound}` },
  { key: "ini",  label: "Relie la lettre à sa forme en début de mot", right: (l) => l.ini, arabic: true },
];

/**
 * Relier : on tire un fil de chaque lettre vers son nom (ou sa forme au début du mot).
 * Marche au doigt (glisser) ou en touchant la lettre puis la réponse.
 */
export default function LinkLetters({ onClose, stage = "mots" }) {
  const [round, setRound] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [finished, setFinished] = useState(false);
  const mode = MODES[round % 2];
  // Débutant : seulement les lettres débloquées (4 au départ), sinon tout l'alphabet
  const letters = useMemo(() => (stage === "lettres"
    ? [...unlockedLetters()].sort(() => Math.random() - 0.5).slice(0, 4)
    : linkRound(round + getPlay().linked)), [round]); // eslint-disable-line react-hooks/exhaustive-deps
  const answers = useMemo(() => [...letters].sort(() => Math.random() - 0.5), [letters]);
  const [links, setLinks] = useState({});      // ar → ar relié correctement
  const [sel, setSel] = useState(null);        // lettre choisie (mode toucher)
  const [drag, setDrag] = useState(null);      // { from, x, y }
  const [wrong, setWrong] = useState(null);
  const box = useRef(null), leftRefs = useRef({}), rightRefs = useRef({});
  const [, relayout] = useState(0);

  useLayoutEffect(() => { relayout((x) => x + 1); }, [round]);

  const anchor = (el, side) => {
    if (!el || !box.current) return null;
    const b = box.current.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { x: (side === "l" ? r.right : r.left) - b.left, y: r.top + r.height / 2 - b.top };
  };

  const tryLink = (from, to) => {
    if (!from || !to || links[from]) return;
    if (from === to) {
      vibrate(12); speak(from, 0.5);
      if (stage === "lettres") recordLetter(from, true);
      const nl = { ...links, [from]: to };
      setLinks(nl);
      if (Object.keys(nl).length === letters.length) {
        setTimeout(() => {
          if (round + 1 >= ROUNDS) {
            logActivity("games");
            savePlay({ linked: (getPlay().linked || 0) + ROUNDS });
            setFinished(true);
          } else { setRound(round + 1); setLinks({}); }
        }, 700);
      }
    } else {
      vibrate([40, 60, 40]); setMistakes((m) => m + 1);
      if (stage === "lettres") recordLetter(from, false);
      setWrong({ from, to }); setTimeout(() => setWrong(null), 600);
    }
    setSel(null);
  };

  const onDown = (e, ar) => {
    if (links[ar]) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    const b = box.current.getBoundingClientRect();
    setDrag({ from: ar, x: e.clientX - b.left, y: e.clientY - b.top, moved: false });
  };
  const onMove = (e) => {
    if (!drag) return;
    const b = box.current.getBoundingClientRect();
    setDrag({ ...drag, x: e.clientX - b.left, y: e.clientY - b.top, moved: true });
  };
  const onUp = (e) => {
    if (!drag) return;
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest("[data-answer]");
    if (el && drag.moved) tryLink(drag.from, el.dataset.answer);
    setDrag(null);
  };

  if (finished) {
    return (
      <FullScreen title="🧵 Relier" onClose={onClose}>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-6xl">{mistakes === 0 ? "🌟" : "👏"}</p>
          <h3 className="mt-3 font-display text-2xl font-extrabold">{ROUNDS} manches réussies !</h3>
          <p className="mt-1 text-sm text-slate-500">{mistakes === 0 ? "Sans aucune erreur, mā shā' Allāh !" : `${mistakes} erreur${mistakes > 1 ? "s" : ""} en chemin`}</p>
          <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
            <button onClick={() => { setFinished(false); setRound(0); setLinks({}); setMistakes(0); }} className="rounded-2xl bg-bleu py-3.5 font-display font-bold text-white shadow-md">Continuer avec d'autres lettres</button>
            <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600">Retour</button>
          </div>
        </div>
      </FullScreen>
    );
  }

  const lines = Object.entries(links).map(([a, b]) => [anchor(leftRefs.current[a], "l"), anchor(rightRefs.current[b], "r"), "#00A19A"]);
  if (wrong) lines.push([anchor(leftRefs.current[wrong.from], "l"), anchor(rightRefs.current[wrong.to], "r"), "#E30613"]);
  const dragFrom = drag?.moved ? anchor(leftRefs.current[drag.from], "l") : null;

  return (
    <FullScreen title="🧵 Relier" onClose={onClose} right={<span className="text-xs font-bold text-slate-500">{round + 1}/{ROUNDS}</span>}>
      <div className="flex flex-1 flex-col px-5 pb-6">
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-vert transition-all" style={{ width: `${(round / ROUNDS) * 100}%` }} /></div>
        <p className="mt-3 text-sm font-semibold text-slate-600">{mode.label}</p>
        <p className="text-[11px] text-slate-400">Glisse du doigt de la lettre vers la réponse, ou touche l'une puis l'autre.</p>

        <div ref={box} className="relative mt-4 grid grid-cols-2 gap-x-16 gap-y-3 select-none" style={{ touchAction: "none" }}
          onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={() => setDrag(null)}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
            {lines.filter(([a, b]) => a && b).map(([a, b, c], i) => <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={c} strokeWidth="4" strokeLinecap="round" />)}
            {dragFrom && <line x1={dragFrom.x} y1={dragFrom.y} x2={drag.x} y2={drag.y} stroke="#F58220" strokeWidth="4" strokeDasharray="6 6" strokeLinecap="round" />}
          </svg>
          {letters.map((l, i) => {
            const a = answers[i];
            const doneL = !!links[l.ar], doneR = Object.values(links).includes(a.ar);
            return [
              <motion.button key={"l" + l.ar} ref={(el) => (leftRefs.current[l.ar] = el)} whileTap={{ scale: 0.95 }}
                onPointerDown={(e) => onDown(e, l.ar)} onClick={() => !drag?.moved && setSel(sel === l.ar ? null : l.ar)}
                className={`flex h-16 items-center justify-center rounded-2xl border-2 text-4xl ${doneL ? "border-vert bg-vert/10" : sel === l.ar ? "border-orange bg-orange/10" : "border-slate-200 bg-white"}`}
                style={AR}>{l.ar}</motion.button>,
              <button key={"r" + a.ar} data-answer={a.ar} ref={(el) => (rightRefs.current[a.ar] = el)}
                onClick={() => (sel ? tryLink(sel, a.ar) : mode.key === "name" && speak(a.ar, 0.5))}
                className={`flex h-16 items-center justify-center gap-1.5 rounded-2xl border-2 px-2 text-center ${doneR ? "border-vert bg-vert/10 text-vert" : wrong?.to === a.ar ? "border-rouge bg-rouge/10" : "border-slate-200 bg-white"} ${mode.arabic ? "text-3xl" : "text-sm font-bold"}`}
                style={mode.arabic ? AR : undefined}>
                {mode.key === "name" && <Volume2 className="h-3.5 w-3.5 shrink-0 text-bleu" />}
                {mode.right(a)}
              </button>,
            ];
          })}
        </div>
      </div>
    </FullScreen>
  );
}
