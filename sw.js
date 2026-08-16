const CACHE_NAME = 'asv-fangbuch-V74';

// Alle statischen Dateien der PWA mit relativer Pfadangabe
const ASSETS = [
  './',
  './index.html',
  './index.js',
  './icon.png',
  './manifest.json',
  './fang-eintragen.html',
  './fang-eintragen.js',
  './auswertung.html',
  './auswertung.js',
  './partner.html',
  './galerie.html',
  './galerie.js',
  './gesamtuebersicht.html'
];

// 1. Installation: Dateien vorab in den Cache laden & sofort aktivieren
self.addEventListener('install', event => {
  self.skipWaiting(); // Macht den neuen Service Worker sofort aktiv
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Aktivierung: Alte Cache-Versionen automatisch vom Handy löschen
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Lösche alten Cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Übernimmt sofort alle geöffneten Tabs/Fenster
  );
});

// 3. Abruf-Strategie: Network-First mit Funkloch-Fallback
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Supabase (Datenbank) und Wetter-API niemals aus dem PWA-Struktur-Cache bedienen
  if (url.includes('supabase.co') || url.includes('open-meteo.com')) {
    return;
  }

  // Nur GET-Anfragen cachen (POST/PUT für Supabase-Inserts ignorieren)
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Bei erfolgreichem Server-Abruf: Antwort klonen und lokalen Cache aktualisieren
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // FUNKLOCH / OFFLINE: Falls keine Netzverbindung da ist, aus dem Cache laden
        return caches.match(event.request);
      })
  );
});