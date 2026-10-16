// Offline support for Yas's Games.
// Pages and scripts: network first (so new releases show up right away), cache as a fallback.
// Voice clips: cache first (their URLs change whenever a clip changes).
// Images: served from cache, refreshed in the background.
importScripts('/shared/games.js');

const CACHE = 'yas-games-v4';
const CORE = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/shared/games.js',
  '/shared/lines.js',
  '/shared/voice.js',
  '/shared/kit.js',
  '/shared/kit.css',
  '/shared/robot.js',
  '/voice/manifest.json',
  ...self.GAMES.map(g => '/' + g.path),
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // add one by one so a single missing file doesn't stop the install
    await Promise.all(CORE.map(url => cache.add(url).catch(() => {})));
    try {
      const manifest = await (await fetch('/voice/manifest.json', { cache: 'no-cache' })).json();
      const clips = [];
      for (const lang of ['en', 'nl']) {
        for (const [key, hash] of Object.entries(manifest[lang] || {})) clips.push(`/voice/${lang}/${encodeURIComponent(key)}.mp3?v=${hash}`);
      }
      await Promise.all(clips.map(url => cache.add(url).catch(() => {})));
    } catch (e) { /* no clips yet: games fall back to the built-in voice */ }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  if (url.pathname.endsWith('.mp3')) event.respondWith(cacheFirst(req));
  else if (url.pathname.endsWith('.png')) event.respondWith(staleWhileRevalidate(event, req));
  else event.respondWith(networkFirst(req));
});

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(event, req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const update = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; });
  if (hit) { event.waitUntil(update.catch(() => {})); return hit; }
  return update;
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    // don't leave her staring at a blank screen on a slow network
    const res = await Promise.race([
      fetch(req),
      new Promise((_, fail) => setTimeout(() => fail(new Error('timeout')), 4000)),
    ]);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') { const home = await cache.match('/'); if (home) return home; }
    throw e;
  }
}
