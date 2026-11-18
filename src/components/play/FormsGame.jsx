import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, BookOpen } from "lucide-react";
import { FullScreen, AR, speak, vibrate } from "./shared";
import {
  getPlay, savePlay, formsSession, letterForms, POSITIONS, FORMS_GUIDE, recordForm, recordLetter,
  formsMastered, ABC, NON_JOINING, FORMS_KNOWN_AT, unlockedLetters,
} from "../../lib/play";
import { localDayKey, logActivity } from "../../lib/progress";
import { colorOf, useColorMode, joinedSegments } from "../../lib/letterColors";
import ColorModePicker from "../ColorModePicker";

const POS_LABEL = Object.fromEntries(POSITIONS.map((p) => [p.key, p.label]));
const POS_HINT = { iso: "seule", ini: "au début du mot", med: "au milieu du mot", fin: "à la fin du mot" };

/** Le guide des 4 formes (aussi affiché depuis l'Alphabet). */
export function FormsGuide({ compact = false }) {
  const [mode] = useColorMode();
  const C = (s) => ({ ...AR, color: colorOf(s, mode) });
  return (
    <div className="space-y-2">
      {FORMS_GUIDE.map((g) => (
        <div key={g.t} className="rounded-2xl border border-slate-200 bg-white p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-extrabold text-encre">{g.t}</p>
            {g.ex && <span dir="rtl" className="rounded-xl bg-bleu/10 px-3 text-3xl leading-[1.6]" style={C(g.ex)}>{g.ex}</span>}
          </div>
          {!compact && <p className="mt-1 text-xs leading-relaxed text-slate-600">{g.d}</p>}
          {!compact && g.chips && (
            <div dir="rtl" className="mt-2 flex flex-wrap justify-center gap-1.5">
              {g.chips.map((c) => <span key={c} className="rounded-xl bg-creme px-3 text-3xl leading-[1.7]" style={C(c)}>{c}</span>)}
            </div>
          )}
          {!compact && g.parts && (
            <div dir="rtl" className="mt-2 flex items-center justify-center gap-1.5">
              {g.parts.map((c, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-lg font-bold text-slate-400">+</span>}
                  <span className="rounded-xl bg-creme px-2 text-3xl leading-[1.7]" style={C(c)}>{c}</span>
                </span>
              ))}
              <span className="text-lg font-bold text-slate-400">=</span>
              <span className="rounded-xl bg-slate-100 px-3 text-3xl leading-[1.7]" style={AR}>
                {joinedSegments([...g.result]).map((seg, i) => <span key={i} style={{ color: colorOf(seg, mode) }}>{seg}</span>)}
              </span>
            </div>
          )}
          {!compact && g.rows && <div className="mt-2 space-y-1.5">{g.rows.map((ar) => <FormsRow key={ar} ar={ar} />)}</div>}
        </div>
      ))}
    </div>
  );
}

/** Tableau des 4 formes d'une lettre. */
function FormsRow({ ar, hi }) {
  const [mode] = useColorMode();
  return (
    <div dir="rtl" className="grid grid-cols-4 gap-1.5">
      {letterForms(ar).map((f) => (
        <div key={f.key} className={`flex flex-col items-center rounded-xl px-1 py-1 ${hi === f.key ? "bg-vert/15 ring-2 ring-vert" : "bg-creme"}`}>
          <span className="text-3xl leading-[1.7]" style={{ ...AR, color: colorOf(ar, mode) }}>{f.f}</span>
          <span className="text-[10px] text-slate-500">{f.label}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Jeu « Les 4 formes » : 10 questions mélangées (forme ↔ position ↔ lettre, et lettres
 * repérées dans de vrais mots du Coran). Compte dans le programme du jour.
 */
export default function FormsGame({ onClose, stage = "mots" }) {
  const beginner = stage === "lettres";
  const [screen, setScreen] = useState("intro"); // intro | guide | play | end
  const [game, setGame] = useState(0);
  const questions = useMemo(() => formsSession(getPlay(), { beginner }), [game]); // eslint-disable-line react-hooks/exhaustive-deps
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState([]);
  const q = questions[step];
  const mastered = formsMastered();
  const [mode] = useColorMode();
  const col = (s) => colorOf(s, mode);

  const options = useMemo(() => {
    if (!q) return [];
    if (q.type === "form2pos" || q.type === "word") return POSITIONS.map((p) => ({ id: p.key, label: p.label }));
    if (q.type === "form2letter") {
      // débutant : on ne propose que des lettres déjà découvertes (si possible)
      const base = beginner && unlockedLetters().length >= 4 ? unlockedLetters() : ABC;
      const pool = base.filter((l) => l.ar !== q.letter.ar);
      // distracteurs : de préférence des lettres qui se ressemblent dans cette position
      const others = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
      return [q.letter, ...others].sort(() => Math.random() - 0.5).map((l) => ({ id: l.ar, ar: l.ar, label: l.name }));
    }
    // pos2form : les formes de la même lettre (dédoublonnées), complétées par celles d'une autre lettre
    const seen = new Set(); const out = [];
    for (const f of letterForms(q.letter.ar)) if (!seen.has(f.f)) { seen.add(f.f); out.push({ id: f.key, ar: f.f }); }
    const answerForm = letterForms(q.letter.ar).find((f) => f.key === q.answer).f;
    const fixed = out.map((o) => ({ ...o, id: o.ar === answerForm ? q.answer : o.id }));
    const extra = ABC.filter((l) => l.ar !== q.letter.ar && !NON_JOINING.has(l.ar)).sort(() => Math.random() - 0.5);
    let k = 0;
    while (fixed.length < 4 && k < extra.length) {
      const f = letterForms(extra[k++].ar).find((x) => x.key === q.answer).f;
      if (!seen.has(f)) { seen.add(f); fixed.push({ id: "x" + k, ar: f }); }
    }
    return fixed.sort(() => Math.random() - 0.5);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const correctId = q ? (q.type === "form2letter" ? q.letter.ar : q.answer) : null;

  const answer = (o) => {
    if (picked) return;
    const ok = o.id === correctId;
    setPicked(o.id);
    vibrate(ok ? 15 : [40, 60, 40]);
    speak(q.letter.ar, 0.5);
    recordForm(q.letter.ar, ok);
    if (beginner) recordLetter(q.letter.ar, ok);
    if (ok) setScore((s) => s + 1);
    else setMissed((m) => (m.includes(q.letter.ar) ? m : [...m, q.letter.ar]));
  };

  const next = () => {
    setPicked(null);
    if (step + 1 >= questions.length) {
      const p = getPlay();
      savePlay({ formsDay: { ...(p.formsDay || {}), [localDayKey()]: true }, best: { ...p.best, forms: Math.max(p.best?.forms || 0, score) } });
      logActivity("games");
      setScreen("end");
      return;
    }
    setStep(step + 1);
  };

  const replay = () => { setGame((g) => g + 1); setStep(0); setScore(0); setMissed([]); setPicked(null); setScreen("play"); };

  // ── Accueil du jeu
  if (screen === "intro" || screen === "guide") {
    return (
      <FullScreen title="🔠 Les 4 formes" onClose={onClose}>
        <div className="space-y-4 px-5 pb-8 pt-3">
          {screen === "intro" ? (
            <>
              <div className="rounded-3xl border-2 border-bleu/30 bg-white p-4 text-center shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-bleu">Une lettre, 4 façons de l'écrire</p>
                <div className="mt-3"><FormsRow ar="ب" /></div>
                <p className="mt-3 text-xs leading-relaxed text-slate-600">
                  Selon sa place dans le mot (seule, au début, au milieu, à la fin), une lettre change de forme. Ce jeu t'apprend à les reconnaître pour pouvoir <b>lire les mots du Coran</b>.
                </p>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-white p-3 text-xs text-slate-600 shadow-sm">
                <span>Lettres dont tu maîtrises les formes</span>
                <span className="font-display text-lg font-extrabold text-vert">{mastered}/28</span>
              </div>
              <ColorModePicker compact />
              <button onClick={() => setScreen("guide")} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-bleu/30 bg-bleu/5 py-3 text-sm font-bold text-bleu">
                <BookOpen className="h-4 w-4" /> Comprendre les 4 formes (2 min)
              </button>
              <button onClick={() => setScreen("play")} className="w-full rounded-2xl bg-bleu py-4 font-display text-base font-bold text-white shadow-md">
                Jouer · 10 questions →
              </button>
              {beginner && <p className="text-center text-[11px] text-slate-400">Adapté à ton niveau : seulement les lettres que tu as déjà découvertes.</p>}
            </>
          ) : (
            <>
              <FormsGuide />
              <button onClick={() => setScreen("play")} className="w-full rounded-2xl bg-bleu py-4 font-display text-base font-bold text-white shadow-md">J'ai compris, je joue →</button>
            </>
          )}
        </div>
      </FullScreen>
    );
  }

  // ── Fin
  if (screen === "end") {
    return (
      <FullScreen title="🔠 Les 4 formes" onClose={onClose}>
        <div className="flex flex-1 flex-col px-6 pb-8 pt-6 text-center">
          <motion.p initial={{ scale: 0.4 }} animate={{ scale: 1 }} className="text-6xl">{score >= 8 ? "🏆" : score >= 5 ? "💪" : "🌱"}</motion.p>
          <h3 className="mt-2 font-display text-2xl font-extrabold">{score}/{questions.length} bonnes réponses</h3>
          <p className="text-sm text-slate-500">Formes maîtrisées : {formsMastered()}/28 lettres · ✓ programme du jour</p>
          {missed.length > 0 && (
            <div className="mt-4 space-y-2 text-left">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">À revoir</p>
              {missed.map((ar) => (
                <div key={ar} className="rounded-2xl border border-slate-200 bg-white p-2">
                  <p className="mb-1 text-xs font-bold text-slate-600">{ABC.find((l) => l.ar === ar)?.name}</p>
                  <FormsRow ar={ar} />
                </div>
              ))}
            </div>
          )}
          <div className="mt-auto space-y-2 pt-6">
            <button onClick={replay} className="w-full rounded-2xl bg-bleu py-3.5 font-display font-bold text-white">Rejouer</button>
            <button onClick={onClose} className="w-full rounded-2xl border border-slate-200 bg-white py-3 font-bold text-slate-600">Terminer</button>
          </div>
        </div>
      </FullScreen>
    );
  }

  // ── Question
  const good = picked && picked === correctId;
  const form = letterForms(q.letter.ar).find((f) => f.key === q.answer)?.f;
  let prompt, display;
  if (q.type === "pos2form") {
    prompt = <>Comment s'écrit <b style={{ color: col(q.letter.ar) }}>{q.letter.name}</b> <b className="text-bleu">{POS_HINT[q.answer]}</b> ?</>;
    display = <div className="text-center"><p dir="rtl" className="text-7xl leading-[1.6]" style={{ ...AR, color: col(q.letter.ar) }}>{q.letter.ar}</p><p className="text-xs text-slate-400">{q.letter.name} · « {q.letter.sound} »</p></div>;
  } else if (q.type === "form2pos") {
    prompt = <>Cette forme de <b style={{ color: col(q.letter.ar) }}>{q.letter.name}</b> se trouve où dans le mot ?</>;
    display = <p dir="rtl" className="text-7xl leading-[1.6]" style={{ ...AR, color: col(q.letter.ar) }}>{form}</p>;
  } else if (q.type === "form2letter") {
    prompt = <>Quelle lettre est-ce ? <span className="text-slate-400">(forme {POS_LABEL[q.answer].toLowerCase()})</span></>;
    display = <p dir="rtl" className="text-7xl leading-[1.6]" style={{ ...AR, color: col(q.letter.ar) }}>{form}</p>;
  } else {
    // la lettre demandée dans sa couleur, les autres en gris
    const segs = joinedSegments(q.letters);
    const target = mode === "noir" ? "#E30613" : col(q.letter.ar);
    prompt = <>Dans ce mot, sous quelle forme est la lettre <b style={{ color: target }}>{q.letter.name}</b> ?</>;
    display = (
      <div className="text-center">
        <p dir="rtl" className="text-6xl leading-[1.8]" style={AR}>
          {segs.map((s, i) => <span key={i} style={{ color: i === q.index ? target : "#B6BFCC" }}>{s}</span>)}
        </p>
        <p className="text-xs text-slate-500">{q.word.fr}</p>
      </div>
    );
  }

  return (
    <FullScreen title="🔠 Les 4 formes" onClose={onClose} right={<span className="text-xs font-bold text-slate-500">{step + 1}/{questions.length}</span>}>
      <div className="flex flex-1 flex-col px-5 pb-6">
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-vert transition-all" style={{ width: `${(step / questions.length) * 100}%` }} />
        </div>
        <p className="mt-4 text-sm text-slate-600">{prompt}</p>
        <div className="relative mt-3 flex min-h-[150px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          {display}
          <button onClick={() => speak(q.type === "word" ? q.word.ar : q.letter.ar, 0.5)} aria-label="Écouter" className="absolute right-3 top-3 rounded-full bg-bleu/10 p-2 text-bleu"><Volume2 className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {options.map((o) => {
            const right = o.id === correctId, isPicked = picked === o.id;
            const cls = !picked ? "border-slate-200 bg-white" : right ? "border-vert bg-vert/10 text-vert" : isPicked ? "border-rouge bg-rouge/10 text-rouge" : "border-slate-200 bg-white opacity-50";
            return (
              <button key={o.id} onClick={() => answer(o)} className={`min-h-[70px] rounded-2xl border-2 p-2 font-bold ${cls}`}>
                {o.ar ? (
                  <span className="flex flex-col items-center">
                    <span dir="rtl" className="text-4xl leading-[1.6]" style={AR}>{o.ar}</span>
                    {o.label && <span className="text-[11px]">{o.label}</span>}
                  </span>
                ) : <span className="text-base">{o.label}</span>}
              </button>
            );
          })}
        </div>
        {picked && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 rounded-2xl p-3 ${good ? "bg-vert/10" : "bg-rouge/10"}`}>
            <p className={`font-display font-extrabold ${good ? "text-vert" : "text-rouge"}`}>
              {good ? "✓ Bravo !" : `La bonne réponse : ${q.type === "form2letter" ? q.letter.name : POS_LABEL[q.answer]}`}
            </p>
            <p className="mb-2 text-xs text-slate-600">
              {q.type === "word"
                ? (q.answer === "med" ? "Attachée des deux côtés → milieu." : q.answer === "ini" ? "Attachée seulement à la lettre suivante (à gauche) → début." : q.answer === "fin" ? "Attachée seulement à la lettre d'avant (à droite) → fin." : "Attachée à rien → isolée.")
                : NON_JOINING.has(q.letter.ar) ? `${q.letter.name} ne s'attache jamais à gauche : seulement 2 formes.` : `Les 4 formes de ${q.letter.name} :`}
            </p>
            <FormsRow ar={q.letter.ar} hi={q.answer} />
            <button onClick={next} className={`mt-3 w-full rounded-xl py-3 font-bold text-white ${good ? "bg-vert" : "bg-rouge"}`}>Continuer</button>
          </motion.div>
        )}
        {(getPlay().forms?.[q.letter.ar] || 0) >= FORMS_KNOWN_AT && !picked && <p className="mt-2 text-center text-[11px] text-vert">✓ Tu maîtrises déjà {q.letter.name}</p>}
      </div>
    </FullScreen>
  );
}
