import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import { flameFor } from "../../lib/play";

export const AR = { fontFamily: "'Amiri Quran','Scheherazade New',serif" };

export function speak(text, rate = 0.7) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA"; u.rate = rate;
    const v = window.speechSynthesis.getVoices().find((x) => x.lang?.startsWith("ar"));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch { /* synthèse vocale indisponible */ }
}
export function vibrate(p) { try { navigator.vibrate?.(p); } catch { /* */ } }

/** Flamme de série colorée selon sa longueur. */
export function Flame({ streak, size = 44 }) {
  const f = flameFor(streak);
  return (
    <motion.svg width={size} height={size} viewBox="0 0 48 48" aria-label={`${f.name}, série de ${streak} jour${streak > 1 ? "s" : ""}`}
      animate={streak > 0 ? { scale: [1, 1.06, 1] } : undefined} transition={{ repeat: Infinity, duration: 1.6 }}>
      <path d="M24 3c2 8 12 13 12 25a12 12 0 0 1-24 0c0-6 3-10 6-13 0 4 2 7 4 8-1-8 2-15 2-20z" fill={f.color} />
      <path d="M24 22c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 4 0-4 1-7 1-10z" fill={f.glow} />
    </motion.svg>
  );
}

/** Écran plein (même habillage que les leçons du parcours). */
export function FullScreen({ title, onClose, right, children }) {
  return createPortal(
    <div className="fixed inset-0 z-[110] flex flex-col bg-creme text-encre" role="dialog" aria-modal="true" aria-label={title}>
      <header className="flex items-center gap-3 px-4 pt-4">
        <button onClick={onClose} aria-label="Fermer" className="rounded-full border border-slate-200 bg-white p-2"><X className="h-5 w-5" /></button>
        <h2 className="min-w-0 flex-1 truncate font-display text-lg font-extrabold">{title}</h2>
        {right}
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
    </div>,
    document.body
  );
}

export function Lives({ n, max = 3 }) {
  return <span className="text-base" aria-label={`${n} vie${n > 1 ? "s" : ""}`}>{"❤️".repeat(n)}{"🤍".repeat(Math.max(0, max - n))}</span>;
}

/** Fin de partie commune aux jeux. */
export function GameOver({ score, unit, best, isRecord, lines = [], onReplay, onClose }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <motion.p initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="text-6xl">{isRecord ? "🏆" : "💪"}</motion.p>
      <h3 className="mt-3 font-display text-2xl font-extrabold">{isRecord ? "Nouveau record !" : "Partie terminée"}</h3>
      <p className="mt-1 font-display text-4xl font-extrabold text-bleu">{score} <span className="text-base text-slate-500">{unit}</span></p>
      <p className="text-sm text-slate-500">Record : {best} {unit}</p>
      {lines.length > 0 && (
        <div className="mt-4 w-full max-w-xs space-y-1.5 text-left">
          {lines.map((w, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
              <span className="text-sm font-semibold">{w.fr}</span>
              <span dir="rtl" lang="ar" className="text-xl" style={AR}>{w.ar}</span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        <button onClick={onReplay} className="rounded-2xl bg-bleu py-3.5 font-display font-bold text-white shadow-md">Rejouer</button>
        <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600">Retour</button>
      </div>
    </div>
  );
}
