import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Square, BookOpen, Volume2, Search } from "lucide-react";
import { loadCorpus, searchVerse, loadVerseDetails, buildCorpus } from "../lib/verseSearch";
import { logActivity } from "../lib/progress";

const AR = { fontFamily: "'Amiri Quran','Scheherazade New',serif" };

/**
 * « Reconnaître un verset » (inspiré de Qorani) : on récite, l'app retrouve la sourate et le verset
 * et affiche le texte et la traduction, en direct.
 * surahIndex : [{ number, name, arabic, verses }] ; embedded : versets intégrés (secours hors ligne).
 */
export default function RecognizeVerse({ open, onClose, surahIndex, embedded, onOpenVerse }) {
  const [corpus, setCorpus] = useState(null);
  const [status, setStatus] = useState("");
  const [partial, setPartial] = useState(false);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [results, setResults] = useState([]);
  const [details, setDetails] = useState({});
  const [typed, setTyped] = useState("");
  const recRef = useRef(null);
  const finalRef = useRef("");
  const audioRef = useRef(null);
  const supported = typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  // corpus : téléchargé une fois ; hors ligne, on se rabat sur les sourates intégrées
  useEffect(() => {
    if (!open || corpus) return;
    let alive = true;
    setStatus("Préparation…");
    loadCorpus(setStatus)
      .then((c) => { if (alive) { setCorpus(c); setStatus(""); } })
      .catch(() => {
        if (!alive) return;
        const surahs = Array.from({ length: 114 }, (_, i) => (embedded?.[i + 1] || []).map((v) => v.arabic));
        setCorpus(buildCorpus(surahs)); setPartial(true);
        setStatus("Hors connexion : seules les sourates intégrées (Al-Fātiḥa, 93 à 114) sont reconnues.");
      });
    return () => { alive = false; };
  }, [open, corpus, embedded]);

  useEffect(() => () => { try { recRef.current?.abort(); } catch { /* */ } audioRef.current?.pause(); }, []);

  const runSearch = (text) => {
    if (!corpus) return;
    const r = searchVerse(corpus, text, 3);
    setResults(r);
    r.slice(0, 1).forEach(({ s, v }) => {
      const key = `${s}:${v}`;
      if (details[key]) return;
      const emb = embedded?.[s]?.[v - 1];
      loadVerseDetails(s, v)
        .then((d) => setDetails((p) => ({ ...p, [key]: d })))
        .catch(() => emb && setDetails((p) => ({ ...p, [key]: { arabic: emb.arabic, french: emb.french } })));
    });
  };

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "ar-SA";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    finalRef.current = "";
    setHeard(""); setResults([]);
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalRef.current += " " + t; else interim += " " + t;
      }
      const all = (finalRef.current + " " + interim).trim();
      setHeard(all);
      runSearch(all); // résultat en direct pendant la récitation
    };
    rec.onend = () => {
      setListening(false);
      if (finalRef.current.trim()) logActivity("recite");
    };
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  };
  const stop = () => { try { recRef.current?.stop(); } catch { /* */ } };

  const play = (global) => {
    audioRef.current?.pause();
    const a = new Audio(`${window.location.origin}/api/audio?slug=ar.alafasy&v=${global}`);
    audioRef.current = a;
    a.play().catch(() => {});
  };

  if (!open) return null;
  const best = results[0];
  const bestKey = best && `${best.s}:${best.v}`;
  const d = best && details[bestKey];
  const meta = best && surahIndex[best.s - 1];
  const globalNum = (sn, vn) => surahIndex.slice(0, sn - 1).reduce((a, x) => a + x.verses, 0) + vn;

  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[115] flex flex-col bg-creme text-encre" role="dialog" aria-modal="true" aria-label="Reconnaître un verset">
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h2 className="font-display text-xl font-extrabold">Reconnaître un verset</h2>
          <p className="text-xs text-slate-500">Récite : l'app trouve la sourate et la traduction</p>
        </div>
        <button onClick={() => { stop(); onClose(); }} aria-label="Fermer" className="rounded-full border border-slate-200 bg-white p-2.5"><X className="h-5 w-5" /></button>
      </header>
      <div className="h-1 shrink-0" style={{ background: "linear-gradient(90deg,#E30613,#F58220,#FFD100,#00A19A,#0F4C9B)" }} />

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {status && <p className={`rounded-xl px-3 py-2 text-xs ${partial ? "bg-jaune/15 text-amber-800" : "bg-bleu/5 text-bleu"}`}>{status}</p>}

        {/* Résultat */}
        <AnimatePresence mode="wait">
          {best ? (
            <motion.section key={bestKey} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="overflow-hidden rounded-3xl border-2 border-vert bg-white shadow-md">
              <div className="flex items-center justify-between bg-vert px-4 py-3 text-white">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">Sourate {best.s} · verset {best.v}</p>
                  <p className="font-display text-lg font-extrabold">{meta?.name}</p>
                </div>
                <div className="text-right">
                  <p dir="rtl" lang="ar" className="text-2xl" style={AR}>{meta?.arabic}</p>
                  <p className="text-[10px] font-bold text-white/80">{best.score >= 70 ? "Très probable" : best.score >= 45 ? "Probable" : "À confirmer"}</p>
                </div>
              </div>
              <div className="p-4">
                {d ? (
                  <>
                    <p dir="rtl" lang="ar" className="text-center text-2xl leading-[2.1]" style={AR}>{d.arabic}</p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700">{d.french}</p>
                  </>
                ) : <p className="text-center text-sm text-slate-400">⏳ Chargement du texte et de la traduction…</p>}
                <div className="mt-4 flex gap-2">
                  {d && (
                    <button onClick={() => play(d.global || globalNum(best.s, best.v))} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-vert/10 py-2.5 text-sm font-bold text-vert">
                      <Volume2 className="h-4 w-4" /> Écouter
                    </button>
                  )}
                  <button onClick={() => { stop(); onOpenVerse(best.s, best.v); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-bleu py-2.5 text-sm font-bold text-white">
                    <BookOpen className="h-4 w-4" /> Lire la suite
                  </button>
                </div>
              </div>
            </motion.section>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-center text-sm text-slate-500">
              {listening ? "J'écoute… récite quelques mots d'un verset." : "Appuie sur le micro et récite un verset (au moins 3 ou 4 mots)."}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Autres possibilités */}
        {results.length > 1 && (
          <div>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">Autres possibilités</p>
            <div className="flex flex-wrap gap-2">
              {results.slice(1).map((r) => (
                <button key={`${r.s}:${r.v}`} onClick={() => { setResults((rs) => [r, ...rs.filter((x) => x !== r)]); runSearchDetails(r); }}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600">
                  {surahIndex[r.s - 1]?.name} {r.v}
                </button>
              ))}
            </div>
          </div>
        )}

        {heard && <p className="rounded-xl bg-white p-3 text-right text-sm text-slate-500 border border-slate-200" dir="rtl" lang="ar">🎧 {heard}</p>}

        {/* Recherche écrite (sans micro) */}
        <form onSubmit={(e) => { e.preventDefault(); setHeard(typed); runSearch(typed); }} className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={typed} onChange={(e) => setTyped(e.target.value)} dir="auto" placeholder="…ou écris quelques mots en arabe"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-20 text-sm outline-none focus:border-bleu" />
          <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-bleu px-3 py-1.5 text-xs font-bold text-white">Chercher</button>
        </form>
        {!supported && <p className="text-xs text-rouge">La reconnaissance vocale n'est pas disponible dans ce navigateur : utilise Chrome (Android) ou Safari (iPhone), ou la recherche écrite.</p>}
      </div>

      {/* Micro */}
      <div className="flex flex-col items-center gap-2 border-t border-slate-200 bg-white pb-8 pt-4">
        <motion.button whileTap={{ scale: 0.92 }} disabled={!supported || !corpus} onClick={listening ? stop : start}
          aria-label={listening ? "Arrêter l'écoute" : "Réciter"}
          className={`relative flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg disabled:opacity-40 ${listening ? "bg-rouge" : "bg-vert"}`}>
          {listening && <motion.span className="absolute inset-0 rounded-full bg-rouge/40" animate={{ scale: [1, 1.5], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} />}
          {listening ? <Square className="h-8 w-8" fill="currentColor" /> : <Mic className="h-9 w-9" />}
        </motion.button>
        <p className="text-xs font-semibold text-slate-500">{listening ? "Appuie pour arrêter" : "Appuie et récite"}</p>
      </div>
    </motion.div>,
    document.body
  );

  function runSearchDetails(r) {
    const key = `${r.s}:${r.v}`;
    if (details[key]) return;
    const emb = embedded?.[r.s]?.[r.v - 1];
    loadVerseDetails(r.s, r.v)
      .then((x) => setDetails((p) => ({ ...p, [key]: x })))
      .catch(() => emb && setDetails((p) => ({ ...p, [key]: { arabic: emb.arabic, french: emb.french } })));
  }
}
