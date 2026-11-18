import { COLOR_MODES, legendOf, useColorMode } from "../lib/letterColors";

/** Choix du mode de couleur des lettres + légende (partagé dans toute l'app). */
export default function ColorModePicker({ compact = false }) {
  const [mode, setMode] = useColorMode();
  const legend = legendOf(mode);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Couleurs des lettres</p>
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {COLOR_MODES.map((m) => (
          <button key={m.key} onClick={() => setMode(m.key)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold ${mode === m.key ? "bg-bleu text-white" : "bg-slate-100 text-slate-600"}`}>
            {m.label}
          </button>
        ))}
      </div>
      {!compact && legend.length > 0 && (
        <div className="mt-2 space-y-1">
          {legend.map((l) => (
            <p key={l.text} className="flex items-start gap-2 text-[11px] leading-snug text-slate-600">
              <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full" style={{ background: l.color }} />
              <span>{l.ar && <><bdi dir="rtl" className="text-base font-bold" style={{ color: l.color, fontFamily: "'Amiri Quran',serif" }}>{l.ar}</bdi> : </>}{l.text}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
