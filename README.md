# Al-Murshid — compagnon coranique (orientation malikite)

Application web mobile (PWA) en React + Vite + Tailwind, déployée sur Vercel.

## Fonctionnalités

- **Accueil** : objectif du jour (réglable), série de jours, niveau et XP, session éclair de 5 min, lecture du jour du programme Khatm
- **Coran** : 114 sourates, tajwid en couleur, récitateurs (via le proxy `api/audio.js`), hors-ligne pour une partie des sourates
- **Khatm** : programme de lecture (30 jours à 1 an) découpé verset par verset
- **Adhkar** : matin, soir, prière, sommeil, repas, sorties, détresse ; compteur tasbih plein écran avec vibration ; remise à zéro chaque jour à minuit
- **Apprendre** : 500 mots les plus fréquents du Coran en révision espacée, quiz, leçons, alphabet, voyelles, tajwid, professeur avec reconnaissance vocale
- **Réglages** : taille du texte arabe, objectif quotidien

Toute la progression est enregistrée sur le téléphone (localStorage), en heure locale.

## Développement

```bash
npm install
npm run dev      # serveur local
npm run test     # tests (coach vocal, dates, série, niveaux)
npm run build    # version de production
```

## Organisation du code

| Fichier | Rôle |
|---|---|
| `src/App.jsx` | Coquille de l'app, navigation, Coran, Khatm, repères, adhkar, statistiques |
| `src/HomeScreen.jsx` | Écran d'accueil |
| `src/LearnScreen.jsx` | Onglets d'apprentissage |
| `src/lib/progress.js` | Objectif du jour, série, XP, réglages (heure locale) |
| `src/lib/arabic.js` | Normalisation de l'arabe et correction de la récitation |
| `src/components/TasbihCounter.jsx` | Compteur tasbih plein écran |
| `src/components/SettingsSheet.jsx` | Réglages |
| `src/data/adhkarExtra.js` | Adhkar sommeil, repas, sorties, détresse (avec sources) |
| `src/appData.js`, `src/vocabData.js` | Adhkar malikites, versets, 500 mots |

Charte : rouge `#E30613`, orange `#F58220`, jaune `#FFD100`, vert `#00A19A`, bleu `#0F4C9B`. Polices : Bricolage Grotesque (titres), Inter (texte), Amiri Quran (arabe).
