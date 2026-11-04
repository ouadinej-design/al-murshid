import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { useProgress, updateSettings } from "../lib/progress";

const GOALS = [5, 10, 15, 20, 30];
const MIN = 0.85, MAX = 1.6, STEP = 0.05;

export default function SettingsSheet({ open, onClose }) {
  const { settings } = useProgress();
  const scale = settings.arabicScale;
  const setScale = (v) => updateSettings({ arabicScale: Math.round(Math.min(MAX, Math.max(MIN, v)) * 100) / 100 });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-[90] bg-slate-900/40" />
          <motion.div key="sheet" role="dialog" aria-modal="true" aria-label="Réglages"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed inset-x-0 bottom-0 z-[95] mx-auto max-w-2xl rounded-t-3xl bg-white p-5 pb-8 shadow-2xl text-encre">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold">Réglages</h2>
              <button onClick={onClose} aria-label="Fermer" className="rounded-full bg-slate-100 p-2"><X className="h-5 w-5" /></button>
            </div>

            {/* Taille du texte arabe */}
            <section className="mb-5">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">Taille du texte arabe</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setScale(scale - STEP * 2)} aria-label="Réduire" className="rounded-xl bg-slate-100 p-2.5"><Minus className="h-4 w-4" /></button>
                <input type="range" min={MIN} max={MAX} step={STEP} value={scale} onChange={(e) => setScale(Number(e.target.value))}
                  className="flex-1 accent-[#0F4C9B]" aria-label="Taille du texte arabe" />
                <button onClick={() => setScale(scale + STEP * 2)} aria-label="Agrandir" className="rounded-xl bg-slate-100 p-2.5"><Plus className="h-4 w-4" /></button>
                <span className="w-12 text-right text-sm font-bold text-bleu">{Math.round(scale * 100)} %</span>
              </div>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-creme p-4 text-center">
                <p dir="rtl" lang="ar" className="leading-loose" style={{ fontFamily: "'Amiri Quran','Scheherazade New',serif", fontSize: "1.5rem" }}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">S'applique au Coran, aux adhkar et aux leçons.</p>
            </section>

            {/* Objectif quotidien */}
            <section className="mb-5">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">Objectif quotidien</p>
              <div className="grid grid-cols-5 gap-2">
                {GOALS.map((g) => (
                  <button key={g} onClick={() => updateSettings({ dailyGoal: g })}
                    className={`rounded-xl py-2.5 text-sm font-bold border transition-all ${settings.dailyGoal === g ? "bg-rouge text-white border-rouge" : "bg-white text-slate-600 border-slate-200"}`}>
                    {g}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Une action = un mot révisé, une réponse de quiz, un dhikr complété, un verset bien récité, une leçon ou une lecture terminée.
              </p>
            </section>

            <p className="text-center text-[11px] text-slate-400">Al-Murshid · ta progression reste sur ton téléphone</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
