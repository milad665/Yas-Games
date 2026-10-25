// Shared helpers for Yas's Games. Load after lines.js and voice.js.
//
//   Kit.$('id'), Kit.rand(a, b), Kit.pick(list), Kit.shuffle(list), Kit.sleep(ms)
//   Kit.sfx.pop() / ding() / yay() / oops() / boing() / whoosh() / note(freq)
//   Kit.say('line.key')                 speaks unless sound is off
//   Kit.burst(x, y, ['⭐', '✨'])        sparkles
//   Kit.store('game-name')              { get(), set(data) } saved on this device, for the child playing
//   Kit.title('h1-id', 'Game Name')     rainbow bouncing title
//   Kit.soundButton('btn-id')           🔊/🔇 toggle shared by every game
(() => {
  const $ = id => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = list => list[Math.floor(Math.random() * list.length)];
  const shuffle = list => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ---------- saving ----------
  // each child has their own saves (see EDITION.mine); settings like sound are the device's
  function store(name, { shared = false } = {}) {
    const key = shared ? 'yasGames.' + name : EDITION.mine('yasGames.' + name);
    return {
      get(fallback = {}) { try { return Object.assign(fallback, JSON.parse(localStorage.getItem(key))); } catch (e) { return fallback; } },
      set(data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { /* full or blocked: keep playing */ } },
    };
  }
  const prefs = store('prefs', { shared: true });
  let muted = !!prefs.get().muted;

  // ---------- sound ----------
  let ac = null;
  function audio() {
    if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; ac = new AC(); }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  document.addEventListener('pointerdown', audio, { capture: true });

  function tone(freq, dur, { type = 'sine', vol = .18, to = null, delay = 0, attack = .01 } = {}) {
    if (muted) return;
    const a = audio(); if (!a) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(.001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + .02);
  }
  const sfx = {
    pop: () => tone(520, .09, { to: 900 }),
    ding: () => { tone(880, .25, { type: 'triangle' }); tone(1320, .3, { type: 'triangle', delay: .08 }); },
    yay: () => [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .22, { type: 'triangle', delay: i * .08 })),
    oops: () => tone(300, .25, { type: 'triangle', to: 180 }),
    boing: () => tone(180, .3, { to: 520, vol: .2 }),
    whoosh: () => tone(900, .35, { type: 'sawtooth', vol: .04, to: 120 }),
    note: (f, d = .4, type = 'triangle') => tone(f, d, { type, vol: .16 }),
  };

  function say(...lines) { if (!muted && self.Voice) Voice.say(...lines); }

  function soundButton(id) {
    const b = $(id);
    const paint = () => { b.textContent = muted ? '🔇' : '🔊'; };
    paint();
    b.addEventListener('click', () => {
      muted = !muted; prefs.set({ ...prefs.get(), muted }); paint();
      if (muted) self.Voice && Voice.stop(); else sfx.pop();
    });
  }

  // ---------- sparkles ----------
  function burst(x, y, emojis, n = 12, spread = 180) {
    for (let i = 0; i < n; i++) {
      const p = document.createElement('div');
      p.className = 'particle'; p.textContent = pick(emojis);
      const ang = rand(0, Math.PI * 2), dist = rand(spread * .5, spread);
      p.style.setProperty('--x', (x - 17) + 'px'); p.style.setProperty('--y', (y - 17) + 'px');
      p.style.setProperty('--dx', Math.cos(ang) * dist + 'px'); p.style.setProperty('--dy', Math.sin(ang) * dist - 40 + 'px');
      document.body.appendChild(p); setTimeout(() => p.remove(), 1150);
    }
  }
  function burstAt(el, emojis, n, spread) {
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, emojis, n, spread);
  }

  function title(id, text) {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
    [...text].forEach((ch, i) => {
      const s = document.createElement('span');
      s.textContent = ch === ' ' ? ' ' : ch;
      s.style.color = colors[i % colors.length]; s.style.animationDelay = (i * .1) + 's';
      $(id).appendChild(s);
    });
  }

  // replay a CSS animation class on an element
  function flash(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

  // ---------- page setup ----------
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault());
  document.addEventListener('contextmenu', e => e.preventDefault());

  self.Kit = { $, rand, pick, shuffle, sleep, store, tone, sfx, say, soundButton, burst, burstAt, title, flash, audio,
    get muted() { return muted; } };
})();
