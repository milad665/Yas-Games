#!/usr/bin/env node
// Builds one edition of the site into dist/<edition>/.
//
//   node tools/build.mjs yas                       Yas's own edition (the homelab): site/ as it is
//   node tools/build.mjs lili                      Lilli's edition (her family's homelab)
//   node tools/build.mjs public                    the public edition (Firebase)
//     --url https://example.com                    where it's hosted (default: "url" in editions/public/site.json)
//     --donate-url https://donate.stripe.com/...   Stripe Payment Link for the 💝 button (no link, no button)
//     --out <dir>                                  somewhere other than dist/<edition>
//
// SITE_URL and DONATE_URL in the environment work too (that's how the pipeline passes them).
//
// The other editions are site/ with everything about Yas taken out:
//   - the name, identifiers, languages and child come from editions/<edition>/site.json
//   - shared/edition.js gets that child (or none for the public site, so Letter Trace and
//     Cake Shop leave out a name and birthday)
//   - lines marked kid: true in lines.js, and their voice clips, are dropped; a personal edition
//     brings its own from editions/<edition>/lines.js and editions/<edition>/voice/
// The public edition also gets search engine extras:
//   - every page gets a search-friendly title, description, social card and structured data,
//     the home page gets editions/public/home.html (the grown-ups' section and 💝 donate),
//     files in editions/public/static/ are added as they are,
//     and robots.txt and sitemap.xml are added
// Every build but Yas's fails if "Yas" is still anywhere in the output, and the public one also if the
// name of a child from another personal edition (Lilli, Liam) is.

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = path.join(ROOT, 'site');
const EDITIONS = ['yas', 'lili', 'public'];

const args = process.argv.slice(2);
const opt = name => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const edition = args[0];
if (!EDITIONS.includes(edition)) {
  console.error(`Usage: node tools/build.mjs <${EDITIONS.join('|')}> [--url URL] [--donate-url URL] [--out DIR]`);
  process.exit(1);
}
const OUT = path.resolve(ROOT, opt('--out') || path.join('dist', edition));

fs.rmSync(OUT, { recursive: true, force: true });
fs.cpSync(SITE, OUT, { recursive: true, filter: src => path.basename(src) !== '.DS_Store' });
if (edition === 'yas') {
  console.log(`✓ Yas's edition → ${path.relative(ROOT, OUT)}/`);
  process.exit(0);
}

// ---------- every other edition: Yas out, this edition in ----------
const ED = path.join(ROOT, 'editions', edition);
const cfg = JSON.parse(fs.readFileSync(path.join(ED, 'site.json'), 'utf8'));
const isPublic = edition === 'public';
const siteUrl = (opt('--url') || process.env.SITE_URL || cfg.url || '').trim().replace(/\/+$/, '');
const donateUrl = (opt('--donate-url') ?? process.env.DONATE_URL ?? '').trim();
for (const [name, u] of [['--url', siteUrl], ['--donate-url', donateUrl]]) {
  if (u && !/^https:\/\/[^\s"'<>]+$/.test(u)) { console.error(`✗ ${name} must be an https:// address, got "${u}"`); process.exit(1); }
}
if (isPublic && !siteUrl) console.warn('! No --url: leaving out canonical links, social cards and the sitemap.');
if (isPublic && !donateUrl) console.warn('! No --donate-url: the public site has no donate button.');

const out = (...p) => path.join(OUT, ...p);
// files only this edition has (e.g. a search console verification file)
const STATIC = path.join(ED, 'static');
if (fs.existsSync(STATIC)) fs.cpSync(STATIC, OUT, { recursive: true, filter: src => path.basename(src) !== '.DS_Store' });
const read = f => fs.readFileSync(f, 'utf8');
const write = (f, s) => fs.writeFileSync(f, s);
const load = (file, name) => { const sb = { self: {} }; vm.runInNewContext(read(file), sb); return sb.self[name]; };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const abs = rel => siteUrl + '/' + rel;

const GAMES = load(out('shared', 'games.js'), 'GAMES');

// lines: drop the ones that name Yas, and their clips; then add this edition's own
const LINES = load(out('shared', 'lines.js'), 'VOICE_LINES');
const lines = {}, kidKeys = [];
for (const [key, line] of Object.entries(LINES)) {
  if (line.kid) { kidKeys.push(key); continue; }
  lines[key] = line;
}
const ownLines = fs.existsSync(path.join(ED, 'lines.js')) ? load(path.join(ED, 'lines.js'), 'VOICE_LINES') : {};
Object.assign(lines, ownLines);
write(out('shared', 'lines.js'),
  '// Every line the games speak, in English, Dutch, German, Spanish and Persian.\n' +
  '// Games call Voice.say(\'<key>\').\n' +
  `self.VOICE_LINES = ${JSON.stringify(lines, null, 2)};\n`);
const manifest = JSON.parse(read(out('voice', 'manifest.json')));
for (const [lang, clips] of Object.entries(manifest)) {
  if (lang === 'voices') continue;
  for (const key of kidKeys) {
    delete clips[key];
    fs.rmSync(out('voice', lang, key + '.mp3'), { force: true });
  }
}
// this edition's own clips (recorded by tools/record-voice.mjs into editions/<edition>/voice/)
if (Object.keys(ownLines).length) {
  let own = {};
  try { own = JSON.parse(read(path.join(ED, 'voice', 'manifest.json'))); } catch {}
  for (const [lang, clips] of Object.entries(own)) {
    if (lang === 'voices') continue;
    for (const [key, hash] of Object.entries(clips)) {
      if (!ownLines[key]) continue;
      fs.mkdirSync(out('voice', lang), { recursive: true });
      fs.copyFileSync(path.join(ED, 'voice', lang, key + '.mp3'), out('voice', lang, key + '.mp3'));
      (manifest[lang] = manifest[lang] || {})[key] = hash;
    }
  }
  const unrecorded = cfg.langs.flatMap(l => Object.keys(ownLines).filter(k => ownLines[k][l] && !(manifest[l] || {})[k]).map(k => `${l}/${k}`));
  if (unrecorded.length) console.warn(`! Not recorded yet (the device voice says them): ${unrecorded.join(', ')}`);
}
// the clips of languages this edition doesn't have aren't needed
const langs = cfg.langs || ['en', 'nl', 'fa'];
for (const lang of Object.keys(manifest)) {
  if (lang === 'voices' || langs.includes(lang)) continue;
  delete manifest[lang];
  fs.rmSync(out('voice', lang), { recursive: true, force: true });
}
write(out('voice', 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
// the same for the story books' reading
if (fs.existsSync(out('books'))) for (const slug of fs.readdirSync(out('books'))) {
  const file = out('books', slug, 'voice', 'manifest.json');
  if (!fs.existsSync(file)) continue;
  const m = JSON.parse(read(file));
  for (const lang of Object.keys(m)) {
    if (lang === 'voices' || langs.includes(lang)) continue;
    delete m[lang]; delete m.voices[lang];
    fs.rmSync(out('books', slug, 'voice', lang), { recursive: true, force: true });
  }
  write(file, JSON.stringify(m, null, 2) + '\n');
}

// shared/edition.js: this edition's data, then the same code as Yas's (which child, how old)
const editionInfo = {
  name: cfg.name, ...(cfg.title && { title: cfg.title }),
  ...(cfg.kids ? { kids: cfg.kids } : { kid: cfg.kid || null }),
  langs, ...(cfg.lang && { lang: cfg.lang }),
};
const editionCode = read(out('shared', 'edition.js')).split(/^self\.EDITION = \{[\s\S]*?^\};\n/m)[1];
if (editionCode === undefined) throw new Error('shared/edition.js: no "self.EDITION = { ... };" block');
write(out('shared', 'edition.js'),
  `// ${cfg.name} (made by tools/build.mjs ${edition}).\nself.EDITION = ${JSON.stringify(editionInfo, null, 2)};\n` + editionCode);

// name and identifiers in every text file
const TEXT = /\.(html|js|css|json|webmanifest|txt|xml|svg)$/i;
const walk = dir => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
for (const f of walk(OUT).filter(f => TEXT.test(f))) {
  const s = read(f);
  const t = s
    .replaceAll("Yas's Games", cfg.name)
    .replaceAll("Yas\\'s Games", cfg.name.replaceAll("'", "\\'"))
    .replace(/yas-games/g, cfg.slug)
    .replace(/yasGames/g, cfg.storageName)
    .replace(/\byas-/g, cfg.slug + '-');
  if (t !== s) write(f, t);
}

const webmanifest = JSON.parse(read(out('manifest.webmanifest')));
Object.assign(webmanifest, { name: cfg.name, short_name: cfg.name, description: cfg.description, categories: ['education', 'games', 'kids'] });
write(out('manifest.webmanifest'), JSON.stringify(webmanifest, null, 2) + '\n');
// the page language before the voice script sets it
if (cfg.lang) write(out('index.html'), read(out('index.html')).replace('<html lang="en">', `<html lang="${cfg.lang}">`));

if (isPublic) addSearchExtras();
checkNoYas();
console.log(`✓ ${cfg.name} (${edition}) → ${path.relative(ROOT, OUT)}/ ` +
  `(${GAMES.length} games, languages ${langs.join(', ')}, ${kidKeys.length} lines about Yas left out` +
  (Object.keys(ownLines).length ? `, ${Object.keys(ownLines).length} of its own` : '') +
  (isPublic && donateUrl ? ', donate button on' : '') + ')');

function addSearchExtras() {

// ---------- search engines and social cards ----------
const image = siteUrl && abs('icon-512.png');
const offer = { '@type': 'Offer', price: '0', priceCurrency: 'USD' };
const audience = { '@type': 'PeopleAudience', suggestedMinAge: 3, suggestedMaxAge: 7 };

function headTags({ title, description, rel, jsonld, keywords }) {
  const tags = [
    `<meta name="description" content="${esc(description)}">`,
    keywords && `<meta name="keywords" content="${esc(keywords)}">`,
    siteUrl && `<link rel="canonical" href="${esc(abs(rel))}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${esc(cfg.name)}">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    siteUrl && `<meta property="og:url" content="${esc(abs(rel))}">`,
    image && `<meta property="og:image" content="${esc(image)}">`,
    image && `<meta property="og:image:alt" content="${esc(cfg.name)}: a painter's palette">`,
    `<meta name="twitter:card" content="summary">`,
    `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>`,
  ];
  return tags.filter(Boolean).map(t => '  ' + t).join('\n') + '\n';
}

function seo(file, page) {
  let s = read(file);
  if (!/<title>[^<]*<\/title>/.test(s) || !s.includes('</head>')) throw new Error(`${file}: no <title> or </head>`);
  s = s.replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`);
  s = s.replace('</head>', headTags(page) + '</head>');
  if (page.body) s = s.replace('</body>', page.body + '\n</body>');
  write(file, s);
}

const website = { '@type': 'WebSite', name: cfg.name, ...(siteUrl && { url: abs('') }) };
const gameUrl = g => (siteUrl ? { url: abs(g.path) } : {});

// home page
const gameList = GAMES.map(g => `    <li><a href="/${esc(g.path)}">${esc(g.art)} ${esc(g.name)}</a><p>${esc(g.about || '')}</p></li>`).join('\n');
const home = read(path.join(ROOT, 'editions', 'public', 'home.html'))
  .replaceAll('{{NAME}}', esc(cfg.name))
  .replaceAll('{{COUNT}}', String(GAMES.length))
  .replaceAll('{{GAME_LIST}}', gameList)
  .replaceAll('{{DONATE_URL}}', JSON.stringify(donateUrl).replace(/</g, '\\u003c'))
  .replaceAll('{{SITE_URL}}', JSON.stringify(siteUrl ? abs('') : '').replace(/</g, '\\u003c'))
  .replaceAll('{{TAGLINE}}', esc(cfg.tagline));
seo(out('index.html'), {
  rel: '',
  title: `${cfg.name}: ${cfg.tagline}`,
  description: cfg.description,
  keywords: cfg.keywords,
  body: home,
  jsonld: {
    '@context': 'https://schema.org',
    '@graph': [
      website,
      {
        '@type': 'WebApplication', name: cfg.name, description: cfg.description, ...(siteUrl && { url: abs('') }),
        ...(image && { image }),
        applicationCategory: 'EducationalApplication', operatingSystem: 'Any (runs in a web browser)',
        isAccessibleForFree: true, offers: offer, audience, typicalAgeRange: '3-7', inLanguage: langs,
        hasPart: GAMES.map(g => ({ '@type': 'WebApplication', name: g.name, description: g.about, ...gameUrl(g) })),
      },
    ],
  },
});

// game pages
for (const g of GAMES) {
  const file = out(g.path, 'index.html');
  if (!fs.existsSync(file)) { console.warn(`! ${g.path} is in games.js but has no index.html`); continue; }
  seo(file, {
    rel: g.path,
    title: `${g.name}: a free game for kids | ${cfg.name}`,
    description: `${g.about} Free, no ads, no sign-up, works offline.`,
    jsonld: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication', name: g.name, description: g.about, ...gameUrl(g),
      applicationCategory: 'GameApplication', genre: 'Educational game', operatingSystem: 'Any (runs in a web browser)',
      isAccessibleForFree: true, offers: offer, audience, typicalAgeRange: '3-7', inLanguage: langs,
      isPartOf: website,
    },
  });
}

write(out('robots.txt'), 'User-agent: *\nAllow: /\n' + (siteUrl ? `\nSitemap: ${abs('sitemap.xml')}\n` : ''));
if (siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ['', ...GAMES.map(g => g.path)].map(rel =>
    `  <url><loc>${esc(abs(rel))}</loc><lastmod>${today}</lastmod><priority>${rel ? '0.8' : '1.0'}</priority></url>`);
  write(out('sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
}

}

// ---------- nothing about Yas may be left ----------
function checkNoYas() {
  // (at the start of a word, so "payaso" is fine but "yasGames" isn't)
  // The public site may not name the children of the personal editions either (Lilli and Liam).
  const others = !isPublic ? [] : fs.readdirSync(path.join(ROOT, 'editions'))
    .filter(e => e !== edition && fs.existsSync(path.join(ROOT, 'editions', e, 'site.json')))
    .flatMap(e => { const c = JSON.parse(read(path.join(ROOT, 'editions', e, 'site.json'))); return (c.kids || (c.kid ? [c.kid] : [])).map(k => k.name); });
  const NAME = new RegExp(`(?<![\\p{L}])(${['yas', 'یاس', ...others].join('|')})(?![\\p{L}])|(?<![\\p{L}])yas`, 'iu');
  const leaks = [];
  for (const f of walk(OUT)) {
    const rel = path.relative(OUT, f);
    if (NAME.test(rel)) leaks.push(`${rel} (file name)`);
    if (!TEXT.test(f)) continue;
    read(f).split('\n').forEach((line, i) => { if (NAME.test(line)) leaks.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`); });
  }
  if (leaks.length) {
    console.error(`✗ ${cfg.name} still mentions Yas${isPublic ? ' (or another family\'s child)' : ''}:\n  ${leaks.join('\n  ')}`);
    process.exit(1);
  }
}
