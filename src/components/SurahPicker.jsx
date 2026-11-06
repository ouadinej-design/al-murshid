import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";

/**
 * Choix de la sourate parmi les 114 (liste avec recherche, en plein écran).
 * quick : sourates proposées en raccourci ; index : les 114 { number, name, arabic, verses }.
 */
export default function SurahPicker({ index, quick, selected, onSelect, loading, error }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[ʿʾ'’`-]/g, "");
  const list = useMemo(() => index.filter((s) => !q || String(s.number) === q.trim() || norm(s.name).includes(norm(q)) || s.arabic.includes(q.trim())), [index, q]);

  const pick = (n) => { setOpen(false); setQ(""); onSelect(n); };

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Sourate d'entraînement</p>
      <div className="flex flex-wrap gap-2">
        {quick.map((s) => (
          <button key={s.number} onClick={() => pick(s.number)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${selected === s.number ? "bg-vert text-white" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
            {s.name}
          </button>
        ))}
        <button onClick={() => setOpen(true)} className="rounded-xl border border-bleu/30 bg-bleu/5 px-3 py-1.5 text-xs font-bold text-bleu">
          📚 Les 114 sourates
        </button>
      </div>
      {!quick.some((s) => s.number === selected) && (
        <p className="mt-2 text-xs font-semibold text-vert">
          Sourate choisie : {index[selected - 1]?.number}. {index[selected - 1]?.name}
        </p>
      )}
      {loading && <p className="mt-2 text-xs text-slate-500">⏳ Chargement des versets…</p>}
      {error && <p className="mt-2 text-xs text-rouge">{error}</p>}

      {open && createPortal(
        <div className="fixed inset-0 z-[130] flex flex-col bg-white text-encre" role="dialog" aria-modal="true" aria-label="Choisir une sourate">
          <div className="flex items-center gap-2 border-b border-slate-200 p-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom ou numéro de sourate…"
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-bleu" />
            </div>
            <button onClick={() => setOpen(false)} aria-label="Fermer" className="rounded-full bg-slate-100 p-2.5"><X className="h-5 w-5" /></button>
          </div>
          <ul className="flex-1 overflow-y-auto p-3">
            {list.map((s) => (
              <li key={s.number}>
                <button onClick={() => pick(s.number)}
                  className={`mb-1.5 flex w-full items-center gap-3 rounded-xl border p-3 text-left ${selected === s.number ? "border-vert bg-vert/5" : "border-slate-200 bg-white"}`}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">{s.number}</span>
                  <span className="flex-1">
                    <span className="block text-sm font-bold">{s.name}</span>
                    <span className="block text-[11px] text-slate-500">{s.verses} versets</span>
                  </span>
                  <span dir="rtl" lang="ar" className="text-xl" style={{ fontFamily: "'Amiri Quran','Scheherazade New',serif" }}>{s.arabic}</span>
                </button>
              </li>
            ))}
            {list.length === 0 && <p className="py-10 text-center text-sm text-slate-400">Aucune sourate trouvée.</p>}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}
