import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle, Star } from "lucide-react";

// ════════════════════════════════════════════════════════════════════
// DONNÉES — Alphabet arabe
// ════════════════════════════════════════════════════════════════════
const ARABIC_LETTERS = [
  { letter: "ا", name: "Alif",    isolated: "ا", initial: "ا",  medial: "ـا",  final: "ـا",  trans: "a / â",   example: "أَمَل", exampleMean: "espoir" },
  { letter: "ب", name: "Bā",     isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب",  trans: "b",       example: "بَيْت", exampleMean: "maison" },
  { letter: "ت", name: "Tā",     isolated: "ت", initial: "تـ", medial: "ـتـ", final: "ـت",  trans: "t",       example: "تَمْر", exampleMean: "dattes" },
  { letter: "ث", name: "Thā",    isolated: "ث", initial: "ثـ", medial: "ـثـ", final: "ـث",  trans: "th",      example: "ثَلْج", exampleMean: "neige" },
  { letter: "ج", name: "Jīm",    isolated: "ج", initial: "جـ", medial: "ـجـ", final: "ـج",  trans: "j",       example: "جَنَّة", exampleMean: "paradis" },
  { letter: "ح", name: "Ḥā",     isolated: "ح", initial: "حـ", medial: "ـحـ", final: "ـح",  trans: "ḥ",       example: "حَمْد", exampleMean: "louange" },
  { letter: "خ", name: "Khā",    isolated: "خ", initial: "خـ", medial: "ـخـ", final: "ـخ",  trans: "kh",      example: "خَيْر", exampleMean: "bien" },
  { letter: "د", name: "Dāl",    isolated: "د", initial: "د",  medial: "ـد",  final: "ـد",  trans: "d",       example: "دُعَاء", exampleMean: "invocation" },
  { letter: "ذ", name: "Dhāl",   isolated: "ذ", initial: "ذ",  medial: "ـذ",  final: "ـذ",  trans: "dh",      example: "ذِكْر", exampleMean: "invocation / rappel" },
  { letter: "ر", name: "Rā",     isolated: "ر", initial: "ر",  medial: "ـر",  final: "ـر",  trans: "r",       example: "رَحْمَة", exampleMean: "miséricorde" },
  { letter: "ز", name: "Zāy",    isolated: "ز", initial: "ز",  medial: "ـز",  final: "ـز",  trans: "z",       example: "زَكَاة", exampleMean: "aumône légale" },
  { letter: "س", name: "Sīn",    isolated: "س", initial: "سـ", medial: "ـسـ", final: "ـس",  trans: "s",       example: "سَلَام", exampleMean: "paix" },
  { letter: "ش", name: "Shīn",   isolated: "ش", initial: "شـ", medial: "ـشـ", final: "ـش",  trans: "sh",      example: "شُكْر", exampleMean: "gratitude" },
  { letter: "ص", name: "Ṣād",    isolated: "ص", initial: "صـ", medial: "ـصـ", final: "ـص",  trans: "ṣ",       example: "صَلَاة", exampleMean: "prière" },
  { letter: "ض", name: "Ḍād",    isolated: "ض", initial: "ضـ", medial: "ـضـ", final: "ـض",  trans: "ḍ",       example: "ضَوْء", exampleMean: "lumière" },
  { letter: "ط", name: "Ṭā",     isolated: "ط", initial: "طـ", medial: "ـطـ", final: "ـط",  trans: "ṭ",       example: "طَهَارَة", exampleMean: "pureté" },
  { letter: "ظ", name: "Ẓā",     isolated: "ظ", initial: "ظـ", medial: "ـظـ", final: "ـظ",  trans: "ẓ",       example: "ظُلْم", exampleMean: "injustice" },
  { letter: "ع", name: "'Ayn",   isolated: "ع", initial: "عـ", medial: "ـعـ", final: "ـع",  trans: "ʿ",       example: "عِلْم", exampleMean: "savoir" },
  { letter: "غ", name: "Ghayn",  isolated: "غ", initial: "غـ", medial: "ـغـ", final: "ـغ",  trans: "gh",      example: "غُفْرَان", exampleMean: "pardon" },
  { letter: "ف", name: "Fā",     isolated: "ف", initial: "فـ", medial: "ـفـ", final: "ـف",  trans: "f",       example: "فَجْر", exampleMean: "aube" },
  { letter: "ق", name: "Qāf",    isolated: "ق", initial: "قـ", medial: "ـقـ", final: "ـق",  trans: "q",       example: "قُرْآن", exampleMean: "Coran" },
  { letter: "ك", name: "Kāf",    isolated: "ك", initial: "كـ", medial: "ـكـ", final: "ـك",  trans: "k",       example: "كَرَم", exampleMean: "générosité" },
  { letter: "ل", name: "Lām",    isolated: "ل", initial: "لـ", medial: "ـلـ", final: "ـل",  trans: "l",       example: "لَيْل", exampleMean: "nuit" },
  { letter: "م", name: "Mīm",    isolated: "م", initial: "مـ", medial: "ـمـ", final: "ـم",  trans: "m",       example: "مَاء", exampleMean: "eau" },
  { letter: "ن", name: "Nūn",    isolated: "ن", initial: "نـ", medial: "ـنـ", final: "ـن",  trans: "n",       example: "نُور", exampleMean: "lumière" },
  { letter: "ه", name: "Hā",     isolated: "ه", initial: "هـ", medial: "ـهـ", final: "ـه",  trans: "h",       example: "هِدَايَة", exampleMean: "guidance" },
  { letter: "و", name: "Wāw",    isolated: "و", initial: "و",  medial: "ـو",  final: "ـو",  trans: "w / û",   example: "وَقْت", exampleMean: "temps" },
  { letter: "ي", name: "Yā",     isolated: "ي", initial: "يـ", medial: "ـيـ", final: "ـي",  trans: "y / î",   example: "يَقِين", exampleMean: "certitude" },
];

// ════════════════════════════════════════════════════════════════════
// DONNÉES — Voyelles & signes
// ════════════════════════════════════════════════════════════════════
const HARAKAT = [
  { sign: "بَ", name: "Fatha",       trans: "a",    desc: "Petit trait oblique au-dessus — se lit 'a' court" },
  { sign: "بِ", name: "Kasra",       trans: "i",    desc: "Petit trait oblique en dessous — se lit 'i' court" },
  { sign: "بُ", name: "Ḍamma",       trans: "u",    desc: "Petit wāw au-dessus — se lit 'u' court" },
  { sign: "بً", name: "Tanwīn fath", trans: "an",   desc: "Double fatha — tanwīn, ajoute 'n' à la fin du mot" },
  { sign: "بٍ", name: "Tanwīn kasr", trans: "in",   desc: "Double kasra — tanwīn en kasra" },
  { sign: "بٌ", name: "Tanwīn ḍamm", trans: "un",   desc: "Double ḍamma — tanwīn en ḍamma" },
  { sign: "بْ", name: "Sukūn",       trans: "—",    desc: "Petit cercle au-dessus — la lettre est sans voyelle" },
  { sign: "بّ", name: "Shadda",      trans: "×2",   desc: "Signe en forme de w — la lettre est doublée (géminée)" },
  { sign: "آ",  name: "Madda",       trans: "â",    desc: "Tilde sur alif — alif allongé, voyelle longue 'â'" },
];

// ════════════════════════════════════════════════════════════════════
// DONNÉES — Mots coraniques fréquents
// ════════════════════════════════════════════════════════════════════
const QURAN_WORDS = [
  { arabic: "اللَّه",    trans: "Allāh",         french: "Allah",                 occurs: "2699×" },
  { arabic: "رَبّ",     trans: "Rabb",           french: "Seigneur",              occurs: "975×"  },
  { arabic: "رَحْمَة",  trans: "Raḥma",         french: "Miséricorde",           occurs: "79×"   },
  { arabic: "صَلَاة",   trans: "Ṣalāh",         french: "Prière",                occurs: "83×"   },
  { arabic: "كِتَاب",   trans: "Kitāb",         french: "Livre",                 occurs: "230×"  },
  { arabic: "عَالَم",   trans: "ʿĀlam",         french: "Monde / univers",       occurs: "73×"   },
  { arabic: "إِيمَان",  trans: "Īmān",          french: "Foi",                   occurs: "45×"   },
  { arabic: "جَنَّة",   trans: "Janna",         french: "Paradis",               occurs: "147×"  },
  { arabic: "نَار",     trans: "Nār",           french: "Feu / enfer",           occurs: "145×"  },
  { arabic: "يَوْم",    trans: "Yawm",          french: "Jour",                  occurs: "475×"  },
  { arabic: "نَفْس",    trans: "Nafs",          french: "Âme / soi",             occurs: "295×"  },
  { arabic: "حَقّ",     trans: "Ḥaqq",          french: "Vérité / droit",        occurs: "287×"  },
  { arabic: "عَمَل",    trans: "ʿAmal",         french: "Acte / oeuvre",         occurs: "359×"  },
  { arabic: "قَلْب",    trans: "Qalb",          french: "Cœur",                  occurs: "168×"  },
  { arabic: "بِسْم",    trans: "Bism",          french: "Au nom de",             occurs: "114×"  },
  { arabic: "حَمْد",    trans: "Ḥamd",          french: "Louange",               occurs: "68×"   },
  { arabic: "خَيْر",    trans: "Khayr",         french: "Bien / meilleur",       occurs: "203×"  },
  { arabic: "صَبْر",    trans: "Ṣabr",          french: "Patience",              occurs: "90×"   },
  { arabic: "عِلْم",    trans: "ʿIlm",          french: "Savoir / science",      occurs: "854×"  },
  { arabic: "نُور",     trans: "Nūr",           french: "Lumière",               occurs: "49×"   },
  { arabic: "هُدَى",    trans: "Hudā",          french: "Guidance",              occurs: "53×"   },
  { arabic: "تَقْوَى",  trans: "Taqwā",         french: "Piété / crainte de Dieu", occurs: "18×" },
  { arabic: "شُكْر",    trans: "Shukr",         french: "Gratitude",             occurs: "75×"   },
  { arabic: "ذِكْر",    trans: "Dhikr",         french: "Rappel / invocation",   occurs: "292×"  },
];

// ════════════════════════════════════════════════════════════════════
// DONNÉES — Quiz
// ════════════════════════════════════════════════════════════════════
function buildQuiz() {
  const questions = [];
  ARABIC_LETTERS.forEach(l => {
    const wrong = ARABIC_LETTERS.filter(x => x.name !== l.name).sort(() => 0.5 - Math.random()).slice(0, 3).map(x => x.name);
    const opts = [...wrong, l.name].sort(() => 0.5 - Math.random());
    questions.push({ type: "letter_name", question: l.letter, correct: l.name, options: opts, hint: `Translittération : ${l.trans}` });
  });
  QURAN_WORDS.slice(0, 12).forEach(w => {
    const wrong = QURAN_WORDS.filter(x => x.arabic !== w.arabic).sort(() => 0.5 - Math.random()).slice(0, 3).map(x => x.french);
    const opts = [...wrong, w.french].sort(() => 0.5 - Math.random());
    questions.push({ type: "word_meaning", question: w.arabic, correct: w.french, options: opts, hint: `Translittération : ${w.trans}` });
  });
  return questions.sort(() => 0.5 - Math.random()).slice(0, 10);
}

// ════════════════════════════════════════════════════════════════════
// SOUS-MODULES
// ════════════════════════════════════════════════════════════════════
function AlphabetModule() {
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("grid"); // grid | detail
  return (
    <div className="space-y-4">
      {view === "grid" && (
        <>
          <p className="text-slate-500 text-xs text-center">Appuie sur une lettre pour voir toutes ses formes</p>
          <div className="grid grid-cols-7 gap-2">
            {ARABIC_LETTERS.map((l, i) => (
              <motion.button key={l.name} whileTap={{ scale: 0.88 }}
                onClick={() => { setSelected(l); setView("detail"); }}
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02 }}
                className="aspect-square rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/10 flex flex-col items-center justify-center gap-0.5 transition-all group">
                <span className="text-2xl font-serif text-white group-hover:text-emerald-300 transition-colors" dir="rtl">{l.letter}</span>
                <span className="text-[8px] text-slate-600 group-hover:text-slate-400">{l.name}</span>
              </motion.button>
            ))}
          </div>
        </>
      )}
      {view === "detail" && selected && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <button onClick={() => setView("grid")} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-all">
            <ChevronLeft className="w-4 h-4"/> Retour à l'alphabet
          </button>
          <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/30 border border-emerald-500/30 rounded-3xl p-6 text-center">
            <p className="text-8xl font-serif text-white mb-3" dir="rtl">{selected.letter}</p>
            <p className="text-2xl font-bold text-emerald-300">{selected.name}</p>
            <p className="text-slate-400 text-sm mt-1">Translittération : <span className="font-bold text-white">{selected.trans}</span></p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Isolée", form: selected.isolated },
              { label: "Initiale", form: selected.initial },
              { label: "Médiane", form: selected.medial },
              { label: "Finale",  form: selected.final  },
            ].map(({ label, form }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-xs text-slate-600 font-semibold uppercase tracking-wider mb-2">{label}</p>
                <p className="text-4xl font-serif text-white" dir="rtl">{form}</p>
              </div>
            ))}
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-1">Exemple</p>
              <p className="text-3xl font-serif text-white" dir="rtl">{selected.example}</p>
            </div>
            <div>
              <p className="text-white font-semibold">{selected.exampleMean}</p>
              <p className="text-slate-500 text-xs mt-0.5">Mot contenant <strong className="text-amber-300">{selected.name}</strong></p>
            </div>
          </div>
          <div className="flex gap-2 justify-center">
            <button onClick={() => { const i = ARABIC_LETTERS.findIndex(x => x.name === selected.name); if (i > 0) setSelected(ARABIC_LETTERS[i - 1]); }}
              disabled={selected.name === ARABIC_LETTERS[0].name}
              className="flex items-center gap-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30">
              <ChevronLeft className="w-4 h-4"/> Précédent
            </button>
            <button onClick={() => { const i = ARABIC_LETTERS.findIndex(x => x.name === selected.name); if (i < ARABIC_LETTERS.length - 1) setSelected(ARABIC_LETTERS[i + 1]); }}
              disabled={selected.name === ARABIC_LETTERS[ARABIC_LETTERS.length - 1].name}
              className="flex items-center gap-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30">
              Suivant <ChevronRight className="w-4 h-4"/>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function HarakatModule() {
  return (
    <div className="space-y-3">
      <p className="text-slate-500 text-xs text-center">Les voyelles et signes diacritiques de l'arabe coranique</p>
      {HARAKAT.map((h, i) => (
        <motion.div key={h.name} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
          className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-emerald-500/25 transition-all">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="text-3xl font-serif text-white" dir="rtl">{h.sign}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-bold text-white text-sm">{h.name}</p>
              <span className="px-2 py-0.5 bg-blue-500/15 border border-blue-500/20 text-blue-300 text-xs rounded-lg font-bold">{h.trans}</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">{h.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function WordsModule() {
  const [search, setSearch] = useState("");
  const filtered = QURAN_WORDS.filter(w =>
    w.french.toLowerCase().includes(search.toLowerCase()) ||
    w.trans.toLowerCase().includes(search.toLowerCase()) ||
    w.arabic.includes(search)
  );
  return (
    <div className="space-y-3">
      <input type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Chercher un mot (français, translittération…)"
        className="w-full bg-white/5 border border-white/15 rounded-2xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500/40 transition-all"/>
      <p className="text-slate-600 text-xs text-center">{filtered.length} mot{filtered.length > 1 ? "s" : ""} · Fréquences basées sur le Coran complet</p>
      <div className="space-y-2">
        {filtered.map((w, i) => (
          <motion.div key={w.arabic} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.03, 0.4) }}
            className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-emerald-500/20 transition-all">
            <div className="w-16 text-center shrink-0">
              <p className="text-2xl font-serif text-white" dir="rtl">{w.arabic}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">{w.french}</p>
              <p className="text-slate-500 text-xs italic">{w.trans}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="px-2 py-1 bg-purple-500/15 border border-purple-500/20 text-purple-300 text-xs rounded-lg font-bold">{w.occurs}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function QuizModule() {
  const [questions]       = useState(() => buildQuiz());
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore]     = useState(0);
  const [finished, setFinished] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [answers, setAnswers]   = useState([]);

  const q = questions[current];
  const isCorrect = selected === q?.correct;

  const handleAnswer = useCallback((opt) => {
    if (selected !== null) return;
    setSelected(opt);
    const correct = opt === q.correct;
    if (correct) setScore(s => s + 1);
    setAnswers(prev => [...prev, { question: q.question, correct: q.correct, chosen: opt, ok: correct }]);
    setTimeout(() => {
      if (current + 1 >= questions.length) { setFinished(true); }
      else { setCurrent(c => c + 1); setSelected(null); setShowHint(false); }
    }, 1200);
  }, [selected, q, current, questions.length]);

  const restart = () => { setCurrent(0); setSelected(null); setScore(0); setFinished(false); setShowHint(false); setAnswers([]); };

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-5 py-6">
        <div className="text-6xl">{pct >= 80 ? "🏆" : pct >= 60 ? "⭐" : "📚"}</div>
        <div>
          <p className="text-3xl font-black text-white">{score} / {questions.length}</p>
          <p className={`text-lg font-semibold mt-1 ${pct >= 80 ? "text-emerald-400" : pct >= 60 ? "text-amber-400" : "text-red-400"}`}>
            {pct >= 80 ? "Excellent ! MāshāAllāh !" : pct >= 60 ? "Bien joué, continue !" : "Continue à apprendre !"}
          </p>
        </div>
        <div className="w-full max-w-xs mx-auto h-3 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }}/>
        </div>
        <div className="space-y-2 text-left max-w-xs mx-auto">
          {answers.map((a, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-2xl border text-sm ${a.ok ? "bg-emerald-500/10 border-emerald-500/25" : "bg-red-500/10 border-red-500/25"}`}>
              <span>{a.ok ? "✅" : "❌"}</span>
              <span className="text-xl font-serif" dir="rtl">{a.question}</span>
              <span className={a.ok ? "text-emerald-300" : "text-red-300"}>{a.correct}</span>
              {!a.ok && <span className="text-slate-500 text-xs">(tu as dit : {a.chosen})</span>}
            </div>
          ))}
        </div>
        <button onClick={restart} className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl shadow-lg">
          <RotateCcw className="w-4 h-4"/> Recommencer
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-xs">Question {current + 1}/{questions.length}</p>
        <div className="flex items-center gap-1.5 text-amber-400 text-sm font-bold">
          <Star className="w-4 h-4"/> {score} pts
        </div>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
          animate={{ width: `${((current) / questions.length) * 100}%` }}/>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
          className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-3xl p-6 text-center space-y-3">
          <p className="text-xs text-slate-600 uppercase tracking-wider">{q.type === "letter_name" ? "Quelle est cette lettre ?" : "Que signifie ce mot ?"}</p>
          <p className="text-7xl font-serif text-white py-2" dir="rtl">{q.question}</p>
          {showHint && <p className="text-amber-300 text-xs italic">{q.hint}</p>}
          {!showHint && (
            <button onClick={() => setShowHint(true)} className="text-slate-600 hover:text-slate-400 text-xs transition-all">💡 Indice</button>
          )}
        </motion.div>
      </AnimatePresence>
      <div className="grid grid-cols-2 gap-2.5">
        {q.options.map((opt) => {
          let bg = "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/25";
          if (selected !== null) {
            if (opt === q.correct) bg = "bg-emerald-500/25 border-emerald-500 text-emerald-200";
            else if (opt === selected && opt !== q.correct) bg = "bg-red-500/25 border-red-500 text-red-200";
            else bg = "bg-white/3 border-white/5 text-slate-600";
          }
          return (
            <motion.button key={opt} whileTap={{ scale: 0.95 }} onClick={() => handleAnswer(opt)}
              className={`py-3.5 px-3 rounded-2xl border font-semibold text-sm transition-all ${bg}`}>
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MODULE RACINES ARABES
// ════════════════════════════════════════════════════════════════════
const ROOTS = [
  { root: "ك-ت-ب", trans: "k-t-b", meaning: "écrire", words: [{ ar: "كَتَبَ", fr: "il a écrit" }, { ar: "كِتَاب", fr: "livre" }, { ar: "كَاتِب", fr: "écrivain" }, { ar: "مَكْتَبَة", fr: "bibliothèque" }] },
  { root: "ع-ل-م", trans: "ʿ-l-m", meaning: "savoir, connaissance", words: [{ ar: "عَلِمَ", fr: "il a su" }, { ar: "عِلْم", fr: "science" }, { ar: "عَالِم", fr: "savant" }, { ar: "مَعْلُوم", fr: "connu" }] },
  { root: "ق-ر-أ", trans: "q-r-ʾ", meaning: "lire, réciter", words: [{ ar: "قَرَأَ", fr: "il a lu" }, { ar: "قُرْآن", fr: "Coran" }, { ar: "قِرَاءَة", fr: "lecture" }, { ar: "قَارِئ", fr: "lecteur" }] },
  { root: "ر-ح-م", trans: "r-ḥ-m", meaning: "miséricorde, pitié", words: [{ ar: "رَحِمَ", fr: "il a eu pitié" }, { ar: "رَحْمَة", fr: "miséricorde" }, { ar: "الرَّحْمَان", fr: "Le Tout-Miséricordieux" }, { ar: "رَحِيم", fr: "Très Miséricordieux" }] },
  { root: "ع-ب-د", trans: "ʿ-b-d", meaning: "adorer, servir", words: [{ ar: "عَبَدَ", fr: "il a adoré" }, { ar: "عِبَادَة", fr: "adoration" }, { ar: "عَبْد", fr: "serviteur" }, { ar: "مَعْبُود", fr: "adoré" }] },
  { root: "ح-م-د", trans: "ḥ-m-d", meaning: "louer, rendre grâce", words: [{ ar: "حَمِدَ", fr: "il a loué" }, { ar: "حَمْد", fr: "louange" }, { ar: "مُحَمَّد", fr: "Muhammad (ﷺ)" }, { ar: "أَحْمَد", fr: "Ahmad" }] },
  { root: "س-ل-م", trans: "s-l-m", meaning: "paix, soumission", words: [{ ar: "سَلِمَ", fr: "il fut en paix" }, { ar: "سَلَام", fr: "paix" }, { ar: "إِسْلَام", fr: "Islam" }, { ar: "مُسْلِم", fr: "musulman" }] },
  { root: "ص-ل-و", trans: "ṣ-l-w", meaning: "prier, bénir", words: [{ ar: "صَلَّى", fr: "il a prié" }, { ar: "صَلَاة", fr: "prière" }, { ar: "مُصَلَّى", fr: "lieu de prière" }, { ar: "صَلَوَات", fr: "prières (pluriel)" }] },
];

function RootsModule() {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-3">
      <div className="p-3.5 bg-blue-500/8 border border-blue-500/20 rounded-2xl">
        <p className="text-blue-300 text-xs font-semibold mb-1">💡 Les racines trilitères</p>
        <p className="text-slate-500 text-xs leading-relaxed">En arabe, la plupart des mots dérivent d'une racine de 3 consonnes. Maîtriser les racines, c'est comprendre des dizaines de mots à la fois.</p>
      </div>
      {ROOTS.map((r, i) => (
        <motion.div key={r.root} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
          className={`border rounded-2xl overflow-hidden transition-all ${open === i ? "border-emerald-500/40 bg-emerald-900/20" : "border-white/10 bg-white/5"}`}>
          <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center gap-4 p-4">
            <div className="text-center w-16 shrink-0">
              <p className="text-2xl font-serif text-white" dir="rtl">{r.root.split("-").join("")}</p>
              <p className="text-xs text-slate-600">{r.trans}</p>
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-white text-sm">{r.root}</p>
              <p className="text-slate-500 text-xs italic">{r.meaning}</p>
            </div>
            <span className={`text-slate-500 transition-transform ${open === i ? "rotate-180" : ""}`}>▼</span>
          </button>
          <AnimatePresence>
            {open === i && (
              <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-4 pb-4 grid grid-cols-2 gap-2">
                  {r.words.map(w => (
                    <div key={w.ar} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                      <p className="text-xl font-serif text-emerald-300" dir="rtl">{w.ar}</p>
                      <p className="text-xs text-slate-400">{w.fr}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL — LearnScreen
// ════════════════════════════════════════════════════════════════════
const MODULES = [
  { key: "alphabet", label: "Alphabet", icon: "أ",    desc: "Les 28 lettres et leurs 4 formes" },
  { key: "harakat",  label: "Voyelles",  icon: "◌َ",  desc: "Fatha, kasra, ḍamma, sukūn…" },
  { key: "words",    label: "Mots",      icon: "📖",  desc: "Vocabulaire coranique fréquent" },
  { key: "roots",    label: "Racines",   icon: "🌱",  desc: "Racines trilitères arabes" },
  { key: "quiz",     label: "Quiz",      icon: "🎯",  desc: "Teste tes connaissances" },
];

export default function LearnScreen() {
  const [activeModule, setActiveModule] = useState(null);
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      {!activeModule ? (
        <>
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-white">🎓 Apprendre l'Arabe</h2>
            <p className="text-slate-500 text-sm">Alphabet · Voyelles · Vocabulaire coranique · Quiz</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {MODULES.map((m, i) => (
              <motion.button key={m.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                onClick={() => setActiveModule(m.key)}
                className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 hover:border-emerald-500/35 hover:bg-emerald-500/8 rounded-2xl text-left transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/12 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <span className="text-2xl font-serif" dir="rtl">{m.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">{m.label}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{m.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600"/>
              </motion.button>
            ))}
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveModule(null)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white">
              <ChevronLeft className="w-5 h-5"/>
            </button>
            <div>
              <h3 className="font-bold text-white text-lg">{MODULES.find(m => m.key === activeModule)?.label}</h3>
              <p className="text-slate-600 text-xs">{MODULES.find(m => m.key === activeModule)?.desc}</p>
            </div>
          </div>
          {activeModule === "alphabet" && <AlphabetModule/>}
          {activeModule === "harakat"  && <HarakatModule/>}
          {activeModule === "words"    && <WordsModule/>}
          {activeModule === "roots"    && <RootsModule/>}
          {activeModule === "quiz"     && <QuizModule/>}
          <div className="h-6"/>
        </motion.div>
      )}
    </div>
  );
}
