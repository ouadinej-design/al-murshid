import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FullScreen, AR, Lives, GameOver, speak, vibrate } from "./shared";
import { survieWave, saveBest, getPlay } from "../../lib/play";
import { RANKED, makeOptions } from "../../lib/path";
import { logActivity } from "../../lib/progress";

/**
 * Survie : un mot du Coran s'affiche avec un chrono ; choisir son sens avant la fin.
 * 3 vies, vagues de 5 mots ; à chaque vague le chrono raccourcit et les mots sont plus rares.
 */
export default function Survie({ onClose }) {
  const [game, setGame] = useState(0);
  return <SurvieGame key={game} onClose={onClose} onReplay={() => setGame((g) => g + 1)} />;
}

function SurvieGame({ onClose, onReplay }) {
  const [wave, setWave] = useState(1);
  const [inWave, setInWave] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState(null);
  const [missed, setMissed] = useState([]);
  const [over, setOver] = useState(null);
  const used = useRef(new Set());
  const params = survieWave(wave);

  const pickWord = () => {
    const pool = RANKED.slice(0, params.poolSize).filter((w) => !used.current.has(w.id));
    const w = (pool.length ? pool : RANKED)[Math.floor(Math.random() * (pool.length || RANKED.length))];
    used.current.add(w.id);
    return w;
  };
  const [word, setWord] = useState(pickWord);
  const options = useMemo(() => makeOptions(word, "fr", RANKED.slice(0, params.poolSize + 40)), [word]); // eslint-disable-line react-hooks/exhaustive-deps
  const [left, setLeft] = useState(params.seconds * 1000);

  useEffect(() => {
    if (picked || over) return;
    const start = Date.now(), total = params.seconds * 1000;
    setLeft(total);
    const t = setInterval(() => {
      const l = total - (Date.now() - start);
      setLeft(l);
      if (l <= 0) { clearInterval(t); answer(null); }
    }, 100);
    return () => clearInterval(t);
  }, [word, over]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = (opt) => {
    if (picked) return;
    const ok = opt?.id === word.id;
    setPicked(opt ? opt.id : "timeout");
    vibrate(ok ? 15 : [40, 60, 40]);
    if (ok) { setScore((s) => s + 1); speak(word.ar); }
    else { setLives((l) => l - 1); setMissed((m) => [...m, word]); }
    setTimeout(() => {
      if (!ok && lives - 1 <= 0) return finish(score);
      setPicked(null);
      if (inWave + 1 >= params.size) { setWave((w) => w + 1); setInWave(0); } else setInWave((i) => i + 1);
      setWord(pickWord());
    }, ok ? 650 : 1400);
  };

  const finish = (s) => {
    const record = saveBest("survie", s);
    logActivity("games"); if (s > 0) logActivity("quiz", s);
    setOver({ score: s, record, best: getPlay().best.survie });
  };

  if (over) {
    return (
      <FullScreen title="💀 Survie" onClose={onClose}>
        <GameOver score={over.score} unit="mots" best={over.best} isRecord={over.record}
          lines={missed.slice(-5)} onReplay={onReplay} onClose={onClose} />
        {missed.length > 0 && <p className="pb-6 text-center text-xs text-slate-500">Les mots ratés, à revoir ⬆︎</p>}
      </FullScreen>
    );
  }

  const pct = Math.max(0, left / (params.seconds * 1000)) * 100;
  return (
    <FullScreen title="💀 Survie" onClose={onClose} right={<Lives n={lives} />}>
      <div className="flex flex-1 flex-col px-5 pb-6">
        <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-500">
          <span>Vague {wave} · {inWave + 1}/{params.size}</span>
          <span>{score} pts · {params.seconds} s</span>
        </div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${pct}%`, background: pct > 50 ? "#00A19A" : pct > 25 ? "#FFD100" : "#E30613" }} />
        </div>
        <motion.div key={word.id} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="mt-5 flex min-h-[170px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p dir="rtl" lang="ar" className="text-6xl leading-[1.7]" style={AR}>{word.ar}</p>
        </motion.div>
        <p className="mt-4 text-sm font-semibold text-slate-600">Que signifie ce mot ?</p>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          {options.map((o) => {
            const right = o.id === word.id, isPicked = picked === o.id;
            const cls = !picked ? "border-slate-200 bg-white" : right ? "border-vert bg-vert/10 text-vert" : isPicked ? "border-rouge bg-rouge/10 text-rouge" : "border-slate-200 bg-white opacity-50";
            return <button key={o.id} onClick={() => answer(o)} className={`min-h-[64px] rounded-2xl border-2 p-3 text-sm font-bold ${cls}`}>{o.fr}</button>;
          })}
        </div>
        {picked === "timeout" && <p className="mt-3 text-center text-sm font-bold text-rouge">⏱️ Temps écoulé : {word.fr}</p>}
      </div>
    </FullScreen>
  );
}
