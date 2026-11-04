export default {
  content: ["./index.html","./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        rouge:  '#E30613',
        orange: '#F58220',
        jaune:  '#FFD100',
        vert:   '#00A19A',
        bleu:   '#0F4C9B',
        creme:  '#FFFBF5',
        encre:  '#1A1A1A',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
