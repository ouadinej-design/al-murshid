import { useState } from "react";
import { motion } from "framer-motion";
import { Flame } from "./shared";
import Onboarding from "./Onboarding";
import WordOfDay from "./WordOfDay";
import Survie from "./Survie";
import FallingLetters from "./FallingLetters";
import TraceLetter from "./TraceLetter";
import LinkLetters from "./LinkLetters";
import LetterOfDay from "./LetterOfDay";
import { getPlay, savePlay, flameFor, canRestore, dailyWord, dailyNumber, GOALS, projection, STAGES, currentStage, knownLetters, nextLetter, LETTERS_FOR_SYLLABES, SYLLABES_FOR_MOTS } from "../../lib/play";
import { useProgress, localDayKey, shiftDayKey, restoreDay } from "../../lib/progress";
import { pathStats } from "../../lib/path";

const GAMES = [
  { key: "survie", icon: "💀", title: "Survie", color: "#E30613", best: "survie",
    sub: { lettres: "Reconnais la lettre avant la fin du chrono", syllabes: "Lis la syllabe avant la fin du chrono", mots: "Traduis avant la fin du chrono · 3 vies" } },
  { key: "ninja",  icon: "🍉", title: "Lettres qui tombent", color: "#F58220", best: "ninja",
    sub: { lettres: "Attrape la bonne lettre", syllabes: "Attrape la bonne syllabe", mots: "Touche les lettres pour former le mot" } },
  { key: "trace",  icon: "✍️", title: "Tracer", color: "#0F4C9B", sub: { lettres: "Dessine ta lettre du moment au doigt", syllabes: "Dessine chaque lettre au doigt", mots: "Dessine chaque lettre au doigt" } },
  { key: "link",   icon: "🧵", title: "Relier", color: "#00A19A", sub: { lettres: "Relie tes lettres à leur nom", syllabes: "Lettre ↔ nom, lettre ↔ forme", mots: "Lettre ↔ nom, lettre ↔ forme" } },
];
// Ordre conseillé pour un débutant : découvrir (lettre du jour) → tracer → relier → jouer
const ORDER = { lettres: ["trace", "link", "survie", "ninja"], syllabes: ["survie", "ninja", "link", "trace"], mots: ["survie", "ninja", "trace", "link"] };

/**
 * Tuile « Jouer & apprendre » : la méthode « jeu » (accueil personnalisé, Mot du jour,
 * flamme de série, Survie, Lettres qui tombent, Tracer, Relier).
 */
export default function PlayHub() {
  const [play, setPlay] = useState(getPlay);
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(false);
  const { streak, days } = useProgress();
  const refresh = () => setPlay(getPlay());

  if (!play.profile || editing) {
    return <Onboarding onDone={() => { setEditing(false); refresh(); }} />;
  }

  const p = play.profile;
  const today = localDayKey();
  const todayWord = dailyWord(today);
  const todayState = play.daily[today];
  const flame = flameFor(streak);
  const restorable = canRestore(days, play.restoreMonth);
  const goal = GOALS.find((g) => g.key === p.goal);
  const words = pathStats().words;
  const target = projection(p.minutes, 0).points[3].words;
  const stage = currentStage(play);
  const known = knownLetters(play).length;
  const stageIdx = STAGES.findIndex((s) => s.key === stage);
  const stageProgress = stage === "lettres" ? Math.min(1, known / LETTERS_FOR_SYLLABES)
    : stage === "syllabes" ? Math.min(1, (play.syll || 0) / SYLLABES_FOR_MOTS) : 1;
  const setStage = (key) => setPlay(savePlay({ profile: { ...p, stage: key } }));
  const basic = stage !== "mots";
  const letterState = todayState?.letter;
  const games = ORDER[stage].map((k) => GAMES.find((g) => g.key === k));

  const restore = () => {
    restoreDay(shiftDayKey(today, -1));
    setPlay(savePlay({ restoreMonth: today.slice(0, 7) }));
  };

  return (
    <div className="space-y-4">
      {/* En-tête : prénom + flamme */}
      <section className="overflow-hidden rounded-3xl text-white shadow-lg" style={{ background: "linear-gradient(135deg,#1A1A1A,#0F4C9B 70%,#7C3AED)" }}>
        <div className="flex items-center gap-3 p-5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/70">{goal ? `${goal.icon} ${goal.label}` : "Jouer & apprendre"}</p>
            <p className="mt-0.5 truncate font-display text-2xl font-extrabold">Salam {p.name} !</p>
            <p className="mt-1 text-xs text-white/80">{p.minutes} min / jour · {basic ? `on commence par l'alphabet : ${known}/28 lettres` : `objectif ~${target} mots en 6 mois · ${words} déjà appris`}</p>
          </div>
          <div className="flex flex-col items-center">
            <Flame streak={streak} size={52} />
            <p className="font-display text-lg font-extrabold leading-none">{streak}</p>
            <p className="text-[9px] font-bold uppercase text-white/70">jour{streak > 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="flex items-center justify-between bg-white/10 px-5 py-2.5 text-xs">
          <span className="font-bold">{flame.name}</span>
          <span className="text-white/80">{flame.next ? `${flame.next.name} à ${flame.next.min} jour${flame.next.min > 1 ? "s" : ""}` : "Flamme ultime atteinte 👑"}</span>
        </div>
        {restorable && (
          <button onClick={restore} className="flex w-full items-center justify-between bg-jaune px-5 py-3 text-left text-encre">
            <span className="text-sm font-extrabold">🔥 Ta série s'est arrêtée hier. Raviver ta flamme ?</span>
            <span className="rounded-full bg-encre px-2.5 py-0.5 text-[10px] font-extrabold text-white">1×/mois</span>
          </button>
        )}
      </section>

      {/* Mon niveau : Lettres → Syllabes → Mots */}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Mon niveau</p>
          <p className="text-[10px] text-slate-400">Touche une étape pour la choisir</p>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {STAGES.map((s, i) => (
            <button key={s.key} onClick={() => setStage(s.key)}
              className={`rounded-2xl border-2 px-2 py-2 text-center ${s.key === stage ? "border-bleu bg-bleu/10" : i < stageIdx ? "border-vert/40 bg-vert/5" : "border-slate-200 bg-white opacity-70"}`}>
              <span className="block text-xl leading-[1.5]" style={{ fontFamily: "'Amiri Quran',serif" }}>{i < stageIdx ? "✓" : s.icon}</span>
              <span className={`block text-xs font-extrabold ${s.key === stage ? "text-bleu" : "text-slate-600"}`}>{i + 1}. {s.label}</span>
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-xs text-slate-600">{STAGES[stageIdx].desc}</p>
        {stage !== "mots" && (
          <>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-bleu transition-all" style={{ width: `${stageProgress * 100}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {stage === "lettres"
                ? `${known}/28 lettres connues · étape suivante à ${LETTERS_FOR_SYLLABES}`
                : `${play.syll || 0}/${SYLLABES_FOR_MOTS} syllabes lues · ensuite : les mots`}
            </p>
          </>
        )}
        {p.stage && <button onClick={() => setPlay(savePlay({ profile: { ...p, stage: undefined } }))} className="mt-1.5 text-[11px] font-bold text-bleu">↺ Laisser l'app choisir selon mes progrès</button>}
      </section>

      {/* Lettre du jour (débutant) ou Mot du jour */}
      {basic ? (
      <motion.button whileTap={{ scale: 0.98 }} onClick={() => setOpen("letter")}
        className="flex w-full items-center gap-4 rounded-3xl border-2 border-jaune bg-gradient-to-br from-jaune/25 to-orange/10 p-4 text-left shadow-sm">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-4xl shadow-sm" style={{ fontFamily: "'Amiri Quran',serif" }}>
          {letterState || nextLetter(play)?.ar || "✓"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-amber-700">☀️ {stage === "syllabes" ? "Syllabes du jour" : "Lettre du jour"}</span>
          <span className="block font-display text-lg font-extrabold text-encre">{todayState?.solved ? "Faite aujourd'hui ✓" : "Découvre-la en 2 minutes"}</span>
          <span className="block text-xs text-slate-500">{todayState?.solved ? "Tu peux la refaire ou jouer ⬇︎" : stage === "syllabes" ? "La lettre avec a, i, u" : "Son nom, son son, ses formes, puis 6 questions"}</span>
        </span>
        {!todayState?.solved && <span className="rounded-full bg-encre px-3 py-1.5 text-xs font-extrabold text-white">GO</span>}
      </motion.button>
      ) : (
      <motion.button whileTap={{ scale: 0.98 }} onClick={() => setOpen("daily")}
        className="flex w-full items-center gap-4 rounded-3xl border-2 border-jaune bg-gradient-to-br from-jaune/25 to-orange/10 p-4 text-left shadow-sm">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
          {todayState?.solved ? <span style={{ fontFamily: "'Amiri Quran',serif" }} className="text-2xl">{todayWord.ar}</span> : "?"}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-extrabold uppercase tracking-wider text-amber-700">☀️ Mot du jour n° {dailyNumber(today)}</span>
          <span className="block font-display text-lg font-extrabold text-encre">
            {todayState?.solved ? `Trouvé : ${todayWord.fr}` : todayState?.guesses?.length ? `En cours · ${todayState.guesses.length} essai${todayState.guesses.length > 1 ? "s" : ""}` : "Mot disponible !"}
          </span>
          <span className="block text-xs text-slate-500">{todayState?.solved ? "Nouveau mot demain à minuit" : "Devine le mot du Coran lettre par lettre"}</span>
        </span>
        {!todayState?.solved && <span className="rounded-full bg-encre px-3 py-1.5 text-xs font-extrabold text-white">JOUER</span>}
      </motion.button>
      )}

      {/* Jeux */}
      <section>
        <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">Jeux {basic && "· dans l'ordre conseillé"}</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {games.map((g, i) => (
            <motion.button key={g.key} whileTap={{ scale: 0.97 }} onClick={() => setOpen(g.key)}
              className="flex flex-col items-start gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm">
              <span className="flex w-full items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: `${g.color}14` }}>{g.icon}</span>
                {basic && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-500">{i + 1}</span>}
              </span>
              <span className="text-[13px] font-bold leading-tight text-encre">{g.title}</span>
              <span className="text-[10px] leading-snug text-slate-400">{g.sub[stage]}</span>
              {g.best && <span className="text-[10px] font-bold" style={{ color: g.color }}>🏆 Record : {play.best[g.best] || 0}</span>}
              {g.key === "trace" && <span className="text-[10px] font-bold text-bleu">{Object.keys(play.traced || {}).length}/28 lettres</span>}
            </motion.button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
        <p className="font-bold text-encre">La méthode</p>
        <p className="mt-1">Tu avances à ton rythme : d'abord les <b>lettres</b> (4 pour commencer, une nouvelle à chaque lettre connue), puis les <b>syllabes</b> (ba, bi, bu), puis les <b>mots</b> du Coran. Une lettre est « connue » quand tu l'as reconnue 3 fois. Chaque partie compte dans ton objectif du jour.</p>
        <button onClick={() => setEditing(true)} className="mt-2 font-bold text-bleu">Modifier mon profil ({p.minutes} min / jour)</button>
      </section>

      {open === "daily"  && <WordOfDay onClose={() => { setOpen(null); refresh(); }} onSolved={refresh} />}
      {open === "letter" && <LetterOfDay stage={stage} onClose={() => { setOpen(null); refresh(); }} onDone={refresh} />}
      {open === "survie" && <Survie stage={stage} onClose={() => { setOpen(null); refresh(); }} />}
      {open === "ninja"  && <FallingLetters stage={stage} onClose={() => { setOpen(null); refresh(); }} />}
      {open === "trace"  && <TraceLetter stage={stage} onClose={() => { setOpen(null); refresh(); }} />}
      {open === "link"   && <LinkLetters stage={stage} onClose={() => { setOpen(null); refresh(); }} />}
    </div>
  );
}
