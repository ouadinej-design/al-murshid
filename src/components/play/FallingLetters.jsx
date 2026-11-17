import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2 } from "lucide-react";
import { FullScreen, AR, Lives, GameOver, speak, vibrate } from "./shared";
import { PLAYABLE, fallingLetters, saveBest, getPlay, stageItems, recordLetter, recordSyllable } from "../../lib/play";
import { logActivity } from "../../lib/progress";

const H = 420; // hauteur de la zone de jeu (px)

/**
 * Lettres qui tombent (façon « Fruit Ninja ») : le sens d'un mot est donné,
 * ses lettres tombent mêlées à des leurres ; on les touche dans l'ordre (de droite à gauche).
 * Une mauvaise lettre coûte une vie. Plus on avance, plus ça tombe vite.
 */
export default function FallingLetters({ onClose, stage = "mots" }) {
  const [game, setGame] = useState(0);
  return <Game key={game} stage={stage} onClose={onClose} onReplay={() => setGame((g) => g + 1)} />;
}

// Étapes Lettres / Syllabes : attraper LA lettre (ou syllabe) demandée parmi quelques autres.
function newBasicRound(level, stage) {
  const items = stageItems(stage);
  const word = items[Math.floor(Math.random() * items.length)];
  const decoys = items.filter((x) => x.ar !== word.ar).sort(() => Math.random() - 0.5).slice(0, Math.min(4, 2 + Math.floor(level / 3)));
  const tokens = [word, word, ...decoys].sort(() => Math.random() - 0.5); // la bonne apparaît 2 fois
  return {
    word, target: [word.ar], basic: true,
    items: tokens.map((t, i) => ({ id: `${level}-${i}`, c: t.ar, x: 12 + ((i * 29) % 74), y: 10 - i * (H / tokens.length) * 0.7, cut: false })),
  };
}

function newRound(level, stage = "mots") {
  if (stage !== "mots") return newBasicRound(level, stage);
  const pool = [...PLAYABLE].sort((a, b) => (b.freq || 0) - (a.freq || 0)).slice(0, 60 + level * 30);
  const word = pool[Math.floor(Math.random() * pool.length)];
  const { target, tokens } = fallingLetters(word, Math.min(5, 2 + Math.floor(level / 2)));
  return {
    word, target,
    items: tokens.map((c, i) => ({ id: `${level}-${i}`, c, x: 10 + ((i * 37) % 78), y: 20 - i * (H / tokens.length) * 0.8, cut: false })),
  };
}

function Game({ onClose, onReplay, stage }) {
  const [level, setLevel] = useState(0);
  const [round, setRound] = useState(() => newRound(0, stage));
  const [built, setBuilt] = useState([]);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [found, setFound] = useState([]);
  const [flash, setFlash] = useState(null);
  const [over, setOver] = useState(null);
  const [paused, setPaused] = useState(false);
  const raf = useRef(0);
  const speed = stage === "mots" ? 55 + level * 9 : 40 + level * 4; // px par seconde (plus lent pour débuter)

  // animation : les lettres tombent et remontent en haut si elles sortent
  useEffect(() => {
    if (over || paused) return;
    let last = performance.now();
    const tick = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      setRound((r) => ({ ...r, items: r.items.map((it) => (it.cut ? it : { ...it, y: it.y + speed * dt > H ? -50 : it.y + speed * dt, x: it.y + speed * dt > H ? 8 + Math.random() * 76 : it.x })) }));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [over, paused, speed]);

  const hit = (it) => {
    if (it.cut || paused) return;
    const need = round.target[built.length];
    if (it.c === need) {
      vibrate(12);
      if (round.basic) { if (stage === "lettres") recordLetter(round.word.id, true); else recordSyllable(true); }
      const nb = [...built, it.c];
      setBuilt(nb);
      setRound((r) => ({ ...r, items: r.items.map((x) => (x.id === it.id ? { ...x, cut: true } : x)) }));
      if (nb.length === round.target.length) {
        speak(round.word.ar);
        setScore((s) => s + 1); setFound((f) => [...f, round.word]);
        setPaused(true); setFlash("ok");
        setTimeout(() => { const l = level + 1; setLevel(l); setRound(newRound(l, stage)); setBuilt([]); setFlash(null); setPaused(false); }, round.basic ? 800 : 1300);
      }
    } else {
      vibrate([40, 60, 40]);
      if (round.basic && stage === "lettres") recordLetter(round.word.id, false);
      setFlash("ko"); setTimeout(() => setFlash(null), 350);
      const nl = lives - 1;
      setLives(nl);
      if (nl <= 0) {
        const record = saveBest("ninja", score);
        logActivity("games"); if (score > 0 && !round.basic) logActivity("words", score);
        setOver({ record, best: getPlay().best.ninja });
      }
    }
  };

  if (over) {
    return (
      <FullScreen title="🍉 Lettres qui tombent" onClose={onClose}>
        <GameOver score={score} unit={stage === "lettres" ? "lettres" : stage === "syllabes" ? "syllabes" : "mots"} best={over.best} isRecord={over.record} lines={found.slice(-5)} onReplay={onReplay} onClose={onClose} />
        <p className="pb-6 text-center text-xs text-slate-500">Le mot à trouver était : <span style={AR} className="text-lg">{round.word.ar}</span> ({round.word.fr})</p>
      </FullScreen>
    );
  }

  return (
    <FullScreen title="🍉 Lettres qui tombent" onClose={onClose} right={<Lives n={lives} />}>
      <div className="flex flex-1 flex-col px-4 pb-4">
        <div className="mt-2 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{stage === "lettres" ? "Attrape la lettre" : stage === "syllabes" ? "Attrape la syllabe" : "Forme le mot"}</p>
            <p className="font-display text-xl font-extrabold leading-tight">{stage === "syllabes" ? `« ${round.word.fr} »` : round.word.fr}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => speak(round.word.ar)} aria-label="Écouter le mot" className="rounded-full bg-bleu/10 p-2 text-bleu"><Volume2 className="h-5 w-5" /></button>
            <span className="rounded-full bg-jaune px-3 py-1 text-sm font-extrabold">{score}</span>
          </div>
        </div>
        {/* mot en construction (droite → gauche) */}
        {!round.basic && <>
        <div dir="rtl" className="mt-2 flex justify-center gap-1.5">
          {round.target.map((_, i) => (
            <span key={i} className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 text-2xl ${built[i] ? "border-vert bg-vert/10" : i === built.length ? "border-bleu bg-white" : "border-slate-200 bg-white"}`} style={AR}>{built[i] || ""}</span>
          ))}
        </div>
        <p className="mt-1 text-center text-[10px] text-slate-400">Touche les lettres dans l'ordre, de droite à gauche</p>
        </>}
        {round.basic && <p className="mt-1 text-center text-[11px] text-slate-500">Touche-la avant qu'elle tombe. Attention aux autres !</p>}

        <div className={`relative mt-2 overflow-hidden rounded-3xl border-2 transition-colors ${flash === "ko" ? "border-rouge bg-rouge/10" : flash === "ok" ? "border-vert bg-vert/10" : "border-slate-200 bg-gradient-to-b from-white to-bleu/5"}`}
          style={{ height: H }}>
          <AnimatePresence>
            {round.items.filter((it) => !it.cut).map((it) => (
              <motion.button key={it.id} exit={{ scale: 1.8, opacity: 0, rotate: 25 }} onPointerDown={() => hit(it)}
                className="absolute flex h-14 w-14 items-center justify-center rounded-full bg-white text-3xl shadow-md ring-2 ring-orange/40 active:scale-90"
                style={{ left: `${it.x}%`, top: it.y, marginLeft: -28, ...AR }}>{it.c}</motion.button>
            ))}
          </AnimatePresence>
          {flash === "ok" && (
            <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="absolute inset-0 flex flex-col items-center justify-center bg-white/70">
              <p dir="rtl" className="text-5xl" style={AR}>{round.word.ar}</p>
              <p className="mt-1 font-display text-lg font-extrabold text-vert">✓ {round.word.fr}</p>
            </motion.div>
          )}
        </div>
      </div>
    </FullScreen>
  );
}
