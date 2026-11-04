import { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, RotateCcw, Check } from "lucide-react";

const R = 46;
const CIRC = 2 * Math.PI * R;

function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch { /* non supporté (iPhone) */ }
}

/**
 * Compteur tasbih plein écran : on tape n'importe où dans la zone centrale.
 * L'état (count) reste celui de la page Adhkar, donc tout est sauvegardé.
 */
export default function TasbihCounter({ dhikr, count, onIncrement, onReset, onClose }) {
  const total = dhikr.repetition;
  const done = count >= total;
  const pct = Math.min(1, count / total);
  const phase = dhikr.phases?.find((p) => count < p.upto) || dhikr.phases?.[dhikr.phases.length - 1];

  // vibration plus marquée à la fin (et à chaque changement de formule)
  useEffect(() => {
    if (done) vibrate([60, 80, 60]);
    else if (dhikr.phases?.some((p) => p.upto === count)) vibrate(120);
  }, [done, count, dhikr.phases]);

  // empêche le défilement de la page derrière
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const tap = () => {
    if (done) return;
    vibrate(12);
    onIncrement();
  };

  // rendu dans <body> : toujours plein écran, quel que soit le conteneur parent
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex flex-col bg-creme text-encre" role="dialog" aria-modal="true" aria-label={`Tasbih : ${dhikr.title}`}>
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onClose} className="rounded-full bg-white p-2.5 shadow-sm border border-slate-200" aria-label="Fermer">
          <X className="h-5 w-5" />
        </button>
        <p className="mx-3 flex-1 truncate text-center text-xs font-bold uppercase tracking-wider text-vert">{dhikr.title.replace(/^\d+\.\s*/, "")}</p>
        <button onClick={onReset} className="rounded-full bg-white p-2.5 shadow-sm border border-slate-200" aria-label="Recommencer à zéro">
          <RotateCcw className="h-5 w-5" />
        </button>
      </header>
      <div className="h-1 shrink-0" style={{ background: "linear-gradient(90deg,#E30613 0%,#F58220 25%,#FFD100 50%,#00A19A 75%,#0F4C9B 100%)" }} />

      {/* Zone de tap géante */}
      <button onClick={tap} disabled={done} aria-label={done ? "Terminé" : `Compter (${count + 1} sur ${total})`}
        className="flex flex-1 flex-col items-center justify-center gap-6 px-6 select-none active:bg-vert/5 transition-colors"
        style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}>
        <motion.p key={phase?.arabic || "main"} initial={{ opacity: 0.2, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
            dir="rtl" lang="ar" className="text-center leading-[2.1] text-encre"
            style={{ fontFamily: "'Amiri Quran','Scheherazade New',serif", fontSize: (phase || dhikr.arabic.length < 80) ? "2.1rem" : "1.35rem", maxHeight: "34vh", overflow: "hidden" }}>
            {phase?.arabic || dhikr.arabic}
          </motion.p>
        {phase && <p className="text-sm font-semibold text-slate-500">{phase.label}</p>}

        <div className="relative h-44 w-44">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r={R} fill="none" stroke="#E0F2F1" strokeWidth="7" />
            <circle cx="50" cy="50" r={R} fill="none" stroke={done ? "#00A19A" : "url(#tasbihGrad)"} strokeWidth="7" strokeLinecap="round"
              strokeDasharray={`${pct * CIRC} ${CIRC}`} style={{ transition: "stroke-dasharray .25s ease" }} />
            <defs>
              <linearGradient id="tasbihGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00A19A" /><stop offset="100%" stopColor="#0F4C9B" />
              </linearGradient>
            </defs>
          </svg>
          <motion.div key={count} initial={{ scale: 0.85 }} animate={{ scale: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center">
            {done ? <Check className="h-14 w-14 text-vert" /> : (
              <>
                <span className="font-display text-5xl font-extrabold text-vert">{count}</span>
                <span className="text-sm text-slate-400">/ {total}</span>
              </>
            )}
          </motion.div>
        </div>
        {!done && <p className="text-xs text-slate-400">Touche n'importe où pour compter</p>}
      </button>

      <div className="px-5 pb-8 pt-2">
        {done ? (
          <button onClick={onClose} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-vert py-4 font-display text-lg font-bold text-white shadow-lg">
            <Check className="h-5 w-5" /> Terminé, mā shā' Allāh !
          </button>
        ) : (
          <p className="text-center text-xs italic text-slate-500">{dhikr.source}</p>
        )}
      </div>
    </motion.div>,
    document.body
  );
}
