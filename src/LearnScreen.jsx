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
  { number:93, name:"Aḍ-Ḍuḥā", arabic:"الضحى", juz:30, verses:[
    {n:1, ar:"وَالضُّحَىٰ", tr:"Wa-ḍ-ḍuḥā", fr:"Par le matin lumineux !"},
    {n:2, ar:"وَاللَّيْلِ إِذَا سَجَىٰ", tr:"Wa-l-layli idhā sajā", fr:"Par la nuit quand elle est tranquille !"},
    {n:3, ar:"مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ", tr:"Mā waddaʿaka rabbuka wa-mā qalā", fr:"Ton Seigneur ne t'a pas abandonné"},
    {n:4, ar:"وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ", tr:"Wa-la-l-ākhiratu khayrun laka mina l-ūlā", fr:"L'au-delà est meilleur pour toi que la vie ici-bas"},
    {n:5, ar:"وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ", tr:"Wa-la-sawfa yuʿṭīka rabbuka fa-tarḍā", fr:"Ton Seigneur te donnera et tu seras satisfait"},
    {n:6, ar:"أَلَمْ يَجِدْكَ يَتِيمًا فَآوَىٰ", tr:"Alam yajidka yatīman fa-āwā", fr:"Ne t'a-t-Il pas trouvé orphelin et recueilli ?"},
    {n:7, ar:"وَوَجَدَكَ ضَالًّا فَهَدَىٰ", tr:"Wa-wajadaka ḍāllan fa-hadā", fr:"Ne t'a-t-Il pas trouvé égaré et guidé ?"},
    {n:8, ar:"وَوَجَدَكَ عَائِلًا فَأَغْنَىٰ", tr:"Wa-wajadaka ʿāʾilan fa-aġnā", fr:"Ne t'a-t-Il pas trouvé pauvre et enrichi ?"},
    {n:9, ar:"فَأَمَّا الْيَتِيمَ فَلَا تَقْهَرْ", tr:"Fa-ammā l-yatīma fa-lā taqhar", fr:"Quant à l'orphelin, ne le brime pas"},
    {n:10, ar:"وَأَمَّا السَّائِلَ فَلَا تَنْهَرْ", tr:"Wa-ammā s-sāʾila fa-lā tanhar", fr:"Quant au mendiant, ne le rabroue pas"},
    {n:11, ar:"وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ", tr:"Wa-ammā bi-niʿmati rabbika fa-ḥaddith", fr:"Et quant aux bienfaits de ton Seigneur, proclame-les"},
  ]},
  { number:94, name:"Ash-Sharḥ", arabic:"الشرح", juz:30, verses:[
    {n:1, ar:"أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ", tr:"Alam nashraḥ laka ṣadrak", fr:"N'avons-Nous pas déployé ta poitrine ?"},
    {n:2, ar:"وَوَضَعْنَا عَنكَ وِزْرَكَ", tr:"Wa-waḍaʿnā ʿanka wizrak", fr:"Et déposé ton fardeau"},
    {n:3, ar:"الَّذِي أَنقَضَ ظَهْرَكَ", tr:"Alladhī anqaḍa ẓahrak", fr:"qui alourdissait ton dos ?"},
    {n:4, ar:"وَرَفَعْنَا لَكَ ذِكْرَكَ", tr:"Wa-rafaʿnā laka dhikrak", fr:"N'avons-Nous pas élevé ta renommée ?"},
    {n:5, ar:"فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", tr:"Fa-inna maʿa l-ʿusri yusrā", fr:"Avec la difficulté vient la facilité"},
    {n:6, ar:"إِنَّ مَعَ الْعُسْرِ يُسْرًا", tr:"Inna maʿa l-ʿusri yusrā", fr:"Oui, avec la difficulté vient la facilité"},
    {n:7, ar:"فَإِذَا فَرَغْتَ فَانصَبْ", tr:"Fa-idhā faraġta fa-nṣab", fr:"Quand tu te libères, travaille ardemment"},
    {n:8, ar:"وَإِلَىٰ رَبِّكَ فَارْغَب", tr:"Wa-ilā rabbika fa-rġab", fr:"et vers ton Seigneur aspire"},
  ]},
  { number:107, name:"Al-Māʿūn", arabic:"الماعون", juz:30, verses:[
    {n:1, ar:"أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ", tr:"Araʾayta lladhī yukadhdhibu bi-d-dīn", fr:"As-tu vu celui qui traite de mensonge la Rétribution ?"},
    {n:2, ar:"فَذَٰلِكَ الَّذِي يَدُعُّ الْيَتِيمَ", tr:"Fadhālika lladhī yadhuʿʿu l-yatīm", fr:"C'est lui qui repousse brutalement l'orphelin"},
    {n:3, ar:"وَلَا يَحُضُّ عَلَىٰ طَعَامِ الْمِسْكِينِ", tr:"Wa-lā yaḥuḍḍu ʿalā ṭaʿāmi l-miskīn", fr:"et n'encourage pas à nourrir le pauvre"},
    {n:4, ar:"فَوَيْلٌ لِّلْمُصَلِّينَ", tr:"Fa-waylun li-l-muṣallīn", fr:"Malheur à ceux qui font la Salāt"},
    {n:5, ar:"الَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ", tr:"Alladhīna hum ʿan ṣalātihim sāhūn", fr:"qui sont distraits dans leur Salāt"},
    {n:6, ar:"الَّذِينَ هُمْ يُرَاءُونَ", tr:"Alladhīna hum yurāʾūn", fr:"qui font de l'ostentation"},
    {n:7, ar:"وَيَمْنَعُونَ الْمَاعُونَ", tr:"Wa-yamnaʿūna l-māʿūn", fr:"et refusent l'entraide courante"},
  ]},
  { number:108, name:"Al-Kawthar", arabic:"الكوثر", juz:30, verses:[
    {n:1, ar:"إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ", tr:"Innā aʿṭaynāka l-kawthar", fr:"Nous t'avons accordé l'Abondance"},
    {n:2, ar:"فَصَلِّ لِرَبِّكَ وَانْحَرْ", tr:"Fa-ṣalli li-rabbika wa-nḥar", fr:"Accomplis donc la Salāt et sacrifie"},
    {n:3, ar:"إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ", tr:"Inna shāniʾaka huwa l-abtar", fr:"C'est ton ennemi qui est sans postérité"},
  ]},
  { number:109, name:"Al-Kāfirūn", arabic:"الكافرون", juz:30, verses:[
    {n:1, ar:"قُلْ يَا أَيُّهَا الْكَافِرُونَ", tr:"Qul yā ayyuhā l-kāfirūn", fr:"Dis : Ô vous les mécréants"},
    {n:2, ar:"لَا أَعْبُدُ مَا تَعْبُدُونَ", tr:"Lā aʿbudu mā taʿbudūn", fr:"Je n'adore pas ce que vous adorez"},
    {n:3, ar:"وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ", tr:"Wa-lā antum ʿābidūna mā aʿbud", fr:"Et vous n'adorez pas ce que j'adore"},
    {n:4, ar:"وَلَا أَنَا عَابِدٌ مَّا عَبَدتُّمْ", tr:"Wa-lā anā ʿābidun mā ʿabadtum", fr:"Je ne suis pas adorateur de ce que vous avez adoré"},
    {n:5, ar:"وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ", tr:"Wa-lā antum ʿābidūna mā aʿbud", fr:"Et vous n'êtes pas adorateurs de ce que j'adore"},
    {n:6, ar:"لَكُمْ دِينُكُمْ وَلِيَ دِينِ", tr:"Lakum dīnukum wa-liya dīn", fr:"À vous votre religion, à moi la mienne"},
  ]},
  { number:110, name:"An-Naṣr", arabic:"النصر", juz:30, verses:[
    {n:1, ar:"إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ", tr:"Idhā jāʾa naṣru llāhi wa-l-fatḥ", fr:"Quand vient le secours d'Allah et la victoire"},
    {n:2, ar:"وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا", tr:"Wa-raʾayta n-nāsa yadkhulūna fī dīni llāhi afwājā", fr:"et que tu vois les gens entrer en foule dans la religion d'Allah"},
    {n:3, ar:"فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ إِنَّهُ كَانَ تَوَّابًا", tr:"Fasabbiḥ bi-ḥamdi rabbika wa-staġfirhu innahū kāna tawwābā", fr:"célèbre la gloire de ton Seigneur et implore Son pardon"},
  ]},
  { number:111, name:"Al-Masad", arabic:"المسد", juz:30, verses:[
    {n:1, ar:"تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ", tr:"Tabbat yadā abī lahabin wa-tabb", fr:"Que périssent les deux mains d'Abī Lahab !"},
    {n:2, ar:"مَا أَغْنَىٰ عَنْهُ مَالُهُ وَمَا كَسَبَ", tr:"Mā aġnā ʿanhu māluhu wa-mā kasab", fr:"Sa richesse ne lui a servi à rien"},
    {n:3, ar:"سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ", tr:"Sa-yaṣlā nāran dhāta lahab", fr:"Il sera brûlé dans un feu plein de flammes"},
    {n:4, ar:"وَامْرَأَتُهُ حَمَّالَةَ الْحَطَبِ", tr:"Wa-mraʾatuhū ḥammālata l-ḥaṭab", fr:"Et sa femme, la porteuse de bois"},
    {n:5, ar:"فِي جِيدِهَا حَبْلٌ مِّن مَّسَدٍ", tr:"Fī jīdihā ḥablun min masad", fr:"avec une corde de fibres autour du cou"},
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
// DONNÉES — Vocabulaire coranique (100 mots les plus fréquents)
// ═══════════════════════════════════════════════════════
// DONNÉES — Vocabulaire coranique (500 mots les plus utilisés)
// ═══════════════════════════════════════════════════════
const VOCAB = [
  {id:1,ar:"اللَّهُ",tr:"Allāhu",fr:"Allah",freq:2699,cat:"essentiel"},
  {id:2,ar:"رَبِّ",tr:"rabbi",fr:"Seigneur (mon)",freq:980,cat:"essentiel"},
  {id:3,ar:"قَالَ",tr:"qāla",fr:"Il dit",freq:529,cat:"verbe"},
  {id:4,ar:"إِنَّ",tr:"inna",fr:"Certes / vraiment",freq:1709,cat:"particule"},
  {id:5,ar:"مَا",tr:"mā",fr:"ce qui / pas (nég.)",freq:1598,cat:"particule"},
  {id:6,ar:"لَا",tr:"lā",fr:"non / ne...pas",freq:1403,cat:"particule"},
  {id:7,ar:"مِنْ",tr:"min",fr:"de / parmi",freq:2764,cat:"préposition"},
  {id:8,ar:"فِي",tr:"fī",fr:"dans / en",freq:1711,cat:"préposition"},
  {id:9,ar:"عَلَى",tr:"ʿalā",fr:"sur / contre",freq:1244,cat:"préposition"},
  {id:10,ar:"إِلَى",tr:"ilā",fr:"vers / jusqu'à",freq:742,cat:"préposition"},
  {id:11,ar:"الَّذِي",tr:"alladhī",fr:"celui qui",freq:1470,cat:"relatif"},
  {id:12,ar:"هُوَ",tr:"huwa",fr:"il / lui",freq:604,cat:"pronom"},
  {id:13,ar:"كَانَ",tr:"kāna",fr:"il était / a été",freq:1358,cat:"verbe"},
  {id:14,ar:"وَ",tr:"wa",fr:"et",freq:49248,cat:"particule"},
  {id:15,ar:"أَنَّ",tr:"anna",fr:"que (conjonction)",freq:1030,cat:"particule"},
  {id:16,ar:"لَهُمْ",tr:"lahum",fr:"pour eux / à eux",freq:817,cat:"pronom"},
  {id:17,ar:"يَوْمَ",tr:"yawma",fr:"le jour (où)",freq:405,cat:"temps"},
  {id:18,ar:"آمَنُوا",tr:"āmanū",fr:"ils ont cru",freq:258,cat:"verbe"},
  {id:19,ar:"النَّاسِ",tr:"n-nāsi",fr:"gens / humains",freq:241,cat:"nom"},
  {id:20,ar:"الْأَرْضِ",tr:"al-arḍi",fr:"la terre",freq:461,cat:"nom"},
  {id:21,ar:"السَّمَاوَاتِ",tr:"as-samāwāti",fr:"les cieux",freq:189,cat:"nom"},
  {id:22,ar:"رَحِيمٌ",tr:"raḥīmun",fr:"Très Miséricordieux",freq:115,cat:"attribut"},
  {id:23,ar:"الرَّحْمَانُ",tr:"ar-raḥmānu",fr:"Tout Miséricordieux",freq:57,cat:"attribut"},
  {id:24,ar:"عَلِيمٌ",tr:"ʿalīmun",fr:"Omniscient",freq:157,cat:"attribut"},
  {id:25,ar:"عَظِيمٌ",tr:"ʿaẓīmun",fr:"Immense / Grand",freq:108,cat:"attribut"},
  {id:26,ar:"حَكِيمٌ",tr:"ḥakīmun",fr:"Sage",freq:97,cat:"attribut"},
  {id:27,ar:"قَدِيرٌ",tr:"qadīrun",fr:"Puissant",freq:45,cat:"attribut"},
  {id:28,ar:"سَبِيلِ",tr:"sabīli",fr:"voie / chemin",freq:166,cat:"nom"},
  {id:29,ar:"نَفْسَ",tr:"nafsa",fr:"âme / soi-même",freq:295,cat:"nom"},
  {id:30,ar:"قُلْ",tr:"qul",fr:"Dis !",freq:332,cat:"verbe"},
  {id:31,ar:"كِتَابِ",tr:"kitābi",fr:"livre / écrit",freq:319,cat:"nom"},
  {id:32,ar:"حَقِّ",tr:"ḥaqqi",fr:"vérité / droit",freq:287,cat:"nom"},
  {id:33,ar:"نُورَ",tr:"nūra",fr:"lumière",freq:49,cat:"nom"},
  {id:34,ar:"قَلْبِ",tr:"qalbi",fr:"cœur",freq:132,cat:"nom"},
  {id:35,ar:"جَنَّةِ",tr:"jannati",fr:"paradis / jardin",freq:147,cat:"nom"},
  {id:36,ar:"نَارِ",tr:"nāri",fr:"feu / enfer",freq:145,cat:"nom"},
  {id:37,ar:"عَمِلَ",tr:"ʿamila",fr:"il a fait / oeuvré",freq:104,cat:"verbe"},
  {id:38,ar:"عِلْمِ",tr:"ʿilmi",fr:"science / connaissance",freq:105,cat:"nom"},
  {id:39,ar:"الصَّلَاةَ",tr:"aṣ-ṣalāta",fr:"la prière",freq:99,cat:"nom"},
  {id:40,ar:"رَسُولُ",tr:"rasūlu",fr:"messager / prophète",freq:332,cat:"nom"},
  {id:41,ar:"آيَاتِ",tr:"āyāti",fr:"signes / versets",freq:382,cat:"nom"},
  {id:42,ar:"مُؤْمِنُونَ",tr:"muʾminūna",fr:"croyants",freq:182,cat:"nom"},
  {id:43,ar:"ظَالِمُونَ",tr:"ẓālimūna",fr:"injustes",freq:94,cat:"nom"},
  {id:44,ar:"مُتَّقِينَ",tr:"muttaqīna",fr:"pieux / craignant Allah",freq:55,cat:"nom"},
  {id:45,ar:"شَيْءٍ",tr:"shayʾin",fr:"chose",freq:519,cat:"nom"},
  {id:46,ar:"خَيْرٌ",tr:"khayrun",fr:"bien / meilleur",freq:199,cat:"nom"},
  {id:47,ar:"كَبِيرٌ",tr:"kabīrun",fr:"grand / important",freq:73,cat:"adjectif"},
  {id:48,ar:"صَغِيرٌ",tr:"ṣaghīrun",fr:"petit",freq:14,cat:"adjectif"},
  {id:49,ar:"حَمْدُ",tr:"ḥamdu",fr:"louange",freq:42,cat:"nom"},
  {id:50,ar:"صِرَاطَ",tr:"ṣirāṭa",fr:"chemin droit",freq:45,cat:"nom"},
  {id:51,ar:"تَوْبَةَ",tr:"tawbata",fr:"repentir",freq:88,cat:"nom"},
  {id:52,ar:"رَحْمَةَ",tr:"raḥmata",fr:"miséricorde",freq:114,cat:"nom"},
  {id:53,ar:"نِعْمَةَ",tr:"niʿmata",fr:"bienfait / grâce",freq:66,cat:"nom"},
  {id:54,ar:"أَمْرَ",tr:"amra",fr:"ordre / affaire",freq:264,cat:"nom"},
  {id:55,ar:"قَوْمَ",tr:"qawma",fr:"peuple / nation",freq:383,cat:"nom"},
  {id:56,ar:"مُوسَى",tr:"mūsā",fr:"Moïse",freq:136,cat:"nom propre"},
  {id:57,ar:"إِبْرَاهِيمَ",tr:"ibrāhīm",fr:"Abraham",freq:69,cat:"nom propre"},
  {id:58,ar:"عِيسَى",tr:"ʿīsā",fr:"Jésus",freq:25,cat:"nom propre"},
  {id:59,ar:"مَلَائِكَةِ",tr:"malāʾikati",fr:"anges",freq:68,cat:"nom"},
  {id:60,ar:"شَيْطَانِ",tr:"shayṭāni",fr:"Satan",freq:88,cat:"nom"},
  {id:61,ar:"آخِرَةِ",tr:"ākhirati",fr:"au-delà",freq:115,cat:"nom"},
  {id:62,ar:"الدُّنْيَا",tr:"ad-dunyā",fr:"monde ici-bas",freq:115,cat:"nom"},
  {id:63,ar:"مَوْتِ",tr:"mawti",fr:"mort",freq:56,cat:"nom"},
  {id:64,ar:"حَيَاةِ",tr:"ḥayāti",fr:"vie",freq:71,cat:"nom"},
  {id:65,ar:"عَذَابِ",tr:"ʿadhābi",fr:"châtiment",freq:322,cat:"nom"},
  {id:66,ar:"ثَوَابِ",tr:"thawābi",fr:"récompense",freq:7,cat:"nom"},
  {id:67,ar:"أَجْرَ",tr:"ajra",fr:"salaire / rétribution",freq:107,cat:"nom"},
  {id:68,ar:"فَضْلِ",tr:"faḍli",fr:"faveur / grâce",freq:87,cat:"nom"},
  {id:69,ar:"حُكْمَ",tr:"ḥukma",fr:"jugement",freq:76,cat:"nom"},
  {id:70,ar:"صَبْرِ",tr:"ṣabri",fr:"patience",freq:90,cat:"nom"},
  {id:71,ar:"شُكْرِ",tr:"shukri",fr:"gratitude",freq:17,cat:"nom"},
  {id:72,ar:"إِيمَانِ",tr:"īmāni",fr:"foi / croyance",freq:45,cat:"nom"},
  {id:73,ar:"تَقْوَى",tr:"taqwā",fr:"piété",freq:41,cat:"nom"},
  {id:74,ar:"هُدًى",tr:"hudan",fr:"guidance",freq:95,cat:"nom"},
  {id:75,ar:"ضَلَالَ",tr:"ḍalāla",fr:"égarement",freq:34,cat:"nom"},
  {id:76,ar:"رَزَقَ",tr:"razaqa",fr:"Il a pourvu",freq:123,cat:"verbe"},
  {id:77,ar:"خَلَقَ",tr:"khalaqa",fr:"Il a créé",freq:85,cat:"verbe"},
  {id:78,ar:"أَرْسَلَ",tr:"arsala",fr:"Il a envoyé",freq:77,cat:"verbe"},
  {id:79,ar:"أَنزَلَ",tr:"anzala",fr:"Il a fait descendre",freq:97,cat:"verbe"},
  {id:80,ar:"جَعَلَ",tr:"jaʿala",fr:"Il a établi",freq:345,cat:"verbe"},
  {id:81,ar:"دَعَا",tr:"daʿā",fr:"Il a invoqué",freq:111,cat:"verbe"},
  {id:82,ar:"كَفَرَ",tr:"kafara",fr:"Il a mécru",freq:138,cat:"verbe"},
  {id:83,ar:"ظَلَمَ",tr:"ẓalama",fr:"Il a opprimé",freq:96,cat:"verbe"},
  {id:84,ar:"عَلِمَ",tr:"ʿalima",fr:"Il a su / connu",freq:382,cat:"verbe"},
  {id:85,ar:"سَمِعَ",tr:"samiʿa",fr:"Il a entendu",freq:185,cat:"verbe"},
  {id:86,ar:"يَدَ",tr:"yada",fr:"main",freq:120,cat:"nom"},
  {id:87,ar:"وَجْهَ",tr:"wajha",fr:"visage / face",freq:72,cat:"nom"},
  {id:88,ar:"عَقْلَ",tr:"ʿaqla",fr:"raison / intelligence",freq:49,cat:"nom"},
  {id:89,ar:"بَيْتِ",tr:"bayti",fr:"maison",freq:72,cat:"nom"},
  {id:90,ar:"أَهْلَ",tr:"ahla",fr:"famille / gens de",freq:127,cat:"nom"},
  {id:91,ar:"وَلَدَ",tr:"walada",fr:"enfant / fils",freq:36,cat:"nom"},
  {id:92,ar:"أَبٍ",tr:"abi",fr:"père",freq:120,cat:"nom"},
  {id:93,ar:"أُمَّةَ",tr:"ummata",fr:"communauté / nation",freq:64,cat:"nom"},
  {id:94,ar:"دِينِ",tr:"dīni",fr:"religion / jugement",freq:92,cat:"nom"},
  {id:95,ar:"إِسْلَامِ",tr:"islāmi",fr:"Islam / soumission",freq:8,cat:"nom"},
  {id:96,ar:"كُلِّ",tr:"kulli",fr:"tout / chaque",freq:654,cat:"particule"},
  {id:97,ar:"إِذَا",tr:"idhā",fr:"quand / lorsque",freq:408,cat:"particule"},
  {id:98,ar:"إِلَّا",tr:"illā",fr:"sauf / sinon",freq:659,cat:"particule"},
  {id:99,ar:"لَكِنَّ",tr:"lākinna",fr:"mais / cependant",freq:23,cat:"particule"},
  {id:100,ar:"حَتَّى",tr:"ḥattā",fr:"jusqu'à / même",freq:249,cat:"particule"},
  {id:101,ar:"لَعَلَّ",tr:"laʿalla",fr:"peut-être / afin que",freq:129,cat:"particule"},
  {id:102,ar:"هَلْ",tr:"hal",fr:"est-ce que ?",freq:181,cat:"particule"},
  {id:103,ar:"أَمْ",tr:"am",fr:"ou bien",freq:160,cat:"particule"},
  {id:104,ar:"ثُمَّ",tr:"thumma",fr:"puis / ensuite",freq:337,cat:"particule"},
  {id:105,ar:"بَعْدَ",tr:"baʿda",fr:"après",freq:159,cat:"préposition"},
  {id:106,ar:"قَبْلَ",tr:"qabla",fr:"avant",freq:154,cat:"préposition"},
  {id:107,ar:"عِنْدَ",tr:"ʿinda",fr:"auprès de / chez",freq:192,cat:"préposition"},
  {id:108,ar:"مَعَ",tr:"maʿa",fr:"avec / en compagnie de",freq:168,cat:"préposition"},
  {id:109,ar:"بَيْنَ",tr:"bayna",fr:"entre",freq:186,cat:"préposition"},
  {id:110,ar:"فَوْقَ",tr:"fawqa",fr:"au-dessus de",freq:22,cat:"préposition"},
  {id:111,ar:"تَحْتَ",tr:"taḥta",fr:"en-dessous de",freq:16,cat:"préposition"},
  {id:112,ar:"أَمَامَ",tr:"amāma",fr:"devant",freq:4,cat:"préposition"},
  {id:113,ar:"خَلْفَ",tr:"khalfa",fr:"derrière",freq:6,cat:"préposition"},
  {id:114,ar:"كَيْفَ",tr:"kayfa",fr:"comment",freq:42,cat:"particule"},
  {id:115,ar:"مَنْ",tr:"man",fr:"qui / celui qui",freq:651,cat:"pronom"},
  {id:116,ar:"هُمْ",tr:"hum",fr:"eux / ils",freq:419,cat:"pronom"},
  {id:117,ar:"هِيَ",tr:"hiya",fr:"elle",freq:186,cat:"pronom"},
  {id:118,ar:"نَحْنُ",tr:"naḥnu",fr:"nous",freq:64,cat:"pronom"},
  {id:119,ar:"أَنْتَ",tr:"anta",fr:"tu / toi (masc.)",freq:112,cat:"pronom"},
  {id:120,ar:"أَنَا",tr:"anā",fr:"je / moi",freq:65,cat:"pronom"},
  {id:121,ar:"يَوْمِ الْقِيَامَةِ",tr:"yawmi l-qiyāma",fr:"Jour du Jugement",freq:70,cat:"expression"},
  {id:122,ar:"الْقِيَامَةِ",tr:"al-qiyāmati",fr:"la Résurrection",freq:70,cat:"nom"},
  {id:123,ar:"جَهَنَّمَ",tr:"jahannama",fr:"Géhenne / Enfer",freq:77,cat:"nom"},
  {id:124,ar:"الْجَنَّةَ",tr:"al-jannata",fr:"le Paradis",freq:73,cat:"nom"},
  {id:125,ar:"مَلَكَ",tr:"malaka",fr:"ange / roi",freq:88,cat:"nom"},
  {id:126,ar:"نَبِيَّ",tr:"nabiyya",fr:"prophète",freq:75,cat:"nom"},
  {id:127,ar:"صَادِقِينَ",tr:"ṣādiqīna",fr:"véridiques / sincères",freq:24,cat:"nom"},
  {id:128,ar:"صَالِحِينَ",tr:"ṣāliḥīna",fr:"vertueux / justes",freq:43,cat:"nom"},
  {id:129,ar:"الصَّابِرِينَ",tr:"aṣ-ṣābirīna",fr:"les patients / endurants",freq:16,cat:"nom"},
  {id:130,ar:"الْكَافِرِينَ",tr:"al-kāfirīna",fr:"les mécréants",freq:93,cat:"nom"},
  {id:131,ar:"الْمُنَافِقِينَ",tr:"al-munāfiqīna",fr:"les hypocrites",freq:27,cat:"nom"},
  {id:132,ar:"الْمُشْرِكِينَ",tr:"al-mushrikīna",fr:"les associateurs",freq:36,cat:"nom"},
  {id:133,ar:"الظَّالِمِينَ",tr:"aẓ-ẓālimīna",fr:"les injustes",freq:97,cat:"nom"},
  {id:134,ar:"الْمُؤْمِنِينَ",tr:"al-muʾminīna",fr:"les croyants",freq:167,cat:"nom"},
  {id:135,ar:"الْفَاسِقِينَ",tr:"al-fāsiqīna",fr:"les pervers",freq:34,cat:"nom"},
  {id:136,ar:"قُرْآنَ",tr:"qurʾāna",fr:"Coran",freq:70,cat:"nom"},
  {id:137,ar:"تَوْرَاةَ",tr:"tawrāta",fr:"Torah",freq:18,cat:"nom"},
  {id:138,ar:"إِنجِيلَ",tr:"injīla",fr:"Évangile",freq:12,cat:"nom"},
  {id:139,ar:"سُورَةَ",tr:"sūrata",fr:"sourate",freq:8,cat:"nom"},
  {id:140,ar:"آيَةَ",tr:"āyata",fr:"verset / signe",freq:382,cat:"nom"},
  {id:141,ar:"بِسْمِ",tr:"bismi",fr:"au nom de",freq:114,cat:"expression"},
  {id:142,ar:"الْحَمْدُ لِلَّهِ",tr:"al-ḥamdu lillāh",fr:"Louange à Allah",freq:26,cat:"expression"},
  {id:143,ar:"سُبْحَانَ",tr:"subḥāna",fr:"Gloire à / Louange à",freq:41,cat:"verbe"},
  {id:144,ar:"تَبَارَكَ",tr:"tabāraka",fr:"Béni soit",freq:9,cat:"verbe"},
  {id:145,ar:"أَعُوذُ",tr:"aʿūdhu",fr:"je cherche refuge",freq:11,cat:"verbe"},
  {id:146,ar:"فَسُبْحَانَ",tr:"fa-subḥāna",fr:"Gloire donc à",freq:7,cat:"verbe"},
  {id:147,ar:"الصَّادِقُ",tr:"aṣ-ṣādiq",fr:"le Véridique",freq:5,cat:"attribut"},
  {id:148,ar:"الْحَكِيمُ",tr:"al-ḥakīm",fr:"le Sage",freq:97,cat:"attribut"},
  {id:149,ar:"الْعَزِيزُ",tr:"al-ʿazīz",fr:"le Tout-Puissant",freq:92,cat:"attribut"},
  {id:150,ar:"الْغَفُورُ",tr:"al-ghafūr",fr:"le Très Pardonneur",freq:91,cat:"attribut"},
  {id:151,ar:"الْوَدُودُ",tr:"al-wadūd",fr:"le Très Aimant",freq:2,cat:"attribut"},
  {id:152,ar:"الْكَرِيمُ",tr:"al-karīm",fr:"le Généreux",freq:2,cat:"attribut"},
  {id:153,ar:"الْعَلِيُّ",tr:"al-ʿaliyy",fr:"le Très Haut",freq:8,cat:"attribut"},
  {id:154,ar:"الْقَوِيُّ",tr:"al-qawiyy",fr:"le Fort",freq:9,cat:"attribut"},
  {id:155,ar:"السَّمِيعُ",tr:"as-samīʿ",fr:"l'Audient",freq:47,cat:"attribut"},
  {id:156,ar:"الْبَصِيرُ",tr:"al-baṣīr",fr:"le Clairvoyant",freq:42,cat:"attribut"},
  {id:157,ar:"الرَّحِيمُ",tr:"ar-raḥīm",fr:"le Très Miséricordieux",freq:115,cat:"attribut"},
  {id:158,ar:"الرَّحْمَانُ",tr:"ar-raḥmān",fr:"le Tout Miséricordieux",freq:57,cat:"attribut"},
  {id:159,ar:"الْقَهَّارُ",tr:"al-qahhār",fr:"le Dominateur",freq:6,cat:"attribut"},
  {id:160,ar:"الْوَاحِدُ",tr:"al-wāḥid",fr:"l'Unique",freq:22,cat:"attribut"},
  {id:161,ar:"الْأَحَدُ",tr:"al-aḥad",fr:"l'Un / l'Unique",freq:2,cat:"attribut"},
  {id:162,ar:"الصَّمَدُ",tr:"aṣ-ṣamad",fr:"le Seul imploré",freq:1,cat:"attribut"},
  {id:163,ar:"الْخَالِقُ",tr:"al-khāliq",fr:"le Créateur",freq:8,cat:"attribut"},
  {id:164,ar:"الرَّازِقُ",tr:"ar-rāziq",fr:"le Pourvoyeur",freq:6,cat:"attribut"},
  {id:165,ar:"الْفَتَّاحُ",tr:"al-fattāḥ",fr:"le Juge suprême",freq:1,cat:"attribut"},
  {id:166,ar:"الْعَلِيمُ",tr:"al-ʿalīm",fr:"l'Omniscient",freq:157,cat:"attribut"},
  {id:167,ar:"الْقَدِيرُ",tr:"al-qadīr",fr:"l'Omnipotent",freq:45,cat:"attribut"},
  {id:168,ar:"التَّوَّابُ",tr:"at-tawwāb",fr:"le Grand Repentant",freq:11,cat:"attribut"},
  {id:169,ar:"الْغَنِيُّ",tr:"al-ghaniyy",fr:"le Riche absolu",freq:18,cat:"attribut"},
  {id:170,ar:"الْحَمِيدُ",tr:"al-ḥamīd",fr:"le Digne de louange",freq:17,cat:"attribut"},
  {id:171,ar:"سُبْحَانَهُ",tr:"subḥānahu",fr:"Gloire à Lui",freq:41,cat:"expression"},
  {id:172,ar:"أَلَا",tr:"alā",fr:"non ! / certes !",freq:32,cat:"particule"},
  {id:173,ar:"كَذَلِكَ",tr:"kadhālika",fr:"ainsi / de même",freq:162,cat:"particule"},
  {id:174,ar:"إِنَّمَا",tr:"innamā",fr:"seulement / ce n'est que",freq:163,cat:"particule"},
  {id:175,ar:"لَمَّا",tr:"lammā",fr:"quand / lorsque",freq:68,cat:"particule"},
  {id:176,ar:"لَيْسَ",tr:"laysa",fr:"n'est pas / il n'y a pas",freq:85,cat:"verbe"},
  {id:177,ar:"يَعْلَمُ",tr:"yaʿlamu",fr:"il sait / connaît",freq:178,cat:"verbe"},
  {id:178,ar:"يَرَى",tr:"yarā",fr:"il voit",freq:46,cat:"verbe"},
  {id:179,ar:"يَشَاءُ",tr:"yashāʾu",fr:"il veut / permet",freq:148,cat:"verbe"},
  {id:180,ar:"يَعْبُدُونَ",tr:"yaʿbudūna",fr:"ils adorent",freq:32,cat:"verbe"},
  {id:181,ar:"يُؤْمِنُونَ",tr:"yuʾminūna",fr:"ils croient",freq:162,cat:"verbe"},
  {id:182,ar:"يَعْمَلُونَ",tr:"yaʿmalūna",fr:"ils font / oeuvrent",freq:101,cat:"verbe"},
  {id:183,ar:"يَتَّقُونَ",tr:"yattaqūna",fr:"ils craignent Allah",freq:42,cat:"verbe"},
  {id:184,ar:"يَكْفُرُونَ",tr:"yakfurūna",fr:"ils mécroyent",freq:35,cat:"verbe"},
  {id:185,ar:"يَفْعَلُونَ",tr:"yafʿalūna",fr:"ils font / agissent",freq:22,cat:"verbe"},
  {id:186,ar:"يَتَوَكَّلُونَ",tr:"yatawakkalūna",fr:"ils se confient à Allah",freq:14,cat:"verbe"},
  {id:187,ar:"يَسْتَغْفِرُونَ",tr:"yastaghfirūna",fr:"ils demandent pardon",freq:9,cat:"verbe"},
  {id:188,ar:"يُسَبِّحُونَ",tr:"yusabbiḥūna",fr:"ils glorifient",freq:11,cat:"verbe"},
  {id:189,ar:"يُكَذِّبُونَ",tr:"yukadhdhibūna",fr:"ils traitent de mensonge",freq:54,cat:"verbe"},
  {id:190,ar:"يَسْجُدُونَ",tr:"yasjudūna",fr:"ils se prosternent",freq:13,cat:"verbe"},
  {id:191,ar:"فَأَقِيمُوا",tr:"fa-aqīmū",fr:"établissez donc (la prière)",freq:8,cat:"verbe"},
  {id:192,ar:"آتُوا الزَّكَاةَ",tr:"ātū az-zakāta",fr:"acquittez la zakāt",freq:32,cat:"expression"},
  {id:193,ar:"الزَّكَاةَ",tr:"az-zakāta",fr:"la zakāt / aumône",freq:32,cat:"nom"},
  {id:194,ar:"الصِّيَامَ",tr:"aṣ-ṣiyāma",fr:"le jeûne",freq:2,cat:"nom"},
  {id:195,ar:"الْحَجَّ",tr:"al-ḥajj",fr:"le pèlerinage",freq:10,cat:"nom"},
  {id:196,ar:"الشَّهَادَةَ",tr:"ash-shahādata",fr:"le témoignage / martyre",freq:19,cat:"nom"},
  {id:197,ar:"الْجِهَادَ",tr:"al-jihāda",fr:"l'effort / la lutte",freq:35,cat:"nom"},
  {id:198,ar:"التَّسْبِيحَ",tr:"at-tasbīḥa",fr:"la glorification",freq:29,cat:"nom"},
  {id:199,ar:"الذِّكْرَ",tr:"adh-dhikra",fr:"le rappel / le souvenir",freq:60,cat:"nom"},
  {id:200,ar:"التَّفَكُّرَ",tr:"at-tafakkura",fr:"la réflexion",freq:8,cat:"nom"},
  {id:201,ar:"وَقْتِ",tr:"waqti",fr:"temps / moment",freq:17,cat:"nom"},
  {id:202,ar:"لَيْلِ",tr:"layli",fr:"nuit",freq:92,cat:"nom"},
  {id:203,ar:"نَهَارِ",tr:"nahāri",fr:"jour / journée",freq:57,cat:"nom"},
  {id:204,ar:"شَمْسِ",tr:"shamsi",fr:"soleil",freq:33,cat:"nom"},
  {id:205,ar:"قَمَرِ",tr:"qamari",fr:"lune",freq:27,cat:"nom"},
  {id:206,ar:"نُجُومِ",tr:"nujūmi",fr:"étoiles",freq:13,cat:"nom"},
  {id:207,ar:"مَاءِ",tr:"māʾi",fr:"eau",freq:63,cat:"nom"},
  {id:208,ar:"نَارٍ",tr:"nārin",fr:"feu",freq:145,cat:"nom"},
  {id:209,ar:"تُرَابِ",tr:"turābi",fr:"poussière / terre",freq:17,cat:"nom"},
  {id:210,ar:"رِيحِ",tr:"rīḥi",fr:"vent",freq:29,cat:"nom"},
  {id:211,ar:"سَحَابِ",tr:"saḥābi",fr:"nuages",freq:8,cat:"nom"},
  {id:212,ar:"مَطَرِ",tr:"maṭari",fr:"pluie",freq:7,cat:"nom"},
  {id:213,ar:"بَحْرِ",tr:"baḥri",fr:"mer / océan",freq:41,cat:"nom"},
  {id:214,ar:"نَهْرِ",tr:"nahri",fr:"fleuve / rivière",freq:13,cat:"nom"},
  {id:215,ar:"جَبَلِ",tr:"jabali",fr:"montagne",freq:39,cat:"nom"},
  {id:216,ar:"شَجَرَةِ",tr:"shajaratin",fr:"arbre",freq:26,cat:"nom"},
  {id:217,ar:"زَرْعِ",tr:"zarʿi",fr:"semence / culture",freq:15,cat:"nom"},
  {id:218,ar:"ثَمَرِ",tr:"thamari",fr:"fruit",freq:22,cat:"nom"},
  {id:219,ar:"حَيَوَانِ",tr:"ḥayawāni",fr:"animal / vie",freq:1,cat:"nom"},
  {id:220,ar:"إِنسَانِ",tr:"insāni",fr:"être humain",freq:65,cat:"nom"},
  {id:221,ar:"بَشَرِ",tr:"bashari",fr:"être humain / humanité",freq:37,cat:"nom"},
  {id:222,ar:"رُوحِ",tr:"rūḥi",fr:"esprit / souffle",freq:21,cat:"nom"},
  {id:223,ar:"جَسَدِ",tr:"jasadi",fr:"corps",freq:5,cat:"nom"},
  {id:224,ar:"عَيْنِ",tr:"ʿayni",fr:"oeil / source",freq:45,cat:"nom"},
  {id:225,ar:"أُذُنِ",tr:"udhuni",fr:"oreille",freq:6,cat:"nom"},
  {id:226,ar:"لِسَانِ",tr:"lisāni",fr:"langue / parole",freq:25,cat:"nom"},
  {id:227,ar:"يَدِ",tr:"yadi",fr:"main",freq:120,cat:"nom"},
  {id:228,ar:"رِجْلِ",tr:"rijli",fr:"pied / jambe",freq:7,cat:"nom"},
  {id:229,ar:"رَأْسِ",tr:"raʾsi",fr:"tête",freq:10,cat:"nom"},
  {id:230,ar:"قَلْبِ",tr:"qalbi",fr:"cœur",freq:132,cat:"nom"},
  {id:231,ar:"صَدْرِ",tr:"ṣadri",fr:"poitrine / cœur",freq:44,cat:"nom"},
  {id:232,ar:"كَلِمَةَ",tr:"kalimata",fr:"parole / mot",freq:74,cat:"nom"},
  {id:233,ar:"كَلَامَ",tr:"kalāma",fr:"discours / parole",freq:3,cat:"nom"},
  {id:234,ar:"قَوْلَ",tr:"qawla",fr:"parole / propos",freq:61,cat:"nom"},
  {id:235,ar:"فِعْلَ",tr:"fiʿla",fr:"acte / action",freq:2,cat:"nom"},
  {id:236,ar:"عَمَلَ",tr:"ʿamala",fr:"oeuvre / travail",freq:104,cat:"nom"},
  {id:237,ar:"نِيَّةَ",tr:"niyyata",fr:"intention",freq:1,cat:"nom"},
  {id:238,ar:"حِكْمَةَ",tr:"ḥikmata",fr:"sagesse",freq:20,cat:"nom"},
  {id:239,ar:"مَوْعِظَةَ",tr:"mawʿiẓata",fr:"exhortation",freq:5,cat:"nom"},
  {id:240,ar:"فَضِيلَةَ",tr:"faḍīlata",fr:"mérite / vertu",freq:1,cat:"nom"},
  {id:241,ar:"بِرَّ",tr:"birra",fr:"piété / bonté",freq:7,cat:"nom"},
  {id:242,ar:"تَقْوَى",tr:"taqwā",fr:"crainte pieuse",freq:41,cat:"nom"},
  {id:243,ar:"إِخْلَاصَ",tr:"ikhlāṣa",fr:"sincérité",freq:2,cat:"nom"},
  {id:244,ar:"خَشْيَةَ",tr:"khashyata",fr:"crainte / révérence",freq:15,cat:"nom"},
  {id:245,ar:"حُبَّ",tr:"ḥubba",fr:"amour / attachement",freq:23,cat:"nom"},
  {id:246,ar:"كَرَهَ",tr:"karaha",fr:"il déteste / a en horreur",freq:21,cat:"verbe"},
  {id:247,ar:"خَافَ",tr:"khāfa",fr:"il craint",freq:44,cat:"verbe"},
  {id:248,ar:"رَجَا",tr:"rajā",fr:"il espère",freq:28,cat:"verbe"},
  {id:249,ar:"تَابَ",tr:"tāba",fr:"il s'est repenti",freq:88,cat:"verbe"},
  {id:250,ar:"اسْتَغْفَرَ",tr:"istaghfara",fr:"il a demandé pardon",freq:23,cat:"verbe"},
  {id:251,ar:"شَكَرَ",tr:"shakara",fr:"il a remercié",freq:17,cat:"verbe"},
  {id:252,ar:"صَبَرَ",tr:"ṣabara",fr:"il a été patient",freq:45,cat:"verbe"},
  {id:253,ar:"جَاهَدَ",tr:"jāhada",fr:"il a lutté / s'est efforcé",freq:35,cat:"verbe"},
  {id:254,ar:"هَاجَرَ",tr:"hājara",fr:"il a émigré",freq:28,cat:"verbe"},
  {id:255,ar:"نَصَرَ",tr:"naṣara",fr:"il a secouru",freq:27,cat:"verbe"},
  {id:256,ar:"أَعَانَ",tr:"aʿāna",fr:"il a aidé",freq:2,cat:"verbe"},
  {id:257,ar:"أَحَبَّ",tr:"aḥabba",fr:"il a aimé",freq:40,cat:"verbe"},
  {id:258,ar:"غَفَرَ",tr:"ghafara",fr:"il a pardonné",freq:35,cat:"verbe"},
  {id:259,ar:"هَدَى",tr:"hadā",fr:"il a guidé",freq:121,cat:"verbe"},
  {id:260,ar:"عَفَا",tr:"ʿafā",fr:"il a effacé / pardonné",freq:21,cat:"verbe"},
  {id:261,ar:"أَعْطَى",tr:"aʿṭā",fr:"il a donné / accordé",freq:7,cat:"verbe"},
  {id:262,ar:"مَنَعَ",tr:"manaʿa",fr:"il a empêché / refusé",freq:16,cat:"verbe"},
  {id:263,ar:"قَدَّرَ",tr:"qaddara",fr:"il a décrété / mesuré",freq:6,cat:"verbe"},
  {id:264,ar:"دَبَّرَ",tr:"dabbara",fr:"il a dirigé / organisé",freq:4,cat:"verbe"},
  {id:265,ar:"حَاسَبَ",tr:"ḥāsaba",fr:"il a compté / jugé",freq:4,cat:"verbe"},
  {id:266,ar:"جَازَى",tr:"jāzā",fr:"il a rétribué",freq:3,cat:"verbe"},
  {id:267,ar:"عَذَّبَ",tr:"ʿadhdhaba",fr:"il a châtié / torturé",freq:22,cat:"verbe"},
  {id:268,ar:"بَشَّرَ",tr:"bashshara",fr:"il a annoncé bonne nouvelle",freq:15,cat:"verbe"},
  {id:269,ar:"أَنذَرَ",tr:"andhara",fr:"il a averti",freq:54,cat:"verbe"},
  {id:270,ar:"أَقَامَ",tr:"aqāma",fr:"il a établi / accompli",freq:22,cat:"verbe"},
  {id:271,ar:"الصَّلَاةَ",tr:"aṣ-ṣalāh",fr:"la prière rituelle",freq:99,cat:"pilier"},
  {id:272,ar:"رَمَضَانَ",tr:"ramaḍāna",fr:"Ramadan",freq:1,cat:"nom"},
  {id:273,ar:"مَكَّةَ",tr:"makkata",fr:"La Mecque",freq:2,cat:"lieu"},
  {id:274,ar:"الْمَدِينَةَ",tr:"al-madīnata",fr:"Médine / la ville",freq:6,cat:"lieu"},
  {id:275,ar:"الْمَسْجِدَ",tr:"al-masjida",fr:"la mosquée",freq:28,cat:"lieu"},
  {id:276,ar:"الْكَعْبَةَ",tr:"al-kaʿbata",fr:"la Kaaba",freq:2,cat:"lieu"},
  {id:277,ar:"قِبْلَةَ",tr:"qiblata",fr:"direction de prière",freq:4,cat:"nom"},
  {id:278,ar:"الصَّفَا",tr:"aṣ-ṣafā",fr:"As-Safā (colline)",freq:1,cat:"lieu"},
  {id:279,ar:"صِرَاطَ مُسْتَقِيمَ",tr:"ṣirāṭan mustaqīma",fr:"chemin droit",freq:32,cat:"expression"},
  {id:280,ar:"أُولُو الْأَلْبَابِ",tr:"ulū l-albāb",fr:"gens doués de raison",freq:16,cat:"expression"},
  {id:281,ar:"صِدْقِ",tr:"ṣidqi",fr:"véracité / honnêteté",freq:13,cat:"nom"},
  {id:282,ar:"عَدْلِ",tr:"ʿadli",fr:"justice / équité",freq:28,cat:"nom"},
  {id:283,ar:"أَمَانَةَ",tr:"amānata",fr:"confiance / dépôt",freq:6,cat:"nom"},
  {id:284,ar:"شَهَادَةِ",tr:"shahādati",fr:"témoignage",freq:19,cat:"nom"},
  {id:285,ar:"مِيثَاقَ",tr:"mīthāqa",fr:"pacte / alliance",freq:25,cat:"nom"},
  {id:286,ar:"عَهْدَ",tr:"ʿahda",fr:"promesse / engagement",freq:40,cat:"nom"},
  {id:287,ar:"حِلْفَ",tr:"ḥilfa",fr:"serment / alliance",freq:3,cat:"nom"},
  {id:288,ar:"فِتْنَةَ",tr:"fitnata",fr:"épreuve / discorde",freq:60,cat:"nom"},
  {id:289,ar:"بَلَاءَ",tr:"balāʾa",fr:"épreuve / malheur",freq:10,cat:"nom"},
  {id:290,ar:"ذَنْبَ",tr:"dhanba",fr:"péché / faute",freq:43,cat:"nom"},
  {id:291,ar:"خَطَأَ",tr:"khaṭaʾa",fr:"erreur / faute",freq:8,cat:"nom"},
  {id:292,ar:"إِثْمَ",tr:"ithma",fr:"péché / crime",freq:48,cat:"nom"},
  {id:293,ar:"فُجُورَ",tr:"fujūra",fr:"débauche / impiété",freq:5,cat:"nom"},
  {id:294,ar:"كُفْرَ",tr:"kufra",fr:"mécréance",freq:25,cat:"nom"},
  {id:295,ar:"شِرْكَ",tr:"shirka",fr:"association à Allah",freq:28,cat:"nom"},
  {id:296,ar:"نِفَاقَ",tr:"nifāqa",fr:"hypocrisie",freq:3,cat:"nom"},
  {id:297,ar:"بِدْعَةَ",tr:"bidʿata",fr:"innovation blâmable",freq:0,cat:"nom"},
  {id:298,ar:"سُنَّةَ",tr:"sunnata",fr:"voie / tradition",freq:16,cat:"nom"},
  {id:299,ar:"مِلَّةَ",tr:"millata",fr:"religion / communauté",freq:15,cat:"nom"},
  {id:300,ar:"شَرِيعَةَ",tr:"sharīʿata",fr:"loi divine",freq:2,cat:"nom"},
  {id:301,ar:"فِقْهَ",tr:"fiqha",fr:"compréhension / jurisprudence",freq:1,cat:"nom"},
  {id:302,ar:"حَلَالَ",tr:"ḥalāla",fr:"licite / permis",freq:5,cat:"adjectif"},
  {id:303,ar:"حَرَامَ",tr:"ḥarāma",fr:"illicite / interdit",freq:25,cat:"adjectif"},
  {id:304,ar:"طَيِّبَ",tr:"ṭayyiba",fr:"bon / pur / agréable",freq:46,cat:"adjectif"},
  {id:305,ar:"خَبِيثَ",tr:"khabītha",fr:"mauvais / impur",freq:22,cat:"adjectif"},
  {id:306,ar:"قَرِيبَ",tr:"qarība",fr:"proche",freq:24,cat:"adjectif"},
  {id:307,ar:"بَعِيدَ",tr:"baʿīda",fr:"loin / éloigné",freq:17,cat:"adjectif"},
  {id:308,ar:"سَهْلَ",tr:"sahla",fr:"facile / aisé",freq:8,cat:"adjectif"},
  {id:309,ar:"صَعْبَ",tr:"ṣaʿba",fr:"difficile",freq:0,cat:"adjectif"},
  {id:310,ar:"جَدِيدَ",tr:"jadīda",fr:"nouveau",freq:5,cat:"adjectif"},
  {id:311,ar:"قَدِيمَ",tr:"qadīma",fr:"ancien / vieux",freq:0,cat:"adjectif"},
  {id:312,ar:"مُبَارَكَ",tr:"mubāraka",fr:"béni",freq:32,cat:"adjectif"},
  {id:313,ar:"مُقَدَّسَ",tr:"muqaddasa",fr:"sacré / sanctifié",freq:3,cat:"adjectif"},
  {id:314,ar:"عَظِيمَ",tr:"ʿaẓīma",fr:"grand / majestueux",freq:108,cat:"adjectif"},
  {id:315,ar:"كَرِيمَ",tr:"karīma",fr:"généreux / honorable",freq:27,cat:"adjectif"},
  {id:316,ar:"مِنْ قَبْلُ",tr:"min qablu",fr:"avant / auparavant",freq:42,cat:"expression"},
  {id:317,ar:"مِنْ بَعْدُ",tr:"min baʿdu",fr:"après / ensuite",freq:18,cat:"expression"},
  {id:318,ar:"أَوَّلَ",tr:"awwala",fr:"premier",freq:14,cat:"adjectif"},
  {id:319,ar:"آخِرَ",tr:"ākhira",fr:"dernier",freq:19,cat:"adjectif"},
  {id:320,ar:"كُلَّهُ",tr:"kullahu",fr:"tout entier / en totalité",freq:34,cat:"particule"},
  {id:321,ar:"بَعْضُهُمْ",tr:"baʿḍuhum",fr:"certains d'entre eux",freq:58,cat:"pronom"},
  {id:322,ar:"كِلَاهُمَا",tr:"kilāhumā",fr:"les deux",freq:1,cat:"pronom"},
  {id:323,ar:"أَحَدٌ",tr:"aḥadun",fr:"quelqu'un / un seul",freq:79,cat:"pronom"},
  {id:324,ar:"لَا أَحَدَ",tr:"lā aḥada",fr:"personne",freq:0,cat:"expression"},
  {id:325,ar:"شَيْئًا",tr:"shayʾan",fr:"quoi que ce soit",freq:68,cat:"nom"},
  {id:326,ar:"أَبَدًا",tr:"abadan",fr:"jamais / pour toujours",freq:42,cat:"adverbe"},
  {id:327,ar:"دَائِمًا",tr:"dāʾiman",fr:"toujours / en permanence",freq:0,cat:"adverbe"},
  {id:328,ar:"حَقًّا",tr:"ḥaqqan",fr:"vraiment / en vérité",freq:42,cat:"adverbe"},
  {id:329,ar:"يَقِينًا",tr:"yaqīnan",fr:"avec certitude",freq:4,cat:"adverbe"},
  {id:330,ar:"سَرِيعًا",tr:"sarīʿan",fr:"rapidement / vite",freq:18,cat:"adverbe"},
  {id:331,ar:"جَمِيعًا",tr:"jamīʿan",fr:"tous ensemble",freq:120,cat:"adverbe"},
  {id:332,ar:"وَحْدَهُ",tr:"waḥdahu",fr:"seul / lui seul",freq:5,cat:"adverbe"},
  {id:333,ar:"سِرًّا",tr:"sirran",fr:"en secret",freq:14,cat:"adverbe"},
  {id:334,ar:"عَلَانِيَةً",tr:"ʿalāniyatan",fr:"publiquement",freq:6,cat:"adverbe"},
  {id:335,ar:"سَمَاءَ",tr:"samāʾa",fr:"ciel",freq:120,cat:"nom"},
  {id:336,ar:"أَرْضَ",tr:"arḍa",fr:"terre",freq:461,cat:"nom"},
  {id:337,ar:"عَالَمَ",tr:"ʿālama",fr:"monde / univers",freq:73,cat:"nom"},
  {id:338,ar:"خَلِيفَةَ",tr:"khalīfata",fr:"calife / vicaire",freq:9,cat:"nom"},
  {id:339,ar:"أُمَمَ",tr:"umama",fr:"nations / peuples",freq:18,cat:"nom"},
  {id:340,ar:"قَبِيلَةَ",tr:"qabīlata",fr:"tribu",freq:1,cat:"nom"},
  {id:341,ar:"مُلْكَ",tr:"mulka",fr:"royauté / règne",freq:52,cat:"nom"},
  {id:342,ar:"سُلْطَانَ",tr:"sulṭāna",fr:"pouvoir / autorité",freq:37,cat:"nom"},
  {id:343,ar:"حُكُومَةَ",tr:"ḥukūmata",fr:"gouvernement",freq:0,cat:"nom"},
  {id:344,ar:"قَضَاءَ",tr:"qaḍāʾa",fr:"décret / jugement",freq:13,cat:"nom"},
  {id:345,ar:"قَدَرَ",tr:"qadara",fr:"destin / décret divin",freq:6,cat:"nom"},
  {id:346,ar:"لَوْحَ",tr:"lawḥa",fr:"table / tablette",freq:4,cat:"nom"},
  {id:347,ar:"مِيزَانَ",tr:"mīzāna",fr:"balance / mesure",freq:23,cat:"nom"},
  {id:348,ar:"حِسَابَ",tr:"ḥisāba",fr:"calcul / reckoning",freq:29,cat:"nom"},
  {id:349,ar:"صِرَاطَ",tr:"ṣirāṭa",fr:"pont / chemin",freq:45,cat:"nom"},
  {id:350,ar:"أَجَلَ",tr:"ajala",fr:"délai / terme fixé",freq:55,cat:"nom"},
  {id:351,ar:"آدَمَ",tr:"ādama",fr:"Adam",freq:25,cat:"nom propre"},
  {id:352,ar:"نُوحًا",tr:"nūḥan",fr:"Noé",freq:43,cat:"nom propre"},
  {id:353,ar:"يُوسُفَ",tr:"yūsufa",fr:"Joseph",freq:27,cat:"nom propre"},
  {id:354,ar:"دَاوُودَ",tr:"dāwūda",fr:"David",freq:16,cat:"nom propre"},
  {id:355,ar:"سُلَيْمَانَ",tr:"sulaymāna",fr:"Salomon",freq:17,cat:"nom propre"},
  {id:356,ar:"يَحْيَى",tr:"yaḥyā",fr:"Jean (Baptiste)",freq:5,cat:"nom propre"},
  {id:357,ar:"مَرْيَمَ",tr:"maryama",fr:"Marie",freq:34,cat:"nom propre"},
  {id:358,ar:"زَكَرِيَّا",tr:"zakariyyā",fr:"Zacharie",freq:7,cat:"nom propre"},
  {id:359,ar:"لُوطًا",tr:"lūṭan",fr:"Loth",freq:27,cat:"nom propre"},
  {id:360,ar:"إِسْمَاعِيلَ",tr:"ismāʿīla",fr:"Ismaël",freq:12,cat:"nom propre"},
  {id:361,ar:"إِسْحَاقَ",tr:"isḥāqa",fr:"Isaac",freq:17,cat:"nom propre"},
  {id:362,ar:"يَعْقُوبَ",tr:"yaʿqūba",fr:"Jacob",freq:16,cat:"nom propre"},
  {id:363,ar:"أَيُّوبَ",tr:"ayyūba",fr:"Job",freq:4,cat:"nom propre"},
  {id:364,ar:"يُونُسَ",tr:"yūnusa",fr:"Jonas",freq:4,cat:"nom propre"},
  {id:365,ar:"فِرْعَوْنَ",tr:"firʿawna",fr:"Pharaon",freq:74,cat:"nom propre"},
  {id:366,ar:"هَامَانَ",tr:"hāmāna",fr:"Haman",freq:3,cat:"nom propre"},
  {id:367,ar:"قَارُونَ",tr:"qārūna",fr:"Coré",freq:4,cat:"nom propre"},
  {id:368,ar:"بَنِي إِسْرَائِيلَ",tr:"banī isrāʾīl",fr:"Fils d'Israël",freq:40,cat:"expression"},
  {id:369,ar:"أَهْلِ الْكِتَابِ",tr:"ahli l-kitāb",fr:"gens du Livre",freq:30,cat:"expression"},
  {id:370,ar:"الْيَهُودَ",tr:"al-yahūda",fr:"les Juifs",freq:10,cat:"nom"},
  {id:371,ar:"النَّصَارَى",tr:"an-naṣārā",fr:"les Chrétiens",freq:14,cat:"nom"},
  {id:372,ar:"الصَّابِئِينَ",tr:"aṣ-ṣābiʾīna",fr:"les Sabéens",freq:3,cat:"nom"},
  {id:373,ar:"الْمَجُوسَ",tr:"al-majūsa",fr:"les Zoroastriens",freq:1,cat:"nom"},
  {id:374,ar:"أُمَّ الْكِتَابِ",tr:"umma l-kitāb",fr:"mère du Livre",freq:3,cat:"expression"},
  {id:375,ar:"مَلَكُوتَ",tr:"malakūta",fr:"royauté céleste",freq:3,cat:"nom"},
  {id:376,ar:"الْعَرْشَ",tr:"al-ʿarsha",fr:"le Trône",freq:33,cat:"nom"},
  {id:377,ar:"الْكُرْسِيَّ",tr:"al-kursiyya",fr:"le Siège / Trône",freq:2,cat:"nom"},
  {id:378,ar:"اللَّوْحَ الْمَحْفُوظَ",tr:"al-lawḥa l-maḥfūẓ",fr:"la Table gardée",freq:1,cat:"expression"},
  {id:379,ar:"الْقَلَمَ",tr:"al-qalama",fr:"le calame / la plume",freq:4,cat:"nom"},
  {id:380,ar:"وَحْيَ",tr:"waḥya",fr:"révélation",freq:26,cat:"nom"},
  {id:381,ar:"تَنزِيلَ",tr:"tanzīla",fr:"révélation descendue",freq:14,cat:"nom"},
  {id:382,ar:"مُعْجِزَةَ",tr:"muʿjizata",fr:"miracle",freq:0,cat:"nom"},
  {id:383,ar:"حُجَّةَ",tr:"ḥujjata",fr:"argument / preuve",freq:7,cat:"nom"},
  {id:384,ar:"بَيِّنَةَ",tr:"bayyinata",fr:"preuve évidente",freq:19,cat:"nom"},
  {id:385,ar:"دَلِيلَ",tr:"dalīla",fr:"preuve / indice",freq:0,cat:"nom"},
  {id:386,ar:"فَجْرَ",tr:"fajra",fr:"aurore / aube",freq:12,cat:"nom"},
  {id:387,ar:"ضُحَى",tr:"ḍuḥā",fr:"matin lumineux",freq:4,cat:"nom"},
  {id:388,ar:"الظُّهْرَ",tr:"aẓ-ẓuhr",fr:"midi",freq:1,cat:"nom"},
  {id:389,ar:"الْعَصْرَ",tr:"al-ʿaṣr",fr:"l'après-midi / le temps",freq:2,cat:"nom"},
  {id:390,ar:"الْمَغْرِبَ",tr:"al-maghrib",fr:"coucher du soleil",freq:3,cat:"nom"},
  {id:391,ar:"الْعِشَاءَ",tr:"al-ʿishāʾa",fr:"le soir / nuit tombée",freq:2,cat:"nom"},
  {id:392,ar:"سَحَرًا",tr:"saḥaran",fr:"au moment du sahour",freq:2,cat:"nom"},
  {id:393,ar:"غَدًا",tr:"ghadan",fr:"demain",freq:3,cat:"adverbe"},
  {id:394,ar:"أَمْسِ",tr:"amsi",fr:"hier",freq:2,cat:"adverbe"},
  {id:395,ar:"الْيَوْمَ",tr:"al-yawma",fr:"aujourd'hui",freq:44,cat:"adverbe"},
  {id:396,ar:"مُقِيمًا",tr:"muqīman",fr:"demeurant / résidant",freq:9,cat:"adjectif"},
  {id:397,ar:"مُهَاجِرًا",tr:"muhājiran",fr:"émigrant",freq:4,cat:"nom"},
  {id:398,ar:"مُجَاهِدًا",tr:"mujāhidan",fr:"combattant sur la voie d'Allah",freq:2,cat:"nom"},
  {id:399,ar:"عَابِدًا",tr:"ʿābidan",fr:"adorateur",freq:4,cat:"nom"},
  {id:400,ar:"ذَاكِرًا",tr:"dhākiran",fr:"celui qui se rappelle",freq:1,cat:"nom"},
  {id:401,ar:"تَوَكَّلَ",tr:"tawakkala",fr:"il s'est confié à Allah",freq:14,cat:"verbe"},
  {id:402,ar:"اسْتَعَانَ",tr:"istaʿāna",fr:"il a imploré le secours",freq:3,cat:"verbe"},
  {id:403,ar:"خَضَعَ",tr:"khaḍaʿa",fr:"il s'est soumis",freq:3,cat:"verbe"},
  {id:404,ar:"أَسْلَمَ",tr:"aslama",fr:"il s'est soumis / converti",freq:9,cat:"verbe"},
  {id:405,ar:"آمَنَ",tr:"āmana",fr:"il a cru / a la foi",freq:258,cat:"verbe"},
  {id:406,ar:"اتَّقَى",tr:"ittaqā",fr:"il a été pieux / craint Allah",freq:43,cat:"verbe"},
  {id:407,ar:"رَضِيَ",tr:"raḍiya",fr:"il a agréé / été satisfait",freq:25,cat:"verbe"},
  {id:408,ar:"أَسَاءَ",tr:"asāʾa",fr:"il a mal agi",freq:4,cat:"verbe"},
  {id:409,ar:"أَصْلَحَ",tr:"aṣlaḥa",fr:"il a réformé / amélioré",freq:36,cat:"verbe"},
  {id:410,ar:"أَفْسَدَ",tr:"afsada",fr:"il a corrompu",freq:25,cat:"verbe"},
  {id:411,ar:"كَذَبَ",tr:"kadhaba",fr:"il a menti",freq:88,cat:"verbe"},
  {id:412,ar:"صَدَقَ",tr:"ṣadaqa",fr:"il a dit la vérité",freq:18,cat:"verbe"},
  {id:413,ar:"وَعَدَ",tr:"waʿada",fr:"il a promis",freq:55,cat:"verbe"},
  {id:414,ar:"خَانَ",tr:"khāna",fr:"il a trahi",freq:14,cat:"verbe"},
  {id:415,ar:"حَكَمَ",tr:"ḥakama",fr:"il a jugé / rendu un verdict",freq:72,cat:"verbe"},
  {id:416,ar:"شَهِدَ",tr:"shahida",fr:"il a témoigné",freq:39,cat:"verbe"},
  {id:417,ar:"أَنْفَقَ",tr:"anfaqa",fr:"il a dépensé / donné",freq:61,cat:"verbe"},
  {id:418,ar:"بَخِلَ",tr:"bakhila",fr:"il a été avare",freq:7,cat:"verbe"},
  {id:419,ar:"أَكَلَ",tr:"akala",fr:"il a mangé",freq:27,cat:"verbe"},
  {id:420,ar:"شَرِبَ",tr:"shariba",fr:"il a bu",freq:9,cat:"verbe"},
  {id:421,ar:"نَامَ",tr:"nāma",fr:"il a dormi",freq:5,cat:"verbe"},
  {id:422,ar:"قَامَ",tr:"qāma",fr:"il s'est levé / s'est établi",freq:49,cat:"verbe"},
  {id:423,ar:"جَلَسَ",tr:"jalasa",fr:"il s'est assis",freq:2,cat:"verbe"},
  {id:424,ar:"مَشَى",tr:"mashā",fr:"il a marché",freq:11,cat:"verbe"},
  {id:425,ar:"رَكَعَ",tr:"rakaʿa",fr:"il s'est incliné",freq:13,cat:"verbe"},
  {id:426,ar:"سَجَدَ",tr:"sajada",fr:"il s'est prosterné",freq:22,cat:"verbe"},
  {id:427,ar:"دَخَلَ",tr:"dakhala",fr:"il est entré",freq:89,cat:"verbe"},
  {id:428,ar:"خَرَجَ",tr:"kharaja",fr:"il est sorti",freq:55,cat:"verbe"},
  {id:429,ar:"ذَهَبَ",tr:"dhahaba",fr:"il est parti / allé",freq:33,cat:"verbe"},
  {id:430,ar:"جَاءَ",tr:"jāʾa",fr:"il est venu / arrivé",freq:278,cat:"verbe"},
  {id:431,ar:"رَجَعَ",tr:"rajaʿa",fr:"il est revenu / retourné",freq:91,cat:"verbe"},
  {id:432,ar:"وَقَفَ",tr:"waqafa",fr:"il s'est arrêté",freq:6,cat:"verbe"},
  {id:433,ar:"رَأَى",tr:"raʾā",fr:"il a vu",freq:113,cat:"verbe"},
  {id:434,ar:"سَأَلَ",tr:"saʾala",fr:"il a demandé",freq:63,cat:"verbe"},
  {id:435,ar:"أَجَابَ",tr:"ajāba",fr:"il a répondu",freq:6,cat:"verbe"},
  {id:436,ar:"أَمَرَ",tr:"amara",fr:"il a ordonné",freq:91,cat:"verbe"},
  {id:437,ar:"نَهَى",tr:"nahā",fr:"il a interdit / défendu",freq:27,cat:"verbe"},
  {id:438,ar:"نَسِيَ",tr:"nasiya",fr:"il a oublié",freq:26,cat:"verbe"},
  {id:439,ar:"تَذَكَّرَ",tr:"tadhakkara",fr:"il s'est souvenu",freq:15,cat:"verbe"},
  {id:440,ar:"فَكَّرَ",tr:"fakkara",fr:"il a réfléchi",freq:4,cat:"verbe"},
  {id:441,ar:"فَهِمَ",tr:"fahima",fr:"il a compris",freq:2,cat:"verbe"},
  {id:442,ar:"عَرَفَ",tr:"ʿarafa",fr:"il a reconnu / connu",freq:19,cat:"verbe"},
  {id:443,ar:"جَهِلَ",tr:"jahila",fr:"il a ignoré",freq:8,cat:"verbe"},
  {id:444,ar:"اهْتَدَى",tr:"ihtadā",fr:"il s'est guidé / suivi la voie",freq:46,cat:"verbe"},
  {id:445,ar:"ضَلَّ",tr:"ḍalla",fr:"il s'est égaré",freq:56,cat:"verbe"},
  {id:446,ar:"تَابَ",tr:"tāba",fr:"il s'est repenti",freq:88,cat:"verbe"},
  {id:447,ar:"فَازَ",tr:"fāza",fr:"il a réussi / triomphé",freq:22,cat:"verbe"},
  {id:448,ar:"خَسِرَ",tr:"khasira",fr:"il a perdu",freq:38,cat:"verbe"},
  {id:449,ar:"نَجَا",tr:"najā",fr:"il a été sauvé",freq:16,cat:"verbe"},
  {id:450,ar:"هَلَكَ",tr:"halaka",fr:"il a péri",freq:17,cat:"verbe"},
  {id:451,ar:"نَعَمْ",tr:"naʿam",fr:"oui / certainement",freq:2,cat:"particule"},
  {id:452,ar:"لِمَاذَا",tr:"limādhā",fr:"pourquoi",freq:0,cat:"particule"},
  {id:453,ar:"أَيْنَ",tr:"ayna",fr:"où",freq:24,cat:"particule"},
  {id:454,ar:"مَتَى",tr:"matā",fr:"quand",freq:8,cat:"particule"},
  {id:455,ar:"كَمْ",tr:"kam",fr:"combien",freq:11,cat:"particule"},
  {id:456,ar:"أَيُّ",tr:"ayyu",fr:"quel / lequel",freq:25,cat:"particule"},
  {id:457,ar:"مَاذَا",tr:"mādhā",fr:"que / quoi",freq:17,cat:"particule"},
  {id:458,ar:"لِمَنْ",tr:"liman",fr:"à qui / pour qui",freq:12,cat:"particule"},
  {id:459,ar:"عَمَّ",tr:"ʿamma",fr:"de quoi / au sujet de",freq:4,cat:"particule"},
  {id:460,ar:"لِكَيْ",tr:"likay",fr:"afin que / pour que",freq:8,cat:"particule"},
  {id:461,ar:"كَأَنَّ",tr:"kaʾanna",fr:"comme si",freq:9,cat:"particule"},
  {id:462,ar:"مِثْلَ",tr:"mithla",fr:"comme / semblable à",freq:53,cat:"particule"},
  {id:463,ar:"غَيْرَ",tr:"ghayra",fr:"autre que / non",freq:115,cat:"particule"},
  {id:464,ar:"سِوَى",tr:"siwā",fr:"excepté / en dehors de",freq:4,cat:"particule"},
  {id:465,ar:"دُونَ",tr:"dūna",fr:"sans / en dehors de",freq:74,cat:"particule"},
  {id:466,ar:"نَحْوَ",tr:"naḥwa",fr:"vers / en direction de",freq:0,cat:"préposition"},
  {id:467,ar:"حَوْلَ",tr:"ḥawla",fr:"autour de",freq:17,cat:"préposition"},
  {id:468,ar:"خِلَالَ",tr:"khilāla",fr:"à travers / pendant",freq:4,cat:"préposition"},
  {id:469,ar:"بِدُونِ",tr:"bidūni",fr:"sans",freq:0,cat:"préposition"},
  {id:470,ar:"مُنْذُ",tr:"mundhu",fr:"depuis / il y a",freq:0,cat:"préposition"},
  {id:471,ar:"زَوْجَ",tr:"zawja",fr:"époux / épouse",freq:82,cat:"nom"},
  {id:472,ar:"أُمَّ",tr:"umma",fr:"mère",freq:35,cat:"nom"},
  {id:473,ar:"أَخَ",tr:"akha",fr:"frère",freq:94,cat:"nom"},
  {id:474,ar:"أُخْتَ",tr:"ukhta",fr:"sœur",freq:13,cat:"nom"},
  {id:475,ar:"ابْنَ",tr:"ibna",fr:"fils",freq:162,cat:"nom"},
  {id:476,ar:"بِنْتَ",tr:"binta",fr:"fille",freq:3,cat:"nom"},
  {id:477,ar:"جَدَّ",tr:"jadda",fr:"grand-père",freq:0,cat:"nom"},
  {id:478,ar:"عَمَّ",tr:"ʿamma",fr:"oncle paternel",freq:1,cat:"nom"},
  {id:479,ar:"خَالَ",tr:"khāla",fr:"oncle maternel",freq:0,cat:"nom"},
  {id:480,ar:"صَدِيقَ",tr:"ṣadīqa",fr:"ami / proche",freq:4,cat:"nom"},
  {id:481,ar:"عَدُوَّ",tr:"ʿaduwwa",fr:"ennemi",freq:78,cat:"nom"},
  {id:482,ar:"جَارَ",tr:"jāra",fr:"voisin",freq:1,cat:"nom"},
  {id:483,ar:"ضَيْفَ",tr:"ḍayfa",fr:"invité / hôte",freq:4,cat:"nom"},
  {id:484,ar:"يَتِيمَ",tr:"yatīma",fr:"orphelin",freq:22,cat:"nom"},
  {id:485,ar:"مِسْكِينَ",tr:"miskīna",fr:"pauvre / indigent",freq:23,cat:"nom"},
  {id:486,ar:"أَسِيرَ",tr:"asīra",fr:"prisonnier / captif",freq:4,cat:"nom"},
  {id:487,ar:"غَرِيبَ",tr:"gharība",fr:"étranger",freq:0,cat:"nom"},
  {id:488,ar:"ظَالِمَ",tr:"ẓālima",fr:"oppresseur",freq:94,cat:"nom"},
  {id:489,ar:"مَظْلُومَ",tr:"maẓlūma",fr:"opprimé",freq:5,cat:"nom"},
  {id:490,ar:"حَاكِمَ",tr:"ḥākima",fr:"gouvernant / juge",freq:6,cat:"nom"},
  {id:491,ar:"رَاعِيَ",tr:"rāʿiya",fr:"berger / gardien",freq:0,cat:"nom"},
  {id:492,ar:"طَالِبَ",tr:"ṭāliba",fr:"étudiant / demandeur",freq:0,cat:"nom"},
  {id:493,ar:"مُعَلِّمَ",tr:"muʿallima",fr:"enseignant",freq:0,cat:"nom"},
  {id:494,ar:"عَالِمَ",tr:"ʿālima",fr:"savant / érudit",freq:8,cat:"nom"},
  {id:495,ar:"طَبِيبَ",tr:"ṭabība",fr:"médecin",freq:0,cat:"nom"},
  {id:496,ar:"إِنَّا لِلَّهِ",tr:"innā lillāh",fr:"Certes nous appartenons à Allah",freq:1,cat:"expression"},
  {id:497,ar:"مَا شَاءَ اللَّهُ",tr:"mā shāʾa llāh",fr:"Ce qu'Allah a voulu",freq:2,cat:"expression"},
  {id:498,ar:"جَزَاكَ اللَّهُ",tr:"jazāka llāh",fr:"Qu'Allah te récompense",freq:0,cat:"expression"},
  {id:499,ar:"أَعُوذُ بِاللَّهِ",tr:"aʿūdhu billāh",fr:"Je cherche refuge en Allah",freq:3,cat:"expression"},
  {id:500,ar:"صَلَّى اللَّهُ عَلَيْهِ",tr:"ṣallā llāhu ʿalayhi",fr:"Que la paix d'Allah soit sur lui",freq:0,cat:"expression"},
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
    .slice(0, 15);
}

// ═══════════════════════════════════════════════════════
// AUDIO — everyayah CDN (fonctionne dans Chrome)
// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
// AUDIO — TTS arabe (fonctionne partout) + MP3 Alafasy
// ═══════════════════════════════════════════════════════
const TTS_READY = typeof window !== "undefined" && "speechSynthesis" in window;

// Parle un texte arabe via la synthèse vocale du système
function speakArabicTTS(text, rate = 0.65, onEnd) {
  if (!TTS_READY) { onEnd && onEnd(); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ar-SA"; u.rate = rate; u.pitch = 1;
  const voices = window.speechSynthesis.getVoices();
  const ar = voices.find(v => v.lang === "ar-SA") ||
             voices.find(v => v.lang === "ar-EG") ||
             voices.find(v => v.lang.startsWith("ar")) || null;
  if (ar) u.voice = ar;
  u.onend = () => onEnd && onEnd();
  u.onerror = () => onEnd && onEnd();
  window.speechSynthesis.speak(u);
}

// Texte de chaque verset pour TTS (texte arabe simplifié)
function getVerseText(surahNum, verseNum) {
  const surah = LEARN_SURAHS.find(s => s.number === surahNum);
  const verse = surah?.verses.find(v => v.n === verseNum);
  return verse?.ar || "";
}

function getAudioUrl(surah, verse) {
  return `https://everyayah.com/data/Alafasy_128kbps/${String(surah).padStart(3,"0")}${String(verse).padStart(3,"0")}.mp3`;
}

function useAudio() {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(null);
  const [loading, setLoading] = useState(null);
  const [useTTS, setUseTTS] = useState(false); // se bascule auto si MP3 échoue

  const stop = useCallback(() => {
    if (ref.current) { ref.current.onended = null; ref.current.onerror = null; ref.current.pause(); ref.current = null; }
    if (TTS_READY) window.speechSynthesis.cancel();
    setPlaying(null); setLoading(null);
  }, []);

  const playWithTTS = useCallback((text, key, onDone) => {
    setLoading(null); setPlaying(key);
    speakArabicTTS(text, 0.65, () => { setPlaying(null); onDone && onDone(); });
  }, []);

  const play = useCallback((url, key, text, onDone) => {
    if (useTTS || !url) { playWithTTS(text, key, onDone); return; }
    if (ref.current) { ref.current.onended = null; ref.current.onerror = null; ref.current.pause(); }
    const a = new Audio(url);
    ref.current = a;
    setLoading(key);
    a.onended = () => { setPlaying(null); setLoading(null); onDone && onDone(); };
    a.onerror = () => {
      // MP3 échoue → bascule sur TTS pour le reste de la session
      setUseTTS(true);
      setLoading(null);
      playWithTTS(text, key, onDone);
    };
    const p = a.play();
    if (p) {
      p.then(() => { setLoading(null); setPlaying(key); })
       .catch(() => {
         setUseTTS(true); setLoading(null);
         playWithTTS(text, key, onDone);
       });
    } else { setLoading(null); setPlaying(key); }
  }, [useTTS, playWithTTS]);

  const playVerse = useCallback((surah, verse) => {
    const key = `${surah}:${verse}`;
    if (playing === key) { stop(); return; }
    stop();
    const text = getVerseText(surah, verse);
    play(getAudioUrl(surah, verse), key, text, null);
  }, [playing, stop, play]);

  const playSurah = useCallback((surah, verses) => {
    stop();
    let i = 0;
    const next = () => {
      if (i >= verses.length) { setPlaying(null); return; }
      const v = verses[i++];
      const text = getVerseText(surah, v.n);
      play(getAudioUrl(surah, v.n), `${surah}:${v.n}`, text, next);
    };
    next();
  }, [stop, play]);

  // Charger les voix au démarrage
  useEffect(() => {
    if (TTS_READY) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }
    return () => stop();
  }, []);

  return { playing, loading, playVerse, playSurah, stop, useTTS };
}

function speakLetter(text) { speakArabicTTS(text, 0.5); }
function speakFeedback(text, lang = "fr-FR") {
  if (!TTS_READY) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang; u.rate = 0.9;
  window.speechSynthesis.speak(u);
}

// ═══════════════════════════════════════════════════════
// COMPOSANT — Tab Sourates
// ═══════════════════════════════════════════════════════
function SuratesTab() {
  const [open, setOpen] = useState(null);
  const [showTr, setShowTr] = useState(true);
  const [showFr, setShowFr] = useState(false);
  const audio = useAudio();

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
            <button onClick={e => { e.stopPropagation(); audio.playSurah(surah.number, surah.verses); }}
              className={`p-2 rounded-xl mr-1 transition-all ${audio.playing?.startsWith(surah.number+":") ? "bg-emerald-500/30 text-emerald-300" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"}`}>
              {audio.playing?.startsWith(surah.number+":") ? <Pause className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
            </button>
            <p className="text-xl font-serif text-slate-500 mr-2" dir="rtl">{surah.arabic}</p>
            <ChevronRight className={`w-4 h-4 text-slate-600 transition-transform ${open === surah.number ? "rotate-90" : ""}`}/>
          </button>
          <AnimatePresence>
            {open === surah.number && (
              <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
                  {/* Bouton principal lecture TTS — fonctionne sans Chrome */}
                  <button
                    onClick={() => {
                      if (audio.playing?.startsWith(surah.number+":")) { audio.stop(); return; }
                      // Lecture via synthèse vocale (fonctionne partout)
                      const allText = surah.verses.map(v => v.ar).join(" . ");
                      speakArabicTTS(allText, 0.6);
                    }}
                    style={{background: audio.playing?.startsWith(surah.number+":") ? "#ef4444" : "linear-gradient(135deg,#059669,#0d9488)", color:"white", border:"none", borderRadius:"12px", padding:"10px 16px", fontWeight:"bold", fontSize:"0.85rem", display:"flex", alignItems:"center", gap:"6px", cursor:"pointer"}}>
                    {audio.playing?.startsWith(surah.number+":") ? "⏹ Stop" : "▶ Lire (voix)"}
                  </button>
                  <button onClick={() => setShowTr(s => !s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showTr ? "bg-blue-500/20 text-blue-300 border border-blue-500/30" : "bg-white/5 text-slate-600"}`}>ABC</button>
                  <button onClick={() => setShowFr(s => !s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showFr ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-white/5 text-slate-600"}`}>FR</button>
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
                      className={`p-4 rounded-2xl border transition-all ${audio.playing === `${surah.number}:${v.n}` ? "bg-emerald-900/20 border-emerald-500/25" : "bg-white/3 border-white/8"}`}>
                      <div className="flex items-start gap-3 mb-1">
                        <button onClick={() => {
                          if (audio.playing === `${surah.number}:${v.n}`) { audio.stop(); return; }
                          // Essaie MP3, bascule sur TTS si ça échoue
                          audio.playVerse(surah.number, v.n);
                          // Fallback TTS après 1.5s si toujours loading
                          setTimeout(() => {
                            if (audio.loading === `${surah.number}:${v.n}`) speakArabicTTS(v.ar, 0.6);
                          }, 1500);
                        }}
                          style={{
                            width:"36px", height:"36px", borderRadius:"50%",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            flexShrink:0, marginTop:"4px", fontWeight:"bold", fontSize:"0.75rem",
                            cursor:"pointer", border:"none", transition:"all 0.2s",
                            background: audio.playing === `${surah.number}:${v.n}` ? "#10b981" :
                                        audio.loading === `${surah.number}:${v.n}` ? "rgba(59,130,246,0.2)" :
                                        "rgba(16,185,129,0.15)",
                            color: audio.playing === `${surah.number}:${v.n}` ? "white" : "#6ee7b7",
                          }}>
                          {audio.loading === `${surah.number}:${v.n}` ? "⏳" :
                           audio.playing === `${surah.number}:${v.n}` ? "⏸" : v.n}
                        </button>
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
                  onClick={() => {
                    const isOpening = sel?.name !== l.name;
                    setSel(isOpening ? l : null);
                    if (isOpening) {
                      // Le prof prononce la lettre puis son nom
                      speakArabic(l.ar, 0.4);
                      setTimeout(() => speakFeedback(`${l.name} — ${l.sound}`, "fr-FR"), 1200);
                    }
                  }}
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
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => speakArabic(sel.ar, 0.4)}
                            style={{background:"rgba(59,130,246,0.2)",border:"1px solid rgba(96,165,250,0.4)",borderRadius:"8px",padding:"4px 10px",color:"#93c5fd",fontSize:"0.75rem",cursor:"pointer"}}>
                            🔊 Lettre
                          </button>
                          <button onClick={() => speakFeedback(`${sel.name}. Son : ${sel.sound}`, "fr-FR")}
                            style={{background:"rgba(139,92,246,0.2)",border:"1px solid rgba(167,139,250,0.4)",borderRadius:"8px",padding:"4px 10px",color:"#c4b5fd",fontSize:"0.75rem",cursor:"pointer"}}>
                            🧑‍🏫 Explication
                          </button>
                        </div>
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
  const TAJWEED_EXAMPLES = {
    qalaqah:"قُلْ هُوَ اللَّهُ أَحَدٌ", madda_normal:"الرَّحْمَٰنِ الرَّحِيمِ",
    madda_permissible:"مَالِكِ يَوْمِ الدِّينِ", madda_necessary:"آلْآنَ",
    ghunnah:"إِنَّ اللَّهَ", idgham_ghunnah:"مِن نَّفْسٍ", idgham_wo_ghunnah:"مِن رَّبِّكَ",
    ikhafa:"مِن قَبْلِ", iqlab:"مِن بَعْدِ", ham_wasl:"اللَّهُ", laam_shamsiyya:"الرَّحِيمِ", slnt:"بِسْمِ",
  };
  return (
    <div className="space-y-3">
      <div className="p-4 bg-emerald-900/20 border border-emerald-500/15 rounded-2xl">
        <p className="text-emerald-300 font-bold text-sm mb-1">🎨 Les règles du Tajweed</p>
        <p className="text-slate-500 text-xs">Appuie sur chaque règle → description + exemple prononcé par le professeur.</p>
      </div>
      {TAJWEED_INFO.map(t => (
        <button key={t.cls} onClick={() => {
          const opening = sel !== t.cls;
          setSel(opening ? t.cls : null);
          if (opening) {
            speakFeedback(`${t.label}. ${t.desc}`, "fr-FR");
            const ex = TAJWEED_EXAMPLES[t.cls];
            if (ex) setTimeout(() => speakArabic(ex, 0.5), 2500);
          }
        }}
          className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${sel === t.cls ? "border-white/25 bg-white/8" : "border-white/8 bg-white/3"}`}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:`${t.color}25`,border:`1px solid ${t.color}50`}}>
            <div className="w-4 h-4 rounded-full" style={{background:t.color}}/>
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-semibold text-sm">{t.label}</p>
            <AnimatePresence>
              {sel === t.cls && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                  <p className="text-slate-400 text-xs mt-1">{t.desc}</p>
                  {TAJWEED_EXAMPLES[t.cls] && (
                    <div className="flex items-center gap-2 mt-2">
                      <p className="font-serif text-base" style={{color:t.color}} dir="rtl">{TAJWEED_EXAMPLES[t.cls]}</p>
                      <button onClick={e=>{e.stopPropagation();speakArabic(TAJWEED_EXAMPLES[t.cls],0.45);}}
                        style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"8px",padding:"2px 8px",color:"#94a3b8",fontSize:"0.7rem",cursor:"pointer"}}>
                        🔊
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
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
        <p className="text-slate-500 text-xs">Appuie sur chaque voyelle → le professeur explique et prononce l'exemple.</p>
      </div>
      {HARAKAT.map((h,i) => (
        <motion.button key={h.name} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
          onClick={() => {
            speakFeedback(`${h.name}. ${h.sound}.`, "fr-FR");
            setTimeout(() => speakArabic(h.example, 0.4), 1500);
          }}
          className="w-full flex items-center gap-4 p-4 bg-white/4 border border-white/8 rounded-2xl active:bg-white/8 transition-all text-left">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center shrink-0">
            <span className="text-3xl font-serif" style={{color:"white"}} dir="rtl">{h.example}</span>
          </div>
          <div className="flex-1">
            <p className="text-white font-bold text-sm">{h.name}</p>
            <p className="text-purple-300 text-xs">{h.sound}</p>
            <p className="text-slate-600 text-xs">→ <span className="text-slate-300 font-semibold">{h.tr}</span></p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-4xl font-serif text-slate-400">{h.symbol}</span>
            <p className="text-slate-600 text-[9px] mt-1">🔊 tap</p>
          </div>
        </motion.button>
      ))}
      <div className="p-4 bg-white/4 border border-white/10 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-white font-bold text-sm">Exemple complet</p>
          <button onClick={() => { speakFeedback("Bismi llāhi", "fr-FR"); setTimeout(()=>speakArabic("بِسْمِ اللَّهِ",0.45),1200); }}
            style={{background:"rgba(139,92,246,0.2)",border:"1px solid rgba(167,139,250,0.3)",borderRadius:"8px",padding:"4px 12px",color:"#c4b5fd",fontSize:"0.75rem",cursor:"pointer"}}>
            🧑‍🏫 Écouter
          </button>
        </div>
        <div className="text-center py-3">
          <LetterByLetter text="بِسْمِ اللَّهِ" size="2rem"/>
        </div>
        <p className="text-blue-300 text-xs text-center italic">Bismi llāh — kasra · sukūn · kasra · madd</p>
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
          <p className="text-slate-500 text-sm mt-2">{learned}/500 mots appris</p>
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
      <motion.button key={card?.id + String(flipped)} onClick={() => {
        if (!flipped) {
          setFlipped(true);
          // Le prof lit le mot arabe puis la traduction
          speakArabic(card?.ar, 0.55);
          setTimeout(() => speakFeedback(card?.fr, "fr-FR"), 1800);
        }
      }}
        className="w-full min-h-48 rounded-3xl border border-white/15 bg-white/5 flex flex-col items-center justify-center p-6 gap-3 active:scale-98 transition-all"
        whileTap={{scale:0.98}}>
        {!flipped ? (
          <div style={{display:"contents"}}>
            <p className="font-serif text-white" style={{fontSize:"3.5rem"}} dir="rtl">{card?.ar}</p>
            <p className="text-slate-500 text-sm">Appuie pour voir la réponse</p>
          </div>
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
  const [lastCorrect, setLastCorrect] = useState(false);

  const genLetterForms = () =>
    [...ALPHABET].sort(()=>Math.random()-0.5).map(l => {
      const wrong = ALPHABET.filter(x=>x.name!==l.name).sort(()=>Math.random()-0.5).slice(0,3);
      return {
        type:"letter_forms", question:"Quelle est cette lettre ?",
        letter:l, ar:l.ar, correct:l.name, sound:l.sound,
        options:[...wrong.map(x=>x.name),l.name].sort(()=>Math.random()-0.5),
        variants:[{label:"Isolée",text:l.i},{label:"Initiale",text:l.ini},{label:"Médiane",text:l.med},{label:"Finale",text:l.fin}],
      };
    });

  const genLetterSound = () =>
    [...ALPHABET].sort(()=>Math.random()-0.5).map(l => {
      const wrong = ALPHABET.filter(x=>x.name!==l.name).sort(()=>Math.random()-0.5).slice(0,3);
      return {
        type:"letter_sound", question:"Quel son vient d'être prononcé ?",
        letter:l, ar:l.ar, correct:l.ar, sound:l.sound,
        options:[...wrong.map(x=>x.ar),l.ar].sort(()=>Math.random()-0.5),
      };
    });

  const genWordMeaning = () => {
    const top30 = [...VOCAB].sort((a,b)=>b.freq-a.freq).slice(0,100);
    return [...top30].sort(()=>Math.random()-0.5).slice(0,12).map(w => {
      const wrong = top30.filter(x=>x.id!==w.id).sort(()=>Math.random()-0.5).slice(0,3);
      return { type:"word_meaning", question:"Que signifie ce mot ?", ar:w.ar, tr:w.tr, correct:w.fr, freq:w.freq, cat:w.cat,
        options:[...wrong.map(x=>x.fr),w.fr].sort(()=>Math.random()-0.5) };
    });
  };

  const genWordArabic = () => {
    const top30 = [...VOCAB].sort((a,b)=>b.freq-a.freq).slice(0,100);
    return [...top30].sort(()=>Math.random()-0.5).slice(0,12).map(w => {
      const wrong = top30.filter(x=>x.id!==w.id).sort(()=>Math.random()-0.5).slice(0,3);
      return { type:"word_arabic", question:`Mot arabe pour "${w.fr}" ?`, ar:w.ar, tr:w.tr, correct:w.ar, freq:w.freq,
        options:[...wrong.map(x=>x.ar),w.ar].sort(()=>Math.random()-0.5) };
    });
  };

  const genLetterName = () =>
    [...ALPHABET].sort(()=>Math.random()-0.5).map(l => {
      const wrong = ALPHABET.filter(x=>x.name!==l.name).sort(()=>Math.random()-0.5).slice(0,3);
      return { type:"letter", ar:l.ar, correct:l.name, options:[...wrong.map(x=>x.name),l.name].sort(()=>Math.random()-0.5) };
    });

  const genTajweed = () => [
    {ar:"قُلْ",question:"Règle sur le ق ?",correct:"Qalqala",options:["Qalqala","Ghunna","Madd","Ikhfāʾ"],type:"tajweed"},
    {ar:"إِنَّ",question:"Règle sur le نّ ?",correct:"Ghunna",options:["Ghunna","Qalqala","Iqlāb","Madd"],type:"tajweed"},
    {ar:"الرَّحِيمِ",question:"Le ل de ال est...",correct:"Laam solaire",options:["Laam solaire","Laam lunaire","Madd","Sukūn"],type:"tajweed"},
    {ar:"الْكِتَابُ",question:"Le ل de ال est...",correct:"Laam lunaire",options:["Laam lunaire","Laam solaire","Ghunna","Qalqala"],type:"tajweed"},
    {ar:"أَحَدٌ",question:"Règle sur le د final ?",correct:"Qalqala",options:["Qalqala","Ghunna","Madd","Iqlab"],type:"tajweed"},
    {ar:"إِنَّا",question:"Règle sur le نّ ?",correct:"Ghunna",options:["Ghunna","Ikhfa","Iqlab","Madd"],type:"tajweed"},
    {ar:"مِن بَعْدِ",question:"ن + ب → règle ?",correct:"Iqlāb",options:["Iqlāb","Ikhfāʾ","Idghām","Ghunna"],type:"tajweed"},
    {ar:"مِن قَبْلِ",question:"ن + ق → règle ?",correct:"Ikhfāʾ",options:["Ikhfāʾ","Iqlāb","Idghām","Qalqala"],type:"tajweed"},
    {ar:"الشَّمْسُ",question:"Le ل de ال est...",correct:"Laam solaire",options:["Laam solaire","Laam lunaire","Ghunna","Madd"],type:"tajweed"},
    {ar:"الرَّحْمَٰنِ",question:"Le ٰ signifie...",correct:"Madd long",options:["Madd long","Ghunna","Qalqala","Sukūn"],type:"tajweed"},
    {ar:"ثُمَّ",question:"Règle sur le مّ ?",correct:"Ghunna",options:["Ghunna","Qalqala","Madd","Ikhfāʾ"],type:"tajweed"},
    {ar:"بِسْمِ",question:"Le س porte...",correct:"Sukūn",options:["Sukūn","Fatha","Ghunna","Qalqala"],type:"tajweed"},
  ];

  const start = (type) => {
    let qs;
    if (type==="letter_forms") qs=genLetterForms();
    else if (type==="letter_sound") qs=genLetterSound();
    else if (type==="word_meaning") qs=genWordMeaning();
    else if (type==="word_arabic")  qs=genWordArabic();
    else if (type==="letters")      qs=genLetterName();
    else qs=genTajweed();
    setMode(type); setQuestions(qs); setQIdx(0);
    setSelected(null); setAnswered(false); setScore(0); setStreak(0);
  };

  const answer = useCallback((opt) => {
    if (answered) return;
    const q = questions[qIdx];
    const correct = opt === q.correct;
    setSelected(opt); setAnswered(true); setLastCorrect(correct);
    if (correct) { setScore(s=>s+1); setStreak(s=>s+1); } else setStreak(0);
    // Voix du prof : prononce la bonne réponse
    if (q.type==="letter_forms"||q.type==="letter_sound"||q.type==="letter") {
      setTimeout(()=>speakArabic(q.ar, 0.4), 400);
    } else if (q.type==="word_meaning"||q.type==="word_arabic") {
      setTimeout(()=>speakArabic(q.ar, 0.55), 300);
      setTimeout(()=>speakFeedback(q.correct||"", "fr-FR"), 1400);
    }
  }, [answered, questions, qIdx]);

  // ── Menu ──────────────────────────────────────────────
  if (!mode) return (
    <div className="space-y-3">
      <div className="p-4 bg-yellow-900/20 border border-yellow-500/20 rounded-2xl">
        <p className="text-yellow-300 font-bold text-sm mb-1">🎯 6 types de quiz</p>
        <p className="text-slate-500 text-xs">La voix du professeur lit la bonne réponse après chaque question.</p>
      </div>
      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Alphabet</p>
      {[
        {type:"letter_forms", emoji:"🔠", title:"4 formes de la lettre", desc:"Vois isolée · initiale · médiane · finale → trouve le nom", color:"from-blue-700 to-blue-800"},
        {type:"letter_sound", emoji:"🔊", title:"Reconnais par le son",  desc:"Appuie pour entendre → trouve la bonne lettre arabe", color:"from-cyan-700 to-blue-700"},
        {type:"letters",      emoji:"ح",  title:"Nom de la lettre",      desc:"Vois la lettre → trouve son nom en 4 choix", color:"from-indigo-700 to-indigo-800"},
      ].map(q=>(
        <motion.button key={q.type} whileTap={{scale:0.97}} onClick={()=>start(q.type)}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${q.color} text-white text-left shadow-md`}>
          <span className="text-2xl font-serif">{q.emoji}</span>
          <div><p className="font-black text-sm">{q.title}</p><p className="text-white/65 text-xs mt-0.5">{q.desc}</p></div>
        </motion.button>
      ))}
      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider pt-1">Vocabulaire coranique</p>
      {[
        {type:"word_meaning", emoji:"📖", title:"Mot arabe → sens",       desc:"30 mots les plus fréquents du Coran · trouve la signification", color:"from-purple-700 to-violet-700"},
        {type:"word_arabic",  emoji:"📝", title:"Sens → mot arabe",       desc:"Lis la traduction → retrouve le mot arabe parmi 4", color:"from-violet-700 to-purple-800"},
        {type:"tajweed",      emoji:"🎨", title:"Règles de tajweed",       desc:"Identifie qalqala, ghunna, madd, ikhfa…", color:"from-orange-600 to-orange-700"},
      ].map(q=>(
        <motion.button key={q.type} whileTap={{scale:0.97}} onClick={()=>start(q.type)}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r ${q.color} text-white text-left shadow-md`}>
          <span className="text-2xl">{q.emoji}</span>
          <div><p className="font-black text-sm">{q.title}</p><p className="text-white/65 text-xs mt-0.5">{q.desc}</p></div>
        </motion.button>
      ))}
    </div>
  );

  // ── Résultat ──────────────────────────────────────────
  if (mode==="done") {
    const pct=Math.round((score/questions.length)*100);
    return (
      <div className="text-center space-y-5 py-6">
        <motion.div initial={{scale:0}} animate={{scale:1}} className="text-7xl">{pct>=90?"🏆":pct>=70?"⭐":pct>=50?"👍":"📚"}</motion.div>
        <p className="text-white font-black text-3xl">{score}<span className="text-xl text-slate-400">/{questions.length}</span></p>
        <p className="text-slate-400">{pct>=90?"Mashā Allāh !":pct>=70?"Très bien !":pct>=50?"Continue !":"Réessaie !"}</p>
        <div className="flex gap-1.5 justify-center flex-wrap">
          {questions.map((_,i)=>(
            <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i<score?"bg-emerald-500 text-white":"bg-red-500/40 text-red-300"}`}>
              {i<score?"✓":"✗"}
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-center pt-2">
          <button onClick={()=>start(mode)} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl">🔄 Rejouer</button>
          <button onClick={()=>setMode(null)} className="px-5 py-2.5 bg-white/10 text-white rounded-xl">Menu</button>
        </div>
      </div>
    );
  }

  // ── Question ──────────────────────────────────────────
  const q = questions[qIdx];
  const isArabicOpt = q.type==="letter_sound"||q.type==="word_arabic";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={()=>setMode(null)} className="p-2 hover:bg-white/10 rounded-xl text-slate-400"><ChevronRight className="w-5 h-5 rotate-180"/></button>
        <div className="flex items-center gap-2">
          {streak>=2 && <span className="text-xs text-amber-400 font-bold">🔥 {streak}</span>}
          <span className="text-emerald-400 font-bold text-sm">{score} ✓</span>
          <span className="text-slate-500 text-xs">{qIdx+1}/{questions.length}</span>
        </div>
      </div>
      <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" animate={{width:`${(qIdx/questions.length)*100}%`}}/>
      </div>
      <p className="text-slate-400 text-sm text-center font-semibold">{q.question}</p>

      {/* Zone centrale selon type */}
      {q.type==="letter_forms" && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {q.variants.map(v=>(
              <div key={v.label} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"16px",padding:"12px 4px",textAlign:"center"}}>
                <p style={{fontSize:"0.6rem",color:"#94a3b8",marginBottom:"6px"}}>{v.label}</p>
                <p style={{fontFamily:"'Amiri Quran','Scheherazade New',serif",fontSize:"1.8rem",color:"white",lineHeight:"2"}} dir="rtl">{v.text}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button onClick={()=>speakArabic(q.ar, 0.4)}
              style={{background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:"12px",padding:"8px 20px",color:"#6ee7b7",fontSize:"0.85rem",cursor:"pointer",fontWeight:"bold"}}>
              🔊 Écouter
            </button>
            <p style={{color:"#64748b",fontSize:"0.75rem",marginTop:"6px"}}>Son : <span style={{color:"white",fontWeight:"bold"}}>{q.sound}</span></p>
          </div>
        </div>
      )}

      {q.type==="letter_sound" && (
        <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"24px",padding:"32px",textAlign:"center"}}>
          <p style={{color:"#94a3b8",fontSize:"0.85rem",marginBottom:"16px"}}>Appuie pour entendre la lettre</p>
          <button onClick={()=>speakArabic(q.ar, 0.35)}
            style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:"50%",width:"80px",height:"80px",fontSize:"2rem",cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 20px rgba(124,58,237,0.4)"}}>
            🔊
          </button>
          <p style={{color:"#64748b",fontSize:"0.8rem",marginTop:"12px"}}>Son attendu : <span style={{color:"white",fontWeight:"bold"}}>{q.sound}</span></p>
        </div>
      )}

      {(q.type==="word_meaning"||q.type==="word_arabic"||q.type==="tajweed") && (
        <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"24px",padding:"24px",textAlign:"center"}}>
          <div style={{lineHeight:"3"}}>
            <LetterByLetter text={q.ar} size="clamp(1.5rem,5vw,2rem)"/>
          </div>
          {q.tr && <p style={{color:"rgba(147,197,253,0.6)",fontSize:"0.75rem",fontStyle:"italic",marginTop:"4px"}} dir="ltr">{q.tr}</p>}
          {q.freq && <p style={{color:"#475569",fontSize:"0.7rem",marginTop:"2px"}}>{q.freq.toLocaleString()}× dans le Coran</p>}
          <button onClick={()=>speakArabic(q.ar,0.55)}
            style={{marginTop:"12px",background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:"10px",padding:"6px 16px",color:"#6ee7b7",fontSize:"0.75rem",cursor:"pointer"}}>
            🔊 Écouter
          </button>
        </div>
      )}

      {q.type==="letter" && (
        <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"24px",padding:"40px",textAlign:"center"}}>
          <p style={{fontFamily:"'Amiri Quran','Scheherazade New',serif",fontSize:"4rem",color:"white"}} dir="rtl">{q.ar}</p>
          <button onClick={()=>speakArabic(q.ar,0.4)}
            style={{marginTop:"12px",background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:"10px",padding:"6px 16px",color:"#6ee7b7",fontSize:"0.75rem",cursor:"pointer"}}>
            🔊 Écouter
          </button>
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt,oi)=>{
          const isCorrect=opt===q.correct, isSelected=opt===selected;
          let bg="rgba(255,255,255,0.05)",border="rgba(255,255,255,0.15)",color="white";
          if(answered&&isCorrect){bg="rgba(16,185,129,0.25)";border="#10b981";color="#6ee7b7";}
          else if(answered&&isSelected&&!isCorrect){bg="rgba(239,68,68,0.25)";border="#ef4444";color="#fca5a5";}
          return (
            <button key={oi} onClick={()=>answer(opt)} style={{
              padding:isArabicOpt?"16px 8px":"14px 10px",borderRadius:"16px",
              border:`1px solid ${border}`,background:bg,color,fontWeight:"bold",
              fontSize:isArabicOpt?"1.5rem":"0.875rem",cursor:"pointer",transition:"all 0.2s",
              textAlign:"center",fontFamily:isArabicOpt?"'Amiri Quran','Scheherazade New',serif":"inherit",
              direction:isArabicOpt?"rtl":"ltr",lineHeight:isArabicOpt?"2":"1.4",
            }}>
              {opt}
              {answered&&isCorrect&&<span style={{display:"block",fontSize:"0.6rem",fontFamily:"system-ui",color:"#6ee7b7",marginTop:"2px"}}>✓</span>}
            </button>
          );
        })}
      </div>

      {answered && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="space-y-2">
          <div style={{background:lastCorrect?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)",border:`1px solid ${lastCorrect?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`,borderRadius:"16px",padding:"12px",textAlign:"center"}}>
            <p style={{color:lastCorrect?"#6ee7b7":"#fca5a5",fontWeight:"bold"}}>
              {lastCorrect?"✅ Correct !":"❌ Réponse : "+q.correct}
            </p>
            {q.type==="letter_forms" && <p style={{color:"#93c5fd",fontSize:"0.75rem",marginTop:"4px"}}>Son : {q.sound}</p>}
            {(q.type==="word_meaning"||q.type==="word_arabic")&&q.tr && <p style={{color:"#93c5fd",fontSize:"0.75rem",fontStyle:"italic",marginTop:"4px"}} dir="ltr">{q.tr}</p>}
          </div>
          <button onClick={()=>{if(qIdx<questions.length-1){setQIdx(i=>i+1);setSelected(null);setAnswered(false);}else setMode("done");}}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl">
            {qIdx<questions.length-1?"Suivant →":"Voir le résultat →"}
          </button>
        </motion.div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// DONNÉES + HELPERS pour le Professeur
// ═══════════════════════════════════════════════════════
const PROF_SURAHS = LEARN_SURAHS.slice(0, 6);

function normalizeAr(text) {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

function compareWords(expected, spoken) {
  const expWords = normalizeAr(expected).split(" ");
  const spkWords = normalizeAr(spoken).split(" ");
  return expWords.map((w, i) => {
    const s = spkWords[i] || "";
    if (!s) return { word: w, status: "missing" };
    if (s === w) return { word: w, status: "correct" };
    let diff = 0;
    for (let j = 0; j < Math.max(w.length, s.length); j++) { if (w[j] !== s[j]) diff++; }
    return { word: w, status: diff <= 1 ? "close" : "wrong", spoken: s };
  });
}

function calcScore(results) {
  if (!results.length) return 0;
  const pts = results.reduce((a, r) => a + (r.status === "correct" ? 1 : r.status === "close" ? 0.5 : 0), 0);
  return Math.round((pts / results.length) * 100);
}

function ensureVoices() {
  return new Promise(resolve => {
    if (!window.speechSynthesis) { resolve([]); return; }
    const v = window.speechSynthesis.getVoices();
    if (v.length > 0) { resolve(v); return; }
    window.speechSynthesis.onvoiceschanged = () => resolve(window.speechSynthesis.getVoices());
    setTimeout(() => resolve(window.speechSynthesis?.getVoices() || []), 1000);
  });
}

async function speakArabic(text, rate) {
  if (!TTS_READY) return;
  window.speechSynthesis.cancel();
  const voices = await ensureVoices();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ar-SA"; u.rate = rate || 0.6; u.pitch = 1.1;
  const ar = voices.find(v => v.lang === "ar-SA")
    || voices.find(v => v.lang === "ar-EG")
    || voices.find(v => v.lang.startsWith("ar"));
  if (ar) u.voice = ar;
  window.speechSynthesis.speak(u);
}

function ProfesseurTab() {
  const [mode, setMode] = useState(null);
  const [selectedSurah, setSelectedSurah] = useState(PROF_SURAHS[0]);
  const [verseIdx, setVerseIdx] = useState(0);
  const [letterIdx, setLetterIdx] = useState(0);
  const [step, setStep] = useState("idle"); // idle | listening | result
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState(null);
  const [score, setScore] = useState(null);
  const [letterResult, setLetterResult] = useState(null); // correct | wrong
  const [voiceMsg, setVoiceMsg] = useState("");
  const [sessionScores, setSessionScores] = useState([]);
  const [hasMic, setHasMic] = useState(null);
  const recognitionRef = useRef(null);
  const audio = useAudio();

  const verse = selectedSurah.verses[verseIdx];
  const letter = ALPHABET[letterIdx];

  // Détecte si le navigateur supporte la reconnaissance vocale
  useEffect(() => {
    setHasMic("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
    ensureVoices(); // précharge les voix
  }, []);

  // ── Le professeur parle ────────────────────────────────
  const profSpeak = useCallback((text, lang = "fr-FR") => {
    speakFeedback(text, lang);
    setVoiceMsg(text);
    setTimeout(() => setVoiceMsg(""), 4000);
  }, []);

  // ── Reconnaissance vocale ──────────────────────────────
  const startRec = useCallback((onResult) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { profSpeak("Ton navigateur ne supporte pas le microphone. Ouvre l'app dans Chrome."); return; }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = "ar-SA";
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    rec.onstart  = () => setStep("listening");
    rec.onresult = (e) => {
      const heard = Array.from(e.results[0]).map(r => r.transcript).join(" ").trim();
      setTranscript(heard);
      onResult(heard);
    };
    rec.onerror = (e) => {
      setStep("idle");
      if (e.error === "not-allowed") profSpeak("Autorise l'accès au microphone dans Chrome.");
      else if (e.error === "no-speech") profSpeak("Je n'ai rien entendu. Parle plus fort près du microphone.");
      else profSpeak("Erreur microphone : " + e.error);
    };
    rec.onend = () => setStep(s => s === "listening" ? "idle" : s);
    rec.start();
  }, [profSpeak]);

  const stopRec = () => { recognitionRef.current?.stop(); setStep("idle"); };

  // ── Résultat Verset / Mot ──────────────────────────────
  const handleVerseResult = useCallback((heard, wordMode) => {
    const res = compareWords(verse.ar, heard);
    const sc = calcScore(res);
    setResults(wordMode ? res : null);
    setScore(sc);
    setStep("result");
    setSessionScores(prev => [...prev, sc]);

    // Le prof parle selon le score
    if (sc >= 95) {
      profSpeak("Mashā Allāh ! Excellent, ta récitation est parfaite !");
    } else if (sc >= 80) {
      const wrong = res.filter(r => r.status === "wrong").map(r => r.word);
      if (wrong.length) {
        profSpeak(`Bien ! Retravaille ces mots : ${wrong.slice(0,3).join("، ")}`);
        setTimeout(() => speakArabic(wrong.slice(0,2).join(" "), 0.45), 2500);
      } else profSpeak("Très bien ! Continue comme ça !");
    } else if (sc >= 60) {
      profSpeak("Écoute d'abord bien le verset, puis répète lentement.");
      setTimeout(() => audio.playVerse(selectedSurah.number, verse.n), 1500);
    } else {
      profSpeak("Recommençons. Je vais lire le verset, répète après moi.");
      setTimeout(() => audio.playVerse(selectedSurah.number, verse.n), 1500);
    }
  }, [verse, selectedSurah, profSpeak, audio]);

  // ── Résultat Lettre ────────────────────────────────────
  const handleLetterResult = useCallback((heard) => {
    setStep("result");
    const norm = normalizeAr(heard);
    const found = norm.includes(letter.ar) || heard.includes(letter.ar)
      || normalizeAr(heard).includes(normalizeAr(letter.ar));
    setLetterResult(found ? "correct" : "wrong");
    if (found) {
      profSpeak(`Bravo ! Tu as bien prononcé ${letter.name}.`);
    } else {
      profSpeak(`Pas tout à fait. La lettre ${letter.name} se prononce : ${letter.sound}`);
      setTimeout(() => speakArabic(letter.ar, 0.35), 1800);
    }
  }, [letter, profSpeak]);

  // ── ÉCRAN ACCUEIL ──────────────────────────────────────
  if (!mode) {
    const avgScore = sessionScores.length ? Math.round(sessionScores.reduce((a,b)=>a+b,0)/sessionScores.length) : null;
    return (
      <div className="space-y-4">
        {/* Bannière son */}
        <div className="p-4 bg-amber-900/20 border border-amber-500/25 rounded-2xl">
          <p className="text-amber-300 font-bold text-sm mb-1">🔊 Pour activer le son et le micro</p>
          <p className="text-slate-400 text-xs leading-relaxed">
            Android : ouvre dans <span className="text-white font-bold">Chrome</span> → Menu ⋮ → Ajouter à l'écran d'accueil{"\n"}
            iPhone : ouvre dans <span className="text-white font-bold">Safari</span> → Partager → Sur l'écran d'accueil
          </p>
          {hasMic === false && <p className="text-red-400 text-xs mt-1 font-bold">❌ Microphone non disponible dans ce navigateur</p>}
          {hasMic === true  && <p className="text-emerald-400 text-xs mt-1 font-bold">✅ Microphone disponible !</p>}
        </div>

        <div className="p-4 bg-purple-900/20 border border-purple-500/20 rounded-2xl">
          <p className="text-purple-300 font-bold text-sm mb-1">🎙️ Professeur de Tajweed — Comment ça marche</p>
          <p className="text-slate-400 text-xs leading-relaxed">1. Écoute le verset ou la lettre · 2. Appuie sur 🎙️ Répéter · 3. Le professeur analyse ta prononciation et te reprend vocalement</p>
        </div>

        {/* Sélection sourate */}
        <div>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Sourate d'entraînement</p>
          <div className="flex flex-wrap gap-2">
            {PROF_SURAHS.map(s => (
              <button key={s.number} onClick={() => { setSelectedSurah(s); setVerseIdx(0); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedSurah.number===s.number ? "bg-emerald-600 text-white" : "bg-white/8 text-slate-400 border border-white/10"}`}>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* 3 modes */}
        {[
          { key:"verse",  emoji:"📖", title:"Mode Verset complet", color:"from-emerald-700 to-teal-700",  desc:"Récite un verset entier → score de précision + correction vocale" },
          { key:"word",   emoji:"🔤", title:"Mode Mot par mot",     color:"from-blue-700 to-indigo-700",   desc:"Chaque mot coloré selon sa précision · Le prof lit les mots ratés" },
          { key:"letter", emoji:"ح",  title:"Mode Lettre",          color:"from-purple-700 to-violet-700", desc:"Prononce chaque lettre de l'alphabet → validation + correction" },
        ].map(m => (
          <motion.button key={m.key} whileTap={{scale:0.97}}
            onClick={() => { setMode(m.key); setScore(null); setResults(null); setTranscript(""); setLetterResult(null); setStep("idle"); setVoiceMsg(""); }}
            className={`w-full flex items-center gap-4 p-5 rounded-3xl bg-gradient-to-r ${m.color} text-white text-left shadow-lg active:opacity-90`}>
            <span className="text-3xl font-serif">{m.emoji}</span>
            <div>
              <p className="font-black text-base">{m.title}</p>
              <p className="text-white/70 text-sm mt-0.5">{m.desc}</p>
            </div>
          </motion.button>
        ))}

        {/* Score session */}
        {avgScore !== null && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white font-bold text-sm">📊 Session en cours</p>
              <span className={`font-black text-lg ${avgScore>=80?"text-emerald-400":avgScore>=60?"text-blue-400":"text-orange-400"}`}>{avgScore}%</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {sessionScores.map((s,i) => (
                <span key={i} className={`text-xs font-bold px-2 py-0.5 rounded-lg ${s>=90?"bg-emerald-500/25 text-emerald-300":s>=70?"bg-blue-500/25 text-blue-300":"bg-orange-500/25 text-orange-300"}`}>{s}%</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── MODE LETTRE ────────────────────────────────────────
  if (mode === "letter") {
    const rows = [];
    for (let i=0; i<ALPHABET.length; i+=4) rows.push(ALPHABET.slice(i,i+4));
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setMode(null); stopRec(); setStep("idle"); }} className="p-2 hover:bg-white/10 rounded-xl text-slate-400">
            <ChevronRight className="w-5 h-5 rotate-180"/>
          </button>
          <p className="text-white font-bold">Mode Lettre · {letterIdx+1}/{ALPHABET.length}</p>
        </div>

        {/* Bulle professeur */}
        <AnimatePresence>
          {voiceMsg && (
            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="flex items-start gap-3 p-3 bg-purple-900/30 border border-purple-500/30 rounded-2xl">
              <span className="text-xl shrink-0">🧑‍🏫</span>
              <p className="text-purple-200 text-sm italic">{voiceMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lettre */}
        <div className={`rounded-3xl p-6 border text-center transition-all ${
          letterResult==="correct" ? "bg-emerald-900/30 border-emerald-500/40" :
          letterResult==="wrong"   ? "bg-red-900/25 border-red-500/35" :
          step==="listening"       ? "bg-purple-900/25 border-purple-500/30 animate-pulse" :
          "bg-white/5 border-white/15"}`}>
          <p className="font-serif mb-2" style={{color:"white", fontSize:"6rem"}}>{letter.ar}</p>
          <p className="text-blue-300 font-bold text-xl">{letter.name}</p>
          <p className="text-slate-400 text-sm mt-1">Son : <span className="text-white font-bold">{letter.sound}</span></p>
          <p className="text-slate-600 text-xs mt-1">{letter.group}</p>
          {letterResult==="correct" && <motion.p initial={{scale:0}} animate={{scale:1}} className="text-emerald-400 font-black text-2xl mt-3">✅ Correct !</motion.p>}
          {letterResult==="wrong"   && <motion.p initial={{scale:0}} animate={{scale:1}} className="text-red-400 font-bold text-sm mt-2">❌ Écoute et réessaie</motion.p>}
          {step==="listening"       && <p className="text-purple-300 text-sm mt-2 font-bold">🎙️ J'écoute…</p>}
        </div>

        {/* Boutons */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { speakArabic(letter.ar, 0.35); }}
            className="py-3.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
            <Volume2 className="w-4 h-4"/> Écouter
          </button>
          <motion.button whileTap={{scale:0.95}}
            onClick={() => step==="listening" ? stopRec() : startRec(handleLetterResult)}
            className={`py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 ${step==="listening" ? "bg-red-500 text-white" : "bg-purple-600 text-white"}`}>
            {step==="listening" ? "⏹ Stop" : "🎙️ Répéter"}
          </motion.button>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button disabled={letterIdx===0}
            onClick={() => { setLetterIdx(i=>i-1); setLetterResult(null); setStep("idle"); setVoiceMsg(""); }}
            className="px-4 py-2.5 bg-white/8 rounded-xl text-slate-400 disabled:opacity-30 font-bold">← Préc.</button>
          <div className="flex gap-1 flex-wrap justify-center max-w-48">
            {ALPHABET.map((_,i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i===letterIdx?"bg-purple-400":"bg-white/15"}`}/>
            ))}
          </div>
          <button disabled={letterIdx===ALPHABET.length-1}
            onClick={() => { setLetterIdx(i=>i+1); setLetterResult(null); setStep("idle"); setVoiceMsg(""); }}
            className="px-4 py-2.5 bg-white/8 rounded-xl text-slate-400 disabled:opacity-30 font-bold">Suiv. →</button>
        </div>

        {/* Grille */}
        <div className="grid grid-cols-7 gap-1.5">
          {ALPHABET.map((l,i) => (
            <button key={i} onClick={() => { setLetterIdx(i); setLetterResult(null); setStep("idle"); setVoiceMsg(""); }}
              className={`p-1.5 rounded-xl text-center font-serif text-base transition-all ${i===letterIdx?"bg-purple-600":"bg-white/8 border border-white/10"}`}
              style={{color:"white"}} dir="rtl">{l.ar}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── MODE VERSET / MOT PAR MOT ──────────────────────────
  const isWordMode = mode === "word";
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => { setMode(null); stopRec(); setScore(null); setResults(null); setStep("idle"); setVoiceMsg(""); }}
          className="p-2 hover:bg-white/10 rounded-xl text-slate-400"><ChevronRight className="w-5 h-5 rotate-180"/></button>
        <div className="flex-1">
          <p className="text-white font-bold text-sm">{isWordMode ? "Mot par mot" : "Verset complet"} · {selectedSurah.name}</p>
          <p className="text-slate-500 text-xs">Verset {verseIdx+1}/{selectedSurah.verses.length}</p>
        </div>
        <button onClick={() => { audio.playVerse(selectedSurah.number, verse.n); speakArabic(verse.ar, 0.5); }}
          className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl active:scale-95">
          <Volume2 className="w-4 h-4"/>
        </button>
      </div>

      {/* Bulle professeur */}
      <AnimatePresence>
        {voiceMsg && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="flex items-start gap-3 p-3 bg-purple-900/30 border border-purple-500/30 rounded-2xl">
            <span className="text-xl shrink-0">🧑‍🏫</span>
            <p className="text-purple-200 text-sm italic leading-relaxed">{voiceMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verset */}
      <div className={`p-5 rounded-3xl border text-center transition-all ${
        score===null ? step==="listening" ? "bg-purple-900/20 border-purple-500/30" : "bg-white/5 border-white/12" :
        score>=90 ? "bg-emerald-900/25 border-emerald-500/30" :
        score>=70 ? "bg-blue-900/25 border-blue-500/30" :
        "bg-orange-900/20 border-orange-500/25"}`}>

        {results && isWordMode ? (
          <div className="flex flex-wrap justify-center gap-3 py-3" dir="rtl">
            {results.map((r,i) => {
              const color = r.status==="correct" ? "#34d399"
                : r.status==="close"   ? "#fbbf24"
                : r.status==="missing" ? "#475569"
                : "#f87171";
              const bg = r.status==="wrong" ? "rgba(239,68,68,0.12)" : r.status==="missing" ? "rgba(71,85,105,0.15)" : "transparent";
              return (
                <div key={i} style={{display:"inline-flex", flexDirection:"column", alignItems:"center", gap:"4px"}}>
                  <span style={{
                    fontFamily:"'Amiri Quran','Scheherazade New',serif",
                    fontSize:"1.8rem",
                    color,
                    background: bg,
                    padding: "4px 8px",
                    borderRadius:"10px",
                    lineHeight:"2.2",
                    textDecoration: r.status==="missing" ? "line-through" : "none",
                  }}>
                    {r.word}
                  </span>
                  <span style={{fontSize:"0.6rem", color, opacity:0.8}}>
                    {r.status==="correct" ? "✓" : r.status==="close" ? "≈" : r.status==="missing" ? "—" : "✗"}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-3" style={{lineHeight:"3"}}>
            <LetterByLetter text={verse.ar} size="clamp(1.3rem,4.5vw,1.8rem)"/>
          </div>
        )}

        <p className="text-blue-300/60 text-xs italic mt-1" dir="ltr">{verse.tr}</p>

        {score !== null && (
          <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} className="mt-3 space-y-1">
            <p className={`font-black text-4xl ${score>=90?"text-emerald-400":score>=70?"text-blue-400":"text-orange-400"}`}>{score}<span className="text-xl">%</span></p>
            {isWordMode && results && (
              <div className="flex gap-3 justify-center text-xs mt-2">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/> {results.filter(r=>r.status==="correct").length} correct</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"/> {results.filter(r=>r.status==="close").length} proche</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"/> {results.filter(r=>r.status==="wrong"||r.status==="missing").length} à retravailler</span>
              </div>
            )}
          </motion.div>
        )}
        {step==="listening" && <p className="text-purple-300 text-sm mt-2 font-bold animate-pulse">🎙️ Je t'écoute… récite lentement</p>}
      </div>

      {/* Ce que j'ai entendu */}
      {transcript && step==="result" && (
        <div className="bg-white/5 border border-white/8 rounded-2xl p-3">
          <p className="text-slate-600 text-xs mb-1">🎙️ Ce que j'ai entendu :</p>
          <p className="text-white font-serif text-lg" dir="rtl">{transcript}</p>
        </div>
      )}

      {/* Boutons principaux */}
      <div className="flex gap-2">
        <button onClick={() => { audio.playVerse(selectedSurah.number, verse.n); speakArabic(verse.ar, 0.45); }}
          className="flex-1 py-3.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
          <Volume2 className="w-4 h-4"/> Écouter
        </button>
        <motion.button whileTap={{scale:0.95}}
          onClick={() => step==="listening" ? stopRec() : startRec(h => handleVerseResult(h, isWordMode))}
          className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg ${
            step==="listening" ? "bg-red-500 text-white" : "bg-gradient-to-r from-purple-600 to-violet-600 text-white"}`}>
          {step==="listening" ? "⏹ Stop" : "🎙️ Répéter"}
        </motion.button>
        {score !== null && (
          <button onClick={() => {
            const next = (verseIdx+1) % selectedSurah.verses.length;
            setVerseIdx(next); setScore(null); setResults(null); setTranscript(""); setStep("idle"); setVoiceMsg("");
          }} className="px-4 py-3.5 bg-white/10 border border-white/20 text-white font-bold rounded-2xl">
            {verseIdx < selectedSurah.verses.length-1 ? "→" : "↺"}
          </button>
        )}
      </div>

      {/* Navigation versets */}
      <div className="flex gap-1.5 flex-wrap">
        {selectedSurah.verses.map((_,i) => (
          <button key={i}
            onClick={() => { setVerseIdx(i); setScore(null); setResults(null); setTranscript(""); setStep("idle"); setVoiceMsg(""); }}
            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${i===verseIdx ? "bg-purple-600 text-white" : "bg-white/8 text-slate-500 border border-white/10"}`}>
            {i+1}
          </button>
        ))}
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════
const TABS = [
  {key:"surahs",   label:"📖 Sourates"},
  {key:"prof",     label:"🎙️ Professeur"},
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
        <p className="text-slate-600 text-xs">Méthode Al-Azhar · Répétition espacée · Tajweed lettre par lettre · 🔊 <span className="text-amber-500">Son : ouvrir dans Chrome</span></p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white/5 border border-white/8 rounded-2xl p-2.5 text-center">
          <p className="text-emerald-400 font-black text-lg">{lessonsDone}/7</p>
          <p className="text-slate-600 text-[10px]">Leçons</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-2xl p-2.5 text-center">
          <p className="text-blue-400 font-black text-lg">{VOCAB.filter(w => anki[w.id]?.reps > 0).length}/500</p>
          <p className="text-slate-600 text-[10px]">Mots appris</p>
        </div>
        <div className="bg-white/5 border border-white/8 rounded-2xl p-2.5 text-center">
          <p className={`font-black text-lg ${ankiDue > 0 ? "text-amber-400" : "text-emerald-400"}`}>{ankiDue}</p>
          <p className="text-slate-600 text-[10px]">À réviser</p>
        </div>
      </div>
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
          {tab === "prof"     && <ProfesseurTab/>}
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
