// Offline support for Yas's Games.
// Pages and scripts: network first (so new releases show up right away), cache as a fallback.
// Voice clips: cache first (their URLs change whenever a clip changes). Only the clips for the
// language she's using are downloaded ahead of time; the pages tell us which one that is
// (see /shared/voice.js), and switching languages fetches the other set.
// Images: served from cache, refreshed in the background.
importScripts('/shared/games.js');

const CACHE = 'yas-games-v9';
// survives version bumps: remembers the chosen language so a new version can precache its clips
const SETTINGS = 'yas-games-settings';
const LANGS = ['en', 'nl', 'fa'];
const CORE = [
  '/',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/shared/games.js',
  '/shared/lines.js',
  '/shared/voice.js',
  '/shared/saved.js',
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
    // the language she used last time; on a first visit the page tells us once we're running
    const lang = await savedLang();
    if (lang) await cacheClips(lang);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE && key !== SETTINGS) await caches.delete(key);
    await self.clients.claim();
  })());
});

// pages post { lang } on load and whenever the language switch is tapped
self.addEventListener('message', event => {
  const lang = event.data && event.data.lang;
  if (!LANGS.includes(lang)) return;
  event.waitUntil((async () => {
    const settings = await caches.open(SETTINGS);
    await settings.put('/__lang', new Response(lang));
    await cacheClips(lang);
  })());
});

async function savedLang() {
  try {
    const res = await (await caches.open(SETTINGS)).match('/__lang');
    const lang = res && await res.text();
    return LANGS.includes(lang) ? lang : null;
  } catch (e) { return null; }
}

// download every clip of one language that isn't cached yet (also picks up newly recorded ones)
const filling = {};
function cacheClips(lang) {
  if (!filling[lang]) {
    filling[lang] = (async () => {
      try {
        const manifest = await (await fetch('/voice/manifest.json', { cache: 'no-cache' })).json();
        const cache = await caches.open(CACHE);
        const urls = Object.entries(manifest[lang] || {}).map(([key, hash]) => `/voice/${lang}/${encodeURIComponent(key)}.mp3?v=${hash}`);
        // a few at a time so her first taps aren't stuck behind hundreds of downloads
        const todo = [];
        for (const url of urls) if (!(await cache.match(url))) todo.push(url);
        await Promise.all(Array.from({ length: 6 }, async () => {
          while (todo.length) await cache.add(todo.shift()).catch(() => {});
        }));
      } catch (e) { /* offline or no clips yet: games fall back to the built-in voice */ }
      finally { delete filling[lang]; }
    })();
  }
  return filling[lang];
}

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
