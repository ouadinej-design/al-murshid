import { motion } from "framer-motion";
import { Check, Settings2, ChevronRight } from "lucide-react";

/**
 * Carte « Mon programme du jour » (accueil).
 * rows : [{ item, done, sub }] ; toucher la ligne = lancer l'action, toucher la case = cocher/décocher.
 */
export default function DailyProgram({ rows, onRun, onToggle, onEdit }) {
  const done = rows.filter((r) => r.done).length;
  const all = rows.length > 0 && done === rows.length;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm" aria-label="Mon programme du jour">
      <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Mon programme du jour</p>
          <p className="font-display text-lg font-extrabold text-encre">
            {all ? "🎉 Tout est fait !" : `${done} / ${rows.length} fait${done > 1 ? "s" : ""}`}
          </p>
        </div>
        <button onClick={onEdit} className="flex items-center gap-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-500">
          <Settings2 className="h-3.5 w-3.5" /> Modifier
        </button>
      </div>
      <div className="mx-4 mb-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div className="h-full rounded-full bg-vert" animate={{ width: `${rows.length ? (done / rows.length) * 100 : 0}%` }} />
      </div>

      {rows.length === 0 ? (
        <button onClick={onEdit} className="w-full px-4 pb-4 pt-1 text-left text-sm text-slate-500">
          Aucune action prévue aujourd'hui. <span className="font-bold text-bleu">Composer mon programme →</span>
        </button>
      ) : (
        <ul className="pb-1.5">
          {rows.map(({ item, done: ok, sub }) => (
            <li key={item.id} className="flex items-center gap-2 border-t border-slate-100 px-2">
              <button onClick={() => onRun(item)} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2.5 text-left active:bg-slate-50">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${ok ? "bg-vert/10" : "bg-slate-100"}`} aria-hidden="true">{item.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-bold ${ok ? "text-slate-400 line-through" : "text-encre"}`}>{item.label}</span>
                  {sub && <span className="block truncate text-[11px] text-slate-500">{sub}</span>}
                </span>
                {!ok && item.type !== "custom" && <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden="true" />}
              </button>
              <motion.button whileTap={{ scale: 0.85 }} onClick={() => onToggle(item, !ok)} role="checkbox" aria-checked={ok}
                aria-label={ok ? `Décocher : ${item.label}` : `Cocher : ${item.label}`}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 transition-colors ${ok ? "border-vert bg-vert text-white" : "border-slate-300 bg-white text-transparent"}`}>
                <Check className="h-5 w-5" strokeWidth={3} />
              </motion.button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
