import colors from "tailwindcss/colors";

/** Charte Al-Murshid : rouge → orange → jaune → vert → bleu */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        rouge:  "#E30613",
        orange: { ...colors.orange, DEFAULT: "#F58220" }, // garde orange-50…950
        jaune:  "#FFD100",
        vert:   "#00A19A",
        bleu:   "#0F4C9B",
        creme:  "#FFFBF5",
        encre:  "#1A1A1A",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        arabic:  ['"Amiri Quran"', '"Scheherazade New"', "serif"],
        serif:   ['"Amiri Quran"', '"Scheherazade New"', "serif"], // tout le texte arabe en police coranique
      },
    },
  },
  plugins: [],
};
