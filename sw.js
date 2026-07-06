const CACHE_NAME = 'asv-fangbuch-v1';

// Hier stehen alle deine vorhandenen Dateien, die das Handy offline sichern MUSS
const ASSETS = [
  'index.html',
  'Index.js',
  'manifest.json',
  'fang-eintragen.html',
  'fang-eintragen.js',
  'auswertung.html',
  'galerie.html',
  'galerie.js'
];

// 1. Dateien beim ersten Online-Besuch auf dem Handy einfrieren
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Wenn offline, liefere die eingefrorenen Dateien aus
self.addEventListener('fetch', event => {
  // Supabase-Datenbank-Anfragen und Wetter-Abfragen ignorieren (das regeln wir direkt im Code)
  if (event.request.url.includes('supabase.co') || event.request.url.includes('open-meteo.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});