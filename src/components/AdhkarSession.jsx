import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cycleInfo } from "../lib/dhikr";
import { ChevronLeft, ChevronRight, LayoutGrid, RotateCcw, Volume2, Pause, X, Check } from "lucide-react";

const R = 40, CIRC = 2 * Math.PI * R;
const PREF_KEY = "adhkar_session_show";

function vibrate(p) { try { navigator.vibrate?.(p); } catch { /* non supporté */ } }
function loadShow() {
  try { return { ar: true, fr: true, tr: false, vertu: false, ...(JSON.parse(localStorage.getItem(PREF_KEY)) || {}) }; }
  catch { return { ar: true, fr: true, tr: false, vertu: false }; }
}

/** Grains de chapelet : un par répétition (jusqu'à 11), sinon une barre. */
function Beads({ count, total, group = 0 }) {
  if (total <= 1) return null;
  if (total <= 12) {
    return (
      <span className="mt-1.5 flex items-center gap-1" aria-label={`${count} sur ${total}`}>
        {Array.from({ length: total }, (_, i) => (
          <motion.span key={i} animate={{ scale: i === count - 1 ? [1.5, 1] : 1 }}
            className={`h-3 w-3 rounded-full border ${i < count ? "border-vert bg-vert" : "border-slate-300 bg-white"} ${group && i > 0 && i % group === 0 ? "ml-2" : ""}`} />
        ))}
        <span className="ml-1 text-[11px] font-bold text-vert">{count}/{total}</span>
      </span>
    );
  }
  return (
    <span className="mt-1.5 flex items-center gap-2">
      <span className="h-2 w-28 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-vert" style={{ width: `${(count / total) * 100}%` }} /></span>
      <span className="text-[11px] font-bold text-vert">{count}/{total}</span>
    </span>
  );
}

/**
 * Mode séance : un dhikr à la fois. On touche la carte pour compter ;
 * une fois le nombre atteint, on passe automatiquement au suivant.
 * Glisser à gauche/droite pour naviguer, sommaire pour sauter directement.
 */
export default function AdhkarSession({ list, recited, onSet, speak, speaking, favorites, toggleFav, tabLabel, nextTab, onGoTab, onOpenTasbih }) {
  // on reprend au premier dhikr pas encore fait (la page est recréée à chaque changement d'onglet)
  const [idx, setIdx] = useState(() => {
    const i = list.findIndex((d) => (recited[d.id] || 0) < d.repetition);
    return i < 0 ? 0 : i;
  });
  const [dir, setDir] = useState(1);
  const [show, setShow] = useState(loadShow);
  const [summary, setSummary] = useState(false);
  const advanceRef = useRef(null);

  useEffect(() => () => clearTimeout(advanceRef.current), []);
  useEffect(() => { try { localStorage.setItem(PREF_KEY, JSON.stringify(show)); } catch { /* */ } }, [show]);

  const doneCount = list.filter((d) => (recited[d.id] || 0) >= d.repetition).length;
  const allDone = list.length > 0 && doneCount === list.length;
  const d = list[Math.min(idx, list.length - 1)];
  if (!d) return <p className="py-10 text-center text-slate-400">Aucun dhikr dans cet onglet.</p>;

  const count = recited[d.id] || 0;
  const done = count >= d.repetition;
  const phase = d.phases?.find((p) => count < p.upto) || null;
  const cyc = done ? null : cycleInfo(d, count);   // ex. Ikhlāṣ → Falaq → Nās, 3 tours
  const view = cyc ? { ...d, arabic: cyc.arabic, transliteration: cyc.transliteration, french: cyc.french } : d;

  const go = (i) => {
    clearTimeout(advanceRef.current);
    if (i < 0 || i >= list.length) return;
    setDir(i > idx ? 1 : -1);
    setIdx(i);
  };

  const [pulse, setPulse] = useState(0);
  const tap = () => {
    if (done) { go(idx + 1); return; }
    setPulse((p) => p + 1);
    const next = count + 1;
    onSet((p) => ({ ...p, [d.id]: Math.min(d.repetition, (p[d.id] || 0) + 1) }));
    vibrate(next >= d.repetition ? [40, 60, 40] : 10);
    if (next >= d.repetition && idx < list.length - 1) {
      advanceRef.current = setTimeout(() => { setDir(1); setIdx((i) => i + 1); }, 650);
    }
  };

  // au moins un texte (arabe, phonétique ou traduction) reste toujours affiché
  const toggle = (k) => setShow((s) => {
    const next = { ...s, [k]: !s[k] };
    if (!next.ar && !next.tr && !next.fr) next[k === "tr" ? "ar" : "tr"] = true;
    return next;
  });
  const PRESETS = [
    ["Phonétique seule", { ar: false, tr: true, fr: false, vertu: false }],
    ["Arabe seul", { ar: true, tr: false, fr: false, vertu: false }],
    ["Tout", { ar: true, tr: true, fr: true, vertu: true }],
  ];
  const isPlaying = speaking === d.id;

  return (
    <div className="space-y-3">
      {/* Progression : un segment par dhikr (touchable) */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-[3px]" role="tablist" aria-label="Progression de la séance">
          {list.map((x, i) => {
            const ok = (recited[x.id] || 0) >= x.repetition;
            return (
              <button key={x.id} onClick={() => go(i)} aria-label={`Dhikr ${i + 1}${ok ? " (fait)" : ""}`}
                className={`h-2 flex-1 rounded-full transition-all ${i === idx ? "ring-2 ring-vert/40" : ""}`}
                style={{ background: ok ? "#00A19A" : i === idx ? "#99DCD8" : "#E2E8F0" }} />
            );
          })}
        </div>
        <span className="shrink-0 text-xs font-bold text-slate-500">{doneCount}/{list.length}</span>
        <button onClick={() => setSummary(true)} aria-label="Sommaire" className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500">
          <LayoutGrid className="h-4 w-4" />
        </button>
      </div>

      {/* Affichage : choix de ce qu'on voit sous l'arabe */}
      <div className="flex flex-wrap gap-1.5">
        {[["ar", "Arabe"], ["tr", "Phonétique"], ["fr", "Traduction"], ["vertu", "Vertu"]].map(([k, l]) => (
          <button key={k} onClick={() => toggle(k)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${show[k] ? "border-vert bg-vert/10 text-vert" : "border-slate-200 bg-white text-slate-400"}`}>
            {show[k] ? "✓ " : ""}{l}
          </button>
        ))}
      </div>
      <div className="-mt-1 flex gap-1.5 text-[10px]">
        <span className="py-0.5 text-slate-400">Raccourcis :</span>
        {PRESETS.map(([l, v]) => (
          <button key={l} onClick={() => setShow(v)} className="rounded-full bg-slate-100 px-2 py-0.5 font-bold text-slate-500">{l}</button>
        ))}
      </div>

      {/* Carte du dhikr : toucher = compter, glisser = naviguer */}
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div key={d.id} custom={dir}
          initial={{ opacity: 0, x: dir * 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -60 }}
          transition={{ duration: 0.22 }}
          drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.25}
          onDragEnd={(_, info) => { if (info.offset.x < -70) go(idx + 1); else if (info.offset.x > 70) go(idx - 1); }}
          className={`relative select-none overflow-hidden rounded-3xl border-2 bg-white p-5 shadow-sm transition-colors ${done ? "border-vert bg-vert/5" : "border-slate-200"}`}
          style={{ touchAction: "pan-y", WebkitTapHighlightColor: "transparent" }}>
          <div className="mb-3 flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-vert">{tabLabel} · {idx + 1}/{list.length}</p>
              <p className="mt-0.5 text-sm font-bold leading-snug text-encre">{d.title.replace(/^\d+\.\s*/, "")}</p>
              <Beads count={count} total={d.repetition} group={cyc?.n || (d.cycle ? 3 : 0)} />
              {cyc && (
                <span className="mt-2 flex flex-wrap items-center gap-1">
                  <span className="mr-1 text-[11px] font-bold text-slate-500">Tour {cyc.round}/{cyc.rounds} :</span>
                  {cyc.names.map((nm, i) => (
                    <span key={nm} className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${i === cyc.index ? "bg-vert text-white" : i < cyc.index ? "bg-vert/10 text-vert" : "bg-slate-100 text-slate-400"}`}>
                      {i < cyc.index ? "✓ " : ""}{nm}
                    </span>
                  ))}
                </span>
              )}
            </div>
            <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => speak(d)} aria-label={isPlaying ? "Arrêter" : "Écouter"}
                className={`rounded-xl border p-2 ${isPlaying ? "border-bleu bg-bleu text-white" : "border-slate-200 text-slate-500"}`}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button onClick={() => toggleFav(d.id)} aria-label="Favori" className={`rounded-xl border border-slate-200 px-2.5 text-base ${favorites[d.id] ? "text-rouge" : "text-slate-400"}`}>
                {favorites[d.id] ? "♥" : "♡"}
              </button>
            </div>
          </div>

          {show.ar && (
            <p dir="rtl" lang="ar" className="text-center leading-[2.2] text-encre"
              style={{ fontFamily: "'Amiri Quran','Scheherazade New',serif", fontSize: phase ? "2rem" : view.arabic.length > 260 ? "1.2rem" : view.arabic.length > 120 ? "1.4rem" : "1.7rem" }}>
              {phase ? phase.arabic : view.arabic}
            </p>
          )}
          {phase && (show.ar
            ? <p className="mt-1 text-center text-xs font-semibold text-slate-500">{phase.label}</p>
            : <p className="text-center font-display text-3xl font-extrabold text-encre">{phase.label}</p>)}

          {/* Phonétique : en grand quand l'arabe est masqué */}
          {show.tr && !phase && (show.ar
            ? <p className="mt-3 rounded-xl bg-slate-50 p-3 text-center text-sm font-semibold italic text-slate-600">{view.transliteration}</p>
            : <p className="whitespace-pre-line text-center font-semibold leading-relaxed text-encre" style={{ fontSize: view.transliteration.length > 300 ? "1.1rem" : view.transliteration.length > 140 ? "1.25rem" : "1.45rem" }}>
                {/* une ligne par segment (séparés par « — »), et un saut avant chaque sourate nommée */}
                {view.transliteration.replace(/\s+—\s+/g, "\n").replace(/\s+(Al-Falaq|An-Nās|Al-Ikhlāṣ)\s*:/g, "\n\n$1 :")}
              </p>)}
          {show.fr && <p className="mt-3 text-center text-sm leading-relaxed text-slate-600">{view.french}</p>}
          {show.vertu && d.benefice && <p className="mt-3 rounded-xl bg-jaune/15 p-3 text-xs italic leading-relaxed text-amber-900">📜 {d.benefice}</p>}
          <p className="mt-3 text-center text-[10px] italic text-slate-400">{d.source}</p>

          <p className="mt-4 text-center text-[11px] text-slate-400">Glisse ← → pour changer de dhikr · compte avec le bouton tasbih en bas</p>
        </motion.div>
      </AnimatePresence>

      {/* Tasbih : toujours visible en bas, même si le texte est long */}
      <div className="sticky bottom-0 z-10 -mx-4 border-t border-slate-100 bg-white/95 px-4 pb-2 pt-2 backdrop-blur">
        <div className="flex items-center gap-2">
          <button onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Dhikr précédent"
            className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 disabled:opacity-30"><ChevronLeft className="h-5 w-5" /></button>

          <motion.button key={pulse} onClick={tap} whileTap={{ scale: 0.96 }}
            aria-label={done ? "Dhikr suivant" : `Compter : ${count + 1} sur ${d.repetition}`}
            className={`flex flex-1 items-center gap-3 rounded-2xl px-3 py-2 text-left text-white shadow-md ${done ? "bg-bleu" : "bg-vert"}`}
            style={{ touchAction: "manipulation" }}>
            <span className="relative h-12 w-12 shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="10" />
                <circle cx="50" cy="50" r={R} fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={`${Math.min(1, count / d.repetition) * CIRC} ${CIRC}`} style={{ transition: "stroke-dasharray .15s" }} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center">
                {done ? <Check className="h-5 w-5" /> : <span className="font-display text-base font-extrabold">{count}</span>}
              </span>
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block font-display text-xl font-extrabold">{done ? `${d.repetition}/${d.repetition} ✓` : `${count} / ${d.repetition}`}</span>
              <span className="block text-[11px] font-semibold text-white/85">
                {done ? (idx < list.length - 1 ? "Terminé — toucher pour le suivant →" : "Dernier dhikr terminé") : cyc ? `Récite ${cyc.name}, puis touche · reste ${d.repetition - count}` : `Toucher pour compter · reste ${d.repetition - count}`}
              </span>
            </span>
          </motion.button>

          <button onClick={() => go(idx + 1)} disabled={idx >= list.length - 1} aria-label="Dhikr suivant"
            className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-600 disabled:opacity-30"><ChevronRight className="h-5 w-5" /></button>
        </div>
        <div className="mt-1.5 flex justify-center gap-4 text-[11px] font-semibold text-slate-500">
          {count > 0 && <button onClick={() => onSet((p) => ({ ...p, [d.id]: 0 }))} className="flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5" /> Recommencer</button>}
          {d.repetition > 1 && !done && onOpenTasbih && <button onClick={() => onOpenTasbih(d)} className={d.repetition >= 33 ? "rounded-full bg-vert/10 px-3 py-1 font-bold text-vert" : "text-vert"}>📿 Ouvrir le chapelet</button>}
        </div>
      </div>

      {/* Fin de séance */}
      {allDone && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-vert p-4 text-center text-white shadow-md">
          <p className="font-display text-lg font-extrabold">🎉 {tabLabel} : terminé, mā shā' Allāh !</p>
          {nextTab && (
            <button onClick={() => onGoTab(nextTab.key)} className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-bold text-vert">
              Continuer avec {nextTab.label} →
            </button>
          )}
        </motion.div>
      )}

      {/* Sommaire : tous les adhkar de la catégorie en un coup d'œil */}
      {summary && createPortal(
        <div className="fixed inset-0 z-[120] flex flex-col bg-white text-encre" role="dialog" aria-modal="true" aria-label="Sommaire">
          <div className="flex items-center justify-between border-b border-slate-200 p-4">
            <h3 className="font-display text-lg font-extrabold">{tabLabel} · {doneCount}/{list.length}</h3>
            <button onClick={() => setSummary(false)} aria-label="Fermer" className="rounded-full bg-slate-100 p-2"><X className="h-5 w-5" /></button>
          </div>
          <ul className="flex-1 space-y-1.5 overflow-y-auto p-3">
            {list.map((x, i) => {
              const c = recited[x.id] || 0, ok = c >= x.repetition;
              return (
                <li key={x.id}>
                  <button onClick={() => { go(i); setSummary(false); }}
                    className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${i === idx ? "border-vert" : "border-slate-200"} ${ok ? "bg-vert/5" : "bg-white"}`}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${ok ? "bg-vert text-white" : "bg-slate-100 text-slate-500"}`}>{ok ? "✓" : i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{x.title.replace(/^\d+\.\s*/, "")}</span>
                      <span dir="rtl" lang="ar" className="block truncate text-right text-sm text-slate-500" style={{ fontFamily: "'Amiri Quran',serif" }}>{x.arabic}</span>
                    </span>
                    <span className={`shrink-0 text-xs font-bold ${ok ? "text-vert" : "text-slate-400"}`}>{c}/{x.repetition}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}
