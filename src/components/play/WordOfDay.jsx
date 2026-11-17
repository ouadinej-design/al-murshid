import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Delete, Volume2 } from "lucide-react";
import { FullScreen, AR, speak, vibrate } from "./shared";
import { LETTERS, skeleton, dailyWord, dailyNumber, scoreGuess, getPlay, savePlay } from "../../lib/play";
import { localDayKey } from "../../lib/progress";
import { logActivity } from "../../lib/progress";

const MARK = { ok: "bg-vert text-white border-vert", near: "bg-jaune text-encre border-jaune", no: "bg-slate-300 text-slate-600 border-slate-300" };

/**
 * Mot du jour : un mot coranique mystère, le même pour tous, à deviner lettre par lettre.
 * Essais illimités ; une barre indique si l'on est proche. Indices progressifs.
 */
export default function WordOfDay({ onClose, onSolved }) {
  const day = localDayKey();
  const word = useMemo(() => dailyWord(day), [day]);
  const answer = useMemo(() => skeleton(word.ar), [word]);
  const len = [...answer].length;
  const saved = getPlay().daily[day] || { guesses: [], solved: false };
  const [guesses, setGuesses] = useState(saved.guesses);
  const [solved, setSolved] = useState(saved.solved);
  const [cur, setCur] = useState([]);
  const [shake, setShake] = useState(0);

  const results = guesses.map((g) => scoreGuess(g, answer));
  const last = results[results.length - 1];
  const hints = [
    guesses.length >= 2 && { label: "Catégorie", value: word.cat },
    guesses.length >= 4 && { label: "Sens", value: word.fr },
    guesses.length >= 6 && { label: "Prononciation", value: word.tr },
  ].filter(Boolean);

  // état des touches du clavier
  const RANK = { no: 1, near: 2, ok: 3 };
  const keyState = {};
  results.forEach((r, gi) => [...guesses[gi]].forEach((c, i) => {
    const m = r.marks[i];
    if (!keyState[c] || RANK[m] > RANK[keyState[c]]) keyState[c] = m;
  }));

  const persist = (g, s) => {
    const p = getPlay();
    savePlay({ daily: { ...p.daily, [day]: { guesses: g, solved: s } } });
  };

  const submit = () => {
    if (cur.length !== len) { setShake((x) => x + 1); vibrate([30, 40, 30]); return; }
    const g = cur.join("");
    const next = [...guesses, g];
    const r = scoreGuess(g, answer);
    setGuesses(next); setCur([]);
    if (r.solved) {
      setSolved(true); persist(next, true);
      vibrate([20, 40, 80]); speak(word.ar);
      logActivity("games"); logActivity("words");
      onSolved?.();
    } else {
      persist(next, false); vibrate(15);
    }
  };

  const type = (c) => { if (!solved && cur.length < len) setCur([...cur, c]); };

  return (
    <FullScreen title={`☀️ Mot du jour n° ${dailyNumber(day)}`} onClose={onClose}>
      <div className="flex flex-1 flex-col px-4 pb-4">
        <p className="mt-2 text-center text-sm text-slate-500">
          {solved ? "Trouvé ! Reviens demain pour un nouveau mot." : `Un mot du Coran de ${len} lettres. Essais illimités : le but c'est de trouver !`}
        </p>

        {/* barre proche / loin */}
        {last && !solved && (
          <div className="mx-auto mt-3 w-full max-w-sm">
            <div className="flex justify-between text-[10px] font-bold text-slate-400"><span>Loin</span><span>Proche</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <motion.div className="h-full rounded-full" animate={{ width: `${Math.max(4, last.closeness)}%` }}
                style={{ background: last.closeness > 70 ? "#00A19A" : last.closeness > 35 ? "#FFD100" : "#F58220" }} />
            </div>
            <p className="mt-1 text-center text-xs font-bold text-slate-500">
              {last.closeness > 70 ? "🔥 Tout proche !" : last.closeness > 35 ? "Tu chauffes…" : "C'est encore froid ❄️"}
            </p>
          </div>
        )}

        {/* essais (lus de droite à gauche) */}
        <div className="mx-auto mt-3 w-full max-w-sm space-y-1.5" dir="rtl">
          {guesses.slice(-5).map((g, gi) => {
            const r = results[results.length - Math.min(5, guesses.length) + gi];
            return (
              <div key={gi} className="flex justify-center gap-1.5">
                {[...g].map((c, i) => (
                  <motion.span key={i} initial={{ rotateX: 90 }} animate={{ rotateX: 0 }} transition={{ delay: i * 0.06 }}
                    className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 text-2xl ${MARK[r.marks[i]]}`} style={AR}>{c}</motion.span>
                ))}
              </div>
            );
          })}
          {guesses.length > 5 && <p className="text-center text-[10px] text-slate-400" dir="ltr">({guesses.length} essais au total)</p>}
          {!solved && (
            <motion.div key={shake} animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : undefined} className="flex justify-center gap-1.5">
              {Array.from({ length: len }, (_, i) => (
                <span key={i} className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 bg-white text-2xl ${cur[i] ? "border-bleu" : "border-slate-200"}`} style={AR}>{cur[i] || ""}</span>
              ))}
            </motion.div>
          )}
        </div>

        {solved && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto mt-4 w-full max-w-sm rounded-3xl border-2 border-vert/30 bg-white p-5 text-center shadow-sm">
            <p className="text-xs font-extrabold uppercase tracking-wider text-vert">🎉 Trouvé en {guesses.length} essai{guesses.length > 1 ? "s" : ""}</p>
            <p dir="rtl" lang="ar" className="mt-2 text-5xl leading-[1.7]" style={AR}>{word.ar}</p>
            <p className="font-semibold text-bleu">{word.tr}</p>
            <p className="mt-1 font-display text-xl font-extrabold">{word.fr}</p>
            <p className="mt-1 text-xs text-slate-400">≈ {(word.freq || 0).toLocaleString("fr-FR")} fois dans le Coran</p>
            <button onClick={() => speak(word.ar)} className="mx-auto mt-3 flex items-center gap-2 rounded-full bg-bleu/10 px-4 py-2 text-sm font-bold text-bleu"><Volume2 className="h-4 w-4" /> Écouter</button>
            <p className="mt-3 text-xs text-slate-500">🔥 Ta flamme est allumée pour aujourd'hui.</p>
          </motion.div>
        )}

        {hints.length > 0 && !solved && (
          <div className="mx-auto mt-3 flex w-full max-w-sm flex-wrap justify-center gap-1.5">
            {hints.map((h) => <span key={h.label} className="rounded-full bg-bleu/10 px-3 py-1 text-xs font-bold text-bleu">💡 {h.label} : {h.value}</span>)}
          </div>
        )}
        {!solved && guesses.length < 6 && (
          <p className="mt-2 text-center text-[10px] text-slate-400">Indice après 2, 4 et 6 essais · 🟩 bonne place · 🟨 ailleurs dans le mot</p>
        )}

        {/* clavier arabe */}
        {!solved && (
          <div className="mx-auto mt-auto w-full max-w-sm pt-4">
            <div dir="rtl" className="grid grid-cols-7 gap-1">
              {LETTERS.map((c) => (
                <button key={c} onClick={() => type(c)}
                  className={`h-11 rounded-lg border text-xl font-bold active:scale-95 ${keyState[c] ? MARK[keyState[c]] : "border-slate-200 bg-white"}`} style={AR}>{c}</button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <button onClick={() => setCur(cur.slice(0, -1))} aria-label="Effacer" className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4"><Delete className="h-5 w-5" /></button>
              <button onClick={submit} className="flex-1 rounded-xl bg-bleu py-3 font-display font-bold text-white">Valider</button>
            </div>
          </div>
        )}
      </div>
    </FullScreen>
  );
}
