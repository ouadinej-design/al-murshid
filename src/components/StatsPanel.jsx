import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Flame, Trophy, Target, Zap, ChevronRight } from "lucide-react";
import { useProgress, activityReport, bestStreak, ACTIVITIES } from "../lib/progress";

const PERIODS = [{ n: 7, label: "7 jours" }, { n: 30, label: "30 jours" }];
const COLORS = { words: "#0F4C9B", quiz: "#7C3AED", adhkar: "#00A19A", recite: "#E30613", lessons: "#F58220", reading: "#B45309" };
const DOW = ["D", "L", "M", "M", "J", "V", "S"];

function Section({ title, action, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Bar({ value, max, color = "#00A19A" }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (value / Math.max(1, max)) * 100)}%`, background: color }} />
    </div>
  );
}

function Tile({ icon, label, value, sub, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" style={{ borderTop: `3px solid ${color}` }}>
      <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{icon}{label}</div>
      <p className="mt-1 font-display text-2xl font-extrabold" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
    </div>
  );
}

const Go = ({ onClick, children = "Ouvrir" }) => (
  <button onClick={onClick} className="flex items-center gap-0.5 rounded-lg px-2 py-1 text-[11px] font-bold text-bleu hover:bg-bleu/5">
    {children}<ChevronRight className="h-3.5 w-3.5" />
  </button>
);

export default function StatsPanel({ isOpen, onClose, onNavigate, onOpenSettings, counts, juzProgram, fridayKahf, resetChecked, adhkarTabs, words, lessonsDone }) {
  const { days, settings, streak, xp, level } = useProgress();
  const [period, setPeriod] = useState(7);
  const [focus, setFocus] = useState("all");
  const report = useMemo(() => activityReport(days, period, settings), [days, period, settings]);
  const best = useMemo(() => Math.max(bestStreak(days), streak), [days, streak]);
  const valueOf = (d) => (focus === "all" ? d.total : d.entry[focus] || 0);
  const maxDay = Math.max(1, ...report.days.map(valueOf));
  const pctQuran = Math.round((counts.surahChecked / 114) * 100);
  const go = (page, opts) => { onClose(); onNavigate(page, opts); };
  const totalFocus = focus === "all" ? report.total : report.totals[focus];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div key="stats" role="dialog" aria-modal="true" aria-label="Statistiques"
          initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 280 }}
          className="fixed inset-0 z-[100] flex flex-col bg-[#F7F7F5] text-encre">
          <header className="z-10 flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
            <h2 className="font-display text-xl font-extrabold">Statistiques</h2>
            <button onClick={onClose} aria-label="Fermer" className="rounded-full bg-slate-100 p-2"><X className="h-5 w-5" /></button>
          </header>
          <div className="h-1 shrink-0" style={{ background: "linear-gradient(90deg,#E30613,#F58220,#FFD100,#00A19A,#0F4C9B)" }} />

          <div className="flex-1 space-y-3 overflow-y-auto p-4 pb-10">
            {/* Vue d'ensemble */}
            <div className="grid grid-cols-2 gap-3">
              <Tile icon={<Flame className="h-3.5 w-3.5 text-orange" />} label="Série" value={`${streak} j`} sub={`Record : ${best} j`} color="#F58220" />
              <Tile icon={<Trophy className="h-3.5 w-3.5 text-amber-500" />} label={`Niveau ${level.level}`} value={`${xp} XP`} sub={`${level.span - level.into} XP avant le niveau ${level.level + 1}`} color="#D4A100" />
              <Tile icon={<Target className="h-3.5 w-3.5 text-rouge" />} label="Objectif atteint" value={`${report.goalDays}/${period}`} sub={`jours sur ${period}`} color="#E30613" />
              <Tile icon={<Zap className="h-3.5 w-3.5 text-vert" />} label="Jours actifs" value={`${report.activeDays}/${period}`} sub={`${report.total} actions · +${report.xp} XP`} color="#00A19A" />
            </div>

            {/* Rapport d'activité, filtrable */}
            <Section title="Rapport d'activité" action={
              <div className="flex rounded-lg bg-slate-100 p-0.5">
                {PERIODS.map((p) => (
                  <button key={p.n} onClick={() => setPeriod(p.n)}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${period === p.n ? "bg-white text-encre shadow-sm" : "text-slate-500"}`}>{p.label}</button>
                ))}
              </div>
            }>
              <div className="no-scrollbar -mx-1 mb-3 flex gap-1.5 overflow-x-auto px-1">
                {[["all", { label: "Tout", icon: "📊" }], ...Object.entries(ACTIVITIES)].map(([k, a]) => (
                  <button key={k} onClick={() => setFocus(k)}
                    className={`whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${focus === k ? "border-transparent text-white" : "border-slate-200 bg-white text-slate-500"}`}
                    style={focus === k ? { background: k === "all" ? "#1A1A1A" : COLORS[k] } : undefined}>
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>
              <p className="mb-2 text-sm text-slate-600"><span className="font-display text-2xl font-extrabold text-encre">{totalFocus}</span> {focus === "all" ? "actions" : ACTIVITIES[focus].label.toLowerCase()} sur {period} jours</p>
              <div className="flex h-32 items-end gap-[3px]" role="img" aria-label={`Activité par jour sur ${period} jours`}>
                {report.days.map((d) => {
                  const v = valueOf(d);
                  const [y, m, dd] = d.key.split("-").map(Number);
                  const date = new Date(y, m - 1, dd);
                  return (
                    <div key={d.key} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })} : ${v}`}>
                      {period === 7 && v > 0 && <span className="text-[9px] font-bold text-slate-500">{v}</span>}
                      <div className="w-full rounded-t-md" style={{ height: `${Math.max(v ? 6 : 2, (v / maxDay) * 96)}px`, background: v ? (focus === "all" ? "linear-gradient(180deg,#F58220,#E30613)" : COLORS[focus]) : "#E2E8F0" }} />
                      <span className={`h-1.5 w-1.5 rounded-full ${d.reached ? "bg-vert" : "bg-transparent"}`} />
                      {period === 7 && <span className="text-[9px] font-bold text-slate-400">{DOW[date.getDay()]}</span>}
                    </div>
                  );
                })}
              </div>
              <p className="mt-1 text-[10px] text-slate-400">● vert sous la barre = objectif du jour atteint</p>

              <ul className="mt-4 space-y-2.5">
                {Object.entries(ACTIVITIES).map(([k, a]) => (
                  <li key={k}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-semibold text-slate-600">{a.icon} {a.label}</span>
                      <span className="font-bold" style={{ color: COLORS[k] }}>{report.totals[k]}</span>
                    </div>
                    <Bar value={report.totals[k]} max={Math.max(...Object.values(report.totals), 1)} color={COLORS[k]} />
                  </li>
                ))}
              </ul>
              <button onClick={() => { onClose(); onOpenSettings(); }} className="mt-4 w-full rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600">
                🎯 Choisir mes objectifs du jour
              </button>
            </Section>

            {/* Coran & Khatm */}
            <Section title="📖 Coran & Khatm" action={<Go onClick={() => go("quran")}>Lire</Go>}>
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#EEF2F6" strokeWidth="10" />
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#00A19A" strokeWidth="10" strokeLinecap="round" strokeDasharray="327" strokeDashoffset={327 * (1 - counts.surahChecked / 114)} />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-extrabold text-vert">{pctQuran}%</span>
                </div>
                <div className="flex-1 space-y-1 text-sm">
                  <p><b>{counts.surahChecked}</b>/114 sourates lues</p>
                  {juzProgram.program.active ? (
                    <>
                      <p><b>{juzProgram.completedCount}</b>/30 Juz du programme</p>
                      <p className={juzProgram.onTrack ? "text-vert font-semibold" : "text-orange font-semibold"}>
                        {juzProgram.onTrack ? "✅ Dans les temps" : `⚠️ ${juzProgram.behindBy} Juz de retard`} · jour {juzProgram.daysPassed}
                      </p>
                    </>
                  ) : (
                    <button onClick={() => go("program")} className="font-semibold text-bleu">Démarrer un programme Khatm →</button>
                  )}
                </div>
              </div>
              {juzProgram.program.active && (
                <div className="mt-3"><Bar value={juzProgram.completedCount} max={30} color="#0F4C9B" /></div>
              )}
            </Section>

            {/* Adhkar du jour */}
            <Section title="📿 Adhkar du jour" action={<Go onClick={() => go("adhkar")} />}>
              <ul className="space-y-2.5">
                {adhkarTabs.map((t) => (
                  <li key={t.key}>
                    <button onClick={() => go("adhkar", { tab: t.key })} className="w-full text-left">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="font-semibold text-slate-600">{t.label}</span>
                        <span className={`font-bold ${t.done === t.total ? "text-vert" : "text-slate-500"}`}>{t.done}/{t.total}{t.done === t.total ? " ✓" : ""}</span>
                      </div>
                      <Bar value={t.done} max={t.total} />
                    </button>
                  </li>
                ))}
              </ul>
            </Section>

            {/* Apprentissage */}
            <Section title="🎓 Apprentissage" action={<Go onClick={() => go("learn", { tab: "mots" })}>500 mots</Go>}>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[["Appris", words.learned, "#00A19A"], ["À revoir", words.due, "#F58220"], ["Nouveaux", 500 - words.learned, "#94A3B8"]].map(([l, v, c]) => (
                  <div key={l} className="rounded-xl bg-slate-50 p-2">
                    <p className="font-display text-xl font-extrabold" style={{ color: c }}>{v}</p>
                    <p className="text-[10px] text-slate-400">{l}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3"><Bar value={words.learned} max={500} color="#0F4C9B" /></div>
              <button onClick={() => go("learn", { tab: "lessons" })} className="mt-3 flex w-full items-center justify-between rounded-xl bg-slate-50 p-3 text-sm">
                <span className="text-slate-600">📚 Leçons terminées</span>
                <span className="font-bold text-orange">{lessonsDone}/7</span>
              </button>
            </Section>

            {/* Al-Kahf */}
            <Section title="🕌 Al-Kahf le vendredi">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Vendredis lus : <b className="text-amber-700">{fridayKahf.totalFridays}</b></span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${fridayKahf.isReadThisWeek ? "bg-vert/10 text-vert" : "bg-slate-100 text-slate-500"}`}>
                  {fridayKahf.isReadThisWeek ? "✅ Lu cette semaine" : "Pas encore cette semaine"}
                </span>
              </div>
            </Section>

            <button onClick={() => { if (window.confirm("Effacer la liste des sourates lues ?")) resetChecked(); }}
              className="w-full rounded-xl py-3 text-xs font-semibold text-slate-400 hover:text-rouge">
              🗑️ Remettre à zéro les sourates lues
            </button>
            <p className="text-center text-xs italic text-slate-500">« وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا » — al-Muzzammil, 4</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
