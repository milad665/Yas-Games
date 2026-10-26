#!/usr/bin/env node
// Imports picture books from the Global Digital Library (https://digitallibrary.io, run by Norad and the
// Global Book Alliance) into site/books/<slug>/ for the Story Books shelf.
//
//   node tools/import-books.mjs i-love-my-mom sleepy-mr-sloth     import these books (the slug from the GDL link)
//   node tools/import-books.mjs --force i-love-my-mom             import again, replacing pictures and English text
//
// Only books under CC BY or CC BY-SA are taken (they allow changes, translations and use on the public
// site, which takes donations); NonCommercial and NoDerivatives books are refused.
// Each book gets:
//   site/books/<slug>/cover.jpg, 1.jpg, 2.jpg, ...   the pictures, resized
//   site/books/<slug>/book.json                       title, pages, credits; the translations, tap spots and
//                                                     questions are written by hand into the same file
// and its slug is added to site/books/books.js (the shelf, in order).
// An existing book.json keeps its translations, spots and questions; --force only refreshes the pictures,
// the English text and the credits. Needs ffmpeg and unzip.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOOKS = path.join(ROOT, 'site', 'books');
const API = 'https://content.digitallibrary.io/wp-json/wp/v2/';
const OK_LICENSES = { 'cc-by-4-0': 'CC BY 4.0', 'cc-by-sa-4-0': 'CC BY-SA 4.0', 'cc-by-sa-4-0-2': 'CC BY-SA 4.0' };
const LICENSE_URL = { 'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/', 'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/' };

const args = process.argv.slice(2);
const force = args.includes('--force');
const slugs = args.filter(a => !a.startsWith('--'));
if (!slugs.length) { console.error('Usage: node tools/import-books.mjs [--force] <gdl-slug> ...'); process.exit(1); }

const json = async u => { const r = await fetch(u); if (!r.ok) throw new Error(`${r.status} ${u}`); return r.json(); };
const text = s => s.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#039;|&#39;/g, "'").replace(/&rsquo;/g, '’').replace(/­/g, '')
  .split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');

// the shelf: site/books/books.js
const shelfFile = path.join(BOOKS, 'books.js');
const shelf = fs.existsSync(shelfFile)
  ? (() => { const sb = { self: {} }; vm.runInNewContext(fs.readFileSync(shelfFile, 'utf8'), sb); return [...sb.self.BOOKS]; })()
  : [];

for (const slug of slugs) {
  try { await importBook(slug); }
  catch (e) { console.error(`✗ ${slug}: ${e.message}`); process.exitCode = 1; }
}
fs.writeFileSync(shelfFile,
  '// The Story Books shelf, in order. Each book is in /books/<slug>/ (made by tools/import-books.mjs).\n' +
  `self.BOOKS = ${JSON.stringify(shelf, null, 2)};\n`);

// The library's EPUBs sometimes arrive a few bytes short, cutting off the end of the zip's last record
// (where its table of contents starts). Walking the files from the front finds where it starts, so the
// record can be written again.
async function download(url) {
  for (let attempt = 1; ; attempt++) {
    const data = Buffer.from(await (await fetch(url)).arrayBuffer());
    const end = data.lastIndexOf(Buffer.from('PK\x05\x06', 'latin1'));
    if (data.subarray(0, 4).toString('latin1') === 'PK\x03\x04' && end >= 0) {
      if (data.length - end >= 22) return data;
      let at = 0;
      while (data.readUInt32LE(at) === 0x04034b50) at += 30 + data.readUInt16LE(at + 26) + data.readUInt16LE(at + 28) + data.readUInt32LE(at + 18);
      if (data.readUInt32LE(at) !== 0x02014b50) throw new Error('the EPUB is broken');
      const record = Buffer.alloc(22);
      data.copy(record, 0, end, end + 12);
      record.writeUInt32LE(end - at, 12);
      record.writeUInt32LE(at, 16);
      return Buffer.concat([data.subarray(0, end), record]);
    }
    if (attempt >= 3) throw new Error('the library did not send an EPUB');
    await new Promise(r => setTimeout(r, 3000 * attempt));
  }
}

async function importBook(slug) {
  const [post] = await json(API + `book?slug=${encodeURIComponent(slug)}`);
  if (!post) throw new Error('not found in the Global Digital Library');
  const licSlug = post.class_list.find(c => c.startsWith('license-'))?.slice(8);
  const license = OK_LICENSES[licSlug];
  if (!license) throw new Error(`license ${licSlug || 'unknown'} does not allow changes or the public site; skipped`);

  // the library makes an EPUB of the book's reader (with alt texts and a credits page), from the reader's id
  const page = await (await fetch(`https://digitallibrary.io/book/${slug}/`)).text();
  const h5p = page.match(/h5p\/content\/(\d+)\//)?.[1];
  if (!h5p) throw new Error('no reader on its page');
  const epubUrl = `https://content.digitallibrary.io/wp-json/epub-generator/v1/book/${h5p}?postId=${post.id}`;

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gdl-book-'));
  try {
    const epub = path.join(tmp, 'book.epub');
    fs.writeFileSync(epub, await download(epubUrl));
    execFileSync('unzip', ['-q', '-o', epub, '-d', path.join(tmp, 'x')]);
    const dir = path.join(tmp, 'x', 'OEBPS');
    const opf = fs.readFileSync(path.join(dir, 'package.opf'), 'utf8');
    const chapters = [...opf.matchAll(/<itemref idref="([^"]+)"/g)]
      .map(m => opf.match(new RegExp(`id="${m[1]}" href="([^"]+)"`))[1]);

    const pages = chapters.map(f => {
      const s = fs.readFileSync(path.join(dir, f), 'utf8');
      const imgs = [...s.matchAll(/<img\s+src="([^"]+)"\s+alt="([^"]*)"/g)].map(m => ({ src: m[1], alt: text(m[2]) }));
      const body = s.replace(/<img[\s\S]*?\/>/g, '');
      return { imgs, text: text(body.slice(body.indexOf('<body'))) };
    });
    // the credit pages at the back: the license and the picture credits
    const isCredits = p => /Creative Commons|CC[ -]?BY|Some rights reserved|Released under/i.test(p.text);
    // a page's picture: the first image that isn't a publisher's logo or a license badge
    const art = p => p.imgs.find(i => !/logo|screenshot|licen[cs]e|cc-by/i.test(i.alt));
    const first = pages[0];
    const story = pages.slice(1).filter(p => !isCredits(p) && art(p) && p.text);
    const back = pages.slice(1).filter(isCredits);
    if (!story.length) throw new Error('no story pages found');

    const out = path.join(BOOKS, slug);
    fs.mkdirSync(out, { recursive: true });
    // resized, and on white (some pictures are line drawings on a see-through background)
    const picture = (img, name) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(dir, img.src),
      '-filter_complex', "[0:v]scale='min(1200,iw)':-2,format=rgba[a];color=white:s=16x16[w];[w][a]scale2ref[w][a];[w][a]overlay=format=auto,format=yuvj420p",
      '-frames:v', '1', '-q:v', '5', path.join(out, name)]);
    picture(art(first) || first.imgs[0], 'cover.jpg');
    story.forEach((p, i) => picture(art(p), `${i + 1}.jpg`));

    // "Author:" on one line and the name on the next makes one line
    const [title, ...byline] = first.text.replace(/:\n/g, ': ').split('\n').map(l => l.replace(/\s+-$/, ''));
    const bookFile = path.join(out, 'book.json');
    const old = fs.existsSync(bookFile) ? JSON.parse(fs.readFileSync(bookFile, 'utf8')) : null;
    if (old && !force) { console.log(`= ${slug}: already imported (--force to refresh)`); return; }
    const book = {
      slug,
      title: { ...(old?.title || {}), en: title },
      gdl: {
        url: `https://digitallibrary.io/book/${slug}/`,
        publisher: opf.match(/<dc:publisher>([^<]*)</)?.[1] || post.customMeta?.publisher || '',
        license, licenseUrl: LICENSE_URL[license],
        byline,
        credits: back.map(p => p.text.replace(/\n/g, ' ').replace(/\s+([.,])(?=\s|$)/g, '$1')).join('\n'),
      },
      pages: story.map((p, i) => ({
        ...(old?.pages?.[i] || {}),
        img: `${i + 1}.jpg`,
        alt: art(p).alt.replace(/\.?\s*Illustration$/i, ''),
        text: { ...(old?.pages?.[i]?.text || {}), en: p.text },
      })),
      ...(old?.colouring && { colouring: true }),
      ...(old?.quiz && { quiz: old.quiz }),
    };
    fs.writeFileSync(bookFile, JSON.stringify(book, null, 2) + '\n');
    if (!shelf.includes(slug)) shelf.push(slug);
    console.log(`✓ ${slug}: "${title}", ${story.length} pages, ${license} (${book.gdl.publisher})`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
