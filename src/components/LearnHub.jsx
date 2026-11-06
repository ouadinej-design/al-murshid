import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Check, ChevronDown, Play } from "lucide-react";
import { UNITS, LEVELS, getPath, nextUnit, isUnlocked, pathStats } from "../lib/path";

const AR = { fontFamily: "'Amiri Quran','Scheherazade New',serif" };

export const TOOLS = [
  { key: "recognize", icon: "🎧", title: "Reconnaître un verset", sub: "Récite : sourate + traduction", color: "#7C3AED" },
  { key: "prof",     icon: "🎙️", title: "Réciter & être corrigé", sub: "Le professeur écoute ta récitation", color: "#E30613" },
  { key: "surahs",   icon: "🕌", title: "Comprendre les sourates", sub: "Mot à mot, audio, traduction", color: "#00A19A" },
  { key: "lessons",  icon: "📚", title: "Apprendre à lire",        sub: "7 leçons : lettres, voyelles…", color: "#F58220" },
  { key: "alphabet", icon: "ح",  title: "Alphabet",                sub: "28 lettres et leurs formes", color: "#0F4C9B" },
  { key: "voyelles", icon: "◌َ", title: "Voyelles",                sub: "Fatḥa, kasra, ḍamma…", color: "#7C3AED" },
  { key: "tajweed",  icon: "🎨", title: "Tajwid",                  sub: "Les règles en couleur", color: "#B45309" },
  { key: "quiz",     icon: "🎯", title: "Quiz libres",             sub: "Lettres, sons, vocabulaire", color: "#0E7490" },
  { key: "mots",     icon: "📖", title: "Dictionnaire",            sub: "Les 500 mots, recherche", color: "#1A1A1A" },
];

/**
 * Accueil de l'onglet Apprendre : 1 action principale (Continuer), la révision du jour,
 * le parcours (niveaux de 10 leçons) et les outils regroupés en grille.
 */
export default function LearnHub({ due, onOpenTool, onOpenLesson }) {
  const path = getPath();
  const nxt = nextUnit(path);
  const { words, doneUnits, totalUnits } = pathStats(path);
  const currentLevel = nxt === null ? LEVELS.length - 1 : Math.floor(nxt / 10);
  const [openLevel, setOpenLevel] = useState(currentLevel);

  return (
    <div className="space-y-4">
      {/* Action principale */}
      <section className="overflow-hidden rounded-3xl text-white shadow-lg" style={{ background: "linear-gradient(135deg,#0F4C9B,#1E64C9 60%,#00A19A)" }}>
        <div className="p-5">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">Comprendre le Coran · les 500 mots</p>
          <p className="mt-1 font-display text-2xl font-extrabold">{words} / 500 mots</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25">
            <div className="h-full rounded-full bg-jaune" style={{ width: `${(doneUnits / totalUnits) * 100}%` }} />
          </div>
          {nxt !== null ? (
            <>
              <p className="mt-3 text-sm text-white/90">Prochaine leçon : <b>Leçon {nxt + 1}</b> · {LEVELS[Math.floor(nxt / 10)].name}</p>
              <p dir="rtl" lang="ar" className="mt-1 text-right text-2xl text-white/95" style={AR}>{UNITS[nxt].map((w) => w.ar).join(" · ")}</p>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => onOpenLesson(nxt)}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 font-display text-base font-extrabold text-bleu shadow">
                <Play className="h-5 w-5" fill="currentColor" /> {doneUnits === 0 ? "Commencer" : "Continuer"} · 5 mots · ~3 min
              </motion.button>
            </>
          ) : (
            <p className="mt-3 font-bold">🎉 Les 500 mots sont terminés, mā shā' Allāh ! Continue la révision.</p>
          )}
        </div>
        {due > 0 && (
          <button onClick={() => onOpenTool("revision")} className="flex w-full items-center justify-between bg-white/10 px-5 py-3 text-left">
            <span className="text-sm font-bold">🃏 Révision du jour : {due} mot{due > 1 ? "s" : ""}</span>
            <span className="rounded-full bg-jaune px-2.5 py-0.5 text-xs font-extrabold text-encre">Réviser</span>
          </button>
        )}
      </section>

      {/* Parcours */}
      <section>
        <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">Mon parcours</h3>
        <div className="space-y-2">
          {LEVELS.map((lv) => {
            const done = lv.units.filter((u) => path.done[u]).length;
            const open = openLevel === lv.index;
            const locked = lv.units[0] > 0 && !isUnlocked(lv.units[0], path);
            return (
              <div key={lv.index} className={`rounded-2xl border bg-white ${open ? "border-bleu/30 shadow-sm" : "border-slate-200"}`}>
                <button onClick={() => setOpenLevel(open ? -1 : lv.index)} className="flex w-full items-center gap-3 p-3 text-left">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${done === lv.units.length ? "bg-vert text-white" : locked ? "bg-slate-100 text-slate-400" : "bg-bleu/10 text-bleu"}`}>
                    {done === lv.units.length ? <Check className="h-4 w-4" /> : locked ? <Lock className="h-4 w-4" /> : lv.index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-encre">Niveau {lv.index + 1} · {lv.name}</span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <span className="block h-full rounded-full bg-vert" style={{ width: `${(done / lv.units.length) * 100}%` }} />
                    </span>
                  </span>
                  <span className="text-xs font-bold text-slate-400">{done}/{lv.units.length}</span>
                  <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>

                {open && (
                  <div className="relative px-4 pb-5 pt-1">
                    {/* chemin en zigzag */}
                    <div className="flex flex-col items-center gap-3">
                      {lv.units.map((u, k) => {
                        const d = path.done[u];
                        const unlocked = isUnlocked(u, path);
                        const current = u === nxt;
                        const offset = [0, 46, 70, 46, 0, -46, -70, -46, 0, 46][k % 10];
                        return (
                          <div key={u} className="flex flex-col items-center" style={{ transform: `translateX(${offset}px)` }}>
                            <motion.button whileTap={unlocked ? { scale: 0.92 } : undefined} disabled={!unlocked} onClick={() => onOpenLesson(u)}
                              aria-label={`Leçon ${u + 1}${d ? " (faite)" : unlocked ? "" : " (verrouillée)"}`}
                              className={`relative flex h-16 w-16 items-center justify-center rounded-full border-b-4 font-display text-lg font-extrabold transition-all
                                ${d ? "border-[#007A74] bg-vert text-white" : current ? "border-[#0B3A78] bg-bleu text-white ring-4 ring-bleu/20" : unlocked ? "border-slate-300 bg-white text-bleu" : "border-slate-200 bg-slate-100 text-slate-300"}`}>
                              {d ? <Check className="h-7 w-7" /> : unlocked ? u + 1 : <Lock className="h-5 w-5" />}
                              {current && <span className="absolute -top-7 whitespace-nowrap rounded-lg bg-bleu px-2 py-0.5 text-[10px] font-bold text-white">Commencer</span>}
                            </motion.button>
                            <span className="mt-1 text-[10px] font-semibold text-slate-400">
                              {d ? "⭐".repeat(d.stars) : UNITS[u][0]?.fr.split(/[ /(]/)[0]}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Outils */}
      <section>
        <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-slate-400">Outils</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {TOOLS.map((t) => (
            <motion.button key={t.key} whileTap={{ scale: 0.97 }} onClick={() => onOpenTool(t.key)}
              className="flex items-start gap-2.5 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg font-bold" style={{ background: `${t.color}14`, color: t.color }}>{t.icon}</span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold leading-tight text-encre">{t.title}</span>
                <span className="mt-0.5 block text-[10px] leading-snug text-slate-400">{t.sub}</span>
              </span>
            </motion.button>
          ))}
        </div>
      </section>
    </div>
  );
}
