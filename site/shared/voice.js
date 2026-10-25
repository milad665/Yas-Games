// Shared voice for every game.
// Plays pre-recorded clips from /voice/<lang>/<key>.mp3 (made with tools/record-voice.mjs).
// If a clip is missing, falls back to the nicest built-in voice the device has for that language.
//
//   Voice.say('md.howMove')                  speak one line
//   Voice.say(['rb.win1', 'rb.win2'])        pick one at random
//   Voice.say('md.meadow', 'md.tapPencil')   speak several in a row
//   Voice.stop()
//   Voice.lang / Voice.setLang('nl')         language is shared by all games
//   Voice.langs                              the edition's languages (EDITION.langs in shared/edition.js)
(() => {
  const LANG_KEY = 'yasGames.lang';
  const ALL = { en: 'en-US', nl: 'nl-NL', de: 'de-DE', es: 'es-ES', fa: 'fa-IR' };
  const EDITION = self.EDITION || {};
  // each edition switches on only the languages it has recorded (Spanish isn't recorded yet)
  const LANGS = Object.fromEntries((EDITION.langs || ['en', 'nl', 'fa']).filter(l => ALL[l]).map(l => [l, ALL[l]]));
  const LINES = self.VOICE_LINES || {};

  let lang = 'en';
  try { lang = localStorage.getItem(LANG_KEY) || ''; } catch (e) {}
  if (!LANGS[lang]) {
    const device = (navigator.language || '').toLowerCase().slice(0, 2);
    lang = LANGS[EDITION.lang] ? EDITION.lang : LANGS[device] ? device : Object.keys(LANGS)[0];
  }

  // ---------- recorded clips ----------
  let manifest = null; // { en: { key: hash }, nl: { ... }, ... }
  const ready = fetch('/voice/manifest.json', { cache: 'no-cache' })
    .then(r => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then(m => { manifest = m; });

  let ctx = null;
  function audio() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  // iPad only allows sound after a touch, so wake the audio up on the first one
  document.addEventListener('pointerdown', audio, { capture: true });

  const buffers = new Map(); // url -> Promise<AudioBuffer>
  function clipUrl(key) {
    const hash = manifest && manifest[lang] && manifest[lang][key];
    return hash ? `/voice/${lang}/${encodeURIComponent(key)}.mp3?v=${hash}` : null;
  }
  function load(url) {
    if (!buffers.has(url)) {
      const p = fetch(url)
        .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then(data => new Promise((ok, fail) => audio().decodeAudioData(data, ok, fail)));
      p.catch(() => buffers.delete(url));
      buffers.set(url, p);
    }
    return buffers.get(url);
  }

  // ---------- built-in voice fallback ----------
  let ttsVoice = null;
  function pickTtsVoice() {
    if (!('speechSynthesis' in window)) return;
    const want = LANGS[lang].slice(0, 2);
    const voices = speechSynthesis.getVoices().filter(v => v.lang.replace('_', '-').toLowerCase().startsWith(want));
    const nice = {
      en: /ava|zoe|allison|susan|samantha|google us english/i,
      nl: /xander|claire|ellen|fleur|google nederlands/i,
      de: /anna|petra|helena|marlene|google deutsch/i,
      es: /m[oó]nica|paulina|marisol|google espa[nñ]ol/i,
      fa: /dariush|google/i,
    }[lang];
    const score = v => (/premium|enhanced|natural|neural|siri/i.test(v.name) ? 4 : 0) + (nice.test(v.name) ? 2 : 0) + (v.localService ? 1 : 0);
    ttsVoice = voices.sort((a, b) => score(b) - score(a))[0] || null;
  }
  if ('speechSynthesis' in window) { pickTtsVoice(); speechSynthesis.addEventListener?.('voiceschanged', pickTtsVoice); }

  function speakTts(text, token) {
    return new Promise(done => {
      if (!('speechSynthesis' in window) || token !== playing) return done();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LANGS[lang];
      if (ttsVoice) u.voice = ttsVoice;
      u.rate = .92; u.pitch = 1.05;
      u.onend = u.onerror = () => done();
      speechSynthesis.speak(u);
    });
  }

  // ---------- playing ----------
  let playing = 0;   // bumps on every new say() so older ones stop
  let source = null;

  function stop() {
    playing++;
    if (source) { try { source.stop(); } catch (e) {} source = null; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  async function playOne(key, token) {
    // brothers and sisters each have their own version of a line: '<key>@<child id>'
    const kid = EDITION.kid && EDITION.kid.id;
    if (kid && LINES[key + '@' + kid]) key += '@' + kid;
    const line = LINES[key];
    if (!line) { console.warn('Voice: unknown line', key); return; }
    await ready;
    if (token !== playing) return;
    const url = clipUrl(key);
    if (url) {
      try {
        const buf = await load(url);
        if (token !== playing) return;
        const a = audio();
        await new Promise(done => {
          source = a.createBufferSource();
          source.buffer = buf;
          source.connect(a.destination);
          source.onended = done;
          source.start();
        });
        return;
      } catch (e) { /* fall through to the built-in voice */ }
    }
    await speakTts(line[lang] || line.en, token);
  }

  async function say(...items) {
    stop();
    const token = playing;
    for (let item of items) {
      if (!item) continue;
      if (Array.isArray(item)) item = item[Math.floor(Math.random() * item.length)];
      await playOne(item, token);
      if (token !== playing) return;
    }
  }

  // the offline cache (/sw.js) downloads only this language's clips, so tell it which one
  function tellOfflineCache() {
    navigator.serviceWorker.ready.then(reg => reg.active && reg.active.postMessage({ lang })).catch(() => {});
  }

  function setLang(l) {
    if (!LANGS[l]) return;
    lang = l;
    try { localStorage.setItem(LANG_KEY, l); } catch (e) {}
    pickTtsVoice();
    if ('serviceWorker' in navigator) tellOfflineCache();
  }

  if ('serviceWorker' in navigator) tellOfflineCache();
  else {
    // no offline cache: warm up this language's clips in the background so speaking starts instantly
    ready.then(() => {
      const keys = Object.keys((manifest && manifest[lang]) || {});
      keys.forEach(k => fetch(clipUrl(k)).catch(() => {}));
    });
  }

  self.Voice = { say, stop, setLang, langs: Object.keys(LANGS), get lang() { return lang; } };
})();
