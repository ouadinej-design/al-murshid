import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus } from "lucide-react";
import { useProgress, updateSettings, ACTIVITIES } from "../lib/progress";

const GOALS = [5, 10, 15, 20, 30];
const MIN = 0.85, MAX = 1.6, STEP = 0.05;
// pas, valeur par défaut et maximum de chaque objectif par activité
const STEPS = {
  words:   { step: 5, def: 10, max: 100 },
  quiz:    { step: 5, def: 10, max: 100 },
  adhkar:  { step: 1, def: 5,  max: 40 },
  recite:  { step: 1, def: 3,  max: 50 },
  lessons: { step: 1, def: 1,  max: 7 },
  reading: { step: 1, def: 1,  max: 10 },
};

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
            className="fixed inset-x-0 bottom-0 z-[95] mx-auto max-w-2xl max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-8 shadow-2xl text-encre">
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

            {/* Objectif quotidien : total ou par activité */}
            <section className="mb-5">
              <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">Objectif du jour</p>
              <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
                {[["total", "Total d'actions"], ["custom", "Par activité"]].map(([k, l]) => (
                  <button key={k} onClick={() => updateSettings({ goalMode: k })}
                    className={`rounded-lg py-2 text-xs font-bold ${settings.goalMode === k ? "bg-white text-encre shadow-sm" : "text-slate-500"}`}>{l}</button>
                ))}
              </div>
              {settings.goalMode !== "custom" ? (
                <>
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
                </>
              ) : (
                <>
                  <ul className="space-y-2">
                    {Object.entries(ACTIVITIES).map(([k, a]) => {
                      const t = settings.goals?.[k] || 0;
                      const on = t > 0;
                      const set = (v) => updateSettings({ goals: { ...settings.goals, [k]: Math.max(0, Math.min(STEPS[k].max, v)) } });
                      return (
                        <li key={k} className={`flex items-center gap-2 rounded-xl border p-2.5 ${on ? "border-vert/40 bg-vert/5" : "border-slate-200"}`}>
                          <button onClick={() => set(on ? 0 : STEPS[k].def)} role="switch" aria-checked={on} aria-label={`Suivre : ${a.label}`}
                            className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${on ? "bg-vert" : "bg-slate-300"}`}>
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
                          </button>
                          <span className="flex-1 text-sm font-semibold">{a.icon} {a.label}</span>
                          {on && (
                            <span className="flex items-center gap-1">
                              <button onClick={() => set(t - STEPS[k].step)} aria-label="Moins" className="rounded-lg bg-white border border-slate-200 p-1.5"><Minus className="h-3.5 w-3.5" /></button>
                              <span className="w-8 text-center text-sm font-bold text-vert">{t}</span>
                              <button onClick={() => set(t + STEPS[k].step)} aria-label="Plus" className="rounded-lg bg-white border border-slate-200 p-1.5"><Plus className="h-3.5 w-3.5" /></button>
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="mt-1.5 text-[11px] text-slate-400">Active les activités que tu veux suivre et règle ta cible quotidienne pour chacune. L'objectif est atteint quand toutes les cibles le sont.</p>
                </>
              )}
            </section>

            <p className="text-center text-[11px] text-slate-400">Al-Murshid · ta progression reste sur ton téléphone</p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
