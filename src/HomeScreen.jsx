import { useMemo } from "react";
import { motion } from "framer-motion";
import { Settings, Activity, Flame, Sparkles, ChevronRight, Trophy } from "lucide-react";
import { useProgress, ACTIVITIES } from "./lib/progress";

const COACH = [
  { min: 0,  text: "Un petit pas aujourd'hui vaut mieux qu'un grand demain. 🌱" },
  { min: 1,  text: "Belle régularité, continue comme ça ! 💪" },
  { min: 3,  text: "Tu construis une vraie habitude. Mā shā' Allāh ! ✨" },
  { min: 7,  text: "Une semaine sans interruption ! « Les œuvres les plus aimées d'Allah sont les plus régulières, même si elles sont peu nombreuses. » 🌟" },
  { min: 30, text: "Un mois entier : c'est devenu un pilier de ta vie. Continue ! 🏆" },
];

function greeting(now) {
  const h = now.getHours();
  if (h < 5) return "Bonne nuit";
  if (h < 12) return "Ṣabāḥ al-khayr";
  if (h < 18) return "Assalāmu ʿalaykum";
  return "Masāʾ al-khayr";
}

function hijriDate(now) {
  try {
    return new Intl.DateTimeFormat("fr-FR-u-ca-islamic-umalqura", { day: "numeric", month: "long", year: "numeric" }).format(now);
  } catch { return ""; }
}

function Module({ gradient, icon, title, sub, onClick, wide }) {
  return (
    <motion.button whileTap={{ scale: 0.97 }} onClick={onClick}
      className={`flex flex-col items-start gap-1.5 rounded-2xl p-4 text-left text-white shadow-md ${wide ? "col-span-2" : ""}`}
      style={{ background: gradient }}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-lg" aria-hidden="true">{icon}</span>
      <span className="font-display text-sm font-extrabold leading-tight">{title}</span>
      <span className="text-[11px] leading-snug text-white/90">{sub}</span>
    </motion.button>
  );
}

export default function HomeScreen({ onNavigate, onOpenSettings, onOpenStats, adhkar, todayReading, words, bookmarksCount }) {
  const { done, goal, goalReached, today, streak, week, xp, level } = useProgress();
  const now = new Date();
  const coach = useMemo(() => [...COACH].reverse().find((c) => streak >= c.min)?.text, [streak]);
  const pct = Math.min(100, Math.round((done / goal) * 100));
  const evening = now.getHours() >= 14;
  const adhkarSlot = evening ? adhkar.soir : adhkar.matin;
  const breakdown = Object.entries(ACTIVITIES).filter(([k]) => today[k] > 0);
  const maxWeek = Math.max(1, ...week.map((d) => d.total));
  const dayLetters = ["D", "L", "M", "M", "J", "V", "S"];

  return (
    <div className="min-h-full bg-[#FAFAFA] pb-6">
      {/* En-tête (maquette A : blanc, épuré) */}
      <header className="bg-white px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-encre">{greeting(now)} 👋</h1>
            <p className="mt-1 text-sm text-slate-500">
              {now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
              {hijriDate(now) && <span className="text-slate-400"> · {hijriDate(now)}</span>}
            </p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={onOpenStats} aria-label="Statistiques" className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:text-bleu">
              <Activity className="h-4 w-4" />
            </button>
            <button onClick={onOpenSettings} aria-label="Réglages" className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-500 hover:text-bleu">
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="space-y-3 px-4 pt-4">
        {/* Message du coach */}
        <div className="rounded-2xl p-4" style={{ background: "linear-gradient(90deg, rgba(255,209,0,.28), rgba(245,130,32,.18), rgba(227,6,19,.08))" }}>
          <p className="text-sm font-semibold leading-relaxed text-slate-700">{coach}</p>
        </div>

        {/* Objectif du jour — chiffres réels */}
        <section className="rounded-2xl border-l-4 border-rouge bg-white p-4 shadow-sm" aria-label="Objectif du jour">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Objectif du jour</p>
              <p className="mt-0.5 font-display text-3xl font-extrabold text-rouge">
                {done} <span className="text-lg text-slate-300">/ {goal}</span>
              </p>
            </div>
            {goalReached
              ? <span className="rounded-full bg-vert/10 px-3 py-1 text-xs font-bold text-vert">🎉 Atteint !</span>
              : <span className="text-xs font-semibold text-slate-400">encore {goal - done}</span>}
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={goal}>
            <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${pct}%` }}
              style={{ background: goalReached ? "#00A19A" : "linear-gradient(90deg,#E30613,#F58220,#FFD100)" }} />
          </div>
          {breakdown.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {breakdown.map(([k, a]) => (
                <span key={k} className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200">
                  {a.icon} {today[k]} {a.label.toLowerCase()}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-slate-400">Révise des mots, récite un verset ou complète tes adhkar : chaque action compte.</p>
          )}
        </section>

        {/* Série + niveau */}
        <div className="grid grid-cols-2 gap-3">
          <section className="rounded-2xl border-t-[3px] border-orange bg-white p-4 shadow-sm" aria-label="Série">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange" aria-hidden="true" />
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Série</p>
            </div>
            <p className="mt-1 font-display text-2xl font-extrabold text-orange">{streak} <span className="text-sm">{streak > 1 ? "jours" : "jour"}</span></p>
            <div className="mt-2 flex h-8 items-end gap-1" aria-hidden="true">
              {week.map((d) => {
                const [y, m, dd] = d.key.split("-").map(Number);
                return (
                  <div key={d.key} className="flex flex-1 flex-col items-center gap-0.5">
                    <div className="w-full rounded-sm" style={{ height: `${Math.max(3, (d.total / maxWeek) * 22)}px`, background: d.total ? "#F58220" : "#E2E8F0" }} />
                    <span className="text-[8px] font-bold text-slate-400">{dayLetters[new Date(y, m - 1, dd).getDay()]}</span>
                  </div>
                );
              })}
            </div>
          </section>
          <section className="rounded-2xl border-t-[3px] border-jaune bg-white p-4 shadow-sm" aria-label="Niveau">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" aria-hidden="true" />
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Niveau {level.level}</p>
            </div>
            <p className="mt-1 font-display text-2xl font-extrabold text-amber-600">{xp} <span className="text-sm">XP</span></p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-jaune" style={{ width: `${Math.round((level.into / level.span) * 100)}%` }} />
            </div>
            <p className="mt-1.5 text-[10px] text-slate-400">{level.span - level.into} XP avant le niveau {level.level + 1}</p>
          </section>
        </div>

        {/* Session éclair */}
        <motion.button whileTap={{ scale: 0.98 }} onClick={() => onNavigate("learn", { tab: words.due > 0 ? "revision" : "quiz" })}
          className="flex w-full items-center gap-3 rounded-2xl px-5 py-4 text-left text-white shadow-lg"
          style={{ background: "linear-gradient(90deg,#E30613,#F58220,#F5A800)", boxShadow: "0 6px 20px rgba(227,6,19,.22)" }}>
          <Sparkles className="h-6 w-6 shrink-0" aria-hidden="true" />
          <span className="flex-1">
            <span className="block font-display text-base font-bold">Session éclair — 5 min</span>
            <span className="block text-[11px] font-medium text-white/90">
              {words.due > 0 ? `${words.due} mots à réviser maintenant` : "Un quiz rapide pour garder le rythme"}
            </span>
          </span>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </motion.button>

        {/* Lecture du jour (programme Khatm) */}
        <button onClick={() => onNavigate("program")} className="flex w-full items-center gap-3 rounded-2xl border-l-4 border-bleu bg-white p-4 text-left shadow-sm">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bleu/10 text-lg" aria-hidden="true">📅</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Lecture du jour</span>
            {todayReading ? (
              <>
                <span className="block truncate font-display text-sm font-bold text-encre">{todayReading.label}</span>
                <span className="block text-[11px] text-slate-500">Jour {todayReading.day} · {todayReading.verseCount} versets {todayReading.done && "· ✅ fait"}</span>
              </>
            ) : (
              <>
                <span className="block font-display text-sm font-bold text-encre">Démarre un programme de Khatm</span>
                <span className="block text-[11px] text-slate-500">30 jours, 60 jours, 1 an… le planning se fait tout seul</span>
              </>
            )}
          </span>
          <ChevronRight className="h-5 w-5 text-slate-300" aria-hidden="true" />
        </button>

        {/* Modules (maquette B : blocs colorés) */}
        <div className="grid grid-cols-2 gap-3">
          <Module gradient="linear-gradient(135deg,#0F4C9B,#1E64C9)" icon="📖" title="Les 500 mots"
            sub={`${words.learned}/500 appris · ${words.due} à revoir`} onClick={() => onNavigate("learn", { tab: "revision" })} />
          <Module gradient="linear-gradient(135deg,#00A19A,#00B8AF)" icon="📿" title={evening ? "Adhkar du soir" : "Adhkar du matin"}
            sub={`${adhkarSlot.done}/${adhkarSlot.total} récités aujourd'hui`} onClick={() => onNavigate("adhkar", { tab: evening ? "soir" : "matin" })} />
          <Module wide gradient="linear-gradient(135deg,#C70511,#E8322F)" icon="🎙️" title="Réciter avec le coach"
            sub="Le professeur écoute ta récitation et te corrige mot par mot" onClick={() => onNavigate("learn", { tab: "prof" })} />
          <Module gradient="linear-gradient(135deg,#D96A0B,#F58220)" icon="🔖" title="Mes repères"
            sub={bookmarksCount ? `${bookmarksCount} verset${bookmarksCount > 1 ? "s" : ""} enregistré${bookmarksCount > 1 ? "s" : ""}` : "Tes versets favoris"} onClick={() => onNavigate("bookmarks")} />
          <Module gradient="linear-gradient(135deg,#0B3A78,#00A19A)" icon="🕌" title="Lire le Coran"
            sub="114 sourates · tajwid en couleur" onClick={() => onNavigate("quran")} />
        </div>
      </div>
    </div>
  );
}
