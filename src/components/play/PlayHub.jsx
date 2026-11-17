import { useState } from "react";
import { motion } from "framer-motion";
import { Flame } from "./shared";
import Onboarding from "./Onboarding";
import WordOfDay from "./WordOfDay";
import Survie from "./Survie";
import FallingLetters from "./FallingLetters";
import TraceLetter from "./TraceLetter";
import LinkLetters from "./LinkLetters";
import { getPlay, savePlay, flameFor, canRestore, dailyWord, dailyNumber, GOALS, projection } from "../../lib/play";
import { useProgress, localDayKey, shiftDayKey, restoreDay } from "../../lib/progress";
import { pathStats } from "../../lib/path";

const GAMES = [
  { key: "survie", icon: "💀", title: "Survie", sub: "Traduis avant la fin du chrono · 3 vies", color: "#E30613", best: "survie" },
  { key: "ninja",  icon: "🍉", title: "Lettres qui tombent", sub: "Touche les lettres pour former le mot", color: "#F58220", best: "ninja" },
  { key: "trace",  icon: "✍️", title: "Tracer", sub: "Dessine chaque lettre au doigt", color: "#0F4C9B" },
  { key: "link",   icon: "🧵", title: "Relier", sub: "Lettre ↔ nom, lettre ↔ forme", color: "#00A19A" },
];

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
            <p className="mt-1 text-xs text-white/80">{p.minutes} min / jour · objectif ~{target} mots en 6 mois · {words} déjà appris</p>
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

      {/* Mot du jour */}
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

      {/* Jeux */}
      <section>
        <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">Jeux</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {GAMES.map((g) => (
            <motion.button key={g.key} whileTap={{ scale: 0.97 }} onClick={() => setOpen(g.key)}
              className="flex flex-col items-start gap-1.5 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: `${g.color}14` }}>{g.icon}</span>
              <span className="text-[13px] font-bold leading-tight text-encre">{g.title}</span>
              <span className="text-[10px] leading-snug text-slate-400">{g.sub}</span>
              {g.best && <span className="text-[10px] font-bold" style={{ color: g.color }}>🏆 Record : {play.best[g.best] || 0}</span>}
              {g.key === "trace" && <span className="text-[10px] font-bold text-bleu">{Object.keys(play.traced || {}).length}/28 lettres</span>}
            </motion.button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
        <p className="font-bold text-encre">La méthode</p>
        <p className="mt-1">Un mot par jour pour ne jamais casser ta série, des jeux courts pour ancrer les lettres et les mots, et ton parcours de 100 leçons pour avancer. Chaque partie compte dans ton objectif du jour.</p>
        <button onClick={() => setEditing(true)} className="mt-2 font-bold text-bleu">Modifier mon profil ({p.minutes} min / jour)</button>
      </section>

      {open === "daily"  && <WordOfDay onClose={() => { setOpen(null); refresh(); }} onSolved={refresh} />}
      {open === "survie" && <Survie onClose={() => { setOpen(null); refresh(); }} />}
      {open === "ninja"  && <FallingLetters onClose={() => { setOpen(null); refresh(); }} />}
      {open === "trace"  && <TraceLetter onClose={() => { setOpen(null); refresh(); }} />}
      {open === "link"   && <LinkLetters onClose={() => { setOpen(null); refresh(); }} />}
    </div>
  );
}
