import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GOALS, LEVELS_START, MINUTES, projection, savePlay } from "../../lib/play";
import { pathStats } from "../../lib/path";

/**
 * Accueil personnalisé (une seule fois) : prénom → objectif → niveau → temps par jour
 * → projection « voilà où tu en seras ». Inspiré des parcours d'accueil des applis de jeu.
 */
export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(null);
  const [level, setLevel] = useState(null);
  const [minutes, setMinutes] = useState(10);
  const startWords = pathStats().words;
  const proj = projection(minutes, startWords);
  const max = Math.max(...proj.points.map((p) => p.words), 1);
  const total = 5;

  const finish = () => {
    const profile = { name: name.trim(), goal, level, minutes, createdAt: Date.now() };
    savePlay({ profile });
    onDone(profile);
  };

  const Bubble = ({ children }) => (
    <div className="flex items-start gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-bleu to-vert text-xl text-white shadow">☪</span>
      <p className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-3 text-[15px] font-semibold shadow-sm">{children}</p>
    </div>
  );
  const Choice = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`flex w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left text-sm font-bold transition-all ${active ? "border-bleu bg-bleu/10 text-bleu" : "border-slate-200 bg-white"}`}>
      {icon && <span className="text-xl">{icon}</span>}{label}
    </button>
  );

  const canNext = [name.trim().length > 0, !!goal, !!level, !!minutes, true][step];
  const first = name.trim() || "toi";

  return (
    <div className="rounded-3xl border border-slate-200 bg-creme p-4 shadow-sm">
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-200">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-orange to-jaune" animate={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.18 }} className="space-y-3">
          {step === 0 && (<>
            <Bubble>Salam ! Comment tu t'appelles ? Je vais personnaliser ton parcours 😊</Bubble>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value.slice(0, 24))} onKeyDown={(e) => e.key === "Enter" && canNext && setStep(1)}
              placeholder="Ton prénom…" className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-base font-semibold outline-none focus:border-bleu" />
          </>)}
          {step === 1 && (<>
            <Bubble>Enchanté {first} ! Pourquoi veux-tu apprendre ?</Bubble>
            {GOALS.map((g) => <Choice key={g.key} active={goal === g.key} onClick={() => setGoal(g.key)} icon={g.icon} label={g.label} />)}
          </>)}
          {step === 2 && (<>
            <Bubble>Où en es-tu avec la lecture de l'arabe ?</Bubble>
            {LEVELS_START.map((l) => <Choice key={l.key} active={level === l.key} onClick={() => setLevel(l.key)} label={l.label} />)}
          </>)}
          {step === 3 && (<>
            <Bubble>Combien de temps par jour veux-tu y consacrer ?</Bubble>
            <div className="grid grid-cols-2 gap-2">
              {MINUTES.map((m) => <Choice key={m} active={minutes === m} onClick={() => setMinutes(m)} label={`${m} min / jour`} />)}
            </div>
            <p className="text-center text-xs text-slate-500">Un peu chaque jour vaut mieux que beaucoup une fois par semaine.</p>
          </>)}
          {step === 4 && (<>
            <Bubble>{first}, voilà ta progression si tu joues {minutes} min par jour !</Bubble>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex h-36 items-end justify-between gap-3">
                {proj.points.map((p, i) => (
                  <div key={p.label} className="flex flex-1 flex-col items-center justify-end">
                    <span className="mb-1 text-xs font-extrabold text-encre">~{p.words}</span>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max(4, (p.words / max) * 100)}px` }} transition={{ delay: i * 0.15 }}
                      className="w-full rounded-t-lg" style={{ background: ["#CBD5E1", "#F58220", "#FFD100", "#00A19A"][i] }} />
                    <span className="mt-1 text-[10px] font-semibold text-slate-500">{p.label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-right text-[10px] text-slate-400">mots du Coran connus</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Tu seras capable de :</p>
              <ul className="space-y-1.5 font-semibold">
                {level === "zero" && <li>✍️ Lire et écrire les 28 lettres</li>}
                <li>📖 Reconnaître ~{proj.points[3].words} mots en lisant le Coran</li>
                <li>🕌 Comprendre le sens de ta prière et des courtes sourates</li>
                <li>🔥 Garder une série quotidienne grâce au Mot du jour</li>
              </ul>
              <p className="mt-3 text-[11px] text-slate-400">Estimation : ~{proj.perDay} nouveau{proj.perDay > 1 ? "x" : ""} mot{proj.perDay > 1 ? "s" : ""} par jour, révisions comprises.</p>
            </div>
          </>)}
        </motion.div>
      </AnimatePresence>
      <div className="mt-4 flex gap-2">
        {step > 0 && <button onClick={() => setStep(step - 1)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600">←</button>}
        <button disabled={!canNext} onClick={() => (step < total - 1 ? setStep(step + 1) : finish())}
          className="flex-1 rounded-2xl bg-bleu py-3.5 font-display font-bold text-white shadow-md disabled:opacity-40">
          {step < total - 1 ? "Continuer →" : "C'est parti ! 🚀"}
        </button>
      </div>
    </div>
  );
}
