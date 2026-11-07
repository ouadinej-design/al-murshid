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
  if (QALQALA.has(base) && marks.includes("\u0652")) return "#B45309";
  if ((base === "ن" || base === "م") && marks.includes("\u0651")) return "#15803D";
  if (base === "ٱ") return "#8A94A6";
  if (base === "ا" || base === "و" || base === "ي") {
    const prev = groups[idx-1];
    if (prev) {
      if (base === "ا" && prev.marks.includes("\u064E")) return "#2563EB";
      if (base === "و" && prev.marks.includes("\u064F")) return "#2563EB";
      if (base === "ي" && prev.marks.includes("\u0650")) return "#2563EB";
    }
  }
  if (marks.includes("\u0670")) return "#0E7490";
  if (base === "ل" && marks.includes("\u0652")) { const next = groups[idx+1]; if (next && SUN.has(next.base)) return "#8A94A6"; }
  return null;
}

function LetterByLetter({ text, size = "1.5rem" }) {
  const groups = useMemo(() => groupLetters(text), [text]);
  return (
    <span dir="rtl" lang="ar" style={{ fontFamily:"'Amiri Quran','Scheherazade New',serif", fontSize:size }}>
      {groups.map((grp, idx) => {
        if (grp.isSpace) return <span key={idx}> </span>;
        const color = colorizeGroup(grp, groups, idx);
        return <span key={idx} style={{ color: color || "#1A1A1A" }}>{grp.base + grp.marks}</span>;
      })}
    </span>
  );
}

// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
// SOURATES — organisées par niveau, déverrouillage progressif
// ═══════════════════════════════════════════════════════
const ALL_SURAHS = [
  // ── NIVEAU 1 : Les incontournables ─────────────────
  { number:1,  name:"Al-Fātiḥa",  arabic:"الفاتحة",  juz:1,  level:1, verses:[
    {n:1,ar:"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",tr:"Bismi llāhi r-raḥmāni r-raḥīm",fr:"Au nom d'Allah, le Tout Miséricordieux"},
    {n:2,ar:"الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",tr:"Al-ḥamdu li-llāhi rabbi l-ʿālamīn",fr:"Louange à Allah, Seigneur de l'univers"},
    {n:3,ar:"الرَّحْمَٰنِ الرَّحِيمِ",tr:"Ar-raḥmāni r-raḥīm",fr:"Le Tout Miséricordieux, le Très Miséricordieux"},
    {n:4,ar:"مَالِكِ يَوْمِ الدِّينِ",tr:"Māliki yawmi d-dīn",fr:"Maître du Jour de la rétribution"},
    {n:5,ar:"إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",tr:"Iyyāka naʿbudu wa-iyyāka nastaʿīn",fr:"C'est Toi Seul que nous adorons"},
    {n:6,ar:"اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",tr:"Ihdinā ṣ-ṣirāṭa l-mustaqīm",fr:"Guide-nous dans le droit chemin"},
    {n:7,ar:"صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",tr:"Ṣirāṭa lladhīna anʿamta ʿalayhim",fr:"Le chemin de ceux que Tu as comblés de faveurs"},
  ]},
  { number:112, name:"Al-Ikhlāṣ",  arabic:"الإخلاص",  juz:30, level:1, verses:[
    {n:1,ar:"قُلْ هُوَ اللَّهُ أَحَدٌ",tr:"Qul huwa llāhu aḥad",fr:"Dis : Il est Allah, Unique"},
    {n:2,ar:"اللَّهُ الصَّمَدُ",tr:"Allāhu ṣ-ṣamad",fr:"Allah, le Seul à être imploré"},
    {n:3,ar:"لَمْ يَلِدْ وَلَمْ يُولَدْ",tr:"Lam yalid wa-lam yūlad",fr:"Il n'a pas engendré et n'a pas été engendré"},
    {n:4,ar:"وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",tr:"Wa-lam yakun lahū kufuwan aḥad",fr:"Et nul n'est égal à Lui"},
  ]},
  { number:113, name:"Al-Falaq",   arabic:"الفلق",    juz:30, level:1, verses:[
    {n:1,ar:"قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",tr:"Qul aʿūdhu bi-rabbi l-falaq",fr:"Je cherche refuge auprès du Seigneur de l'aurore"},
    {n:2,ar:"مِن شَرِّ مَا خَلَقَ",tr:"Min sharri mā khalaq",fr:"contre le mal de ce qu'Il a créé"},
    {n:3,ar:"وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",tr:"Wa-min sharri ghāsiqin idhā waqab",fr:"contre le mal de l'obscurité"},
    {n:4,ar:"وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ",tr:"Wa-min sharri n-naffāthāti fī l-ʿuqad",fr:"contre le mal de celles qui soufflent sur les nœuds"},
    {n:5,ar:"وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",tr:"Wa-min sharri ḥāsidin idhā ḥasad",fr:"contre le mal de l'envieux"},
  ]},
  { number:114, name:"An-Nās",     arabic:"الناس",    juz:30, level:1, verses:[
    {n:1,ar:"قُلْ أَعُوذُ بِرَبِّ النَّاسِ",tr:"Qul aʿūdhu bi-rabbi n-nās",fr:"Je cherche refuge auprès du Seigneur des hommes"},
    {n:2,ar:"مَلِكِ النَّاسِ",tr:"Maliki n-nās",fr:"du Roi des hommes"},
    {n:3,ar:"إِلَٰهِ النَّاسِ",tr:"Ilāhi n-nās",fr:"de la Divinité des hommes"},
    {n:4,ar:"مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ",tr:"Min sharri l-waswāsi l-khannās",fr:"contre le mal du tentateur furtif"},
    {n:5,ar:"الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ",tr:"Alladhī yuwaswisu fī ṣudūri n-nās",fr:"qui souffle le mal dans les poitrines des hommes"},
    {n:6,ar:"مِنَ الْجِنَّةِ وَالنَّاسِ",tr:"Mina l-jinnati wa-n-nās",fr:"qu'il soit parmi les djinns ou parmi les hommes"},
  ]},
  // ── NIVEAU 2 : Sourates courtes ────────────────────
  { number:103, name:"Al-ʿAṣr",   arabic:"العصر",    juz:30, level:2, verses:[
    {n:1,ar:"وَالْعَصْرِ",tr:"Wa-l-ʿaṣr",fr:"Par le Temps !"},
    {n:2,ar:"إِنَّ الْإِنسَانَ لَفِي خُسْرٍ",tr:"Inna l-insāna la-fī khusr",fr:"L'être humain est certes en perdition"},
    {n:3,ar:"إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ",tr:"Illā lladhīna āmanū",fr:"sauf ceux qui croient et font de bonnes oeuvres"},
  ]},
  { number:108, name:"Al-Kawthar",arabic:"الكوثر",   juz:30, level:2, verses:[
    {n:1,ar:"إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ",tr:"Innā aʿṭaynāka l-kawthar",fr:"Nous t'avons accordé l'Abondance"},
    {n:2,ar:"فَصَلِّ لِرَبِّكَ وَانْحَرْ",tr:"Fa-ṣalli li-rabbika wa-nḥar",fr:"Accomplis donc la Salāt et sacrifie"},
    {n:3,ar:"إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ",tr:"Inna shāniʾaka huwa l-abtar",fr:"C'est ton ennemi qui est sans postérité"},
  ]},
  { number:110, name:"An-Naṣr",   arabic:"النصر",    juz:30, level:2, verses:[
    {n:1,ar:"إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ",tr:"Idhā jāʾa naṣru llāhi wa-l-fatḥ",fr:"Quand vient le secours d'Allah et la victoire"},
    {n:2,ar:"وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا",tr:"Wa-raʾayta n-nāsa yadkhulūna fī dīni llāhi afwājā",fr:"et que tu vois les gens entrer en foule dans la religion d'Allah"},
    {n:3,ar:"فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ إِنَّهُ كَانَ تَوَّابًا",tr:"Fasabbiḥ bi-ḥamdi rabbika",fr:"célèbre la gloire de ton Seigneur et implore Son pardon"},
  ]},
  { number:111, name:"Al-Masad",  arabic:"المسد",    juz:30, level:2, verses:[
    {n:1,ar:"تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ",tr:"Tabbat yadā abī lahabin wa-tabb",fr:"Que périssent les deux mains d'Abī Lahab !"},
    {n:2,ar:"مَا أَغْنَىٰ عَنْهُ مَالُهُ وَمَا كَسَبَ",tr:"Mā aġnā ʿanhu māluhu wa-mā kasab",fr:"Sa richesse ne lui a servi à rien"},
    {n:3,ar:"سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ",tr:"Sa-yaṣlā nāran dhāta lahab",fr:"Il sera brûlé dans un feu plein de flammes"},
    {n:4,ar:"وَامْرَأَتُهُ حَمَّالَةَ الْحَطَبِ",tr:"Wa-mraʾatuhū ḥammālata l-ḥaṭab",fr:"Et sa femme, la porteuse de bois"},
    {n:5,ar:"فِي جِيدِهَا حَبْلٌ مِّن مَّسَدٍ",tr:"Fī jīdihā ḥablun min masad",fr:"avec une corde de fibres autour du cou"},
  ]},
  // ── NIVEAU 3 : Juz 30 intermédiaires ───────────────
  { number:93,  name:"Aḍ-Ḍuḥā",  arabic:"الضحى",   juz:30, level:3, verses:[
    {n:1,ar:"وَالضُّحَىٰ",tr:"Wa-ḍ-ḍuḥā",fr:"Par le matin lumineux !"},
    {n:2,ar:"وَاللَّيْلِ إِذَا سَجَىٰ",tr:"Wa-l-layli idhā sajā",fr:"Par la nuit quand elle est tranquille !"},
    {n:3,ar:"مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ",tr:"Mā waddaʿaka rabbuka wa-mā qalā",fr:"Ton Seigneur ne t'a pas abandonné"},
    {n:4,ar:"وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ",tr:"Wa-la-l-ākhiratu khayrun laka",fr:"L'au-delà est meilleur pour toi"},
    {n:5,ar:"وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ",tr:"Wa-la-sawfa yuʿṭīka rabbuka fa-tarḍā",fr:"Ton Seigneur te donnera et tu seras satisfait"},
    {n:6,ar:"أَلَمْ يَجِدْكَ يَتِيمًا فَآوَىٰ",tr:"Alam yajidka yatīman fa-āwā",fr:"Ne t'a-t-Il pas trouvé orphelin et recueilli ?"},
    {n:7,ar:"وَوَجَدَكَ ضَالًّا فَهَدَىٰ",tr:"Wa-wajadaka ḍāllan fa-hadā",fr:"Ne t'a-t-Il pas trouvé égaré et guidé ?"},
    {n:8,ar:"وَوَجَدَكَ عَائِلًا فَأَغْنَىٰ",tr:"Wa-wajadaka ʿāʾilan fa-aġnā",fr:"Ne t'a-t-Il pas trouvé pauvre et enrichi ?"},
    {n:9,ar:"فَأَمَّا الْيَتِيمَ فَلَا تَقْهَرْ",tr:"Fa-ammā l-yatīma fa-lā taqhar",fr:"Quant à l'orphelin, ne le brime pas"},
    {n:10,ar:"وَأَمَّا السَّائِلَ فَلَا تَنْهَرْ",tr:"Wa-ammā s-sāʾila fa-lā tanhar",fr:"Quant au mendiant, ne le rabroue pas"},
    {n:11,ar:"وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ",tr:"Wa-ammā bi-niʿmati rabbika fa-ḥaddith",fr:"Et quant aux bienfaits de ton Seigneur, proclame-les"},
  ]},
  { number:94,  name:"Ash-Sharḥ", arabic:"الشرح",   juz:30, level:3, verses:[
    {n:1,ar:"أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ",tr:"Alam nashraḥ laka ṣadrak",fr:"N'avons-Nous pas déployé ta poitrine ?"},
    {n:2,ar:"وَوَضَعْنَا عَنكَ وِزْرَكَ",tr:"Wa-waḍaʿnā ʿanka wizrak",fr:"Et déposé ton fardeau"},
    {n:3,ar:"الَّذِي أَنقَضَ ظَهْرَكَ",tr:"Alladhī anqaḍa ẓahrak",fr:"qui alourdissait ton dos ?"},
    {n:4,ar:"وَرَفَعْنَا لَكَ ذِكْرَكَ",tr:"Wa-rafaʿnā laka dhikrak",fr:"N'avons-Nous pas élevé ta renommée ?"},
    {n:5,ar:"فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",tr:"Fa-inna maʿa l-ʿusri yusrā",fr:"Avec la difficulté vient la facilité"},
    {n:6,ar:"إِنَّ مَعَ الْعُسْرِ يُسْرًا",tr:"Inna maʿa l-ʿusri yusrā",fr:"Oui, avec la difficulté vient la facilité"},
    {n:7,ar:"فَإِذَا فَرَغْتَ فَانصَبْ",tr:"Fa-idhā faraġta fa-nṣab",fr:"Quand tu te libères, travaille ardemment"},
    {n:8,ar:"وَإِلَىٰ رَبِّكَ فَارْغَب",tr:"Wa-ilā rabbika fa-rġab",fr:"et vers ton Seigneur aspire"},
  ]},
  { number:107, name:"Al-Māʿūn",  arabic:"الماعون", juz:30, level:3, verses:[
    {n:1,ar:"أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ",tr:"Araʾayta lladhī yukadhdhibu bi-d-dīn",fr:"As-tu vu celui qui traite de mensonge la Rétribution ?"},
    {n:2,ar:"فَذَٰلِكَ الَّذِي يَدُعُّ الْيَتِيمَ",tr:"Fadhālika lladhī yadhuʿʿu l-yatīm",fr:"C'est lui qui repousse brutalement l'orphelin"},
    {n:3,ar:"وَلَا يَحُضُّ عَلَىٰ طَعَامِ الْمِسْكِينِ",tr:"Wa-lā yaḥuḍḍu ʿalā ṭaʿāmi l-miskīn",fr:"et n'encourage pas à nourrir le pauvre"},
    {n:4,ar:"فَوَيْلٌ لِّلْمُصَلِّينَ",tr:"Fa-waylun li-l-muṣallīn",fr:"Malheur à ceux qui font la Salāt"},
    {n:5,ar:"الَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ",tr:"Alladhīna hum ʿan ṣalātihim sāhūn",fr:"qui sont distraits dans leur Salāt"},
    {n:6,ar:"الَّذِينَ هُمْ يُرَاءُونَ",tr:"Alladhīna hum yurāʾūn",fr:"qui font de l'ostentation"},
    {n:7,ar:"وَيَمْنَعُونَ الْمَاعُونَ",tr:"Wa-yamnaʿūna l-māʿūn",fr:"et refusent l'entraide courante"},
  ]},
  { number:109, name:"Al-Kāfirūn",arabic:"الكافرون",juz:30, level:3, verses:[
    {n:1,ar:"قُلْ يَا أَيُّهَا الْكَافِرُونَ",tr:"Qul yā ayyuhā l-kāfirūn",fr:"Dis : Ô vous les mécréants"},
    {n:2,ar:"لَا أَعْبُدُ مَا تَعْبُدُونَ",tr:"Lā aʿbudu mā taʿbudūn",fr:"Je n'adore pas ce que vous adorez"},
    {n:3,ar:"وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ",tr:"Wa-lā antum ʿābidūna mā aʿbud",fr:"Et vous n'adorez pas ce que j'adore"},
    {n:4,ar:"وَلَا أَنَا عَابِدٌ مَّا عَبَدتُّمْ",tr:"Wa-lā anā ʿābidun mā ʿabadtum",fr:"Je ne suis pas adorateur de ce que vous avez adoré"},
    {n:5,ar:"وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ",tr:"Wa-lā antum ʿābidūna mā aʿbud",fr:"Et vous n'êtes pas adorateurs de ce que j'adore"},
    {n:6,ar:"لَكُمْ دِينُكُمْ وَلِيَ دِينِ",tr:"Lakum dīnukum wa-liya dīn",fr:"À vous votre religion, à moi la mienne"},
  ]},
  // ── NIVEAU 4 : Juz 30 avancées ─────────────────────
  { number:78,  name:"An-Nabaʾ",  arabic:"النبأ",   juz:30, level:4, verses:[
    {n:1,ar:"عَمَّ يَتَسَاءَلُونَ",tr:"ʿAmma yatasāʾalūn",fr:"De quoi s'interrogent-ils ?"},
    {n:2,ar:"عَنِ النَّبَإِ الْعَظِيمِ",tr:"ʿAni n-nabaʾi l-ʿaẓīm",fr:"De la grande nouvelle"},
    {n:3,ar:"الَّذِي هُمْ فِيهِ مُخْتَلِفُونَ",tr:"Alladhī hum fīhi mukhtalifūn",fr:"au sujet de laquelle ils sont en désaccord"},
    {n:4,ar:"كَلَّا سَيَعْلَمُونَ",tr:"Kallā sayaʿlamūn",fr:"Certes non ! Ils sauront bientôt"},
    {n:5,ar:"ثُمَّ كَلَّا سَيَعْلَمُونَ",tr:"Thumma kallā sayaʿlamūn",fr:"puis non ! Ils sauront vraiment"},
  ]},
  { number:87,  name:"Al-Aʿlā",   arabic:"الأعلى",  juz:30, level:4, verses:[
    {n:1,ar:"سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَى",tr:"Sabbiḥi sma rabbika l-aʿlā",fr:"Glorifie le nom de ton Seigneur, le Très-Haut"},
    {n:2,ar:"الَّذِي خَلَقَ فَسَوَّىٰ",tr:"Alladhī khalaqa fa-sawwā",fr:"qui a créé et harmonisé"},
    {n:3,ar:"وَالَّذِي قَدَّرَ فَهَدَىٰ",tr:"Wa-lladhī qaddara fa-hadā",fr:"et qui a déterminé et guidé"},
    {n:4,ar:"وَالَّذِي أَخْرَجَ الْمَرْعَىٰ",tr:"Wa-lladhī akhraja l-marʿā",fr:"et qui a fait sortir le pâturage"},
    {n:5,ar:"فَجَعَلَهُ غُثَاءً أَحْوَىٰ",tr:"Fa-jaʿalahu ghuthāʾan aḥwā",fr:"puis en a fait un débris noirâtre"},
    {n:6,ar:"سَنُقْرِئُكَ فَلَا تَنسَىٰ",tr:"Sa-nuqriʾuka fa-lā tansā",fr:"Nous te ferons réciter et tu n'oublieras pas"},
    {n:7,ar:"إِلَّا مَا شَاءَ اللَّهُ",tr:"Illā mā shāʾa llāh",fr:"sauf ce qu'Allah veut"},
  ]},
  { number:88,  name:"Al-Ghāshiya",arabic:"الغاشية",juz:30, level:4, verses:[
    {n:1,ar:"هَلْ أَتَاكَ حَدِيثُ الْغَاشِيَةِ",tr:"Hal atāka ḥadīthu l-ghāshiya",fr:"T'est-il parvenu le récit de l'Enveloppante ?"},
    {n:2,ar:"وُجُوهٌ يَوْمَئِذٍ خَاشِعَةٌ",tr:"Wujūhun yawmaʾidhin khāshiʿa",fr:"Des visages ce jour-là seront humiliés"},
    {n:3,ar:"عَامِلَةٌ نَّاصِبَةٌ",tr:"ʿĀmilatun nāṣiba",fr:"ayant peiné et s'étant fatiguées"},
    {n:4,ar:"تَصْلَىٰ نَارًا حَامِيَةً",tr:"Taṣlā nāran ḥāmiya",fr:"rôtissant dans un feu ardent"},
    {n:5,ar:"تُسْقَىٰ مِنْ عَيْنٍ آنِيَةٍ",tr:"Tusqā min ʿaynin āniya",fr:"abreuvées d'une source bouillante"},
  ]},
  { number:89,  name:"Al-Fajr",   arabic:"الفجر",   juz:30, level:4, verses:[
    {n:1,ar:"وَالْفَجْرِ",tr:"Wa-l-fajr",fr:"Par l'aurore !"},
    {n:2,ar:"وَلَيَالٍ عَشْرٍ",tr:"Wa-layālin ʿashr",fr:"Par les dix nuits !"},
    {n:3,ar:"وَالشَّفْعِ وَالْوَتْرِ",tr:"Wa-sh-shafʿi wa-l-watr",fr:"Par le pair et l'impair !"},
    {n:4,ar:"وَاللَّيْلِ إِذَا يَسْرِ",tr:"Wa-l-layli idhā yasr",fr:"Par la nuit quand elle s'en va !"},
    {n:5,ar:"هَلْ فِي ذَٰلِكَ قَسَمٌ لِّذِي حِجْرٍ",tr:"Hal fī dhālika qasamun li-dhī ḥijr",fr:"N'y a-t-il pas là un serment pour un doué de raison ?"},
  ]},
  // ── NIVEAU 5 : Juz 29-28 ───────────────────────────
  { number:67,  name:"Al-Mulk",   arabic:"الملك",   juz:29, level:5, verses:[
    {n:1,ar:"تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ",tr:"Tabāraka lladhī bi-yadihi l-mulk",fr:"Béni soit Celui en la main de qui est la royauté"},
    {n:2,ar:"وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",tr:"Wa-huwa ʿalā kulli shayʾin qadīr",fr:"et Il est Omnipotent"},
    {n:3,ar:"الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ",tr:"Alladhī khalaqa l-mawta wa-l-ḥayāh",fr:"Celui qui a créé la mort et la vie"},
    {n:4,ar:"لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا",tr:"Li-yabluwakum ayyukum aḥsanu ʿamalā",fr:"pour vous éprouver : lequel de vous fera le mieux"},
    {n:5,ar:"وَهُوَ الْعَزِيزُ الْغَفُورُ",tr:"Wa-huwa l-ʿazīzu l-ghafūr",fr:"Il est le Tout-Puissant, le Très Pardonneur"},
  ]},
  { number:55,  name:"Ar-Raḥmān", arabic:"الرحمان", juz:27, level:5, verses:[
    {n:1,ar:"الرَّحْمَانُ",tr:"Ar-raḥmān",fr:"Le Tout Miséricordieux"},
    {n:2,ar:"عَلَّمَ الْقُرْآنَ",tr:"ʿAllama l-qurʾān",fr:"a enseigné le Coran"},
    {n:3,ar:"خَلَقَ الْإِنسَانَ",tr:"Khalaqa l-insān",fr:"a créé l'être humain"},
    {n:4,ar:"عَلَّمَهُ الْبَيَانَ",tr:"ʿAllamahu l-bayān",fr:"lui a enseigné l'expression"},
    {n:13,ar:"فَبِأَيِّ آلَاءِ رَبِّكُمَا تُكَذِّبَانِ",tr:"Fa-bi-ayyi ālāʾi rabbikumā tukadhdhibān",fr:"Lequel donc des bienfaits de votre Seigneur nierez-vous ?"},
  ]},
  { number:36,  name:"Yā-Sīn",    arabic:"يس",      juz:22, level:5, verses:[
    {n:1,ar:"يس",tr:"Yā-Sīn",fr:"Yā-Sīn"},
    {n:2,ar:"وَالْقُرْآنِ الْحَكِيمِ",tr:"Wa-l-qurʾāni l-ḥakīm",fr:"Par le Coran plein de sagesse"},
    {n:3,ar:"إِنَّكَ لَمِنَ الْمُرْسَلِينَ",tr:"Innaka la-mina l-mursalīn",fr:"Tu es vraiment du nombre des envoyés"},
    {n:4,ar:"عَلَىٰ صِرَاطٍ مُّسْتَقِيمٍ",tr:"ʿAlā ṣirāṭin mustaqīm",fr:"sur un chemin droit"},
    {n:5,ar:"تَنزِيلَ الْعَزِيزِ الرَّحِيمِ",tr:"Tanzīla l-ʿazīzi r-raḥīm",fr:"révélation du Tout-Puissant, du Très Miséricordieux"},
  ]},
  // ── NIVEAU 6 : Grandes sourates ────────────────────
  { number:2,   name:"Al-Baqara (début)",arabic:"البقرة",juz:1, level:6, verses:[
    {n:1,ar:"الم",tr:"Alif-Lām-Mīm",fr:"Alif, Lām, Mīm"},
    {n:2,ar:"ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ هُدًى لِّلْمُتَّقِينَ",tr:"Dhālika l-kitābu lā rayba fīhi",fr:"C'est le Livre en lequel il n'y a aucun doute"},
    {n:3,ar:"الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ",tr:"Alladhīna yuʾminūna bi-l-ghayb",fr:"ceux qui croient à l'invisible et accomplissent la Salāt"},
    {n:255,ar:"اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",tr:"Allāhu lā ilāha illā huwa l-ḥayyu l-qayyūm",fr:"Allah ! Pas de divinité sinon Lui, le Vivant, le Subsistant"},
    {n:256,ar:"لَا إِكْرَاهَ فِي الدِّينِ",tr:"Lā ikrāha fī d-dīn",fr:"Point de contrainte en religion"},
    {n:257,ar:"قَدْ تَبَيَّنَ الرُّشْدُ مِنَ الْغَيِّ",tr:"Qad tabayyana r-rushdun mina l-ghayy",fr:"La bonne voie s'est distinguée de l'égarement"},
  ]},
  { number:18,  name:"Al-Kahf (début)",arabic:"الكهف",juz:15, level:6, verses:[
    {n:1,ar:"الْحَمْدُ لِلَّهِ الَّذِي أَنزَلَ عَلَىٰ عَبْدِهِ الْكِتَابَ",tr:"Al-ḥamdu lillāhi lladhī anzala ʿalā ʿabdihi l-kitāb",fr:"Louange à Allah qui a fait descendre le Livre à Son serviteur"},
    {n:2,ar:"قَيِّمًا لِّيُنذِرَ بَأْسًا شَدِيدًا مِّن لَّدُنْهُ",tr:"Qayyiman li-yundhira baʾsan shadīdan",fr:"sans déviation, pour mettre en garde contre une sévère punition"},
    {n:3,ar:"وَيُبَشِّرَ الْمُؤْمِنِينَ الَّذِينَ يَعْمَلُونَ الصَّالِحَاتِ",tr:"Wa-yubashshira l-muʾminīna",fr:"et annoncer la bonne nouvelle aux croyants"},
    {n:10,ar:"إِذْ أَوَى الْفِتْيَةُ إِلَى الْكَهْفِ فَقَالُوا رَبَّنَا آتِنَا مِن لَّدُنكَ رَحْمَةً",tr:"Idh awaā l-fityatu ilā l-kahf",fr:"Quand les jeunes gens se réfugièrent dans la caverne"},
  ]},
];

// Niveaux avec leurs labels
const LEVELS = [
  {id:1, label:"Niveau 1 — Incontournables", color:"#10b981", unlockAt:0},
  {id:2, label:"Niveau 2 — Courtes",         color:"#3b82f6", unlockAt:3},
  {id:3, label:"Niveau 3 — Juz 30",          color:"#8b5cf6", unlockAt:6},
  {id:4, label:"Niveau 4 — Juz 30 avancé",   color:"#f59e0b", unlockAt:9},
  {id:5, label:"Niveau 5 — Juz 27-29",       color:"#ef4444", unlockAt:12},
  {id:6, label:"Niveau 6 — Grandes sourates",color:"#ec4899", unlockAt:15},
];

// Pour compatibilité avec les autres tabs
const LEARN_SURAHS = ALL_SURAHS.filter(s => s.level <= 2);


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
      {title:"La Fatha — َ", ar:"بَ تَ نَ", tr:"ba — ta — na", text:"La fatha se place AU-DESSUS de la lettre. Elle donne le son 'a' court.", color:"#A16207"},
      {title:"La Kasra — ِ", ar:"بِ تِ نِ", tr:"bi — ti — ni", text:"La kasra se place EN-DESSOUS de la lettre. Elle donne le son 'i' court.", color:"#2563EB"},
      {title:"La Damma — ُ", ar:"بُ تُ نُ", tr:"bu — tu — nu", text:"La damma se place AU-DESSUS de la lettre. Elle donne le son 'u' court.", color:"#15803D"},
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
      {title:"Le Sukūn — ْ", ar:"بْ", tr:"b (silence)", text:"Le sukūn signifie que la lettre n'a PAS de voyelle. On coupe le son.", color:"#8A94A6"},
      {title:"La Shadda — ّ", ar:"بّ", tr:"bb (double)", text:"La shadda double la lettre. On la prononce avec emphase, comme 'bb' ou 'nn'.", color:"#B45309"},
      {title:"Exemple", ar:"إِنَّ", tr:"inna", text:"Le ن avec shadda = 'nn'. Très fréquent dans le Coran.", color:"#B45309"},
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
      {title:"Alif madd — ā", ar:"بَا", tr:"bā (long)", text:"Fatha + ا = son 'aa' long. Ex: اللهُ = Allāhu", color:"#2563EB"},
      {title:"Yā madd — ī", ar:"بِي", tr:"bī (long)", text:"Kasra + ي = son 'ii' long. Ex: فِي = fī (dans)", color:"#0E7490"},
      {title:"Wāw madd — ū", ar:"بُو", tr:"bū (long)", text:"Damma + و = son 'uu' long. Ex: رَسُولُ = rasūlu", color:"#1D4ED8"},
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
      {title:"Les lettres lunaires", ar:"الْقَمَرُ", tr:"al-qamaru", text:"Devant les 14 lettres LUNAIRES, le ل se prononce. Ex: الكِتَاب = al-kitāb", color:"#0E7490"},
      {title:"Les lettres solaires", ar:"الشَّمْسُ", tr:"ash-shamsu", text:"Devant les 14 lettres SOLAIRES, le ل s'assimile. Ex: الشَّمْس = ash-shams (pas 'al-shams')", color:"#B45309"},
      {title:"Astuce mémorisation", ar:"ت ث د ذ ر ز س ش ص ض ط ظ ل ن", tr:"les 14 solaires", text:"Toutes les lettres proches phonétiquement de la langue (dentales, sifflantes, latérales).", color:"#15803D"},
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
      {title:"Les 5 lettres de Qalqala", ar:"قَطْبٌ جَدٌّ", tr:"qaṭbun jaddun", text:"ق ط ب ج د — retenez le mot مَجِيد ou قَطَبَ جَد. Quand ces lettres portent un sukūn, elles produisent un écho vibrant.", color:"#B45309"},
      {title:"Exemple dans le Coran", ar:"قُلْ هُوَ اللَّهُ أَحَدٌ", tr:"Qul huwa llāhu aḥad", text:"Le ق dans قُلْ, le د dans أَحَدٌ — tous deux produisent la Qalqala.", color:"#B45309"},
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
      {title:"Ghunna = 2 temps nasaux", ar:"إِنَّ — ثُمَّ", tr:"inna — thumma", text:"Quand ن ou م portent une shadda, on nasalise 2 temps (environ 1 seconde). Comme 'inn...' ou 'umm...'.", color:"#15803D"},
      {title:"Ghunna dans le Coran", ar:"إِنَّا أَعْطَيْنَاكَ", tr:"innā aʿṭaynāka", text:"Le ن de إِنَّا se prononce avec un bourdonnement nasal de 2 temps avant le ā.", color:"#15803D"},
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
      {title:"بِسْمِ اللَّهِ", ar:"بِسْمِ اللَّهِ", tr:"Bismi llāhi", text:"Kasra sous ب → 'bi'. Sukūn sur س → 'sm'. Laam shamsiyya dans اللَّهِ → 'llāhi'.", color:"#2563EB"},
      {title:"الرَّحْمَٰنِ", ar:"الرَّحْمَٰنِ", tr:"ar-raḥmāni", text:"Laam solaire → 'ar'. SuperAlif sur ا → madd long 'ā'. Kasra finale → 'ni'.", color:"#B45309"},
      {title:"Révision complète", ar:"اللَّهُ أَكْبَرُ", tr:"Allāhu akbaru", text:"Laam shamsiyya + madd + fatha → 'Allāhu'. Qalqala sur ب → 'akbaru'.", color:"#15803D"},
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
import VOCAB from "./vocabData";
import { normalizeAr, calcScore, bestTranscript } from "./lib/arabic";
import { logActivity, startOfLocalDay } from "./lib/progress";
import WordsTab from "./components/WordsTab";
import LearnHub, { TOOLS } from "./components/LearnHub";
import PathLesson from "./components/PathLesson";
import { useVerseAudio, wordBounds, wordWeight, arabicWeight } from "./lib/verseAudio";
import { diagnose, diagnosisSentence } from "./lib/diagnosis";
import { markVerseLearned, getMemorized, MEMO_THRESHOLD } from "./lib/memorize";
import SurahPicker from "./components/SurahPicker";

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
  // « Oublié » : revient dans 10 min. Sinon : dû au début de la journée locale J+interval
  // (un mot révisé le soir revient le matin prévu, pas à la même heure).
  const nextReview = interval === 0
    ? now + 10 * 60000
    : startOfLocalDay(new Date(now + interval * 86400000));
  return { interval, ease, reps, nextReview, lastQuality: quality };
}

const NEW_PER_SESSION = 8;

function getDueCards(cards) {
  const now = Date.now();
  // 1. les mots déjà vus et arrivés à échéance (les plus en retard d'abord)
  const due = VOCAB.filter(w => cards[w.id]?.reps > 0 && cards[w.id].nextReview <= now)
    .sort((a, b) => cards[a.id].nextReview - cards[b.id].nextReview);
  // 2. complétés par des mots nouveaux, dans l'ordre de fréquence du Coran
  // les nouveaux mots arrivent par le parcours (leçons de 5) ; ici seulement s'il n'a pas commencé
  const pathStarted = Object.keys(ls("path_progress_v1", { done: {} }).done || {}).length > 0;
  const room = pathStarted ? 0 : Math.max(0, 15 - due.length);
  const fresh = VOCAB.filter(w => !(cards[w.id]?.reps > 0) && (!cards[w.id] || cards[w.id].nextReview <= now))
    .sort((a, b) => (b.freq || 0) - (a.freq || 0))
    .slice(0, Math.min(room, NEW_PER_SESSION));
  return [...due.slice(0, 15), ...fresh];
}

// ═══════════════════════════════════════════════════════
// AUDIO — everyayah.com (standard apps Coran, fichiers par verset)
// ═══════════════════════════════════════════════════════
const TTS_READY = typeof window !== "undefined" && "speechSynthesis" in window;

const LEARN_RECITERS = [
  { id:"alafasy", name:"Alafasy",   url: n => `https://server8.mp3quran.net/afs/${n}.mp3` },
  { id:"sudais",  name:"Al-Sudais", url: n => `https://server11.mp3quran.net/sds/${n}.mp3` },
  { id:"ghamdi",  name:"Al-Ghamdi", url: n => `https://server7.mp3quran.net/s_gmd/${n}.mp3` },
  { id:"husary",  name:"Al-Husary", url: n => `https://server13.mp3quran.net/husr/${n}.mp3` },
  { id:"dosari",  name:"Al-Dosari", url: n => `https://server11.mp3quran.net/yasser/${n}.mp3` },
];

const p3ls = n => String(n).padStart(3, "0");
// URL sourate complète
const learnUrl = (rec, surahNum) => rec.url(p3ls(surahNum));

const AUDIO_CDNS = [
  (s,v) => `https://server8.mp3quran.net/afs/${p3ls(s)}.mp3`,
];

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

function getVerseText(surahNum, verseNum) {
  const surah = LEARN_SURAHS.find(s => s.number === surahNum);
  const verse = surah?.verses.find(v => v.n === verseNum);
  return verse?.ar || "";
}

function useAudio() {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(null);
  const [loading, setLoading] = useState(null);

  const stop = useCallback(() => {
    if (ref.current) {
      ref.current.onended = null; ref.current.onerror = null;
      ref.current.pause(); ref.current = null;
    }
    if (TTS_READY) window.speechSynthesis.cancel();
    setPlaying(null); setLoading(null);
  }, []);

  // Tente chaque CDN en séquence, TTS seulement si tous échouent
  const tryPlay = useCallback((surah, verse, key, cdnIdx, onDone) => {
    if (cdnIdx >= AUDIO_CDNS.length) {
      setLoading(null);
      const text = getVerseText(surah, verse);
      if (TTS_READY && text) {
        setPlaying(key);
        speakArabicTTS(text, 0.65, () => { setPlaying(null); onDone && onDone(); });
      } else { setPlaying(null); onDone && onDone(); }
      return;
    }
    const url = AUDIO_CDNS[cdnIdx](surah, verse);
    if (ref.current) { ref.current.onended=null; ref.current.onerror=null; ref.current.pause(); }
    const a = new Audio();
    ref.current = a;
    if (cdnIdx === 0) setLoading(key);
    let done = false;
    const fail = () => { if(done) return; done=true; setLoading(null); tryPlay(surah, verse, key, cdnIdx+1, onDone); };
    const succeed = () => { setLoading(null); setPlaying(key); };
    const ended = () => { setPlaying(null); onDone && onDone(); };
    const timeout = setTimeout(() => { a.play().then(succeed).catch(fail); }, 200);
    a.oncanplaythrough = () => { clearTimeout(timeout); a.play().then(succeed).catch(fail); };
    a.onended = ended;
    a.onerror = fail;
    a.src = url;
    a.preload = "auto";
    a.load();
  }, []);

  const playVerse = useCallback((surah, verse) => {
    const key = `${surah}:${verse}`;
    if (playing === key) { stop(); return; }
    stop();
    tryPlay(surah, verse, key, 0, null);
  }, [playing, stop, tryPlay]);

  const playSurah = useCallback((surah, verses) => {
    stop();
    let i = 0;
    const next = () => {
      if (i >= verses.length) { setPlaying(null); return; }
      const v = verses[i++];
      tryPlay(surah, v.n, `${surah}:${v.n}`, 0, next);
    };
    next();
  }, [stop, tryPlay]);

  useEffect(() => () => stop(), []);
  return { playing, loading, playVerse, playSurah, stop };
}

function speakLetter(text) { speakArabicTTS(text, 0.5); }
function speakFeedback(text, lang = "fr-FR", onEnd) {
  if (!TTS_READY) { setTimeout(() => onEnd && onEnd(), 300); return; }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang; u.rate = 0.9;
  u.onend = () => { setTimeout(() => onEnd && onEnd(), 600); };
  u.onerror = () => { setTimeout(() => onEnd && onEnd(), 600); };
  window.speechSynthesis.speak(u);
}

// ═══════════════════════════════════════════════════════
// COMPOSANT — Tab Sourates
// ═══════════════════════════════════════════════════════
// ── SuratesTab — AudioContext + proxy /api/audio (même approche que QuranReader)
const SURAH_OFF_LS = [0,7,293,493,669,789,954,1160,1235,1364,1473,1596,1707,1750,1802,1901,2029,2140,2250,2348,2483,2595,2673,2791,2855,2932,3159,3252,3340,3409,3469,3503,3533,3606,3660,3705,3788,3970,4058,4133,4218,4272,4325,4414,4473,4510,4545,4583,4612,4630,4675,4735,4784,4846,4901,4979,5075,5104,5126,5150,5163,5177,5188,5199,5217,5229,5241,5271,5323,5375,5419,5447,5475,5495,5551,5591,5622,5672,5712,5758,5800,5829,5848,5884,5909,5931,5948,5967,5993,6023,6043,6058,6079,6090,6098,6106,6125,6130,6138,6146,6157,6168,6176,6179,6188,6193,6197,6204,6207,6213,6216,6221,6225,6230,6236];
const gvLS = (s, v) => SURAH_OFF_LS[s - 1] + v;

const LS_RECITERS = [
  { id:"alafasy", name:"Alafasy",   slug:"ar.alafasy" },
  { id:"husary",  name:"Al-Husary", slug:"ar.husary" },
  { id:"sudais",  name:"Al-Sudais", slug:"ar.abdurrahmaansudais" },
  { id:"ghamdi",  name:"Al-Ghamdi", slug:"ar.saoodshuraym" },
  { id:"minshawi",name:"Al-Minshawi",slug:"ar.minshawi" },
];

function SuratesTab() {
  const [open, setOpen] = useState(null);
  const [showTr, setShowTr] = useState(true);
  const [showFr, setShowFr] = useState(false);
  const [mastered, setMastered] = useState(() => ls("mastered_surahs", []));
  const [reciterId, setReciterId] = useState("alafasy");
  const [showPicker, setShowPicker] = useState(false);
  const [playingSurah, setPlayingSurah] = useState(null);
  const [audioStatus, setAudioStatus] = useState("idle"); // idle|loading|playing|paused
  const [speed, setSpeed] = useState(1.0);
  const audio = useAudio();

  const ctxRef = useRef(null);
  const srcRef = useRef(null);
  const stopRef = useRef(false);

  const masteredCount = mastered.length;
  const reciter = LS_RECITERS.find(r => r.id === reciterId) || LS_RECITERS[0];
  const doReset = () => { if (!window.confirm("Réinitialiser toute la progression ?")) return; setMastered([]); lsSet("mastered_surahs", []); stopAudio(); setOpen(null); };

  const getCtx = () => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  };

  const stopAudio = () => {
    stopRef.current = true;
    if (srcRef.current) { try { srcRef.current.stop(); } catch(e) {} srcRef.current = null; }
    setAudioStatus("idle"); setPlayingSurah(null);
  };

  const playVerseChain = (rec, surahObj, verseIdx) => {
    if (stopRef.current || verseIdx >= surahObj.verses.length) {
      setAudioStatus("idle"); setPlayingSurah(null); return;
    }
    const v = surahObj.verses[verseIdx];
    const proxyUrl = window.location.origin + "/api/audio?slug=" + rec.slug + "&v=" + gvLS(surahObj.number, v.n);
    setAudioStatus("loading");

    // XMLHttpRequest bypasse le service worker (contrairement à fetch)
    const xhr = new XMLHttpRequest();
    xhr.open("GET", proxyUrl, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = () => {
      if (stopRef.current) return;
      if (xhr.status !== 200) { setAudioStatus("idle"); setPlayingSurah(null); alert("HTTP " + xhr.status); return; }
      try {
        const ctx = getCtx();
        ctx.decodeAudioData(xhr.response, (audioBuf) => {
          if (stopRef.current) return;
          const src = ctx.createBufferSource();
          src.buffer = audioBuf;
          src.playbackRate.value = speed;
          src.connect(ctx.destination);
          src.onended = () => { if (!stopRef.current) playVerseChain(rec, surahObj, verseIdx + 1); };
          if (srcRef.current) { try { srcRef.current.stop(); } catch(e2) {} }
          srcRef.current = src;
          src.start(0);
          setAudioStatus("playing"); setPlayingSurah(surahObj.number);
        }, (e) => { if (!stopRef.current) { setAudioStatus("idle"); alert("Decode: " + e.message); } });
      } catch(e) { if (!stopRef.current) { setAudioStatus("idle"); alert("Ctx: " + e.message); } }
    };
    xhr.onerror = () => { if (!stopRef.current) { setAudioStatus("idle"); setPlayingSurah(null); alert("Réseau: vérifi ta connexion"); } };
    xhr.send();
  };

  const handlePlay = (surah) => {
    try { getCtx().resume(); } catch(e) {}
    stopRef.current = false;
    playVerseChain(reciter, surah, 0);
  };

  const handlePause = () => {
    stopRef.current = true;
    if (srcRef.current) { try { srcRef.current.stop(); } catch(e) {} srcRef.current = null; }
    if (ctxRef.current) ctxRef.current.suspend();
    setAudioStatus("paused");
  };

  const handleStop = () => stopAudio();

  const handleSpeed = (v) => {
    setSpeed(v);
    if (srcRef.current) srcRef.current.playbackRate.value = v;
  };

  const markMastered = (n) => {
    const next = mastered.includes(n) ? mastered.filter(x => x !== n) : [...mastered, n];
    setMastered(next); lsSet("mastered_surahs", next);
  };
  const isUnlocked = (level) => masteredCount >= (LEVELS.find(l => l.id === level)?.unlockAt || 0);

  return (
    <div className="space-y-4">
      {/* Progression */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-encre font-bold text-sm">Progression sourates</p>
          <span className="text-emerald-700 font-bold text-sm">{masteredCount}/{ALL_SURAHS.length}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
            animate={{width:`${Math.round((masteredCount/ALL_SURAHS.length)*100)}%`}} transition={{duration:0.5}}/>
        </div>
        <p className="text-slate-400 text-xs mt-1.5">Marque une sourate ✅ pour déverrouiller le niveau suivant</p>
        <div style={{textAlign:"right",marginTop:"6px"}}><button onClick={doReset} style={{background:"none",border:"1px solid rgba(15,23,42,0.12)",borderRadius:"8px",padding:"5px 12px",color:"#64748b",fontSize:"0.7rem",cursor:"pointer"}}>🔄 Réinitialiser</button></div>
      </div>

      {/* Niveaux */}
      {LEVELS.map(lvl => {
        const unlocked = isUnlocked(lvl.id);
        const lvlSurahs = ALL_SURAHS.filter(s => s.level === lvl.id);
        const lvlMastered = lvlSurahs.filter(s => mastered.includes(s.number)).length;
        return (
          <div key={lvl.id}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm"
                style={{background:unlocked?"#059669":"rgba(15,23,42,0.08)",color:unlocked?"white":"#64748b"}}>
                {lvl.id}
              </div>
              <div className="flex-1">
                <p className="text-encre font-bold text-sm">{lvl.label}</p>
                <p className="text-slate-400 text-xs">{lvlMastered}/{lvlSurahs.length} maîtrisées</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {lvlSurahs.map(surah => {
                const isOpen    = open === surah.number;
                const isMastered = mastered.includes(surah.number);
                const isActive  = playingSurah === surah.number;
                return (
                  <div key={surah.number} className={`rounded-2xl border overflow-hidden transition-all ${
                    !unlocked ? "opacity-35 pointer-events-none" :
                    isMastered ? "border-emerald-500/30 bg-emerald-50" :
                    isOpen ? "border-slate-300 bg-slate-50" : "border-slate-200 bg-slate-50"
                  }`}>
                    <button className="w-full flex items-center gap-3 p-3.5 text-left"
                      onClick={() => unlocked && setOpen(isOpen ? null : surah.number)}>
                      <div className="w-10 h-10 rounded-xl flex flex-col items-center justify-center shrink-0"
                        style={{background:"rgba(15,23,42,0.08)"}}>
                        <span className="text-encre font-black text-sm leading-none">{surah.number}</span>
                        <span className="text-slate-400 text-[9px]">J.{surah.juz}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-encre font-bold text-sm">{surah.name}</p>
                        <p className="text-slate-400 text-xs">{surah.verses.length} versets</p>
                      </div>
                      {isMastered && <span className="text-emerald-700 text-lg shrink-0">✅</span>}
                      <p className="font-serif text-slate-500 text-xl shrink-0" dir="rtl">{surah.arabic}</p>
                      <span className="text-slate-400 text-xs shrink-0">{isOpen ? "▲" : "▼"}</span>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}}
                          exit={{height:0,opacity:0}} className="overflow-hidden">

                          {/* Lecteur audio */}
                          <div className="px-4 pt-2 pb-3 space-y-2">
                            {/* Récitateur */}
                            <div style={{position:"relative",display:"inline-block"}}>
                              <button onClick={()=>setShowPicker(p=>!p)}
                                style={{background:"rgba(15,23,42,0.12)",border:"1px solid rgba(15,23,42,0.12)",borderRadius:"10px",padding:"6px 10px",color:"#1A1A1A",fontSize:"0.75rem",fontWeight:"bold",cursor:"pointer"}}>
                                🎙️ {reciter.name} ▾
                              </button>
                              {showPicker && <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,zIndex:40}} onClick={()=>setShowPicker(false)}/>}
                              {showPicker && (
                                <div style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:50,background:"#ffffff",border:"1px solid rgba(15,23,42,0.12)",borderRadius:"12px",padding:"6px",minWidth:"175px",boxShadow:"0 8px 32px rgba(0,0,0,0.7)"}}>
                                  <p style={{color:"#64748b",fontSize:"0.65rem",fontWeight:"bold",padding:"3px 10px 5px",borderBottom:"1px solid rgba(15,23,42,0.08)",marginBottom:"4px"}}>Récitateur</p>
                                  {LS_RECITERS.map(r => (
                                    <button key={r.id} onClick={()=>{setReciterId(r.id);setShowPicker(false);stopAudio();}}
                                      style={{display:"block",width:"100%",textAlign:"left",padding:"8px 10px",borderRadius:"8px",border:"none",background:r.id===reciterId?"rgba(16,185,129,0.2)":"transparent",color:r.id===reciterId?"#047857":"#1A1A1A",fontSize:"0.82rem",fontWeight:"bold",cursor:"pointer"}}>
                                      {r.id===reciterId?"▶ ":"   "}{r.name}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Statut */}
                            {isActive && audioStatus !== "idle" && (
                              <p style={{color:"#64748b",fontSize:"0.7rem",fontStyle:"italic",margin:0}}>
                                {audioStatus==="loading"?"⏳ Chargement…":audioStatus==="playing"?"▶ En lecture…":"⏸ En pause"}
                              </p>
                            )}

                            {/* Boutons */}
                            <div style={{display:"flex",gap:"5px"}}>
                              <button onClick={()=>handlePlay(surah)}
                                style={{flex:1,padding:"8px 4px",borderRadius:"10px",border:"none",background:"#059669",color:"#1A1A1A",fontWeight:"bold",fontSize:"0.8rem",cursor:"pointer",opacity:(isActive&&audioStatus==="playing")?0.55:1}}>
                                ▶ PLAY
                              </button>
                              <button onClick={handlePause}
                                style={{flex:1,padding:"8px 4px",borderRadius:"10px",border:"none",background:"#d97706",color:"#1A1A1A",fontWeight:"bold",fontSize:"0.8rem",cursor:"pointer",opacity:(isActive&&audioStatus==="playing")?1:0.4}}>
                                ⏸ PAUSE
                              </button>
                              <button onClick={handleStop}
                                style={{flex:1,padding:"8px 4px",borderRadius:"10px",border:"none",background:"#dc2626",color:"#1A1A1A",fontWeight:"bold",fontSize:"0.8rem",cursor:"pointer",opacity:isActive?1:0.4}}>
                                ⏹ STOP
                              </button>
                            </div>

                            {/* Vitesse */}
                            <div style={{background:"rgba(15,23,42,0.05)",borderRadius:"10px",padding:"7px 10px",display:"flex",alignItems:"center",gap:"8px"}}>
                              <span style={{color:"#64748b",fontSize:"0.7rem",whiteSpace:"nowrap"}}>Vitesse : <strong style={{color:"#1A1A1A"}}>{speed.toFixed(1)}x</strong></span>
                              <input type="range" min="0.5" max="2.0" step="0.1" value={speed}
                                onChange={e=>handleSpeed(parseFloat(e.target.value))}
                                style={{flex:1,accentColor:"#10b981"}}/>
                            </div>

                            {/* Contrôles affichage */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <button onClick={()=>setShowTr(s=>!s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showTr?"bg-blue-500/20 text-blue-700 border border-blue-500/30":"bg-slate-50 text-slate-400"}`}>ABC</button>
                              <button onClick={()=>setShowFr(s=>!s)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${showFr?"bg-purple-500/20 text-purple-700 border border-purple-500/30":"bg-slate-50 text-slate-400"}`}>FR</button>
                              <button onClick={()=>markMastered(surah.number)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ml-auto ${isMastered?"bg-emerald-500/20 text-emerald-700 border border-emerald-500/30":"bg-slate-50 text-slate-400 border border-slate-200"}`}>
                                {isMastered ? "✅ Maîtrisée" : "Marquer maîtrisée"}
                              </button>
                            </div>
                          </div>

                          {/* Légende tajweed */}
                          <div className="px-4 pb-3 flex flex-wrap gap-1">
                            {[["#B45309","Qalqala"],["#2563EB","Madd"],["#15803D","Ghunna"],["#BE185D","Ikhfāʾ"],["#8A94A6","Silence"]].map(([color,label])=>(
                              <span key={label} className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full" style={{background:color}}/><span className="text-slate-400">{label}</span>
                              </span>
                            ))}
                          </div>

                          {/* Versets */}
                          <div className="space-y-2 px-4 pb-5">
                            {surah.verses.map((v,i) => (
                              <motion.div key={v.n} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                                className={`p-4 rounded-2xl border ${audio.playing===`${surah.number}:${v.n}`?"bg-emerald-50 border-emerald-500/25":"bg-slate-50 border-slate-200"}`}>
                                <div className="flex items-start gap-3 mb-1">
                                  <button onClick={()=>{ if(audio.playing===`${surah.number}:${v.n}`){audio.stop();return;} audio.playVerse(surah.number,v.n); }}
                                    style={{width:"32px",height:"32px",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:"4px",fontWeight:"bold",fontSize:"0.75rem",cursor:"pointer",border:"none",transition:"all 0.2s",
                                      background:audio.playing===`${surah.number}:${v.n}`?"#10b981":"rgba(16,185,129,0.15)",
                                      color:audio.playing===`${surah.number}:${v.n}`?"white":"#047857"}}>
                                    {audio.playing===`${surah.number}:${v.n}`?"⏸":v.n}
                                  </button>
                                  <div className="flex-1 text-right" style={{lineHeight:"3"}}>
                                    <p dir="rtl" lang="ar" style={{fontFamily:"'Amiri Quran','Scheherazade New',serif",fontSize:"clamp(1.1rem,3.5vw,1.5rem)",color:"#1A1A1A"}}
                                      dangerouslySetInnerHTML={{__html: v.tajweed || v.ar}}/>
                                  </div>
                                </div>
                                {showTr && v.tr && <p className="text-blue-700 text-xs italic mt-1 text-right">{v.tr}</p>}
                                {showFr && v.fr && <p className="text-slate-500 text-xs italic mt-1">{v.fr}</p>}
                              </motion.div>
                            ))}
                          </div>

                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AlphabetTab() {
  const [sel, setSel] = useState(null);
  const doReset = () => { setSel(null); };
  const rows = [];
  for (let i = 0; i < ALPHABET.length; i += 4) rows.push(ALPHABET.slice(i, i+4));
  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 border border-blue-500/20 rounded-2xl flex items-center justify-between">
        <p className="text-blue-700 font-bold text-sm">الحروف الهجائية — 28 lettres</p><button onClick={doReset} style={{background:"none",border:"1px solid rgba(15,23,42,0.12)",borderRadius:"8px",padding:"5px 12px",color:"#64748b",fontSize:"0.7rem",cursor:"pointer"}}>🔄 Réinitialiser</button>
        <p className="text-slate-500 text-xs">Appuie sur une lettre pour voir ses 4 formes. <span className="text-emerald-700">Vert = solaire</span> · <span className="text-blue-700">Bleu = lunaire</span></p>
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
                    l.group === "solaire" ? "bg-emerald-50 border-emerald-700/40" :
                    "bg-slate-100 border-slate-300"
                  }`}>
                  <p className="text-2xl font-serif" style={{color:"#1A1A1A"}} dir="rtl">{l.ar}</p>
                  <p className="text-[10px] mt-0.5" style={{color: l.group==="solaire" ? "#047857" : "#1D4ED8"}}>{l.name}</p>
                </button>
              ))}
            </div>
            <AnimatePresence>
              {selInRow && (
                <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}} className="overflow-hidden mb-2">
                  <div className="p-4 bg-blue-50 border border-blue-500/30 rounded-2xl">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-16 h-16 rounded-2xl bg-blue-600/40 border border-blue-400/50 flex items-center justify-center">
                        <span className="text-4xl font-serif" style={{color:"#1A1A1A"}}>{sel.ar}</span>
                      </div>
                      <div>
                        <p className="font-black text-xl" style={{color:"#1A1A1A"}}>{sel.name}</p>
                        <p className="text-blue-700 text-sm font-bold">{sel.sound}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sel.group==="solaire" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>{sel.group}</span>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => speakArabic(sel.ar, 0.4)}
                            style={{background:"rgba(59,130,246,0.2)",border:"1px solid rgba(96,165,250,0.4)",borderRadius:"8px",padding:"4px 10px",color:"#1d4ed8",fontSize:"0.75rem",cursor:"pointer"}}>
                            🔊 Lettre
                          </button>
                          <button onClick={() => speakFeedback(`${sel.name}. Son : ${sel.sound}`, "fr-FR")}
                            style={{background:"rgba(139,92,246,0.2)",border:"1px solid rgba(167,139,250,0.4)",borderRadius:"8px",padding:"4px 10px",color:"#6d28d9",fontSize:"0.75rem",cursor:"pointer"}}>
                            🧑‍🏫 Explication
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[{label:"Isolée",text:sel.i},{label:"Initiale",text:sel.ini},{label:"Médiane",text:sel.med},{label:"Finale",text:sel.fin}].map(f => (
                        <div key={f.label} className="bg-slate-100 rounded-xl p-2.5 text-center border border-slate-300">
                          <p className="text-[10px] text-slate-500 mb-1">{f.label}</p>
                          <p className="text-2xl font-serif" style={{color:"#1A1A1A"}} dir="rtl">{f.text}</p>
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
  {cls:"qalaqah",      color:"#B45309", label:"Qalqala",         desc:"Écho vibrant — ق ط ب ج د avec sukūn"},
  {cls:"madda_normal", color:"#2563EB", label:"Madd normal",     desc:"Extension 2 temps — après voyelle longue"},
  {cls:"madda_permissible",color:"#0E7490",label:"Madd permissible",desc:"Extension 2, 4 ou 6 temps selon la récitation"},
  {cls:"madda_necessary",  color:"#2B4FBB",label:"Madd nécessaire", desc:"Extension obligatoire 6 temps"},
  {cls:"ghunnah",      color:"#15803D", label:"Ghunna",          desc:"Nasalisation 2 temps — ن ou م avec shadda"},
  {cls:"idgham_ghunnah",color:"#15803D",label:"Idghām + Ghunna", desc:"Assimilation nasale — ني رم وأ"},
  {cls:"idgham_wo_ghunnah",color:"#2E8B57",label:"Idghām sans Ghunna",desc:"Assimilation — ل et ر"},
  {cls:"ikhafa",       color:"#BE185D", label:"Ikhfāʾ",          desc:"Dissimulation nasale — نون + 15 lettres"},
  {cls:"iqlab",        color:"#C2410C", label:"Iqlāb",           desc:"Transformation — نون → ميم devant ب"},
  {cls:"ham_wasl",     color:"#8A94A6", label:"Hamza Wasla",     desc:"Hamza de liaison — disparaît en continuité"},
  {cls:"laam_shamsiyya",color:"#8A94A6",label:"Laam Shamsiyya",  desc:"Laam assimilé — ال devant 14 lettres solaires"},
  {cls:"slnt",         color:"#475569", label:"Lettre silencieuse",desc:"Ne se prononce pas dans la récitation"},
];

function TajweedTab() {
  const [sel, setSel] = useState(null);
  const doReset = () => setSel(null);
  const TAJWEED_EXAMPLES = {
    qalaqah:"قُلْ هُوَ اللَّهُ أَحَدٌ", madda_normal:"الرَّحْمَٰنِ الرَّحِيمِ",
    madda_permissible:"مَالِكِ يَوْمِ الدِّينِ", madda_necessary:"آلْآنَ",
    ghunnah:"إِنَّ اللَّهَ", idgham_ghunnah:"مِن نَّفْسٍ", idgham_wo_ghunnah:"مِن رَّبِّكَ",
    ikhafa:"مِن قَبْلِ", iqlab:"مِن بَعْدِ", ham_wasl:"اللَّهُ", laam_shamsiyya:"الرَّحِيمِ", slnt:"بِسْمِ",
  };
  return (
    <div className="space-y-3">
      <div className="p-4 bg-emerald-50 border border-emerald-500/15 rounded-2xl">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><p className="text-emerald-700 font-bold text-sm">🎨 Les règles du Tajweed</p><button onClick={doReset} style={{background:"none",border:"1px solid rgba(15,23,42,0.12)",borderRadius:"8px",padding:"5px 12px",color:"#64748b",fontSize:"0.7rem",cursor:"pointer"}}>🔄 Réinitialiser</button></div>
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
          className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${sel === t.cls ? "border-slate-300 bg-slate-100" : "border-slate-200 bg-slate-50"}`}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:`${t.color}25`,border:`1px solid ${t.color}50`}}>
            <div className="w-4 h-4 rounded-full" style={{background:t.color}}/>
          </div>
          <div className="flex-1 text-left">
            <p className="text-encre font-semibold text-sm">{t.label}</p>
            <AnimatePresence>
              {sel === t.cls && (
                <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
                  <p className="text-slate-500 text-xs mt-1">{t.desc}</p>
                  {TAJWEED_EXAMPLES[t.cls] && (
                    <div className="flex items-center gap-2 mt-2">
                      <p className="font-serif text-base" style={{color:t.color}} dir="rtl">{TAJWEED_EXAMPLES[t.cls]}</p>
                      <button onClick={e=>{e.stopPropagation();speakArabic(TAJWEED_EXAMPLES[t.cls],0.45);}}
                        style={{background:"rgba(15,23,42,0.08)",border:"1px solid rgba(15,23,42,0.12)",borderRadius:"8px",padding:"2px 8px",color:"#64748b",fontSize:"0.7rem",cursor:"pointer"}}>
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
      <div className="p-4 bg-purple-50 border border-purple-500/15 rounded-2xl">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><p className="text-purple-700 font-bold text-sm">التشكيل — Les voyelles</p><button onClick={doReset} style={{background:"none",border:"1px solid rgba(15,23,42,0.12)",borderRadius:"8px",padding:"5px 12px",color:"#64748b",fontSize:"0.7rem",cursor:"pointer"}}>🔄 Réinitialiser</button></div>
        <p className="text-slate-500 text-xs">Appuie sur chaque voyelle → le professeur explique et prononce l'exemple.</p>
      </div>
      {HARAKAT.map((h,i) => (
        <motion.button key={h.name} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
          onClick={() => {
            speakFeedback(`${h.name}. ${h.sound}.`, "fr-FR");
            setTimeout(() => speakArabic(h.example, 0.4), 1500);
          }}
          className="w-full flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl active:bg-slate-100 transition-all text-left">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-500/25 flex items-center justify-center shrink-0">
            <span className="text-3xl font-serif" style={{color:"#1A1A1A"}} dir="rtl">{h.example}</span>
          </div>
          <div className="flex-1">
            <p className="text-encre font-bold text-sm">{h.name}</p>
            <p className="text-purple-700 text-xs">{h.sound}</p>
            <p className="text-slate-400 text-xs">→ <span className="text-slate-700 font-semibold">{h.tr}</span></p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-4xl font-serif text-slate-500">{h.symbol}</span>
            <p className="text-slate-400 text-[9px] mt-1">🔊 tap</p>
          </div>
        </motion.button>
      ))}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <p className="text-encre font-bold text-sm">Exemple complet</p>
          <button onClick={() => { speakFeedback("Bismi llāhi", "fr-FR"); setTimeout(()=>speakArabic("بِسْمِ اللَّهِ",0.45),1200); }}
            style={{background:"rgba(139,92,246,0.2)",border:"1px solid rgba(167,139,250,0.3)",borderRadius:"8px",padding:"4px 12px",color:"#6d28d9",fontSize:"0.75rem",cursor:"pointer"}}>
            🧑‍🏫 Écouter
          </button>
        </div>
        <div className="text-center py-3">
          <LetterByLetter text="بِسْمِ اللَّهِ" size="2rem"/>
        </div>
        <p className="text-blue-700 text-xs text-center italic">Bismi llāh — kasra · sukūn · kasra · madd</p>
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
  const doReset = () => { setCurrent(null); lsSet("lessons_progress", {}); window.location.reload(); };
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
      logActivity("lessons");
      setPhase("done");
    }
  };

  if (!current) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-amber-50 border border-amber-500/20 rounded-2xl">
          <p className="text-amber-700 font-bold text-sm mb-1">📚 Leçons progressives</p>
          <p className="text-slate-500 text-xs">7 leçons basées sur la méthode Al-Azhar. Chaque leçon = théorie + exercices. Complète-les dans l'ordre.</p>
        </div>
        {LESSONS.map((lesson, i) => {
          const done = progress[lesson.id];
          const locked = i > 0 && !progress[LESSONS[i-1].id];
          return (
            <motion.button key={lesson.id} disabled={locked}
              onClick={() => !locked && startLesson(lesson)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                locked ? "border-slate-200 bg-slate-50 opacity-40" :
                done   ? "border-emerald-500/30 bg-emerald-50" :
                         "border-amber-500/20 bg-amber-50 hover:border-amber-500/40"
              }`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${locked ? "bg-slate-50" : done ? "bg-emerald-500/20" : "bg-amber-500/15"}`}>
                {locked ? "🔒" : done ? "✅" : lesson.emoji}
              </div>
              <div className="flex-1">
                <p className={`font-bold text-sm ${locked ? "text-slate-400" : "text-encre"}`}>Leçon {lesson.id} — {lesson.title}</p>
                <p className={`text-xs mt-0.5 ${locked ? "text-slate-700" : "text-slate-500"}`}>{lesson.desc}</p>
                {done && <p className="text-xs text-emerald-700 mt-0.5">Score : {done.score}/{done.total}</p>}
              </div>
              {!locked && !done && <span className="text-xs text-amber-700 shrink-0">{lesson.duration}</span>}
              {!locked && <ChevronRight className="w-4 h-4 text-slate-400 shrink-0"/>}
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
        <p className="text-encre font-black text-2xl">Leçon {current.id} terminée !</p>
        <div className="flex items-center gap-3">
          {Array.from({length: current.exercise.length}).map((_,i) => (
            <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${i < score ? "bg-emerald-500" : "bg-slate-100"}`}>
              {i < score ? "✓" : "✗"}
            </div>
          ))}
        </div>
        <p className="text-emerald-700 font-bold text-lg">{score}/{current.exercise.length} bonnes réponses</p>
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
          <button onClick={() => setCurrent(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"><ChevronRight className="w-5 h-5 rotate-180"/></button>
          <p className="text-encre font-bold">Leçon {current.id} · {current.title}</p>
          <span className="ml-auto text-xs text-slate-500">{theoryIdx+1}/{current.theory.length}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div className="h-full bg-amber-500 rounded-full" animate={{width:`${((theoryIdx+1)/current.theory.length)*100}%`}}/>
        </div>
        <motion.div key={theoryIdx} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="space-y-4">
          <div className="p-5 rounded-3xl border border-slate-200" style={{background:`${step.color}15`,borderColor:`${step.color}30`}}>
            <p className="font-bold text-encre text-base mb-4">{step.title}</p>
            <div className="text-center mb-4">
              <LetterByLetter text={step.ar} size="2.5rem"/>
            </div>
            <p className="text-blue-700 text-sm italic text-center mb-3">{step.tr}</p>
            <p className="text-slate-700 text-sm leading-relaxed bg-slate-900/10 rounded-2xl p-4">{step.text}</p>
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
        <button onClick={() => setCurrent(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"><ChevronRight className="w-5 h-5 rotate-180"/></button>
        <p className="text-encre font-bold">Exercice {exerciseIdx+1}/{current.exercise.length}</p>
        <span className="ml-auto text-emerald-700 font-bold text-sm">{score} ✓</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div className="h-full bg-emerald-500 rounded-full" animate={{width:`${(exerciseIdx/current.exercise.length)*100}%`}}/>
      </div>
      <p className="text-slate-500 text-sm text-center">Comment se prononce ce texte ?</p>
      <div className="py-8 text-center bg-slate-50 border border-slate-200 rounded-3xl">
        <LetterByLetter text={ex.ar} size="3rem"/>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ex.options.map(opt => {
          const isCorrect = opt === ex.correct;
          const isSelected = opt === selected;
          let cls = "bg-slate-50 border-slate-300 text-encre";
          if (answered && isCorrect) cls = "bg-emerald-500/30 border-emerald-500 text-emerald-700";
          else if (answered && isSelected && !isCorrect) cls = "bg-red-500/30 border-red-500 text-red-700";
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
          <p className={`text-center font-bold ${selected === ex.correct ? "text-emerald-700" : "text-red-700"}`}>
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
    logActivity("words");
    setSessionDone(s => s+1);
    if (idx < due.length - 1) { setIdx(i => i+1); setFlipped(false); }
    else setDue([]);
  };

  const [confirmReset, setConfirmReset] = useState(false);

  const reset = () => {
    const fresh = getInitialCardState();
    setCards(fresh);
    lsSet("anki_cards", fresh);
    const d = getDueCards(fresh);
    setDue(d); setIdx(0); setFlipped(false); setSessionDone(0);
    setConfirmReset(false);
  };

  if (due.length === 0) {
    return (
      <div className="space-y-4">
        <div className="p-5 bg-emerald-50 border border-emerald-500/20 rounded-3xl text-center">
          <p className="text-4xl mb-3">🎓</p>
          <p className="text-encre font-black text-xl mb-1">{sessionDone > 0 ? `Session terminée !` : "À jour !"}</p>
          {sessionDone > 0 && <p className="text-emerald-700 text-sm">{sessionDone} cartes révisées</p>}
          <p className="text-slate-500 text-sm mt-2">{learned}/500 mots appris</p>
        </div>

        {/* Explication du compteur */}
        <div className="p-3 bg-blue-50 border border-blue-500/20 rounded-2xl">
          <p className="text-blue-700 font-bold text-xs mb-1">ℹ️ Comment fonctionne le compteur ?</p>
          <p className="text-slate-500 text-xs leading-relaxed">Retourne une carte → réponds <span className="text-blue-700 font-bold">Bien</span> ou <span className="text-emerald-700 font-bold">Facile</span> → le mot est marqué "appris". Plus tu réponds correctement, plus l'intervalle avant la prochaine révision s'allonge (1j → 3j → 1 sem → …)</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-200">
            <p className="text-slate-500 text-xs">Appris</p>
            <p className="text-emerald-700 font-black text-xl">{learned}</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-200">
            <p className="text-slate-500 text-xs">Total</p>
            <p className="text-encre font-black text-xl">500</p>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-200">
            <p className="text-slate-500 text-xs">À revoir</p>
            <p className="text-amber-700 font-black text-xl">{VOCAB.filter(w => cards[w.id]?.nextReview > Date.now()).length}</p>
          </div>
        </div>
        <div className="space-y-2">
          <button onClick={() => { const d = getDueCards(cards); setDue(d); setIdx(0); setFlipped(false); setSessionDone(0); }}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl">
            🔄 Nouvelle session
          </button>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)}
              className="w-full py-2.5 bg-red-50 text-red-700 border border-red-500/25 rounded-2xl text-sm font-semibold hover:bg-red-50 transition-all">
              🗑️ Réinitialiser la progression
            </button>
          ) : (
            <div className="p-4 bg-red-50 border border-red-500/35 rounded-2xl space-y-3">
              <p className="text-red-700 text-sm font-bold text-center">⚠️ Supprimer toute la progression ?</p>
              <p className="text-slate-500 text-xs text-center">Les {learned} mots appris seront remis à zéro.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmReset(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-sm font-bold">
                  Annuler
                </button>
                <button onClick={reset}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-bold">
                  Confirmer
                </button>
              </div>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-encre mb-2">Tous les mots</p>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {VOCAB.map(w => {
              const c = cards[w.id];
              const done = c?.reps > 0;
              return (
                <div key={w.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${done ? "border-emerald-500/15 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
                  <span className={`text-xs font-bold w-6 text-center ${done ? "text-emerald-700" : "text-slate-400"}`}>{done ? "✓" : w.id}</span>
                  <span className="font-serif text-encre text-base" dir="rtl">{w.ar}</span>
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
        <p className="text-encre font-bold">Révision · {idx+1}/{totalDue}</p>
        <p className="text-slate-500 text-xs">{VOCAB.findIndex(w => w.id === card?.id)+1}e mot le plus fréquent</p>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
        className="w-full min-h-48 rounded-3xl border border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-6 gap-3 active:scale-98 transition-all"
        whileTap={{scale:0.98}}>
        {!flipped ? (
          <div style={{display:"contents"}}>
            <p className="font-serif text-encre" style={{fontSize:"3.5rem"}} dir="rtl">{card?.ar}</p>
            <p className="text-slate-500 text-sm">Appuie pour voir la réponse</p>
          </div>
        ) : (
          <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} className="text-center space-y-2">
            <p className="font-serif text-encre" style={{fontSize:"3rem"}} dir="rtl">{card?.ar}</p>
            <p className="text-blue-700 text-lg italic font-bold">{card?.tr}</p>
            <p className="text-encre text-xl font-bold">{card?.fr}</p>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{card?.cat} · {card?.freq}× dans le Coran</span>
          </motion.div>
        )}
      </motion.button>
      {flipped && (
        <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="grid grid-cols-2 gap-2">
          {[{q:0,label:"À revoir",color:"bg-red-500/20 border-red-500/40 text-red-700"},{q:1,label:"Difficile",color:"bg-orange-500/20 border-orange-500/40 text-orange-300"},{q:2,label:"Bien",color:"bg-blue-500/20 border-blue-500/40 text-blue-700"},{q:3,label:"Facile",color:"bg-emerald-500/20 border-emerald-500/40 text-emerald-700"}].map(b => (
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
  const doReset = () => { setMode(null); setQuestions([]); setQIdx(0); setSelected(null); setAnswered(false); setScore(0); setStreak(0); };

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
    logActivity("quiz");
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
      <div className="p-4 bg-yellow-50 border border-yellow-500/20 rounded-2xl">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><p className="text-yellow-700 font-bold text-sm">🎯 6 types de quiz</p><button onClick={doReset} style={{background:"none",border:"1px solid rgba(15,23,42,0.12)",borderRadius:"8px",padding:"5px 12px",color:"#64748b",fontSize:"0.7rem",cursor:"pointer"}}>🔄 Réinitialiser</button></div>
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
        <p className="text-encre font-black text-3xl">{score}<span className="text-xl text-slate-500">/{questions.length}</span></p>
        <p className="text-slate-500">{pct>=90?"Mashā Allāh !":pct>=70?"Très bien !":pct>=50?"Continue !":"Réessaie !"}</p>
        <div className="flex gap-1.5 justify-center flex-wrap">
          {questions.map((_,i)=>(
            <div key={i} className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${i<score?"bg-emerald-500 text-white":"bg-red-500/40 text-red-700"}`}>
              {i<score?"✓":"✗"}
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-center pt-2">
          <button onClick={()=>start(mode)} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl">🔄 Rejouer</button>
          <button onClick={()=>setMode(null)} className="px-5 py-2.5 bg-slate-100 text-encre rounded-xl">Menu</button>
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
        <button onClick={()=>setMode(null)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"><ChevronRight className="w-5 h-5 rotate-180"/></button>
        <div className="flex items-center gap-2">
          {streak>=2 && <span className="text-xs text-amber-700 font-bold">🔥 {streak}</span>}
          <span className="text-emerald-700 font-bold text-sm">{score} ✓</span>
          <span className="text-slate-500 text-xs">{qIdx+1}/{questions.length}</span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full" animate={{width:`${(qIdx/questions.length)*100}%`}}/>
      </div>
      <p className="text-slate-500 text-sm text-center font-semibold">{q.question}</p>

      {/* Zone centrale selon type */}
      {q.type==="letter_forms" && (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {q.variants.map(v=>(
              <div key={v.label} style={{background:"rgba(15,23,42,0.05)",border:"1px solid rgba(15,23,42,0.12)",borderRadius:"16px",padding:"12px 4px",textAlign:"center"}}>
                <p style={{fontSize:"0.6rem",color:"#64748b",marginBottom:"6px"}}>{v.label}</p>
                <p style={{fontFamily:"'Amiri Quran','Scheherazade New',serif",fontSize:"1.8rem",color:"#1A1A1A",lineHeight:"2"}} dir="rtl">{v.text}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button onClick={()=>speakArabic(q.ar, 0.4)}
              style={{background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:"12px",padding:"8px 20px",color:"#047857",fontSize:"0.85rem",cursor:"pointer",fontWeight:"bold"}}>
              🔊 Écouter
            </button>
            <p style={{color:"#64748b",fontSize:"0.75rem",marginTop:"6px"}}>Son : <span style={{color:"#1A1A1A",fontWeight:"bold"}}>{q.sound}</span></p>
          </div>
        </div>
      )}

      {q.type==="letter_sound" && (
        <div style={{background:"rgba(15,23,42,0.05)",border:"1px solid rgba(15,23,42,0.12)",borderRadius:"24px",padding:"32px",textAlign:"center"}}>
          <p style={{color:"#64748b",fontSize:"0.85rem",marginBottom:"16px"}}>Appuie pour entendre la lettre</p>
          <button onClick={()=>speakArabic(q.ar, 0.35)}
            style={{background:"linear-gradient(135deg,#7c3aed,#6d28d9)",border:"none",borderRadius:"50%",width:"80px",height:"80px",fontSize:"2rem",cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 20px rgba(124,58,237,0.4)"}}>
            🔊
          </button>
          <p style={{color:"#64748b",fontSize:"0.8rem",marginTop:"12px"}}>Son attendu : <span style={{color:"#1A1A1A",fontWeight:"bold"}}>{q.sound}</span></p>
        </div>
      )}

      {(q.type==="word_meaning"||q.type==="word_arabic"||q.type==="tajweed") && (
        <div style={{background:"rgba(15,23,42,0.05)",border:"1px solid rgba(15,23,42,0.12)",borderRadius:"24px",padding:"24px",textAlign:"center"}}>
          <div style={{lineHeight:"3"}}>
            <LetterByLetter text={q.ar} size="clamp(1.5rem,5vw,2rem)"/>
          </div>
          {q.tr && <p style={{color:"#3b82f6",fontSize:"0.75rem",fontStyle:"italic",marginTop:"4px"}} dir="ltr">{q.tr}</p>}
          {q.freq && <p style={{color:"#475569",fontSize:"0.7rem",marginTop:"2px"}}>{q.freq.toLocaleString()}× dans le Coran</p>}
          <button onClick={()=>speakArabic(q.ar,0.55)}
            style={{marginTop:"12px",background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:"10px",padding:"6px 16px",color:"#047857",fontSize:"0.75rem",cursor:"pointer"}}>
            🔊 Écouter
          </button>
        </div>
      )}

      {q.type==="letter" && (
        <div style={{background:"rgba(15,23,42,0.05)",border:"1px solid rgba(15,23,42,0.12)",borderRadius:"24px",padding:"40px",textAlign:"center"}}>
          <p style={{fontFamily:"'Amiri Quran','Scheherazade New',serif",fontSize:"4rem",color:"#1A1A1A"}} dir="rtl">{q.ar}</p>
          <button onClick={()=>speakArabic(q.ar,0.4)}
            style={{marginTop:"12px",background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:"10px",padding:"6px 16px",color:"#047857",fontSize:"0.75rem",cursor:"pointer"}}>
            🔊 Écouter
          </button>
        </div>
      )}

      {/* Options */}
      <div className="grid grid-cols-2 gap-2">
        {q.options.map((opt,oi)=>{
          const isCorrect=opt===q.correct, isSelected=opt===selected;
          let bg="rgba(15,23,42,0.05)",border="rgba(15,23,42,0.12)",color="#1A1A1A";
          if(answered&&isCorrect){bg="rgba(16,185,129,0.15)";border="#10b981";color="#047857";}
          else if(answered&&isSelected&&!isCorrect){bg="rgba(239,68,68,0.25)";border="#ef4444";color="#B91C1C";}
          return (
            <button key={oi} onClick={()=>answer(opt)} style={{
              padding:isArabicOpt?"16px 8px":"14px 10px",borderRadius:"16px",
              border:`1px solid ${border}`,background:bg,color,fontWeight:"bold",
              fontSize:isArabicOpt?"1.5rem":"0.875rem",cursor:"pointer",transition:"all 0.2s",
              textAlign:"center",fontFamily:isArabicOpt?"'Amiri Quran','Scheherazade New',serif":"inherit",
              direction:isArabicOpt?"rtl":"ltr",lineHeight:isArabicOpt?"2":"1.4",
            }}>
              {opt}
              {answered&&isCorrect&&<span style={{display:"block",fontSize:"0.6rem",fontFamily:"system-ui",color:"#047857",marginTop:"2px"}}>✓</span>}
            </button>
          );
        })}
      </div>

      {answered && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="space-y-2">
          <div style={{background:lastCorrect?"rgba(16,185,129,0.1)":"rgba(239,68,68,0.1)",border:`1px solid ${lastCorrect?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`,borderRadius:"16px",padding:"12px",textAlign:"center"}}>
            <p style={{color:lastCorrect?"#047857":"#B91C1C",fontWeight:"bold"}}>
              {lastCorrect?"✅ Correct !":"❌ Réponse : "+q.correct}
            </p>
            {q.type==="letter_forms" && <p style={{color:"#1d4ed8",fontSize:"0.75rem",marginTop:"4px"}}>Son : {q.sound}</p>}
            {(q.type==="word_meaning"||q.type==="word_arabic")&&q.tr && <p style={{color:"#1d4ed8",fontSize:"0.75rem",fontStyle:"italic",marginTop:"4px"}} dir="ltr">{q.tr}</p>}
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

// normalizeAr / compareWords / calcScore → voir src/lib/arabic.js

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

// ═══════════════════════════════════════════════════════
// VERSET KARAOKÉ : la phonétique s'allume lettre par lettre et le mot arabe en cours
// est surligné pendant la récitation. Toucher des mots = choisir un passage à travailler.
// ═══════════════════════════════════════════════════════
function splitArabicWords(ar) {
  // les signes de pause isolés (ۚ ۖ …) restent collés au mot précédent
  const out = [];
  for (const t of String(ar || "").split(/\s+/).filter(Boolean)) {
    if (/[\u0621-\u064A\u0671]/.test(t) || !out.length) out.push(t); else out[out.length - 1] += " " + t;
  }
  return out;
}

function KaraokeVerse({ ar, tr, info, pos, sel, onTap, results }) {
  const arW = splitArabicWords(ar);
  const trW = String(tr || "").split(/\s+/).filter(Boolean);
  const arB = info ? wordBounds(arW.map(arabicWeight), info.start, info.end) : null;
  const trB = info ? wordBounds(trW.map(wordWeight), info.start, info.end) : null;
  const cur = arB && pos != null ? arB.findIndex((t, i) => i < arW.length && pos >= t && pos < arB[i + 1]) : -1;
  // correspondance mot phonétique → mot arabe (même nombre : 1 pour 1, sinon par le temps)
  const trToAr = (j) => {
    if (trW.length === arW.length) return j;
    return Math.min(arW.length - 1, Math.floor((j / Math.max(1, trW.length)) * arW.length));
  };
  const inSel = (i) => sel && i >= sel.a && i <= sel.b;
  const status = (i) => results?.[i]?.status;
  const statusColor = { correct: "#059669", close: "#B45309", wrong: "#DC2626", missing: "#64748B" };

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-x-1.5 gap-y-1 py-2" dir="rtl">
        {arW.map((w, i) => (
          <button key={i} onClick={() => onTap(i)} aria-label={`Mot ${i + 1}`}
            className={`rounded-xl px-1.5 transition-all ${inSel(i) ? "bg-jaune/40 ring-2 ring-jaune" : ""} ${i === cur ? "bg-vert/15 scale-110" : ""}`}
            style={{ lineHeight: 2.3, borderBottom: status(i) ? `3px solid ${statusColor[status(i)]}` : "3px solid transparent" }}>
            <LetterByLetter text={w} size="clamp(1.4rem,5vw,1.9rem)"/>
          </button>
        ))}
      </div>
      {trW.length > 0 && (
        <p className="mt-2 flex flex-wrap justify-center gap-x-1.5 text-[15px] font-semibold leading-relaxed" dir="ltr">
          {trW.map((w, j) => {
            const a = trB?.[j], b = trB?.[j + 1];
            const f = pos == null || a == null ? (cur === -1 && pos != null ? 0 : -1) : Math.max(0, Math.min(1, (pos - a) / (b - a)));
            const lit = f < 0 ? 0 : Math.round(f * w.length);
            const selected = inSel(trToAr(j));
            return (
              <span key={j} onClick={() => onTap(trToAr(j))} role="button"
                className={`cursor-pointer rounded-md px-0.5 ${selected ? "bg-jaune/40" : ""}`}>
                {pos == null
                  ? <span className="text-blue-700">{w}</span>
                  : <>
                      <span style={{ color: "#00A19A", textShadow: "0 0 10px rgba(0,161,154,.35)" }}>{w.slice(0, lit)}</span>
                      <span className="text-slate-400">{w.slice(lit)}</span>
                    </>}
              </span>
            );
          })}
        </p>
      )}
    </div>
  );
}

function ProfesseurTab({ surahIndex = [], loadSurah, initialSurah, initialMode }) {
  const [mode, setMode] = useState(null);
  const [selectedSurah, setSelectedSurah] = useState(PROF_SURAHS[0]);
  const [surahLoading, setSurahLoading] = useState(false);
  const [surahError, setSurahError] = useState("");
  const va = useVerseAudio();
  const [sel, setSel] = useState(null);          // passage choisi { a, b } (indices de mots arabes)
  const [loopTimes, setLoopTimes] = useState(3);
  const [slow, setSlow] = useState(false);
  const [segResult, setSegResult] = useState(false);
  const [memo, setMemo] = useState(() => getMemorized(PROF_SURAHS[0].number));
  // Choix parmi les 114 : versets locaux si disponibles, sinon chargés depuis l'API
  const chooseSurah = async (num) => {
    setSurahError("");
    const local = ALL_SURAHS.find(x => x.number === num && x.verses?.length);
    const reset = () => { setVerseIdx(0); setScore(null); setResults(null); setTranscript(""); setStep("idle"); };
    setMemo(getMemorized(num));
    // reprendre au premier verset pas encore appris
    const startAt = (verses) => { const m = getMemorized(num); const i = verses.findIndex(v => !m[v.n]); return i < 0 ? 0 : i; };
    const fullCount = surahIndex[num - 1]?.verses;
    // l'app ne contient parfois qu'un extrait (ex. Al-Kahf « début ») : on charge alors la sourate complète
    const localComplete = local && (!fullCount || local.verses.length >= fullCount);
    if (localComplete || (local && !loadSurah)) { setSelectedSurah(local); reset(); setVerseIdx(startAt(local.verses)); return; }
    if (!loadSurah) return;
    setSurahLoading(true);
    try {
      const verses = await loadSurah(num);
      if (!verses.length) throw new Error("vide");
      const meta = surahIndex[num - 1] || { name: `Sourate ${num}`, arabic: "" };
      setSelectedSurah({ number: num, name: meta.name, arabic: meta.arabic, verses });
      reset();
      setVerseIdx(startAt(verses));
    } catch {
      if (local) { setSelectedSurah(local); reset(); setVerseIdx(startAt(local.verses)); setSurahError("Hors connexion : seul un extrait de cette sourate est disponible."); return; }
      setSurahError("Impossible de charger cette sourate (connexion internet nécessaire). Réessaie dans un instant.");
    } finally { setSurahLoading(false); }
  };
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
  const profCtxRef = useRef(null);
  const profSrcRef = useRef(null);
  const doReset = () => { setMode(null); setStep("idle"); setTranscript(""); setResults(null); setScore(null); setLetterResult(null); setSessionScores([]); setSel(null); setSegResult(false); recognitionRef.current?.stop(); va.stop(); };

  // Joue un verset avec la voix d'Alafasy via XMLHttpRequest (bypass SW)
  const audioUrl = (surahNum, verseNum) => window.location.origin + "/api/audio?slug=ar.alafasy&v=" + gvLS(surahNum, verseNum);
  // Joue un verset avec la voix d'Alafasy (effet karaoké sur le texte)
  const playAlafasyVerse = (surahNum, verseNum) => { va.play(audioUrl(surahNum, verseNum), { rate: slow ? 0.75 : 1 }); };

  useEffect(() => {
    if (initialSurah) { chooseSurah(initialSurah); if (initialMode) setMode(initialMode); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const verse = selectedSurah.verses[verseIdx];
  const letter = ALPHABET[letterIdx];
  // nouveau verset : on oublie le passage choisi et on coupe l'audio
  useEffect(() => { setSel(null); setSegResult(false); va.stop(); }, [verseIdx, selectedSurah]); // eslint-disable-line react-hooks/exhaustive-deps

  // Détecte si le navigateur supporte la reconnaissance vocale
  useEffect(() => {
    setHasMic("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
    ensureVoices(); // précharge les voix
  }, []);

  // ── Le professeur parle ────────────────────────────────
  const profSpeak = useCallback((text, lang = "fr-FR", onEnd) => {
    speakFeedback(text, lang, onEnd);
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
      // les alternatives sont comparées séparément (et non plus collées bout à bout)
      const alts = Array.from(e.results[0]).map(r => r.transcript.trim()).filter(Boolean);
      setTranscript(alts[0] || "");
      onResult(alts[0] || "", alts);
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
  const handleVerseResult = useCallback((heard, wordMode, alts, seg) => {
    const best = bestTranscript(seg ? seg.text : verse.ar, alts && alts.length ? alts : [heard]);
    const res = best.results;
    const sc = best.score;
    setTranscript(best.heard);
    if (sc >= 60) logActivity("recite");
    // verset validé : compté comme appris (mémorisation, ex. objectif Al-Kahf)
    if (!seg && sc >= MEMO_THRESHOLD && markVerseLearned(selectedSurah.number, verse.n)) setMemo(getMemorized(selectedSurah.number));
    setSegResult(!!seg);
    setResults(res); // détail mot par mot gardé dans tous les modes (diagnostic)
    setScore(sc);
    setStep("result");
    setSessionScores(prev => [...prev, sc]);

    // Passage choisi : on le rejoue une fois s'il n'est pas encore maîtrisé
    if (seg) {
      if (sc >= 90) profSpeak("Mashā Allāh ! Ce passage est maîtrisé.");
      else profSpeak("Écoute encore le passage, puis répète.", "fr-FR", () => seg.replay());
      return;
    }
    // Le prof parle selon le score
    if (sc >= 95) {
      profSpeak("Mashā Allāh ! Excellent, ta récitation est parfaite !");
    } else if (sc >= 80) {
      const wrong = res.filter(r => r.status === "wrong").map(r => r.word);
      if (wrong.length) {
        profSpeak(`Bien ! Retravaille ces mots : ${wrong.slice(0,3).join("، ")}`, "fr-FR", () => playAlafasyVerse(selectedSurah.number, verse.n));
      } else profSpeak("Très bien ! Continue comme ça !");
    } else {
      // sous 80 % : on dit où ça a coincé (le détail s'affiche à l'écran)
      profSpeak(diagnosisSentence(diagnose(res), res.length) || "Recommençons. Écoute bien le verset, puis répète.");
    }
  }, [verse, selectedSurah, profSpeak, playAlafasyVerse]);

  // ── Résultat Lettre ────────────────────────────────────
  const handleLetterResult = useCallback((heard, alts) => {
    if (alts && alts.length > 1) heard = alts.join(" ");
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
        {/* Bannière son : seulement si le micro n'est pas disponible */}
        {hasMic === false && <div className="p-4 bg-amber-50 border border-amber-500/25 rounded-2xl">
          <p className="text-amber-700 font-bold text-sm mb-1">🔊 Pour activer le son et le micro</p>
          <p className="text-slate-500 text-xs leading-relaxed">
            Android : ouvre dans <span className="text-encre font-bold">Chrome</span> → Menu ⋮ → Ajouter à l'écran d'accueil{"\n"}
            iPhone : ouvre dans <span className="text-encre font-bold">Safari</span> → Partager → Sur l'écran d'accueil
          </p>
          {hasMic === false && <p className="text-red-700 text-xs mt-1 font-bold">❌ Microphone non disponible dans ce navigateur</p>}
        </div>}

        <details className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5">
          <summary className="cursor-pointer text-sm font-bold text-slate-600">ℹ️ Comment ça marche ?</summary>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">1. Choisis une sourate et un mode · 2. Écoute le verset · 3. Appuie sur 🎙️ Répéter · 4. Le professeur analyse ta récitation, mot par mot, et te reprend. Un verset récité à 80 % ou plus compte comme appris.</p>
          <button onClick={doReset} className="mt-2 rounded-lg border border-slate-200 px-3 py-1 text-[11px] text-slate-500">🔄 Réinitialiser la séance</button>
        </details>

        {/* Sélection sourate (raccourcis + les 114) */}
        <SurahPicker index={surahIndex.length ? surahIndex : PROF_SURAHS.map(x => ({ number: x.number, name: x.name, arabic: x.arabic, verses: x.verses.length }))}
          quick={PROF_SURAHS} selected={selectedSurah.number} onSelect={chooseSurah} loading={surahLoading} error={surahError}/>

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
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-encre font-bold text-sm">📊 Session en cours</p>
              <span className={`font-black text-lg ${avgScore>=80?"text-emerald-700":avgScore>=60?"text-blue-700":"text-orange-700"}`}>{avgScore}%</span>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {sessionScores.map((s,i) => (
                <span key={i} className={`text-xs font-bold px-2 py-0.5 rounded-lg ${s>=90?"bg-emerald-500/25 text-emerald-700":s>=70?"bg-blue-500/25 text-blue-700":"bg-orange-500/25 text-orange-300"}`}>{s}%</span>
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
          <button onClick={() => { setMode(null); stopRec(); setStep("idle"); }} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500">
            <ChevronRight className="w-5 h-5 rotate-180"/>
          </button>
          <p className="text-encre font-bold">Mode Lettre · {letterIdx+1}/{ALPHABET.length}</p>
        </div>

        {/* Bulle professeur */}
        <AnimatePresence>
          {voiceMsg && (
            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
              className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-500/30 rounded-2xl">
              <span className="text-xl shrink-0">🧑‍🏫</span>
              <p className="text-purple-700 text-sm italic">{voiceMsg}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lettre */}
        <div className={`rounded-3xl p-6 border text-center transition-all ${
          letterResult==="correct" ? "bg-emerald-50 border-emerald-500/40" :
          letterResult==="wrong"   ? "bg-red-50 border-red-500/35" :
          step==="listening"       ? "bg-purple-50 border-purple-500/30 animate-pulse" :
          "bg-slate-50 border-slate-300"}`}>
          <p className="font-serif mb-2" style={{color:"#1A1A1A", fontSize:"6rem"}}>{letter.ar}</p>
          <p className="text-blue-700 font-bold text-xl">{letter.name}</p>
          <p className="text-slate-500 text-sm mt-1">Son : <span className="text-encre font-bold">{letter.sound}</span></p>
          <p className="text-slate-400 text-xs mt-1">{letter.group}</p>
          {letterResult==="correct" && <motion.p initial={{scale:0}} animate={{scale:1}} className="text-emerald-700 font-black text-2xl mt-3">✅ Correct !</motion.p>}
          {letterResult==="wrong"   && <motion.p initial={{scale:0}} animate={{scale:1}} className="text-red-700 font-bold text-sm mt-2">❌ Écoute et réessaie</motion.p>}
          {step==="listening"       && <p className="text-purple-700 text-sm mt-2 font-bold">🎙️ J'écoute…</p>}
        </div>

        {/* Boutons */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { speakArabic(letter.ar, 0.35); }}
            className="py-3.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
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
            className="px-4 py-2.5 bg-slate-100 rounded-xl text-slate-500 disabled:opacity-30 font-bold">← Préc.</button>
          <div className="flex gap-1 flex-wrap justify-center max-w-48">
            {ALPHABET.map((_,i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i===letterIdx?"bg-purple-400":"bg-slate-200"}`}/>
            ))}
          </div>
          <button disabled={letterIdx===ALPHABET.length-1}
            onClick={() => { setLetterIdx(i=>i+1); setLetterResult(null); setStep("idle"); setVoiceMsg(""); }}
            className="px-4 py-2.5 bg-slate-100 rounded-xl text-slate-500 disabled:opacity-30 font-bold">Suiv. →</button>
        </div>

        {/* Grille */}
        <div className="grid grid-cols-7 gap-1.5">
          {ALPHABET.map((l,i) => (
            <button key={i} onClick={() => { setLetterIdx(i); setLetterResult(null); setStep("idle"); setVoiceMsg(""); }}
              className={`p-1.5 rounded-xl text-center font-serif text-base transition-all ${i===letterIdx?"bg-purple-600":"bg-slate-100 border border-slate-200"}`}
              style={{color:"#1A1A1A"}} dir="rtl">{l.ar}
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
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"><ChevronRight className="w-5 h-5 rotate-180"/></button>
        <div className="flex-1">
          <p className="text-encre font-bold text-sm">{isWordMode ? "Mot par mot" : "Verset complet"} · {selectedSurah.name}</p>
          <p className="text-slate-500 text-xs">Verset {verseIdx+1}/{selectedSurah.verses.length}</p>
          {surahLoading && <p className="text-xs text-bleu">⏳ Chargement de la sourate complète…</p>}
          {surahError && <p className="text-xs text-rouge">{surahError}</p>}
        </div>
        <button onClick={() => { playAlafasyVerse(selectedSurah.number, verse.n); }}
          className="p-2 bg-emerald-500/15 text-emerald-700 rounded-xl active:scale-95">
          <Volume2 className="w-4 h-4"/>
        </button>
      </div>

      {/* Bulle professeur */}
      <AnimatePresence>
        {voiceMsg && (
          <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-500/30 rounded-2xl">
            <span className="text-xl shrink-0">🧑‍🏫</span>
            <p className="text-purple-700 text-sm italic leading-relaxed">{voiceMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verset */}
      <div className={`p-5 rounded-3xl border text-center transition-all ${
        score===null ? step==="listening" ? "bg-purple-50 border-purple-500/30" : "bg-slate-50 border-slate-200" :
        score>=90 ? "bg-emerald-50 border-emerald-500/30" :
        score>=70 ? "bg-blue-50 border-blue-500/30" :
        "bg-orange-50 border-orange-500/25"}`}>

        {results && isWordMode && !segResult ? (
          <div className="flex flex-wrap justify-center gap-3 py-3" dir="rtl">
            {results.map((r,i) => {
              const color = r.status==="correct" ? "#059669"
                : r.status==="close"   ? "#B45309"
                : r.status==="missing" ? "#64748B"
                : "#DC2626";
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
          <KaraokeVerse ar={verse.ar} tr={verse.tr} info={va.info} pos={va.pos} sel={sel}
            results={!results ? null : segResult && sel ? Object.fromEntries(results.map((r, k) => [sel.a + k, r])) : (!segResult && score !== null && score < 80) ? results : null}
            onTap={(i) => {
              va.load(audioUrl(selectedSurah.number, verse.n)).catch(() => {});
              setSegResult(false);
              setSel(p => !p ? { a: i, b: i } : (p.a === p.b && i !== p.a) ? { a: Math.min(p.a, i), b: Math.max(p.a, i) } : (i >= p.a && i <= p.b && p.a === p.b) ? null : { a: i, b: i });
            }}/>
        )}
        {!sel && <p className="mt-1 text-[11px] text-slate-400">👆 Touche un mot (puis un 2ᵉ) pour travailler seulement ce passage</p>}

        {score !== null && (
          <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} className="mt-3 space-y-1">
            <p className={`font-black text-4xl ${score>=90?"text-emerald-700":score>=70?"text-blue-700":"text-orange-700"}`}>{score}<span className="text-xl">%</span></p>
            {isWordMode && results && (
              <div className="flex gap-3 justify-center text-xs mt-2">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"/> {results.filter(r=>r.status==="correct").length} correct</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"/> {results.filter(r=>r.status==="close").length} proche</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"/> {results.filter(r=>r.status==="wrong"||r.status==="missing").length} à retravailler</span>
              </div>
            )}
          </motion.div>
        )}
        {step==="listening" && <p className="text-purple-700 text-sm mt-2 font-bold animate-pulse">🎙️ Je t'écoute… récite lentement</p>}
      </div>

      {/* Diagnostic : où ça a coincé (sous 80 %) */}
      {score !== null && results && score < (segResult ? 90 : 80) && (() => {
        const problems = diagnose(results);
        if (!problems.length) return null;
        const trW = String(verse.tr || "").split(/\s+/).filter(Boolean);
        const arCount = splitArabicWords(verse.ar).length;
        const offset = segResult && sel ? sel.a : 0;
        return (
          <div className="space-y-2 rounded-2xl border-2 border-rouge/30 bg-rouge/5 p-3">
            <p className="text-sm font-extrabold text-rouge">🔍 Où ça a coincé — {problems.length} mot{problems.length > 1 ? "s" : ""} sur {results.length}</p>
            {problems.map((p) => {
              const i = p.index + offset;
              const phon = trW.length === arCount ? trW[i] : null;
              return (
                <div key={p.index} className="rounded-xl border border-slate-200 bg-white p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600">{i + 1}</span>
                    <span dir="rtl" lang="ar" className="text-xl" style={{ fontFamily: "'Amiri Quran','Scheherazade New',serif" }}>{p.word}</span>
                    {phon && <span className="text-xs font-semibold text-blue-700">{phon}</span>}
                    <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold ${p.status === "close" ? "bg-amber-100 text-amber-800" : p.status === "missing" ? "bg-slate-200 text-slate-600" : "bg-rouge/15 text-rouge"}`}>{p.label}</span>
                  </div>
                  {p.spoken && <p className="mt-1 text-xs text-slate-500">J'ai entendu : <span dir="rtl" lang="ar" className="text-base text-rouge" style={{ fontFamily: "'Amiri Quran',serif" }}>{p.spoken}</span></p>}
                  {p.tips.map((t) => (
                    <p key={t.letters} className="mt-1 rounded-lg bg-jaune/15 px-2 py-1 text-[11px] text-amber-900">
                      <span className="block font-bold">Tu as dit <bdi className="text-base">{t.said}</bdi> au lieu de <bdi className="text-base">{t.expected}</bdi></span>
                      <span className="block" dir="ltr">{t.tip}</span>
                    </p>
                  ))}
                  <button onClick={() => { setSel({ a: i, b: i }); setSegResult(false); setScore(null); setStep("idle"); va.load(audioUrl(selectedSurah.number, verse.n)).catch(() => {}); }}
                    className="mt-2 rounded-lg bg-amber-600 px-3 py-1.5 text-[11px] font-bold text-white">🔁 Travailler ce mot</button>
                </div>
              );
            })}
            {problems.length > 1 && (
              <button onClick={() => { const a = problems[0].index + offset, b = problems[problems.length - 1].index + offset; setSel({ a, b }); setSegResult(false); setScore(null); setStep("idle"); va.load(audioUrl(selectedSurah.number, verse.n)).catch(() => {}); }}
                className="w-full rounded-xl border border-amber-600 py-2 text-xs font-bold text-amber-700">
                Travailler tout le passage (mots {problems[0].index + offset + 1} à {problems[problems.length - 1].index + offset + 1})
              </button>
            )}
          </div>
        );
      })()}

      {/* Passage choisi : écouter en boucle, puis le réciter seul */}
      {sel && (() => {
        const words = splitArabicWords(verse.ar);
        const segText = words.slice(sel.a, sel.b + 1).join(" ");
        const b = va.info ? wordBounds(words.map(arabicWeight), va.info.start, va.info.end) : null;
        const from = b ? Math.max(0, b[sel.a] - 0.12) : undefined, to = b ? b[sel.b + 1] + 0.25 : undefined;
        const playSeg = (times = loopTimes) => va.play(audioUrl(selectedSurah.number, verse.n), { from, to, times, rate: slow ? 0.75 : 1 });
        return (
          <div className="space-y-2.5 rounded-2xl border-2 border-jaune bg-jaune/10 p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-800">Passage à travailler · mot{sel.a === sel.b ? ` ${sel.a + 1}` : `s ${sel.a + 1} à ${sel.b + 1}`}</p>
              <button onClick={() => { setSel(null); setSegResult(false); va.stop(); }} className="text-xs font-bold text-slate-500">✕ Annuler</button>
            </div>
            <p dir="rtl" lang="ar" className="text-center text-2xl" style={{ fontFamily: "'Amiri Quran','Scheherazade New',serif" }}>{segText}</p>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
              <span className="text-slate-500">Répéter :</span>
              {[1, 3, 5, 10, Infinity].map(n => (
                <button key={n} onClick={() => setLoopTimes(n)}
                  className={`rounded-full px-2.5 py-1 border ${loopTimes === n ? "bg-amber-600 text-white border-amber-600" : "bg-white text-slate-600 border-slate-200"}`}>
                  {n === Infinity ? "∞" : `${n}×`}
                </button>
              ))}
              <button onClick={() => setSlow(v => !v)} className={`ml-auto rounded-full px-2.5 py-1 border ${slow ? "bg-bleu text-white border-bleu" : "bg-white text-slate-600 border-slate-200"}`}>🐢 Lent</button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => va.playing ? va.stop() : playSeg()} disabled={va.loading}
                className="flex-1 rounded-xl bg-amber-600 py-3 text-sm font-bold text-white disabled:opacity-60">
                {va.loading ? "⏳ Chargement…" : va.playing ? "⏹ Stop" : `🔁 Écouter ${loopTimes === Infinity ? "en boucle" : loopTimes + "×"}`}
              </button>
              <button onClick={() => step === "listening" ? stopRec() : startRec((h, alts) => handleVerseResult(h, true, alts, { text: segText, replay: () => playSeg(1) }))}
                className={`flex-1 rounded-xl py-3 text-sm font-bold text-white ${step === "listening" ? "bg-red-500" : "bg-purple-600"}`}>
                {step === "listening" ? "⏹ Stop" : "🎙️ Réciter ce passage"}
              </button>
            </div>
            {segResult && score !== null && <p className="text-center text-xs font-semibold text-slate-600">Passage : {score} % {score >= 90 ? "— maîtrisé ✓" : "— recommence jusqu'à 90 %"}</p>}
          </div>
        );
      })()}

      {/* Ce que j'ai entendu */}
      {transcript && step==="result" && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3">
          <p className="text-slate-400 text-xs mb-1">🎙️ Ce que j'ai entendu :</p>
          <p className="text-encre font-serif text-lg" dir="rtl">{transcript}</p>
        </div>
      )}

      {/* Boutons principaux */}
      <div className="flex gap-2">
        <button onClick={() => { va.playing ? va.stop() : playAlafasyVerse(selectedSurah.number, verse.n); }}
          className="flex-1 py-3.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 font-bold rounded-2xl text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
          <Volume2 className="w-4 h-4"/> {va.loading ? "Chargement…" : va.playing ? "Stop" : "Écouter"}
        </button>
        <motion.button whileTap={{scale:0.95}}
          onClick={() => step==="listening" ? stopRec() : startRec((h, alts) => handleVerseResult(h, isWordMode, alts))}
          className={`flex-1 py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg ${
            step==="listening" ? "bg-red-500 text-white" : "bg-gradient-to-r from-purple-600 to-violet-600 text-white"}`}>
          {step==="listening" ? "⏹ Stop" : "🎙️ Répéter"}
        </motion.button>
        {score !== null && (
          <button onClick={() => {
            const next = (verseIdx+1) % selectedSurah.verses.length;
            setVerseIdx(next); setScore(null); setResults(null); setTranscript(""); setStep("idle"); setVoiceMsg("");
          }} className="px-4 py-3.5 bg-slate-100 border border-slate-300 text-encre font-bold rounded-2xl">
            {verseIdx < selectedSurah.verses.length-1 ? "→" : "↺"}
          </button>
        )}
      </div>

      <p className="text-xs text-slate-500">✅ {Object.keys(memo).length}/{selectedSurah.verses.length} versets appris dans {selectedSurah.name} · un verset est validé à partir de {MEMO_THRESHOLD} %</p>
      {/* Navigation versets */}
      <div className="flex gap-1.5 flex-wrap max-h-44 overflow-y-auto">
        {selectedSurah.verses.map((_,i) => (
          <button key={i}
            onClick={() => { setVerseIdx(i); setScore(null); setResults(null); setTranscript(""); setStep("idle"); setVoiceMsg(""); }}
            className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${i===verseIdx ? "bg-purple-600 text-white" : memo[selectedSurah.verses[i]?.n] ? "bg-vert/15 text-vert border border-vert/30" : "bg-slate-100 text-slate-500 border border-slate-200"}`}
            title={memo[selectedSurah.verses[i]?.n] ? "Verset appris" : undefined}>
            {selectedSurah.verses[i]?.n ?? i+1}
          </button>
        ))}
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════
const TOOL_TITLES = { revision: "🃏 Révision", ...Object.fromEntries(TOOLS.map(t => [t.key, `${t.icon} ${t.title}`])) };

export default function LearnScreen({ initialTab, surahIndex, loadSurah, profSurah, profMode, onRecognize }) {
  // "hub" = accueil d'Apprendre ; sinon un outil ouvert en plein
  const [tab, setTab] = useState(initialTab && initialTab !== "lesson" ? initialTab : "hub");
  const [lesson, setLesson] = useState(() => (initialTab === "lesson" ? nextUnitIndex() : null));
  const [, refresh] = useState(0);
  useEffect(() => { document.querySelector("main .overflow-y-auto")?.scrollTo({ top: 0 }); }, [tab]);
  const anki = ls("anki_cards", getInitialCardState());
  const now = Date.now();
  const due = Object.values(anki).filter(c => c?.reps > 0 && c.nextReview <= now).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      {tab === "hub" ? (
        <div>
          <h2 className="font-display text-2xl font-extrabold text-encre">Apprendre</h2>
          <p className="text-sm text-slate-500">5 mots par leçon, les plus fréquents du Coran d'abord.</p>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button onClick={() => setTab("hub")} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600">← Apprendre</button>
          <h2 className="truncate font-display text-lg font-extrabold text-encre">{TOOL_TITLES[tab] || ""}</h2>
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:0.15}} className="pb-8">
          {tab === "hub"      && <LearnHub due={due} onOpenTool={(k) => (k === "recognize" ? onRecognize?.() : setTab(k))} onOpenLesson={setLesson}/>}
          {tab === "surahs"   && <SuratesTab/>}
          {tab === "prof"     && <ProfesseurTab surahIndex={surahIndex} loadSurah={loadSurah} initialSurah={profSurah} initialMode={profMode}/>}
          {tab === "mots"     && <WordsTab anki={anki} onStartReview={() => setTab("revision")}/>}
          {tab === "lessons"  && <LessonsTab/>}
          {tab === "revision" && <RevisionTab/>}
          {tab === "quiz"     && <QuizTab/>}
          {tab === "alphabet" && <AlphabetTab/>}
          {tab === "tajweed"  && <TajweedTab/>}
          {tab === "voyelles" && <VoyellesTab/>}
        </motion.div>
      </AnimatePresence>
      {lesson !== null && (
        <PathLesson key={lesson} unit={lesson}
          onClose={() => { setLesson(null); refresh(x => x + 1); }}
          onDone={(n) => { setLesson(n); refresh(x => x + 1); }}/>
      )}
    </div>
  );
}

function nextUnitIndex() {
  const done = ls("path_progress_v1", { done: {} }).done || {};
  let i = 0;
  while (done[i]) i++;
  return i;
}
