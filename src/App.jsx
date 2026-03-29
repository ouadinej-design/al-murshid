import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import {
  BookOpen, Bookmark, Activity, ArrowRight, Star, Heart,
  Timer, X, Clock, Award, Copy, CheckCircle,
  RotateCcw, ChevronLeft, ChevronRight, Play, Pause,
  Plus, Trash2, Target, TrendingUp, Calendar, Zap
} from "lucide-react";
import LearnScreen from "./LearnScreen";

// ════════════════════════════════════════════════════════════════════
// DONNÉES — 30 JUZ avec durées de lecture moyennes (minutes)
// Basé sur la pratique malikite : tartil modéré (~1 page/min)
// ════════════════════════════════════════════════════════════════════
const JUZ_DATA = Array.from({ length: 30 }, (_, i) => ({
  number: i + 1,
  name: `Juz ${i + 1}`,
  arabicName: ["الم", "سَيَقُولُ", "تِلْكَ الرُّسُلُ", "لَن تَنَالُوا", "وَالْمُحْصَنَاتُ", "لَا يُحِبُّ اللَّهُ", "وَإِذَا سَمِعُوا", "وَلَوْ أَنَّنَا", "قَالَ الْمَلأُ", "وَاعْلَمُوا", "يَعْتَذِرُونَ", "وَمَا مِن دَابَّةٍ", "وَمَا أُبَرِّئُ", "رُبَمَا", "سُبْحَانَ الَّذِي", "قَالَ أَلَمْ", "اقْتَرَبَ", "قَدْ أَفْلَحَ", "وَقَالَ الَّذِينَ", "أَمَّنْ خَلَقَ", "اتْلُ مَا أُوحِيَ", "وَمَن يَقْنُتْ", "وَمَا لِيَ", "فَمَن أَظْلَمُ", "إِلَيْهِ يُرَدُّ", "حم", "قَالَ فَمَا خَطْبُكُمْ", "قَدْ سَمِعَ اللَّهُ", "تَبَارَكَ الَّذِي", "عَمَّ"][i],
  pages: 20,
  readingMinutes: [47, 45, 48, 46, 44, 43, 45, 47, 46, 44, 43, 45, 44, 43, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 30, 28, 25, 22][i],
  surahs: getSurahsForJuz(i + 1),
  encouragement: getEncouragement(i + 1),
}));

function getSurahsForJuz(juz) {
  const map = {
    1:[1,2],2:[2],3:[2,3],4:[3,4],5:[4,5],6:[4,5,6],7:[5,6,7],8:[6,7],9:[7,8],10:[8,9],
    11:[9,10,11],12:[11,12],13:[12,13,14],14:[15,16],15:[17,18],16:[18,19,20],17:[21,22],
    18:[23,24,25],19:[25,26,27],20:[27,28,29],21:[29,30,31,32,33],22:[33,34,35,36],
    23:[36,37,38,39],24:[39,40,41],25:[41,42,43,44,45],26:[46,47,48,49,50,51],
    27:[51,52,53,54,55,56,57],28:[58,59,60,61,62,63,64,65,66],
    29:[67,68,69,70,71,72,73,74,75,76,77],30:[78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112,113,114]
  };
  return map[juz] || [];
}

function getEncouragement(juz) {
  const messages = [
    { arabic: "مَا شَاءَ اللَّهُ", fr: "Masha'Allah ! Premier Juz complété — tu as posé la première pierre de ton Khatm.", hadith: "Le Prophète ﷺ dit : « Récitez le Coran, car il intercédera pour ses compagnons au Jour du Jugement. » — Muslim", verse: "إِنَّ هَٰذَا الْقُرْآنَ يَهْدِي لِلَّتِي هِيَ أَقْوَمُ", verseFr: "Ce Coran guide vers ce qui est le plus droit — Al-Isrā 9", emoji: "🌱" },
    { arabic: "بَارَكَ اللَّهُ فِيكَ", fr: "Barakallāhu fīk ! Deux Juz — tu avances sur le chemin des Ahl al-Qur'an.", hadith: "« Celui qui récite le Coran et le maîtrise sera avec les nobles anges vertueux. » — Bukhāri & Muslim", verse: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ", verseFr: "Nous avons facilité le Coran pour la méditation — Al-Qamar 17", emoji: "✨" },
    { arabic: "اللَّهُ أَكْبَرُ", fr: "Allāhu Akbar ! 3 Juz — Imam Mālik récitait chaque nuit avec recueillement. Tu suis ses pas.", hadith: "Imam Mālik رحمه الله : « La science la plus noble est la parole d'Allah. »", verse: "كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ", verseFr: "Un Livre béni que Nous t'avons révélé pour qu'on médite Ses versets — Ṣād 29", emoji: "🌿" },
    { arabic: "تَبَارَكَ اللَّهُ", fr: "Tabārakallāh ! 4 Juz terminés — la régularité est l'essence du madhhab malikite.", hadith: "« L'acte le plus aimé d'Allah est celui fait régulièrement, même petit. » — Bukhāri", verse: "وَاتَّبِعُوا أَحْسَنَ مَا أُنزِلَ إِلَيْكُم مِّن رَّبِّكُمْ", verseFr: "Suivez ce qui vous a été révélé de meilleur par votre Seigneur — Az-Zumar 55", emoji: "💎" },
    { arabic: "سُبْحَانَ اللَّهِ", fr: "Subḥānallāh ! Juz 5 — tu es à 1/6 du Khatm. Continue avec confiance.", hadith: "« Chaque lettre du Coran vaut dix bonnes œuvres. » — Tirmidhī", verse: "إِنَّ الَّذِينَ يَتْلُونَ كِتَابَ اللَّهِ وَأَقَامُوا الصَّلَاةَ", verseFr: "Ceux qui récitent le Livre d'Allah… espèrent un commerce qui ne périra pas — Fāṭir 29", emoji: "⭐" },
    { arabic: "الْحَمْدُ لِلَّهِ", fr: "Al-ḥamdu lillāh ! 6 Juz — un cinquième du Coran dans ta poitrine.", hadith: "Ibn Abī Zayd al-Qayrawānī : « La récitation du Coran purifie le cœur. »", verse: "يَا أَيُّهَا النَّاسُ قَدْ جَاءَتْكُم مَّوْعِظَةٌ مِّن رَّبِّكُمْ وَشِفَاءٌ لِّمَا فِي الصُّدُورِ", verseFr: "Une exhortation et une guérison pour ce qui est dans les poitrines — Yūnus 57", emoji: "💫" },
    { arabic: "مَا شَاءَ اللَّهُ", fr: "7 Juz ! Imam Mālik récitait avec lenteur et recueillement — tu honores son héritage.", hadith: "« Récite le Coran avec tristesse, car c'est son état naturel. » — Ibn Māja", verse: "وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا", verseFr: "Récite le Coran lentement et distinctement — Al-Muzzammil 4", emoji: "🌙" },
    { arabic: "اللَّهُ وَلِيُّنَا", fr: "8 Juz — tu progresses magnifiquement. Que Allah te facilite la suite.", hadith: "« La meilleure d'entre vous est celui qui apprend le Coran et l'enseigne. » — Bukhāri", verse: "الَّذِينَ آتَيْنَاهُمُ الْكِتَابَ يَتْلُونَهُ حَقَّ تِلَاوَتِهِ", verseFr: "Ceux à qui Nous avons donné le Livre le récitent comme il se doit — Al-Baqara 121", emoji: "🌟" },
    { arabic: "بِسْمِ اللَّهِ", fr: "9 Juz ! Presque un tiers du chemin. Istiqāma — la constance est la clé !", hadith: "Imam Mālik lisait le Coran entier chaque semaine de sa vie entière.", verse: "فَاسْتَمِسْكْ بِالَّذِي أُوحِيَ إِلَيْكَ إِنَّكَ عَلَىٰ صِرَاطٍ مُّسْتَقِيمٍ", verseFr: "Tiens-toi fermement à ce qui t'est révélé — Az-Zukhruf 43", emoji: "🔥" },
    { arabic: "الْحَمْدُ لِلَّهِ", fr: "10 Juz ! Un tiers du Khatm accompli — les anges se réjouissent avec toi.", hadith: "« Allah élève les gens par ce Livre et abaisse d'autres par lui. » — Muslim", verse: "إِنَّ هَٰذَا الْقُرْآنَ يَقُصُّ عَلَىٰ بَنِي إِسْرَائِيلَ أَكْثَرَ الَّذِي هُمْ فِيهِ يَخْتَلِفُونَ", verseFr: "Ce Coran expose aux enfants d'Israël l'essentiel de leurs divergences — An-Naml 76", emoji: "🏅" },
    { arabic: "مَاشَاءَاللَّه", fr: "11 Juz — chaque page lue est une lumière sur ton visage au Jour dernier.", hadith: "« Celui dont la poitrine est vide du Coran est comme une maison en ruine. » — Tirmidhī", verse: "قُلْ لَّئِنِ اجْتَمَعَتِ الْإِنسُ وَالْجِنُّ عَلَىٰ أَن يَأْتُوا بِمِثْلِ هَٰذَا الْقُرْآنِ لَا يَأْتُونَ بِمِثْلِهِ", verseFr: "Jamais hommes et djinns réunis ne pourraient produire pareil Coran — Al-Isrā 88", emoji: "💡" },
    { arabic: "اللَّهُ أَكْبَرُ", fr: "12 Juz terminés ! 40% du chemin. Ta discipline est une forme d'ibāda.", hadith: "Ibn Abī Zayd al-Qayrawānī : « Fais du Coran ton compagnon de vie. »", verse: "وَإِذَا قُرِئَ الْقُرْآنُ فَاسْتَمِعُوا لَهُ وَأَنصِتُوا لَعَلَّكُمْ تُرْحَمُونَ", verseFr: "Quand on récite le Coran, écoutez-le et restez silencieux — Al-A'rāf 204", emoji: "🎯" },
    { arabic: "سُبْحَانَ اللَّهِ", fr: "13 Juz — presque la moitié ! Tu touches au cœur du Coran.", hadith: "« Le Coran est la corde d'Allah — accroche-toi à elle. » — Hakim", verse: "وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ", verseFr: "Nous faisons descendre du Coran ce qui est guérison et miséricorde — Al-Isrā 82", emoji: "💚" },
    { arabic: "تَبَارَكَ اللَّهُ", fr: "14 Juz ! Un pas de plus vers la moitié du Khatm — waAllāhi c'est immense.", hadith: "« Récite le Coran en 7 nuits au minimum. » — Muwatta Mālik", verse: "إِنَّ الَّذِينَ يَتْلُونَ كِتَابَ اللَّهِ وَأَقَامُوا الصَّلَاةَ وَأَنفَقُوا مِمَّا رَزَقْنَاهُمْ", verseFr: "Ceux qui récitent le Livre d'Allah… espèrent un commerce impérissable — Fāṭir 29", emoji: "🌈" },
    { arabic: "الْحَمْدُ لِلَّهِ", fr: "🏆 MOITIÉ DU KHATM ! Juz 15 accompli — tu es au cœur du Coran. Ya Rabb !", hadith: "« Il n'est pas de jalousie permise sauf deux : celui à qui Allah a donné le Coran et il le récite nuit et jour. » — Bukhāri", verse: "أَفَلَا يَتَدَبَّرُونَ الْقُرْآنَ وَلَوْ كَانَ مِنْ عِندِ غَيْرِ اللَّهِ لَوَجَدُوا فِيهِ اخْتِلَافًا كَثِيرًا", verseFr: "Ne méditent-ils pas sur le Coran ? S'il venait d'un autre qu'Allah, ils y trouveraient beaucoup de contradictions — An-Nisā 82", emoji: "🏆" },
    { arabic: "مَا شَاءَ اللَّهُ", fr: "16 Juz — la seconde moitié commence. Tu es lancé(e), ne t'arrête plus !", hadith: "Imam Mālik : « Persévère, car la régularité efface toutes les lacunes. »", verse: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا وَيَرْزُقْهُ مِنْ حَيْثُ لَا يَحْتَسِبُ", verseFr: "Celui qui craint Allah, Il lui trouvera une issue et le pourvoira d'où il ne s'y attend pas — At-Ṭalāq 2-3", emoji: "🚀" },
    { arabic: "اللَّهُ وَلِيُّنَا", fr: "17 Juz ! Plus qu'à moitié. Chaque page rapproche du Khatm.", hadith: "« Réciter le Coran dans la prière de nuit vaut 70 fois mieux en dehors. » — Dāraquṭnī", verse: "وَلَقَدْ ضَرَبْنَا لِلنَّاسِ فِي هَٰذَا الْقُرْآنِ مِن كُلِّ مَثَلٍ لَّعَلَّهُمْ يَتَذَكَّرُونَ", verseFr: "Nous avons proposé aux hommes dans ce Coran toutes sortes d'exemples — Az-Zumar 27", emoji: "⚡" },
    { arabic: "بَارَكَ اللَّهُ", fr: "18 Juz — 60% du Coran dans ta vie. MāshāAllāh, quelle baraka !", hadith: "Ibn Abī Zayd al-Qayrawānī recommandait de lire le Coran entier chaque mois.", verse: "سَنُرِيهِمْ آيَاتِنَا فِي الْآفَاقِ وَفِي أَنفُسِهِمْ حَتَّىٰ يَتَبَيَّنَ لَهُمْ أَنَّهُ الْحَقُّ", verseFr: "Nous leur montrerons Nos signes dans l'univers et en eux-mêmes — Fuṣṣilat 53", emoji: "🌙" },
    { arabic: "سُبْحَانَ اللَّهِ", fr: "19 Juz ! Deux tiers bientôt atteints. La fin se rapproche avec certitude.", hadith: "« Le Coran est un remède à ce qui est dans les poitrines. » — Coran 10:57", verse: "وَلَوْ أَنَّ قُرْآنًا سُيِّرَتْ بِهِ الْجِبَالُ أَوْ قُطِّعَتْ بِهِ الْأَرْضُ", verseFr: "Si un Coran pouvait déplacer des montagnes ou fendre la terre… c'est celui-ci — Ar-Ra'd 31", emoji: "🌊" },
    { arabic: "اللَّهُ أَكْبَرُ", fr: "20 Juz ! Deux tiers du Coran accomplis — les portes du Ciel s'ouvrent pour toi.", hadith: "« Lis le Coran, car il t'intercédera. » — Muslim", verse: "إِنَّ هَٰذَا لَهُوَ الْقَصَصُ الْحَقُّ ۚ وَمَا مِنْ إِلَٰهٍ إِلَّا اللَّهُ", verseFr: "Ceci est le récit vrai — il n'y a de divinité qu'Allah — Āl 'Imrān 62", emoji: "🎯" },
    { arabic: "تَبَارَكَ اللَّهُ", fr: "21 Juz — 70% du parcours. Tu fais partie des Ahl al-Qur'ān désormais.", hadith: "Imam Mālik pleurait lors de la récitation — laisse le Coran toucher ton cœur.", verse: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", verseFr: "C'est par l'invocation d'Allah que les cœurs se tranquillisent — Ar-Ra'd 28", emoji: "💎" },
    { arabic: "الْحَمْدُ لِلَّهِ", fr: "22 Juz ! Plus que 8 — l'élan de la fin est ta plus grande force.", hadith: "« Beautifie ta voix pour le Coran. » — Abū Dāwūd", verse: "وَإِذَا تُلِيَتْ عَلَيْهِمْ آيَاتُهُ زَادَتْهُمْ إِيمَانًا", verseFr: "Quand Ses versets leur sont récités, cela accroît leur foi — Al-Anfāl 2", emoji: "✨" },
    { arabic: "مَا شَاءَ اللَّهُ", fr: "23 Juz — 77% du Khatm. Tu vois la lumière au bout du tunnel.", hadith: "Ibn Abī Zayd : « La récitation du Coran est le dhikr suprême. »", verse: "وَنَزَّلْنَا عَلَيْكَ الْكِتَابَ تِبْيَانًا لِّكُلِّ شَيْءٍ", verseFr: "Nous avons fait descendre sur toi le Livre comme clarification de toute chose — An-Naḥl 89", emoji: "🌟" },
    { arabic: "بِسْمِ اللَّهِ", fr: "24 Juz ! Plus que 6 — concentre-toi, la victoire est à portée de main !", hadith: "« Complète le Coran, c'est la plus grande réussite du croyant. »", verse: "وَالَّذِينَ جَاهَدُوا فِينَا لَنَهْدِيَنَّهُمْ سُبُلَنَا", verseFr: "Ceux qui luttent pour Nous, Nous les guiderons sur Nos voies — Al-'Ankabūt 69", emoji: "🔥" },
    { arabic: "اللَّهُ وَلِيُّنَا", fr: "25 Juz — 5 restants. Chaque Juz maintenant est une couronne de lumière.", hadith: "« Les parents de celui qui a mémorisé le Coran seront couronnés au Paradis. » — Abū Dāwūd", verse: "وَمَن يُعَظِّمْ شَعَائِرَ اللَّهِ فَإِنَّهَا مِن تَقْوَى الْقُلُوبِ", verseFr: "Quiconque respecte les rites d'Allah, cela procède de la piété des cœurs — Al-Ḥajj 32", emoji: "👑" },
    { arabic: "سُبْحَانَ اللَّهِ", fr: "26 Juz ! Quatre seulement. Tu es dans les derniers rangs — la récompense est immense.", hadith: "Imam Mālik : « Finir le Khatm est parmi les actes les plus méritoires. »", verse: "فَأَمَّا مَن أُوتِيَ كِتَابَهُ بِيَمِينِهِ فَيَقُولُ هَاؤُمُ اقْرَءُوا كِتَابِيَهْ", verseFr: "Celui qui recevra son livre en la droite dira : Tenez, lisez mon livre ! — Al-Ḥāqqa 19", emoji: "🌠" },
    { arabic: "اللَّهُ أَكْبَرُ", fr: "27 Juz — 3 restants ! La volonté d'Allah est avec celui qui persévère.", hadith: "« Allah ne gaspille pas la récompense de celui qui fait du bien. » — Coran 12:90", verse: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", verseFr: "Certes, avec la difficulté vient la facilité — Ash-Sharḥ 6", emoji: "💫" },
    { arabic: "تَبَارَكَ اللَّهُ", fr: "28 Juz ! Deux derniers. Ce que tu vis maintenant, tes ancêtres en rêvaient.", hadith: "Ibn Abī Zayd al-Qayrawānī a terminé des centaines de Khatm — tu marches sur ses pas.", verse: "وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ", verseFr: "Je n'ai créé les djinns et les hommes que pour qu'ils M'adorent — Adh-Dhāriyāt 56", emoji: "🌙" },
    { arabic: "الْحَمْدُ لِلَّهِ", fr: "29 Juz ! Plus qu'UN ! La du'ā de fin de Khatm t'attend — Allah est témoin.", hadith: "« La du'ā à la fin du Khatm est exaucée. » — Authentifié par ad-Dārimī", verse: "فَإِذَا قَرَأْتَ الْقُرْآنَ فَاسْتَعِذْ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ", verseFr: "Lorsque tu lis le Coran, cherche refuge auprès d'Allah contre le Shayṭān — An-Naḥl 98", emoji: "⭐" },
    { arabic: "خَتَمْتَ الْقُرْآنَ", fr: "KHATM ACCOMPLI ! Al-ḥamdu lillāh Rabbil-'ālamīn ! Tu as complété le Livre d'Allah. Que cette récitation soit lumière dans ta tombe, intercession au Jugement, et baraka en ce monde et dans l'au-delà.", hadith: "« Celui qui complète le Coran, les anges font du'ā pour lui. » — Imam Ahmad. Lis maintenant la du'ā de Khatm : اللَّهُمَّ ارْحَمْنِي بِالْقُرْآنِ", verse: "إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ لَهُمْ جَنَّاتُ النَّعِيمِ", verseFr: "Ceux qui ont cru et accompli les bonnes œuvres auront les jardins du Délice — Luqmān 8", emoji: "🏆" },
  ];
  return messages[juz - 1] || messages[0];
}

// ════════════════════════════════════════════════════════════════════
// DONNÉES ADHKAR MALIKITES — Muwatta + Cabinet Maher
// ════════════════════════════════════════════════════════════════════
const ADHKAR_MALIKITES = [
  { id:1, title:"1. Āyat al-Kursī — Verset du Trône",
    arabic:"اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",
    transliteration:"Allāhou Lā Ilāha Illā Houwa Al-Ĥayyou Al-Qayyoum. Lā ta'khoudzouhou sinatoun wa lā nawm. Lahou mā fis-samāwāti wa mā fil-ard. Man dhal-ladhī yashfa'ou 'indahou illā bi-idznih. Ya'lamou mā bayna aydīhim wa mā khalfahum. Wa lā youhīthouna bi-shay'in min 'ilmihi illā bi-mā shā'a. Wasi'a koursiyyouhou s-samāwāti wal-ard. Wa lā ya'oudouhou hifdzouhoumā. Wa houwa l-'Aliyyou l-'Azīm.",
    french:"Allah ! Point de divinité à part Lui, le Vivant. Ni somnolence ni sommeil ne Le saisissent. À Lui appartient tout ce qui est dans les cieux et sur la terre. Son Trône déborde les cieux et la terre. Il est le Très Haut, le Très Grand.",
    benefice:"Protection contre Satan tout au long de la journée et de la nuit.",
    source:"Sourate 2 Al-Baqara v.255 — Bukhāri", repetition:1, category:"MATIN_SOIR" },
  { id:2, title:"2. Al-Ikhlāṣ + Al-Falaq + An-Nās (3×)",
    arabic:"﴿ قُلْ هُوَ اللَّهُ أَحَدٌ ۞ اللَّهُ الصَّمَدُ ۞ لَمْ يَلِدْ وَلَمْ يُولَدْ ۞ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴾\n\n﴿ قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۞ مِن شَرِّ مَا خَلَقَ ۞ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۞ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۞ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴾\n\n﴿ قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۞ مَلِكِ النَّاسِ ۞ إِلَٰهِ النَّاسِ ۞ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۞ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۞ مِنَ الْجِنَّةِ وَالنَّاسِ ﴾",
    transliteration:"Al-Ikhlāṣ : Qul huwa llāhu aḥad — Allāhu ṣ-ṣamad — Lam yalid wa lam yūlad — Wa lam yakun lahū kufuwan aḥad\n\nAl-Falaq : Qul aʿūdhu bi-rabbi l-falaq — Min sharri mā khalaq — Wa min sharri ghāsiqin idhā waqab — Wa min sharri n-naffāthāti fī l-ʿuqad — Wa min sharri ḥāsidin idhā ḥasad\n\nAn-Nās : Qul aʿūdhu bi-rabbi n-nās — Maliki n-nās — Ilāhi n-nās — Min sharri l-waswāsi l-khannās — Alladhī yuwaswisu fī ṣudūri n-nās — Mina l-jinnati wa-n-nās",
    french:"Al-Ikhlāṣ : Dis : Il est Allah, Unique. Allah, le Seul à être imploré. Il n'a pas engendré et n'a pas été engendré. Et nul n'est égal à Lui.\n\nAl-Falaq : Dis : Je cherche refuge auprès du Seigneur de l'aurore, contre le mal de ce qu'Il a créé, contre le mal de l'obscurité quand elle s'étend, contre le mal de celles qui soufflent sur les nœuds, contre le mal de l'envieux quand il envie.\n\nAn-Nās : Dis : Je cherche refuge auprès du Seigneur des hommes, du Roi des hommes, de la Divinité des hommes, contre le mal du tentateur furtif, qui souffle le mal dans les poitrines des hommes, qu'il soit parmi les djinns ou parmi les hommes.",
    benefice:"Celui qui dit 3 fois ces sourates matin et soir, cela lui suffira et le protégera contre toute chose.",
    source:"Abū Dāwūd, at-Tirmidhī — Sourates 112, 113, 114", repetition:3, category:"MATIN_SOIR" },
  { id:3, title:"3. Aṣbaḥnā (matin) / Amsaynā (soir)",
    arabic:"أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration:"Asbahna wa asbahal-mulku lillāh, wal-hamdu lillāh, lā ilāha illallāhu wahdahu lā sharīka lah, lahul-mulku wa lahul-hamdu wa huwa alā kulli shayin qadīr",
    french:"Nous voilà au matin (soir) et le règne appartient à Allah. Louange à Allah. Il n'y a de divinités sauf Allah Seul, sans associés. À Lui la royauté, à Lui la louange et Il est capable de toute chose.",
    benefice:"Invocation authentique du matin et du soir.",
    source:"Muwatta Mālik, Kitab al-Nida", repetition:1, category:"MATIN_SOIR" },
  { id:4, title:"4. Rabbi assalouka khayra… (matin/soir)",
    arabic:"رَبِّ أَسْأَلُكَ خَيْرَ مَا فِي هَذَا الْيَوْمِ وَخَيْرَ مَا بَعْدَهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِي هَذَا الْيَوْمِ وَشَرِّ مَا بَعْدَهُ، رَبِّ أَعُوذُ بِكَ مِنَ الْكَسَلِ وَسُوءِ الْكِبَرِ، رَبِّ أَعُوذُ بِكَ مِنْ عَذَابٍ فِي النَّارِ وَعَذَابٍ فِي الْقَبْرِ",
    transliteration:"Rabbi assalouka khayra ma fi hadha el youmi wa khayra ma bahdah. Wa a'houdoubika min charri ma fi hada el youmi wa charri ma bahdah. Rabbi a'houdou bika min al kassali wa soûilkibar. Rabbi ahoudou bika min adhabine fi nari wa hadabine fil kabr.",
    french:"Seigneur ! Je te demande le bien de ce jour et le bien qui vient après. Je me mets sous ta protection contre le mal de ce jour et le mal qui vient après. Protection contre la paresse, les maux de la vieillesse, le châtiment de l'enfer et les tourments de la tombe.",
    benefice:"Protection contre le mal de la journée et de ce qui vient après.",
    source:"Muslim, n°2723 — matin et soir", repetition:1, category:"MATIN_SOIR" },
  { id:5, title:"5. Allāhumma bika aṣbaḥnā… (matin/soir)",
    arabic:"اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِلَيْكَ النُّشُورُ",
    transliteration:"Allāhumma bika asbahna wa bika amsayna, wa bika nahya wa bika namutu wa ilayka n-nushūr (le soir : ...wa ilayka l-masīr)",
    french:"Ô Seigneur ! C'est par Toi que nous nous retrouvons au matin (soir). C'est par Toi que nous vivons et mourons et c'est vers Toi que se fera la résurrection.",
    benefice:"Invocation prophétique du matin et du soir.",
    source:"At-Tirmidhī, n°3391 — matin et soir", repetition:1, category:"MATIN_SOIR" },
  { id:6, title:"6. Sayyid al-Istighfār",
    arabic:"اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَىٰ عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    transliteration:"Allāhumma anta rabbī lā ilāha illā anta, khalaqtanī wa anā abduk, wa anā alā ahdika wa wadika mastatatu, audhu bika min sharri mā sanatu, abūu laka bi-nimmatika alayya wa abūu bi-dhanbī, faghfir lī fa-innahu lā yaghfiru dh-dhunūba illā ant",
    french:"Ô Seigneur ! Tu es mon Dieu. Il n'y a de divinités que Toi. Tu m'as créé et je suis Ton serviteur. Je me conforme à mon engagement. Je me mets sous Ta protection contre le mal que j'ai commis. Je reconnais Ton bienfait et mon péché. Pardonne-moi car il n'y a que Toi qui pardonnes.",
    benefice:"Celui qui le dit le matin et le soir avec conviction et meurt en ce jour entre au paradis.",
    source:"Bukhāri, n°6306 — matin et soir", repetition:1, category:"MATIN_SOIR" },
  { id:7, title:"7. Allāhumma innī aṣbaḥtu ushhhiduka… (4×)",
    arabic:"اللَّهُمَّ إِنِّي أَصْبَحْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّداً عَبْدُكَ وَرَسُولُكَ",
    transliteration:"Allāhumma innī asbahtu ushhiduka wa ushhidu hamalata arshika, wa malāikataka wa jamīa khalqika, annaka anta Allāhu lā ilāha illā anta wahdaka lā sharīka lak, wa anna Muhammadan abduka wa rasūluk",
    french:"Ô Seigneur ! Me voici au matin, je Te prends à témoin et prends à témoin les porteurs de Ton Trône, Tes anges et toutes Tes créatures : Tu es Allah, il n'y a de divinité que Toi, Seul, sans associé. Et Muhammad est Ton serviteur et Ton messager.",
    benefice:"Celui qui dit cette invocation 4 fois le matin ou le soir, Allah l'affranchira de l'enfer.",
    source:"Abū Dāwūd, n°5069 — 4× matin et soir", repetition:4, category:"MATIN_SOIR" },
  { id:8, title:"8. Allāhumma mā aṣbaḥa bī min niʿmah…",
    arabic:"اللَّهُمَّ مَا أَصْبَحَ بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ، فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ",
    transliteration:"Allāhumma mā asbaha bī min nimatin aw bi-ahadin min khalqika, fa-minka wahdaka lā sharīka lak, falakal-hamdu wa lakashshukr",
    french:"Ô Seigneur ! En ce jour, tout bienfait qui m'arrive ou arrive à toute créature provient de Toi l'Unique, sans associé. À Toi la louange et le remerciement.",
    benefice:"Celui qui le récite au matin aura accompli le devoir de montrer sa reconnaissance pour la journée.",
    source:"Abū Dāwūd, n°5073 — matin et soir", repetition:1, category:"MATIN_SOIR" },
  { id:9, title:"9. Allāhumma āfinī fī badanī… (3×)",
    arabic:"اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ. اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْكُفْرِ وَالْفَقْرِ، وَأَعُوذُ بِكَ مِنْ عَذَابِ الْقَبْرِ، لَا إِلَهَ إِلَّا أَنْتَ",
    transliteration:"Allāhumma āfinī fī badanī, Allāhumma āfinī fī samī, Allāhumma āfinī fī basarī, lā ilāha illā ant. Allāhumma innī audhu bika minal-kufri, wal-faqri, wa audhu bika min adhābil-qabri, lā ilāha illā ant",
    french:"Ô Seigneur ! Accorde-moi la santé dans mon corps, dans mon ouïe, dans ma vue. Je cherche protection contre la mécréance, la pauvreté et les tourments de la tombe.",
    benefice:"Protection de la santé du corps, de l'ouïe et de la vue.",
    source:"Abū Dāwūd, n°5090 — 3× matin et soir", repetition:3, category:"MATIN_SOIR" },
  { id:10, title:"10. Hasbiyallāhu lā ilāha illā huw… (7×)",
    arabic:"حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ",
    transliteration:"Hasbiyallāhu lā ilāha illā huwa alayhi tawakkaltu wa huwa rabbul-arshil-azīm",
    french:"Allah me suffit, il n'y a de divinité que Lui. C'est en Lui que je place ma confiance et Il est le Seigneur du Trône immense.",
    benefice:"Celui qui le dit 7 fois le matin et le soir, Allah le protégera dans la vie d'ici-bas et dans l'au-delà.",
    source:"Abū Dāwūd, n°5081 — 7× matin et soir", repetition:7, category:"MATIN_SOIR" },
  { id:11, title:"11. Allāhumma innī as'aluka al-afwa…",
    arabic:"اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ، اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي دِينِي وَدُنْيَايَ وَأَهْلِي وَمَالِي، اللَّهُمَّ اسْتُرْ عَوْرَاتِي وَآمِنْ رَوْعَاتِي",
    transliteration:"Allāhumma innī asaluka al-afwa wal-āfiyata fid-dunyā wal-ākhirah. Allāhumma innī asaluka al-afwa wal-āfiyata fī dīnī wa dunyāya wa ahlī wa mālī. Allāhummastur awrātī wa āmin rawātī. Allāhumma hfadznī min bayni yadayya wa min khalfī wa 'an yamīnī wa 'an shimālī wa min fawqī. Wa a'oudhu bi-'adhamatika an ughtāla min tahtī.",
    french:"Ô Seigneur ! Je Te demande le pardon et la santé dans cette vie et dans l'au-delà. Cache mes défauts et mets-moi à l'abri de mes effrois. Protège-moi de toutes les directions.",
    benefice:"Protection complète de toutes les directions.",
    source:"Abū Dāwūd, n°5074 — matin et soir", repetition:1, category:"MATIN_SOIR" },
  { id:12, title:"12. Allāhumma ālima l-ghayb…",
    arabic:"اللَّهُمَّ عَالِمَ الْغَيْبِ وَالشَّهَادَةِ فَاطِرَ السَّمَاوَاتِ وَالْأَرْضِ رَبَّ كُلِّ شَيْءٍ وَمَلِيكَهُ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَعُوذُ بِكَ مِنْ شَرِّ نَفْسِي وَمِنْ شَرِّ الشَّيْطَانِ وَشِرْكِهِ",
    transliteration:"Allāhumma ālimal-ghaybi wash-shahādati fātiras-samāwāti wal-ardi, rabba kulli shay'in wa malīkah, ashhadu an lā ilāha illā ant. A'oudhu bika min sharri nafsī wa min sharrish-shaytāni wa shirkihi. Wa an aqtarifa 'alā nafsī sū'an aw ajurrahu ilā muslim.",
    french:"Ô Seigneur ! Connaisseur de l'invisible et du visible, créateur des cieux et de la terre. J'atteste qu'il n'y a de divinité que Toi. Je me mets sous Ta protection contre le mal de mon âme, du diable et son polythéisme.",
    benefice:"Protection contre les maux de l'âme et du diable.",
    source:"At-Tirmidhī, n°3529 — matin et soir", repetition:1, category:"MATIN_SOIR" },
  { id:13, title:"13. Bismillāhil-ladhī lā yaḍurru… (3×)",
    arabic:"بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ",
    transliteration:"Bismillāhil-ladhī lā yadurru maasmihī shaun fil-ardi wa lā fis-samāi, wa huwas-samīul-alīm",
    french:"Au nom d'Allah, nul ne peut nuire en présence de Son Nom ni sur terre ni dans le ciel et Il est l'Audient et l'Omniscient.",
    benefice:"Celui qui dira 3 fois le matin et le soir, nul mal ne le touchera.",
    source:"Abū Dāwūd, n°5088 — 3× matin et soir", repetition:3, category:"MATIN_SOIR" },
  { id:14, title:"14. Radītu billāhi rabban… (3×)",
    arabic:"رَضِيتُ بِاللَّهِ رَبًّا وَبِالْإِسْلَامِ دِينًا وَبِمُحَمَّدٍ نَبِيًّا",
    transliteration:"Radītu billāhi rabban wa bil-islāmi dīnan wa bi-muhammadin nabiyyan",
    french:"J'ai agréé Allah comme mon Seigneur, l'islam comme ma religion et Muhammad (sws) comme mon prophète.",
    benefice:"Celui qui le dit 3 fois matin et soir, Allah se fera un devoir de lui accorder Son agrément.",
    source:"Abū Dāwūd, n°5072 — 3× matin et soir", repetition:3, category:"MATIN_SOIR" },
  { id:15, title:"15. Yā Hayyu Yā Qayyūm bi-rahmatika astaghīth…",
    arabic:"يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ",
    transliteration:"Yā hayyu yā qayyūmu bi-rahmatika astaghīth, aslih lī shānī kullahu, wa lā takilnī ilā nafsī tarfata ayn",
    french:"Ô le Vivant, Celui qui veille éternellement ! J'implore secours auprès de Ta miséricorde. Améliore ma situation et ne me laisse pas à mon propre sort ne serait-ce le temps d'un clin d'oeil.",
    benefice:"Protection et amélioration de la situation du croyant.",
    source:"Al-Hākim, n°2000 — matin et soir", repetition:1, category:"MATIN_SOIR" },
  { id:16, title:"16. Asbahna wa asbahal-mulku lillāh…",
    arabic:"أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ رَبِّ الْعَالَمِينَ، اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَ هَذَا الْيَوْمِ فَتْحَهُ وَنَصْرَهُ وَنُورَهُ وَبَرَكَتَهُ وَهُدَاهُ، وَأَعُوذُ بِكَ مِنْ شَرِّ مَا فِيهِ وَشَرِّ مَا بَعْدَهُ",
    transliteration:"Asbahna wa asbahal-mulku lillāhi rabbil-ālamīn. Allāhumma innī asaluka khayra hādhal-yawmi: fathahou wa nasrahou wa nūrahou wa barakatahu wa hudāh. Wa a'oudhu bika min sharri mā fīhi wa sharri mā ba'dahou.",
    french:"Nous voilà au matin et le règne appartient à Allah le Seigneur de l'univers. Ô Seigneur ! Je Te demande le bien de ce jour : conquêtes, victoires, lumières, bénédiction et guidée.",
    benefice:"Demande du bien de la journée et protection contre ses maux.",
    source:"Abū Dāwūd — matin et soir", repetition:1, category:"MATIN_SOIR" },
  { id:17, title:"17. Asbahna alā fitrātil-islām…",
    arabic:"أَصْبَحْنَا عَلَى فِطْرَةِ الْإِسْلَامِ، وَعَلَى كَلِمَةِ الْإِخْلَاصِ، وَعَلَى دِينِ نَبِيِّنَا مُحَمَّدٍ، وَعَلَى مِلَّةِ أَبِينَا إِبْرَاهِيمَ حَنِيفاً مُسْلِماً وَمَا كَانَ مِنَ الْمُشْرِكِينَ",
    transliteration:"Asbahna alā fitrātil-islāmi, wa alā kalimatil-ikhlāsi, wa alā dīni nabiyyinā Muhammadin, wa alā millati abīnā Ibrāhīma hanīfan musliman wa mā kāna minal-mushrikīn",
    french:"Nous voici au matin en conformité avec la saine disposition qu'est l'Islam, avec la parole du monothéisme, avec la religion de notre Prophète Muhammad (sws) et sur la voie de notre père Ibrāhīm, soumis à Allah.",
    benefice:"Affirmation de la foi et de l'appartenance à l'Islam.",
    source:"Ahmad, n°14248 — matin et soir", repetition:1, category:"MATIN_SOIR" },
  { id:18, title:"18. Subhān Allāhi wa bihamdih (100×)",
    arabic:"سُبْحَانَ اللَّهِ وَبِحَمْدِهِ",
    transliteration:"Subhānallāhi wa bihamdih",
    french:"Gloire et louange sont à Allah.",
    benefice:"Celui qui dit 100 fois dans la journée aura ses péchés effacés même s'ils sont aussi nombreux que l'écume de la mer. (Bukhāri n°6405, Muslim n°2691)",
    source:"Bukhāri n°6405 — Muslim n°2691 — 100× matin et soir", repetition:100, category:"MATIN_SOIR" },
  { id:19, title:"19. Lā ilāha illallāhu wahdahu… (100×)",
    arabic:"لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ",
    transliteration:"Lā ilāha illallāhu wahdahu lā sharīka lah, lahul-mulku wa lahul-hamdu wa huwa alā kulli shayin qadīr",
    french:"Il n'y a de divinité qu'Allah, Seul, sans associé. À Lui la royauté et la louange, et Il est capable de toute chose.",
    benefice:"Récompense de celui qui a affranchi 10 esclaves. 100 bonnes actions inscrites, 100 péchés effacés. Protection contre Satan.",
    source:"Bukhāri n°3293 — Muslim n°2691 — 100× matin et soir", repetition:100, category:"MATIN_SOIR" },
  { id:20, title:"20. Subhānallāhi wa bihamdih, adada khalqih… (3×)",
    arabic:"سُبْحَانَ اللَّهِ وَبِحَمْدِهِ عَدَدَ خَلْقِهِ، وَرِضَا نَفْسِهِ، وَزِنَةَ عَرْشِهِ، وَمِدَادَ كَلِمَاتِهِ",
    transliteration:"Subhānallāhi wa bihamdih, adada khalqih, wa ridā nafsih, wa zinata arshih, wa midāda kalimātih",
    french:"Gloire et louange à Allah autant de fois que l'univers compte de créatures, autant pour Le satisfaire, égal au poids de Son Trône et au nombre de Ses paroles.",
    benefice:"Cette formule surpasse en mérite toutes les autres formes de dhikr.",
    source:"Muslim, n°2726 — 3× le matin", repetition:3, category:"MATIN" },
  { id:21, title:"21. Allāhumma innī asaluka ilman nāfian…",
    arabic:"اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْماً نَافِعاً، وَرِزْقاً طَيِّباً، وَعَمَلاً مُتَقَبَّلاً",
    transliteration:"Allāhumma innī asaluka ilman nāfian, wa rizqan tayyiban, wa amalan mutaqabbalan",
    french:"Ô Seigneur ! Je Te demande un savoir utile, une bonne subsistance et des oeuvres agréées par Toi.",
    benefice:"Demande des trois fondements : savoir, provision et actes agréés.",
    source:"Ibn Mājah, n°925 — le matin", repetition:1, category:"MATIN" },
  { id:22, title:"22. Astaghfirullāha wa atūbu ilayh (100×)",
    arabic:"أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ",
    transliteration:"Astaghfirullāha wa atūbu ilayh",
    french:"Je demande pardon à Allah et je me repens à Lui.",
    benefice:"Quiconque persévère dans l'istighfār, Allah lui accordera une issue lors de chaque difficulté, un soulagement à toute inquiétude et lui accordera sa subsistance par des moyens inattendus.",
    source:"Abū Dāwūd, n°1518 — 100× matin et soir", repetition:100, category:"MATIN_SOIR" },
  { id:23, title:"23. Allāhumma salli wa sallim alā nabiyyinā Muhammad (100×)",
    arabic:"اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَىٰ نَبِيِّنَا مُحَمَّدٍ",
    transliteration:"Allāhumma salli wa sallim alā nabiyyinā Muhammad",
    french:"Ô Seigneur ! Prie et salue sur notre prophète Muhammad (sws).",
    benefice:"Celui qui prie sur le Prophète une fois, Allah le bénit dix fois, lui efface dix péchés et l'élève de dix degrés.",
    source:"Muslim, n°408 — 100× matin et soir", repetition:100, category:"MATIN_SOIR" },
  { id:24, title:"Après le Fard — Istighfar Malikite",
    arabic:"أَسْتَغْفِرُ اللَّهَ الْعَظِيمَ الَّذِي لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ وَأَتُوبُ إِلَيْهِ",
    transliteration:"Astaghfirullāhal-azīmal-ladhī lā ilāha illā huwal-hayyul-qayyūmu wa atūbu ilayh",
    french:"Je demande pardon à Allah le Sublime — le Vivant, le Subsistant — et je me repens à Lui.",
    source:"At-Tirmidhī — 3× après chaque Fard selon le madhhab malikite", repetition:3, category:"PRIERE" },
  { id:25, title:"Tasbīh après la prière — méthode Mālik",
    arabic:"سُبْحَانَ اللَّهِ ۞ الْحَمْدُ لِلَّهِ ۞ اللَّهُ أَكْبَرُ",
    transliteration:"Subhānallāh (33×) — Al-hamdu lillāh (33×) — Allāhu akbar (33×) — puis : Lā ilāha illallāhu wahdahu lā sharīka lahu, lahul-mulku wa lahul-hamdu wa huwa 'alā kulli shay'in qadīr.",
    french:"Gloire à Allah (33×) — Toute louange à Allah (33×) — Allah est le Plus Grand (33×) — puis : Il n'y a de divinité qu'Allah, Seul, sans associé. À Lui la royauté, à Lui la louange, et Il est Omnipotent.",
    source:"Muwatta Mālik, Kitab Qasr as-Salat", repetition:100, category:"PRIERE" },
];

const QURAN_SURAHS = Array.from({ length: 114 }, (_, i) => ({
  number: i + 1,
  name: ["Al-Fātiḥa","Al-Baqara","Āl 'Imrān","An-Nisā","Al-Mā'ida","Al-An'ām","Al-A'rāf","Al-Anfāl","At-Tawba","Yūnus","Hūd","Yūsuf","Ar-Ra'd","Ibrāhīm","Al-Ḥijr","An-Naḥl","Al-Isrā","Al-Kahf","Maryam","Ṭā-Hā","Al-Anbiyā","Al-Ḥajj","Al-Mu'minūn","An-Nūr","Al-Furqān","Ash-Shu'arā","An-Naml","Al-Qaṣaṣ","Al-'Ankabūt","Ar-Rūm","Luqmān","As-Sajda","Al-Aḥzāb","Saba","Fāṭir","Yā-Sīn","Aṣ-Ṣāffāt","Ṣād","Az-Zumar","Ghāfir","Fuṣṣilat","Ash-Shūrā","Az-Zukhruf","Ad-Dukhān","Al-Jāthiya","Al-Aḥqāf","Muḥammad","Al-Fatḥ","Al-Ḥujurāt","Qāf","Adh-Dhāriyāt","Aṭ-Ṭūr","An-Najm","Al-Qamar","Ar-Raḥmān","Al-Wāqi'a","Al-Ḥadīd","Al-Mujādila","Al-Ḥashr","Al-Mumtaḥina","Aṣ-Ṣaff","Al-Jumu'a","Al-Munāfiqūn","At-Taghābun","Aṭ-Ṭalāq","At-Taḥrīm","Al-Mulk","Al-Qalam","Al-Ḥāqqa","Al-Ma'ārij","Nūḥ","Al-Jinn","Al-Muzzammil","Al-Muddaththir","Al-Qiyāma","Al-Insān","Al-Mursalāt","An-Naba","An-Nāzi'āt","'Abasa","At-Takwīr","Al-Infiṭār","Al-Muṭaffifīn","Al-Inshiqāq","Al-Burūj","Aṭ-Ṭāriq","Al-A'lā","Al-Ghāshiya","Al-Fajr","Al-Balad","Ash-Shams","Al-Layl","Aḍ-Ḍuḥā","Ash-Sharḥ","At-Tīn","Al-'Alaq","Al-Qadr","Al-Bayyina","Az-Zalzala","Al-'Ādiyāt","Al-Qāri'a","At-Takāthur","Al-'Aṣr","Al-Humaza","Al-Fīl","Quraysh","Al-Mā'ūn","Al-Kawthar","Al-Kāfirūn","An-Naṣr","Al-Masad","Al-Ikhlāṣ","Al-Falaq","An-Nās"][i],
  arabic: ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"][i],
  verses: [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,59,37,37,31,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,44,29,37,31,36,44,43,31,7,29,30,20,21,12,5,11,8,3,5,4,6,3,11,4,5,5,4,5,6,3,5,4][i],
  juz: [1,1,2,3,4,5,6,7,8,9,10,10,12,12,13,14,15,15,16,16,17,17,18,18,18,19,19,20,20,21,21,21,21,22,22,22,23,23,23,24,24,25,25,25,25,26,26,26,26,26,27,27,27,27,27,27,27,28,28,28,28,28,28,28,28,28,29,29,29,29,29,29,29,29,29,29,29,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30][i],
}));

// ════════════════════════════════════════════════════════════════════
// STORAGE HELPERS
// ════════════════════════════════════════════════════════════════════
function storage(key, defaultVal) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : defaultVal; }
  catch { return defaultVal; }
}
function storageSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ════════════════════════════════════════════════════════════════════
// HELPERS — Planning quotidien
// ════════════════════════════════════════════════════════════════════
const SURAH_STARTS = (() => {
  let c = 0, a = [];
  for (const s of QURAN_SURAHS) { a.push(c); c += s.verses; }
  return a;
})();
const TOTAL_VERSES = 6236;

function verseFromGlobal(n) {
  let lo = 0, hi = 113;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (SURAH_STARTS[mid] + QURAN_SURAHS[mid].verses < n) lo = mid + 1;
    else hi = mid;
  }
  return { surah: lo + 1, verse: n - SURAH_STARTS[lo] };
}

function generateDailyPlan(startISO, endISO) {
  const totalDays = Math.max(1, Math.ceil((new Date(endISO) - new Date(startISO)) / 86400000));
  return Array.from({ length: totalDays }, (_, d) => {
    const sPos = Math.floor((d / totalDays) * TOTAL_VERSES) + 1;
    const ePos = d === totalDays - 1 ? TOTAL_VERSES : Math.floor(((d + 1) / totalDays) * TOTAL_VERSES);
    const date = new Date(startISO); date.setDate(date.getDate() + d);
    const sv = verseFromGlobal(sPos), ev = verseFromGlobal(ePos);
    return {
      day: d + 1,
      date: date.toISOString().slice(0, 10),
      startSurah: sv.surah, startVerse: sv.verse,
      endSurah: ev.surah, endVerse: ev.verse,
      verseCount: ePos - sPos + 1,
    };
  });
}

// ════════════════════════════════════════════════════════════════════
// HOOKS
// ════════════════════════════════════════════════════════════════════
function useBookmarks(type) {
  const KEY = `bookmarks_${type}_v3`;
  const [bookmarks, setBookmarks] = useState(() => storage(KEY, []));
  const save = useCallback((bm) => {
    setBookmarks(prev => {
      const now = new Date();
      const date = now.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
      const time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      const next = [{ ...bm, id: now.getTime(), date, time, datetime: `${date} à ${time}`, type }, ...prev].slice(0, 50);
      storageSet(KEY, next);
      return next;
    });
  }, [KEY, type]);
  const remove = useCallback((id) => {
    setBookmarks(prev => { const next = prev.filter(b => b.id !== id); storageSet(KEY, next); return next; });
  }, [KEY]);
  const resetAll = useCallback(() => { storageSet(KEY, []); setBookmarks([]); }, [KEY]);
  return { bookmarks, save, remove, resetAll };
}

function useFridayKahf() {
  const KEY = "kahf_fridays_v1";
  const [readFridays, setReadFridays] = useState(() => storage(KEY, []));
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const weekNum = Math.ceil(((today - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  const yearWeek = `${today.getFullYear()}-W${String(weekNum).padStart(2,'0')}`;
  const isReadThisWeek = readFridays.includes(yearWeek);
  const markRead = useCallback(() => {
    setReadFridays(prev => {
      if (prev.includes(yearWeek)) return prev;
      const next = [...prev, yearWeek].slice(-52);
      storageSet(KEY, next);
      return next;
    });
  }, [yearWeek]);
  return { readFridays, isReadThisWeek, markRead, totalFridays: readFridays.length };
}

function useJuzProgram() {
  const [program, setProgram] = useState(() => storage("juz_program_v3", {
    active: false, startDate: null, endDate: null, completed: {},
  }));
  const [dailyCompleted, setDailyCompleted] = useState(() => storage("daily_plan_v1", {}));
  const markDayDone = useCallback((dateStr) => {
    setDailyCompleted(prev => {
      const next = { ...prev, [dateStr]: !prev[dateStr] };
      storageSet("daily_plan_v1", next);
      return next;
    });
  }, []);
  const start = useCallback(({ startDateISO, endDateISO }) => {
    storageSet("daily_plan_v1", {}); setDailyCompleted({});
    const p = { active: true, startDate: startDateISO, endDate: endDateISO, completed: {} };
    setProgram(p); storageSet("juz_program_v3", p);
  }, []);
  const reset = useCallback(() => {
    storageSet("daily_plan_v1", {}); setDailyCompleted({});
    const p = { active: false, startDate: null, endDate: null, completed: {} };
    setProgram(p); storageSet("juz_program_v3", p);
  }, []);
  const manualComplete = useCallback((juzNum) => {
    setProgram(prev => {
      const already = prev.completed[juzNum];
      const updated = { ...prev.completed };
      if (already) { delete updated[juzNum]; }
      else { updated[juzNum] = { date: new Date().toISOString(), manual: true }; }
      const next = { ...prev, completed: updated };
      storageSet("juz_program_v3", next); return next;
    });
  }, []);
  const completedCount = Object.keys(program.completed).length;
  const remaining = 30 - completedCount;
  const now = Date.now();
  const startMs = program.startDate ? new Date(program.startDate).getTime() : now;
  const endMs   = program.endDate   ? new Date(program.endDate).getTime()   : now + 30 * 86400000;
  const daysPassed   = Math.max(1, Math.floor((now - startMs) / 86400000) + 1);
  const daysTotal    = Math.max(1, Math.ceil((endMs - startMs) / 86400000));
  const daysLeft     = Math.max(1, Math.ceil((endMs - now) / 86400000));
  const dailyGoalJuz = Math.max(1, Math.ceil(remaining / daysLeft));
  const expectedJuz  = Math.min(30, Math.ceil((daysPassed / daysTotal) * 30));
  const onTrack      = completedCount >= expectedJuz;
  const progressPct  = Math.round((completedCount / 30) * 100);
  const behindBy = Math.max(0, expectedJuz - completedCount);
  return {
    program, start, reset, manualComplete,
    completedCount, remaining, daysPassed, daysTotal, daysLeft,
    dailyGoalJuz, expectedJuz, onTrack, progressPct, behindBy,
    dailyCompleted, markDayDone,
  };
}

function useSurahProgress() {
  const [checked, setChecked] = useState(() => storage("surah_checked_v2", {}));
  const toggle = useCallback((id) => {
    setChecked(prev => { const next = { ...prev, [id]: !prev[id] }; storageSet("surah_checked_v2", next); return next; });
  }, []);
  const counts = useMemo(() => ({ surahChecked: Object.values(checked).filter(Boolean).length }), [checked]);
  return { checked, toggle, counts };
}

// ════════════════════════════════════════════════════════════════════
// COMPOSANT — Modal Encouragement
// ════════════════════════════════════════════════════════════════════
const CONFETTI_COLORS = ["#F59E0B","#10B981","#3B82F6","#EC4899","#A78BFA","#FBBF24"];
const confettiParticles = Array.from({ length: 20 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 4 + Math.random() * 6, delay: Math.random() * 0.8,
  duration: 1.2 + Math.random() * 0.8,
}));

function EncouragementModal({ juz, onClose }) {
  if (!juz) return null;
  const enc = juz.encouragement;
  const isKhatm = juz.number === 30;
  const isMilestone = [10, 15, 20, 25, 30].includes(juz.number);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.75, y: 50, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className={`relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border ${
          isKhatm ? "border-yellow-500/50" : isMilestone ? "border-purple-500/40" : "border-emerald-500/30"
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute inset-0 ${
            isKhatm ? "bg-gradient-to-br from-yellow-950 via-amber-900/90 to-orange-950"
            : isMilestone ? "bg-gradient-to-br from-purple-950 via-indigo-900/90 to-slate-900"
            : "bg-gradient-to-br from-emerald-950 via-teal-900/90 to-slate-900"
          }`} />
          {confettiParticles.map(p => (
            <motion.div key={p.id} className="absolute rounded-full"
              style={{ width: p.size, height: p.size, background: p.color, left: `${p.x}%`, top: `${p.y}%` }}
              animate={{ y: [0,-30,30,-15,0], x: [0,10,-10,5,0], opacity: [0.8,1,0.5,0.9,0.3], scale: [1,1.5,0.8,1.2,0] }}
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, repeatDelay: 1.5 }}
            />
          ))}
          <motion.div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full border ${isKhatm ? "border-yellow-500/20" : "border-emerald-500/15"}`}
            animate={{ scale: [1,1.3,1], opacity: [0.3,0.6,0.3] }} transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div className={`absolute -bottom-20 -left-20 w-48 h-48 rounded-full border ${isKhatm ? "border-amber-400/15" : "border-teal-500/15"}`}
            animate={{ scale: [1.2,1,1.2], opacity: [0.2,0.5,0.2] }} transition={{ duration: 4, repeat: Infinity }}
          />
        </div>
        <div className="relative z-10 p-7">
          <div className="flex justify-between items-center mb-5">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isKhatm ? "bg-yellow-500/20 border-yellow-500/40 text-yellow-300" : "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
            }`}>Juz {juz.number} / 30</span>
            <motion.span animate={{ rotate: [0,15,-15,10,0], scale: [1,1.3,1.1,1.2,1] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }} className="text-4xl">
              {enc.emoji || (isKhatm ? "🏆" : "✨")}
            </motion.span>
          </div>
          <div className={`p-4 rounded-2xl mb-4 border text-center ${isKhatm ? "bg-yellow-900/30 border-yellow-600/20" : "bg-white/5 border-white/10"}`}>
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-2 font-semibold">Verset du Coran</p>
            <p className="text-xl font-serif leading-loose mb-2 text-white" dir="rtl" lang="ar">{enc.verse}</p>
            <p className="text-xs text-slate-400 italic">{enc.verseFr}</p>
          </div>
          <div className="text-center mb-4">
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className={`text-2xl font-serif mb-2 ${isKhatm ? "text-yellow-300" : isMilestone ? "text-purple-300" : "text-emerald-300"}`} dir="rtl">
              {enc.arabic}
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-white font-semibold leading-relaxed text-sm">{enc.fr}
            </motion.p>
          </div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className={`p-4 rounded-2xl text-xs italic text-left border mb-5 ${
              isKhatm ? "bg-amber-900/30 border-amber-700/25 text-amber-200" : "bg-emerald-900/25 border-emerald-700/20 text-emerald-200"
            }`}>
            <p className="font-semibold text-xs uppercase tracking-wider mb-1.5 not-italic opacity-60">Hadith & Tradition malikite</p>
            {enc.hadith}
          </motion.div>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onClose}
            className={`w-full py-3.5 rounded-2xl font-bold text-white shadow-lg transition-all ${
              isKhatm ? "bg-gradient-to-r from-yellow-500 to-amber-500 hover:shadow-yellow-500/30"
              : isMilestone ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-purple-500/30"
              : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:shadow-emerald-500/30"
            } hover:shadow-xl`}>
            {isKhatm ? "🤲 Allāhumma taqabbal — Āmīn" : "Al-ḥamdu lillāh — Continuer"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════
// COMPOSANT — Programme Juz
// ════════════════════════════════════════════════════════════════════
function DayReader({ day, onClose, onMarkDone, onNavigateToRange }) {
  const SAVE_KEY = `day_progress_${day.date}`;
  const [checkedVerses, setCheckedVerses] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || "[]"); } catch { return []; }
  });
  const [elapsed, setElapsed] = useState(0);
  const [showTranslit, setShowTranslit] = useState(false);
  const timerRef = useRef(null);
  const verseRefs = useRef({});
  const scrollRef = useRef(null);

  // Inject tajweed CSS once
  useEffect(() => {
    if (!document.getElementById("tajweed-css")) {
      const s = document.createElement("style");
      s.id = "tajweed-css";
      s.textContent = `
        tajweed[class*="ham_wasl"],tajweed[class*="slnt"],tajweed[class*="laam_shamsiyya"]{color:#AAAAAA}
        tajweed[class*="madda_normal"]{color:#537FFF}
        tajweed[class*="madda_permissible"]{color:#4BC8F0}
        tajweed[class*="madda_necessary"]{color:#2B4FBB}
        tajweed[class*="madda_obligatory"]{color:#3B6FDD}
        tajweed[class*="qalaqah"]{color:#DD8000}
        tajweed[class*="ikhafa"]{color:#D070A0}
        tajweed[class*="idgham_ghunnah"]{color:#169200}
        tajweed[class*="idgham_wo_ghunnah"]{color:#2E8B57}
        tajweed[class*="idgham_mutajanisayn"]{color:#33AA55}
        tajweed[class*="idgham_mutaqaribayn"]{color:#44BB66}
        tajweed[class*="iqlab"]{color:#E05000}
        tajweed[class*="ghunnah"]{color:#22AA22}
      `;
      document.head.appendChild(s);
    }
  }, []);

  // Build list of surahs to show with verse ranges
  const surahsToRead = useMemo(() => {
    const result = [];
    for (let s = day.startSurah; s <= day.endSurah; s++) {
      const surah = QURAN_SURAHS[s - 1];
      const startV = s === day.startSurah ? day.startVerse : 1;
      const endV   = s === day.endSurah   ? day.endVerse   : surah.verses;
      result.push({ surahNum: s, surah, startV, endV });
    }
    return result;
  }, [day]);

  const allVerseKeys = useMemo(() => {
    const keys = [];
    for (const { surahNum, startV, endV } of surahsToRead) {
      for (let v = startV; v <= endV; v++) keys.push(`${surahNum}:${v}`);
    }
    return keys;
  }, [surahsToRead]);

  const total = allVerseKeys.length;
  const readCount = checkedVerses.length;
  const pct = total > 0 ? Math.min(100, Math.round((readCount / total) * 100)) : 0;
  const done = readCount >= total;

  // Save progress
  const saveProgress = useCallback((newChecked) => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(newChecked)); } catch {}
  }, [SAVE_KEY]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const fmtTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const toggleVerse = useCallback((key) => {
    setCheckedVerses(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      saveProgress(next);
      return next;
    });
  }, [saveProgress]);

  // Auto-scroll to next unchecked verse
  const markAndAdvance = useCallback((key) => {
    setCheckedVerses(prev => {
      if (prev.includes(key)) return prev;
      const next = [...prev, key];
      saveProgress(next);
      // Scroll to next unchecked
      const idx = allVerseKeys.indexOf(key);
      if (idx < allVerseKeys.length - 1) {
        const nextKey = allVerseKeys[idx + 1];
        setTimeout(() => {
          const el = verseRefs.current[nextKey];
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
      }
      return next;
    });
  }, [allVerseKeys, saveProgress]);

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 60px)" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-950/95 border-b border-white/8 shrink-0">
        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white">
          <ChevronLeft className="w-5 h-5"/>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">Jour {day.day} — {new Date(day.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</p>
          <p className="text-slate-500 text-xs">{total} versets · ~{Math.round(total / 10.3)} pages</p>
        </div>
        <button onClick={() => setShowTranslit(s => !s)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 mr-1 ${showTranslit ? "bg-blue-500/25 text-blue-300 border border-blue-500/40" : "bg-white/8 text-slate-500 border border-white/10"}`}>
          ABC
        </button>
        <span className="text-emerald-400 font-mono font-black text-lg shrink-0">{fmtTime(elapsed)}</span>
      </div>

      {/* Tajweed color legend */}
      <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-900/60 border-b border-white/5 shrink-0 overflow-x-auto">
        {[["#DD8000","Qalqala"],["#537FFF","Madd"],["#169200","Ghunna"],["#D070A0","Ikhfāʾ"],["#E05000","Iqlāb"],["#AAAAAA","Silence"]].map(([color,label]) => (
          <span key={label} className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-full" style={{background:color}}/>
            <span className="text-slate-500">{label}</span>
          </span>
        ))}
      </div>

      {/* Progress bar sticky */}
      <div className="px-4 py-2.5 bg-slate-900/80 border-b border-white/5 shrink-0">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-500">{readCount} / {total} versets</span>
          <span className={`font-bold ${done ? "text-emerald-400" : "text-blue-400"}`}>{pct}%</span>
          <span className="text-slate-500">{total - readCount} restants</span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${done ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-blue-500 to-cyan-400"}`}
            animate={{ width: `${pct}%` }} transition={{ duration: 0.3 }}
          />
        </div>
        {done && (
          <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => { onMarkDone(day.date); try { localStorage.removeItem(SAVE_KEY); } catch {} onClose(); }}
            className="w-full mt-2 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl text-xs shadow-lg">
            ✅ Terminer — Jour {day.day} accompli
          </motion.button>
        )}
      </div>

      {/* Verse list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {surahsToRead.map(({ surahNum, surah, startV, endV }) => (
          <SurahBlock key={surahNum} surahNum={surahNum} surah={surah} startV={startV} endV={endV}
            checkedVerses={checkedVerses} markAndAdvance={markAndAdvance} toggleVerse={toggleVerse} verseRefs={verseRefs} showTranslit={showTranslit}/>
        ))}
        {/* Bottom action */}
        <div className="px-4 py-6 space-y-3">
          <button onClick={() => onNavigateToRange(day.startSurah, day.startVerse, day.endSurah, day.endVerse)}
            className="w-full py-3 bg-white/5 border border-white/10 text-slate-300 font-semibold rounded-2xl text-sm hover:bg-white/10 transition-all">
            📖 Ouvrir dans le lecteur Coran
          </button>
          {!done && (
            <button onClick={() => { onMarkDone(day.date); try { localStorage.removeItem(SAVE_KEY); } catch {} onClose(); }}
              className="w-full py-2.5 bg-white/3 border border-white/8 text-slate-600 rounded-2xl text-xs hover:bg-white/8 transition-all">
              Marquer comme lu quand même
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function SurahBlock({ surahNum, surah, startV, endV, checkedVerses, markAndAdvance, toggleVerse, verseRefs, showTranslit }) {
  const { verses, loading } = useVerses(surahNum);
  const rangeVerses = useMemo(() => {
    if (verses.length === 0) return [];
    return verses.filter(v => v.number >= startV && v.number <= endV);
  }, [verses, startV, endV]);

  return (
    <div className="px-4 py-4">
      {/* Surah header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-white font-bold text-sm">{surah.name}</p>
        <p className="font-serif text-slate-500 text-lg" dir="rtl">{surah.arabic}</p>
      </div>
      {surahNum !== 9 && startV === 1 && (
        <p className="text-center text-lg font-serif text-emerald-400/70 mb-4" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
      )}

      {loading && (
        <div className="flex items-center gap-2 p-3 text-slate-600 text-xs">
          <motion.div className="w-3 h-3 border-2 border-slate-600 border-t-slate-400 rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}/>
          Chargement des versets…
        </div>
      )}

      <div className="space-y-2">
        {rangeVerses.map(v => {
          const key = `${surahNum}:${v.number}`;
          const checked = checkedVerses.includes(key);
          return (
            <div key={v.number} ref={el => { verseRefs.current[key] = el; }}
              className={`flex gap-3 p-3 rounded-2xl border transition-all ${checked ? "bg-emerald-900/15 border-emerald-500/20 opacity-60" : "bg-white/3 border-white/8"}`}>
              {/* Check button */}
              <button onClick={() => checked ? toggleVerse(key) : markAndAdvance(key)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-xl transition-all mt-1 active:scale-90 ${
                  checked ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-blue-600 text-white shadow-md shadow-blue-600/40 hover:bg-blue-500"
                }`}>
                {checked ? <CheckCircle className="w-5 h-5"/> : "+"}
              </button>
              {/* Verse text */}
              <div className="flex-1">
                {v.tajweed ? (
                  <p className="text-right leading-[2.6]" dir="rtl" lang="ar"
                    style={{ fontFamily: "'Amiri Quran','Scheherazade New',serif", fontSize: "clamp(1.1rem,3.5vw,1.5rem)" }}
                    dangerouslySetInnerHTML={{ __html: v.tajweed }}/>
                ) : (
                  <p className="text-right text-white leading-[2.6]" dir="rtl" lang="ar"
                    style={{ fontFamily: "'Amiri Quran','Scheherazade New',serif", fontSize: "clamp(1.1rem,3.5vw,1.5rem)" }}>
                    {v.arabic}
                  </p>
                )}
                {showTranslit && v.transliteration && (
                  <p className="text-blue-300/70 text-xs italic leading-relaxed mt-1 text-right" dir="ltr">{v.transliteration}</p>
                )}
                {v.french && (
                  <p className="text-slate-500 text-xs italic leading-relaxed mt-1">{v.french}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JuzProgram({ onNavigateToRange, juzProgram: juz }) {
  const { program, start, reset, dailyCompleted, markDayDone } = juz;

  const isValid = program.active && program.startDate && program.endDate
    && new Date(program.endDate) > new Date(program.startDate);

  const [readingDay, setReadingDay] = useState(() => {
    // Restore in-progress reading session
    try {
      const saved = localStorage.getItem("current_reading_day");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const todayISO = new Date().toISOString().slice(0, 10);

  const dailyPlan = useMemo(() =>
    isValid ? generateDailyPlan(program.startDate, program.endDate) : [],
    [isValid, program.startDate, program.endDate]
  );

  const todayPlan = dailyPlan.find(d => d.date === todayISO) || null;
  const doneDaysCount = dailyPlan.filter(d => dailyCompleted[d.date]).length;

  const openDay = useCallback((d) => {
    try { localStorage.setItem("current_reading_day", JSON.stringify(d)); } catch {}
    setReadingDay(d);
  }, []);

  const closeDay = useCallback(() => {
    try { localStorage.removeItem("current_reading_day"); } catch {}
    setReadingDay(null);
  }, []);

  // ── ÉCRAN DE LECTURE ───────────────────────────────────────────────
  if (readingDay) {
    return (
      <DayReader
        day={readingDay}
        onClose={closeDay}
        onMarkDone={(dateStr) => { markDayDone(dateStr); closeDay(); }}
        onNavigateToRange={onNavigateToRange}
      />
    );
  }

  // ── SETUP ──────────────────────────────────────────────────────────
  if (!isValid) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">📅</div>
          <h2 className="text-2xl font-black text-white">Programme de lecture</h2>
          <p className="text-slate-400 text-sm leading-relaxed">Choisis ta durée — le planning se génère automatiquement avec les versets exacts à lire chaque jour.</p>
        </div>
        <div className="space-y-3">
          {[
            { days: 30, label: "30 jours", icon: "⚡", desc: "~207 versets/jour · ~20 pages/jour", color: "from-orange-600 to-red-600" },
            { days: 60, label: "60 jours", icon: "🌿", desc: "~104 versets/jour · ~10 pages/jour", color: "from-emerald-600 to-teal-600" },
            { days: 90, label: "90 jours", icon: "🌊", desc: "~70 versets/jour · ~7 pages/jour",   color: "from-blue-600 to-indigo-600" },
          ].map(opt => {
            const endDate = new Date(); endDate.setDate(endDate.getDate() + opt.days);
            return (
              <motion.button key={opt.days} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => start({ startDateISO: new Date().toISOString(), endDateISO: endDate.toISOString() })}
                className={`w-full p-5 rounded-3xl bg-gradient-to-r ${opt.color} text-white text-left shadow-lg`}>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{opt.icon}</span>
                  <div>
                    <p className="font-black text-xl">{opt.label}</p>
                    <p className="text-white/75 text-sm mt-0.5">{opt.desc}</p>
                    <p className="text-white/50 text-xs mt-1">Fin : {endDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── PLANNING ACTIF ─────────────────────────────────────────────────
  const totalDays = dailyPlan.length;
  const progressPct = totalDays > 0 ? Math.round((doneDaysCount / totalDays) * 100) : 0;
  const daysLeft = Math.max(0, Math.ceil((new Date(program.endDate) - new Date()) / 86400000));

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      {/* Stats */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-white font-bold">{doneDaysCount} / {totalDays} jours</p>
            <p className="text-slate-500 text-xs">{daysLeft} jours restants · Fin le {new Date(program.endDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}</p>
          </div>
          <span className="text-emerald-400 font-black text-2xl">{progressPct}%</span>
        </div>
        <div className="h-2 bg-white/8 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
            animate={{ width: `${progressPct}%` }} transition={{ duration: 0.8 }}/>
        </div>
      </div>

      {/* Aujourd'hui */}
      {todayPlan && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-5 border ${dailyCompleted[todayPlan.date] ? "bg-emerald-900/20 border-emerald-500/30" : "bg-blue-900/20 border-blue-500/30"}`}>
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">📖 Aujourd'hui — Jour {todayPlan.day}</p>
          <p className="text-white font-black text-sm leading-snug mb-1">
            {QURAN_SURAHS[todayPlan.startSurah - 1].name} v.{todayPlan.startVerse}
            <span className="text-slate-500 font-normal"> → </span>
            {QURAN_SURAHS[todayPlan.endSurah - 1].name} v.{todayPlan.endVerse}
          </p>
          <p className="text-slate-500 text-xs mb-4">{todayPlan.verseCount} versets · ~{Math.round(todayPlan.verseCount / 10.3)} pages</p>
          {!dailyCompleted[todayPlan.date] ? (
            <button onClick={() => openDay(todayPlan)}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg text-sm">
              ▶ Lire et cocher verset par verset
            </button>
          ) : (
            <p className="text-center text-emerald-400 font-bold text-sm py-2">✅ Jour {todayPlan.day} accompli — Al-ḥamdu lillāh</p>
          )}
        </motion.div>
      )}

      {/* Liste planning */}
      <div>
        <p className="text-sm font-bold text-white mb-2">Planning complet</p>
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
          {dailyPlan.map(d => {
            const isToday = d.date === todayISO;
            const isPast  = d.date < todayISO;
            const done    = !!dailyCompleted[d.date];
            const hasSaved = (() => { try { return !!localStorage.getItem(`day_progress_${d.date}`); } catch { return false; } })();
            const dateStr = new Date(d.date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
            return (
              <div key={d.day} className={`flex items-center gap-3 p-3 rounded-2xl border ${
                isToday ? "bg-blue-900/20 border-blue-500/30" : done ? "bg-emerald-900/10 border-emerald-500/15" : isPast ? "bg-orange-900/8 border-orange-500/12" : "bg-white/3 border-white/8"
              }`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                  done ? "bg-emerald-500 text-white" : isToday ? "bg-blue-500 text-white" : isPast ? "bg-orange-900/40 text-orange-400" : "bg-white/8 text-slate-500"
                }`}>
                  {done ? "✓" : d.day}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${isToday ? "text-blue-300" : done ? "text-emerald-400" : isPast ? "text-orange-400/70" : "text-slate-500"}`}>
                    {isToday ? "Aujourd'hui" : dateStr}
                    {hasSaved && !done && <span className="ml-1.5 text-amber-400">● en cours</span>}
                  </p>
                  <p className="text-white text-xs font-medium truncate">
                    {QURAN_SURAHS[d.startSurah - 1].name} <span className="text-slate-600">{d.startVerse}</span>
                    <span className="text-slate-600"> → </span>
                    {QURAN_SURAHS[d.endSurah - 1].name} <span className="text-slate-600">{d.endVerse}</span>
                  </p>
                </div>
                {!done && (
                  <button onClick={() => openDay(d)} className="p-2 bg-blue-500/12 text-blue-400 rounded-xl hover:bg-blue-500/25 transition-all shrink-0">
                    <Play className="w-3.5 h-3.5"/>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pb-6 text-center">
        <button onClick={reset} className="flex items-center gap-2 text-slate-700 hover:text-red-400 transition-colors text-xs mx-auto">
          <RotateCcw className="w-3.5 h-3.5"/> Changer de programme
        </button>
      </div>
    </div>
  );
}
function BookmarksPage() {
  const quranBM = useBookmarks("quran");
  const khatmBM = useBookmarks("khatm");
  const [activeTab, setActiveTab] = useState("quran");
  const [confirmReset, setConfirmReset] = useState(false);
  const current = activeTab === "quran" ? quranBM : khatmBM;
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">🔖 Marque-pages</h2>
          <p className="text-slate-600 text-xs mt-0.5">Coran et Khatm sont séparés et indépendants</p>
        </div>
        {current.bookmarks.length > 0 && !confirmReset && (
          <button onClick={() => setConfirmReset(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-xl transition-all">
            <RotateCcw className="w-3.5 h-3.5"/> Tout effacer
          </button>
        )}
        {confirmReset && (
          <div className="flex gap-2">
            <button onClick={() => { current.resetAll(); setConfirmReset(false); }} className="px-3 py-1.5 text-xs font-bold text-white bg-red-500/25 border border-red-500/40 rounded-xl hover:bg-red-500/40 transition-all">Confirmer</button>
            <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 text-xs text-slate-400 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">Annuler</button>
          </div>
        )}
      </div>
      <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
        {[{ key: "quran", label: "📖 Coran", count: quranBM.bookmarks.length },{ key: "khatm", label: "📅 Khatm", count: khatmBM.bookmarks.length }].map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setConfirmReset(false); }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${activeTab === tab.key ? "bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}>
            {tab.label}
            {tab.count > 0 && <span className={`text-xs font-black px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/25 text-white" : "bg-white/10 text-slate-500"}`}>{tab.count}</span>}
          </button>
        ))}
      </div>
      <div className="flex items-start gap-3 p-3.5 bg-amber-500/8 border border-amber-500/15 rounded-2xl">
        <span className="text-lg shrink-0">💡</span>
        <div>
          {activeTab === "quran" ? (
            <div style={{display:"contents"}}><p className="text-amber-300 font-semibold text-xs">Marque-pages Coran</p><p className="text-slate-500 text-xs mt-0.5">Dans <strong className="text-white">📖 Coran</strong>, appuie sur n'importe quel verset pour l'enregistrer ici instantanément.</p></div>
          ) : (
            <div style={{display:"contents"}}><p className="text-amber-300 font-semibold text-xs">Marque-pages Khatm</p><p className="text-slate-500 text-xs mt-0.5">Dans <strong className="text-white">📅 Programme</strong>, utilise le bouton "Sauvegarder ma position" pour marquer où tu en es dans ton Khatm.</p></div>
          )}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {current.bookmarks.length === 0 ? (
            <div className="text-center py-14 space-y-2"><p className="text-5xl">🔖</p><p className="text-slate-500 text-sm">Aucun marque-page {activeTab === "quran" ? "Coran" : "Khatm"}</p></div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-slate-700 text-xs">{current.bookmarks.length} marque-page{current.bookmarks.length > 1 ? "s" : ""}</p>
              <AnimatePresence>
                {current.bookmarks.map(bm => (
                  <motion.div key={bm.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
                    className="flex items-center gap-3 p-4 bg-white/5 border border-amber-500/15 rounded-2xl group hover:border-amber-500/30 transition-all">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/12 border border-amber-500/20 flex flex-col items-center justify-center shrink-0">
                      {activeTab === "quran" ? (<div style={{display:"contents"}}><span className="text-amber-400 font-black text-base leading-none">{bm.surah}</span><span className="text-amber-600/80 text-[10px] font-semibold">v.{bm.verse}</span></div>) : (<span className="text-amber-400 text-xl">📅</span>)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm">{bm.surahName}</p>
                      {bm.note && <p className="text-xs text-amber-600/60 italic truncate">"{bm.note}"</p>}
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3 shrink-0"/>{bm.datetime}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {activeTab === "quran" && <p className="font-serif text-slate-500 text-base" dir="rtl">{bm.surahArabic}</p>}
                      <button onClick={() => current.remove(bm.id)} className="p-1.5 text-slate-700 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5"/></button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// COMPOSANT — Adhkar
// ════════════════════════════════════════════════════════════════════
const TAB_LABELS = { matin: "🌅 Matin", soir: "🌙 Soir", priere: "🕌 Prière" };

function useArabicSpeech() {
  const [speaking, setSpeaking] = useState(null);
  const [voices, setVoices] = useState([]);
  const utterRef = useRef(null);
  useEffect(() => {
    const load = () => { const v = window.speechSynthesis?.getVoices() || []; if (v.length > 0) setVoices(v); };
    load();
    if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = load;
    return () => { if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null; };
  }, []);
  const speak = useCallback((dhikr) => {
    if (!("speechSynthesis" in window)) { alert("La synthèse vocale n'est pas supportée sur ce navigateur."); return; }
    if (speaking === dhikr.id) { window.speechSynthesis.cancel(); setSpeaking(null); return; }
    window.speechSynthesis.cancel();
    const doSpeak = (voiceList) => {
      const utter = new SpeechSynthesisUtterance(dhikr.arabic);
      utter.lang = "ar-SA"; utter.rate = 0.75; utter.pitch = 1;
      const arabicVoice = voiceList.find(v => v.lang === "ar-SA") || voiceList.find(v => v.lang === "ar-EG") || voiceList.find(v => v.lang.startsWith("ar")) || null;
      if (arabicVoice) utter.voice = arabicVoice;
      utter.onstart = () => setSpeaking(dhikr.id); utter.onend = () => setSpeaking(null); utter.onerror = () => setSpeaking(null);
      utterRef.current = utter; window.speechSynthesis.speak(utter);
    };
    const currentVoices = window.speechSynthesis.getVoices();
    if (currentVoices.length > 0) { doSpeak(currentVoices); }
    else {
      window.speechSynthesis.onvoiceschanged = () => { const v = window.speechSynthesis.getVoices(); setVoices(v); doSpeak(v); window.speechSynthesis.onvoiceschanged = null; };
      setTimeout(() => { if (speaking !== dhikr.id) doSpeak([]); }, 300);
    }
  }, [speaking]);
  const stop = useCallback(() => { window.speechSynthesis.cancel(); setSpeaking(null); }, []);
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);
  return { speaking, speak, stop, voicesLoaded: voices.length > 0 };
}

function DhikrCard({ dhikr, favorites, toggleFav, copied, handleCopy, recited, setRecited, speaking, speak }) {
  const [expanded, setExpanded] = useState(false);
  const isPlaying = speaking === dhikr.id;
  const count = recited[dhikr.id] || 0;
  const done = count >= dhikr.repetition;
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border transition-all overflow-hidden ${done ? "bg-emerald-900/20 border-emerald-500/30" : "bg-white/5 border-white/10 hover:border-emerald-500/20"}`}>
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm leading-snug mb-2">{dhikr.title}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/20">{dhikr.repetition}×</span>
              {done && <span className="px-2 py-1 bg-emerald-500/25 text-emerald-300 rounded-lg text-xs font-bold">✓ Terminé</span>}
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={() => speak(dhikr)} title={isPlaying ? "Arrêter" : "Écouter en arabe"}
              className={`p-2 rounded-xl transition-all border ${isPlaying ? "bg-blue-500/25 border-blue-500/40 text-blue-300 animate-pulse" : "bg-white/5 border-white/10 text-slate-500 hover:text-blue-400 hover:border-blue-500/30"}`}>
              {isPlaying ? <span className="text-base leading-none">⏸</span> : <span className="text-base leading-none">🔊</span>}
            </button>
            <button onClick={() => handleCopy(dhikr)} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-500 hover:text-white border border-transparent">
              {copied[dhikr.id] ? <CheckCircle className="w-4 h-4 text-emerald-400"/> : <Copy className="w-4 h-4"/>}
            </button>
            <button onClick={() => toggleFav(dhikr.id)} className={`p-2 rounded-xl transition-all border border-transparent ${favorites[dhikr.id] ? "text-rose-400" : "text-slate-500 hover:text-rose-400"}`}>
              {favorites[dhikr.id] ? "♥" : "♡"}
            </button>
          </div>
        </div>
        <div className={`p-4 rounded-2xl mb-3 border transition-all cursor-pointer ${isPlaying ? "bg-blue-500/8 border-blue-500/25" : "bg-slate-800/60 border-white/10 hover:border-white/20"}`} onClick={() => speak(dhikr)}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold">النص العربي</p>
            <span className={`text-xs ${isPlaying ? "text-blue-400 font-semibold" : "text-slate-600"}`}>{isPlaying ? "⏸ Arrêter" : "🔊 Écouter"}</span>
          </div>
          <p className="text-right font-serif text-white leading-[2.4] select-text" dir="rtl" lang="ar" style={{ fontSize: "clamp(1.1rem, 4vw, 1.5rem)", wordBreak: "keep-all" }}>{dhikr.arabic}</p>
          {isPlaying && (
            <div className="flex items-center gap-1 justify-center mt-3">
              {[...Array(4)].map((_, i) => (<motion.div key={i} className="w-1 rounded-full bg-blue-400" animate={{ height: ["6px","16px","6px"] }} transition={{ duration: 0.6, delay: i*0.15, repeat: Infinity }}/>))}
              <span className="text-blue-400 text-xs ml-2 font-semibold">Récitation en cours…</span>
            </div>
          )}
        </div>
        <div className="bg-emerald-500/8 border border-emerald-500/15 rounded-2xl p-4 mb-3">
          <p className="text-xs text-emerald-600 uppercase tracking-wider font-semibold mb-1.5">Traduction</p>
          <p className="text-slate-300 text-sm leading-relaxed select-text">{dhikr.french}</p>
        </div>
        {dhikr.benefice && (
          <div className="bg-amber-500/8 border border-amber-500/20 rounded-2xl p-4 mb-3">
            <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5">📜 Vertu & bénéfice</p>
            <p className="text-amber-200/80 text-sm leading-relaxed italic select-text">{dhikr.benefice}</p>
          </div>
        )}
        <div className={`p-4 rounded-2xl mb-3 border transition-all ${isPlaying ? "bg-blue-500/8 border-blue-500/20" : "bg-white/3 border-white/8"}`}>
          <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-1.5">Translittération</p>
          <p className="font-bold text-white text-base leading-relaxed break-words select-text">{dhikr.transliteration}</p>
        </div>
        <button onClick={() => setExpanded(e => !e)} className="w-full text-left text-slate-700 hover:text-slate-500 text-xs italic transition-all flex items-center justify-between gap-2">
          <span className={expanded ? "" : "truncate"}>{dhikr.source}</span>
          <span className="shrink-0 text-slate-700">{expanded ? "▲" : "▼"}</span>
        </button>
      </div>
      <div className="px-5 pb-5">
        {dhikr.repetition > 1 && (
          <div className="h-1.5 bg-white/8 rounded-full overflow-hidden mb-3">
            <motion.div className={`h-full rounded-full transition-all ${done ? "bg-emerald-500" : "bg-gradient-to-r from-emerald-600 to-teal-400"}`}
              animate={{ width: `${Math.min(100, (count / dhikr.repetition) * 100)}%` }}
            />
          </div>
        )}
        <div className="flex items-center gap-3">
          {count > 0 && (
            <button onClick={() => setRecited(p => ({ ...p, [dhikr.id]: 0 }))} className="p-2 text-slate-700 hover:text-slate-400 hover:bg-white/5 rounded-xl transition-all" title="Remettre à zéro"><RotateCcw className="w-3.5 h-3.5"/></button>
          )}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}
            onClick={() => !done && setRecited(p => ({ ...p, [dhikr.id]: (p[dhikr.id] || 0) + 1 }))}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all ${done ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 cursor-default" : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-emerald-500/20"}`}>
            {done ? `✓ Complété (${dhikr.repetition}/${dhikr.repetition})` : dhikr.repetition === 1 ? "Récité ✓" : `Réciter — ${count} / ${dhikr.repetition}`}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function AdhkarPage({ fridayKahf: fridayKahfProp }) {
  const [favorites, setFavorites] = useState(() => storage("adhkar_favs", {}));
  const [copied,    setCopied]    = useState({});
  const [recited,   setRecited]   = useState(() => storage("adhkar_recited", {}));
  const [activeTab, setActiveTab] = useState("matin");
  const [confirmReset, setConfirmReset] = useState(false);
  const { speaking, speak, voicesLoaded } = useArabicSpeech();
  const { isReadThisWeek, markRead, totalFridays } = fridayKahfProp || useFridayKahf();
  const today = new Date();
  const isFriday = today.getDay() === 5;
  const handleResetRecited = () => { storageSet("adhkar_recited", {}); setRecited({}); setConfirmReset(false); };
  const handleCopy = useCallback((dhikr) => {
    navigator.clipboard.writeText(`${dhikr.arabic}\n\n${dhikr.transliteration}\n\n${dhikr.french}\n\nSource : ${dhikr.source}`);
    setCopied(p => ({ ...p, [dhikr.id]: true }));
    setTimeout(() => setCopied(p => ({ ...p, [dhikr.id]: false })), 2000);
  }, []);
  const toggleFav = useCallback((id) => {
    setFavorites(prev => { const next = { ...prev, [id]: !prev[id] }; storageSet("adhkar_favs", next); return next; });
  }, []);
  const handleSetRecited = useCallback((updater) => {
    setRecited(prev => { const next = typeof updater === "function" ? updater(prev) : updater; storageSet("adhkar_recited", next); return next; });
  }, []);
  const filtered = ADHKAR_MALIKITES.filter(d => {
    const cat = d.category.toLowerCase();
    if (activeTab === "matin") return cat === "matin" || cat === "matin_soir";
    if (activeTab === "soir")  return cat === "soir"  || cat === "matin_soir";
    return cat === activeTab;
  });
  const totalDone = filtered.filter(d => (recited[d.id] || 0) >= d.repetition).length;
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/25 uppercase tracking-wider">📿 Madhhab Malikite — Muwatta Mālik</div>
          <h2 className="text-2xl font-black text-white mt-2">الأذكار اليومية</h2>
          <p className="text-slate-600 text-xs mt-0.5">{voicesLoaded ? "🔊 Voix arabe prête" : "🔊 Appuie sur le texte arabe pour écouter"}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-xl transition-all"><RotateCcw className="w-3 h-3"/> Réinitialiser</button>
          ) : (
            <div className="flex flex-col gap-1.5 items-end">
              <p className="text-xs text-slate-500 text-right">Effacer tous les compteurs ?</p>
              <div className="flex gap-2">
                <button onClick={handleResetRecited} className="px-3 py-1.5 text-xs font-bold text-white bg-red-500/25 border border-red-500/40 rounded-xl hover:bg-red-500/40 transition-all">Confirmer</button>
                <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 text-xs text-slate-400 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">Annuler</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10 gap-1 overflow-x-auto">
        {Object.entries(TAB_LABELS).map(([key, label]) => {
          const tabDhikr = ADHKAR_MALIKITES.filter(d => d.category.toLowerCase() === key);
          const tabDone  = tabDhikr.filter(d => (recited[d.id] || 0) >= d.repetition).length;
          return (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex-shrink-0 py-2 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === key ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}>
              {label}
              {tabDhikr.length > 0 && <span className={`ml-1.5 text-[10px] ${activeTab === key ? "text-white/70" : "text-slate-700"}`}>{tabDone}/{tabDhikr.length}</span>}
            </button>
          );
        })}
      </div>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-500/8 border border-blue-500/15 rounded-2xl">
        <span className="text-lg">🔊</span>
        <p className="text-blue-300/70 text-xs">Appuie sur <strong className="text-blue-300">🔊</strong> ou le texte arabe pour entendre la récitation. Vitesse lente pour faciliter le suivi.</p>
      </div>
      {isFriday && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-3 p-4 rounded-2xl border ${isReadThisWeek ? "bg-emerald-900/30 border-emerald-500/30" : "bg-amber-500/10 border-amber-500/30"}`}>
          <span className="text-2xl shrink-0">🕌</span>
          <div className="flex-1">
            <p className={`font-bold text-sm mb-0.5 ${isReadThisWeek ? "text-emerald-300" : "text-amber-300"}`}>
              {isReadThisWeek ? "✅ Al-Kahf lu ce vendredi !" : "Aujourd'hui c'est vendredi — Lis la Sourate Al-Kahf !"}
            </p>
            <p className="text-slate-500 text-xs leading-relaxed">« Celui qui lit Al-Kahf le vendredi, une lumière l'illuminera jusqu'au vendredi suivant. » — Ṣaḥīḥ al-Jāmi'</p>
            {totalFridays > 0 && <p className="text-slate-600 text-xs mt-1">📊 Tu as lu Al-Kahf {totalFridays} vendredi{totalFridays > 1 ? "s" : ""}</p>}
          </div>
          {!isReadThisWeek && (
            <button onClick={markRead} className="shrink-0 px-3 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold hover:bg-amber-500/30 transition-all">Marquer lu</button>
          )}
        </motion.div>
      )}
      {filtered.length > 1 && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
              animate={{ width: `${(totalDone / filtered.length) * 100}%` }} transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs text-slate-600 shrink-0">{totalDone}/{filtered.length} adhkār</span>
        </div>
      )}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4 pb-6">
          {filtered.length === 0 && <p className="text-center text-slate-600 py-10">Aucun dhikr dans cet onglet.</p>}
          {filtered.map(dhikr => (
            <DhikrCard key={dhikr.id} dhikr={dhikr} favorites={favorites} toggleFav={toggleFav} copied={copied} handleCopy={handleCopy} recited={recited} setRecited={handleSetRecited} speaking={speaking} speak={speak}/>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// COMPOSANT — QuranReader
// ════════════════════════════════════════════════════════════════════
function QuranReader({ initialSurahNum, initialVerseNum, onNavConsumed, juzBounds, checked, toggle, counts }) {
  const quranBM = useBookmarks("quran");
  const [currentSurah, setCurrentSurah] = useState(() => initialSurahNum ? QURAN_SURAHS[initialSurahNum - 1] || null : null);
  const [targetVerse, setTargetVerse] = useState(initialVerseNum || null);
  const [activeJuzBounds, setActiveJuzBounds] = useState(juzBounds || null);
  useEffect(() => {
    if (!initialSurahNum) return;
    const surah = QURAN_SURAHS[initialSurahNum - 1];
    if (!surah) return;
    setCurrentSurah(surah);
    if (initialVerseNum && initialVerseNum > 1) setTargetVerse(initialVerseNum);
  }, [initialSurahNum, initialVerseNum]);
  const lastScrollPos = useRef(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const save = () => { lastScrollPos.current = el.scrollTop; };
    el.addEventListener("scroll", save, { passive: true });
    return () => el.removeEventListener("scroll", save);
  }, []);
  useEffect(() => { if (juzBounds) setActiveJuzBounds(juzBounds); }, [juzBounds]);
  const verseRefs = useRef({});
  const { verses, loading: versesLoading, error: versesError } = useVerses(currentSurah?.number);
  const [filter, setFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(2);
  const [bookmarkToast, setBookmarkToast] = useState(null);
  const scrollRef = useRef(null);
  const autoRef = useRef(null);
  const [dlStatus, setDlStatus] = useState(() => {
    const init = {};
    Object.keys(EMBEDDED_VERSES).forEach(k => { init[k] = "done"; });
    _versesMemCache.forEach((_, k) => { init[k] = "done"; });
    return init;
  });
  const downloadSurah = async (surah, e) => {
    e.stopPropagation();
    const n = surah.number;
    if (dlStatus[n] === "done" || dlStatus[n] === "loading") return;
    setDlStatus(prev => ({ ...prev, [n]: "loading" }));
    try {
      const verses = await fetchSurahFromAPI(n, surah);
      _versesMemCache.set(n, verses);
      setDlStatus(prev => ({ ...prev, [n]: "done" }));
    } catch { setDlStatus(prev => ({ ...prev, [n]: "error" })); }
  };
  const touchStart = useRef(null);
  const handleTouchStart = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStart.current || !currentSurah) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) {
      if (diff > 0 && currentSurah.number < 114) { setCurrentSurah(QURAN_SURAHS[currentSurah.number]); setActiveJuzBounds(null); }
      if (diff < 0 && currentSurah.number > 1) { setCurrentSurah(QURAN_SURAHS[currentSurah.number - 2]); setActiveJuzBounds(null); }
    }
    touchStart.current = null;
  };
  useEffect(() => {
    if (autoScroll && scrollRef.current) { autoRef.current = setInterval(() => { scrollRef.current?.scrollBy({ top: scrollSpeed, behavior: "smooth" }); }, 50); }
    else { clearInterval(autoRef.current); }
    return () => clearInterval(autoRef.current);
  }, [autoScroll, scrollSpeed]);
  useEffect(() => {
    if (!targetVerse) return;
    const attempt = (tries = 0) => {
      const el = verseRefs.current[targetVerse];
      if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); setTargetVerse(null); setTimeout(() => onNavConsumed?.(), 1500); }
      else if (tries < 20) { setTimeout(() => attempt(tries + 1), 300); }
    };
    const t = setTimeout(() => attempt(), 500);
    return () => clearTimeout(t);
  }, [targetVerse, currentSurah, verses]);
  useEffect(() => {
    if (bookmarkToast) { const t = setTimeout(() => setBookmarkToast(null), 2500); return () => clearTimeout(t); }
  }, [bookmarkToast]);
  const handleVerseBookmark = useCallback((verseNum) => {
    if (!currentSurah) return;
    quranBM.save({ surah: currentSurah.number, verse: verseNum, surahName: currentSurah.name, surahArabic: currentSurah.arabic, note: "" });
    setBookmarkToast({ verse: verseNum, surahName: currentSurah.name });
  }, [currentSurah, quranBM]);
  const filtered = QURAN_SURAHS.filter(s => s.name.toLowerCase().includes(filter.toLowerCase()) || s.arabic.includes(filter) || String(s.number).includes(filter));
  const getJuzFilteredVerses = (rawVerses) => {
    if (!activeJuzBounds || !currentSurah) return rawVerses;
    const { startSurah, startVerse, endSurah, endVerse } = activeJuzBounds;
    return rawVerses.filter(v => {
      const sn = currentSurah.number;
      if (sn === startSurah && sn === endSurah) return v.number >= startVerse && v.number <= endVerse;
      if (sn === startSurah) return v.number >= startVerse;
      if (sn === endSurah)   return v.number <= endVerse;
      return true;
    });
  };

  if (currentSurah) {
    return (
      <div className="flex flex-col" style={{ height: "calc(100dvh - 60px)" }} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <AnimatePresence>
          {bookmarkToast && (
            <motion.div initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-2xl shadow-xl shadow-amber-500/30 whitespace-nowrap">
              🔖 Verset {bookmarkToast.verse} sauvegardé !
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-950/90 backdrop-blur-xl border-b border-white/8 shrink-0">
          <button onClick={() => { setCurrentSurah(null); setAutoScroll(false); }} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"><ChevronLeft className="w-5 h-5"/></button>
          <div className="flex-1 text-center">
            <p className="font-bold text-white text-sm">{currentSurah.name}</p>
            <p className="text-slate-500 text-xs">{versesLoading ? "⏳ Chargement…" : verses.length > 0 ? `${verses.length} versets · Juz ${currentSurah.juz}` : `${currentSurah.verses} versets · Juz ${currentSurah.juz}`}</p>
          </div>
          <button onClick={() => toggle(currentSurah.number)}
            className={`p-2 rounded-xl transition-all ${checked[currentSurah.number] ? "text-emerald-400 bg-emerald-500/15" : "text-slate-400 hover:text-emerald-400 hover:bg-white/10"}`} title="Marquer comme lue">
            <CheckCircle className="w-5 h-5"/>
          </button>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/80 border-b border-white/5 shrink-0">
          <button onClick={() => setAutoScroll(a => !a)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${autoScroll ? "bg-blue-500/25 text-blue-300 border border-blue-500/40" : "bg-white/5 text-slate-500 hover:text-white"}`}>
            {autoScroll ? <Pause className="w-3 h-3"/> : <Play className="w-3 h-3"/>} Auto-scroll
          </button>
          {autoScroll && (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-slate-600">Vitesse</span>
              <input type="range" min={1} max={6} value={scrollSpeed} onChange={e => setScrollSpeed(Number(e.target.value))} className="flex-1 accent-blue-500 h-1"/>
            </div>
          )}
          {!autoScroll && <p className="text-slate-700 text-xs ml-auto italic">Appuie sur un verset pour 🔖</p>}
          <div className="flex gap-1 ml-auto">
            <button onClick={() => currentSurah.number > 1 && setCurrentSurah(QURAN_SURAHS[currentSurah.number - 2])} disabled={currentSurah.number === 1} className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-slate-500 hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4"/></button>
            <span className="text-xs text-slate-600 self-center px-1">{currentSurah.number}/114</span>
            <button onClick={() => currentSurah.number < 114 && setCurrentSurah(QURAN_SURAHS[currentSurah.number])} disabled={currentSurah.number === 114} className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-slate-500 hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4"/></button>
          </div>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
          <div className="text-center mb-8">
            <p className="text-5xl font-serif text-white mb-2" dir="rtl" lang="ar">{currentSurah.arabic}</p>
            <p className="text-slate-500 text-sm">{currentSurah.name} · {currentSurah.verses} versets</p>
            {currentSurah.number !== 9 && <p className="text-2xl font-serif text-emerald-400 mt-4" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>}
          </div>
          {versesLoading && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                <div className="flex gap-1">{[...Array(3)].map((_,i) => (<motion.div key={i} className="w-2 h-2 bg-blue-400 rounded-full" animate={{ y: [0,-6,0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}/>))}</div>
                <div><p className="text-blue-300 text-sm font-semibold">Chargement en cours…</p><p className="text-slate-600 text-xs">Récupération des versets (arabe · phonétique · français)</p></div>
              </div>
              {Array.from({ length: 4 }, (_, i) => (<div key={i} className="p-4 rounded-2xl bg-white/3 animate-pulse space-y-3"><div className="h-8 bg-white/8 rounded-xl"/><div className="h-3 bg-blue-500/10 rounded-lg w-3/4"/><div className="h-3 bg-white/5 rounded-lg w-2/3"/></div>))}
            </div>
          )}
          {versesError === "not_embedded" && (
            <div className="text-center py-10 space-y-4 px-4">
              <p className="text-4xl">⬇️</p>
              <p className="text-white font-bold text-sm">Sourate non téléchargée</p>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">Cette sourate doit être téléchargée avant d'être lue. Reviens à la liste et appuie sur ⬇ à côté de son nom.</p>
              <button onClick={() => setCurrentSurah(null)} className="px-5 py-2.5 bg-blue-500/15 text-blue-300 border border-blue-500/25 rounded-2xl text-sm font-bold hover:bg-blue-500/25 transition-all">← Retour à la liste</button>
            </div>
          )}
          {versesError === "api_error" && (
            <div className="text-center py-8 space-y-3 px-4">
              <p className="text-4xl">⚠️</p>
              <p className="text-orange-400 text-sm font-semibold">Erreur de chargement</p>
              <p className="text-slate-500 text-xs">Vérifie ta connexion et réessaie.</p>
              <button onClick={() => { if (!currentSurah) return; const n = currentSurah.number; _versesMemCache.delete(n); setCurrentSurah(null); setTimeout(() => setCurrentSurah(QURAN_SURAHS[n - 1]), 100); }}
                className="px-5 py-2.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 rounded-2xl text-sm font-bold hover:bg-emerald-500/25 transition-all">🔄 Réessayer</button>
              <button onClick={() => setCurrentSurah(null)} className="block mx-auto px-4 py-2 bg-white/8 text-slate-400 rounded-xl text-xs hover:bg-white/15 transition-all">← Retour à la liste</button>
            </div>
          )}
          {!versesLoading && !versesError && verses.length > 0 && (
            <div className="space-y-3">
              {getJuzFilteredVerses(verses).map((v, i) => (
                <motion.div key={v.number} ref={el => { verseRefs.current[v.number] = el; }}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.5) }}
                  onClick={() => handleVerseBookmark(v.number)}
                  className={`group relative p-4 rounded-2xl cursor-pointer select-none hover:bg-amber-500/6 active:bg-amber-500/15 border transition-all duration-150 ${targetVerse === v.number ? "border-emerald-500/50 bg-emerald-500/8" : "border-transparent hover:border-amber-500/15"}`}>
                  <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-40 transition-all"><Bookmark className="w-4 h-4 text-amber-400"/></div>
                  <div className="flex items-start gap-3 mb-2">
                    <span className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0 mt-1 select-none">{v.number}</span>
                    {v.tajweed ? (
                      <p className="text-right leading-[2.5] flex-1 select-text" dir="rtl" lang="ar"
                        style={{ fontSize: "clamp(1.2rem, 4.5vw, 1.7rem)", fontFamily: "'Amiri Quran','Scheherazade New',serif" }}
                        dangerouslySetInnerHTML={{ __html: v.tajweed }}/>
                    ) : (
                      <p className="text-right font-serif text-white leading-[2.4] flex-1 select-text" dir="rtl" lang="ar" style={{ fontSize: "clamp(1.2rem, 4.5vw, 1.6rem)" }}>{v.arabic}</p>
                    )}
                  </div>
                  {v.transliteration && <p className="ml-10 text-xs text-slate-400 italic leading-relaxed mb-1.5 select-text" dir="ltr">{v.transliteration}</p>}
                  {v.french && <p className="ml-10 text-sm text-slate-400 italic leading-relaxed bg-white/3 rounded-xl px-3 py-2 select-text">{v.french}</p>}
                </motion.div>
              ))}
            </div>
          )}
          <div className="mt-8 pt-8 border-t border-white/10 text-center space-y-4">
            <p className="text-slate-400 text-sm">Fin de {currentSurah.name}</p>
            {!checked[currentSurah.number] && (
              <button onClick={() => toggle(currentSurah.number)} className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-2xl shadow-lg text-sm hover:shadow-emerald-500/25 transition-all">✅ Marquer comme lue</button>
            )}
            {currentSurah.number < 114 && (
              <button onClick={() => setCurrentSurah(QURAN_SURAHS[currentSurah.number])} className="block mx-auto text-slate-500 hover:text-white text-sm transition-all">Sourate suivante : {QURAN_SURAHS[currentSurah.number].name} →</button>
            )}
          </div>
          <div className="h-10"/>
        </div>
      </div>
    );
  }

  const downloadedCount = Object.values(dlStatus).filter(v => v === "done").length;
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center gap-3">
        <input type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Rechercher une sourate..."
          className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-4 py-3 text-white placeholder-slate-600 text-sm focus:outline-none focus:border-emerald-500/40 transition-all"/>
        <div className="text-right shrink-0"><p className="text-emerald-400 font-bold text-sm">{counts.surahChecked}/114</p><p className="text-slate-600 text-xs">lues</p></div>
      </div>
      <div className="p-3 bg-blue-500/8 border border-blue-500/20 rounded-2xl flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-blue-300 text-xs font-semibold">📥 {downloadedCount}/114 sourates disponibles hors-ligne</p>
          <p className="text-slate-600 text-xs mt-0.5">Appuie sur ⬇ pour télécharger une sourate avant de la lire</p>
        </div>
        <div className="w-16 shrink-0">
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${(downloadedCount / 114) * 100}%` }}/></div>
          <p className="text-blue-400 text-xs text-center mt-1 font-bold">{Math.round((downloadedCount/114)*100)}%</p>
        </div>
      </div>
      <div className="space-y-2">
        {filtered.map((s, i) => {
          const status = dlStatus[s.number];
          const isDone = status === "done";
          const isLoading = status === "loading";
          const isError = status === "error";
          const isEmbedded = !!EMBEDDED_VERSES[s.number];
          return (
            <motion.div key={s.number} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.01, 0.3) }}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${checked[s.number] ? "bg-emerald-500/10 border-emerald-500/25" : isDone ? "bg-white/4 border-blue-500/15" : "bg-white/4 border-white/8"}`}>
              <div onClick={() => toggle(s.number)} className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 cursor-pointer transition-all ${checked[s.number] ? "bg-emerald-500 text-white" : "bg-white/8 text-slate-400 hover:bg-white/15"}`}>
                {checked[s.number] ? <CheckCircle className="w-5 h-5"/> : s.number}
              </div>
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setCurrentSurah(s)}>
                <p className="font-semibold text-white text-sm">{s.name}</p>
                <p className="text-xs text-slate-600">{s.verses} versets · Juz {s.juz}</p>
              </div>
              <p className="text-xl font-serif text-slate-400 shrink-0 hidden sm:block" dir="rtl">{s.arabic}</p>
              {isDone ? (
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" title={isEmbedded ? "Intégrée" : "Téléchargée"}><span className="text-sm">{isEmbedded ? "✨" : "✅"}</span></div>
              ) : isLoading ? (
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0"><motion.div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}/></div>
              ) : (
                <button onClick={(e) => downloadSurah(s, e)} title="Télécharger pour lire hors-ligne"
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${isError ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "bg-white/8 text-slate-500 hover:bg-blue-500/20 hover:text-blue-400"}`}>
                  <span className="text-sm">{isError ? "↺" : "⬇"}</span>
                </button>
              )}
              <button onClick={() => setCurrentSurah(s)} className="p-2 text-slate-600 hover:text-white hover:bg-white/10 rounded-xl transition-all shrink-0"><ChevronRight className="w-4 h-4"/></button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// DONNÉES VERSETS INTÉGRÉES
// ════════════════════════════════════════════════════════════════════
const EMBEDDED_VERSES = {
  1:[
    {number:1,arabic:"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",transliteration:"Bismi llāhi r-raḥmāni r-raḥīm",french:"Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux"},
    {number:2,arabic:"الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",transliteration:"Al-ḥamdu li-llāhi rabbi l-ʿālamīn",french:"Louange à Allah, Seigneur de l'univers"},
    {number:3,arabic:"الرَّحْمَٰنِ الرَّحِيمِ",transliteration:"Ar-raḥmāni r-raḥīm",french:"Le Tout Miséricordieux, le Très Miséricordieux"},
    {number:4,arabic:"مَالِكِ يَوْمِ الدِّينِ",transliteration:"Māliki yawmi d-dīn",french:"Maître du Jour de la rétribution"},
    {number:5,arabic:"إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",transliteration:"Iyyāka naʿbudu wa-iyyāka nastaʿīn",french:"C'est Toi Seul que nous adorons, et c'est Toi Seul dont nous implorons le secours"},
    {number:6,arabic:"اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",transliteration:"Ihdinā ṣ-ṣirāṭa l-mustaqīm",french:"Guide-nous dans le droit chemin"},
    {number:7,arabic:"صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",transliteration:"Ṣirāṭa lladhīna anʿamta ʿalayhim ġayri l-maġḍūbi ʿalayhim wa-lā ḍ-ḍāllīn",french:"Le chemin de ceux que Tu as comblés de faveurs, non ceux qui ont encouru Ta colère ni des égarés"},
  ],
  93:[
    {number:1,arabic:"وَالضُّحَىٰ",transliteration:"Wa-ḍ-ḍuḥā",french:"Par le matin lumineux !"},
    {number:2,arabic:"وَاللَّيْلِ إِذَا سَجَىٰ",transliteration:"Wa-l-layli idhā sajā",french:"Par la nuit quand elle est tranquille !"},
    {number:3,arabic:"مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ",transliteration:"Mā waddaʿaka rabbuka wa-mā qalā",french:"Ton Seigneur ne t'a pas abandonné et ne te hait point"},
    {number:4,arabic:"وَلَلْآخِرَةُ خَيْرٌ لَّكَ مِنَ الْأُولَىٰ",transliteration:"Wa-la-l-ākhiratu khayrun laka mina l-ūlā",french:"L'au-delà est certainement meilleur pour toi que la vie ici-bas"},
    {number:5,arabic:"وَلَسَوْفَ يُعْطِيكَ رَبُّكَ فَتَرْضَىٰ",transliteration:"Wa-la-sawfa yuʿṭīka rabbuka fa-tarḍā",french:"Et ton Seigneur te donnera et tu seras satisfait"},
    {number:6,arabic:"أَلَمْ يَجِدْكَ يَتِيمًا فَآوَىٰ",transliteration:"Alam yajidka yatīman fa-āwā",french:"Ne t'a-t-Il pas trouvé orphelin et recueilli ?"},
    {number:7,arabic:"وَوَجَدَكَ ضَالًّا فَهَدَىٰ",transliteration:"Wa-wajadaka ḍāllan fa-hadā",french:"Ne t'a-t-Il pas trouvé égaré et guidé ?"},
    {number:8,arabic:"وَوَجَدَكَ عَائِلًا فَأَغْنَىٰ",transliteration:"Wa-wajadaka ʿāʾilan fa-aġnā",french:"Ne t'a-t-Il pas trouvé pauvre et enrichi ?"},
    {number:9,arabic:"فَأَمَّا الْيَتِيمَ فَلَا تَقْهَرْ",transliteration:"Fa-ammā l-yatīma fa-lā taqhar",french:"Quant à l'orphelin, ne le brime donc pas"},
    {number:10,arabic:"وَأَمَّا السَّائِلَ فَلَا تَنْهَرْ",transliteration:"Wa-ammā s-sāʾila fa-lā tanhar",french:"Quant au mendiant, ne le rabroue donc pas"},
    {number:11,arabic:"وَأَمَّا بِنِعْمَةِ رَبِّكَ فَحَدِّثْ",transliteration:"Wa-ammā bi-niʿmati rabbika fa-ḥaddith",french:"Et quant aux bienfaits de ton Seigneur, proclame-les"},
  ],
  94:[
    {number:1,arabic:"أَلَمْ نَشْرَحْ لَكَ صَدْرَكَ",transliteration:"Alam našraḥ laka ṣadrak",french:"N'avons-Nous pas déployé ta poitrine ?"},
    {number:2,arabic:"وَوَضَعْنَا عَنكَ وِزْرَكَ",transliteration:"Wa-waḍaʿnā ʿanka wizrak",french:"Et n'avons-Nous pas déposé ton fardeau"},
    {number:3,arabic:"الَّذِي أَنقَضَ ظَهْرَكَ",transliteration:"Alladhī anqaḍa ẓahrak",french:"qui alourdissait ton dos ?"},
    {number:4,arabic:"وَرَفَعْنَا لَكَ ذِكْرَكَ",transliteration:"Wa-rafaʿnā laka dhikrak",french:"N'avons-Nous pas élevé pour toi ta renommée ?"},
    {number:5,arabic:"فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",transliteration:"Fa-inna maʿa l-ʿusri yusrā",french:"En vérité, avec la difficulté vient la facilité"},
    {number:6,arabic:"إِنَّ مَعَ الْعُسْرِ يُسْرًا",transliteration:"Inna maʿa l-ʿusri yusrā",french:"Oui, avec la difficulté vient la facilité"},
    {number:7,arabic:"فَإِذَا فَرَغْتَ فَانصَبْ",transliteration:"Fa-idhā faraġta fa-nṣab",french:"Quand tu te libères, travaille ardemment"},
    {number:8,arabic:"وَإِلَىٰ رَبِّكَ فَارْغَب",transliteration:"Wa-ilā rabbika fa-rġab",french:"et vers ton Seigneur aspire"},
  ],
  95:[
    {number:1,arabic:"وَالتِّينِ وَالزَّيْتُونِ",transliteration:"Wa-t-tīni wa-z-zaytūn",french:"Par le figuier et l'olivier !"},
    {number:2,arabic:"وَطُورِ سِينِينَ",transliteration:"Wa-ṭūri sīnīn",french:"Par le Mont Sinaï !"},
    {number:3,arabic:"وَهَٰذَا الْبَلَدِ الْأَمِينِ",transliteration:"Wa-hādhā l-baladi l-amīn",french:"Par cette Cité sûre !"},
    {number:4,arabic:"لَقَدْ خَلَقْنَا الْإِنسَانَ فِي أَحْسَنِ تَقْوِيمٍ",transliteration:"Laqad khalaqnā l-insāna fī aḥsani taqwīm",french:"Nous avons certes créé l'homme dans la plus belle forme"},
    {number:5,arabic:"ثُمَّ رَدَدْنَاهُ أَسْفَلَ سَافِلِينَ",transliteration:"Thumma radadnāhu asfala sāfilīn",french:"puis Nous l'avons ramené au niveau le plus bas"},
    {number:6,arabic:"إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ فَلَهُمْ أَجْرٌ غَيْرُ مَمْنُونٍ",transliteration:"Illā lladhīna āmanū wa-ʿamilū ṣ-ṣāliḥāti fa-lahum ajrun ġayru mamnūn",french:"sauf ceux qui croient et font de bonnes oeuvres, ils auront une récompense sans fin"},
    {number:7,arabic:"فَمَا يُكَذِّبُكَ بَعْدُ بِالدِّينِ",transliteration:"Fa-mā yukadhdhibuka baʿdu bi-d-dīn",french:"Alors qu'est-ce qui te fait nier le Jugement ?"},
    {number:8,arabic:"أَلَيْسَ اللَّهُ بِأَحْكَمِ الْحَاكِمِينَ",transliteration:"A-laysa llāhu bi-aḥkami l-ḥākimīn",french:"Allah n'est-Il pas le plus sage des juges ?"},
  ],
  103:[{number:1,arabic:"وَالْعَصْرِ",transliteration:"Wa-l-ʿaṣr",french:"Par le Temps !"},{number:2,arabic:"إِنَّ الْإِنسَانَ لَفِي خُسْرٍ",transliteration:"Inna l-insāna la-fī khusr",french:"L'être humain est certes en perdition"},{number:3,arabic:"إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ",transliteration:"Illā lladhīna āmanū wa-ʿamilū ṣ-ṣāliḥāti wa-tawāṣaw bi-l-ḥaqqi wa-tawāṣaw bi-ṣ-ṣabr",french:"sauf ceux qui ont cru, accompli les bonnes oeuvres, se sont recommandé mutuellement la vérité et la patience"}],
  105:[{number:1,arabic:"أَلَمْ تَرَ كَيْفَ فَعَلَ رَبُّكَ بِأَصْحَابِ الْفِيلِ",transliteration:"Alam tara kayfa faʿala rabbuka bi-aṣḥābi l-fīl",french:"N'as-tu pas vu comment ton Seigneur a agi avec les Compagnons de l'Éléphant ?"},{number:2,arabic:"أَلَمْ يَجْعَلْ كَيْدَهُمْ فِي تَضْلِيلٍ",transliteration:"Alam yajʿal kaydahum fī taḍlīl",french:"N'a-t-Il pas rendu vaine leur ruse ?"},{number:3,arabic:"وَأَرْسَلَ عَلَيْهِمْ طَيْرًا أَبَابِيلَ",transliteration:"Wa-arsala ʿalayhim ṭayran abābīl",french:"Il envoya contre eux des oiseaux par volées"},{number:4,arabic:"تَرْمِيهِم بِحِجَارَةٍ مِّن سِجِّيلٍ",transliteration:"Tarmīhim bi-ḥijāratin min sijjīl",french:"qui leur lançaient des pierres d'argile cuite"},{number:5,arabic:"فَجَعَلَهُمْ كَعَصْفٍ مَّأْكُولٍ",transliteration:"Fa-jaʿalahum ka-ʿaṣfin maʾkūl",french:"et Il les rendit pareils à des feuilles dévorées"}],
  106:[{number:1,arabic:"لِإِيلَافِ قُرَيْشٍ",transliteration:"Li-ʾīlāfi qurayš",french:"Pour la cohésion des Quraysh"},{number:2,arabic:"إِيلَافِهِمْ رِحْلَةَ الشِّتَاءِ وَالصَّيْفِ",transliteration:"Īlāfihim riḥlata š-šitāʾi wa-ṣ-ṣayf",french:"leur cohésion lors des voyages d'hiver et d'été"},{number:3,arabic:"فَلْيَعْبُدُوا رَبَّ هَٰذَا الْبَيْتِ",transliteration:"Fa-l-yaʿbudū rabba hādhā l-bayt",french:"Qu'ils adorent donc le Seigneur de cette Maison"},{number:4,arabic:"الَّذِي أَطْعَمَهُم مِّن جُوعٍ وَآمَنَهُم مِّنْ خَوْفٍ",transliteration:"Alladhī aṭʿamahum min jūʿin wa-āmanahum min khawf",french:"qui les a nourris contre la faim et préservés de la crainte"}],
  107:[{number:1,arabic:"أَرَأَيْتَ الَّذِي يُكَذِّبُ بِالدِّينِ",transliteration:"Araʾayta lladhī yukadhdhibu bi-d-dīn",french:"As-tu vu celui qui traite de mensonge la Rétribution ?"},{number:2,arabic:"فَذَٰلِكَ الَّذِي يَدُعُّ الْيَتِيمَ",transliteration:"Fadhālika lladhī yadhuʿʿu l-yatīm",french:"C'est lui qui repousse l'orphelin brutalement"},{number:3,arabic:"وَلَا يَحُضُّ عَلَىٰ طَعَامِ الْمِسْكِينِ",transliteration:"Wa-lā yaḥuḍḍu ʿalā ṭaʿāmi l-miskīn",french:"et qui n'encourage pas à nourrir le pauvre"},{number:4,arabic:"فَوَيْلٌ لِّلْمُصَلِّينَ",transliteration:"Fa-waylun li-l-muṣallīn",french:"Malheur donc à ceux qui font la Salāt"},{number:5,arabic:"الَّذِينَ هُمْ عَن صَلَاتِهِمْ سَاهُونَ",transliteration:"Alladhīna hum ʿan ṣalātihim sāhūn",french:"qui sont distraits dans leur Salāt"},{number:6,arabic:"الَّذِينَ هُمْ يُرَاءُونَ",transliteration:"Alladhīna hum yurāʾūn",french:"qui font de l'ostentation"},{number:7,arabic:"وَيَمْنَعُونَ الْمَاعُونَ",transliteration:"Wa-yamnaʿūna l-māʿūn",french:"et refusent l'entraide courante"}],
  108:[{number:1,arabic:"إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ",transliteration:"Innā aʿṭaynāka l-kawthar",french:"Nous t'avons accordé l'Abondance"},{number:2,arabic:"فَصَلِّ لِرَبِّكَ وَانْحَرْ",transliteration:"Faṣalli li-rabbika wa-nḥar",french:"Accomplis donc la Salāt pour ton Seigneur et sacrifie"},{number:3,arabic:"إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ",transliteration:"Inna šāniʾaka huwa l-abtar",french:"C'est bien ton ennemi qui est sans postérité"}],
  109:[{number:1,arabic:"قُلْ يَا أَيُّهَا الْكَافِرُونَ",transliteration:"Qul yā ayyuhā l-kāfirūn",french:"Dis : Ô vous les mécréants"},{number:2,arabic:"لَا أَعْبُدُ مَا تَعْبُدُونَ",transliteration:"Lā aʿbudu mā taʿbudūn",french:"Je n'adore pas ce que vous adorez"},{number:3,arabic:"وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ",transliteration:"Wa-lā antum ʿābidūna mā aʿbud",french:"Et vous n'adorez pas ce que j'adore"},{number:4,arabic:"وَلَا أَنَا عَابِدٌ مَّا عَبَدتُّمْ",transliteration:"Wa-lā anā ʿābidun mā ʿabadtum",french:"Je ne suis pas adorateur de ce que vous avez adoré"},{number:5,arabic:"وَلَا أَنتُمْ عَابِدُونَ مَا أَعْبُدُ",transliteration:"Wa-lā antum ʿābidūna mā aʿbud",french:"Et vous n'êtes pas adorateurs de ce que j'adore"},{number:6,arabic:"لَكُمْ دِينُكُمْ وَلِيَ دِينِ",transliteration:"Lakum dīnukum wa-liya dīn",french:"À vous votre religion, et à moi la mienne"}],
  110:[{number:1,arabic:"إِذَا جَاءَ نَصْرُ اللَّهِ وَالْفَتْحُ",transliteration:"Idhā jāʾa naṣru llāhi wa-l-fatḥ",french:"Quand vient le secours d'Allah et la victoire"},{number:2,arabic:"وَرَأَيْتَ النَّاسَ يَدْخُلُونَ فِي دِينِ اللَّهِ أَفْوَاجًا",transliteration:"Wa-raʾayta n-nāsa yadkhulūna fī dīni llāhi afwājā",french:"et que tu vois les gens entrer en foule dans la religion d'Allah"},{number:3,arabic:"فَسَبِّحْ بِحَمْدِ رَبِّكَ وَاسْتَغْفِرْهُ إِنَّهُ كَانَ تَوَّابًا",transliteration:"Fasabbiḥ bi-ḥamdi rabbika wa-staġfirhu innahū kāna tawwābā",french:"alors célèbre la gloire de ton Seigneur et implore Son pardon. Certes Il est le Grand Repentant"}],
  112:[{number:1,arabic:"قُلْ هُوَ اللَّهُ أَحَدٌ",transliteration:"Qul huwa llāhu aḥad",french:"Dis : Il est Allah, Unique"},{number:2,arabic:"اللَّهُ الصَّمَدُ",transliteration:"Allāhu ṣ-ṣamad",french:"Allah, le Seul à être imploré pour ce que nous désirons"},{number:3,arabic:"لَمْ يَلِدْ وَلَمْ يُولَدْ",transliteration:"Lam yalid wa-lam yūlad",french:"Il n'a pas engendré, et n'a pas été engendré"},{number:4,arabic:"وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ",transliteration:"Wa-lam yakun lahū kufuwan aḥad",french:"Et nul n'est égal à Lui"}],
  113:[{number:1,arabic:"قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ",transliteration:"Qul aʿūdhu bi-rabbi l-falaq",french:"Dis : Je cherche refuge auprès du Seigneur de l'aurore"},{number:2,arabic:"مِن شَرِّ مَا خَلَقَ",transliteration:"Min šarri mā khalaq",french:"contre le mal de ce qu'Il a créé"},{number:3,arabic:"وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ",transliteration:"Wa-min šarri ġāsiqin idhā waqab",french:"contre le mal de l'obscurité quand elle s'étend"},{number:4,arabic:"وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ",transliteration:"Wa-min šarri n-naffāthāti fī l-ʿuqad",french:"contre le mal de celles qui soufflent sur les noeuds"},{number:5,arabic:"وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ",transliteration:"Wa-min šarri ḥāsidin idhā ḥasad",french:"contre le mal de l'envieux quand il envie"}],
  114:[{number:1,arabic:"قُلْ أَعُوذُ بِرَبِّ النَّاسِ",transliteration:"Qul aʿūdhu bi-rabbi n-nās",french:"Dis : Je cherche refuge auprès du Seigneur des hommes"},{number:2,arabic:"مَلِكِ النَّاسِ",transliteration:"Maliki n-nās",french:"du Roi des hommes"},{number:3,arabic:"إِلَٰهِ النَّاسِ",transliteration:"Ilāhi n-nās",french:"de la Divinité des hommes"},{number:4,arabic:"مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ",transliteration:"Min šarri l-waswāsi l-khannās",french:"contre le mal du tentateur furtif"},{number:5,arabic:"الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ",transliteration:"Alladhī yuwaswisu fī ṣudūri n-nās",french:"qui souffle le mal dans les poitrines des hommes"},{number:6,arabic:"مِنَ الْجِنَّةِ وَالنَّاسِ",transliteration:"Mina l-jinnati wa-n-nās",french:"qu'il soit parmi les djinns ou parmi les hommes"}],
  96:[{number:1,arabic:"اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ",transliteration:"Iqraʾ bi-smi rabbika lladhī khalaq",french:"Lis au nom de ton Seigneur qui a créé"},{number:2,arabic:"خَلَقَ الْإِنسَانَ مِنْ عَلَقٍ",transliteration:"Khalaqa l-insāna min ʿalaq",french:"Il a créé l'homme d'une adhérence"},{number:3,arabic:"اقْرَأْ وَرَبُّكَ الْأَكْرَمُ",transliteration:"Iqraʾ wa-rabbuka l-akram",french:"Lis, et ton Seigneur est le Plus Généreux"},{number:4,arabic:"الَّذِي عَلَّمَ بِالْقَلَمِ",transliteration:"Alladhī ʿallama bi-l-qalam",french:"Celui qui a enseigné par le calame"},{number:5,arabic:"عَلَّمَ الْإِنسَانَ مَا لَمْ يَعْلَمْ",transliteration:"ʿAllama l-insāna mā lam yaʿlam",french:"Il a enseigné à l'homme ce qu'il ne savait pas"},{number:6,arabic:"كَلَّا إِنَّ الْإِنسَانَ لَيَطْغَىٰ",transliteration:"Kallā inna l-insāna la-yaṭġā",french:"Mais non, l'homme se rebelle vraiment"},{number:7,arabic:"أَن رَّآهُ اسْتَغْنَىٰ",transliteration:"An raʾāhu staġnā",french:"parce qu'il se voit à l'aise"},{number:8,arabic:"إِنَّ إِلَىٰ رَبِّكَ الرُّجْعَىٰ",transliteration:"Inna ilā rabbika r-rujʿā",french:"Certes, vers ton Seigneur est le retour"},{number:9,arabic:"أَرَأَيْتَ الَّذِي يَنْهَىٰ",transliteration:"Araʾayta lladhī yanhā",french:"As-tu vu celui qui interdit"},{number:10,arabic:"عَبْدًا إِذَا صَلَّىٰ",transliteration:"ʿAbdan idhā ṣallā",french:"à un serviteur de faire la salāt ?"},{number:11,arabic:"أَرَأَيْتَ إِن كَانَ عَلَى الْهُدَىٰ",transliteration:"Araʾayta in kāna ʿalā l-hudā",french:"As-tu vu s'il est dans la bonne direction"},{number:12,arabic:"أَوْ أَمَرَ بِالتَّقْوَىٰ",transliteration:"Aw amara bi-t-taqwā",french:"ou s'il ordonne la piété ?"},{number:13,arabic:"أَرَأَيْتَ إِن كَذَّبَ وَتَوَلَّىٰ",transliteration:"Araʾayta in kadhdhaba wa-tawallā",french:"As-tu vu s'il dément et se détourne ?"},{number:14,arabic:"أَلَمْ يَعْلَم بِأَنَّ اللَّهَ يَرَىٰ",transliteration:"Alam yaʿlam bi-anna llāha yarā",french:"Ne sait-il pas qu'Allah voit ?"},{number:15,arabic:"كَلَّا لَئِن لَّمْ يَنتَهِ لَنَسْفَعًا بِالنَّاصِيَةِ",transliteration:"Kallā la-in lam yantahi la-nasfahʿan bi-n-nāṣiya",french:"Si vraiment il ne cesse pas, Nous le saisirons par la mèche"},{number:16,arabic:"نَاصِيَةٍ كَاذِبَةٍ خَاطِئَةٍ",transliteration:"Nāṣiyatin kādhibatin khāṭiʾa",french:"une mèche menteuse et pécheresse"},{number:17,arabic:"فَلْيَدْعُ نَادِيَهُ",transliteration:"Fa-l-yadʿu nādiyah",french:"Qu'il appelle donc ses partisans"},{number:18,arabic:"سَنَدْعُ الزَّبَانِيَةَ",transliteration:"Sa-nadʿu z-zabāniya",french:"Nous appellerons les anges gardiens du feu"},{number:19,arabic:"كَلَّا لَا تُطِعْهُ وَاسْجُدْ وَاقْتَرِب",transliteration:"Kallā lā tuṭiʿhu wa-sjud wa-qtarib",french:"Non ! Ne lui obéis pas ; prosterne-toi et rapproche-toi"}],
  97:[{number:1,arabic:"إِنَّا أَنزَلْنَاهُ فِي لَيْلَةِ الْقَدْرِ",transliteration:"Innā anzalnāhu fī laylati l-qadr",french:"Nous l'avons certes fait descendre lors de la Nuit du Destin"},{number:2,arabic:"وَمَا أَدْرَاكَ مَا لَيْلَةُ الْقَدْرِ",transliteration:"Wa-mā adrāka mā laylatu l-qadr",french:"Et qui te dira ce qu'est la Nuit du Destin ?"},{number:3,arabic:"لَيْلَةُ الْقَدْرِ خَيْرٌ مِّنْ أَلْفِ شَهْرٍ",transliteration:"Laylatu l-qadri khayrun min alfi shahr",french:"La Nuit du Destin est meilleure que mille mois"},{number:4,arabic:"تَنَزَّلُ الْمَلَائِكَةُ وَالرُّوحُ فِيهَا بِإِذْنِ رَبِّهِم مِّن كُلِّ أَمْرٍ",transliteration:"Tanazzalu l-malāʾikatu wa-r-rūḥu fīhā bi-idhni rabbihim min kulli amr",french:"Les anges et l'Esprit y descendent par permission de leur Seigneur pour tout ordre"},{number:5,arabic:"سَلَامٌ هِيَ حَتَّىٰ مَطْلَعِ الْفَجْرِ",transliteration:"Salāmun hiya ḥattā maṭlaʿi l-fajr",french:"Paix en cette nuit jusqu'à l'apparition de l'aube"}],
  98:[{number:1,arabic:"لَمْ يَكُنِ الَّذِينَ كَفَرُوا مِنْ أَهْلِ الْكِتَابِ وَالْمُشْرِكِينَ مُنفَكِّينَ",transliteration:"Lam yakuni lladhīna kafarū min ahli l-kitābi wa-l-mushrikīna munfakkīn",french:"Ceux qui ont mécru, parmi les gens du Livre et les associateurs, n'allaient pas cesser"},{number:2,arabic:"حَتَّىٰ تَأْتِيَهُمُ الْبَيِّنَةُ",transliteration:"Ḥattā taʾtiyahumu l-bayyina",french:"jusqu'à ce que leur vienne la preuve claire"},{number:3,arabic:"رَسُولٌ مِّنَ اللَّهِ يَتْلُو صُحُفًا مُّطَهَّرَةً",transliteration:"Rasūlun mina llāhi yatlū ṣuḥufan muṭahhara",french:"un Messager d'Allah récitant des pages purifiées"},{number:4,arabic:"فِيهَا كُتُبٌ قَيِّمَةٌ",transliteration:"Fīhā kutubun qayyima",french:"où se trouvent des écrits de valeur"},{number:5,arabic:"وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ مُخْلِصِينَ لَهُ الدِّينَ",transliteration:"Wa-mā umirū illā li-yaʿbudū llāha mukhlisīna lahū d-dīn",french:"Il ne leur a été commandé que d'adorer Allah avec une dévotion sincère"},{number:6,arabic:"حُنَفَاءَ وَيُقِيمُوا الصَّلَاةَ وَيُؤْتُوا الزَّكَاةَ ۚ وَذَٰلِكَ دِينُ الْقَيِّمَةِ",transliteration:"Ḥunafāʾa wa-yuqīmū ṣ-ṣalāta wa-yuʾtū z-zakāta wa-dhālika dīnu l-qayyima",french:"comme des exclusifs, accomplir la salāt et acquitter la zakāt. C'est là la religion de droiture"},{number:7,arabic:"إِنَّ الَّذِينَ كَفَرُوا مِنْ أَهْلِ الْكِتَابِ وَالْمُشْرِكِينَ فِي نَارِ جَهَنَّمَ",transliteration:"Inna lladhīna kafarū min ahli l-kitābi wa-l-mushrikīna fī nāri jahannama",french:"Ceux qui ont mécru, parmi les gens du Livre et les associateurs, iront au feu de la Géhenne"},{number:8,arabic:"إِنَّ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ أُولَٰئِكَ هُمْ خَيْرُ الْبَرِيَّةِ",transliteration:"Inna lladhīna āmanū wa-ʿamilū ṣ-ṣāliḥāti ulāʾika hum khayru l-bariyya",french:"Ceux qui croient et font de bonnes oeuvres, ceux-là sont les meilleures créatures"}],
  99:[{number:1,arabic:"إِذَا زُلْزِلَتِ الْأَرْضُ زِلْزَالَهَا",transliteration:"Idhā zulzilati l-arḍu zilzālahā",french:"Quand la terre sera secouée de son séisme"},{number:2,arabic:"وَأَخْرَجَتِ الْأَرْضُ أَثْقَالَهَا",transliteration:"Wa-akhrajati l-arḍu athqālahā",french:"et que la terre expulsera ses fardeaux"},{number:3,arabic:"وَقَالَ الْإِنسَانُ مَا لَهَا",transliteration:"Wa-qāla l-insānu mā lahā",french:"et que l'homme dira : Qu'a-t-elle ?"},{number:4,arabic:"يَوْمَئِذٍ تُحَدِّثُ أَخْبَارَهَا",transliteration:"Yawmaʾidhin tuḥaddithu akhbārahā",french:"Ce jour-là, elle relatera ses nouvelles"},{number:5,arabic:"بِأَنَّ رَبَّكَ أَوْحَىٰ لَهَا",transliteration:"Bi-anna rabbaka awḥā lahā",french:"parce que ton Seigneur lui aura révélé cela"},{number:6,arabic:"يَوْمَئِذٍ يَصْدُرُ النَّاسُ أَشْتَاتًا لِّيُرَوْا أَعْمَالَهُمْ",transliteration:"Yawmaʾidhin yaṣduru n-nāsu ashtātan li-yuraw aʿmālahum",french:"Ce jour-là, les gens sortiront en groupes distincts pour qu'on leur montre leurs oeuvres"},{number:7,arabic:"فَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ خَيْرًا يَرَهُ",transliteration:"Fa-man yaʿmal mithqāla dharratin khayran yarah",french:"Quiconque fait le poids d'un atome de bien le verra"},{number:8,arabic:"وَمَن يَعْمَلْ مِثْقَالَ ذَرَّةٍ شَرًّا يَرَهُ",transliteration:"Wa-man yaʿmal mithqāla dharratin sharran yarah",french:"et quiconque fait le poids d'un atome de mal le verra"}],
  100:[{number:1,arabic:"وَالْعَادِيَاتِ ضَبْحًا",transliteration:"Wa-l-ʿādiyāti ḍabḥā",french:"Par les cavales soufflantes"},{number:2,arabic:"فَالْمُورِيَاتِ قَدْحًا",transliteration:"Fa-l-mūriyāti qadḥā",french:"et celles qui font jaillir des étincelles"},{number:3,arabic:"فَالْمُغِيرَاتِ صُبْحًا",transliteration:"Fa-l-muġīrāti ṣubḥā",french:"et celles qui attaquent au matin"},{number:4,arabic:"فَأَثَرْنَ بِهِ نَقْعًا",transliteration:"Fa-atharna bihī naqʿā",french:"et soulèvent un nuage de poussière"},{number:5,arabic:"فَوَسَطْنَ بِهِ جَمْعًا",transliteration:"Fa-wasaṭna bihī jamʿā",french:"et se trouvent au milieu d'un rassemblement"},{number:6,arabic:"إِنَّ الْإِنسَانَ لِرَبِّهِ لَكَنُودٌ",transliteration:"Inna l-insāna li-rabbihī la-kanūd",french:"L'homme est vraiment ingrat envers son Seigneur"},{number:7,arabic:"وَإِنَّهُ عَلَىٰ ذَٰلِكَ لَشَهِيدٌ",transliteration:"Wa-innahū ʿalā dhālika la-shahīd",french:"et lui-même en est témoin"},{number:8,arabic:"وَإِنَّهُ لِحُبِّ الْخَيْرِ لَشَدِيدٌ",transliteration:"Wa-innahū li-ḥubbi l-khayri la-shadīd",french:"et il est vraiment ardent dans l'amour des richesses"},{number:9,arabic:"أَفَلَا يَعْلَمُ إِذَا بُعْثِرَ مَا فِي الْقُبُورِ",transliteration:"Afa-lā yaʿlamu idhā buʿthira mā fī l-qubūr",french:"Ne sait-il pas que lorsque sera dispersé ce qui est dans les tombes"},{number:10,arabic:"وَحُصِّلَ مَا فِي الصُّدُورِ",transliteration:"Wa-ḥuṣṣila mā fī ṣ-ṣudūr",french:"et que sera divulgué ce qui est dans les poitrines"},{number:11,arabic:"إِنَّ رَبَّهُم بِهِمْ يَوْمَئِذٍ لَّخَبِيرٌ",transliteration:"Inna rabbahum bihim yawmaʾidhin la-khabīr",french:"leur Seigneur, ce jour-là, les connaît parfaitement"}],
  101:[{number:1,arabic:"الْقَارِعَةُ",transliteration:"Al-qāriʿa",french:"La Frappe"},{number:2,arabic:"مَا الْقَارِعَةُ",transliteration:"Ma l-qāriʿa",french:"Qu'est-ce que la Frappe ?"},{number:3,arabic:"وَمَا أَدْرَاكَ مَا الْقَارِعَةُ",transliteration:"Wa-mā adrāka ma l-qāriʿa",french:"Et qui te dira ce qu'est la Frappe ?"},{number:4,arabic:"يَوْمَ يَكُونُ النَّاسُ كَالْفَرَاشِ الْمَبْثُوثِ",transliteration:"Yawma yakūnu n-nāsu ka-l-farāshi l-mabthūth",french:"Le jour où les gens seront comme des papillons éparpillés"},{number:5,arabic:"وَتَكُونُ الْجِبَالُ كَالْعِهْنِ الْمَنفُوشِ",transliteration:"Wa-takūnu l-jibālu ka-l-ʿihni l-manfūsh",french:"et les montagnes comme de la laine cardée"},{number:6,arabic:"فَأَمَّا مَن ثَقُلَتْ مَوَازِينُهُ",transliteration:"Fa-ammā man thaqulat mawāzīnuh",french:"Quant à celui dont la balance est lourde"},{number:7,arabic:"فَهُوَ فِي عِيشَةٍ رَّاضِيَةٍ",transliteration:"Fa-huwa fī ʿīshatin rāḍiya",french:"il sera dans une vie agréable"},{number:8,arabic:"وَأَمَّا مَنْ خَفَّتْ مَوَازِينُهُ",transliteration:"Wa-ammā man khaffat mawāzīnuh",french:"Mais quant à celui dont la balance est légère"},{number:9,arabic:"فَأُمُّهُ هَاوِيَةٌ",transliteration:"Fa-ummuhū hāwiya",french:"sa mère est le gouffre"},{number:10,arabic:"وَمَا أَدْرَاكَ مَا هِيَهْ",transliteration:"Wa-mā adrāka mā hiyah",french:"Et qui te dira ce que c'est ?"},{number:11,arabic:"نَارٌ حَامِيَةٌ",transliteration:"Nārun ḥāmiya",french:"C'est un feu ardent"}],
  102:[{number:1,arabic:"أَلْهَاكُمُ التَّكَاثُرُ",transliteration:"Alhākumu t-takāthur",french:"La course aux richesses vous distrait"},{number:2,arabic:"حَتَّىٰ زُرْتُمُ الْمَقَابِرَ",transliteration:"Ḥattā zurtumu l-maqābir",french:"jusqu'à ce que vous visitiez les tombes"},{number:3,arabic:"كَلَّا سَوْفَ تَعْلَمُونَ",transliteration:"Kallā sawfa taʿlamūn",french:"Certainement, vous saurez bientôt"},{number:4,arabic:"ثُمَّ كَلَّا سَوْفَ تَعْلَمُونَ",transliteration:"Thumma kallā sawfa taʿlamūn",french:"Puis certes, vous saurez bientôt"},{number:5,arabic:"كَلَّا لَوْ تَعْلَمُونَ عِلْمَ الْيَقِينِ",transliteration:"Kallā law taʿlamūna ʿilma l-yaqīn",french:"Certes, si vous saviez d'une certitude absolue"},{number:6,arabic:"لَتَرَوُنَّ الْجَحِيمَ",transliteration:"La-tarawunna l-jaḥīm",french:"vous verrez certainement la Fournaise"},{number:7,arabic:"ثُمَّ لَتَرَوُنَّهَا عَيْنَ الْيَقِينِ",transliteration:"Thumma la-tarawunnahā ʿayna l-yaqīn",french:"puis vous la verrez de la certitude absolue"},{number:8,arabic:"ثُمَّ لَتُسْأَلُنَّ يَوْمَئِذٍ عَنِ النَّعِيمِ",transliteration:"Thumma la-tusʾalunna yawmaʾidhin ʿani n-naʿīm",french:"puis ce jour-là, vous serez interrogés sur les délices"}],
  104:[{number:1,arabic:"وَيْلٌ لِّكُلِّ هُمَزَةٍ لُّمَزَةٍ",transliteration:"Waylun li-kulli humazatin lumazah",french:"Malheur à tout calomniateur, diffamateur"},{number:2,arabic:"الَّذِي جَمَعَ مَالًا وَعَدَّدَهُ",transliteration:"Alladhī jamaʿa mālan wa-ʿaddadah",french:"qui amasse des richesses et les compte"},{number:3,arabic:"يَحْسَبُ أَنَّ مَالَهُ أَخْلَدَهُ",transliteration:"Yaḥsabu anna mālahu akhladah",french:"Il pense que sa richesse le rendra immortel"},{number:4,arabic:"كَلَّا لَيُنبَذَنَّ فِي الْحُطَمَةِ",transliteration:"Kallā la-yunbadhanna fī l-ḥuṭama",french:"Mais non ! Il sera jeté dans Al-Hutama"},{number:5,arabic:"وَمَا أَدْرَاكَ مَا الْحُطَمَةُ",transliteration:"Wa-mā adrāka ma l-ḥuṭama",french:"Et qui te dira ce qu'est Al-Hutama ?"},{number:6,arabic:"نَارُ اللَّهِ الْمُوقَدَةُ",transliteration:"Nāru llāhi l-mūqada",french:"C'est le feu d'Allah allumé"},{number:7,arabic:"الَّتِي تَطَّلِعُ عَلَى الْأَفْئِدَةِ",transliteration:"Allatī taṭṭaliʿu ʿalā l-afʾida",french:"qui monte jusqu'aux coeurs"},{number:8,arabic:"إِنَّهَا عَلَيْهِم مُّؤْصَدَةٌ",transliteration:"Innahā ʿalayhim muʾṣada",french:"Il se referme sur eux"},{number:9,arabic:"فِي عَمَدٍ مُّمَدَّدَةٍ",transliteration:"Fī ʿamadin mumaddada",french:"en colonnes allongées"}],
  111:[{number:1,arabic:"تَبَّتْ يَدَا أَبِي لَهَبٍ وَتَبَّ",transliteration:"Tabbat yadā abī lahabin wa-tabb",french:"Que périssent les deux mains d'Abī Lahab, et qu'il périsse"},{number:2,arabic:"مَا أَغْنَىٰ عَنْهُ مَالُهُ وَمَا كَسَبَ",transliteration:"Mā aġnā ʿanhu māluhu wa-mā kasab",french:"Sa richesse et ce qu'il a acquis ne lui ont servi à rien"},{number:3,arabic:"سَيَصْلَىٰ نَارًا ذَاتَ لَهَبٍ",transliteration:"Sa-yaṣlā nāran dhāta lahab",french:"Il sera brûlé dans un feu plein de flammes"},{number:4,arabic:"وَامْرَأَتُهُ حَمَّالَةَ الْحَطَبِ",transliteration:"Wa-mraʾatuhū ḥammālata l-ḥaṭab",french:"Et sa femme, la porteuse de bois"},{number:5,arabic:"فِي جِيدِهَا حَبْلٌ مِّن مَّسَدٍ",transliteration:"Fī jīdihā ḥablun min masad",french:"avec une corde de fibres autour du cou"}],

};

// ════════════════════════════════════════════════════════════════════
// API & HOOKS VERSETS
// ════════════════════════════════════════════════════════════════════
const _versesMemCache = new Map();
const _fetchWithTimeout = (url, ms = 10000) => {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(tid));
};

function parseTajweedHtml(tajweedStr) {
  if (!tajweedStr) return tajweedStr;
  return tajweedStr
    .replace(/<tajweed class="([^"]+)">([^<]*)<\/tajweed>/g, (_, cls, text) => `<span data-t="${cls}">${text}</span>`)
    .replace(/<[^>]+>/g, '');
}

async function fetchFromQuranCom(surahNumber) {
  const pages = surahNumber <= 9 ? 1 : 2;
  let allVerses = [];
  for (let page = 1; page <= pages; page++) {
    const url = `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}` +
      `?words=true&word_fields=text_uthmani,transliteration,text_uthmani_tajweed&translations=136&per_page=300&page=${page}`;
    const r = await _fetchWithTimeout(url, 12000);
    if (!r.ok) throw new Error("quran.com indisponible");
    const d = await r.json();
    if (!d.verses?.length) break;
    allVerses = [...allVerses, ...d.verses];
    if (!d.pagination?.next_page) break;
  }
  if (!allVerses.length) throw new Error("Aucun verset");
  return allVerses.map(v => {
    const words = v.words?.filter(w => w.char_type_name !== "end") || [];
    const arabic = words.map(w => w.text_uthmani || "").join(" ");
    const tajweed = words.map(w => parseTajweedHtml(w.text_uthmani_tajweed || w.text_uthmani || "")).join(" ");
    const translit = words.map(w => w.transliteration?.text || "").join(" ");
    return { number: v.verse_number, arabic, tajweed, transliteration: translit, french: v.translations?.[0]?.text?.replace(/<sup[^>]*>.*?<\/sup>/g, "") || "" };
  });
}

async function fetchSurahFromAPI(surahNumber) {
  try { const verses = await fetchFromQuranCom(surahNumber); if (verses.length > 0) return verses; } catch {}
  try {
    const [a, f] = await Promise.all([
      _fetchWithTimeout(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`),
      _fetchWithTimeout(`https://api.alquran.cloud/v1/surah/${surahNumber}/fr.hamidullah`)
    ]);
    if (a.ok && f.ok) {
      const [ad, fd] = await Promise.all([a.json(), f.json()]);
      if (ad.code === 200 && fd.code === 200) {
        return ad.data.ayahs.map((v, i) => ({ number: v.numberInSurah, arabic: v.text, tajweed: null, transliteration: "", french: fd.data.ayahs[i]?.text || "" }));
      }
    }
  } catch {}
  try {
    const base = `https://corsproxy.io/?https://api.alquran.cloud/v1/surah/${surahNumber}`;
    const [a, f] = await Promise.all([_fetchWithTimeout(`${base}/quran-uthmani`), _fetchWithTimeout(`${base}/fr.hamidullah`)]);
    if (a.ok && f.ok) {
      const [ad, fd] = await Promise.all([a.json(), f.json()]);
      if (ad.code === 200 && fd.code === 200) {
        return ad.data.ayahs.map((v, i) => ({ number: v.numberInSurah, arabic: v.text, tajweed: null, transliteration: "", french: fd.data.ayahs[i]?.text || "" }));
      }
    }
  } catch {}
  throw new Error("Toutes les sources ont échoué");
}

function cleanBasmala(verses, surahNumber) {
  if (!verses || verses.length === 0) return verses;
  if (surahNumber === 1) return verses;
  const first = verses[0];
  const isBasmala = first && (first.arabic?.includes('بِسْمِ اللَّهِ') || first.arabic?.includes('بِسْمِ ٱللَّهِ') || first.arabic?.includes('بسم الله') || (first.number === 1 && first.arabic?.startsWith('بِسْمِ')));
  if (!isBasmala) return verses;
  return verses.slice(1).map((v, i) => ({ ...v, number: i + 1 }));
}

function useVerses(surahNumber) {
  const embedded = surahNumber ? EMBEDDED_VERSES[surahNumber] : null;
  const [state, setState] = useState(() => {
    if (!surahNumber) return { verses: [], loading: false, error: null };
    if (embedded) return { verses: cleanBasmala(embedded, surahNumber), loading: false, error: null };
    if (_versesMemCache.has(surahNumber)) return { verses: cleanBasmala(_versesMemCache.get(surahNumber), surahNumber), loading: false, error: null };
    return { verses: [], loading: true, error: null };
  });
  useEffect(() => {
    if (!surahNumber) return;
    if (embedded) { setState({ verses: cleanBasmala(embedded, surahNumber), loading: false, error: null }); return; }
    if (_versesMemCache.has(surahNumber)) { setState({ verses: cleanBasmala(_versesMemCache.get(surahNumber), surahNumber), loading: false, error: null }); return; }
    setState({ verses: [], loading: true, error: null });
    const tryLoad = async (attempts = 0) => {
      try {
        const raw = await fetchSurahFromAPI(surahNumber);
        const verses = cleanBasmala(raw, surahNumber);
        _versesMemCache.set(surahNumber, verses);
        setState({ verses, loading: false, error: null });
      } catch {
        if (attempts < 2) { setTimeout(() => tryLoad(attempts + 1), 1500); }
        else { setState({ verses: [], loading: false, error: "api_error" }); }
      }
    };
    tryLoad();
  }, [surahNumber]);
  return state;
}

function getVerseText(surah, verse) {
  return EMBEDDED_VERSES[surah]?.[verse - 1]?.arabic || "﴿ " + verse + " ﴾";
}

// ════════════════════════════════════════════════════════════════════
// COMPOSANT — Stats Drawer
// ════════════════════════════════════════════════════════════════════
function StatsDrawer({ isOpen, onClose, counts, fridayKahf: fridayKahfProp, juzProgram: juzProp }) {
  const pct = Math.round((counts.surahChecked / 114) * 100);
  const [recited, setRecited] = useState(() => storage("adhkar_recited", {}) || {});
  const { totalFridays, isReadThisWeek } = fridayKahfProp || useFridayKahf();
  const juzProgram = juzProp || useJuzProgram();
  useEffect(() => { if (isOpen) setRecited(storage("adhkar_recited", {}) || {}); }, [isOpen]);
  const adhkarDone = ADHKAR_MALIKITES.filter(d => (recited[d.id] || 0) >= d.repetition).length;
  const adhkarTotal = ADHKAR_MALIKITES.length;
  const matinSoir = ADHKAR_MALIKITES.filter(d => ["matin","soir","matin_soir"].includes(d.category.toLowerCase()));
  const matinSoirDone = matinSoir.filter(d => (recited[d.id] || 0) >= d.repetition).length;
  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{display:"contents"}}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm" onClick={onClose}/>
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-slate-900 z-50 shadow-2xl border-l border-white/10 overflow-y-auto">
            <div className="p-5 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-md">
              <h2 className="font-bold text-white flex items-center gap-2"><Activity className="w-5 h-5 text-emerald-400"/> Statistiques</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-5 space-y-5">
              <div className="text-center">
                <div className="relative w-28 h-28 mx-auto">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8"/>
                    <circle cx="60" cy="60" r="52" fill="none" stroke="url(#sg)" strokeWidth="8" strokeLinecap="round"
                      strokeDasharray="327" strokeDashoffset={327*(1-counts.surahChecked/114)}
                      style={{ transition: "stroke-dashoffset 1s ease" }}/>
                    <defs><linearGradient id="sg"><stop offset="0%" stopColor="#10B981"/><stop offset="100%" stopColor="#3B82F6"/></linearGradient></defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-emerald-400">{pct}%</span>
                    <span className="text-xs text-slate-500">Coran</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-bold uppercase tracking-wider mb-2">📖 Coran</p>
                <div className="space-y-2">
                  {[
                    { label: "Sourates lues", value: `${counts.surahChecked}/114`, color: "text-blue-400" },
                    { label: "Programme Khatm", value: juzProgram.program.active ? `${juzProgram.completedCount}/30 Juz` : "Non démarré", color: "text-emerald-400" },
                    { label: "Jours de lecture", value: juzProgram.daysPassed > 0 ? `${juzProgram.daysPassed}j` : "—", color: "text-purple-400" },
                    { label: "Dans l'objectif", value: juzProgram.program.active ? (juzProgram.onTrack ? "✅ Oui" : `⚠️ −${juzProgram.behindBy} Juz`) : "—", color: juzProgram.onTrack ? "text-emerald-400" : "text-orange-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/8">
                      <span className="text-slate-400 text-sm">{label}</span>
                      <span className={`font-bold text-sm ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-bold uppercase tracking-wider mb-2">📿 Adhkār</p>
                <div className="space-y-2">
                  {[
                    { label: "Adhkār complétés", value: `${adhkarDone}/${adhkarTotal}`, color: "text-emerald-400" },
                    { label: "Matin & Soir du jour", value: `${matinSoirDone}/${matinSoir.length}`, color: matinSoirDone === matinSoir.length ? "text-emerald-400" : "text-amber-400" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/8">
                      <span className="text-slate-400 text-sm">{label}</span>
                      <span className={`font-bold text-sm ${color}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-600 font-bold uppercase tracking-wider mb-2">🕌 Al-Kahf — Vendredi</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/8">
                    <span className="text-slate-400 text-sm">Vendredis lus</span>
                    <span className="font-bold text-sm text-amber-400">{totalFridays} semaine{totalFridays > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/8">
                    <span className="text-slate-400 text-sm">Ce vendredi</span>
                    <span className={`font-bold text-sm ${isReadThisWeek ? "text-emerald-400" : "text-slate-600"}`}>{isReadThisWeek ? "✅ Lu" : "—"}</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-slate-700 text-xs italic">« وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا » — Muzzammil 4</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════════════
// ROOT APP — PAGES (avec Learn)
// ════════════════════════════════════════════════════════════════════
const PAGES = [
  { key: "quran",     label: "📖 Coran",       shortLabel: "Coran"     },
  { key: "program",   label: "📅 Programme",   shortLabel: "Khatm"     },
  { key: "bookmarks", label: "🔖 Marque-pages", shortLabel: "Repères"  },
  { key: "adhkar",    label: "📿 Adhkar",       shortLabel: "Adhkar"   },
  { key: "learn",     label: "🎓 Apprendre",    shortLabel: "Apprendre"},
];

const JUZ_EXACT = [
  { juz:1,  startSurah:1,  startVerse:1,   endSurah:2,  endVerse:141 },
  { juz:2,  startSurah:2,  startVerse:142, endSurah:2,  endVerse:252 },
  { juz:3,  startSurah:2,  startVerse:253, endSurah:3,  endVerse:92  },
  { juz:4,  startSurah:3,  startVerse:93,  endSurah:4,  endVerse:23  },
  { juz:5,  startSurah:4,  startVerse:24,  endSurah:4,  endVerse:147 },
  { juz:6,  startSurah:4,  startVerse:148, endSurah:5,  endVerse:81  },
  { juz:7,  startSurah:5,  startVerse:82,  endSurah:6,  endVerse:110 },
  { juz:8,  startSurah:6,  startVerse:111, endSurah:7,  endVerse:87  },
  { juz:9,  startSurah:7,  startVerse:88,  endSurah:8,  endVerse:40  },
  { juz:10, startSurah:8,  startVerse:41,  endSurah:9,  endVerse:92  },
  { juz:11, startSurah:9,  startVerse:93,  endSurah:11, endVerse:5   },
  { juz:12, startSurah:11, startVerse:6,   endSurah:12, endVerse:52  },
  { juz:13, startSurah:12, startVerse:53,  endSurah:14, endVerse:52  },
  { juz:14, startSurah:15, startVerse:1,   endSurah:16, endVerse:128 },
  { juz:15, startSurah:17, startVerse:1,   endSurah:18, endVerse:74  },
  { juz:16, startSurah:18, startVerse:75,  endSurah:20, endVerse:135 },
  { juz:17, startSurah:21, startVerse:1,   endSurah:22, endVerse:78  },
  { juz:18, startSurah:23, startVerse:1,   endSurah:25, endVerse:20  },
  { juz:19, startSurah:25, startVerse:21,  endSurah:27, endVerse:55  },
  { juz:20, startSurah:27, startVerse:56,  endSurah:29, endVerse:45  },
  { juz:21, startSurah:29, startVerse:46,  endSurah:33, endVerse:30  },
  { juz:22, startSurah:33, startVerse:31,  endSurah:36, endVerse:27  },
  { juz:23, startSurah:36, startVerse:28,  endSurah:39, endVerse:31  },
  { juz:24, startSurah:39, startVerse:32,  endSurah:41, endVerse:46  },
  { juz:25, startSurah:41, startVerse:47,  endSurah:45, endVerse:37  },
  { juz:26, startSurah:46, startVerse:1,   endSurah:51, endVerse:30  },
  { juz:27, startSurah:51, startVerse:31,  endSurah:57, endVerse:29  },
  { juz:28, startSurah:58, startVerse:1,   endSurah:66, endVerse:12  },
  { juz:29, startSurah:67, startVerse:1,   endSurah:77, endVerse:50  },
  { juz:30, startSurah:78, startVerse:1,   endSurah:114,endVerse:6   },
];

function getJuzStart(juzNum) { return JUZ_EXACT.find(j => j.juz === juzNum); }

export default function App() {
  const [page, setPage] = useState("quran");
  const [statsOpen, setStatsOpen] = useState(false);
  const [navTarget, setNavTarget] = useState(null);
  const [navConsumed, setNavConsumed] = useState(false);
  const juzProgram = useJuzProgram();
  const fridayKahf = useFridayKahf();
  const { checked, toggle, counts } = useSurahProgress();

  const handleNavigateToJuz = useCallback((juzNum) => {
    const juzInfo = getJuzStart(juzNum);
    if (!juzInfo) return;
    setNavTarget({ surahNum: juzInfo.startSurah, verseNum: juzInfo.startVerse, bounds: { startSurah: juzInfo.startSurah, startVerse: juzInfo.startVerse, endSurah: juzInfo.endSurah, endVerse: juzInfo.endVerse } });
    setNavConsumed(false);
    setPage("quran");
  }, []);

  const handleNavigateToRange = useCallback((startSurah, startVerse, endSurah, endVerse) => {
    setNavTarget({ surahNum: startSurah, verseNum: startVerse, bounds: { startSurah, startVerse, endSurah, endVerse } });
    setNavConsumed(false);
    setPage("quran");
  }, []);

  return (
    <div className="bg-slate-950 min-h-screen text-white font-sans antialiased flex flex-col" style={{ maxHeight: "100dvh", overflow: "hidden" }}>
      <header className="flex items-center justify-between px-5 py-3.5 bg-slate-950/90 backdrop-blur-xl border-b border-white/8 shrink-0">
        <div>
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="text-2xl">🕌</span> Al-Murshid
          </h1>
          <p className="text-[10px] text-slate-600 font-medium tracking-widest uppercase -mt-0.5">المرشد — Guide Coranique</p>
        </div>
        <button onClick={() => setStatsOpen(true)} className="p-2.5 hover:bg-white/10 rounded-2xl transition-all text-slate-500 hover:text-white border border-white/8 hover:border-white/20">
          <Activity className="w-5 h-5"/>
        </button>
      </header>
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {page === "quran" && (
            <motion.div key="quran" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="overflow-y-auto" style={{ maxHeight: "calc(100dvh - 120px)" }}>
              <QuranReader
                initialSurahNum={navTarget?.surahNum}
                initialVerseNum={navTarget?.verseNum}
                juzBounds={navTarget?.bounds}
                onNavConsumed={() => { setNavConsumed(true); setNavTarget(null); }}
                checked={checked}
                toggle={toggle}
                counts={counts}
              />
            </motion.div>
          )}
          {page === "program" && (
            <motion.div key="program" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="overflow-y-auto" style={{ maxHeight: "calc(100dvh - 120px)" }}>
              <JuzProgram onNavigateToJuz={handleNavigateToJuz} onNavigateToRange={handleNavigateToRange} juzProgram={juzProgram}/>
            </motion.div>
          )}
          {page === "bookmarks" && (
            <motion.div key="bookmarks" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="overflow-y-auto" style={{ maxHeight: "calc(100dvh - 120px)" }}>
              <BookmarksPage/>
            </motion.div>
          )}
          {page === "adhkar" && (
            <motion.div key="adhkar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="overflow-y-auto" style={{ maxHeight: "calc(100dvh - 120px)" }}>
              <AdhkarPage fridayKahf={fridayKahf}/>
            </motion.div>
          )}
          {page === "learn" && (
            <motion.div key="learn" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="overflow-y-auto" style={{ maxHeight: "calc(100dvh - 120px)" }}>
              <LearnScreen/>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <nav className="shrink-0 bg-slate-950/95 backdrop-blur-xl border-t border-white/8 px-2 py-2 safe-area-bottom">
        <div className="flex items-stretch gap-1 max-w-lg mx-auto">
          {PAGES.map(({ key, label, shortLabel }) => {
            const active = page === key;
            return (
              <motion.button key={key} whileTap={{ scale: 0.92 }} onClick={() => setPage(key)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 rounded-2xl py-2 px-1 transition-all min-w-0 ${active ? "bg-gradient-to-b from-emerald-600/25 to-teal-600/15 border border-emerald-500/30 shadow-lg shadow-emerald-500/10" : "hover:bg-white/5 border border-transparent"}`}>
                <span className="text-lg leading-none">
                  {key === "quran"     && "📖"}
                  {key === "program"   && "📅"}
                  {key === "bookmarks" && "🔖"}
                  {key === "adhkar"    && "📿"}
                  {key === "learn"     && "🎓"}
                </span>
                <span className={`text-[9px] font-bold leading-none truncate max-w-full ${active ? "text-emerald-300" : "text-slate-600"}`}>{shortLabel}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>
      <StatsDrawer isOpen={statsOpen} onClose={() => setStatsOpen(false)} counts={counts} fridayKahf={fridayKahf} juzProgram={juzProgram}/>
    </div>
  );
}
