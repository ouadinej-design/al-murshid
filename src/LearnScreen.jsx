import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronRight, X, Volume2, ChevronLeft } from "lucide-react";

// ── Couleurs Tajweed ──────────────────────────────────────────────────
const TAJWEED_COLORS = {
  ham_wasl:            { color:"#AAAAAA", label:"Hamza Wasla",        desc:"Lettre de liaison, non prononcée en continuité" },
  slnt:                { color:"#AAAAAA", label:"Lettre silencieuse", desc:"Ne se prononce pas" },
  laam_shamsiyya:      { color:"#AAAAAA", label:"Laam Shamsiyya",     desc:"Le laam s'assimile à la lettre suivante" },
  madda_normal:        { color:"#537FFF", label:"Madd normal",        desc:"Extension 2 temps" },
  madda_permissible:   { color:"#4BC8F0", label:"Madd permissible",   desc:"Extension 2, 4 ou 6 temps" },
  madda_necessary:     { color:"#2B4FBB", label:"Madd nécessaire",    desc:"Extension obligatoire 6 temps" },
  madda_obligatory:    { color:"#3B6FDD", label:"Madd obligatoire",   desc:"Extension 4 ou 5 temps" },
  qalaqah:             { color:"#DD8000", label:"Qalqala",            desc:"Écho vibrant — ق ط ب ج د" },
  ikhafa:              { color:"#D070A0", label:"Ikhfāʾ",             desc:"Dissimulation nasale" },
  ikhafa_shafawi:      { color:"#D070A0", label:"Ikhfāʾ Shafawi",    desc:"Dissimulation labiale du mim" },
  idgham_ghunnah:      { color:"#22AA22", label:"Idghām + ghunna",    desc:"Assimilation avec nasalisation" },
  idgham_wo_ghunnah:   { color:"#2E8B57", label:"Idghām sans ghunna", desc:"Assimilation sans nasalisation" },
  idgham_mutajanisayn: { color:"#33AA55", label:"Idghām Mutajānisayn",desc:"Assimilation de même nature" },
  idgham_mutaqaribayn: { color:"#44BB66", label:"Idghām Mutaqāribayn",desc:"Assimilation de phonèmes proches" },
  iqlab:               { color:"#E05000", label:"Iqlāb",              desc:"Nun → Mim devant ب" },
  ghunnah:             { color:"#22AA22", label:"Ghunna",             desc:"Nasalisation 2 temps" },
};

// ── Tajweed offline par caractère ────────────────────────────────────
const SUKUN   = "\u0652";
const SHADDA  = "\u0651";
const FATHA   = "\u064E";
const DAMMA   = "\u064F";
const KASRA   = "\u0650";
const SUPERALIF = "\u0670";
const QALQALA_SET = new Set(["ق","ط","ب","ج","د"]);
const SUN_SET = new Set(["ت","ث","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ل","ن"]);
const TANWIN  = new Set(["\u064B","\u064C","\u064D"]);
const IKHFA_SET = new Set(["ت","ث","ج","د","ذ","ز","س","ش","ص","ض","ط","ظ","ف","ق","ك"]);
const VOWELS  = new Set([FATHA,DAMMA,KASRA,"\u064B","\u064C","\u064D",SUKUN,SHADDA,SUPERALIF,"\u0653","\u0654","\u0655","\u0656","\u0657","\u0658","\u065C","\u065D","\u065E","\u065F","\u0670"]);

// Grouper chaque lettre arabe avec ses diacritiques
function groupLetters(text) {
  const chars = [...text];
  const groups = [];
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (ch === " " || ch === "\u00A0") { groups.push({ base:" ", marks:"", isSpace:true }); i++; continue; }
    let marks = "";
    let j = i + 1;
    while (j < chars.length && VOWELS.has(chars[j])) { marks += chars[j]; j++; }
    groups.push({ base:ch, marks, isSpace:false });
    i = j;
  }
  return groups;
}

// Attribuer une couleur à chaque groupe
function colorizeGroup(grp, groups, idx) {
  const { base, marks } = grp;
  if (grp.isSpace) return null;
  // Qalqala : lettre + sukun
  if (QALQALA_SET.has(base) && marks.includes(SUKUN)) return "#DD8000";
  // Ghunna : ن ou م avec shadda
  if ((base === "ن" || base === "م") && marks.includes(SHADDA)) return "#22AA22";
  // Hamza Wasla
  if (base === "ٱ") return "#AAAAAA";
  // Madd : lettre madd
  if (base === "ا" || base === "و" || base === "ي") {
    const prev = groups[idx - 1];
    if (prev) {
      if (base === "ا" && prev.marks.includes(FATHA)) return "#537FFF";
      if (base === "و" && prev.marks.includes(DAMMA)) return "#537FFF";
      if (base === "ي" && prev.marks.includes(KASRA)) return "#537FFF";
    }
  }
  // SuperAlif madd
  if (marks.includes(SUPERALIF)) return "#4BC8F0";
  // Laam shamsiyya : لْ suivi d'une lettre solaire
  if (base === "ل" && marks.includes(SUKUN)) {
    const next = groups[idx + 1];
    if (next && SUN_SET.has(next.base)) return "#AAAAAA";
  }
  // Ikhfa : tanwin ou nun sakina suivi lettre ikhfa
  if ((base === "ن" && marks.includes(SUKUN)) || TANWIN.has(marks.replace(/[^\u064B-\u064D]/g,""))) {
    const next = groups[idx + 1];
    if (next && IKHFA_SET.has(next.base)) return "#D070A0";
  }
  return null;
}

// ── Audio (fiable sur mobile) ─────────────────────────────────────────
function getVerseAudioUrl(surah, verse) {
  // everyayah.com works on iOS Safari (no CORS issues)
  return `https://everyayah.com/data/Alafasy_128kbps/${String(surah).padStart(3,"0")}${String(verse).padStart(3,"0")}.mp3`;
}

function useAudio() {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(null);
  const [loading, setLoading] = useState(null);
  const unlockedRef = useRef(false);

  // iOS requires a silent play() on first user gesture to unlock audio
  const unlockAudio = useCallback(() => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    const a = new Audio();
    a.src = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
    a.play().catch(() => {});
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlaying(null);
    setLoading(null);
  }, []);

  const playAudio = useCallback((url, key, onDone) => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }
    const a = new Audio(url);
    audioRef.current = a;
    a.onended = () => { setPlaying(null); setLoading(null); onDone && onDone(); };
    a.onerror = () => { setLoading(null); setPlaying(null); onDone && onDone(); };
    // iOS Safari + Android Chrome : play() MUST be called synchronously
    // within the user gesture call stack — no await, no setTimeout
    const promise = a.play();
    if (promise !== undefined) {
      setLoading(key);
      promise
        .then(() => { setLoading(null); setPlaying(key); })
        .catch(err => {
          // iOS may block autoplay — try unlocking audio context first
          setLoading(null);
          setPlaying(null);
          console.warn("Audio blocked:", err);
        });
    } else {
      // Older iOS — no promise returned
      setPlaying(key);
    }
  }, []);

  const playVerse = useCallback((surah, verse) => {
    unlockAudio();
    const key = `${surah}:${verse}`;
    if (playing === key) { stop(); return; }
    stop();
    playAudio(getVerseAudioUrl(surah, verse), key, null);
  }, [playing, stop, playAudio, unlockAudio]);

  const playSurah = useCallback((surah, verses) => {
    unlockAudio();
    stop();
    let idx = 0;
    const playNext = () => {
      if (idx >= verses.length) { setPlaying(null); return; }
      const v = verses[idx++];
      playAudio(getVerseAudioUrl(surah, v.n), `${surah}:${v.n}`, playNext);
    };
    playNext();
  }, [stop, playAudio, unlockAudio]);

  useEffect(() => () => stop(), []);
  return { playing, loading, playVerse, playSurah, stop, unlockAudio };
}

function speakArabic(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ar-SA"; u.rate = 0.6;
  const ar = window.speechSynthesis.getVoices().find(v => v.lang.startsWith("ar"));
  if (ar) u.voice = ar;
  window.speechSynthesis.speak(u);
}

// ── Affichage lettre par lettre ────────────────────────────────────────
function LetterByLetter({ text, size = "2xl" }) {
  const groups = useMemo(() => groupLetters(text), [text]);
  return (
    <span dir="rtl" lang="ar" style={{ fontFamily:"'Amiri Quran','Scheherazade New',serif" }}>
      {groups.map((grp, idx) => {
        if (grp.isSpace) return <span key={idx}> </span>;
        const color = colorizeGroup(grp, groups, idx);
        const full = grp.base + grp.marks;
        return (
          <span key={idx}
            style={color ? { color, display:"inline" } : { color:"white", display:"inline" }}>
            {full}
          </span>
        );
      })}
    </span>
  );
}

// ── Sourates données ─────────────────────────────────────────────────
const LEARN_SURAHS = [
  { number:1,  name:"Al-Fātiḥa", arabic:"الفاتحة", juz:1, verses:[
    {n:1, ar:"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", tr:"Bismi llāhi r-raḥmāni r-raḥīm", fr:"Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux"},
    {n:2, ar:"الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", tr:"Al-ḥamdu li-llāhi rabbi l-ʿālamīn", fr:"Louange à Allah, Seigneur de l'univers"},
    {n:3, ar:"الرَّحْمَٰنِ الرَّحِيمِ", tr:"Ar-raḥmāni r-raḥīm", fr:"Le Tout Miséricordieux, le Très Miséricordieux"},
    {n:4, ar:"مَالِكِ يَوْمِ الدِّينِ", tr:"Māliki yawmi d-dīn", fr:"Maître du Jour de la rétribution"},
    {n:5, ar:"إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", tr:"Iyyāka naʿbudu wa-iyyāka nastaʿīn", fr:"C'est Toi Seul que nous adorons"},
    {n:6, ar:"اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", tr:"Ihdinā ṣ-ṣirāṭa l-mustaqīm", fr:"Guide-nous dans le droit chemin"},
    {n:7, ar:"صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", tr:"Ṣirāṭa lladhīna anʿamta ʿalayhim", fr:"Le chemin de ceux que Tu as comblés de faveurs"},
  ]},
  { number:112, name:"Al-Ikhlāṣ", arabic:"الإخلاص", juz:30, verses:[
    {n:1, ar:"قُلْ هُوَ اللَّهُ أَحَدٌ", tr:"Qul huwa llāhu aḥad", fr:"Dis : Il est Allah, Unique"},
    {n:2, ar:"اللَّهُ الصَّمَدُ", tr:"Allāhu ṣ-ṣamad", fr:"Allah, le Seul à être imploré"},
    {n:3, ar:"لَمْ يَلِدْ وَلَمْ يُولَدْ", tr:"Lam yalid wa-lam yūlad", fr:"Il n'a pas engendré et n'a pas été engendré"},
    {n:4, ar:"وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ", tr:"Wa-lam yakun lahū kufuwan aḥad", fr:"Et nul n'est égal à Lui"},
  ]},
  { number:113, name:"Al-Falaq", arabic:"الفلق", juz:30, verses:[
    {n:1, ar:"قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ", tr:"Qul aʿūdhu bi-rabbi l-falaq", fr:"Dis : Je cherche refuge auprès du Seigneur de l'aurore"},
    {n:2, ar:"مِن شَرِّ مَا خَلَقَ", tr:"Min sharri mā khalaq", fr:"contre le mal de ce qu'Il a créé"},
    {n:3, ar:"وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ", tr:"Wa-min sharri ghāsiqin idhā waqab", fr:"contre le mal de l'obscurité"},
    {n:4, ar:"وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ", tr:"Wa-min sharri n-naffāthāti fī l-ʿuqad", fr:"contre le mal de celles qui soufflent sur les nœuds"},
    {n:5, ar:"وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", tr:"Wa-min sharri ḥāsidin idhā ḥasad", fr:"contre le mal de l'envieux"},
  ]},
  { number:114, name:"An-Nās", arabic:"الناس", juz:30, verses:[
    {n:1, ar:"قُلْ أَعُوذُ بِرَبِّ النَّاسِ", tr:"Qul aʿūdhu bi-rabbi n-nās", fr:"Dis : Je cherche refuge auprès du Seigneur des hommes"},
    {n:2, ar:"مَلِكِ النَّاسِ", tr:"Maliki n-nās", fr:"du Roi des hommes"},
    {n:3, ar:"إِلَٰهِ النَّاسِ", tr:"Ilāhi n-nās", fr:"de la Divinité des hommes"},
    {n:4, ar:"مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ", tr:"Min sharri l-waswāsi l-khannās", fr:"contre le mal du tentateur furtif"},
    {n:5, ar:"الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ", tr:"Alladhī yuwaswisu fī ṣudūri n-nās", fr:"qui souffle le mal dans les poitrines des hommes"},
    {n:6, ar:"مِنَ الْجِنَّةِ وَالنَّاسِ", tr:"Mina l-jinnati wa-n-nās", fr:"qu'il soit parmi les djinns ou parmi les hommes"},
  ]},
  { number:103, name:"Al-ʿAṣr", arabic:"العصر", juz:30, verses:[
    {n:1, ar:"وَالْعَصْرِ", tr:"Wa-l-ʿaṣr", fr:"Par le Temps !"},
    {n:2, ar:"إِنَّ الْإِنسَانَ لَفِي خُسْرٍ", tr:"Inna l-insāna la-fī khusr", fr:"L'être humain est certes en perdition"},
    {n:3, ar:"إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ", tr:"Illā lladhīna āmanū wa-ʿamilū ṣ-ṣāliḥāti", fr:"sauf ceux qui croient et font de bonnes oeuvres"},
  ]},
  { number:94, name:"Ash-Sharḥ", arabic:"الشرح", juz:30, verses:[
    {n:1, ar:"أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ", tr:"Alam nashraḥ laka ṣadrak", fr:"N'avons-Nous pas déployé ta poitrine ?"},
    {n:2, ar:"وَوَضَعْنَا عَنكَ وِزْرَكَ", tr:"Wa-waḍaʿnā ʿanka wizrak", fr:"Et n'avons-Nous pas déposé ton fardeau"},
    {n:3, ar:"الَّذِي أَنقَضَ ظَهْرَكَ", tr:"Alladhī anqaḍa ẓahrak", fr:"qui alourdissait ton dos ?"},
    {n:4, ar:"وَرَفَعْنَا لَكَ ذِكْرَكَ", tr:"Wa-rafaʿnā laka dhikrak", fr:"N'avons-Nous pas élevé ta renommée ?"},
    {n:5, ar:"فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", tr:"Fa-inna maʿa l-ʿusri yusrā", fr:"En vérité, avec la difficulté vient la facilité"},
    {n:6, ar:"إِنَّ مَعَ الْعُسْرِ يُسْرًا", tr:"Inna maʿa l-ʿusri yusrā", fr:"Oui, avec la difficulté vient la facilité"},
    {n:7, ar:"فَإِذَا فَرَغْتَ فَانصَبْ", tr:"Fa-idhā faraġta fa-nṣab", fr:"Quand tu te libères, travaille ardemment"},
    {n:8, ar:"وَإِلَىٰ رَبِّكَ فَارْغَب", tr:"Wa-ilā rabbika fa-rġab", fr:"et vers ton Seigneur aspire"},
  ]},
];

// ── Alphabet ──────────────────────────────────────────────────────────
const ALPHABET = [
  {name:"Alif",  ar:"ا",isolated:"ا",  initial:"ا",   medial:"ـا",   final:"ـا",  sound:"a / ā"},
  {name:"Bāʾ",   ar:"ب",isolated:"ب",  initial:"بـ",  medial:"ـبـ",  final:"ـب",  sound:"b"},
  {name:"Tāʾ",   ar:"ت",isolated:"ت",  initial:"تـ",  medial:"ـتـ",  final:"ـت",  sound:"t"},
  {name:"Thāʾ",  ar:"ث",isolated:"ث",  initial:"ثـ",  medial:"ـثـ",  final:"ـث",  sound:"th"},
  {name:"Jīm",   ar:"ج",isolated:"ج",  initial:"جـ",  medial:"ـجـ",  final:"ـج",  sound:"dj"},
  {name:"Ḥāʾ",   ar:"ح",isolated:"ح",  initial:"حـ",  medial:"ـحـ",  final:"ـح",  sound:"ḥ (gutturale)"},
  {name:"Khāʾ",  ar:"خ",isolated:"خ",  initial:"خـ",  medial:"ـخـ",  final:"ـخ",  sound:"kh"},
  {name:"Dāl",   ar:"د",isolated:"د",  initial:"د",   medial:"ـد",   final:"ـد",  sound:"d"},
  {name:"Dhāl",  ar:"ذ",isolated:"ذ",  initial:"ذ",   medial:"ـذ",   final:"ـذ",  sound:"dh"},
  {name:"Rāʾ",   ar:"ر",isolated:"ر",  initial:"ر",   medial:"ـر",   final:"ـر",  sound:"r (roulé)"},
  {name:"Zayn",  ar:"ز",isolated:"ز",  initial:"ز",   medial:"ـز",   final:"ـز",  sound:"z"},
  {name:"Sīn",   ar:"س",isolated:"س",  initial:"سـ",  medial:"ـسـ",  final:"ـس",  sound:"s"},
  {name:"Shīn",  ar:"ش",isolated:"ش",  initial:"شـ",  medial:"ـشـ",  final:"ـش",  sound:"sh"},
  {name:"Ṣād",   ar:"ص",isolated:"ص",  initial:"صـ",  medial:"ـصـ",  final:"ـص",  sound:"ṣ (emphatique)"},
  {name:"Ḍād",   ar:"ض",isolated:"ض",  initial:"ضـ",  medial:"ـضـ",  final:"ـض",  sound:"ḍ (emphatique)"},
  {name:"Ṭāʾ",   ar:"ط",isolated:"ط",  initial:"طـ",  medial:"ـطـ",  final:"ـط",  sound:"ṭ (emphatique)"},
  {name:"Ẓāʾ",   ar:"ظ",isolated:"ظ",  initial:"ظـ",  medial:"ـظـ",  final:"ـظ",  sound:"ẓ (emphatique)"},
  {name:"ʿAyn",  ar:"ع",isolated:"ع",  initial:"عـ",  medial:"ـعـ",  final:"ـع",  sound:"ʿ (constriction)"},
  {name:"Ghayn", ar:"غ",isolated:"غ",  initial:"غـ",  medial:"ـغـ",  final:"ـغ",  sound:"gh"},
  {name:"Fāʾ",   ar:"ف",isolated:"ف",  initial:"فـ",  medial:"ـفـ",  final:"ـف",  sound:"f"},
  {name:"Qāf",   ar:"ق",isolated:"ق",  initial:"قـ",  medial:"ـقـ",  final:"ـق",  sound:"q (profond)"},
  {name:"Kāf",   ar:"ك",isolated:"ك",  initial:"كـ",  medial:"ـكـ",  final:"ـك",  sound:"k"},
  {name:"Lām",   ar:"ل",isolated:"ل",  initial:"لـ",  medial:"ـلـ",  final:"ـل",  sound:"l"},
  {name:"Mīm",   ar:"م",isolated:"م",  initial:"مـ",  medial:"ـمـ",  final:"ـم",  sound:"m"},
  {name:"Nūn",   ar:"ن",isolated:"ن",  initial:"نـ",  medial:"ـنـ",  final:"ـن",  sound:"n"},
  {name:"Hāʾ",   ar:"ه",isolated:"ه",  initial:"هـ",  medial:"ـهـ",  final:"ـه",  sound:"h"},
  {name:"Wāw",   ar:"و",isolated:"و",  initial:"و",   medial:"ـو",   final:"ـو",  sound:"w / ū"},
  {name:"Yāʾ",   ar:"ي",isolated:"ي",  initial:"يـ",  medial:"ـيـ",  final:"ـي",  sound:"y / ī"},
];

const HARAKAT = [
  {symbol:"َ", name:"Fatḥa",       sound:"a court",        example:"بَ", tr:"ba"},
  {symbol:"ِ", name:"Kasra",       sound:"i court",        example:"بِ", tr:"bi"},
  {symbol:"ُ", name:"Ḍamma",      sound:"u court",        example:"بُ", tr:"bu"},
  {symbol:"ً", name:"Tanwīn fatḥ",sound:"an",             example:"بً", tr:"ban"},
  {symbol:"ٍ", name:"Tanwīn kasr",sound:"in",             example:"بٍ", tr:"bin"},
  {symbol:"ٌ", name:"Tanwīn ḍamm",sound:"un",            example:"بٌ", tr:"bun"},
  {symbol:"ْ", name:"Sukūn",      sound:"pas de voyelle", example:"بْ", tr:"b"},
  {symbol:"ّ", name:"Shadda",     sound:"lettre doublée", example:"بّ", tr:"bb"},
];

// ── SurahCard ──────────────────────────────────────────────────────────
function SurahCard({ surah, audio }) {
  const [open, setOpen] = useState(false);
  const [showTr, setShowTr] = useState(true);
  const [showFr, setShowFr] = useState(false);

  return (
    <div className={`rounded-3xl border overflow-hidden transition-all ${open ? "border-emerald-500/30 bg-emerald-900/8" : "border-white/10 bg-white/4 hover:border-white/20"}`}>
      <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setOpen(o => !o)}>
        <div className="w-11 h-11 rounded-xl bg-emerald-500/12 border border-emerald-500/20 flex flex-col items-center justify-center shrink-0">
          <span className="text-emerald-400 font-black text-sm">{surah.number}</span>
          <span className="text-emerald-600/60 text-[9px]">J.{surah.juz}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">{surah.name}</p>
          <p className="text-slate-500 text-xs">{surah.verses.length} versets</p>
        </div>
        <button onClick={e => { e.stopPropagation(); audio.playSurah(surah.number, surah.verses); }}
          className="p-2 bg-emerald-500/12 text-emerald-400 rounded-xl hover:bg-emerald-500/25 transition-all mr-1">
          <Volume2 className="w-4 h-4"/>
        </button>
        <p className="text-xl font-serif text-slate-500" dir="rtl">{surah.arabic}</p>
        <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ml-1 ${open ? "rotate-90" : ""}`}/>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
            {/* Controls */}
            <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
              <button onClick={() => audio.playSurah(surah.number, surah.verses)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/12 text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-500/25 transition-all border border-emerald-500/15">
                <Play className="w-3 h-3"/> Écouter tout
              </button>
              <button onClick={audio.stop} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/6 text-slate-400 rounded-xl text-xs hover:bg-white/12 transition-all">
                <X className="w-3 h-3"/> Stop
              </button>
              <button onClick={() => setShowTr(s => !s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showTr ? "bg-blue-500/18 text-blue-300 border border-blue-500/25" : "bg-white/4 text-slate-600"}`}>
                ABC
              </button>
              <button onClick={() => setShowFr(s => !s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showFr ? "bg-purple-500/18 text-purple-300 border border-purple-500/25" : "bg-white/4 text-slate-600"}`}>
                FR
              </button>
            </div>

            {/* Tajweed legend */}
            <div className="px-4 pb-3 flex flex-wrap gap-1">
              {[["#DD8000","Qalqala"],["#537FFF","Madd"],["#22AA22","Ghunna"],["#D070A0","Ikhfāʾ"],["#E05000","Iqlāb"],["#AAAAAA","Silence"]].map(([color,label]) => (
                <span key={label} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-white/4 border border-white/8">
                  <span className="w-1.5 h-1.5 rounded-full" style={{background:color}}/>
                  <span className="text-slate-600">{label}</span>
                </span>
              ))}
            </div>

            {/* Verses */}
            <div className="space-y-3 px-4 pb-5">
              {surah.verses.map((v, i) => {
                const key = `${surah.number}:${v.n}`;
                const isPlaying = audio.playing === key;
                const isLoading = audio.loading === key;
                return (
                  <motion.div key={v.n} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                    className={`p-4 rounded-2xl border transition-all ${isPlaying ? "bg-emerald-900/18 border-emerald-500/30" : "bg-white/3 border-white/8"}`}>
                    <div className="flex items-start gap-3 mb-2">
                      <button onClick={() => audio.playVerse(surah.number, v.n)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold transition-all mt-1 ${
                          isPlaying ? "bg-emerald-500 text-white" :
                          isLoading ? "bg-blue-500/20 text-blue-300" :
                          "bg-white/8 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400"
                        }`}>
                        {isLoading ? (
                          <motion.div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full" animate={{rotate:360}} transition={{duration:0.8,repeat:Infinity,ease:"linear"}}/>
                        ) : isPlaying ? <Pause className="w-3.5 h-3.5"/> : <span className="text-xs">{v.n}</span>}
                      </button>
                      {/* Texte lettre par lettre avec couleurs tajweed */}
                      <div className="flex-1 text-right" style={{fontSize:"clamp(1.3rem,4.5vw,1.8rem)", lineHeight:"3"}}>
                        <LetterByLetter text={v.ar}/>
                      </div>
                    </div>
                    {isPlaying && (
                      <div className="flex justify-center gap-1 mb-2">
                        {[...Array(4)].map((_,j) => (
                          <motion.div key={j} className="w-1 bg-emerald-400 rounded-full"
                            animate={{height:["3px","12px","3px"]}} transition={{duration:0.5,delay:j*0.1,repeat:Infinity}}/>
                        ))}
                      </div>
                    )}
                    {showTr && <p className="text-xs text-blue-300/65 italic leading-relaxed mt-1 text-right" dir="ltr">{v.tr}</p>}
                    {showFr && <p className="text-sm text-slate-400 leading-relaxed mt-1.5 bg-white/3 rounded-xl px-3 py-2">{v.fr}</p>}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── TajweedTab ─────────────────────────────────────────────────────────
function TajweedTab() {
  const [sel, setSel] = useState(null);
  return (
    <div className="space-y-4">
      <div className="p-4 bg-emerald-900/18 border border-emerald-500/18 rounded-2xl">
        <p className="text-emerald-300 font-bold text-sm mb-1">🎨 Code couleur du Tajweed</p>
        <p className="text-slate-500 text-xs">Chaque couleur correspond à une règle de récitation. Les couleurs sont appliquées lettre par lettre.</p>
      </div>
      <div className="space-y-2">
        {Object.entries(TAJWEED_COLORS).map(([cls, info]) => (
          <button key={cls} onClick={() => setSel(sel===cls ? null : cls)}
            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border transition-all text-left ${sel===cls ? "border-white/25 bg-white/6" : "border-white/8 bg-white/3 hover:border-white/18"}`}>
            <div className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center" style={{background:`${info.color}20`,border:`1px solid ${info.color}40`}}>
              <div className="w-3.5 h-3.5 rounded-full" style={{background:info.color}}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm">{info.label}</p>
              <AnimatePresence>
                {sel===cls && <motion.p initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="text-slate-400 text-xs mt-0.5 overflow-hidden">{info.desc}</motion.p>}
              </AnimatePresence>
            </div>
            <span className="text-slate-700 text-xs">{sel===cls ? "▲" : "▼"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── AlphabetTab ────────────────────────────────────────────────────────
function AlphabetTab() {
  const [sel, setSel] = useState(null);

  // Group alphabet into rows of 4 for inline panel insertion
  const rows = [];
  for (let i = 0; i < ALPHABET.length; i += 4) {
    rows.push(ALPHABET.slice(i, i + 4));
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-900/14 border border-blue-500/18 rounded-2xl">
        <p className="text-blue-300 font-bold text-sm mb-1">الحروف الهجائية — 28 lettres</p>
        <p className="text-slate-500 text-xs">Appuie sur une lettre pour voir ses 4 formes et entendre sa prononciation.</p>
      </div>

      {rows.map((row, rowIdx) => {
        const selInRow = row.find(l => l.name === sel?.name);
        return (
          <div key={rowIdx}>
            {/* Row of 4 letters */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {row.map(l => (
                <motion.button key={l.name}
                  onClick={() => { setSel(sel?.name === l.name ? null : l); speakArabic(l.ar); }}
                  className={`p-3 rounded-2xl border text-center transition-all ${sel?.name === l.name ? "bg-blue-600 border-blue-400" : "bg-slate-800 border-slate-600 hover:border-slate-400"}`}>
                  <p className="text-2xl font-serif mb-0.5" style={{color:"white"}} dir="rtl">{l.ar}</p>
                  <p className="text-[10px] text-slate-300">{l.name}</p>
                </motion.button>
              ))}
            </div>

            {/* Detail panel — appears inline under the row containing selected letter */}
            <AnimatePresence>
              {selInRow && (
                <motion.div
                  initial={{opacity:0, height:0}} animate={{opacity:1, height:"auto"}} exit={{opacity:0, height:0}}
                  className="overflow-hidden mb-2">
                  <div className="p-4 bg-blue-900/30 border border-blue-500/40 rounded-2xl">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-blue-600/40 border border-blue-400/50 flex items-center justify-center shrink-0">
                        <span className="text-4xl font-serif" style={{color:"white"}}>{sel.ar}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-xl" style={{color:"white"}}>{sel.name}</p>
                        <p className="text-blue-300 text-sm">Son : <span className="font-bold">{sel.sound}</span></p>
                        <button onClick={() => speakArabic(sel.ar)}
                          className="flex items-center gap-1 mt-1.5 px-3 py-1 bg-blue-500/30 border border-blue-400/40 rounded-lg text-xs text-blue-300 hover:bg-blue-500/50 active:scale-95 transition-all">
                          <Volume2 className="w-3 h-3"/> Écouter
                        </button>
                      </div>
                    </div>
                    {/* 4 forms */}
                    <div className="grid grid-cols-4 gap-2">
                      {[{label:"Isolée",text:sel.isolated},{label:"Initiale",text:sel.initial},{label:"Médiane",text:sel.medial},{label:"Finale",text:sel.final}].map(f => (
                        <div key={f.label} className="bg-slate-800 rounded-xl p-2.5 text-center border border-slate-600">
                          <p className="text-[10px] text-slate-400 mb-1">{f.label}</p>
                          <p className="text-2xl font-serif" style={{color:"white"}} dir="rtl">{f.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ── HarakatTab ─────────────────────────────────────────────────────────
function HarakatTab() {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-purple-900/14 border border-purple-500/18 rounded-2xl">
        <p className="text-purple-300 font-bold text-sm mb-1">التشكيل — Voyelles et signes</p>
        <p className="text-slate-500 text-xs">Les voyelles guident la prononciation exacte dans la récitation coranique.</p>
      </div>
      <div className="space-y-2">
        {HARAKAT.map((h,i) => (
          <motion.div key={h.name} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
            className="flex items-center gap-4 p-4 bg-white/4 border border-white/8 rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/12 border border-purple-500/22 flex items-center justify-center shrink-0">
              <span className="text-3xl font-serif text-white" dir="rtl">{h.example}</span>
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">{h.name}</p>
              <p className="text-purple-300 text-xs">{h.sound}</p>
              <p className="text-slate-600 text-xs mt-0.5">→ <span className="text-slate-400 font-semibold">{h.tr}</span></p>
            </div>
            <span className="text-4xl font-serif text-slate-400">{h.symbol}</span>
          </motion.div>
        ))}
        <div className="p-4 bg-white/4 border border-white/10 rounded-2xl">
          <p className="text-white font-bold text-sm mb-2">Exemple : بِسْمِ اللَّهِ</p>
          <div className="text-center py-2" style={{fontSize:"2rem"}}>
            <LetterByLetter text="بِسْمِ اللَّهِ"/>
          </div>
          <p className="text-blue-300 text-xs text-center italic mt-1">Bismi llāh — kasra (i) + sukūn + kasra</p>
        </div>
      </div>
    </div>
  );
}

// ── MAIN ───────────────────────────────────────────────────────────────
const TABS = [
  {key:"surahs",  label:"📖 Sourates"},
  {key:"tajweed", label:"🎨 Tajweed"},
  {key:"alphabet",label:"ح Alphabet"},
  {key:"harakat", label:"◌ Voyelles"},
];

export default function LearnScreen() {
  const [tab, setTab] = useState("surahs");
  const audio = useAudio();
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/14 text-blue-400 text-xs font-bold border border-blue-500/22 uppercase tracking-wider mb-2">
          🎓 Apprentissage coranique
        </div>
        <h2 className="text-2xl font-black text-white">تَعَلَّمِ الْقُرْآنَ</h2>
        <p className="text-slate-600 text-xs mt-0.5">Sourates colorées · Tajweed lettre par lettre · Audio Alafasy</p>
      </div>

      {audio.playing && (
        <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}}
          className="flex items-center gap-3 px-4 py-3 bg-emerald-900/25 border border-emerald-500/28 rounded-2xl">
          <div className="flex gap-1">
            {[...Array(4)].map((_,i) => (
              <motion.div key={i} className="w-1 bg-emerald-400 rounded-full"
                animate={{height:["4px","14px","4px"]}} transition={{duration:0.5,delay:i*0.1,repeat:Infinity}}/>
            ))}
          </div>
          <p className="text-emerald-300 text-sm font-semibold flex-1">Récitation Alafasy en cours…</p>
          <button onClick={audio.stop} className="p-1.5 hover:bg-white/8 rounded-lg text-slate-400 hover:text-white transition-all"><X className="w-4 h-4"/></button>
        </motion.div>
      )}

      <div className="flex bg-white/4 rounded-2xl p-1 border border-white/8 gap-0.5 overflow-x-auto">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${tab===t.key ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="pb-8">
          {tab==="surahs"   && (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 italic text-center">Couleurs tajweed lettre par lettre · Audio Mishary Alafasy</p>
              {LEARN_SURAHS.map(s => <SurahCard key={s.number} surah={s} audio={audio}/>)}
            </div>
          )}
          {tab==="tajweed"  && <TajweedTab/>}
          {tab==="alphabet" && <AlphabetTab/>}
          {tab==="harakat"  && <HarakatTab/>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
