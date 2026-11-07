import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, Check } from "lucide-react";
import { UNITS, RANKED, makeOptions, completeUnit } from "../lib/path";
import { logActivity } from "../lib/progress";

function speak(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA"; u.rate = 0.7;
    const v = window.speechSynthesis.getVoices().find((x) => x.lang?.startsWith("ar"));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch { /* synthèse vocale indisponible */ }
}
function vibrate(p) { try { navigator.vibrate?.(p); } catch { /* */ } }

const AR = { fontFamily: "'Amiri Quran','Scheherazade New',serif" };

/**
 * Une leçon du parcours (5 mots) en 3 étapes, inspirée des applis de vocabulaire coranique :
 * 1. Découvrir (cartes)  2. Reconnaître (arabe → sens)  3. Retrouver (sens → arabe).
 * Les erreurs reviennent à la fin de l'étape.
 */
export default function PathLesson({ unit, onClose, onDone }) {
  const words = UNITS[unit];
  const pool = useMemo(() => [...words, ...RANKED.slice(Math.max(0, unit * 5 - 40), unit * 5 + 45)], [unit, words]);

  // mots de la leçon précédente (repris en entier dans le test) + quelques mots plus anciens
  const prevWords = useMemo(() => (unit > 0 ? UNITS[unit - 1].map((w) => ({ ...w, from: unit })) : []), [unit]);
  const olderWords = useMemo(() => (unit > 1
    ? UNITS.slice(0, unit - 1).flatMap((u, k) => u.map((w) => ({ ...w, from: k + 1 }))).sort(() => Math.random() - 0.5).slice(0, 5)
    : []), [unit]);
  const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);

  // file des exercices
  const initialQueue = useMemo(() => [
    ...words.map((w) => ({ kind: "learn", w })),
    // test : les 5 nouveaux mots + les 5 de la leçon d'avant, mélangés, dans les deux sens
    ...shuffle([...words, ...prevWords]).map((w) => ({ kind: "ar2fr", w })),
    ...shuffle([...words, ...prevWords]).map((w) => ({ kind: "fr2ar", w })),
    // rappel rapide de mots plus anciens
    ...olderWords.map((w) => ({ kind: "ar2fr", w, old: true })),
  ], [words, prevWords, olderWords]); // eslint-disable-line react-hooks/exhaustive-deps
  const [queue, setQueue] = useState(initialQueue);
  const [pos, setPos] = useState(0);
  const [picked, setPicked] = useState(null);
  const [stats, setStats] = useState({ ok: 0, total: 0 });
  const [result, setResult] = useState(null);

  const item = queue[pos];
  const options = useMemo(() => (item && item.kind !== "learn" ? makeOptions(item.w, item.kind === "ar2fr" ? "fr" : "ar", pool) : []), [item, pool]);
  const progress = Math.round((pos / queue.length) * 100);
  const stepLabel = !item ? "" : item.kind === "learn" ? "1 · Découvrir" : item.old ? "4 · Rappel des anciens mots" : item.kind === "ar2fr" ? "2 · Reconnaître" : "3 · Retrouver";
  const origin = item?.w.from ? `Révision · leçon ${item.w.from}` : item && item.kind !== "learn" ? "Nouveau mot" : "";

  const next = () => {
    setPicked(null);
    if (pos + 1 >= queue.length) {
      const acc = stats.total ? stats.ok / stats.total : 1;
      const { stars } = completeUnit(unit, acc);
      logActivity("lessons");
      logActivity("words", words.length);
      setResult({ stars, acc });
      return;
    }
    setPos(pos + 1);
  };

  const answer = (opt) => {
    if (picked) return;
    const ok = opt.id === item.w.id;
    setPicked(opt.id);
    setStats((s) => ({ ok: s.ok + (ok ? 1 : 0), total: s.total + 1 }));
    vibrate(ok ? 15 : [40, 60, 40]);
    if (item.kind === "ar2fr" || ok) speak(item.w.ar);
    if (!ok) {
      // l'erreur revient à la fin de la leçon
      setQueue((q) => [...q, { ...item, retry: true }]);
    }
  };

  const content = result ? (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-5xl">{"⭐".repeat(result.stars)}{"☆".repeat(3 - result.stars)}</motion.p>
      <h2 className="mt-4 font-display text-2xl font-extrabold">Leçon {unit + 1} terminée !</h2>
      <p className="mt-1 text-sm text-slate-500">{Math.round(result.acc * 100)} % de bonnes réponses · +{10 + words.length * 2} XP</p>
      {prevWords.length > 0 && <p className="mt-1 text-xs text-slate-400">5 nouveaux mots + {prevWords.length + olderWords.length} mots révisés des leçons précédentes</p>}
      <div className="mt-5 w-full max-w-xs space-y-1.5">
        {words.map((w) => (
          <div key={w.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 border border-slate-200">
            <span className="text-sm font-semibold">{w.fr}</span>
            <span dir="rtl" lang="ar" className="text-xl" style={AR}>{w.ar}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-slate-500">Ces 5 mots sont ajoutés à ta révision : ils reviendront demain pour être bien ancrés.</p>
      <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
        {unit + 1 < UNITS.length && (
          <button onClick={() => onDone(unit + 1)} className="rounded-2xl bg-vert py-3.5 font-display font-bold text-white shadow-md">Leçon suivante →</button>
        )}
        <button onClick={onClose} className="rounded-2xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-600">Retour au parcours</button>
      </div>
    </div>
  ) : (
    <div className="flex flex-1 flex-col px-5 pb-6">
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase tracking-wider text-vert">{stepLabel}{item.retry ? " · on retente" : ""}</p>
        {origin && <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.w.from ? "bg-bleu/10 text-bleu" : "bg-jaune/30 text-amber-800"}`}>{origin}</span>}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={pos} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.18 }}
          className="flex flex-1 flex-col">
          {item.kind === "learn" && (
            <>
              <p className="mt-1 text-sm text-slate-500">Nouveau mot {words.indexOf(item.w) + 1}/{words.length}{prevWords.length ? " · le test reprendra aussi les mots de la leçon " + unit : ""}</p>
              <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-3xl border-2 border-bleu/20 bg-white p-6 text-center shadow-sm">
                <p dir="rtl" lang="ar" className="text-6xl leading-[1.6] text-encre" style={AR}>{item.w.ar}</p>
                <p className="mt-2 text-lg font-semibold text-bleu">{item.w.tr}</p>
                <p className="mt-3 font-display text-2xl font-extrabold text-encre">{item.w.fr}</p>
                <p className="mt-3 text-xs text-slate-400">≈ {(item.w.freq || 0).toLocaleString("fr-FR")} fois dans le Coran</p>
                <button onClick={() => speak(item.w.ar)} className="mt-4 flex items-center gap-2 rounded-full bg-bleu/10 px-4 py-2 text-sm font-bold text-bleu">
                  <Volume2 className="h-4 w-4" /> Écouter
                </button>
              </div>
              <button onClick={next} className="mt-4 rounded-2xl bg-bleu py-4 font-display text-base font-bold text-white shadow-md">
                {words.indexOf(item.w) + 1 < words.length ? "Mot suivant →" : "Je m'entraîne →"}
              </button>
            </>
          )}

          {item.kind !== "learn" && (
            <>
              <p className="mt-1 text-sm font-semibold text-slate-600">{item.kind === "ar2fr" ? "Que signifie ce mot ?" : "Quel est ce mot en arabe ?"}</p>
              <div className="mt-4 flex min-h-[150px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                {item.kind === "ar2fr"
                  ? <p dir="rtl" lang="ar" className="text-5xl leading-[1.7]" style={AR}>{item.w.ar}</p>
                  : <p className="font-display text-2xl font-extrabold">{item.w.fr}</p>}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {options.map((o) => {
                  const isRight = o.id === item.w.id, isPicked = picked === o.id;
                  const cls = !picked ? "border-slate-200 bg-white"
                    : isRight ? "border-vert bg-vert/10 text-vert"
                    : isPicked ? "border-rouge bg-rouge/10 text-rouge" : "border-slate-200 bg-white opacity-50";
                  return (
                    <button key={o.id} onClick={() => answer(o)} className={`min-h-[64px] rounded-2xl border-2 p-3 font-bold transition-all ${cls}`}>
                      {item.kind === "ar2fr" ? <span className="text-sm">{o.fr}</span> : <span dir="rtl" lang="ar" className="text-2xl" style={AR}>{o.ar}</span>}
                    </button>
                  );
                })}
              </div>
              {picked && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`mt-auto rounded-2xl p-4 ${picked === item.w.id ? "bg-vert/10" : "bg-rouge/10"}`}>
                  <p className={`font-display font-extrabold ${picked === item.w.id ? "text-vert" : "text-rouge"}`}>
                    {picked === item.w.id ? "✓ Bravo !" : "Pas tout à fait…"}
                  </p>
                  <p className="text-sm text-slate-600"><span dir="rtl" lang="ar" style={AR} className="text-lg">{item.w.ar}</span> ({item.w.tr}) = <b>{item.w.fr}</b></p>
                  <button onClick={next} className={`mt-3 w-full rounded-xl py-3 font-bold text-white ${picked === item.w.id ? "bg-vert" : "bg-rouge"}`}>Continuer</button>
                </motion.div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[110] flex flex-col bg-creme text-encre" role="dialog" aria-modal="true" aria-label={`Leçon ${unit + 1}`}>
      <header className="flex items-center gap-3 px-4 pt-4">
        <button onClick={onClose} aria-label="Fermer la leçon" className="rounded-full border border-slate-200 bg-white p-2"><X className="h-5 w-5" /></button>
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
          <motion.div className="h-full rounded-full bg-vert" animate={{ width: `${result ? 100 : progress}%` }} />
        </div>
        <span className="text-xs font-bold text-slate-500">{result ? <Check className="h-4 w-4 text-vert" /> : `${stats.ok}✓`}</span>
      </header>
      {content}
    </div>,
    document.body
  );
}
