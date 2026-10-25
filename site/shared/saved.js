// Bigger saved things for Yas's Games: photos and drawings, kept in IndexedDB on this device.
// Small game progress stays in localStorage (see Kit.store); pictures don't go there, because
// localStorage only holds about 5 MB for the whole site and once it's full nothing saves anymore.
//
//   Saved.photos.add('dress-up', canvas)    keep a photo from a game (resolves to the photo or null)
//   Saved.photos.list('dress-up')           the child playing's, oldest first; list() = every game's and child's
//   Saved.photos.remove(id) / clear()
//   Saved.photos.adopt('dress-up', [dataURL]) move photos an older version kept in localStorage
//   Saved.photos.save(photos)               share / download / write them to a folder (call from a tap)
//   Saved.pictures.put(id, dataURL) / get(id) / all() / remove(id)   drawings a game needs to play
//                                           (all() = the child playing's; ids from pictures.newId())
//   Saved.clearCache()                      forget the downloaded offline files (progress and photos stay)
//   Saved.usage()                           { photos, photoBytes, cacheBytes, persisted }
(() => {
  // ask the browser not to clear our storage when the device runs low or the site isn't opened for a while
  try {
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then(yes => yes || navigator.storage.persist()).catch(() => {});
    }
  } catch (e) {}

  let opening = null;
  function db() {
    if (!opening) opening = new Promise(ok => {
      try {
        const req = indexedDB.open('yasGames', 1);
        req.onupgradeneeded = () => {
          const d = req.result;
          d.createObjectStore('photos', { keyPath: 'id' }).createIndex('game', 'game');
          d.createObjectStore('pictures');
        };
        req.onsuccess = () => ok(req.result);
        req.onerror = () => ok(null);
      } catch (e) { ok(null); }
    });
    return opening;
  }
  // run one request; resolves to its result, or false if it failed or storage isn't available
  async function run(store, mode, fn) {
    const d = await db(); if (!d) return false;
    return new Promise(ok => {
      try {
        const tx = d.transaction(store, mode), req = fn(tx.objectStore(store));
        tx.oncomplete = () => ok(req.result);
        tx.onerror = tx.onabort = () => ok(false);
      } catch (e) { ok(false); }
    });
  }
  const write = async (store, fn) => (await run(store, 'readwrite', fn)) !== false;

  const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  // brothers and sisters each have their own (see EDITION.mine): photos carry who made them, and
  // drawings' ids end in @id. Without either, it's the first child's (or the only child's).
  const me = EDITION.mine(''), kid = me && { kid: me.slice(1) };
  const isMine = key => me ? key.endsWith(me) : !key.includes('@');
  const toBlob = (canvas, type = 'image/jpeg', quality = .85) => new Promise(ok => {
    try { canvas.toBlob(ok, type, quality); } catch (e) { ok(null); }
  });

  // ---------- photos ----------
  const photos = {
    async add(game, canvas) {
      const blob = await toBlob(canvas);
      if (!blob) return null;
      const p = { id: newId(), game, time: Date.now(), blob, ...kid };
      return (await write('photos', s => s.put(p))) ? p : null;
    },
    async list(game) {
      const all = await run('photos', 'readonly', s => game ? s.index('game').getAll(game) : s.getAll());
      return (all || []).filter(p => !game || (p.kid ? '@' + p.kid : '') === me).sort((a, b) => a.time - b.time);
    },
    remove: id => write('photos', s => s.delete(id)),
    clear: () => write('photos', s => s.clear()),

    // true when every one was moved, so the caller can drop its old copies
    async adopt(game, srcs) {
      let ok = true, t = Date.now() - srcs.length * 1000;
      for (const src of srcs) {
        try {
          const blob = await (await fetch(src)).blob();
          if (!(await write('photos', s => s.put({ id: newId(), game, time: t++, blob, ...kid })))) ok = false;
        } catch (e) { ok = false; }
      }
      return ok;
    },

    fileName(p) {
      const d = new Date(p.time), two = n => String(n).padStart(2, '0');
      const ext = (p.blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      return `yas-${p.game}-${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}-${two(d.getHours())}${two(d.getMinutes())}${two(d.getSeconds())}-${p.id.slice(-3)}.${ext}`;
    },

    // Call straight from a tap with photos already loaded: the share sheet only opens during a tap.
    //   iPad/phone: the share sheet ("Save Image" to Photos, or "Save to Files" to pick a folder)
    //   computer: several photos go into a folder you pick (where supported), otherwise to Downloads
    save(list) {
      if (!list.length) return Promise.resolve('none');
      const files = list.map(p => new File([p.blob], photos.fileName(p), { type: p.blob.type }));
      const touch = matchMedia('(pointer: coarse)').matches;
      if (touch && navigator.canShare && navigator.canShare({ files })) {
        return navigator.share({ files }).then(() => 'shared', e => e.name === 'AbortError' ? 'cancelled' : download(files));
      }
      if (files.length > 1 && self.showDirectoryPicker) return toFolder(files).catch(e => e.name === 'AbortError' ? 'cancelled' : download(files));
      return download(files);
    },
  };

  async function toFolder(files) {
    const dir = await showDirectoryPicker({ id: 'yas-photos', mode: 'readwrite', startIn: 'pictures' });
    for (const f of files) {
      const w = await (await dir.getFileHandle(f.name, { create: true })).createWritable();
      await w.write(f); await w.close();
    }
    return 'folder';
  }
  async function download(files) {
    for (const f of files) {
      const url = URL.createObjectURL(f), a = document.createElement('a');
      a.href = url; a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      // browsers drop downloads that come too quickly one after another
      if (files.length > 1) await new Promise(r => setTimeout(r, 350));
    }
    return 'downloaded';
  }

  // ---------- pictures a game needs (e.g. Magic Doodles creatures), stored as data URLs ----------
  const pictures = {
    newId: () => EDITION.mine(newId()),
    put: (id, src) => write('pictures', s => s.put(src, id)),
    get: async id => (await run('pictures', 'readonly', s => s.get(id))) || null,
    remove: id => write('pictures', s => s.delete(id)),
    async all() {
      const d = await db(); if (!d) return {};
      return new Promise(ok => {
        const out = {};
        try {
          const req = d.transaction('pictures').objectStore('pictures').openCursor();
          req.onsuccess = () => { const c = req.result; if (c) { if (isMine(c.key)) out[c.key] = c.value; c.continue(); } else ok(out); };
          req.onerror = () => ok(out);
        } catch (e) { ok(out); }
      });
    },
  };

  // ---------- offline files ----------
  async function cacheBytes() {
    if (!self.caches) return 0;
    let n = 0;
    for (const key of await caches.keys()) {
      const cache = await caches.open(key);
      for (const req of await cache.keys()) {
        const res = await cache.match(req);
        const len = res && +res.headers.get('content-length');
        n += len || (res ? (await res.blob()).size : 0);
      }
    }
    return n;
  }
  async function clearCache() {
    if (self.caches) for (const key of await caches.keys()) await caches.delete(key);
  }

  async function usage() {
    const list = await photos.list();
    let persisted = null;
    try { persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : null; } catch (e) {}
    return { photos: list.length, photoBytes: list.reduce((n, p) => n + p.blob.size, 0), cacheBytes: await cacheBytes().catch(() => 0), persisted };
  }

  self.Saved = { photos, pictures, clearCache, usage };
})();
