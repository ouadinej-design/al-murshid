import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, ChevronRight, X, Volume2, Star, RotateCcw, CheckCircle, Trophy, Zap } from "lucide-react";

// ═══════════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════════
function ls(k, d) { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : d; } catch { return d; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

// ═══════════════════════════════════════════════════════
// TAJWEED OFFLINE
// ═══════════════════════════════════════════════════════
const VOWELS_SET = new Set(["\u064E","\u064F","\u0650","\u0651","\u0652","\u0653","\u0654","\u0655","\u0656","\u0657","\u0658","\u0659","\u065A","\u065B","\u065C","\u065D","\u065E","\u065F","\u0670","\u064B","\u064C","\u064D"]);
const QALQALA = new Set(["ق","ط","ب","ج","د"]);
const SUN = new Set(["ت","ث","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ل","ن"]);

function groupLetters(text) {
  const chars = [...text], groups = [];
  let i = 0;
  while (i < chars.length) {
    const ch = chars[i];
    if (ch === " ") { groups.push({ base:" ", marks:"", isSpace:true }); i++; continue; }
    let marks = "", j = i + 1;
    while (j < chars.length && VOWELS_SET.has(chars[j])) { marks += chars[j]; j++; }
    groups.push({ base:ch, marks, isSpace:false }); i = j;
  }
  return groups;
}

function colorizeGroup(grp, groups, idx) {
  const { base, marks } = grp;
  if (grp.isSpace) return null;
  if (QALQALA.has(base) && marks.includes("\u0652")) return "#DD8000";
  if ((base === "ن" || base === "م") && marks.includes("\u0651")) return "#22AA22";
  if (base === "ٱ") return "#AAAAAA";
  if (base === "ا" || base === "و" || base === "ي") {
    const prev = groups[idx-1];
    if (prev) {
      if (base === "ا" && prev.marks.includes("\u064E")) return "#537FFF";
      if (base === "و" && prev.marks.includes("\u064F")) return "#537FFF";
      if (base === "ي" && prev.marks.includes("\u0650")) return "#537FFF";
    }
  }
  if (marks.includes("\u0670")) return "#4BC8F0";
  if (base === "ل" && marks.includes("\u0652")) { const next = groups[idx+1]; if (next && SUN.has(next.base)) return "#AAAAAA"; }
  return null;
}

function LetterByLetter({ text, size = "1.5rem" }) {
  const groups = useMemo(() => groupLetters(text), [text]);
  return (
    <span dir="rtl" lang="ar" style={{ fontFamily:"'Amiri Quran','Scheherazade New',serif", fontSize:size }}>
      {groups.map((grp, idx) => {
        if (grp.isSpace) return <span key={idx}> </span>;
        const color = colorizeGroup(grp, groups, idx);
        return <span key={idx} style={{ color: color || "white" }}>{grp.base + grp.marks}</span>;
      })}
    </span>
  );
}

// ═══════════════════════════════════════════════════════
// DONNÉES — Sourates d'apprentissage
// ═══════════════════════════════════════════════════════
const LEARN_SURAHS = [
  { number:1,  name:"Al-Fātiḥa", arabic:"الفاتحة", juz:1, verses:[
    {n:1, ar:"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", tr:"Bismi llāhi r-raḥmāni r-raḥīm", fr:"Au nom d'Allah, le Tout Miséricordieux"},
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
    {n:1, ar:"قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ", tr:"Qul aʿūdhu bi-rabbi l-falaq", fr:"Je cherche refuge auprès du Seigneur de l'aurore"},
    {n:2, ar:"مِن شَرِّ مَا خَلَقَ", tr:"Min sharri mā khalaq", fr:"contre le mal de ce qu'Il a créé"},
    {n:3, ar:"وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ", tr:"Wa-min sharri ghāsiqin idhā waqab", fr:"contre le mal de l'obscurité"},
    {n:4, ar:"وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ", tr:"Wa-min sharri n-naffāthāti fī l-ʿuqad", fr:"contre le mal de celles qui soufflent sur les nœuds"},
    {n:5, ar:"وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ", tr:"Wa-min sharri ḥāsidin idhā ḥasad", fr:"contre le mal de l'envieux"},
  ]},
  { number:114, name:"An-Nās", arabic:"الناس", juz:30, verses:[
    {n:1, ar:"قُلْ أَعُوذُ بِرَبِّ النَّاسِ", tr:"Qul aʿūdhu bi-rabbi n-nās", fr:"Je cherche refuge auprès du Seigneur des hommes"},
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
];

// ═══════════════════════════════════════════════════════
// DONNÉES — Alphabet
// ═══════════════════════════════════════════════════════
const ALPHABET = [
  {name:"Alif",  ar:"ا",i:"ا",  ini:"ا",   med:"ـا",   fin:"ـا",  sound:"a / ā", group:"lunaire"},
  {name:"Bāʾ",   ar:"ب",i:"ب",  ini:"بـ",  med:"ـبـ",  fin:"ـب",  sound:"b", group:"lunaire"},
  {name:"Tāʾ",   ar:"ت",i:"ت",  ini:"تـ",  med:"ـتـ",  fin:"ـت",  sound:"t", group:"solaire"},
  {name:"Thāʾ",  ar:"ث",i:"ث",  ini:"ثـ",  med:"ـثـ",  fin:"ـث",  sound:"th", group:"solaire"},
  {name:"Jīm",   ar:"ج",i:"ج",  ini:"جـ",  med:"ـجـ",  fin:"ـج",  sound:"dj", group:"lunaire"},
  {name:"Ḥāʾ",   ar:"ح",i:"ح",  ini:"حـ",  med:"ـحـ",  fin:"ـح",  sound:"ḥ", group:"lunaire"},
  {name:"Khāʾ",  ar:"خ",i:"خ",  ini:"خـ",  med:"ـخـ",  fin:"ـخ",  sound:"kh", group:"lunaire"},
  {name:"Dāl",   ar:"د",i:"د",  ini:"د",   med:"ـد",   fin:"ـد",  sound:"d", group:"solaire"},
  {name:"Dhāl",  ar:"ذ",i:"ذ",  ini:"ذ",   med:"ـذ",   fin:"ـذ",  sound:"dh", group:"solaire"},
  {name:"Rāʾ",   ar:"ر",i:"ر",  ini:"ر",   med:"ـر",   fin:"ـر",  sound:"r", group:"solaire"},
  {name:"Zayn",  ar:"ز",i:"ز",  ini:"ز",   med:"ـز",   fin:"ـز",  sound:"z", group:"solaire"},
  {name:"Sīn",   ar:"س",i:"س",  ini:"سـ",  med:"ـسـ",  fin:"ـس",  sound:"s", group:"solaire"},
  {name:"Shīn",  ar:"ش",i:"ش",  ini:"شـ",  med:"ـشـ",  fin:"ـش",  sound:"sh", group:"solaire"},
  {name:"Ṣād",   ar:"ص",i:"ص",  ini:"صـ",  med:"ـصـ",  fin:"ـص",  sound:"ṣ", group:"solaire"},
  {name:"Ḍād",   ar:"ض",i:"ض",  ini:"ضـ",  med:"ـضـ",  fin:"ـض",  sound:"ḍ", group:"solaire"},
  {name:"Ṭāʾ",   ar:"ط",i:"ط",  ini:"طـ",  med:"ـطـ",  fin:"ـط",  sound:"ṭ", group:"solaire"},
  {name:"Ẓāʾ",   ar:"ظ",i:"ظ",  ini:"ظـ",  med:"ـظـ",  fin:"ـظ",  sound:"ẓ", group:"solaire"},
  {name:"ʿAyn",  ar:"ع",i:"ع",  ini:"عـ",  med:"ـعـ",  fin:"ـع",  sound:"ʿ", group:"lunaire"},
  {name:"Ghayn", ar:"غ",i:"غ",  ini:"غـ",  med:"ـغـ",  fin:"ـغ",  sound:"gh", group:"lunaire"},
  {name:"Fāʾ",   ar:"ف",i:"ف",  ini:"فـ",  med:"ـفـ",  fin:"ـف",  sound:"f", group:"lunaire"},
  {name:"Qāf",   ar:"ق",i:"ق",  ini:"قـ",  med:"ـقـ",  fin:"ـق",  sound:"q", group:"lunaire"},
  {name:"Kāf",   ar:"ك",i:"ك",  ini:"كـ",  med:"ـكـ",  fin:"ـك",  sound:"k", group:"lunaire"},
  {name:"Lām",   ar:"ل",i:"ل",  ini:"لـ",  med:"ـلـ",  fin:"ـل",  sound:"l", group:"solaire"},
  {name:"Mīm",   ar:"م",i:"م",  ini:"مـ",  med:"ـمـ",  fin:"ـم",  sound:"m", group:"lunaire"},
  {name:"Nūn",   ar:"ن",i:"ن",  ini:"نـ",  med:"ـنـ",  fin:"ـن",  sound:"n", group:"solaire"},
  {name:"Hāʾ",   ar:"ه",i:"ه",  ini:"هـ",  med:"ـهـ",  fin:"ـه",  sound:"h", group:"lunaire"},
  {name:"Wāw",   ar:"و",i:"و",  ini:"و",   med:"ـو",   fin:"ـو",  sound:"w / ū", group:"lunaire"},
  {name:"Yāʾ",   ar:"ي",i:"ي",  ini:"يـ",  med:"ـيـ",  fin:"ـي",  sound:"y / ī", group:"lunaire"},
];

const HARAKAT = [
  {symbol:"َ", name:"Fatḥa",       sound:"a court", example:"بَ", tr:"ba"},
  {symbol:"ِ", name:"Kasra",       sound:"i court", example:"بِ", tr:"bi"},
  {symbol:"ُ", name:"Ḍamma",      sound:"u court", example:"بُ", tr:"bu"},
  {symbol:"ً", name:"Tanwīn fatḥ",sound:"an",      example:"بً", tr:"ban"},
  {symbol:"ٍ", name:"Tanwīn kasr",sound:"in",      example:"بٍ", tr:"bin"},
  {symbol:"ٌ", name:"Tanwīn ḍamm",sound:"un",      example:"بٌ", tr:"bun"},
  {symbol:"ْ", name:"Sukūn",      sound:"silence", example:"بْ", tr:"b"},
  {symbol:"ّ", name:"Shadda",     sound:"double",  example:"بّ", tr:"bb"},
];

// ═══════════════════════════════════════════════════════
// DONNÉES — Leçons progressives (méthode Madinah/Al-Azhar)
// ═══════════════════════════════════════════════════════
const LESSONS = [
  {
    id:1, title:"Les voyelles courtes", emoji:"🔤", duration:"5 min",
    desc:"Fatha (a), Kasra (i), Damma (u) — la base de toute lecture arabe",
    theory:[
      {title:"La Fatha — َ", ar:"بَ تَ نَ", tr:"ba — ta — na", text:"La fatha se place AU-DESSUS de la lettre. Elle donne le son 'a' court.", color:"#e5b400"},
      {title:"La Kasra — ِ", ar:"بِ تِ نِ", tr:"bi — ti — ni", text:"La kasra se place EN-DESSOUS de la lettre. Elle donne le son 'i' court.", color:"#537FFF"},
      {title:"La Damma — ُ", ar:"بُ تُ نُ", tr:"bu — tu — nu", text:"La damma se place AU-DESSUS de la lettre. Elle donne le son 'u' court.", color:"#22AA22"},
    ],
    exercise:[
      {ar:"بَ",correct:"ba",options:["ba","bi","bu","ab"]},
      {ar:"تِ",correct:"ti",options:["ta","ti","tu","it"]},
      {ar:"نُ",correct:"nu",options:["na","ni","nu","un"]},
      {ar:"كَ",correct:"ka",options:["ka","ki","ku","ak"]},
      {ar:"رِ",correct:"ri",options:["ra","ri","ru","ir"]},
    ]
  },
  {
    id:2, title:"Le Sukūn et la Shadda", emoji:"🔇", duration:"5 min",
    desc:"Sukūn = pas de voyelle, Shadda = lettre doublée",
    theory:[
      {title:"Le Sukūn — ْ", ar:"بْ", tr:"b (silence)", text:"Le sukūn signifie que la lettre n'a PAS de voyelle. On coupe le son.", color:"#AAAAAA"},
      {title:"La Shadda — ّ", ar:"بّ", tr:"bb (double)", text:"La shadda double la lettre. On la prononce avec emphase, comme 'bb' ou 'nn'.", color:"#DD8000"},
      {title:"Exemple", ar:"إِنَّ", tr:"inna", text:"Le ن avec shadda = 'nn'. Très fréquent dans le Coran.", color:"#DD8000"},
    ],
    exercise:[
      {ar:"بْ",correct:"silence",options:["ba","silence","bb","ib"]},
      {ar:"نّ",correct:"nn",options:["n","na","nn","an"]},
      {ar:"مّ",correct:"mm",options:["m","ma","mm","um"]},
      {ar:"لْ",correct:"silence",options:["la","li","silence","al"]},
    ]
  },
  {
    id:3, title:"Les voyelles longues (Madd)", emoji:"🔵", duration:"8 min",
    desc:"Extension du son sur 2 temps — ā, ī, ū",
    theory:[
      {title:"Alif madd — ā", ar:"بَا", tr:"bā (long)", text:"Fatha + ا = son 'aa' long. Ex: اللهُ = Allāhu", color:"#537FFF"},
      {title:"Yā madd — ī", ar:"بِي", tr:"bī (long)", text:"Kasra + ي = son 'ii' long. Ex: فِي = fī (dans)", color:"#4BC8F0"},
      {title:"Wāw madd — ū", ar:"بُو", tr:"bū (long)", text:"Damma + و = son 'uu' long. Ex: رَسُولُ = rasūlu", color:"#3B6FDD"},
    ],
    exercise:[
      {ar:"بَا",correct:"bā",options:["ba","bā","bi","bī"]},
      {ar:"فِي",correct:"fī",options:["fi","fu","fā","fī"]},
      {ar:"نُو",correct:"nū",options:["nu","nā","nū","nī"]},
      {ar:"قَا",correct:"qā",options:["qa","qi","qā","qū"]},
    ]
  },
  {
    id:4, title:"Lام solaire et lunaire", emoji:"☀️", duration:"8 min",
    desc:"Le ل du article ال change selon la lettre qui suit",
    theory:[
      {title:"Les lettres lunaires", ar:"الْقَمَرُ", tr:"al-qamaru", text:"Devant les 14 lettres LUNAIRES, le ل se prononce. Ex: الكِتَاب = al-kitāb", color:"#4BC8F0"},
      {title:"Les lettres solaires", ar:"الشَّمْسُ", tr:"ash-shamsu", text:"Devant les 14 lettres SOLAIRES, le ل s'assimile. Ex: الشَّمْس = ash-shams (pas 'al-shams')", color:"#DD8000"},
      {title:"Astuce mémorisation", ar:"ت ث د ذ ر ز س ش ص ض ط ظ ل ن", tr:"les 14 solaires", text:"Toutes les lettres proches phonétiquement de la langue (dentales, sifflantes, latérales).", color:"#22AA22"},
    ],
    exercise:[
      {ar:"الرَّحِيمُ",correct:"ar-raḥīmu",options:["al-raḥīmu","ar-raḥīmu","al-rāḥim","ar-rāḥim"]},
      {ar:"الْكِتَابُ",correct:"al-kitābu",options:["ak-kitābu","al-kitābu","ar-kitābu","as-kitābu"]},
      {ar:"النُّورُ",correct:"an-nūru",options:["al-nūru","an-nūru","am-nūru","ar-nūru"]},
    ]
  },
  {
    id:5, title:"Qalqala — l'écho vibrant", emoji:"🟠", duration:"5 min",
    desc:"Les 5 lettres qui rebondissent quand elles ont un sukūn",
    theory:[
      {title:"Les 5 lettres de Qalqala", ar:"قَطْبٌ جَدٌّ", tr:"qaṭbun jaddun", text:"ق ط ب ج د — retenez le mot مَجِيد ou قَطَبَ جَد. Quand ces lettres portent un sukūn, elles produisent un écho vibrant.", color:"#DD8000"},
      {title:"Exemple dans le Coran", ar:"قُلْ هُوَ اللَّهُ أَحَدٌ", tr:"Qul huwa llāhu aḥad", text:"Le ق dans قُلْ, le د dans أَحَدٌ — tous deux produisent la Qalqala.", color:"#DD8000"},
    ],
    exercise:[
      {ar:"قُلْ",correct:"Qalqala sur ق",options:["Pas de Qalqala","Qalqala sur ق","Qalqala sur ل","Ghunna"]},
      {ar:"أَحَدٌ",correct:"Qalqala sur د",options:["Qalqala sur أ","Pas de Qalqala","Qalqala sur د","Madd"]},
      {ar:"بِسْمِ",correct:"Pas de Qalqala",options:["Qalqala sur ب","Qalqala sur س","Qalqala sur م","Pas de Qalqala"]},
    ]
  },
  {
    id:6, title:"Ghunna — la nasalisation", emoji:"🟢", duration:"5 min",
    desc:"Le bourdonnement nasal du nūn et mīm avec shadda",
    theory:[
      {title:"Ghunna = 2 temps nasaux", ar:"إِنَّ — ثُمَّ", tr:"inna — thumma", text:"Quand ن ou م portent une shadda, on nasalise 2 temps (environ 1 seconde). Comme 'inn...' ou 'umm...'.", color:"#22AA22"},
      {title:"Ghunna dans le Coran", ar:"إِنَّا أَعْطَيْنَاكَ", tr:"innā aʿṭaynāka", text:"Le ن de إِنَّا se prononce avec un bourdonnement nasal de 2 temps avant le ā.", color:"#22AA22"},
    ],
    exercise:[
      {ar:"إِنَّ",correct:"Ghunna",options:["Ikhfa","Ghunna","Qalqala","Madd"]},
      {ar:"ثُمَّ",correct:"Ghunna",options:["Ghunna","Idgham","Iqlab","Madd"]},
      {ar:"مَنْ",correct:"Pas de Ghunna",options:["Ghunna","Pas de Ghunna","Ikhfa","Qalqala"]},
    ]
  },
  {
    id:7, title:"Lecture de mots coraniques", emoji:"📖", duration:"10 min",
    desc:"Synthèse — applique toutes les règles sur des mots du Coran",
    theory:[
      {title:"بِسْمِ اللَّهِ", ar:"بِسْمِ اللَّهِ", tr:"Bismi llāhi", text:"Kasra sous ب → 'bi'. Sukūn sur س → 'sm'. Laam shamsiyya dans اللَّهِ → 'llāhi'.", color:"#537FFF"},
      {title:"الرَّحْمَٰنِ", ar:"الرَّحْمَٰنِ", tr:"ar-raḥmāni", text:"Laam solaire → 'ar'. SuperAlif sur ا → madd long 'ā'. Kasra finale → 'ni'.", color:"#DD8000"},
      {title:"Révision complète", ar:"اللَّهُ أَكْبَرُ", tr:"Allāhu akbaru", text:"Laam shamsiyya + madd + fatha → 'Allāhu'. Qalqala sur ب → 'akbaru'.", color:"#22AA22"},
    ],
    exercise:[
      {ar:"الرَّحِيمِ",correct:"ar-raḥīmi",options:["al-raḥīmi","ar-raḥīmi","ar-raḥimi","al-raḥim"]},
      {ar:"رَبِّ",correct:"rabbi",options:["rabi","rabbi","raabi","rabb"]},
      {ar:"الْعَالَمِينَ",correct:"al-ʿālamīna",options:["al-ʿālamīna","ar-ʿālamīna","al-ʿalamīna","al-ʿālamina"]},
    ]
  },
];

// ═══════════════════════════════════════════════════════
// DONNÉES — Vocabulaire coranique (50 mots les plus fréquents)
// ═══════════════════════════════════════════════════════
const VOCAB = [
  {id:1, ar:"اللَّهُ", tr:"Allāhu", fr:"Allah", freq:2699, cat:"essentiel"},
  {id:2, ar:"رَبِّ", tr:"rabbi", fr:"Seigneur (mon)", freq:980, cat:"essentiel"},
  {id:3, ar:"قَالَ", tr:"qāla", fr:"Il dit", freq:529, cat:"verbe"},
  {id:4, ar:"إِنَّ", tr:"inna", fr:"Certes / vraiment", freq:1709, cat:"particule"},
  {id:5, ar:"مَا", tr:"mā", fr:"ce qui / pas (nég.)", freq:1598, cat:"particule"},
  {id:6, ar:"لَا", tr:"lā", fr:"non / ne...pas", freq:1403, cat:"particule"},
  {id:7, ar:"مِنْ", tr:"min", fr:"de / parmi", freq:2764, cat:"préposition"},
  {id:8, ar:"فِي", tr:"fī", fr:"dans / en", freq:1711, cat:"préposition"},
  {id:9, ar:"عَلَى", tr:"ʿalā", fr:"sur / contre", freq:1244, cat:"préposition"},
  {id:10, ar:"إِلَى", tr:"ilā", fr:"vers / jusqu'à", freq:742, cat:"préposition"},
  {id:11, ar:"الَّذِي", tr:"alladhī", fr:"celui qui", freq:1470, cat:"relatif"},
  {id:12, ar:"هُوَ", tr:"huwa", fr:"il / lui", freq:604, cat:"pronom"},
  {id:13, ar:"كَانَ", tr:"kāna", fr:"il était / il a été", freq:1358, cat:"verbe"},
  {id:14, ar:"وَ", tr:"wa", fr:"et", freq:49248, cat:"particule"},
  {id:15, ar:"أَنَّ", tr:"anna", fr:"que (conjonction)", freq:1030, cat:"particule"},
  {id:16, ar:"لَهُمْ", tr:"lahum", fr:"pour eux / à eux", freq:817, cat:"pronom"},
  {id:17, ar:"يَوْمَ", tr:"yawma", fr:"le jour (où)", freq:405, cat:"temps"},
  {id:18, ar:"آمَنُوا", tr:"āmanū", fr:"ils ont cru", freq:258, cat:"verbe"},
  {id:19, ar:"نَاسِ", tr:"nāsi", fr:"gens / humains", freq:241, cat:"nom"},
  {id:20, ar:"أَرْضِ", tr:"arḍi", fr:"terre", freq:461, cat:"nom"},
  {id:21, ar:"سَمَاوَاتِ", tr:"samāwāti", fr:"cieux / ciel", freq:189, cat:"nom"},
  {id:22, ar:"رَحِيمٌ", tr:"raḥīmun", fr:"Très Miséricordieux", freq:115, cat:"attribut"},
  {id:23, ar:"رَحْمَانُ", tr:"raḥmānu", fr:"Tout Miséricordieux", freq:57, cat:"attribut"},
  {id:24, ar:"عَلِيمٌ", tr:"ʿalīmun", fr:"Omniscient", freq:157, cat:"attribut"},
  {id:25, ar:"عَظِيمٌ", tr:"ʿaẓīmun", fr:"Immense / Grand", freq:108, cat:"attribut"},
  {id:26, ar:"حَكِيمٌ", tr:"ḥakīmun", fr:"Sage", freq:97, cat:"attribut"},
  {id:27, ar:"قَدِيرٌ", tr:"qadīrun", fr:"Puissant / Omnipotent", freq:45, cat:"attribut"},
  {id:28, ar:"سَبِيلِ", tr:"sabīli", fr:"voie / chemin", freq:166, cat:"nom"},
  {id:29, ar:"نَفْسَ", tr:"nafsa", fr:"âme / soi-même", freq:295, cat:"nom"},
  {id:30, ar:"قُلْ", tr:"qul", fr:"Dis !", freq:332, cat:"verbe"},
  {id:31, ar:"كِتَابِ", tr:"kitābi", fr:"livre / écrit", freq:319, cat:"nom"},
  {id:32, ar:"حَقِّ", tr:"ḥaqqi", fr:"vérité / droit", freq:287, cat:"nom"},
  {id:33, ar:"نُورَ", tr:"nūra", fr:"lumière", freq:49, cat:"nom"},
  {id:34, ar:"قَلْبِ", tr:"qalbi", fr:"cœur", freq:132, cat:"nom"},
  {id:35, ar:"جَنَّةِ", tr:"jannati", fr:"paradis / jardin", freq:147, cat:"nom"},
  {id:36, ar:"نَارِ", tr:"nāri", fr:"feu / enfer", freq:145, cat:"nom"},
  {id:37, ar:"عَمِلَ", tr:"ʿamila", fr:"il a fait / oeuvré", freq:104, cat:"verbe"},
  {id:38, ar:"عِلْمِ", tr:"ʿilmi", fr:"science / connaissance", freq:105, cat:"nom"},
  {id:39, ar:"صَلَاةَ", tr:"ṣalāta", fr:"prière", freq:99, cat:"nom"},
  {id:40, ar:"رَسُولُ", tr:"rasūlu", fr:"messager / prophète", freq:332, cat:"nom"},
  {id:41, ar:"آيَاتِ", tr:"āyāti", fr:"signes / versets", freq:382, cat:"nom"},
  {id:42, ar:"مُؤْمِنُونَ", tr:"muʾminūna", fr:"croyants", freq:182, cat:"nom"},
  {id:43, ar:"ظَالِمُونَ", tr:"ẓālimūna", fr:"injustes / oppresseurs", freq:94, cat:"nom"},
  {id:44, ar:"مُتَّقِينَ", tr:"muttaqīna", fr:"pieux / craignant Allah", freq:55, cat:"nom"},
  {id:45, ar:"شَيْءٍ", tr:"shayʾin", fr:"chose", freq:519, cat:"nom"},
  {id:46, ar:"خَيْرٌ", tr:"khayrun", fr:"bien / meilleur", freq:199, cat:"nom"},
  {id:47, ar:"كَبِيرٌ", tr:"kabīrun", fr:"grand / important", freq:73, cat:"adjectif"},
  {id:48, ar:"صَغِيرٌ", tr:"ṣaghīrun", fr:"petit / jeune", freq:14, cat:"adjectif"},
  {id:49, ar:"حَمْدُ", tr:"ḥamdu", fr:"louange", freq:42, cat:"nom"},
  {id:50, ar:"صِرَاطَ", tr:"ṣirāṭa", fr:"chemin / voie droite", freq:45, cat:"nom"},
];

// ═══════════════════════════════════════════════════════
// RÉPÉTITION ESPACÉE — Algorithme SM-2 simplifié
// ═══════════════════════════════════════════════════════
function getInitialCardState() {
  return VOCAB.reduce((acc, w) => {
    acc[w.id] = { interval: 0, ease: 2.5, reps: 0, nextReview: 0, lastQuality: -1 };
    return acc;
  }, {});
}

function updateCard(card, quality) {
  // quality: 0=again, 1=hard, 2=good, 3=easy
  const now = Date.now();
  let { interval, ease, reps } = card;
  if (quality === 0) { interval = 0; reps = 0; }
  else {
    ease = Math.max(1.3, ease + [-0.8, -0.15, 0, 0.1][quality]);
    if (reps === 0) interval = 1;
    else if (reps === 1) interval = 3;
    else interval = Math.round(interval * ease);
    reps++;
  }
  return { interval, ease, reps, nextReview: now + interval * 86400000, lastQuality: quality };
}

function getDueCards(cards) {
  const now = Date.now();
  return VOCAB.filter(w => !cards[w.id] || cards[w.id].nextReview <= now)
    .sort(() => Math.random() - 0.5)
    .slice(0, 10);
}

// ═══════════════════════════════════════════════════════
// COMPOSANT — Tab Sourates
// ═══════════════════════════════════════════════════════
function SuratesTab() {
  const [open, setOpen] = useState(null);
  const [showTr, setShowTr] = useState(true);
  const [showFr, setShowFr] = useState(false);

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-600 italic text-center">Couleurs tajweed lettre par lettre · Sans internet requis</p>
      {LEARN_SURAHS.map(surah => (
        <div key={surah.number} className={`rounded-3xl border overflow-hidden transition-all ${open === surah.number ? "border-emerald-500/30 bg-emerald-900/8" : "border-white/10 bg-white/4"}`}>
          <button className="w-full flex items-center gap-3 p-4 text-left" onClick={() => setOpen(open === surah.number ? null : surah.number)}>
            <div className="w-11 h-11 rounded-xl bg-emerald-500/12 border border-emerald-500/20 flex flex-col items-center justify-center shrink-0">
              <span className="text-emerald-400 font-black text-sm">{surah.number}</span>
              <span className="text-emerald-600/60 text-[9px]">J.{surah.juz}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-white text-sm">{surah.name}</p>
              <p className="text-slate-500 text-xs">{surah.verses.length} versets</p>
            </div>
            <p className="text-xl font-serif text-slate-500 mr-2" dir="rtl">{surah.arabic}</p>
            <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${open === surah.number ? "rotate-90" : ""}`}/>
          </button>
          <AnimatePresence>
            {open === surah.number && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
                  <button onClick={() => setShowTr(s => !s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showTr ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-white/5 text-slate-600"}`}>ABC Translit.</button>
                  <button onClick={() => setShowFr(s => !s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showFr ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-white/5 text-slate-600"}`}>FR Traduction</button>
                </div>
                <div className="px-4 pb-3 flex flex-wrap gap-1">
                  {[["#DD8000","Qalqala"],["#537FFF","Madd"],["#22AA22","Ghunna"],["#D070A0","Ikhfāʾ"],["#AAAAAA","Silence"]].map(([color,label]) => (
                    <span key={label} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/8">
                      <span className="w-1.5 h-1.5 rounded-full" style={{background:color}}/><span className="text-slate-600">{label}</span>
                    </span>
                  ))}
                </div>
                <div className="space-y-2 px-4 pb-5">
                  {surah.verses.map((v,i) => (
                    <motion.div key={v.n} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                      className="p-4 rounded-2xl bg-white/3 border border-white/8">
                      <div className="flex items-start gap-3 mb-1">
                        <span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-1">{v.n}</span>
                        <div className="flex-1 text-right" style={{lineHeight:"3"}}>
                          <LetterByLetter text={v.ar} size="clamp(1.2rem,4vw,1.6rem)"/>
                        </div>
                      </div>
                      {showTr && <p className="text-xs text-blue-300/70 italic ml-10" dir="ltr">{v.tr}</p>}
                      {showFr && <p className="text-sm text-slate-400 leading-relaxed ml-10 mt-1 bg-white/3 rounded-xl px-3 py-2">{v.fr}</p>}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// COMPOSANT — Tab Alphabet
// ═══════════════════════════════════════════════════════
function AlphabetTab() {
  const [sel, setSel] = useState(null);
  const rows = [];
  for (let i = 0; i < ALPHABET.length; i += 4) rows.push(ALPHABET.slice(i, i+4));
  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-2xl">
        <p className="text-blue-300 font-bold text-sm mb-1">الحروف الهجائية — 28 lettres</p>
        <p className="text-slate-500 text-xs">Appuie sur une lettre pour voir ses 4 formes. <span className="text-emerald-400">Vert = solaire</span> · <span className="text-blue-400">Bleu = lunaire</span></p>
      </div>
      {rows.map((row, ri) => {
        const selInRow = sel && row.find(l => l.name === sel.name);
        return (
          <div key={ri}>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {row.map(l => (
                <button key={l.name}
                  onClick={() => setSel(sel?.name === l.name ? null : l)}
                  className={`p-3 rounded-2xl border text-center transition-all active:scale-95 ${
                    sel?.name === l.name ? "bg-blue-600 border-blue-400" :
                    l.group === "solaire" ? "bg-emerald-900/40 border-emerald-700/40" :
                    "bg-slate-800 border-slate-600"
                  }`}>
                  <p className="text-2xl font-serif" style={{color:"white"}} dir="rtl">{l.ar}</p>
                  <p className="text-[10px] mt-0.5" style={{color: l.group==="solaire" ? "#6ee7b7" : "#93c5fd"}}>{l.name}</p>
                </button>
              ))}
            </div>
            <AnimatePresence>
              {selInRow && (
                <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden mb-2">
                  <div className="p-4 bg-blue-900/30 border border-blue-500/30 rounded-2xl">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-16 h-16 rounded-2xl bg-blue-600/40 border border-blue-400/50 flex items-center justify-center">
                        <span className="text-4xl font-serif" style={{color:"white"}}>{sel.ar}</span>
                      </div>
                      <div>
                        <p className="font-black text-xl" style={{color:"white"}}>{sel.name}</p>
                        <p className="text-blue-300 text-sm font-bold">{sel.sound}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sel.group==="solaire" ? "bg-emerald-900/50 text-emerald-300" : "bg-blue-900/50 text-blue-300"}`}>{sel.group}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[{label:"Isolée",text:sel.i},{label:"Initiale",text:sel.ini},{label:"Médiane",text:sel.med},{label:"Finale",text:sel.fin}].map(f => (
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

// ═══════════════════════════════════════════════════════
// COMPOSANT — Tab Tajweed
// ═══════════════════════════════════════════════════════
const TAJWEED_INFO = [
  {cls:"qalaqah",      color:"#DD8000", label:"Qalqala",         desc:"Écho vibrant — ق ط ب ج د avec sukūn"},
  {cls:"madda_normal", color:"#537FFF", label:"Madd normal",     desc:"Extension 2 temps — après voyelle longue"},
  {cls:"madda_permissible",color:"#4BC8F0",label:"Madd permissible",desc:"Extension 2, 4 ou 6 temps selon la récitation"},
  {cls:"madda_necessary",  color:"#2B4FBB",label:"Madd nécessaire", desc:"Extension obligatoire 6 temps"},
  {cls:"ghunnah",      color:"#22AA22", label:"Ghunna",          desc:"Nasalisation 2 temps — ن ou م avec shadda"},
  {cls:"idgham_ghunnah",color:"#169200",label:"Idghām + Ghunna", desc:"Assimilation nasale — ني رم وأ"},
  {cls:"idgham_wo_ghunnah",color:"#2E8B57",label:"Idghām sans Ghunna",desc:"Assimilation — ل et ر"},
  {cls:"ikhafa",       color:"#D070A0", label:"Ikhfāʾ",          desc:"Dissimulation nasale — نون + 15 lettres"},
  {cls:"iqlab",        color:"#E05000", label:"Iqlāb",           desc:"Transformation — نون → ميم devant ب"},
  {cls:"ham_wasl",     color:"#AAAAAA", label:"Hamza Wasla",     desc:"Hamza de liaison — disparaît en continuité"},
  {cls:"laam_shamsiyya",color:"#AAAAAA",label:"Laam Shamsiyya",  desc:"Laam assimilé — ال devant 14 lettres solaires"},
  {cls:"slnt",         color:"#666666", label:"Lettre silencieuse",desc:"Ne se prononce pas dans la récitation"},
];

function TajweedTab() {
  const [sel, setSel] = useState(null);
  return (
    <div className="space-y-3">
      <div className="p-4 bg-emerald-900/20 border border-emerald-500/15 rounded-2xl">
        <p className="text-emerald-300 font-bold text-sm mb-1">🎨 Les règles du Tajweed</p>
        <p className="text-slate-500 text-xs">Appuie sur chaque règle pour voir sa description et comment la reconnaître.</p>
      </div>
      {TAJWEED_INFO.map(t => (
        <button key={t.cls} onClick={() => setSel(sel === t.cls ? null : t.cls)}
          className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${sel === t.cls ? "border-white/25 bg-white/8" : "border-white/8 bg-white/3"}`}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:`${t.color}25`,border:`1px solid ${t.color}50`}}>
            <div className="w-4 h-4 rounded-full" style={{background:t.color}}/>
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-semibold text-sm">{t.label}</p>
            <AnimatePresence>
              {sel === t.cls && <motion.p initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="text-slate-400 text-xs mt-0.5 overflow-hidden">{t.desc}</motion.p>}
            </AnimatePresence>
          </div>
          <span className="text-slate-700 text-xs">{sel === t.cls ? "▲" : "▼"}</span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// COMPOSANT — Tab Voyelles
// ═══════════════════════════════════════════════════════
function VoyellesTab() {
  return (
    <div className="space-y-3">
      <div className="p-4 bg-purple-900/20 border border-purple-500/15 rounded-2xl">
        <p className="text-purple-300 font-bold text-sm mb-1">التشكيل — Les voyelles</p>
        <p className="text-slate-500 text-xs">Les diacritiques guident la prononciation exacte. Indispensables pour lire le Coran.</p>
      </div>
      {HARAKAT.map((h,i) => (
        <motion.div key={h.name} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
          className="flex items-center gap-4 p-4 bg-white/4 border border-white/8 rounded-2xl">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center shrink-0">
            <span className="text-3xl font-serif" style={{color:"white"}} dir="rtl">{h.example}</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">{h.name}</p>
            <p className="text-purple-300 text-xs">{h.sound}</p>
            <p className="text-slate-600 text-xs">→ <span className="text-slate-300 font-semibold">{h.tr}</span></p>
          </div>
          <span className="text-4xl font-serif text-slate-400">{h.symbol}</span>
        </motion.div>
      ))}
      <div className="p-4 bg-white/4 border border-white/10 rounded-2xl">
        <p className="text-white font-bold text-sm mb-2">Exemple complet</p>
        <div className="text-center py-3">
          <LetterByLetter text="بِسْمِ اللَّهِ" size="2rem"/>
        </div>
        <p className="text-blue-300 text-xs text-center italic">Bismi llāh — kasra + sukūn + kasra + madd</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// COMPOSANT — Tab Leçons
// ═══════════════════════════════════════════════════════
function LessonsTab() {
  const [progress] = useState(() => ls("lessons_progress", {}));
  const [current, setCurrent] = useState(null);
  const [phase, setPhase] = useState("theory"); // "theory" | "exercise" | "done"
  const [theoryIdx, setTheoryIdx] = useState(0);
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);

  const startLesson = (lesson) => {
    setCurrent(lesson);
    setPhase("theory");
    setTheoryIdx(0);
    setExerciseIdx(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
  };

  const nextTheory = () => {
    if (theoryIdx < current.theory.length - 1) setTheoryIdx(i => i+1);
    else { setPhase("exercise"); setExerciseIdx(0); setSelected(null); setAnswered(false); }
  };

  const handleAnswer = (opt) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    if (opt === current.exercise[exerciseIdx].correct) setScore(s => s+1);
  };

  const nextExercise = () => {
    if (exerciseIdx < current.exercise.length - 1) {
      setExerciseIdx(i => i+1);
      setSelected(null);
      setAnswered(false);
    } else {
      const p = { ...ls("lessons_progress", {}), [current.id]: { done:true, score, total:current.exercise.length, date:Date.now() }};
      lsSet("lessons_progress", p);
      setPhase("done");
    }
  };

  if (!current) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-amber-900/20 border border-amber-500/20 rounded-2xl">
          <p className="text-amber-300 font-bold text-sm mb-1">📚 Leçons progressives</p>
          <p className="text-slate-500 text-xs">7 leçons basées sur la méthode Al-Azhar. Chaque leçon = théorie + exercices. Complète-les dans l'ordre.</p>
        </div>
        {LESSONS.map((lesson, i) => {
          const done = progress[lesson.id];
          const locked = i > 0 && !progress[LESSONS[i-1].id];
          return (
            <motion.button key={lesson.id} disabled={locked}
              onClick={() => !locked && startLesson(lesson)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                locked ? "border-white/5 bg-white/2 opacity-40" :
                done   ? "border-emerald-500/30 bg-emerald-900/15" :
                         "border-amber-500/20 bg-amber-900/10 hover:border-amber-500/40"
              }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${locked ? "bg-white/5" : done ? "bg-emerald-500/20" : "bg-amber-500/15"}`}>
                {locked ? "🔒" : done ? "✅" : lesson.emoji}
              </div>
              <div className="flex-1">
                <p className={`font-bold text-sm ${locked ? "text-slate-600" : "text-white"}`}>Leçon {lesson.id} — {lesson.title}</p>
                <p className={`text-xs mt-0.5 ${locked ? "text-slate-700" : "text-slate-500"}`}>{lesson.desc}</p>
                {done && <p className="text-xs text-emerald-400 mt-0.5">Score : {done.score}/{done.total}</p>}
              </div>
              {!locked && !done && <span className="text-xs text-amber-400 shrink-0">{lesson.duration}</span>}
              {!locked && <ChevronRight className="w-4 h-4 text-slate-600 shrink-0"/>}
            </motion.button>
          );
        })}
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-5 text-center">
        <motion.div initial={{scale:0}} animate={{scale:1}} className="text-7xl">🎉</motion.div>
        <p className="text-white font-black text-2xl">Leçon {current.id} terminée !</p>
        <div className="flex items-center gap-3">
          {Array.from({length: current.exercise.length}).map((_,i) => (
            <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${i < score ? "bg-emerald-500" : "bg-white/10"}`}>
              {i < score ? "✓" : "✗"}
            </div>
          ))}
        </div>
        <p className="text-emerald-400 font-bold text-lg">{score}/{current.exercise.length} bonnes réponses</p>
        <button onClick={() => setCurrent(null)} className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl">
          ← Retour aux leçons
        </button>
      </div>
    );
  }

  if (phase === "theory") {
    const step = current.theory[theoryIdx];
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setCurrent(null)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400"><ChevronRight className="w-5 h-5 rotate-180"/></button>
          <p className="text-white font-bold">Leçon {current.id} · {current.title}</p>
          <span className="ml-auto text-xs text-slate-500">{theoryIdx+1}/{current.theory.length}</span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <motion.div className="h-full bg-amber-500 rounded-full" animate={{width:`${((theoryIdx+1)/current.theory.length)*100}%`}}/>
        </div>
        <motion.div key={theoryIdx} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="space-y-4">
          <div className="p-5 rounded-3xl border border-white/10" style={{background:`${step.color}15`,borderColor:`${step.color}30`}}>
            <p className="font-bold text-white text-base mb-4">{step.title}</p>
            <div className="text-center mb-4">
              <LetterByLetter text={step.ar} size="2.5rem"/>
            </div>
            <p className="text-blue-300 text-sm italic text-center mb-3">{step.tr}</p>
            <p className="text-slate-300 text-sm leading-relaxed bg-black/20 rounded-2xl p-4">{step.text}</p>
          </div>
        </motion.div>
        <button onClick={nextTheory} className="w-full py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-2xl text-sm">
          {theoryIdx < current.theory.length - 1 ? "Suivant →" : "Passer aux exercices →"}
        </button>
      </div>
    );
  }

  // Exercise phase
  const ex = current.exercise[exerciseIdx];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setCurrent(null)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400"><ChevronRight className="w-5 h-5 rotate-180"/></button>
        <p className="text-white font-bold">Exercice {exerciseIdx+1}/{current.exercise.length}</p>
        <span className="ml-auto text-emerald-400 font-bold text-sm">{score} ✓</span>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <motion.div className="h-full bg-emerald-500 rounded-full" animate={{width:`${(exerciseIdx/current.exercise.length)*100}%`}}/>
      </div>
      <p className="text-slate-400 text-sm text-center">Comment se prononce ce texte ?</p>
      <div className="py-8 text-center bg-white/5 border border-white/10 rounded-3xl">
        <LetterByLetter text={ex.ar} size="3rem"/>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ex.options.map(opt => {
          const isCorrect = opt === ex.correct;
          const isSelected = opt === selected;
          let cls = "bg-white/5 border-white/15 text-white";
          if (answered && isCorrect) cls = "bg-emerald-500/30 border-emerald-500 text-emerald-300";
          else if (answered && isSelected && !isCorrect) cls = "bg-red-500/30 border-red-500 text-red-300";
          return (
            <button key={opt} onClick={() => handleAnswer(opt)}
              className={`p-4 rounded-2xl border font-bold text-sm transition-all active:scale-95 ${cls}`}>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="space-y-3">
          <p className={`text-center font-bold ${selected === ex.correct ? "text-emerald-400" : "text-red-400"}`}>
            {selected === ex.correct ? "✅ Correct !" : `❌ La bonne réponse : ${ex.correct}`}
          </p>
          <button onClick={nextExercise} className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl">
            {exerciseIdx < current.exercise.length - 1 ? "Question suivante →" : "Voir le résultat →"}
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// COMPOSANT — Tab Révision (Anki)
// ═══════════════════════════════════════════════════════
function RevisionTab() {
  const [cards, setCards] = useState(() => ls("anki_cards", getInitialCardState()));
  const [due, setDue] = useState(() => []);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [sessionDone, setSessionDone] = useState(0);

  useEffect(() => {
    const d = getDueCards(cards);
    setDue(d);
    setIdx(0);
    setFlipped(false);
  }, []);

  const totalDue = due.length;
  const learned = VOCAB.filter(w => cards[w.id]?.reps > 0).length;
  const card = due[idx];

  const answer = (quality) => {
    if (!card) return;
    const updated = { ...cards, [card.id]: updateCard(cards[card.id] || {interval:0,ease:2.5,reps:0,nextReview:0}, quality) };
    setCards(updated);
    lsSet("anki_cards", updated);
    setSessionDone(s => s+1);
    if (idx < due.length - 1) { setIdx(i => i+1); setFlipped(false); }
    else setDue([]);
  };

  const reset = () => {
    const fresh = getInitialCardState();
    setCards(fresh);
    lsSet("anki_cards", fresh);
    const d = getDueCards(fresh);
    setDue(d); setIdx(0); setFlipped(false); setSessionDone(0);
  };

  if (due.length === 0) {
    return (
      <div className="space-y-4">
        <div className="p-5 bg-emerald-900/20 border border-emerald-500/20 rounded-3xl text-center">
          <p className="text-4xl mb-3">🎓</p>
          <p className="text-white font-black text-xl mb-1">{sessionDone > 0 ? `Session terminée !` : "À jour !"}</p>
          {sessionDone > 0 && <p className="text-emerald-400 text-sm">{sessionDone} cartes révisées</p>}
          <p className="text-slate-500 text-sm mt-2">{learned}/50 mots appris</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/8">
            <p className="text-slate-500 text-xs">Appris</p>
            <p className="text-emerald-400 font-black text-xl">{learned}</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/8">
            <p className="text-slate-500 text-xs">Total</p>
            <p className="text-white font-black text-xl">50</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-3 text-center border border-white/8">
            <p className="text-slate-500 text-xs">À revoir</p>
            <p className="text-amber-400 font-black text-xl">{VOCAB.filter(w => cards[w.id]?.nextReview > Date.now()).length}</p>
          </div>
        </div>
        <div className="space-y-2">
          <button onClick={() => { const d = getDueCards(cards); setDue(d); setIdx(0); setFlipped(false); setSessionDone(0); }}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl">
            🔄 Nouvelle session
          </button>
          <button onClick={reset} className="w-full py-2.5 bg-white/5 text-slate-500 border border-white/10 rounded-2xl text-sm">
            Réinitialiser tout
          </button>
        </div>
        <div>
          <p className="text-sm font-bold text-white mb-2">Tous les mots</p>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {VOCAB.map(w => {
              const c = cards[w.id];
              const done = c?.reps > 0;
              return (
                <div key={w.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${done ? "border-emerald-500/15 bg-emerald-900/8" : "border-white/8 bg-white/3"}`}>
                  <span className={`text-xs font-bold w-6 text-center ${done ? "text-emerald-400" : "text-slate-600"}`}>{done ? "✓" : w.id}</span>
                  <span className="font-serif text-white text-base" dir="rtl">{w.ar}</span>
                  <span className="text-slate-500 text-xs flex-1">{w.fr}</span>
                  <span className="text-[10px] text-slate-700">{w.cat}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-white font-bold">Révision · {idx+1}/{totalDue}</p>
        <p className="text-slate-500 text-xs">{VOCAB.findIndex(w => w.id === card?.id)+1}e mot le plus fréquent</p>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all" style={{width:`${((idx)/totalDue)*100}%`}}/>
      </div>
      <motion.button key={card?.id + String(flipped)} onClick={() => !flipped && setFlipped(true)}
        className="w-full min-h-48 rounded-3xl border border-white/15 bg-white/5 flex flex-col items-center justify-center p-6 gap-3 active:scale-98 transition-all"
        whileTap={{scale:0.98}}>
        {!flipped ? (
          <>
            <p className="font-serif text-white" style={{fontSize:"3.5rem"}} dir="rtl">{card?.ar}</p>
            <p className="text-slate-500 text-sm">Appuie pour voir la réponse</p>
          </>
        ) : (
          <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} className="text-center space-y-2">
            <p className="font-serif text-white" style={{fontSize:"3rem"}} dir="rtl">{card?.ar}</p>
            <p className="text-blue-300 text-lg italic font-bold">{card?.tr}</p>
            <p className="text-white text-xl font-bold">{card?.fr}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400">{card?.cat} · {card?.freq}× dans le Coran</span>
          </motion.div>
        )}
      </motion.button>
      {flipped && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="grid grid-cols-2 gap-2">
          {[{q:0,label:"À revoir",color:"bg-red-500/20 border-red-500/40 text-red-300"},{q:1,label:"Difficile",color:"bg-orange-500/20 border-orange-500/40 text-orange-300"},{q:2,label:"Bien",color:"bg-blue-500/20 border-blue-500/40 text-blue-300"},{q:3,label:"Facile",color:"bg-emerald-500/20 border-emerald-500/40 text-emerald-300"}].map(b => (
            <button key={b.q} onClick={() => answer(b.q)}
              className={`py-3.5 rounded-2xl border font-bold text-sm transition-all active:scale-95 ${b.color}`}>
              {b.label}
            </button>
          ))}
        </motion.div>
      )}
      {!flipped && (
        <p className="text-center text-slate-700 text-xs">Regarde le mot en arabe · Essaie de te souvenir</p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// COMPOSANT — Tab Quiz
// ═══════════════════════════════════════════════════════
function QuizTab() {
  const [mode, setMode] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const generateLetterQuiz = () => {
    const qs = [...ALPHABET].sort(() => Math.random()-0.5).slice(0, 8).map(letter => {
      const wrong = ALPHABET.filter(l => l.name !== letter.name).sort(() => Math.random()-0.5).slice(0,3).map(l => l.name);
      const options = [...wrong, letter.name].sort(() => Math.random()-0.5);
      return { ar: letter.ar, correct: letter.name, options, type:"letter" };
    });
    return qs;
  };

  const generateVocabQuiz = () => {
    const qs = [...VOCAB].sort(() => Math.random()-0.5).slice(0, 8).map(w => {
      const wrong = VOCAB.filter(v => v.id !== w.id).sort(() => Math.random()-0.5).slice(0,3).map(v => v.fr);
      const options = [...wrong, w.fr].sort(() => Math.random()-0.5);
      return { ar: w.ar, tr: w.tr, correct: w.fr, options, type:"vocab" };
    });
    return qs;
  };

  const generateTajweedQuiz = () => [
    { ar:"قُلْ", question:"Quelle règle s'applique sur le ق ?", correct:"Qalqala", options:["Qalqala","Ghunna","Madd","Ikhfāʾ"], type:"tajweed" },
    { ar:"إِنَّ", question:"Quelle règle s'applique sur le نّ ?", correct:"Ghunna", options:["Ghunna","Qalqala","Iqlāb","Madd"], type:"tajweed" },
    { ar:"الرَّحِيمِ", question:"Le ل de ال est ici...", correct:"Laam solaire", options:["Laam solaire","Laam lunaire","Madd","Sukūn"], type:"tajweed" },
    { ar:"الْكِتَابُ", question:"Le ل de ال est ici...", correct:"Laam lunaire", options:["Laam lunaire","Laam solaire","Ghunna","Qalqala"], type:"tajweed" },
    { ar:"بِسْمِ", question:"Le س porte...", correct:"Sukūn", options:["Sukūn","Fatha","Ghunna","Qalqala"], type:"tajweed" },
  ];

  const start = (type) => {
    let qs;
    if (type === "letters") qs = generateLetterQuiz();
    else if (type === "vocab") qs = generateVocabQuiz();
    else qs = generateTajweedQuiz();
    setMode(type);
    setQuestions(qs);
    setQIdx(0);
    setSelected(null);
    setAnswered(false);
    setScore(0);
    setStreak(0);
  };

  const answer = (opt) => {
    if (answered) return;
    setSelected(opt);
    setAnswered(true);
    const correct = opt === questions[qIdx].correct;
    if (correct) { setScore(s => s+1); setStreak(s => s+1); }
    else setStreak(0);
  };

  const next = () => {
    if (qIdx < questions.length - 1) { setQIdx(i => i+1); setSelected(null); setAnswered(false); }
    else setMode("done");
  };

  if (!mode) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-yellow-900/20 border border-yellow-500/20 rounded-2xl">
          <p className="text-yellow-300 font-bold text-sm mb-1">🎯 Quiz interactifs</p>
          <p className="text-slate-500 text-xs">3 types de quiz pour tester et consolider tes connaissances.</p>
        </div>
        {[
          {type:"letters", emoji:"ح", title:"Reconnais les lettres", desc:"Vois la lettre arabe → trouve son nom", color:"from-blue-600 to-blue-700"},
          {type:"vocab", emoji:"📝", title:"Vocabulaire coranique", desc:"Vois le mot arabe → trouve la traduction", color:"from-purple-600 to-purple-700"},
          {type:"tajweed", emoji:"🎨", title:"Règles de tajweed", desc:"Identifie la règle qui s'applique", color:"from-orange-600 to-orange-700"},
        ].map(q => (
          <motion.button key={q.type} whileTap={{scale:0.97}} onClick={() => start(q.type)}
            className={`w-full flex items-center gap-4 p-5 rounded-3xl bg-gradient-to-r ${q.color} text-white text-left shadow-lg`}>
            <span className="text-3xl">{q.emoji}</span>
            <div>
              <p className="font-black text-base">{q.title}</p>
              <p className="text-white/70 text-sm mt-0.5">{q.desc}</p>
            </div>
          </motion.button>
        ))}
      </div>
    );
  }

  if (mode === "done") {
    const pct = Math.round((score/questions.length)*100);
    return (
      <div className="text-center space-y-5 py-6">
        <motion.div initial={{scale:0}} animate={{scale:1}} className="text-7xl">{pct >= 80 ? "🏆" : pct >= 60 ? "⭐" : "📚"}</motion.div>
        <p className="text-white font-black text-2xl">{score}/{questions.length}</p>
        <p className="text-slate-400">{pct >= 80 ? "Excellent !" : pct >= 60 ? "Bien !" : "Continue à pratiquer !"}</p>
        <div className="flex gap-2 justify-center">
          {questions.map((_,i) => (
            <div key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${i < score ? "bg-emerald-500" : "bg-red-500/50"}`}>
              {i < score ? "✓" : "✗"}
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-center pt-2">
          <button onClick={() => start(mode === "done" ? "letters" : mode)} className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl">Rejouer</button>
          <button onClick={() => setMode(null)} className="px-5 py-2.5 bg-white/10 text-white rounded-xl">Menu</button>
        </div>
      </div>
    );
  }

  const q = questions[qIdx];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setMode(null)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400"><ChevronRight className="w-5 h-5 rotate-180"/></button>
        <div className="flex items-center gap-2">
          {streak >= 2 && <span className="text-xs text-amber-400 font-bold">🔥 {streak}</span>}
          <span className="text-emerald-400 font-bold">{score} ✓</span>
          <span className="text-slate-500 text-xs">{qIdx+1}/{questions.length}</span>
        </div>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" animate={{width:`${((qIdx)/questions.length)*100}%`}}/>
      </div>
      <p className="text-slate-400 text-sm text-center">{q.question || (q.type === "vocab" ? "Que signifie ce mot ?" : "Comment s'appelle cette lettre ?")}</p>
      <div className="py-8 text-center bg-white/5 border border-white/10 rounded-3xl">
        <p className="font-serif text-white" style={{fontSize:"3.5rem"}} dir="rtl">{q.ar}</p>
        {q.tr && <p className="text-blue-300/60 text-sm italic mt-2">{q.tr}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {q.options.map(opt => {
          const isCorrect = opt === q.correct;
          const isSelected = opt === selected;
          let cls = "bg-white/5 border-white/15 text-white";
          if (answered && isCorrect) cls = "bg-emerald-500/30 border-emerald-500 text-emerald-300";
          else if (answered && isSelected && !isCorrect) cls = "bg-red-500/30 border-red-500 text-red-300";
          return (
            <button key={opt} onClick={() => answer(opt)}
              className={`py-4 px-3 rounded-2xl border font-bold text-sm transition-all active:scale-95 text-center ${cls}`}>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <motion.button initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
          onClick={next}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl">
          {qIdx < questions.length - 1 ? "Suivant →" : "Voir le résultat →"}
        </motion.button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════
const TABS = [
  {key:"surahs",   label:"📖 Sourates"},
  {key:"lessons",  label:"📚 Leçons"},
  {key:"revision", label:"🃏 Révision"},
  {key:"quiz",     label:"🎯 Quiz"},
  {key:"alphabet", label:"ح Alphabet"},
  {key:"tajweed",  label:"🎨 Tajweed"},
  {key:"voyelles", label:"◌ Voyelles"},
];

export default function LearnScreen() {
  const [tab, setTab] = useState("surahs");
  const lessonsProgress = ls("lessons_progress", {});
  const anki = ls("anki_cards", getInitialCardState());
  const ankiDue = getDueCards(anki).length;
  const lessonsDone = Object.keys(lessonsProgress).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <div>
        <h2 className="text-xl font-black text-white">🎓 تَعَلَّمِ الْعَرَبِيَّةَ</h2>
        <p className="text-slate-600 text-xs">Méthode Al-Azhar · Répétition espacée · Tajweed lettre par lettre</p>
      </div>
      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/5 border border-white/8 rounded-2xl p-2.5 text-center">
          <p className="text-emerald-400 font-black text-lg">{lessonsDone}/7</p>
          <p className="text-slate-600 text-[10px]">Leçons</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-2xl p-2.5 text-center">
          <p className="text-blue-400 font-black text-lg">{VOCAB.filter(w => anki[w.id]?.reps > 0).length}/50</p>
          <p className="text-slate-600 text-[10px]">Mots appris</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-2xl p-2.5 text-center">
          <p className={`font-black text-lg ${ankiDue > 0 ? "text-amber-400" : "text-emerald-400"}`}>{ankiDue}</p>
          <p className="text-slate-600 text-[10px]">À réviser</p>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-shrink-0 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${tab === t.key ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg" : "bg-white/5 text-slate-500 hover:text-white border border-white/8"}`}>
            {t.label}
            {t.key === "revision" && ankiDue > 0 && <span className="ml-1 bg-amber-500 text-white text-[9px] px-1 rounded-full">{ankiDue}</span>}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="pb-8">
          {tab === "surahs"   && <SuratesTab/>}
          {tab === "lessons"  && <LessonsTab/>}
          {tab === "revision" && <RevisionTab/>}
          {tab === "quiz"     && <QuizTab/>}
          {tab === "alphabet" && <AlphabetTab/>}
          {tab === "tajweed"  && <TajweedTab/>}
          {tab === "voyelles" && <VoyellesTab/>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
