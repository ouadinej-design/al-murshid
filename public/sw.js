// ═══════════════════════════════════════════════════════════════
// Al-Murshid — Service Worker (notifications uniquement)
// ⚠️ Ce SW n'intercepte AUCUNE requête réseau — uniquement notifs
// ═══════════════════════════════════════════════════════════════

// ── Pas de cache, pas d'interception réseau ──────────────────────
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

// Timers actifs
const activeTimers = new Map();

// ── Messages depuis l'app ────────────────────────────────────────
self.addEventListener("message", event => {
  const { type, payload } = event.data || {};
  if (type === "SCHEDULE_JUZ_REMINDER")    scheduleJuzReminder(payload);
  if (type === "SCHEDULE_PRAYER_REMINDERS") schedulePrayerReminders(payload);
  if (type === "SCHEDULE_FRIDAY_KAHF")      scheduleFridayKahf();
  if (type === "CANCEL_ALL")                cancelAll();
  if (type === "SHOW_NOW")                  showNotif(payload.title, payload.body, payload.tag);
});

// ── Notification helper ──────────────────────────────────────────
function showNotif(title, body, tag = "almurshid") {
  return self.registration.showNotification(title, {
    body, icon: "/icon-192.png", badge: "/icon-72.png",
    tag, renotify: true, vibrate: [200, 100, 200], data: { url: "/" }
  });
}

function msUntil(h, m) {
  const now = new Date(), t = new Date();
  t.setHours(h, m, 0, 0);
  if (t <= now) t.setDate(t.getDate() + 1);
  return t.getTime() - now.getTime();
}

// ── Rappel Juz quotidien ─────────────────────────────────────────
function scheduleJuzReminder({ timeStr, completedCount, startDate, endDate, active }) {
  if (!active) return;
  if (activeTimers.has("juz_daily")) { clearTimeout(activeTimers.get("juz_daily")); }
  const [h, m] = timeStr.split(":").map(Number);
  const tid = setTimeout(() => {
    const startMs = startDate ? new Date(startDate).getTime() : Date.now();
    const endMs   = endDate   ? new Date(endDate).getTime()   : Date.now() + 30*86400000;
    const daysPassed = Math.max(1, Math.floor((Date.now()-startMs)/86400000)+1);
    const daysTotal  = Math.max(1, Math.ceil((endMs-startMs)/86400000));
    const todayJuz   = Math.min(30, Math.ceil((daysPassed/daysTotal)*30));
    const body = completedCount >= todayJuz
      ? `MāshāAllāh ! Tu es en avance — ${completedCount}/30 Juz lus 🌟`
      : `📖 N'oublie pas ta lecture du jour — Juz ${todayJuz} (${completedCount}/30 lus)`;
    showNotif("Al-Murshid — Lecture du Juz", body, "juz_daily");
    scheduleJuzReminder({ timeStr, completedCount, startDate, endDate, active });
  }, msUntil(h, m));
  activeTimers.set("juz_daily", tid);
}

// ── Rappels prières ──────────────────────────────────────────────
function schedulePrayerReminders({ slots, completedCount, dailyGoalJuz }) {
  ["fajr","dhuhr","asr","maghrib"].forEach(k => {
    if (activeTimers.has(k)) { clearTimeout(activeTimers.get(k)); activeTimers.delete(k); }
  });
  const TIMES = {
    fajr:    { h:6,  m:0,  label:"Fajr — commence ta lecture du jour !" },
    dhuhr:   { h:13, m:0,  label:"Dhuhr — as-tu lu ton Juz du jour ?" },
    asr:     { h:16, m:30, label:"Asr — il reste du temps pour atteindre l'objectif !" },
    maghrib: { h:19, m:30, label:"Maghrib — dernier rappel de lecture du jour." },
  };
  slots.forEach(key => {
    const t = TIMES[key]; if (!t) return;
    const tid = setTimeout(() => {
      const remaining = Math.max(0, dailyGoalJuz - (completedCount % dailyGoalJuz));
      const body = remaining > 0
        ? `${t.label} Il te reste ${remaining} Juz à lire aujourd'hui.`
        : `MāshāAllāh ! Objectif atteint — ${completedCount}/30 Juz. Bārakallāhu fīk !`;
      showNotif("Al-Murshid", body, key);
    }, msUntil(t.h, t.m));
    activeTimers.set(key, tid);
  });
}

// ── Al-Kahf vendredi ─────────────────────────────────────────────
function scheduleFridayKahf() {
  if (activeTimers.has("friday_kahf")) clearTimeout(activeTimers.get("friday_kahf"));
  const now = new Date(), target = new Date();
  const days = (5 - now.getDay() + 7) % 7 || 7;
  target.setDate(now.getDate() + days);
  target.setHours(8, 30, 0, 0);
  const tid = setTimeout(() => {
    showNotif("📖 Vendredi — Sourate Al-Kahf",
      "Lis Al-Kahf aujourd'hui ! « Celui qui la lit le vendredi sera illuminé jusqu'au vendredi suivant. »",
      "friday_kahf");
    scheduleFridayKahf();
  }, target.getTime() - now.getTime());
  activeTimers.set("friday_kahf", tid);
}

function cancelAll() { activeTimers.forEach(t => clearTimeout(t)); activeTimers.clear(); }

// ── Clic → ouvre l'app ───────────────────────────────────────────
self.addEventListener("notificationclick", event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type:"window", includeUncontrolled:true }).then(clients => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow("/");
    })
  );
});
