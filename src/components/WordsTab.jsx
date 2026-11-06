import { useMemo, useState } from "react";
import { Search, Volume2 } from "lucide-react";
import VOCAB from "../vocabData";

const FILTERS = [
  { key: "all",   label: "Tous" },
  { key: "new",   label: "Nouveaux" },
  { key: "due",   label: "À revoir" },
  { key: "known", label: "Appris" },
];

const CATS = { essentiel: "Essentiel", verbe: "Verbe", nom: "Nom", particule: "Particule", pronom: "Pronom", adjectif: "Adjectif" };

function speak(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA"; u.rate = 0.7;
    const v = window.speechSynthesis.getVoices().find((x) => x.lang?.startsWith("ar"));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch { /* synthèse vocale indisponible */ }
}

/** La liste complète des 500 mots, avec recherche et statut de révision. */
export default function WordsTab({ anki, onStartReview }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [limit, setLimit] = useState(60);
  const now = Date.now();

  const statusOf = (w) => {
    const c = anki[w.id];
    if (!c || !(c.reps > 0)) return "new";
    return c.nextReview <= now ? "due" : "known";
  };

  // classement par fréquence dans le Coran
  const ranked = useMemo(() => [...VOCAB].sort((a, b) => (b.freq || 0) - (a.freq || 0)).map((w, i) => ({ ...w, rank: i + 1 })), []);
  const counts = useMemo(() => {
    const c = { all: ranked.length, new: 0, due: 0, known: 0 };
    ranked.forEach((w) => c[statusOf(w)]++);
    return c;
  }, [ranked, anki]); // eslint-disable-line react-hooks/exhaustive-deps

  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ًͯ-ٰٟ]/g, "");
  const list = ranked.filter((w) => (filter === "all" || statusOf(w) === filter)
    && (!q || norm(w.fr).includes(norm(q)) || norm(w.tr).includes(norm(q)) || norm(w.ar).includes(norm(q))));

  const known = counts.known + counts.due;
  const coverage = ranked.filter((w) => statusOf(w) !== "new").reduce((a, w) => a + (w.freq || 0), 0);
  const totalFreq = ranked.reduce((a, w) => a + (w.freq || 0), 0);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl p-4 text-white shadow-md" style={{ background: "linear-gradient(135deg,#0F4C9B,#1E64C9)" }}>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-white/80">Les 500 mots du Coran</p>
        <p className="mt-1 font-display text-2xl font-extrabold">{known} / 500 <span className="text-sm font-semibold text-white/80">mots vus</span></p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-jaune" style={{ width: `${(known / 500) * 100}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-white/90">
          Ces mots représentent {Math.round((coverage / Math.max(1, totalFreq)) * 100)} % des occurrences de cette liste dans le Coran.
        </p>
        <button onClick={onStartReview} className="mt-3 w-full rounded-xl bg-white py-2.5 text-sm font-bold text-bleu">
          🃏 Réviser maintenant {counts.due > 0 ? `(${counts.due} à revoir)` : ""}
        </button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(60); }} placeholder="Chercher un mot (français, arabe, translittération)…"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-bleu" />
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => { setFilter(f.key); setLimit(60); }}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold border ${filter === f.key ? "bg-bleu text-white border-bleu" : "bg-white text-slate-500 border-slate-200"}`}>
            {f.label} <span className="opacity-70">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {list.slice(0, limit).map((w) => {
          const st = statusOf(w);
          return (
            <li key={w.id} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3">
              <span className="w-9 shrink-0 text-center text-[10px] font-bold text-slate-400">#{w.rank}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-encre">{w.fr}</p>
                <p className="truncate text-[11px] text-slate-500">
                  {w.tr} · {(w.freq || 0).toLocaleString("fr-FR")}× {CATS[w.cat] ? `· ${CATS[w.cat]}` : ""}
                </p>
              </div>
              <p dir="rtl" lang="ar" className="shrink-0 text-2xl text-encre" style={{ fontFamily: "'Amiri Quran','Scheherazade New',serif" }}>{w.ar}</p>
              <button onClick={() => speak(w.ar)} aria-label={`Écouter ${w.tr}`} className="shrink-0 rounded-full bg-bleu/10 p-2 text-bleu">
                <Volume2 className="h-4 w-4" />
              </button>
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${st === "known" ? "bg-vert" : st === "due" ? "bg-orange" : "bg-slate-200"}`}
                title={st === "known" ? "Appris" : st === "due" ? "À revoir" : "Nouveau"} />
            </li>
          );
        })}
      </ul>
      {list.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Aucun mot trouvé.</p>}
      {list.length > limit && (
        <button onClick={() => setLimit((l) => l + 100)} className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-bleu">
          Afficher plus ({list.length - limit} restants)
        </button>
      )}
      <p className="text-center text-[10px] text-slate-400">● vert = appris · ● orange = à revoir · ● gris = nouveau</p>
    </div>
  );
}
