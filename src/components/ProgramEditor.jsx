import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { DAY_LETTERS, newId, saveProgram } from "../lib/program";

/**
 * Éditeur du programme du jour : ajouter / retirer / ordonner les raccourcis,
 * et choisir les jours de la semaine pour chacun.
 * catalog : [{ group, type, ref?, label, icon }]
 */
export default function ProgramEditor({ open, items, catalog, onClose, onSave }) {
  const [list, setList] = useState(items);
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState("");
  const [customIcon, setCustomIcon] = useState("⭐");

  if (!open) return null;
  const save = () => { saveProgram(list); onSave(list); onClose(); };
  const move = (i, d) => setList((l) => { const n = [...l]; const j = i + d; if (j < 0 || j >= n.length) return l; [n[i], n[j]] = [n[j], n[i]]; return n; });
  const toggleDay = (i, day) => setList((l) => l.map((it, k) => {
    if (k !== i) return it;
    const cur = it.days?.length ? it.days : [0, 1, 2, 3, 4, 5, 6];
    const next = cur.includes(day) ? cur.filter((x) => x !== day) : [...cur, day].sort();
    return { ...it, days: next.length === 7 ? [] : next };
  }));
  const add = (c) => { setList((l) => [...l, { id: newId(), type: c.type, ref: c.ref, label: c.label, icon: c.icon }]); setAdding(false); };
  const groups = [...new Set(catalog.map((c) => c.group))];
  const has = (c) => list.some((it) => it.type === c.type && (it.ref ?? null) === (c.ref ?? null) && c.type !== "custom");

  return createPortal(
    <div className="fixed inset-0 z-[125] flex flex-col bg-creme text-encre" role="dialog" aria-modal="true" aria-label="Modifier mon programme">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <button onClick={onClose} aria-label="Fermer" className="rounded-full bg-slate-100 p-2"><X className="h-5 w-5" /></button>
        <h2 className="font-display text-lg font-extrabold">Mon programme du jour</h2>
        <button onClick={save} className="rounded-xl bg-vert px-3 py-2 text-sm font-bold text-white">Enregistrer</button>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        <p className="text-xs text-slate-500">Ces raccourcis s'affichent chaque jour sur l'accueil. Touche les jours pour limiter une action (ex. Al-Kahf : V).</p>
        {list.map((it, i) => (
          <div key={it.id} className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">{it.icon}</span>
              <input value={it.label} onChange={(e) => setList((l) => l.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))}
                className="min-w-0 flex-1 rounded-lg border border-transparent px-1 py-1 text-sm font-bold focus:border-slate-200 outline-none" aria-label="Nom du raccourci" />
              <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Monter" className="rounded-lg p-1.5 text-slate-400 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
              <button onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label="Descendre" className="rounded-lg p-1.5 text-slate-400 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
              <button onClick={() => setList((l) => l.filter((_, k) => k !== i))} aria-label="Retirer" className="rounded-lg p-1.5 text-rouge"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-2 flex gap-1">
              {DAY_LETTERS.map((d, day) => {
                const on = !it.days?.length || it.days.includes(day);
                return (
                  <button key={day} onClick={() => toggleDay(i, day)} aria-pressed={on}
                    className={`h-7 flex-1 rounded-lg text-[11px] font-bold ${on ? "bg-vert/15 text-vert" : "bg-slate-100 text-slate-300"}`}>{d}</button>
                );
              })}
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Ton programme est vide.</p>}

        <button onClick={() => setAdding(true)} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-vert/40 py-3.5 text-sm font-bold text-vert">
          <Plus className="h-4 w-4" /> Ajouter une action
        </button>
      </div>

      <AnimatePresence>
        {adding && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold">Ajouter</h3>
              <button onClick={() => setAdding(false)} aria-label="Fermer" className="rounded-full bg-slate-100 p-2"><X className="h-4 w-4" /></button>
            </div>
            {groups.map((g) => (
              <div key={g} className="mb-3">
                <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{g}</p>
                <div className="flex flex-wrap gap-1.5">
                  {catalog.filter((c) => c.group === g).map((c) => (
                    <button key={c.type + (c.ref ?? "")} onClick={() => add(c)} disabled={has(c)}
                      className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-left text-xs font-semibold disabled:opacity-35">
                      {c.icon} {c.label}{has(c) ? " ✓" : ""}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Action personnelle</p>
            <div className="flex gap-1.5">
              <select value={customIcon} onChange={(e) => setCustomIcon(e.target.value)} aria-label="Icône" className="rounded-xl border border-slate-200 px-2 text-lg">
                {["⭐", "🤲", "📿", "📖", "🕌", "💧", "🌙", "💚", "✍️", "🎧"].map((x) => <option key={x}>{x}</option>)}
              </select>
              <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="ex. Ṣalāt ʿala n-Nabī ×100, Duʿā'…"
                className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-vert" />
              <button disabled={!custom.trim()} onClick={() => { add({ type: "custom", label: custom.trim(), icon: customIcon }); setCustom(""); }}
                className="rounded-xl bg-vert px-3 text-sm font-bold text-white disabled:opacity-40">OK</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}
