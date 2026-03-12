// Al-Murshid SW — OneSignal gère les push, ce fichier est minimal
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
