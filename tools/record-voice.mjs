#!/usr/bin/env node
// Records every line in site/shared/lines.js with a natural Apple voice (macOS only),
// saving site/voice/<lang>/<key>.mp3 and site/voice/manifest.json.
//
//   node tools/record-voice.mjs                    use the best installed voice per language
//   node tools/record-voice.mjs --en "Zoe (Premium)" --nl "Xander (Enhanced)"
//   node tools/record-voice.mjs --force            re-record everything
//   node tools/record-voice.mjs --list             show which voices would be used
//
// Install voices first: System Settings → Accessibility → Spoken Content → System voice →
// Manage Voices… → English / Dutch → download a "(Premium)" or "(Enhanced)" voice.
// Needs ffmpeg (brew install ffmpeg).

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'site', 'voice');
const LANGS = { en: ['en_US', 'en_GB', 'en_AU', 'en_IE', 'en_ZA', 'en_IN'], nl: ['nl_NL', 'nl_BE'] };

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };

// ---- lines ----
const sandbox = { self: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'site', 'shared', 'lines.js'), 'utf8'), sandbox);
const LINES = sandbox.self.VOICE_LINES;

// ---- voices ----
function installedVoices() {
  return execFileSync('say', ['-v', '?'], { encoding: 'utf8' }).split('\n').map(l => {
    const m = l.match(/^(.+?)\s{2,}([a-z]{2}_[A-Z]{2})\s+#/);
    return m && { name: m[1].trim(), locale: m[2] };
  }).filter(Boolean);
}
function bestVoice(lang, voices) {
  const locales = LANGS[lang];
  const ok = voices.filter(v => locales.includes(v.locale));
  const rank = v => (/\(Premium\)/.test(v.name) ? 0 : /\(Enhanced\)/.test(v.name) ? 1 : 9) * 10 + locales.indexOf(v.locale);
  ok.sort((a, b) => rank(a) - rank(b));
  return ok[0] && rank(ok[0]) < 90 ? ok[0].name : null;
}

const voices = installedVoices();
const chosen = {};
for (const lang of Object.keys(LANGS)) {
  chosen[lang] = opt('--' + lang) || bestVoice(lang, voices);
  if (chosen[lang] && !voices.some(v => v.name === chosen[lang])) {
    console.error(`✗ Voice "${chosen[lang]}" is not installed.`); process.exit(1);
  }
}
console.log('Voices:', Object.entries(chosen).map(([l, v]) => `${l} → ${v || '(none installed)'}`).join(', '));
if (flag('--list')) process.exit(0);

const missing = Object.keys(chosen).filter(l => !chosen[l]);
if (missing.length) {
  console.error(`\n✗ No Premium/Enhanced voice installed for: ${missing.join(', ')}.`);
  console.error('  System Settings → Accessibility → Spoken Content → System voice → Manage Voices…');
  console.error('  Download e.g. English "Zoe (Premium)" / "Ava (Premium)" and Dutch "Xander (Enhanced)" / "Claire (Enhanced)".');
  console.error('  (Or name any installed voice with --en / --nl.)');
  process.exit(1);
}

// ---- record ----
const manifestPath = path.join(OUT, 'manifest.json');
let manifest = {};
try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch {}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'yas-voice-'));
let made = 0;

for (const lang of Object.keys(LANGS)) {
  const dir = path.join(OUT, lang);
  fs.mkdirSync(dir, { recursive: true });
  const prev = manifest[lang] || {};
  const next = {};
  for (const [key, line] of Object.entries(LINES)) {
    const text = line[lang];
    if (!text) continue;
    const hash = createHash('sha1').update(chosen[lang] + '\n' + text).digest('hex').slice(0, 10);
    const file = path.join(dir, key + '.mp3');
    if (!flag('--force') && prev[key] === hash && fs.existsSync(file)) { next[key] = hash; continue; }
    const aiff = path.join(tmp, `${lang}-${key}.aiff`);
    execFileSync('say', ['-v', chosen[lang], '-o', aiff, text]);
    // trim silence at both ends, mono, small mp3
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', aiff,
      '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.08',
      '-ac', '1', '-ar', '44100', '-b:a', '64k', file]);
    next[key] = hash; made++;
    console.log(`  ${lang}  ${key.padEnd(16)} ${text}`);
  }
  // remove clips for lines that no longer exist
  for (const f of fs.readdirSync(dir)) if (!next[f.replace(/\.mp3$/, '')]) fs.rmSync(path.join(dir, f));
  manifest[lang] = next;
}
manifest.voices = chosen;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n✓ ${made} clip(s) recorded. Commit site/voice/ and push to deploy.`);
