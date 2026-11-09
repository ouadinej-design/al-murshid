import { useEffect, useMemo, useRef, useState } from "react";
import { cycleInfo } from "../lib/dhikr";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, Check } from "lucide-react";

// même réglage d'affichage que le mode séance (Arabe / Phonétique)
const PREF_KEY = "adhkar_session_show";
function loadShow() {
  try { return { ar: true, tr: false, ...(JSON.parse(localStorage.getItem(PREF_KEY)) || {}) }; } catch { return { ar: true, tr: false }; }
}
function saveShow(patch) {
  try { localStorage.setItem(PREF_KEY, JSON.stringify({ ...(JSON.parse(localStorage.getItem(PREF_KEY)) || {}), ...patch })); } catch { /* */ }
}

function vibrate(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch { /* non supporté (iPhone) */ }
}

const B = 30;        // diamètre d'une perle (px)
const GAP = 92;      // espace libre au milieu du fil

/** Une perle : dégradé façon bois/pierre ; les perles repères (33, 66) sont plus grosses et dorées. */
function Bead({ y, marker, fresh }) {
  const size = marker ? B + 8 : B;
  return (
    <motion.div
      initial={fresh ? { y: y - 40, opacity: 0 } : false}
      animate={{ y, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.7 }}
      className="absolute left-1/2 rounded-full"
      style={{
        width: size, height: size, marginLeft: -size / 2, top: 0, marginTop: -size / 2,
        background: marker
          ? "radial-gradient(circle at 35% 30%, #FFF3B0, #E8B400 45%, #8A6400 100%)"
          : "radial-gradient(circle at 35% 30%, #7FE3DC, #00A19A 45%, #00534F 100%)",
        boxShadow: "0 3px 6px rgba(0,0,0,.25), inset 0 -2px 4px rgba(0,0,0,.25)",
      }}
    />
  );
}

/**
 * Chapelet plein écran : toucher (ou glisser vers le bas) fait descendre une perle.
 * L'état (count) reste celui de la page Adhkar, donc tout est sauvegardé.
 */
export default function TasbihCounter({ dhikr, count, onIncrement, onReset, onDone, onClose }) {
  const total = dhikr.repetition;
  const done = count >= total;
  const cyc = cycleInfo(dhikr, count);
  const phase = dhikr.phases?.find((p) => count < p.upto) || dhikr.phases?.[dhikr.phases.length - 1]
    || (cyc && { arabic: cyc.arabic, label: cyc.transliteration, tag: `${cyc.name} · tour ${cyc.round}/${cyc.rounds}`, long: true });
  // texte phonétique à afficher : formule en cours, sinon la translittération complète
  const phon = phase ? phase.label : dhikr.transliteration;
  const panned = useRef(false);
  const boxRef = useRef(null);
  const [h, setH] = useState(420);
  const [show, setShow] = useState(loadShow);
  const mode = show.ar && show.tr ? "both" : show.ar ? "ar" : "tr";
  const setMode = (m) => {
    const v = { ar: m !== "tr", tr: m !== "ar" };
    setShow((s) => ({ ...s, ...v }));
    saveShow(v);
  };

  // repères : fin de chaque formule (tasbih de Fāṭima) ou toutes les 33 perles
  const markers = useMemo(() => {
    if (dhikr.phases) return new Set(dhikr.phases.map((p) => p.upto - 1).filter((i) => i < total - 1));
    if (dhikr.cycle) { // fin de chaque tour
      const n = cycleInfo(dhikr, 0)?.n || 3, s = new Set();
      for (let i = n - 1; i < total - 1; i += n) s.add(i);
      return s;
    }
    const s = new Set();
    for (let i = 32; i < total - 1; i += 33) s.add(i);
    return s;
  }, [dhikr.phases, total]);

  useEffect(() => {
    if (done) vibrate([60, 80, 60]);
    else if (markers.has(count - 1)) vibrate([30, 40, 30]);
  }, [done, count, markers]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // hauteur réellement disponible pour le chapelet (s'adapte à la longueur du texte)
    const ro = new ResizeObserver(([e]) => setH(Math.max(200, Math.floor(e.contentRect.height))));
    if (boxRef.current) ro.observe(boxRef.current);
    return () => { document.body.style.overflow = prev; ro.disconnect(); };
  }, []);

  const tap = () => {
    if (done) return;
    vibrate(markers.has(count) ? 25 : 10);
    onIncrement();
  };

  // positions : pile du haut (restantes) collée au-dessus de l'espace, pile du bas (comptées) en dessous
  const mid = h / 2;
  const topEdge = mid - GAP / 2;
  const bottomEdge = mid + GAP / 2;
  const SHOWN = Math.max(2, Math.floor((topEdge - 8) / (B + 2))); // perles visibles de chaque côté
  const beads = [];
  for (let i = Math.max(0, count - SHOWN); i < Math.min(total, count + SHOWN); i++) {
    const counted = i < count;
    const y = counted
      ? bottomEdge + (count - 1 - i) * (B + 2) + B / 2
      : topEdge - (i - count) * (B + 2) - B / 2;
    beads.push({ i, y, marker: markers.has(i) });
  }

  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex flex-col bg-creme text-encre" role="dialog" aria-modal="true" aria-label={`Tasbih : ${dhikr.title}`}>
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onClose} className="rounded-full border border-slate-200 bg-white p-2.5 shadow-sm" aria-label="Fermer">
          <X className="h-5 w-5" />
        </button>
        <p className="mx-3 flex-1 truncate text-center text-xs font-bold uppercase tracking-wider text-vert">{dhikr.title.replace(/^\d+\.\s*/, "")}</p>
        <button onClick={onReset} className="rounded-full border border-slate-200 bg-white p-2.5 shadow-sm" aria-label="Recommencer à zéro">
          <RotateCcw className="h-5 w-5" />
        </button>
      </header>
      <div className="h-1 shrink-0" style={{ background: "linear-gradient(90deg,#E30613 0%,#F58220 25%,#FFD100 50%,#00A19A 75%,#0F4C9B 100%)" }} />

      {/* Choix d'affichage */}
      <div className="mx-auto mt-2 grid w-64 grid-cols-3 gap-1 rounded-xl bg-white p-1 shadow-sm border border-slate-200">
        {[["ar", "Arabe"], ["tr", "Phonétique"], ["both", "Les deux"]].map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)}
            className={`rounded-lg py-1.5 text-[11px] font-bold ${mode === k ? "bg-vert text-white" : "text-slate-500"}`}>{l}</button>
        ))}
      </div>

      {/* Formule à réciter */}
      <div className="max-h-[26vh] overflow-y-auto px-6 pt-3 text-center">
        {phase?.tag && <p className="mb-1 text-xs font-bold uppercase tracking-wider text-vert">{phase.tag}</p>}
        {show.ar && (
          <p dir="rtl" lang="ar" className="leading-[1.9] text-encre"
            style={{ fontFamily: "'Amiri Quran','Scheherazade New',serif", fontSize: (phase && !phase.long) || dhikr.arabic.length < 70 ? "1.9rem" : "1.15rem" }}>
            {phase?.arabic || dhikr.arabic}
          </p>
        )}
        {show.tr ? (
          <p className={`whitespace-pre-line font-semibold text-encre ${show.ar ? "mt-1 text-sm text-slate-500" : ""}`}
            style={show.ar ? undefined : { fontSize: phon.length > 160 ? "1.05rem" : phon.length > 60 ? "1.3rem" : "1.9rem", lineHeight: 1.35 }}>
            {phon.replace(/\s+—\s+/g, "\n")}
          </p>
        ) : null}
      </div>

      {/* Le chapelet : toucher ou glisser vers le bas */}
      <motion.div
        onPanStart={() => { panned.current = true; }}
        onPanEnd={(_, info) => { if (info.offset.y > 25) tap(); setTimeout(() => { panned.current = false; }, 0); }}
        onTap={() => { if (!panned.current) tap(); }}
        ref={boxRef}
        className="relative mx-auto flex min-h-[200px] w-full max-w-sm flex-1 cursor-pointer select-none items-start justify-center overflow-hidden"
        style={{ touchAction: "none", WebkitTapHighlightColor: "transparent" }}
        role="button" aria-label={done ? "Terminé" : `Faire descendre une perle (${count + 1} sur ${total})`}>
        <div className="relative w-full" style={{ height: h }}>
          {/* le fil */}
          <div className="absolute left-1/2 top-0 h-full w-[3px] -translate-x-1/2 rounded-full bg-gradient-to-b from-slate-300 via-slate-400 to-slate-300" />
          {/* repère de la zone de passage */}
          <div className="absolute left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-slate-300"
            style={{ top: mid - 7 }}>{!done && "▼"}</div>

          {/* compteur à côté du fil */}
          <div className="absolute left-4 flex flex-col items-start" style={{ top: mid - 34 }}>
            <motion.span key={count} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className="font-display text-5xl font-extrabold leading-none text-vert">{count}</motion.span>
            <span className="text-sm font-semibold text-slate-400">/ {total}</span>
          </div>
          <div className="absolute right-4 text-right" style={{ top: mid - 22 }}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reste</p>
            <p className="font-display text-2xl font-extrabold text-slate-500">{Math.max(0, total - count)}</p>
          </div>

          <AnimatePresence initial={false}>
            {beads.map((b) => <Bead key={b.i} y={b.y} marker={b.marker} fresh={b.i === count + SHOWN - 1} />)}
          </AnimatePresence>

          {/* perle « imam » au bout du chapelet quand tout est compté */}
          {done && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full text-white shadow-lg"
              style={{ top: topEdge - 60, background: "radial-gradient(circle at 35% 30%, #FFF3B0, #E8B400 45%, #8A6400 100%)" }}>
              <Check className="h-7 w-7" />
            </motion.div>
          )}
        </div>
      </motion.div>

      <div className="px-5 pb-8 pt-2">
        {done ? (
          <button onClick={onClose} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-vert py-4 font-display text-lg font-bold text-white shadow-lg">
            <Check className="h-5 w-5" /> Terminé, mā shā' Allāh !
          </button>
        ) : (
          <div className="space-y-2 text-center">
            {onDone && (
              <button onClick={onDone} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-600">
                ✓ Déjà fait (récité ailleurs)
              </button>
            )}
            <p className="text-xs text-slate-500">Touche le chapelet ou fais glisser une perle vers le bas · <span className="italic">{dhikr.source}</span></p>
          </div>
        )}
      </div>
    </motion.div>,
    document.body
  );
}
