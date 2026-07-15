const CACHE_NAME = 'asv-fangbuch-V47';

// Hier stehen jetzt ALLE Dateien drin, die zu deiner App gehören!
const ASSETS = [
  'index.html',
  'index.js',
  'icon.png',
  'manifest.json',
  'fang-eintragen.html',
  'fang-eintragen.js',
  'auswertung.html',
  'auswertung.js',
  'partner.html',
  'galerie.html',
  'galerie.js'
];

// 1. Dateien beim ersten Online-Besuch auf dem Handy einfrieren
self.addEventListener('install', event => {
  self.skipWaiting(); // Zwingt den neuen Service Worker, sofort aktiv zu werden
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Altes Cache-Aufräumen bei Aktivierung
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
    }).then(() => self.clients.claim()) // Übernimmt sofort die Kontrolle über alle offenen Tabss
  );
});

// 3. Wenn offline, liefere die eingefrorenen Dateien aus
self.addEventListener('fetch', event => {
  // Supabase-Datenbank-Anfragen und Wetter-Abfragen ignorieren
  if (event.request.url.includes('supabase.co') || event.request.url.includes('open-meteo.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});