#!/usr/bin/env node
// Records every line in site/shared/lines.js with ElevenLabs, saving
// site/voice/<lang>/<key>.mp3 and site/voice/manifest.json.
// Personal editions' own lines (editions/<name>/lines.js) go in editions/<name>/voice/ the same way.
// The Story Books (site/books/<slug>/book.json) are read by their own narrators, with the time of every word
// so the words can light up: site/books/<slug>/voice/<lang>/<key>.mp3 and site/books/<slug>/voice/manifest.json.
//
//   node tools/record-voice.mjs                  record whatever is new or changed, all languages
//   node tools/record-voice.mjs --lang en,nl     only these languages
//   node tools/record-voice.mjs --dry-run        show how many characters it would use, record nothing
//   node tools/record-voice.mjs --force          re-record everything (in the chosen languages)
//   node tools/record-voice.mjs --book colours   only this story book (no game lines)
//
// Needs ELEVENLABS_API_KEY in .env (project root, not committed) and ffmpeg (brew install ffmpeg).
// Progress is saved after every clip, so if the monthly quota runs out it stops cleanly
// and the next run carries on where it left off. Clips not re-recorded yet keep playing as before.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MODEL = 'eleven_v4';
// one voice per language (ids from the ElevenLabs voice library)
const VOICES = {
  en: { name: 'Jessica', id: 'cgSgspJ2msm6clMCkdW9' },
  nl: { name: 'Jessica', id: 'cgSgspJ2msm6clMCkdW9' },
  // a native German children's-book narrator, standard German accent (Lilli's edition)
  de: { name: 'Lucy Fennek', id: 'E0OS48T5F0KU7O2NInWS' },
  // switched off until there's quota for it (then add 'es' to an edition's langs in shared/edition.js)
  // es: { name: 'Jessica', id: 'cgSgspJ2msm6clMCkdW9' },
  fa: { name: 'Matilda', id: 'XrExE9yKIg1WjnnlVkGX' },
};
// the story books' narrators: a native Dutch storyteller for Dutch, otherwise the games' voices
const BOOK_VOICES = {
  ...VOICES,
  nl: { name: 'Ruth', id: 'yO6w2xlECAQRFP6pX7Hw' },
};

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };

// ---- api key from .env ----
let KEY = process.env.ELEVENLABS_API_KEY;
try {
  const m = fs.readFileSync(path.join(ROOT, '.env'), 'utf8').match(/^ELEVENLABS_API_KEY=(.+)$/m);
  if (m) KEY = KEY || m[1].trim();
} catch {}
if (!KEY) { console.error('✗ No ELEVENLABS_API_KEY in .env'); process.exit(1); }

// ---- lines: the shared ones, then each personal edition's own ----
const loadLines = file => { const sb = { self: {} }; vm.runInNewContext(fs.readFileSync(file, 'utf8'), sb); return sb.self.VOICE_LINES; };
const sources = [{ name: 'site', lines: path.join(ROOT, 'site', 'shared', 'lines.js'), out: path.join(ROOT, 'site', 'voice') }];
for (const e of fs.readdirSync(path.join(ROOT, 'editions'))) {
  const lines = path.join(ROOT, 'editions', e, 'lines.js');
  if (fs.existsSync(lines)) sources.push({ name: e, lines, out: path.join(ROOT, 'editions', e, 'voice') });
}
for (const src of sources) {
  src.LINES = loadLines(src.lines);
  src.manifestPath = path.join(src.out, 'manifest.json');
  try { src.manifest = JSON.parse(fs.readFileSync(src.manifestPath, 'utf8')); } catch { src.manifest = {}; }
  src.manifest.voices = src.manifest.voices || {};
}
const saveManifest = src => {
  fs.mkdirSync(src.out, { recursive: true });
  fs.writeFileSync(src.manifestPath, JSON.stringify(src.manifest, null, 2) + '\n');
};

const langs = opt('--lang') ? opt('--lang').split(',') : Object.keys(VOICES);
for (const l of langs) if (!VOICES[l]) { console.error(`✗ Unknown language "${l}"`); process.exit(1); }

const hashOf = (voice, text) => createHash('sha1').update(`${MODEL}\n${voice.id}\n${text}`).digest('hex').slice(0, 10);

// ---- the story books: title (title), pages (p1, p2, ...), tap spots (s<page>-<n>), questions (q1, ...) ----
const BOOKS_DIR = path.join(ROOT, 'site', 'books');
const onlyBook = opt('--book');
if (onlyBook) sources.length = 0;
const books = !fs.existsSync(BOOKS_DIR) ? [] : fs.readdirSync(BOOKS_DIR)
  .filter(d => fs.existsSync(path.join(BOOKS_DIR, d, 'book.json')) && (!onlyBook || d === onlyBook))
  .map(slug => {
    const b = JSON.parse(fs.readFileSync(path.join(BOOKS_DIR, slug, 'book.json'), 'utf8'));
    const LINES = { title: b.title };
    b.pages.forEach((p, i) => {
      LINES['p' + (i + 1)] = p.text;
      (p.spots || []).forEach((s, k) => { LINES[`s${i + 1}-${k + 1}`] = s.word; });
    });
    (b.quiz || []).forEach((q, n) => { LINES['q' + (n + 1)] = q.q; });
    const out = path.join(BOOKS_DIR, slug, 'voice');
    let manifest = {};
    try { manifest = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json'), 'utf8')); } catch {}
    manifest.voices = manifest.voices || {};
    return { name: 'book:' + slug, book: true, LINES, out, manifest, manifestPath: path.join(out, 'manifest.json') };
  });

// ---- what needs recording ----
const todo = [];
for (const src of [...sources, ...books]) for (const lang of langs) {
  const voice = (src.book ? BOOK_VOICES : VOICES)[lang];
  const prev = src.manifest[lang] || {};
  for (const [key, line] of Object.entries(src.LINES)) {
    const text = line[lang];
    if (!text) continue;
    const hash = hashOf(voice, text);
    // a word tapped in several pictures of a book is recorded once: the others point to it ({ f: key })
    if (src.book && /^s\d/.test(key)) {
      const first = Object.keys(src.LINES).find(k => /^s\d/.test(k) && src.LINES[k][lang] === text);
      if (first !== key) {
        if (!fs.existsSync(path.join(src.out, lang, key + '.mp3'))) { (src.manifest[lang] = src.manifest[lang] || {})[key] = { h: hash, f: first }; continue; }
      }
    }
    const file = path.join(src.out, lang, key + '.mp3');
    const had = src.book ? prev[key] && prev[key].h : prev[key];
    if (!flag('--force') && had === hash && fs.existsSync(file)) continue;
    todo.push({ src, lang, voice, key, text, hash, file });
  }
}

async function api(p, init = {}) {
  const res = await fetch('https://api.elevenlabs.io' + p, { ...init, headers: { 'xi-api-key': KEY, ...init.headers } });
  if (!res.ok) {
    const body = await res.text();
    const err = new Error(`${res.status} ${body.slice(0, 300)}`);
    err.quota = /quota_exceeded|insufficient|exceeds your quota/i.test(body);
    throw err;
  }
  return res;
}

const chars = todo.reduce((n, t) => n + t.text.length, 0);
const sub = await (await api('/v1/user/subscription')).json();
const left = sub.character_limit - sub.character_count;
const reset = new Date(sub.next_character_count_reset_unix * 1000).toDateString();
console.log(`Voices: ${langs.map(l => `${l} → ${VOICES[l].name}`).join(', ')}  (${MODEL})`);
if (books.length) console.log(`Story books: ${langs.map(l => `${l} → ${BOOK_VOICES[l].name}`).join(', ')}`);
console.log(`To record: ${todo.length} clip(s), ${chars.toLocaleString()} characters. ` +
  `Quota left: ${left.toLocaleString()} (resets ${reset}).`);
for (const lang of langs) {
  const mine = todo.filter(t => t.lang === lang);
  if (mine.length) console.log(`  ${lang}: ${mine.length} clips, ${mine.reduce((n, t) => n + t.text.length, 0).toLocaleString()} chars`);
}
if (flag('--dry-run') || !todo.length) process.exit(0);
if (chars > left) console.log(`  (not enough quota for all of it: it will record until the quota runs out)`);

// ---- record ----
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'yas-voice-'));
let made = 0, stopped = null;

async function record(t) {
  const raw = path.join(tmp, `${t.src.name.replace(':', '-')}-${t.lang}-${t.key}.mp3`);
  let words = null;
  if (t.src.book) {
    // with the time of every character, turned into [startMs, endMs] for every word (split as the reader splits)
    const res = await api(`/v1/text-to-speech/${t.voice.id}/with-timestamps?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: t.text, model_id: MODEL, language_code: t.lang }),
    });
    const { audio_base64, alignment } = await res.json();
    fs.writeFileSync(raw, Buffer.from(audio_base64, 'base64'));
    const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = alignment;
    // the alignment is per character of the text sent; if it isn't, spread it evenly
    const at = characters.length === t.text.length ? i => i : i => Math.round(i * (characters.length - 1) / Math.max(1, t.text.length - 1));
    words = [...t.text.matchAll(/\S+/g)].map(m => [
      Math.round(starts[at(m.index)] * 1000), Math.round(ends[at(m.index + m[0].length - 1)] * 1000)]);
  } else {
    const res = await api(`/v1/text-to-speech/${t.voice.id}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: t.text, model_id: MODEL, language_code: t.lang }),
    });
    fs.writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
  }
  fs.mkdirSync(path.dirname(t.file), { recursive: true });
  // trim silence at both ends (a timed clip only at the end, so its word times still match), mono, small mp3
  const trimEnd = 'areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.08';
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw,
    '-af', words ? trimEnd : 'silenceremove=start_periods=1:start_threshold=-50dB,' + trimEnd,
    '-ac', '1', '-ar', '44100', '-b:a', '64k', t.file]);
  const m = t.src.manifest;
  (m[t.lang] = m[t.lang] || {})[t.key] = words ? { h: t.hash, w: words } : t.hash;
  m.voices[t.lang] = `${t.voice.name} (ElevenLabs ${MODEL})`;
  saveManifest(t.src);
  made++;
  console.log(`  ${t.lang}  ${(t.src.name === 'site' ? '' : t.src.name + ':') + t.key.padEnd(18)} ${t.text.replace(/\n/g, ' / ').slice(0, 90)}`);
}

const queue = [...todo];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length && !stopped) {
    const t = queue.shift();
    for (let attempt = 1; ; attempt++) {
      try { await record(t); break; }
      catch (e) {
        if (e.quota) { stopped = 'quota'; break; }
        if (attempt >= 3) { console.error(`  ✗ ${t.lang} ${t.key}: ${e.message}`); break; }
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  }
}));

// remove clips for lines that no longer exist
for (const src of [...sources, ...books]) {
  for (const lang of langs) {
    const dir = path.join(src.out, lang);
    const m = src.manifest[lang] || {};
    for (const key of Object.keys(m)) if (!src.LINES[key] || !src.LINES[key][lang]) delete m[key];
    if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) if (!m[f.replace(/\.mp3$/, '')]) fs.rmSync(path.join(dir, f));
  }
  saveManifest(src);
}
fs.rmSync(tmp, { recursive: true, force: true });

const remaining = todo.length - made;
console.log(`\n✓ ${made} clip(s) recorded.` + (remaining ? ` ${remaining} still to do` +
  (stopped === 'quota' ? ` (quota ran out; run again after ${reset}).` : '; run again to retry.') : ''));
console.log('Commit site/voice/, editions/*/voice/ and site/books/*/voice/ and push to deploy.');
