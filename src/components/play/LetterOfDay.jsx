import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Volume2 } from "lucide-react";
import { FullScreen, AR, speak, vibrate } from "./shared";
import { getPlay, savePlay, nextLetter, unlockedLetters, syllablesOf, syllableLetters, itemOptions, letterForms, recordLetter, recordSyllable, KNOWN_AT } from "../../lib/play";
import { localDayKey, logActivity } from "../../lib/progress";

/**
 * La lettre du jour (étapes Lettres et Syllabes) : on DÉCOUVRE une lettre
 * (forme, nom, son, formes dans le mot), puis on s'entraîne avec 6 petites questions
 * mélangées aux lettres déjà vues. En étape Syllabes : la lettre avec fatḥa, kasra, ḍamma.
 */
export default function LetterOfDay({ stage, onClose, onDone }) {
  const p = getPlay();
  const today = localDayKey();
  // la lettre du jour reste la même toute la journée
  const letter = useMemo(() => {
    const saved = p.dailyLetter?.[today];
    if (saved) return [...unlockedLetters(p), ...syllableLetters(p)].find((l) => l.ar === saved) || nextLetter(p);
    if (stage === "syllabes") { const pool = syllableLetters(p); return pool[pool.length - 1]; }
    return nextLetter(p) || unlockedLetters(p)[0];
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sylls = useMemo(() => syllablesOf(letter), [letter]);
  const questions = useMemo(() => {
    if (stage === "syllabes") {
      const pool = syllableLetters(p).flatMap(syllablesOf);
      return [...sylls, ...sylls].sort(() => Math.random() - 0.5).map((s, i) => ({ item: s, pool, mode: i % 2 ? "ar2fr" : "fr2ar" }));
    }
    const pool = unlockedLetters(p).map((l) => ({ id: l.ar, ar: l.ar, fr: `${l.name} · ${l.sound}` }));
    const me = pool.find((x) => x.id === letter.ar) || { id: letter.ar, ar: letter.ar, fr: `${letter.name} · ${letter.sound}` };
    // 4 questions sur la lettre du jour + 2 révisions de lettres déjà vues
    const others = pool.filter((x) => x.id !== letter.ar).sort(() => Math.random() - 0.5).slice(0, 2);
    return [me, me, ...others, me, me].map((item, i) => ({ item, pool: pool.length >= 4 ? pool : [...pool, ...unlockedLetters({ letters: {} }).map((l) => ({ id: l.ar, ar: l.ar, fr: `${l.name} · ${l.sound}` }))], mode: i % 2 ? "fr2ar" : "ar2fr" }));
  }, [letter, stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const [step, setStep] = useState(-1); // -1 = découverte
  const [picked, setPicked] = useState(null);
  const [ok, setOk] = useState(0);
  const q = questions[step];
  const options = useMemo(() => (q ? itemOptions(q.item, q.pool) : []), [q]);

  const start = () => {
    savePlay({ dailyLetter: { ...(getPlay().dailyLetter || {}), [today]: letter.ar } });
    setStep(0);
  };
  const answer = (o) => {
    if (picked) return;
    const good = o.id === q.item.id;
    setPicked(o.id);
    vibrate(good ? 15 : [40, 60, 40]);
    speak(q.item.ar, 0.5);
    if (stage === "syllabes") recordSyllable(good); else recordLetter(q.item.id, good);
    if (good) setOk((n) => n + 1);
  };
  const next = () => {
    setPicked(null);
    if (step + 1 >= questions.length) {
      const d = getPlay().daily || {};
      savePlay({ daily: { ...d, [today]: { ...(d[today] || {}), solved: true, letter: letter.ar } } });
      logActivity("games");
      setStep(questions.length);
      onDone?.();
      return;
    }
    setStep(step + 1);
  };

  const title = stage === "syllabes" ? "🔤 Syllabes du jour" : "🔤 Lettre du jour";
  const level = getPlay().letters?.[letter.ar] || 0;

  // ── Fin
  if (step >= questions.length) {
    return (
      <FullScreen title={title} onClose={onClose}>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p dir="rtl" className="text-8xl" style={AR}>{letter.ar}</p>
          <h3 className="mt-3 font-display text-2xl font-extrabold">{ok}/{questions.length} bonnes réponses</h3>
          <p className="mt-1 text-sm text-slate-500">
            {stage === "syllabes" ? `Tu sais lire ${sylls.map((s) => s.fr).join(", ")} !` : level >= KNOWN_AT ? `Tu connais maintenant ${letter.name} ✓` : `Encore un peu d'entraînement sur ${letter.name} : rejoue à Survie ou Relier.`}
          </p>
          <p className="mt-2 text-xs text-slate-400">Nouvelle lettre demain. Tu peux continuer avec les jeux ⬇︎</p>
          <button onClick={onClose} className="mt-6 w-full max-w-xs rounded-2xl bg-bleu py-3.5 font-display font-bold text-white">Continuer</button>
        </div>
      </FullScreen>
    );
  }

  // ── Découverte
  if (step < 0) {
    return (
      <FullScreen title={title} onClose={onClose}>
        <div className="flex flex-1 flex-col px-5 pb-6">
          <div className="mt-3 flex flex-1 flex-col items-center justify-center rounded-3xl border-2 border-jaune bg-white p-5 text-center shadow-sm">
            {stage === "syllabes" ? (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">La lettre {letter.name} avec les 3 voyelles</p>
                <div dir="rtl" className="mt-4 flex gap-3">
                  {sylls.map((s) => (
                    <button key={s.id} onClick={() => speak(s.ar, 0.5)} className="flex flex-col items-center rounded-2xl border border-slate-200 bg-creme px-4 py-3">
                      <span className="text-5xl leading-[1.6]" style={AR}>{s.ar}</span>
                      <span className="font-display text-xl font-extrabold text-bleu">{s.fr}</span>
                      <span className="text-[10px] text-slate-400">{s.vowel}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-slate-500">
                  Petit trait <b>au-dessus</b> (fatḥa) = « a » · petit trait <b>en dessous</b> (kasra) = « i » · petit <b>و</b> au-dessus (ḍamma) = « u »
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Nouvelle lettre</p>
                <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-[7rem] leading-[1.5]" style={AR}>{letter.ar}</motion.p>
                <p className="font-display text-3xl font-extrabold">{letter.name}</p>
                <p className="mt-1 text-sm text-slate-600">se prononce <b className="text-bleu">« {letter.sound} »</b></p>
                <button onClick={() => speak(letter.ar, 0.5)} className="mt-3 flex items-center gap-2 rounded-full bg-bleu/10 px-4 py-2 text-sm font-bold text-bleu">
                  <Volume2 className="h-4 w-4" /> Écouter
                </button>
                <div className="mt-5 w-full">
                  <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Dans un mot, elle change un peu de forme</p>
                  <div dir="rtl" className="flex justify-center gap-2">
                    {letterForms(letter.ar).map((f) => (
                      <div key={f.label} className="flex flex-col items-center rounded-xl bg-creme px-3 py-1.5">
                        <span className="text-3xl leading-[1.7]" style={AR}>{f.f}</span>
                        <span className="text-[10px] text-slate-500">{f.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <button onClick={start} className="mt-4 rounded-2xl bg-bleu py-4 font-display text-base font-bold text-white shadow-md">Je m'entraîne →</button>
        </div>
      </FullScreen>
    );
  }

  // ── Questions
  const ar2fr = q.mode === "ar2fr";
  return (
    <FullScreen title={title} onClose={onClose} right={<span className="text-xs font-bold text-slate-500">{step + 1}/{questions.length}</span>}>
      <div className="flex flex-1 flex-col px-5 pb-6">
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-vert transition-all" style={{ width: `${(step / questions.length) * 100}%` }} />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600">
          {ar2fr ? (stage === "syllabes" ? "Comment se lit cette syllabe ?" : "Quelle est cette lettre ?") : (stage === "syllabes" ? `Où est « ${q.item.fr} » ?` : `Où est la lettre ${q.item.fr.split(" · ")[0]} ?`)}
        </p>
        <div className="mt-3 flex min-h-[150px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          {ar2fr
            ? <p dir="rtl" className="text-7xl leading-[1.6]" style={AR}>{q.item.ar}</p>
            : <div className="text-center"><p className="font-display text-3xl font-extrabold">{q.item.fr.split(" · ")[0]}</p>{stage !== "syllabes" && <p className="text-sm text-slate-500">« {q.item.fr.split(" · ")[1]} »</p>}</div>}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {options.map((o) => {
            const right = o.id === q.item.id, isPicked = picked === o.id;
            const cls = !picked ? "border-slate-200 bg-white" : right ? "border-vert bg-vert/10 text-vert" : isPicked ? "border-rouge bg-rouge/10 text-rouge" : "border-slate-200 bg-white opacity-50";
            return (
              <button key={o.id} onClick={() => answer(o)} className={`min-h-[70px] rounded-2xl border-2 p-2 font-bold ${cls}`}>
                {ar2fr ? <span className="text-sm">{o.fr}</span> : <span dir="rtl" className="text-4xl" style={AR}>{o.ar}</span>}
              </button>
            );
          })}
        </div>
        {picked && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`mt-auto rounded-2xl p-4 ${picked === q.item.id ? "bg-vert/10" : "bg-rouge/10"}`}>
            <p className={`font-display font-extrabold ${picked === q.item.id ? "text-vert" : "text-rouge"}`}>{picked === q.item.id ? "✓ Bravo !" : "Pas tout à fait…"}</p>
            <p className="text-sm text-slate-600"><span dir="rtl" style={AR} className="text-2xl">{q.item.ar}</span> = <b>{q.item.fr}</b></p>
            <button onClick={next} className={`mt-3 w-full rounded-xl py-3 font-bold text-white ${picked === q.item.id ? "bg-vert" : "bg-rouge"}`}>Continuer</button>
          </motion.div>
        )}
      </div>
    </FullScreen>
  );
}
