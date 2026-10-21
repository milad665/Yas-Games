// Cartoon scenery for Yas's Games: animated SVG backdrops and props that any game can use.
//
//   Scenery.backdrop('meadow')            an <svg> string that stretches to fill its box
//   Scenery.art('sun')                    { w, h, svg } for one prop (some take options: art('flower', '#f6c'))
//   Scenery.place(layer, props, W, H)     put a list of props into a box; returns their elements
//       prop = { art: 'tree', x: 88, y: 80, h: 50, at: 'bottom' | 'center' | 'top', anim: 'bob', flip, args: [], tap }
//       x, y are % of the box; h is % of the box's shorter side. A prop with `tap` is tappable
//       and gets `data-tap` so the game decides what happens (Scenery.react(el) plays the built-in wiggle).
//   Scenery.extras(layer, { stars, bubbles, snow, fireflies, shooting })   falling snow, stars, ...
//   Scenery.BACKDROPS                    the names of all backdrops
//
// Load it with <script src="/shared/scenery.js"></script>; it adds its own CSS and gradients.
(() => {
  const OL = '#3a2d52';  // outline colour

  // ---------- small helpers ----------
  // circles that melt together with one outline around the whole shape
  function blob(cs, fill, { ol = OL, w = 3, op = .55, cls = '' } = {}) {
    const out = cs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + w}"/>`).join('');
    const inn = cs.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
    return `<g class="${cls}"><g fill="${ol}" opacity="${op}">${out}</g><g fill="${fill}">${inn}</g></g>`;
  }
  // a happy face; s = size
  function face(x, y, s = 1, { sleepy = false, cheeks = '#ff8fa8' } = {}) {
    const e = 16 * s;
    const eyes = sleepy
      ? `<path d="M${x - e - 6 * s} ${y - 4 * s} q${6 * s} ${6 * s} ${12 * s} 0 M${x + e - 6 * s} ${y - 4 * s} q${6 * s} ${6 * s} ${12 * s} 0" stroke="#3a2a2a" stroke-width="${3.5 * s}" fill="none" stroke-linecap="round"/>`
      : `<g class="sc-blink"><ellipse cx="${x - e}" cy="${y - 5 * s}" rx="${5 * s}" ry="${7 * s}" fill="#3a2a2a"/><ellipse cx="${x + e}" cy="${y - 5 * s}" rx="${5 * s}" ry="${7 * s}" fill="#3a2a2a"/>` +
        `<circle cx="${x - e + 2 * s}" cy="${y - 8 * s}" r="${1.8 * s}" fill="#fff"/><circle cx="${x + e + 2 * s}" cy="${y - 8 * s}" r="${1.8 * s}" fill="#fff"/></g>`;
    return eyes +
      `<ellipse cx="${x - 26 * s}" cy="${y + 7 * s}" rx="${7 * s}" ry="${4.5 * s}" fill="${cheeks}" opacity=".6"/>` +
      `<ellipse cx="${x + 26 * s}" cy="${y + 7 * s}" rx="${7 * s}" ry="${4.5 * s}" fill="${cheeks}" opacity=".6"/>` +
      `<path d="M${x - 11 * s} ${y + 7 * s} Q${x} ${y + 19 * s} ${x + 11 * s} ${y + 7 * s}" stroke="#3a2a2a" stroke-width="${3.5 * s}" fill="none" stroke-linecap="round"/>`;
  }
  const ol = (w = 3) => `stroke="${OL}" stroke-opacity=".55" stroke-width="${w}" stroke-linejoin="round"`;
  const seeded = seed => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const spiral = (cx, cy, r, turns) => {
    let d = '';
    for (let i = 0; i <= turns * 40; i++) {
      const t = i / (turns * 40), a = t * turns * Math.PI * 2, rr = t * r;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1);
    }
    return d;
  };

  // ---------- shared gradients (in one hidden <svg> so every picture can use them) ----------
  const DEFS = () => `
    <linearGradient id="sc-sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe56b"/><stop offset="1" stop-color="#ffb43a"/></linearGradient>
    <radialGradient id="sc-glow"><stop offset="0" stop-color="#ffd25a" stop-opacity=".75"/><stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>
    <radialGradient id="sc-beam-glow"><stop offset="0" stop-color="#fff7a8" stop-opacity=".9"/><stop offset="1" stop-color="#fff7a8" stop-opacity="0"/></radialGradient>
    <linearGradient id="sc-beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff59a" stop-opacity=".85"/><stop offset="1" stop-color="#fff59a" stop-opacity="0"/></linearGradient>
    <linearGradient id="sc-planet" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffa8dc"/><stop offset="1" stop-color="#9a6bff"/></linearGradient>
    <linearGradient id="sc-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bff0ff"/><stop offset="1" stop-color="#5cc8ff"/></linearGradient>
    <linearGradient id="sc-tail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff"/></linearGradient>
    <radialGradient id="sc-neb1"><stop offset="0" stop-color="#b45cff" stop-opacity=".35"/><stop offset="1" stop-color="#b45cff" stop-opacity="0"/></radialGradient>
    <radialGradient id="sc-neb2"><stop offset="0" stop-color="#ff5fae" stop-opacity=".25"/><stop offset="1" stop-color="#ff5fae" stop-opacity="0"/></radialGradient>
    <clipPath id="sc-earth-clip"><circle cx="80" cy="80" r="66"/></clipPath>
    <clipPath id="sc-loft-clip"><rect x="112" y="78" width="56" height="46"/></clipPath>
    <clipPath id="sc-igloo-clip"><path d="M152 150 V122 A18 18 0 0 1 188 122 V150Z"/></clipPath>
    <clipPath id="sc-tent-clip"><path d="M130 22 L98 175 H162Z"/></clipPath>
    ${Object.keys(SKY).map(k =>
      `<linearGradient id="sc-sky-${k}" x1="0" y1="0" x2="0" y2="1">${SKY[k].map((c, i, a) => `<stop offset="${i / (a.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`).join('')}
  `;

  // ---------- backdrops: 1000 x 1000, stretched to fit (so only soft shapes here; real things are props) ----------
  const SKY = {
    meadow: ['#5fbfff', '#bfe9ff', '#e6f8ff'],
    castle: ['#ff9fd2', '#e2b8ff', '#c9d6ff'],
    ocean: ['#62d6ff', '#2a92dc', '#114f9e'],
    space: ['#070a24', '#1c1557', '#3c2a86'],
    dino: ['#ffb45a', '#ffcf7a', '#ffe6a8'],
    jungle: ['#a8ecb4', '#d9f7c6', '#f3ffd6'],
    snow: ['#8fd0ff', '#cbeaff', '#f2faff'],
    candy: ['#ffb8e0', '#ffd6e8', '#ffeccc'],
    farm: ['#6cc6ff', '#bde8ff', '#eaf8ff'],
    camp: ['#0b1238', '#2a2266', '#6a3f86'],
    beach: ['#4fc3ff', '#a8e4ff', '#e8f8ff'],
    room: ['#ffe9c9', '#ffdcb0'],
    stage: ['#3a1450', '#6b1f5c'],
    savanna: ['#ffc35a', '#ffdf8a', '#fff1c4'],
    garden: ['#7fd0ff', '#c8eeff', '#ecfaff'],
  };
  const hillsPath = (y, amp, seed, n = 4) => {
    const r = seeded(seed); let d = `M0 ${y}`;
    for (let i = 0; i < n; i++) {
      const x1 = (i + .5) * 1000 / n, x2 = (i + 1) * 1000 / n;
      d += ` Q${x1.toFixed(0)} ${(y - amp * (.5 + r())).toFixed(0)} ${x2.toFixed(0)} ${(y + (r() - .5) * amp * .4).toFixed(0)}`;
    }
    return d + ' V1000 H0Z';
  };
  const dots = (n, seed, y0, y1, fills, rx = [3, 7], ry = null) => {
    const r = seeded(seed); let s = '';
    for (let i = 0; i < n; i++) {
      const a = rx[0] + r() * (rx[1] - rx[0]);
      s += `<ellipse cx="${(r() * 1000).toFixed(0)}" cy="${(y0 + r() * (y1 - y0)).toFixed(0)}" rx="${a.toFixed(1)}" ry="${(ry ? ry * a : a * .6).toFixed(1)}" fill="${fills[i % fills.length]}"/>`;
    }
    return s;
  };
  const grassTufts = (n, seed, y0, y1, col) => {
    const r = seeded(seed); let s = '';
    for (let i = 0; i < n; i++) {
      const x = r() * 1000, y = y0 + r() * (y1 - y0);
      s += `<path d="M${x - 6} ${y} q3 -14 6 -18 q1 10 2 16 q4 -10 8 -12 q-2 8 -2 14Z" fill="${col}"/>`;
    }
    return s;
  };
  const sky = k => `<rect width="1000" height="1000" fill="url(#sc-sky-${k})"/>`;

  const BACK = {
    meadow: () => sky('meadow') +
      `<path d="${hillsPath(640, 120, 3)}" fill="#a9e28e"/><path d="${hillsPath(700, 110, 7, 3)}" fill="#83d166"/>` +
      `<path d="M0 760 Q500 712 1000 760 V1000 H0Z" fill="#5fbd49"/><path d="M0 860 Q500 830 1000 860 V1000 H0Z" fill="#52ad3e"/>` +
      grassTufts(70, 11, 770, 990, '#469c35') + dots(40, 5, 780, 990, ['#ffffff', '#ffe066', '#ff9fd2'], [3, 6]),
    castle: () => sky('castle') +
      `<path d="${hillsPath(700, 260, 4, 5)}" fill="#c9a8f5" opacity=".8"/><path d="${hillsPath(730, 120, 9, 3)}" fill="#a9e8c0"/>` +
      `<path d="M0 790 Q500 750 1000 790 V1000 H0Z" fill="#8fdcaa"/>` +
      `<path d="M450 1000 Q480 880 500 790 Q520 880 590 1000Z" fill="#ffe9b0" opacity=".9"/>` +
      dots(50, 21, 800, 990, ['#ffffff', '#ffb3d9', '#fff3a0'], [3, 6]),
    ocean: () => sky('ocean') +
      `<g class="sc-rays">${[120, 330, 560, 780, 930].map((x, i) => `<path d="M${x - 40} 0 H${x + 40} L${x + 120 - i * 20} 1000 H${x - 60 - i * 10}Z" fill="#fff" opacity=".08"/>`).join('')}</g>` +
      `<path d="${hillsPath(820, 90, 5, 5)}" fill="#1b5f9a" opacity=".7"/>` +
      `<path d="M0 880 Q250 850 500 880 T1000 875 V1000 H0Z" fill="#f4d48e"/>` +
      `<path d="M0 930 Q300 905 600 930 T1000 925 V1000 H0Z" fill="#e8c178"/>` +
      Array.from({ length: 12 }, (_, i) => `<path d="M${i * 90 + 20} ${900 + (i % 3) * 25} q20 -8 40 0" stroke="#d6ad62" stroke-width="3" fill="none"/>`).join(''),
    space: () => sky('space') +
      `<ellipse cx="250" cy="300" rx="340" ry="200" fill="url(#sc-neb1)"/><ellipse cx="780" cy="560" rx="300" ry="180" fill="url(#sc-neb2)"/>` +
      `<path d="M0 880 Q250 850 500 870 T1000 860 V1000 H0Z" fill="#6c6894"/>` +
      dots(14, 8, 900, 990, ['#56527e'], [14, 34], .35),
    dino: () => sky('dino') +
      `<path d="${hillsPath(660, 220, 6, 4)}" fill="#c98a6c" opacity=".55"/><path d="${hillsPath(720, 90, 12, 3)}" fill="#a3d36a"/>` +
      `<path d="M0 770 Q500 740 1000 775 V1000 H0Z" fill="#86c24f"/>` +
      `<ellipse cx="300" cy="900" rx="160" ry="40" fill="#c99a5a" opacity=".55"/><ellipse cx="780" cy="950" rx="200" ry="40" fill="#c99a5a" opacity=".45"/>` +
      grassTufts(50, 4, 780, 990, '#6aa63c'),
    jungle: () => sky('jungle') +
      `<path d="${hillsPath(520, 260, 31, 6)}" fill="#5cbf6a" opacity=".55"/>` +
      `<path d="${hillsPath(650, 200, 33, 5)}" fill="#3fa356"/>` +
      `<path d="${hillsPath(760, 120, 35, 6)}" fill="#2f8a45"/>` +
      `<path d="M0 820 Q500 790 1000 820 V1000 H0Z" fill="#6b8f3a"/><path d="M0 900 Q500 880 1000 905 V1000 H0Z" fill="#5a7a30"/>` +
      grassTufts(60, 9, 820, 990, '#3f7a2a'),
    snow: () => sky('snow') +
      `<g class="sc-aurora"><path d="M-100 220 Q150 120 400 230 T900 200 T1300 220 V320 Q1050 260 800 320 T300 330 T-100 320Z" fill="#7dffc4" opacity=".35"/>` +
      `<path d="M-100 160 Q200 80 450 170 T1000 140 T1300 160 V220 Q1000 170 750 230 T200 230 T-100 220Z" fill="#c69bff" opacity=".28"/></g>` +
      `<path d="${hillsPath(660, 200, 14, 4)}" fill="#e3f1ff"/><path d="${hillsPath(730, 100, 15, 3)}" fill="#f5fbff"/>` +
      `<path d="M0 780 Q500 750 1000 780 V1000 H0Z" fill="#ffffff"/>` +
      `<path d="M0 900 Q300 870 650 905 T1000 895 V1000 H0Z" fill="#e6f2ff"/>` +
      dots(25, 3, 790, 980, ['#d6e9ff'], [10, 30], .25),
    candy: () => sky('candy') +
      `<path d="${hillsPath(640, 160, 19, 4)}" fill="#a8f0d4"/>` +
      Array.from({ length: 14 }, (_, i) => `<path d="M${i * 75} 600 q37 20 75 0 v${18 + (i % 3) * 14} a10 10 0 0 1 -20 0 v-10 q-27 10 -55 -6Z" fill="#fff" opacity=".55"/>`).join('') +
      `<path d="M0 760 Q250 730 500 760 T1000 755 V1000 H0Z" fill="#ffaed2"/>` +
      `<path d="M0 760 Q250 730 500 760 T1000 755 V780 Q900 800 800 785 T600 790 T400 785 T200 795 T0 785Z" fill="#fff" opacity=".7"/>` +
      dots(90, 17, 800, 990, ['#ff4d6d', '#ffd60a', '#4cd964', '#2f9bff', '#9b5cff', '#ffffff'], [3, 6], .35),
    farm: () => sky('farm') +
      `<path d="${hillsPath(640, 140, 24, 3)}" fill="#c8e68a"/>` +
      `<path d="${hillsPath(690, 110, 26, 4)}" fill="#f2d16b"/>` +
      Array.from({ length: 9 }, (_, i) => `<path d="M${i * 120 - 40} 760 Q${i * 120 + 20} 700 ${i * 120 + 80} 690" stroke="#d9b54a" stroke-width="4" fill="none" opacity=".7"/>`).join('') +
      `<path d="M0 760 Q500 730 1000 765 V1000 H0Z" fill="#7ccc58"/>` +
      `<path d="M380 1000 Q430 880 520 765 L560 765 Q520 880 560 1000Z" fill="#d9a86c"/>` +
      grassTufts(50, 13, 770, 990, '#5fae3e'),
    camp: () => sky('camp') +
      `<path d="${hillsPath(650, 220, 41, 4)}" fill="#2b2a5e"/>` +
      Array.from({ length: 26 }, (_, i) => { const x = i * 40 + (i % 3) * 7, h = 70 + ((i * 37) % 60); return `<path d="M${x - 24} 790 L${x} ${790 - h} L${x + 24} 790Z" fill="#1a2240"/>`; }).join('') +
      `<path d="M0 800 Q500 780 1000 805 V1000 H0Z" fill="#20402f"/>` +
      `<ellipse cx="560" cy="930" rx="260" ry="70" fill="#ffb45a" opacity=".12"/>` +
      grassTufts(40, 5, 810, 990, '#183323'),
    beach: () => sky('beach') +
      `<path d="M0 600 H1000 V760 H0Z" fill="#2fa8e8"/><path d="M0 600 H1000 V640 H0Z" fill="#6fd0ff"/>` +
      `<g class="sc-waves">${Array.from({ length: 16 }, (_, i) => `<path d="M${i * 80 - 80} 700 q20 -12 40 0 t40 0" stroke="#fff" stroke-width="4" fill="none" opacity=".6"/>`).join('')}</g>` +
      `<path d="M0 760 Q250 740 500 760 T1000 755 V1000 H0Z" fill="#ffe0a3"/>` +
      `<path d="M0 760 Q250 740 500 760 T1000 755 V775 Q750 790 500 775 T0 780Z" fill="#fff" opacity=".7"/>` +
      dots(40, 2, 800, 990, ['#f2c27a', '#fff2cf'], [3, 7]),
    room: () => sky('room') +
      Array.from({ length: 10 }, (_, i) => `<rect x="${i * 100 + 40}" y="0" width="20" height="720" fill="#fff" opacity=".25"/>`).join('') +
      `<rect y="700" width="1000" height="300" fill="#d99b62"/>` +
      Array.from({ length: 6 }, (_, i) => `<rect y="${720 + i * 48}" width="1000" height="4" fill="#b97d48" opacity=".6"/>`).join('') +
      `<rect y="690" width="1000" height="20" fill="#fff"/>` +
      `<ellipse cx="500" cy="880" rx="330" ry="80" fill="#8fc7ff" opacity=".8"/><ellipse cx="500" cy="880" rx="280" ry="60" fill="#b8dcff"/>`,
    stage: () => sky('stage') +
      `<ellipse cx="500" cy="600" rx="420" ry="420" fill="#ffd27a" opacity=".1"/>` +
      `<path d="M0 0 H1000 V90 Q750 140 500 90 Q250 140 0 90Z" fill="#c8213e"/>` +
      `<path d="M0 0 H170 Q150 400 190 760 H0Z" fill="#c8213e"/><path d="M1000 0 H830 Q850 400 810 760 H1000Z" fill="#c8213e"/>` +
      Array.from({ length: 4 }, (_, i) => `<path d="M${40 + i * 35} 0 Q${30 + i * 35} 400 ${50 + i * 35} 760" stroke="#9a1530" stroke-width="5" fill="none"/><path d="M${960 - i * 35} 0 Q${970 - i * 35} 400 ${950 - i * 35} 760" stroke="#9a1530" stroke-width="5" fill="none"/>`).join('') +
      `<path d="M0 760 H1000 V1000 H0Z" fill="#a8632c"/>` + Array.from({ length: 12 }, (_, i) => `<rect x="${i * 90}" y="760" width="4" height="240" fill="#874b1d"/>`).join('') +
      `<rect y="755" width="1000" height="14" fill="#ffcf6b"/>`,
    savanna: () => sky('savanna') +
      `<circle cx="760" cy="560" r="130" fill="#ff9a4a" opacity=".55"/>` +
      `<path d="${hillsPath(680, 90, 51, 3)}" fill="#e2b25a"/>` +
      `<path d="M0 740 Q500 710 1000 745 V1000 H0Z" fill="#d6a24a"/>` +
      `<path d="M0 860 Q500 830 1000 865 V1000 H0Z" fill="#c8923c"/>` +
      grassTufts(80, 21, 745, 990, '#b0802f'),
    garden: () => sky('garden') +
      `<path d="${hillsPath(660, 110, 61, 4)}" fill="#9fdc84"/>` +
      `<path d="M0 740 Q500 710 1000 745 V1000 H0Z" fill="#6cc552"/>` +
      `<path d="M0 900 Q500 880 1000 905 V1000 H0Z" fill="#5ab544"/>` +
      grassTufts(60, 17, 745, 990, '#4c9f3a') + dots(60, 12, 760, 990, ['#ffffff', '#ffe066', '#ff8ad8', '#c49bff'], [3, 6]),
  };

  // ---------- props ----------
  const A = {};

  A.sun = () => {
    let rays = '';
    for (let i = 0; i < 12; i++) rays += `<rect x="93" y="4" width="14" height="${i % 2 ? 26 : 36}" rx="7" fill="#ffcf3a" transform="rotate(${i * 30} 100 100)"/>`;
    return [200, 200, `<g class="sc-spin-slow sc-oc">${rays}</g><circle cx="100" cy="100" r="58" fill="url(#sc-sun)" ${ol()}/>${face(100, 104, 1.1)}`];
  };
  A.moon = () => [160, 160,
    `<circle cx="80" cy="80" r="70" fill="#fff6cf" ${ol()}/><circle cx="45" cy="55" r="12" fill="#f2e2a2"/><circle cx="112" cy="110" r="16" fill="#f2e2a2"/><circle cx="110" cy="45" r="8" fill="#f2e2a2"/>` +
    face(80, 86, 1, { sleepy: true })];
  A.cloud = (fill = '#ffffff', shade = '#dcecff', cute = true) => [240, 140,
    blob([[62, 88, 38], [108, 64, 48], [160, 72, 42], [198, 96, 30], [38, 104, 22], [120, 104, 34]], fill) +
    `<ellipse cx="120" cy="120" rx="82" ry="9" fill="${shade}"/>` + (cute ? face(118, 92, .55) : '')];
  A.sparkle = (c = '#fff7a8') => [40, 40, `<path d="M20 0 Q23 17 40 20 Q23 23 20 40 Q17 23 0 20 Q17 17 20 0Z" fill="${c}"/>`];
  A.tree = (leaf = '#5cc04a', light = '#86da6c', fruit = '#ff4d4d') => [220, 300,
    `<path d="M96 300 L100 200 Q84 170 66 156 L76 148 Q96 166 106 178 Q112 152 132 134 L142 142 Q122 166 122 200 L126 300Z" fill="#8b5a2b" ${ol()}/>` +
    `<g class="sc-sway-soft" style="transform-origin:110px 240px">` +
    blob([[110, 92, 66], [56, 128, 46], [164, 128, 48], [80, 66, 44], [146, 66, 44], [110, 146, 48]], leaf) +
    `<circle cx="84" cy="62" r="20" fill="${light}"/><circle cx="56" cy="114" r="14" fill="${light}"/><circle cx="140" cy="54" r="14" fill="${light}"/>` +
    (fruit ? [[74, 112], [150, 96], [118, 144], [170, 146], [100, 70]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="${fruit}" ${ol(2)}/><circle cx="${x - 3}" cy="${y - 3}" r="3" fill="#fff" opacity=".7"/>`).join('') : '') +
    `</g>`];
  A.blossom = () => A.tree('#ffb3d9', '#ffd6ec', '#ffffff');
  A.apple = () => [40, 44, `<path d="M20 10 q-2 -8 4 -10" stroke="#6b4423" stroke-width="3" fill="none"/><ellipse cx="27" cy="6" rx="6" ry="3" fill="#4fb84a"/><circle cx="20" cy="26" r="16" fill="#ff4d4d" ${ol(2)}/><circle cx="14" cy="20" r="4" fill="#fff" opacity=".7"/>`];
  A.flower = (petal = '#ff6fb5', center = '#ffd23f') => {
    let p = '';
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p += `<circle cx="${40 + Math.cos(a) * 17}" cy="${46 + Math.sin(a) * 17}" r="14" fill="${petal}" ${ol(2)}/>`; }
    return [80, 160, `<g class="sc-sway" style="transform-origin:40px 160px"><path d="M40 160 Q35 110 40 60" stroke="#3fa34d" stroke-width="6" fill="none" stroke-linecap="round"/>` +
      `<ellipse cx="26" cy="118" rx="14" ry="6" fill="#4fb84a" transform="rotate(-30 26 118)"/><ellipse cx="54" cy="100" rx="14" ry="6" fill="#4fb84a" transform="rotate(30 54 100)"/>` +
      `<g class="sc-head">${p}<circle cx="40" cy="46" r="12" fill="${center}" ${ol(2)}/><circle cx="36" cy="44" r="2" fill="#3a2a2a"/><circle cx="44" cy="44" r="2" fill="#3a2a2a"/><path d="M36 50 q4 4 8 0" stroke="#3a2a2a" stroke-width="2" fill="none"/></g></g>`];
  };
  A.sunflower = () => {
    let p = '';
    for (let i = 0; i < 14; i++) p += `<ellipse cx="60" cy="24" rx="9" ry="20" fill="#ffcc1a" ${ol(1.5)} transform="rotate(${i * 360 / 14} 60 50)"/>`;
    return [120, 260, `<g class="sc-sway" style="transform-origin:60px 260px"><path d="M60 260 Q54 160 60 70" stroke="#3fa34d" stroke-width="8" fill="none"/>` +
      `<ellipse cx="38" cy="170" rx="22" ry="9" fill="#4fb84a" transform="rotate(-30 38 170)"/><ellipse cx="82" cy="140" rx="22" ry="9" fill="#4fb84a" transform="rotate(30 82 140)"/>` +
      `<g class="sc-head">${p}<circle cx="60" cy="50" r="20" fill="#8a5a2b" ${ol(2)}/>${face(60, 50, .5, { cheeks: '#ff8a5a' })}</g></g>`];
  };
  A.mushroom = () => [100, 100,
    `<path d="M38 100 Q34 70 40 55 H60 Q66 70 62 100Z" fill="#fff3dc" ${ol()}/><path d="M6 60 Q10 6 50 6 Q90 6 94 60 Q50 72 6 60Z" fill="#ff4d4d" ${ol()}/>` +
    `<circle cx="30" cy="36" r="8" fill="#fff"/><circle cx="58" cy="24" r="7" fill="#fff"/><circle cx="74" cy="44" r="6" fill="#fff"/><circle cx="46" cy="50" r="4" fill="#fff"/>`];
  A.bush = (c = '#4fb84a', berry = '#ff4d6d') => [200, 110,
    blob([[40, 76, 32], [82, 56, 42], [128, 54, 40], [164, 76, 32], [100, 84, 30]], c) +
    `<circle cx="72" cy="44" r="14" fill="#fff" opacity=".18"/>` +
    (berry ? [[60, 70], [104, 50], [140, 72], [92, 86], [160, 60]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="${berry}"/>`).join('') : '')];
  A.fence = () => {
    let s = `<rect x="0" y="50" width="300" height="14" rx="4" fill="#e8c08a" ${ol(2)}/><rect x="0" y="86" width="300" height="14" rx="4" fill="#e8c08a" ${ol(2)}/>`;
    for (let i = 0; i < 6; i++) s += `<path d="M${14 + i * 54} 120 V30 L${30 + i * 54} 12 L${46 + i * 54} 30 V120Z" fill="#f6d9a8" ${ol(2)}/>`;
    return [300, 122, s];
  };
  A.butterfly = (c1 = '#ff8ad8', c2 = '#8ad4ff') => [100, 80,
    `<g class="sc-flap" style="transform-origin:50px 40px"><ellipse cx="30" cy="28" rx="22" ry="18" fill="${c1}" ${ol(2)}/><ellipse cx="70" cy="28" rx="22" ry="18" fill="${c1}" ${ol(2)}/>` +
    `<ellipse cx="34" cy="56" rx="15" ry="13" fill="${c2}" ${ol(2)}/><ellipse cx="66" cy="56" rx="15" ry="13" fill="${c2}" ${ol(2)}/>` +
    `<circle cx="28" cy="26" r="6" fill="#fff" opacity=".7"/><circle cx="72" cy="26" r="6" fill="#fff" opacity=".7"/></g>` +
    `<ellipse cx="50" cy="42" rx="6" ry="22" fill="#4a3360"/><path d="M47 22 q-6 -14 -12 -16 M53 22 q6 -14 12 -16" stroke="#4a3360" stroke-width="2.5" fill="none" stroke-linecap="round"/>`];
  A.rainbow = () => {
    const cols = ['#ff5a5a', '#ff9f1c', '#ffd60a', '#4cd964', '#2f9bff', '#9b5cff'];
    return [320, 180, cols.map((c, i) => `<path d="M${30 + i * 14} 170 A${130 - i * 14} ${130 - i * 14} 0 0 1 ${290 - i * 14} 170" stroke="${c}" stroke-width="15" fill="none"/>`).join('') +
      blob([[30, 160, 22], [56, 166, 16], [10, 170, 12]], '#fff') + blob([[290, 160, 22], [264, 166, 16], [310, 170, 12]], '#fff')];
  };
  A.castle = () => {
    const wall = '#f3e2ff', roof = '#ff86c6', crown = (x, y, n) => Array.from({ length: n }, (_, i) => `<rect x="${x + i * 22}" y="${y}" width="14" height="16" fill="${wall}" ${ol(2)}/>`).join('');
    const flag = (x, y, c) => `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - 34}" stroke="#7a5aa0" stroke-width="3"/><path class="sc-flag" style="transform-origin:${x}px ${y - 30}px" d="M${x} ${y - 34} q14 4 28 -2 q-4 8 0 14 q-14 6 -28 2Z" fill="${c}"/>`;
    const win = (x, y) => `<path d="M${x - 10} ${y + 22} V${y} A10 10 0 0 1 ${x + 10} ${y} V${y + 22}Z" fill="#ffe27a" class="sc-glow-win" ${ol(2)}/>`;
    return [400, 420,
      flag(80, 70, '#ffd23f') + flag(320, 70, '#7ad6ff') + flag(200, 30, '#ff5a8a') +
      `<rect x="80" y="200" width="240" height="220" fill="${wall}" ${ol()}/>` + crown(84, 186, 11) +
      `<rect x="40" y="140" width="80" height="280" fill="${wall}" ${ol()}/><rect x="280" y="140" width="80" height="280" fill="${wall}" ${ol()}/>` +
      `<rect x="165" y="100" width="70" height="120" fill="${wall}" ${ol()}/>` +
      `<path d="M30 145 L80 64 L130 145Z" fill="${roof}" ${ol()}/><path d="M270 145 L320 64 L370 145Z" fill="${roof}" ${ol()}/><path d="M155 105 L200 24 L245 105Z" fill="${roof}" ${ol()}/>` +
      `<path d="M30 145 L80 64 L62 145Z" fill="#fff" opacity=".25"/>` +
      win(80, 190) + win(80, 280) + win(320, 190) + win(320, 280) + win(200, 140) + win(140, 250) + win(260, 250) +
      `<path d="M165 420 V350 A35 35 0 0 1 235 350 V420Z" fill="#9a6bd0" ${ol()}/><path d="M200 318 V420 M182 330 V420 M218 330 V420" stroke="#7a4ab0" stroke-width="3"/>` +
      `<path d="M200 300 c-8 -10 -20 -2 -12 8 l12 10 l12 -10 c8 -10 -4 -18 -12 -8Z" fill="#ff5a8a"/>` +
      [[60, 380], [330, 360], [120, 330], [270, 400], [240, 300]].map(([x, y]) => `<rect x="${x}" y="${y}" width="22" height="10" rx="4" fill="#e2c8ff"/>`).join('')];
  };

  // ----- ocean -----
  A.seaweed = (c = '#3cbf6a') => [60, 240,
    `<g class="sc-sway" style="transform-origin:30px 240px"><path d="M30 240 C8 200 52 170 30 130 S8 60 30 12" stroke="${c}" stroke-width="15" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="44" cy="180" rx="13" ry="6" fill="${c}" transform="rotate(-30 44 180)"/><ellipse cx="16" cy="110" rx="13" ry="6" fill="${c}" transform="rotate(30 16 110)"/><ellipse cx="42" cy="56" rx="12" ry="5" fill="${c}" transform="rotate(-30 42 56)"/></g>`];
  A.coral = (c = '#ff7a8a') => [160, 160,
    `<g stroke="${OL}" stroke-opacity=".5" stroke-width="22" stroke-linecap="round" fill="none"><path d="M80 158 V90 M80 112 Q50 92 45 55 M80 100 Q110 80 115 40 M47 78 Q26 70 22 45 M112 70 Q136 60 140 34"/></g>` +
    `<g stroke="${c}" stroke-width="16" stroke-linecap="round" fill="none"><path d="M80 158 V90 M80 112 Q50 92 45 55 M80 100 Q110 80 115 40 M47 78 Q26 70 22 45 M112 70 Q136 60 140 34"/></g>` +
    [[45, 55], [115, 40], [22, 45], [140, 34], [80, 90]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#fff" opacity=".7"/>`).join('')];
  A.chest = () => [160, 140,
    `<ellipse cx="80" cy="62" rx="60" ry="14" fill="#ffd23f"/><circle cx="60" cy="56" r="8" fill="#ffe680"/><circle cx="96" cy="54" r="8" fill="#ffe680"/><circle cx="80" cy="50" r="7" fill="#fff3b0"/>` +
    `<rect x="15" y="60" width="130" height="72" rx="8" fill="#a0622d" ${ol()}/><rect x="28" y="60" width="12" height="72" fill="#ffcf3a"/><rect x="120" y="60" width="12" height="72" fill="#ffcf3a"/>` +
    `<rect x="70" y="70" width="20" height="24" rx="4" fill="#ffcf3a" ${ol(2)}/><circle cx="80" cy="80" r="3" fill="#6b3e16"/>` +
    `<g class="sc-lid" style="transform-origin:15px 62px"><path d="M15 64 V44 Q15 14 80 14 Q145 14 145 44 V64Z" fill="#b8743a" ${ol()}/><rect x="28" y="18" width="12" height="46" fill="#ffcf3a"/><rect x="120" y="18" width="12" height="46" fill="#ffcf3a"/></g>`];
  A.starfish = (c = '#ff9a3c') => {
    const pts = Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 18 : 42; return `${(50 + Math.cos(a) * r).toFixed(1)},${(52 + Math.sin(a) * r).toFixed(1)}`; }).join(' ');
    return [100, 100, `<polygon points="${pts}" fill="${c}" stroke="${c}" stroke-width="10" stroke-linejoin="round"/>` + face(50, 54, .55)];
  };
  A.shell = () => [100, 80,
    `<path d="M50 76 L10 40 Q20 4 50 4 Q80 4 90 40Z" fill="#ffd1dc" ${ol()}/>` + [20, 35, 50, 65, 80].map(x => `<path d="M50 74 L${x} ${x === 50 ? 8 : 18}" stroke="#ff9ab6" stroke-width="3"/>`).join('') + `<rect x="38" y="70" width="24" height="10" rx="4" fill="#ffb3c6"/>`];
  A.jellyfish = (c = '#ff9ad5') => [100, 160,
    `<g class="sc-wiggle-x" style="transform-origin:50px 60px">${[22, 40, 60, 78].map(x => `<path d="M${x} 58 q-8 18 0 36 t0 36" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>`).join('')}</g>` +
    `<path d="M8 60 Q8 6 50 6 Q92 6 92 60 Q81 68 71 60 Q61 68 50 60 Q39 68 29 60 Q19 68 8 60Z" fill="${c}" ${ol()}/><ellipse cx="34" cy="24" rx="12" ry="7" fill="#fff" opacity=".45"/>` + face(50, 40, .6)];
  A.fish = (c = '#ffb02e', stripe = '#fff') => [130, 76,
    `<g class="sc-tailwag" style="transform-origin:34px 38px"><path d="M36 38 L6 12 Q14 38 6 64Z" fill="${c}" ${ol()}/></g><ellipse cx="74" cy="38" rx="44" ry="28" fill="${c}" ${ol()}/>` +
    `<path d="M62 12 Q66 38 62 64" stroke="${stripe}" stroke-width="8" fill="none" opacity=".85"/><path d="M84 12 Q88 38 84 64" stroke="${stripe}" stroke-width="6" fill="none" opacity=".6"/>` +
    `<circle cx="100" cy="32" r="8" fill="#fff" ${ol(2)}/><circle cx="102" cy="32" r="4" fill="#222"/><path d="M108 48 q5 3 8 -1" stroke="#3a2a2a" stroke-width="2.5" fill="none" stroke-linecap="round"/>`];
  A.rock = (c = '#5c7bb0') => [160, 100, blob([[50, 70, 40], [100, 56, 46], [134, 76, 26], [80, 84, 26]], c) + `<ellipse cx="80" cy="40" rx="18" ry="8" fill="#fff" opacity=".18"/>`];

  // ----- space -----
  A.planet = () => [260, 170,
    `<g transform="rotate(-12 130 85)"><path d="M15 85 A115 26 0 0 1 245 85" stroke="#ffd58a" stroke-width="12" fill="none"/></g>` +
    `<circle cx="130" cy="85" r="56" fill="url(#sc-planet)" ${ol()}/><path d="M80 66 Q130 54 182 70 M76 96 Q130 84 184 102" stroke="#fff" stroke-width="8" opacity=".25" fill="none"/>` +
    `<g transform="rotate(-12 130 85)"><path d="M15 85 A115 26 0 0 0 245 85" stroke="#ffd58a" stroke-width="12" fill="none"/></g>` + face(130, 82, .7)];
  A.earth = () => {
    const land = x => `<path d="M${x + 20} 40 q20 -12 36 0 q10 16 -4 28 q-14 8 -10 26 q-10 10 -20 -4 q-10 -20 -2 -50Z M${x + 90} 70 q22 -8 30 10 q4 22 -14 30 q-20 2 -22 -16Z M${x + 60} 120 q16 -6 26 4 q-6 14 -24 8Z" fill="#5fd06a"/>`;
    return [160, 160, `<circle cx="80" cy="80" r="70" fill="#3c9bff" ${ol()}/><g clip-path="url(#sc-earth-clip)"><g class="sc-earth">${land(0)}${land(160)}</g></g>` +
      `<circle cx="80" cy="80" r="66" fill="none" stroke="#aee0ff" stroke-width="6" opacity=".6"/><ellipse cx="54" cy="46" rx="16" ry="9" fill="#fff" opacity=".35"/>`];
  };
  A.rocket = () => [120, 250,
    `<g class="sc-flame" style="transform-origin:60px 196px"><path d="M40 196 Q60 260 80 196Z" fill="#ff7a2a"/><path d="M48 196 Q60 236 72 196Z" fill="#ffe14d"/></g>` +
    `<path d="M30 150 L6 196 L34 190Z M90 150 L114 196 L86 190Z" fill="#ff4d6d" ${ol()}/>` +
    `<path d="M60 10 Q102 60 94 196 H26 Q18 60 60 10Z" fill="#f4f6ff" ${ol()}/><path d="M60 10 Q83 34 90 62 H30 Q37 34 60 10Z" fill="#ff4d6d"/>` +
    `<circle cx="60" cy="104" r="20" fill="#6fd0ff" stroke="#9aa6c8" stroke-width="6"/><circle cx="54" cy="98" r="6" fill="#fff" opacity=".7"/>` +
    `<rect x="52" y="150" width="16" height="46" fill="#ff4d6d" ${ol(2)}/>`];
  A.ufo = () => [200, 200,
    `<path class="sc-beam" d="M70 84 L30 200 H170 L130 84Z" fill="url(#sc-beam)"/>` +
    `<path d="M60 60 A40 34 0 0 1 140 60Z" fill="#a8f0ff" opacity=".85" ${ol()}/>` +
    `<circle cx="100" cy="46" r="13" fill="#7ee08a"/><circle cx="95" cy="44" r="3.5" fill="#222"/><circle cx="105" cy="44" r="3.5" fill="#222"/><path d="M96 51 q4 3 8 0" stroke="#222" stroke-width="2" fill="none"/>` +
    `<line x1="94" y1="34" x2="90" y2="24" stroke="#7ee08a" stroke-width="3"/><circle cx="90" cy="23" r="3" fill="#ffe14d"/>` +
    `<ellipse cx="100" cy="68" rx="92" ry="22" fill="#b8c2dc" ${ol()}/><ellipse cx="100" cy="62" rx="70" ry="10" fill="#d9e0f2"/>` +
    [30, 65, 100, 135, 170].map((x, i) => `<circle class="sc-blinky" style="animation-delay:${i * .2}s" cx="${x}" cy="${i % 4 ? 76 : 70}" r="6" fill="${['#ffe14d', '#ff6fb5', '#7ad6ff'][i % 3]}"/>`).join('')];
  A.shootingStar = () => [220, 60, `<path d="M0 30 L190 22 L190 38Z" fill="url(#sc-tail)"/><path d="M196 10 l5 13 14 1 -11 9 4 14 -12 -8 -12 8 4 -14 -11 -9 14 -1Z" fill="#fff6a8"/>`];

  // ----- dino -----
  A.volcano = () => [360, 300,
    `<g>${[0, 1, 2].map(i => `<circle class="sc-smoke" style="animation-delay:${i * 1.3}s" cx="180" cy="60" r="${22 + i * 4}" fill="#b9a6a6"/>`).join('')}</g>` +
    `<path d="M0 300 L120 90 Q140 74 160 82 Q180 70 200 82 Q222 74 240 90 L360 300Z" fill="#8a5a44" ${ol()}/>` +
    `<path d="M200 82 Q222 74 240 90 L360 300 H250 Q230 200 200 82Z" fill="#6f4434"/>` +
    `<path d="M128 92 Q180 70 232 92 Q222 120 212 112 Q206 150 196 118 Q186 136 178 112 Q164 140 158 108 Q146 118 128 92Z" fill="#ff6a2a"/><path d="M146 92 Q180 80 214 92 Q200 100 180 98Z" fill="#ffd23f"/>`];
  A.palm = () => {
    let trunk = '';
    for (let i = 0; i < 9; i++) { const t = i / 8, x = 110 + Math.sin(t * 2) * 14, y = 330 - t * 230; trunk += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${16 - t * 4}" ry="16" fill="${i % 2 ? '#b07a43' : '#9a6a3a'}" ${ol(2)}/>`; }
    const leaf = (rot, c) => `<path d="M124 96 Q170 60 214 92 Q172 84 124 104Z" fill="${c}" ${ol(2)} transform="rotate(${rot} 124 100)"/>`;
    return [230, 340, trunk + `<g class="sc-sway-soft" style="transform-origin:124px 100px">${leaf(0, '#3fae5a')}${leaf(55, '#4fbf62')}${leaf(150, '#3fae5a')}${leaf(200, '#4fbf62')}${leaf(-40, '#5ccf6e')}` +
      `<circle cx="116" cy="112" r="10" fill="#7a4a25"/><circle cx="132" cy="114" r="10" fill="#6a3f20"/></g>`];
  };
  A.longneck = (c = '#7ed37a', spot = '#5cb85a') => [330, 250,
    `<path d="M240 170 Q300 160 326 190 Q290 196 240 196Z" fill="${c}" ${ol()}/>` +
    `<rect x="120" y="190" width="26" height="54" rx="10" fill="${c}" ${ol()}/><rect x="216" y="190" width="26" height="54" rx="10" fill="${c}" ${ol()}/>` +
    `<ellipse cx="180" cy="168" rx="92" ry="54" fill="${c}" ${ol()}/><ellipse cx="180" cy="190" rx="66" ry="24" fill="#c8f2b8"/>` +
    `<circle cx="160" cy="132" r="10" fill="${spot}"/><circle cx="200" cy="124" r="13" fill="${spot}"/><circle cx="236" cy="142" r="9" fill="${spot}"/>` +
    `<g class="sc-nod" style="transform-origin:120px 150px"><path d="M122 148 Q74 90 84 42" stroke="${OL}" stroke-opacity=".55" stroke-width="40" fill="none" stroke-linecap="round"/><path d="M122 148 Q74 90 84 42" stroke="${c}" stroke-width="34" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="74" cy="36" rx="34" ry="22" fill="${c}" ${ol()}/><circle cx="70" cy="28" r="6" fill="#222"/><circle cx="72" cy="26" r="2" fill="#fff"/><path d="M48 44 q10 6 22 2" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="62" cy="40" rx="6" ry="4" fill="#ff8fa8" opacity=".6"/></g>`];
  A.egg = (spot = '#a8d88a') => [80, 100,
    `<g class="sc-baby" style="transform:translateY(26px)"><circle cx="40" cy="52" r="22" fill="#8fdc7a" ${ol(2)}/><circle cx="33" cy="48" r="4" fill="#222"/><circle cx="47" cy="48" r="4" fill="#222"/><path d="M34 58 q6 5 12 0" stroke="#222" stroke-width="2.5" fill="none"/></g>` +
    `<path d="M5 55 L15 48 L25 56 L35 47 L45 56 L55 47 L65 56 L75 50 C78 62 76 80 72 86 C64 96 52 98 40 98 C28 98 16 96 8 86 C4 80 3 65 5 55Z" fill="#fff4dc" ${ol()}/>` +
    `<g class="sc-cap" style="transform-origin:40px 50px"><path d="M5 55 C6 25 22 5 40 5 C58 5 74 25 75 50 L65 56 L55 47 L45 56 L35 47 L25 56 L15 48Z" fill="#fff4dc" ${ol()}/><circle cx="28" cy="26" r="6" fill="${spot}"/><circle cx="52" cy="18" r="4" fill="${spot}"/></g>` +
    `<circle cx="56" cy="76" r="7" fill="${spot}"/><circle cx="24" cy="80" r="5" fill="${spot}"/>`];
  A.ptero = () => [180, 90,
    `<g class="sc-flap-y" style="transform-origin:90px 46px"><path d="M84 44 L10 20 Q40 50 84 56Z M96 44 L170 20 Q140 50 96 56Z" fill="#b48ad8" ${ol()}/></g>` +
    `<ellipse cx="90" cy="50" rx="16" ry="12" fill="#9a6fc0" ${ol()}/><path d="M100 42 L130 36 L104 52Z" fill="#ffcf3a" ${ol(2)}/><path d="M92 38 L76 26 L94 42Z" fill="#9a6fc0"/><circle cx="98" cy="44" r="3" fill="#222"/>`];

  // ----- jungle -----
  A.vine = () => {
    let leaves = '';
    for (let i = 0; i < 8; i++) { const y = 40 + i * 48, s = i % 2 ? 1 : -1; leaves += `<ellipse cx="${30 + s * 14}" cy="${y}" rx="15" ry="7" fill="${i % 3 ? '#4fb84a' : '#62c85a'}" transform="rotate(${s * 30} ${30 + s * 14} ${y})"/>`; }
    return [60, 420, `<g class="sc-sway" style="transform-origin:30px 0px"><path d="M30 0 Q14 100 30 200 T30 410" stroke="#3f8a3a" stroke-width="7" fill="none"/>${leaves}</g>`];
  };
  A.monkey = () => [160, 300,
    `<g class="sc-swing" style="transform-origin:80px 0px"><path d="M80 0 Q70 60 80 118" stroke="#3f8a3a" stroke-width="7" fill="none"/><ellipse cx="66" cy="40" rx="12" ry="6" fill="#4fb84a" transform="rotate(-30 66 40)"/>` +
    `<path d="M80 120 Q90 150 92 176" stroke="#8a5a3a" stroke-width="13" fill="none" stroke-linecap="round"/><circle cx="80" cy="120" r="9" fill="#e8b98a"/>` +
    `<path d="M104 240 Q150 250 140 210 Q132 190 146 180" stroke="#8a5a3a" stroke-width="8" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="86" cy="216" rx="32" ry="38" fill="#8a5a3a" ${ol()}/><ellipse cx="86" cy="222" rx="20" ry="26" fill="#e8b98a"/>` +
    `<path d="M66 240 Q50 270 62 286 M104 244 Q118 270 108 286" stroke="#8a5a3a" stroke-width="12" fill="none" stroke-linecap="round"/>` +
    `<path d="M60 200 Q36 220 46 240" stroke="#8a5a3a" stroke-width="12" fill="none" stroke-linecap="round"/>` +
    `<circle cx="60" cy="160" r="12" fill="#8a5a3a" ${ol(2)}/><circle cx="116" cy="160" r="12" fill="#8a5a3a" ${ol(2)}/><circle cx="60" cy="160" r="6" fill="#e8b98a"/><circle cx="116" cy="160" r="6" fill="#e8b98a"/>` +
    `<circle cx="88" cy="162" r="30" fill="#8a5a3a" ${ol()}/><ellipse cx="88" cy="170" rx="22" ry="18" fill="#e8b98a"/>${face(88, 168, .5)}</g>`];
  A.waterfall = () => [180, 420,
    `<path d="M0 0 H60 Q50 200 60 380 H0Z" fill="#6b8f6a" ${ol()}/><path d="M180 0 H120 Q130 200 120 380 H180Z" fill="#5f8060" ${ol()}/>` +
    `<rect x="56" y="0" width="68" height="390" fill="url(#sc-water)"/>` +
    `<g class="sc-flow">${[70, 84, 98, 112].map(x => `<line x1="${x}" y1="-40" x2="${x}" y2="390" stroke="#fff" stroke-width="4" stroke-dasharray="30 40" opacity=".7"/>`).join('')}</g>` +
    `<ellipse cx="90" cy="396" rx="88" ry="20" fill="#7fd6ff" ${ol(2)}/>` +
    `<g class="sc-splash">${blob([[60, 390, 14], [90, 384, 18], [120, 390, 14]], '#fff', { op: .2 })}</g>`];
  A.bigleaf = (c = '#2f9a4a') => [200, 230,
    `<g class="sc-sway-soft" style="transform-origin:100px 230px"><path d="M100 230 Q96 160 100 120" stroke="#2a7a3a" stroke-width="8" fill="none"/>` +
    `<path d="M100 130 C30 140 0 80 20 40 C40 0 90 6 100 30 C110 6 160 0 180 40 C200 80 170 140 100 130Z" fill="${c}" ${ol()}/>` +
    `<path d="M100 128 V34 M100 90 L40 60 M100 70 L60 30 M100 90 L160 60 M100 70 L140 30" stroke="#5fd07a" stroke-width="4" fill="none" stroke-linecap="round"/></g>`];
  A.parrot = () => [150, 200,
    `<path d="M0 128 Q75 118 150 132" stroke="#7a4a25" stroke-width="12" fill="none" stroke-linecap="round"/><ellipse cx="128" cy="120" rx="12" ry="6" fill="#4fb84a" transform="rotate(-20 128 120)"/>` +
    `<path d="M66 120 L54 196 L70 190 L76 124Z" fill="#2f7bff" ${ol(2)}/><path d="M76 122 L80 192 L92 186 L86 120Z" fill="#ffd23f" ${ol(2)}/>` +
    `<ellipse cx="74" cy="92" rx="26" ry="40" fill="#ff3b3b" ${ol()}/>` +
    `<g class="sc-wing" style="transform-origin:80px 70px"><path d="M78 70 Q110 90 92 128 Q76 110 78 70Z" fill="#2f7bff" ${ol(2)}/><path d="M80 80 Q100 92 92 110" stroke="#ffd23f" stroke-width="6" fill="none"/></g>` +
    `<circle cx="72" cy="50" r="24" fill="#ff3b3b" ${ol()}/><ellipse cx="78" cy="48" rx="10" ry="12" fill="#fff"/><circle cx="80" cy="48" r="5" fill="#222"/>` +
    `<path d="M50 50 Q38 50 40 66 Q46 60 54 60Z" fill="#f2f2f2" ${ol(2)}/>` +
    `<path d="M66 126 l-4 8 M78 126 l2 8" stroke="#555" stroke-width="4" stroke-linecap="round"/>`];

  // ----- snow -----
  A.pine = (c = '#2f8a5a', snow = true) => {
    const tier = (y, w, h) => `<path d="M${80 - w} ${y} L80 ${y - h} L${80 + w} ${y} Q80 ${y + 10} ${80 - w} ${y}Z" fill="${c}" ${ol()}/>` +
      (snow ? `<path d="M${80 - w * .45} ${y - h * .55} L80 ${y - h} L${80 + w * .45} ${y - h * .55} q-10 8 -18 0 q-8 8 -16 0 q-8 8 -18 0Z" fill="#fff"/>` : '');
    return [160, 270, `<rect x="70" y="220" width="20" height="50" fill="#7a4a25" ${ol(2)}/>` + tier(230, 74, 90) + tier(170, 60, 86) + tier(112, 44, 90)];
  };
  A.snowman = () => [170, 260,
    `<path class="sc-wave" style="transform-origin:40px 120px" d="M40 120 L6 84 M18 96 L4 98" stroke="#7a4a25" stroke-width="6" stroke-linecap="round" fill="none"/>` +
    `<path d="M130 120 L164 96 M152 104 L164 112" stroke="#7a4a25" stroke-width="6" stroke-linecap="round" fill="none"/>` +
    `<circle cx="85" cy="206" r="52" fill="#fff" ${ol()}/><circle cx="85" cy="128" r="40" fill="#fff" ${ol()}/><circle cx="85" cy="66" r="31" fill="#fff" ${ol()}/>` +
    `<path d="M50 222 A52 52 0 0 0 130 240" stroke="#d4e6ff" stroke-width="10" fill="none"/>` +
    [118, 138, 196].map(y => `<circle cx="85" cy="${y}" r="5" fill="#333"/>`).join('') +
    `<path d="M58 92 Q85 104 112 92 L112 104 Q85 116 58 104Z" fill="#ff4d6d"/><path d="M98 104 L104 134 L114 130 L108 102Z" fill="#ff4d6d"/>` +
    `<circle cx="74" cy="60" r="4" fill="#333"/><circle cx="96" cy="60" r="4" fill="#333"/><path d="M85 68 L112 74 L85 76Z" fill="#ff8a1c"/>` +
    [70, 78, 86, 94].map((x, i) => `<circle cx="${x + 2}" cy="${82 + (i === 1 || i === 2 ? 3 : 0)}" r="2.2" fill="#333"/>`).join('') +
    `<g class="sc-hat" style="transform-origin:85px 40px"><rect x="58" y="34" width="54" height="8" rx="3" fill="#2a2a3a"/><rect x="66" y="2" width="38" height="34" rx="4" fill="#2a2a3a"/><rect x="66" y="24" width="38" height="7" fill="#ff4d6d"/></g>`];
  A.igloo = () => [240, 150,
    `<path d="M20 150 A100 100 0 0 1 220 150Z" fill="#f4faff" ${ol()}/>` +
    `<path d="M28 115 H212 M50 80 H190 M82 56 H158" stroke="#bcd8f2" stroke-width="3" fill="none"/>` +
    [[60, 115, 150], [110, 115, 150], [160, 115, 150], [80, 80, 115], [130, 80, 115], [170, 80, 115], [100, 56, 80], [140, 56, 80], [120, 115, 80]].slice(0, 8).map(([x, y1, y2]) => `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#bcd8f2" stroke-width="3"/>`).join('') +
    `<path d="M140 150 V118 A30 30 0 0 1 200 118 V150Z" fill="#fff" ${ol()}/><path d="M152 150 V122 A18 18 0 0 1 188 122 V150Z" fill="#4a6a96"/>` +
    `<g clip-path="url(#sc-igloo-clip)"><g class="sc-peek" style="transform:translateY(30px)"><circle cx="164" cy="136" r="4" fill="#fff"/><circle cx="176" cy="136" r="4" fill="#fff"/><circle cx="165" cy="137" r="2" fill="#222"/><circle cx="177" cy="137" r="2" fill="#222"/></g></g>`];
  A.penguin = () => [90, 120,
    `<g class="sc-waddle" style="transform-origin:45px 118px"><ellipse cx="45" cy="70" rx="32" ry="44" fill="#2b3550" ${ol()}/><ellipse cx="45" cy="78" rx="22" ry="34" fill="#fff"/>` +
    `<path d="M14 60 Q2 80 10 96 Q18 84 18 66Z M76 60 Q88 80 80 96 Q72 84 72 66Z" fill="#2b3550"/>` +
    `<circle cx="36" cy="40" r="4" fill="#222"/><circle cx="54" cy="40" r="4" fill="#222"/><circle cx="37" cy="39" r="1.4" fill="#fff"/><circle cx="55" cy="39" r="1.4" fill="#fff"/>` +
    `<path d="M38 48 L45 58 L52 48Z" fill="#ff9a1c"/><ellipse cx="30" cy="54" rx="5" ry="3" fill="#ff8fa8" opacity=".6"/><ellipse cx="60" cy="54" rx="5" ry="3" fill="#ff8fa8" opacity=".6"/>` +
    `<ellipse cx="34" cy="114" rx="10" ry="5" fill="#ff9a1c"/><ellipse cx="56" cy="114" rx="10" ry="5" fill="#ff9a1c"/></g>`];

  // ----- candy -----
  A.lollipop = (c1 = '#ff5aa8', c2 = '#fff') => [140, 320,
    `<rect x="64" y="110" width="12" height="210" rx="6" fill="#fff" ${ol(2)}/>` +
    `<path d="M70 132 l-22 -14 q-6 14 0 26Z M70 132 l22 -14 q6 14 0 26Z" fill="#7ad6ff" ${ol(2)}/>` +
    `<circle cx="70" cy="70" r="64" fill="${c1}" ${ol()}/><g class="sc-spin-slow" style="transform-origin:70px 70px"><path d="${spiral(70, 70, 58, 3)}" stroke="${c2}" stroke-width="12" fill="none" stroke-linecap="round"/></g>` +
    `<ellipse cx="46" cy="40" rx="16" ry="9" fill="#fff" opacity=".45" transform="rotate(-30 46 40)"/>`];
  A.candycane = () => [100, 260, ['<path d="M70 250 V80 A30 30 0 0 0 10 80" stroke="' + OL + '" stroke-opacity=".55" stroke-width="30" fill="none" stroke-linecap="round"/>',
    '<path d="M70 250 V80 A30 30 0 0 0 10 80" stroke="#fff" stroke-width="24" fill="none" stroke-linecap="round"/>',
    '<path d="M70 250 V80 A30 30 0 0 0 10 80" stroke="#ff3b5c" stroke-width="24" fill="none" stroke-dasharray="14 16"/>'].join('')];
  A.cupcake = (frost = '#ffb3d9') => [170, 200,
    `<g class="sc-cherry"><path d="M86 30 Q92 10 104 6" stroke="#4a8a3a" stroke-width="4" fill="none"/><circle cx="84" cy="36" r="13" fill="#ff2d4d" ${ol(2)}/><circle cx="80" cy="32" r="4" fill="#fff" opacity=".7"/></g>` +
    blob([[44, 100, 28], [85, 90, 36], [126, 100, 28], [65, 68, 24], [105, 68, 24], [85, 52, 18]], frost) +
    Array.from({ length: 14 }, (_, i) => { const r = seeded(i + 3); return `<rect x="${40 + r() * 90}" y="${50 + r() * 60}" width="10" height="4" rx="2" fill="${['#ffd60a', '#4cd964', '#2f9bff', '#9b5cff', '#fff'][i % 5]}" transform="rotate(${r() * 180} ${45 + r() * 90} ${60 + r() * 50})"/>`; }).join('') +
    `<path d="M24 116 L146 116 L132 196 L38 196Z" fill="#6ad0ff" ${ol()}/>` + [44, 64, 85, 106, 126].map(x => `<line x1="${x}" y1="118" x2="${x + (85 - x) * .1}" y2="194" stroke="#3fb0e8" stroke-width="5"/>`).join('') + face(85, 150, .7)];
  A.gumdrop = (c = '#4cd964') => [80, 72,
    `<path d="M5 66 Q5 8 40 6 Q75 8 75 66Z" fill="${c}" ${ol()}/><ellipse cx="28" cy="24" rx="8" ry="5" fill="#fff" opacity=".5"/>` +
    Array.from({ length: 9 }, (_, i) => `<circle cx="${14 + (i * 23) % 54}" cy="${20 + (i * 17) % 42}" r="2" fill="#fff" opacity=".8"/>`).join('')];
  A.donut = () => [130, 90,
    `<path fill-rule="evenodd" d="M5 45 A60 40 0 1 0 125 45 A60 40 0 1 0 5 45Z M45 42 A20 12 0 1 0 85 42 A20 12 0 1 0 45 42Z" fill="#e6a35a" ${ol()}/>` +
    `<path fill-rule="evenodd" d="M12 40 Q20 8 65 8 Q110 8 118 40 Q112 54 100 50 Q90 64 76 58 Q60 70 46 58 Q30 64 22 52 Q8 52 12 40Z M45 42 A20 12 0 1 0 85 42 A20 12 0 1 0 45 42Z" fill="#ff8ad8"/>` +
    Array.from({ length: 12 }, (_, i) => `<rect x="${20 + (i * 37) % 90}" y="${14 + (i * 13) % 36}" width="8" height="3" rx="1.5" fill="${['#ffd60a', '#4cd964', '#2f9bff', '#fff'][i % 4]}" transform="rotate(${i * 47} ${24 + (i * 37) % 90} ${16 + (i * 13) % 36})"/>`).join('')];
  A.icecream = () => [110, 210,
    `<path d="M25 100 L55 206 L85 100Z" fill="#f2b766" ${ol()}/><path d="M35 120 L75 110 M40 140 L72 132 M30 104 L68 170 M80 104 L44 170" stroke="#d48f3e" stroke-width="3"/>` +
    blob([[55, 92, 32], [30, 98, 14], [80, 98, 14]], '#7af0c8') + blob([[55, 54, 28]], '#ff9ad5') + blob([[55, 22, 20]], '#a8763e') +
    `<circle cx="55" cy="4" r="9" fill="#ff2d4d"/>`];

  // ----- farm -----
  A.barn = () => [280, 250,
    `<rect x="112" y="78" width="56" height="46" fill="#5a221e"/>` +
    `<g clip-path="url(#sc-loft-clip)"><g class="sc-loftcow" style="transform:translateY(46px)"><ellipse cx="140" cy="108" rx="22" ry="20" fill="#fff" ${ol(2)}/><ellipse cx="148" cy="98" rx="8" ry="6" fill="#333"/><ellipse cx="140" cy="118" rx="16" ry="9" fill="#ffb3c6"/><circle cx="132" cy="98" r="3" fill="#222"/><circle cx="148" cy="98" r="3" fill="#fff"/><circle cx="148" cy="98" r="2" fill="#222"/></g></g>` +
    `<path fill-rule="evenodd" d="M30 250 V110 L140 30 L250 110 V250Z M112 78 V124 H168 V78Z" fill="#e0473f" ${ol()}/>` +
    `<path d="M200 74 L250 110 V250 H220Z" fill="#c23a33"/>` +
    [60, 80, 200, 222].map(x => `<line x1="${x}" y1="${x < 140 ? 98 : 98}" x2="${x}" y2="250" stroke="#b8352e" stroke-width="3"/>`).join('') +
    `<path d="M20 116 L140 26 L260 116" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<rect x="112" y="78" width="56" height="46" fill="none" stroke="#fff" stroke-width="6"/>` +
    `<rect x="88" y="150" width="104" height="100" fill="#c23a33" stroke="#fff" stroke-width="7"/><path d="M88 150 L140 250 M140 150 L88 250 M140 150 L192 250 M192 150 L140 250 M140 150 V250" stroke="#fff" stroke-width="6"/>`];
  A.windmill = () => [220, 340,
    `<path d="M80 330 L94 120 H126 L140 330Z" fill="#f2e2c4" ${ol()}/><path d="M100 330 V290 A10 10 0 0 1 120 290 V330Z" fill="#8a5a2b"/><rect x="104" y="200" width="12" height="16" fill="#7ad6ff" ${ol(2)}/>` +
    `<path d="M88 124 L110 94 L132 124Z" fill="#c23a33" ${ol()}/>` +
    `<g class="sc-blades" style="transform-origin:110px 112px">${[0, 90, 180, 270].map(r => `<g transform="rotate(${r} 110 112)"><rect x="104" y="12" width="12" height="100" fill="#a8763e"/><rect x="116" y="18" width="26" height="84" fill="#fff" ${ol(2)}/><path d="M116 40 H142 M116 62 H142 M116 84 H142" stroke="#ddd" stroke-width="2"/></g>`).join('')}</g>` +
    `<circle cx="110" cy="112" r="10" fill="#7a4a25" ${ol(2)}/>`];
  A.hay = () => [130, 84, `<rect x="5" y="5" width="120" height="74" rx="18" fill="#f2c94c" ${ol()}/>` +
    Array.from({ length: 10 }, (_, i) => `<path d="M${16 + i * 11} 14 q4 26 -2 56" stroke="#d6a52a" stroke-width="2.5" fill="none"/>`).join('') + `<rect x="5" y="34" width="120" height="8" fill="#b8352e"/>`];
  A.chicken = () => [110, 110,
    `<path d="M24 50 Q6 30 16 18 Q20 34 30 38Z" fill="#fff" ${ol(2)}/>` +
    `<ellipse cx="50" cy="62" rx="34" ry="28" fill="#fff" ${ol()}/><path d="M40 60 Q52 76 64 62" stroke="#e6e6e6" stroke-width="6" fill="none"/>` +
    `<path d="M44 88 V104 M58 88 V104 M40 104 H50 M54 104 H64" stroke="#ff9a1c" stroke-width="4" stroke-linecap="round"/>` +
    `<g class="sc-peck" style="transform-origin:66px 56px"><circle cx="78" cy="36" r="17" fill="#fff" ${ol()}/><path d="M70 22 q2 -10 8 -6 q4 -8 8 0 q6 -2 4 8Z" fill="#ff3b3b"/>` +
    `<path d="M94 34 L104 38 L94 42Z" fill="#ffb02e" ${ol(1.5)}/><path d="M92 44 q2 8 -3 8 q-3 -4 0 -8Z" fill="#ff3b3b"/><circle cx="84" cy="32" r="3.5" fill="#222"/></g>`];
  A.cow = () => [210, 150,
    `<path class="sc-tail" style="transform-origin:180px 50px" d="M180 50 Q200 70 196 100" stroke="#333" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    [62, 84, 146, 166].map(x => `<rect x="${x}" y="88" width="16" height="56" rx="7" fill="#fff" ${ol(2)}/><rect x="${x}" y="134" width="16" height="10" rx="3" fill="#555"/>`).join('') +
    `<rect x="50" y="34" width="134" height="72" rx="34" fill="#fff" ${ol()}/><ellipse cx="128" cy="104" rx="12" ry="8" fill="#ffb3c6"/>` +
    `<path d="M90 36 q20 6 18 26 q-14 10 -28 -4 q-6 -14 10 -22Z" fill="#333"/><path d="M150 50 q18 0 20 18 q-8 14 -24 6Z" fill="#333"/><ellipse cx="120" cy="86" rx="10" ry="7" fill="#333"/>` +
    `<g class="sc-graze" style="transform-origin:56px 54px"><path d="M30 26 q-8 -14 2 -16 M64 26 q8 -14 -2 -16" stroke="#e8d3a8" stroke-width="6" fill="none" stroke-linecap="round"/>` +
    `<ellipse cx="18" cy="40" rx="12" ry="7" fill="#fff" ${ol(2)}/><ellipse cx="76" cy="40" rx="12" ry="7" fill="#fff" ${ol(2)}/>` +
    `<ellipse cx="47" cy="50" rx="27" ry="30" fill="#fff" ${ol()}/><ellipse cx="47" cy="70" rx="22" ry="14" fill="#ffb3c6" ${ol(2)}/><circle cx="40" cy="70" r="3" fill="#a05a6a"/><circle cx="54" cy="70" r="3" fill="#a05a6a"/>` +
    `<circle cx="37" cy="44" r="4" fill="#222"/><circle cx="57" cy="44" r="4" fill="#222"/><path d="M40 28 q8 -6 16 2 q-8 8 -16 -2Z" fill="#333"/></g>`];

  // ----- camp -----
  A.tent = () => [260, 180,
    `<path d="M10 176 L130 16 L250 176Z" fill="#ff9a3c" ${ol()}/><path d="M130 16 L250 176 H190Z" fill="#e8822a"/>` +
    `<path d="M130 22 L98 176 H162Z" fill="#3a2418"/>` +
    `<g clip-path="url(#sc-tent-clip)"><g class="sc-peek" style="transform:translateY(40px)"><circle cx="122" cy="150" r="5" fill="#fff6a8"/><circle cx="138" cy="150" r="5" fill="#fff6a8"/><circle cx="122" cy="151" r="2.4" fill="#222"/><circle cx="138" cy="151" r="2.4" fill="#222"/></g></g>` +
    `<path d="M130 22 L98 176 L112 176Z" fill="#ffb86a" ${ol(2)}/><path d="M130 22 L162 176 L148 176Z" fill="#d06f20" ${ol(2)}/>` +
    `<path d="M10 176 L0 180 M250 176 L260 180" stroke="#7a4a25" stroke-width="4"/><circle cx="130" cy="16" r="6" fill="#ffd23f"/>`];
  A.campfire = () => [170, 180,
    `<ellipse class="sc-glowpulse" cx="85" cy="130" rx="85" ry="60" fill="url(#sc-glow)"/>` +
    `<g class="sc-fire" style="transform-origin:85px 150px"><path class="sc-f1" d="M85 30 Q120 80 112 126 Q100 150 85 150 Q70 150 58 126 Q50 80 85 30Z" fill="#ff5a2a"/>` +
    `<path class="sc-f2" d="M85 64 Q108 96 102 130 Q94 146 85 146 Q76 146 68 130 Q62 96 85 64Z" fill="#ff9a2a"/>` +
    `<path class="sc-f3" d="M85 98 Q98 116 96 134 Q92 144 85 144 Q78 144 74 134 Q72 116 85 98Z" fill="#ffe14d"/></g>` +
    `<rect x="30" y="140" width="110" height="18" rx="9" fill="#8a5a2b" ${ol(2)} transform="rotate(12 85 149)"/><rect x="30" y="140" width="110" height="18" rx="9" fill="#7a4a25" ${ol(2)} transform="rotate(-12 85 149)"/>` +
    [[18, 168], [44, 172], [72, 174], [100, 174], [128, 172], [152, 168]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="15" ry="9" fill="#8a8aa0" ${ol(2)}/>`).join('')];
  A.owl = () => [130, 180,
    `<path d="M0 150 Q65 140 130 154" stroke="#5a3a20" stroke-width="12" fill="none" stroke-linecap="round"/>` +
    `<g class="sc-tilt" style="transform-origin:65px 140px"><ellipse cx="65" cy="96" rx="44" ry="54" fill="#8a6a4a" ${ol()}/><ellipse cx="65" cy="112" rx="28" ry="34" fill="#e8d0a8"/>` +
    [[56, 104], [74, 104], [65, 118], [56, 132], [74, 132]].map(([x, y]) => `<path d="M${x - 5} ${y} l5 5 l5 -5" stroke="#b08a5a" stroke-width="2.5" fill="none"/>`).join('') +
    `<path d="M28 52 L22 24 L46 44Z M102 52 L108 24 L84 44Z" fill="#8a6a4a" ${ol(2)}/>` +
    `<circle cx="46" cy="70" r="19" fill="#fff" ${ol(2)}/><circle cx="84" cy="70" r="19" fill="#fff" ${ol(2)}/>` +
    `<g class="sc-owleyes"><circle cx="46" cy="70" r="11" fill="#ffb02e"/><circle cx="84" cy="70" r="11" fill="#ffb02e"/><circle cx="46" cy="70" r="6" fill="#222"/><circle cx="84" cy="70" r="6" fill="#222"/></g>` +
    `<path d="M58 84 L65 98 L72 84Z" fill="#ffb02e" ${ol(1.5)}/><path d="M50 146 v6 M58 146 v6 M72 146 v6 M80 146 v6" stroke="#ffb02e" stroke-width="4" stroke-linecap="round"/></g>`];
  A.log = () => [150, 60, `<rect x="5" y="10" width="140" height="44" rx="22" fill="#8a5a2b" ${ol()}/><ellipse cx="127" cy="32" rx="16" ry="20" fill="#d9a86c" ${ol(2)}/><ellipse cx="127" cy="32" rx="8" ry="10" fill="none" stroke="#a8763e" stroke-width="3"/>`];

  // ----- beach / savanna / home props for other games -----
  A.umbrella = () => [200, 240, `<line x1="100" y1="60" x2="110" y2="240" stroke="#8a5a2b" stroke-width="7"/>` +
    `<path d="M10 80 Q100 -20 190 80 Q170 66 145 80 Q122 66 100 80 Q78 66 55 80 Q32 66 10 80Z" fill="#ff5a6a" ${ol()}/><path d="M55 80 Q70 20 100 10 Q130 20 145 80 Q122 66 100 80 Q78 66 55 80Z" fill="#fff"/>`];
  A.sandcastle = () => [180, 150, `<rect x="30" y="70" width="120" height="80" fill="#f2c27a" ${ol()}/><rect x="10" y="40" width="40" height="110" fill="#f6cf8e" ${ol()}/><rect x="130" y="40" width="40" height="110" fill="#f6cf8e" ${ol()}/>` +
    [10, 22, 34, 130, 142, 154].map(x => `<rect x="${x}" y="30" width="8" height="12" fill="#f6cf8e"/>`).join('') + `<path d="M76 150 V118 A14 14 0 0 1 104 118 V150Z" fill="#c8923c"/><line x1="30" y1="40" x2="30" y2="10" stroke="#7a4a25" stroke-width="3"/><path d="M30 10 l18 6 -18 6Z" fill="#ff4d6d"/>`];
  A.crab = () => [130, 90, `<g class="sc-waddle" style="transform-origin:65px 86px"><path d="M30 60 l-16 20 M40 66 l-10 20 M100 60 l16 20 M90 66 l10 20" stroke="#e8432f" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M26 40 Q8 30 14 12 Q24 20 30 14 Q30 30 34 38Z M104 40 Q122 30 116 12 Q106 20 100 14 Q100 30 96 38Z" fill="#ff5a3a" ${ol(2)}/>` +
    `<ellipse cx="65" cy="54" rx="40" ry="26" fill="#ff5a3a" ${ol()}/><line x1="54" y1="30" x2="52" y2="18" stroke="#e8432f" stroke-width="3"/><line x1="76" y1="30" x2="78" y2="18" stroke="#e8432f" stroke-width="3"/><circle cx="52" cy="16" r="6" fill="#fff"/><circle cx="78" cy="16" r="6" fill="#fff"/><circle cx="52" cy="17" r="3" fill="#222"/><circle cx="78" cy="17" r="3" fill="#222"/>` +
    `<path d="M56 60 q9 7 18 0" stroke="#7a1a10" stroke-width="3" fill="none" stroke-linecap="round"/></g>`];
  A.acacia = () => [300, 240, `<path d="M140 240 L146 140 Q120 110 80 96 M146 140 Q170 110 220 92 M146 160 Q150 120 150 92" stroke="#6b4423" stroke-width="14" fill="none" stroke-linecap="round"/>` +
    blob([[60, 80, 30], [110, 66, 38], [160, 60, 40], [210, 70, 36], [250, 84, 26]], '#7aa83a') + `<path d="M40 92 Q150 104 270 92" stroke="#5f8a2a" stroke-width="6" fill="none" opacity=".6"/>`];
  A.window = () => [200, 200, `<rect x="10" y="10" width="180" height="180" rx="10" fill="#fff" ${ol()}/><rect x="24" y="24" width="152" height="152" fill="#8fd3ff"/>` +
    `<circle cx="140" cy="60" r="20" fill="#ffe14d"/>` + blob([[60, 70, 16], [80, 62, 20], [100, 72, 14]], '#fff', { op: .2 }) + `<path d="M24 150 Q100 120 176 150 V176 H24Z" fill="#7ccc58"/>` +
    `<path d="M100 24 V176 M24 100 H176" stroke="#fff" stroke-width="10"/><path d="M0 4 Q30 100 10 196 H-10 V4Z M200 4 Q170 100 190 196 H210 V4Z" fill="#ff8ab0"/>`];
  A.bookshelf = () => [200, 240, `<rect x="5" y="5" width="190" height="230" rx="8" fill="#a8693a" ${ol()}/>` + [20, 95, 170].map(y => `<rect x="18" y="${y}" width="164" height="62" fill="#7a4a25"/>`).join('') +
    [[22, 20, '#ff5a6a'], [42, 26, '#2f9bff'], [64, 18, '#ffd23f'], [84, 24, '#4cd964'], [110, 22, '#9b5cff'], [134, 20, '#ff9a3c'], [154, 24, '#ff6fb5'],
     [22, 98, '#4cd964'], [46, 104, '#ff6fb5'], [66, 96, '#2f9bff'], [140, 100, '#ffd23f']].map(([x, y, c]) => `<rect x="${x}" y="${y + 12}" width="16" height="${50 - (y % 20) * .5}" rx="2" fill="${c}"/>`).join('') +
    `<circle cx="110" cy="132" r="20" fill="#ffb02e"/>${face(110, 134, .45)}<rect x="40" y="190" width="40" height="34" rx="6" fill="#ff8ad8"/><rect x="100" y="196" width="60" height="28" rx="6" fill="#7ad6ff"/>`];
  A.lamp = () => [100, 240, `<path d="M20 70 L34 10 H66 L80 70Z" fill="#ffe08a" ${ol()}/><rect x="46" y="70" width="8" height="150" fill="#8a5a2b"/><ellipse cx="50" cy="228" rx="34" ry="10" fill="#8a5a2b" ${ol(2)}/>` +
    `<ellipse class="sc-glowpulse" cx="50" cy="80" rx="50" ry="22" fill="url(#sc-beam-glow)"/>`];
  A.rug = () => [300, 90, `<ellipse cx="150" cy="45" rx="146" ry="40" fill="#ff8fb5" ${ol()}/><ellipse cx="150" cy="45" rx="110" ry="28" fill="#ffd1e0"/><ellipse cx="150" cy="45" rx="70" ry="16" fill="#ff8fb5"/>`];
  A.sofa = () => [300, 170, `<rect x="30" y="30" width="240" height="80" rx="30" fill="#7ab8ff" ${ol()}/><rect x="10" y="80" width="280" height="64" rx="24" fill="#5aa0f2" ${ol()}/>` +
    `<rect x="0" y="60" width="50" height="90" rx="22" fill="#7ab8ff" ${ol()}/><rect x="250" y="60" width="50" height="90" rx="22" fill="#7ab8ff" ${ol()}/><rect x="30" y="144" width="14" height="22" fill="#7a4a25"/><rect x="256" y="144" width="14" height="22" fill="#7a4a25"/>` +
    `<rect x="70" y="60" width="60" height="40" rx="14" fill="#ffd23f" ${ol(2)}/>`];
  A.spotlight = () => [200, 400, `<path class="sc-glowpulse" d="M90 0 H110 L200 400 H0Z" fill="url(#sc-beam)"/>`];
  A.balloons = () => [120, 240, [[40, 50, '#ff5a6a'], [80, 40, '#ffd23f'], [60, 84, '#2f9bff']].map(([x, y, c]) => `<path d="M${x} ${y + 34} Q${60 + (x - 60) * .3} 160 60 240" stroke="#888" stroke-width="2" fill="none"/><ellipse cx="${x}" cy="${y}" rx="26" ry="32" fill="${c}" ${ol(2)}/><ellipse cx="${x - 9}" cy="${y - 12}" rx="6" ry="9" fill="#fff" opacity=".5"/>`).join('')];

  // ---------- CSS ----------
  const CSS = `
  .sc-svg { width: 100%; height: 100%; display: block; overflow: visible; }
  .sc-prop { position: absolute; pointer-events: none; }
  .sc-prop.tap { pointer-events: auto; cursor: pointer; touch-action: manipulation; }
  .sc-prop > .sc-in { width: 100%; height: 100%; }
  .sc-prop.flip .sc-svg { transform: scaleX(-1); }
  .sc-oc { transform-box: fill-box; transform-origin: center; }
  .sc-spin-slow { animation: sc-spin 30s linear infinite; }
  .sc-sway { animation: sc-sway 3.2s ease-in-out infinite; }
  .sc-sway-soft { animation: sc-sway-soft 4.5s ease-in-out infinite; }
  .sc-swing { animation: sc-swing 3.4s ease-in-out infinite; }
  .sc-flap { animation: sc-flap .35s ease-in-out infinite; }
  .sc-flap-y { animation: sc-flapy .5s ease-in-out infinite; }
  .sc-flag { animation: sc-flag 1.2s ease-in-out infinite; }
  .sc-blink { transform-box: fill-box; transform-origin: center; animation: sc-blink 4.5s infinite; }
  .sc-tailwag { animation: sc-wag .5s ease-in-out infinite; }
  .sc-wiggle-x { animation: sc-wigglex 1.6s ease-in-out infinite; }
  .sc-earth { animation: sc-earth 14s linear infinite; }
  .sc-flame { animation: sc-flame .18s ease-in-out infinite alternate; }
  .sc-beam { opacity: 0; transition: opacity .3s; }
  .sc-blinky { animation: sc-blinky 1s steps(2) infinite; }
  .sc-smoke { transform-box: fill-box; transform-origin: center; animation: sc-smoke 4s ease-out infinite; opacity: 0; }
  .sc-nod { animation: sc-nod 4s ease-in-out infinite; }
  .sc-flow { animation: sc-flow .8s linear infinite; }
  .sc-splash { animation: sc-bob 1s ease-in-out infinite; }
  .sc-wave { animation: sc-wavearm 1.6s ease-in-out infinite; }
  .sc-waddle { animation: sc-waddle .9s ease-in-out infinite; }
  .sc-blades { animation: sc-spin 9s linear infinite; }
  .sc-peck { animation: sc-peck 2.6s ease-in-out infinite; }
  .sc-graze { animation: sc-graze 6s ease-in-out infinite; }
  .sc-tail { animation: sc-sway 1.4s ease-in-out infinite; }
  .sc-fire .sc-f1 { transform-box: fill-box; transform-origin: 50% 100%; animation: sc-flick .5s ease-in-out infinite alternate; }
  .sc-fire .sc-f2 { transform-box: fill-box; transform-origin: 50% 100%; animation: sc-flick .37s ease-in-out infinite alternate-reverse; }
  .sc-fire .sc-f3 { transform-box: fill-box; transform-origin: 50% 100%; animation: sc-flick .29s ease-in-out infinite alternate; }
  .sc-glowpulse { animation: sc-glowp 1.6s ease-in-out infinite; }
  .sc-tilt { animation: sc-tilt 5s ease-in-out infinite; }
  .sc-rays { animation: sc-rays 6s ease-in-out infinite; }
  .sc-aurora { animation: sc-aurora 9s ease-in-out infinite alternate; }
  .sc-waves { animation: sc-waves 3s ease-in-out infinite alternate; }
  .sc-baby, .sc-cap, .sc-lid, .sc-hat, .sc-cherry, .sc-peek, .sc-loftcow, .sc-wing, .sc-owleyes { transition: transform .5s cubic-bezier(.3,1.6,.5,1); }
  .sc-cherry { transform-box: fill-box; transform-origin: 50% 100%; }
  .sc-owleyes { transform-box: fill-box; transform-origin: center; }
  .sc-glow-win { animation: sc-glowwin 3s ease-in-out infinite; }

  /* ambient movement for a whole prop */
  .sc-a-bob { animation: sc-bob 5s ease-in-out infinite; }
  .sc-a-drift { animation: sc-drift 20s ease-in-out infinite alternate; }
  .sc-a-twinkle { animation: sc-twinkle 1.8s ease-in-out infinite; }
  .sc-a-hop { animation: sc-hop 1.6s ease-in-out infinite; }
  .sc-a-across { animation: sc-across var(--dur, 18s) linear infinite; animation-delay: var(--delay, 0s); }
  .sc-a-flutter { animation: sc-flutter 14s ease-in-out infinite; }
  .sc-a-patrol { animation: sc-patrol 16s ease-in-out infinite alternate; }
  .sc-a-shoot { animation: sc-shoot 9s ease-in infinite; animation-delay: var(--delay, 0s); opacity: 0; }

  /* what a tap does to the whole prop (the game adds the class for a moment) */
  .sc-prop.t-boing { animation: sc-boing .6s cubic-bezier(.3,1.6,.5,1); }
  .sc-prop.t-spin { animation: sc-tspin .9s cubic-bezier(.4,0,.2,1); }
  .sc-prop.t-wiggle { animation: sc-twiggle .6s ease-in-out; }
  .sc-prop.t-rumble { animation: sc-rumble .7s linear; }
  .sc-prop.t-launch { animation: sc-launch 3.4s ease-in-out; }
  .sc-prop.t-launch .sc-flame { transform: scaleY(1.8); }
  .sc-prop.t-open .sc-lid { transform: translateY(-10px) rotate(-28deg); }
  .sc-prop.t-beam .sc-beam { opacity: 1; }
  .sc-prop.t-hatch .sc-cap { transform: translate(-6px, -34px) rotate(-30deg); }
  .sc-prop.t-hatch .sc-baby { transform: translateY(-8px) !important; }
  .sc-prop.t-hat .sc-hat { transform: translateY(-30px) rotate(-14deg); }
  .sc-prop.t-cherry .sc-cherry { transform: translateY(-28px) rotate(20deg); }
  .sc-prop.t-peek .sc-peek, .sc-prop.t-loft .sc-loftcow { transform: translateY(0) !important; }
  .sc-prop.t-flap .sc-wing { transform: rotate(-40deg); }
  .sc-prop.t-fast .sc-blades { animation-duration: .7s; }
  .sc-prop.t-flare .sc-fire { transform: scale(1.35); transition: transform .3s; }
  .sc-prop.t-hoot .sc-owleyes { transform: scale(1.3); }
  .sc-prop.t-nod .sc-nod { animation-duration: .5s; }
  .sc-prop.t-bloom .sc-head { transform-box: fill-box; transform-origin: center; animation: sc-tspin .9s ease-in-out; }

  /* extras */
  .sc-star { position: absolute; width: 4px; height: 4px; border-radius: 50%; background: #fff; animation: sc-twinkle 2s ease-in-out infinite; }
  .sc-bubble { position: absolute; bottom: -40px; border-radius: 50%; border: 3px solid rgba(255,255,255,.7); background: rgba(255,255,255,.15); animation: sc-rise linear infinite; }
  .sc-flake { position: absolute; top: -20px; border-radius: 50%; background: #fff; opacity: .9; animation: sc-snow linear infinite; }
  .sc-firefly { position: absolute; width: 8px; height: 8px; border-radius: 50%; background: #fff7a0; box-shadow: 0 0 10px 4px rgba(255,240,120,.7); animation: sc-ffly 6s ease-in-out infinite, sc-twinkle 1.6s ease-in-out infinite; }

  @keyframes sc-spin { to { transform: rotate(360deg); } }
  @keyframes sc-sway { 0%,100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg); } }
  @keyframes sc-sway-soft { 0%,100% { transform: rotate(-2deg); } 50% { transform: rotate(2deg); } }
  @keyframes sc-swing { 0%,100% { transform: rotate(-9deg); } 50% { transform: rotate(9deg); } }
  @keyframes sc-flap { 0%,100% { transform: scaleX(1); } 50% { transform: scaleX(.3); } }
  @keyframes sc-flapy { 0%,100% { transform: scaleY(1); } 50% { transform: scaleY(-.6); } }
  @keyframes sc-flag { 0%,100% { transform: skewY(-6deg) scaleX(1); } 50% { transform: skewY(6deg) scaleX(.9); } }
  @keyframes sc-blink { 0%, 94%, 100% { transform: scaleY(1); } 97% { transform: scaleY(.1); } }
  @keyframes sc-wag { 0%,100% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } }
  @keyframes sc-wigglex { 0%,100% { transform: skewX(-6deg); } 50% { transform: skewX(6deg); } }
  @keyframes sc-earth { to { transform: translateX(-160px); } }
  @keyframes sc-flame { to { transform: scaleY(1.25) scaleX(.9); } }
  @keyframes sc-blinky { 50% { opacity: .3; } }
  @keyframes sc-smoke { 0% { transform: translateY(0) scale(.5); opacity: 0; } 15% { opacity: .8; } 100% { transform: translateY(-110px) scale(1.6); opacity: 0; } }
  @keyframes sc-nod { 0%,100% { transform: rotate(0); } 50% { transform: rotate(-8deg); } }
  @keyframes sc-flow { to { transform: translateY(70px); } }
  @keyframes sc-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  @keyframes sc-wavearm { 0%,100% { transform: rotate(0); } 50% { transform: rotate(18deg); } }
  @keyframes sc-waddle { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
  @keyframes sc-peck { 0%, 60%, 100% { transform: rotate(0); } 70%, 80% { transform: rotate(40deg); } 75% { transform: rotate(30deg); } }
  @keyframes sc-graze { 0%, 40%, 100% { transform: rotate(0); } 55%, 85% { transform: rotate(-24deg); } }
  @keyframes sc-flick { from { transform: scale(1, 1); } to { transform: scale(.9, 1.12); } }
  @keyframes sc-glowp { 0%,100% { opacity: .75; } 50% { opacity: 1; } }
  @keyframes sc-tilt { 0%, 70%, 100% { transform: rotate(0); } 78%, 90% { transform: rotate(14deg); } }
  @keyframes sc-rays { 0%,100% { opacity: 1; } 50% { opacity: .4; } }
  @keyframes sc-aurora { to { transform: translateX(-120px); } }
  @keyframes sc-waves { to { transform: translateX(30px); } }
  @keyframes sc-glowwin { 0%,100% { opacity: 1; } 50% { opacity: .75; } }
  @keyframes sc-drift { to { translate: 12vw 0; } }
  @keyframes sc-twinkle { 0%,100% { opacity: 1; scale: 1; } 50% { opacity: .3; scale: .7; } }
  @keyframes sc-hop { 0%,100% { translate: 0 0; } 50% { translate: 0 -14px; } }
  @keyframes sc-across { from { translate: -30vw 0; } to { translate: 130vw 0; } }
  @keyframes sc-flutter { 0% { translate: 0 0; } 25% { translate: -14vw 8vh; } 50% { translate: -4vw -6vh; } 75% { translate: 10vw 4vh; } 100% { translate: 0 0; } }
  @keyframes sc-patrol { from { translate: -6vw 0; } to { translate: 6vw 0; } }
  @keyframes sc-shoot { 0%, 80% { translate: 0 0; opacity: 0; } 82% { opacity: 1; } 92% { translate: 50vw 18vh; opacity: 0; } 100% { opacity: 0; } }
  @keyframes sc-boing { 0% { transform: scale(1); } 30% { transform: scale(1.25, .8); } 60% { transform: scale(.9, 1.15); } 100% { transform: scale(1); } }
  @keyframes sc-tspin { to { transform: rotate(360deg); } }
  @keyframes sc-twiggle { 25% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } 75% { transform: rotate(-6deg); } }
  @keyframes sc-rumble { 0%,100% { transform: translate(0,0); } 20% { transform: translate(-6px,2px); } 40% { transform: translate(6px,-2px); } 60% { transform: translate(-4px,1px); } 80% { transform: translate(4px,0); } }
  @keyframes sc-launch { 0% { transform: translate(0,0); } 12% { transform: translate(-3px,0); } 16% { transform: translate(3px,0); } 45% { transform: translate(0,-130vh); } 46% { transform: translate(0,130vh); } 100% { transform: translate(0,0); } }
  @keyframes sc-rise { to { transform: translateY(-115vh); } }
  @keyframes sc-snow { to { transform: translate(var(--sway, 30px), 110vh); } }
  @keyframes sc-ffly { 0%,100% { translate: 0 0; } 33% { translate: 40px -30px; } 66% { translate: -30px 20px; } }
  @media (prefers-reduced-motion: reduce) { .sc-a-across, .sc-a-flutter, .sc-a-shoot { animation-duration: 60s; } }
  `;

  // ---------- put it on the page ----------
  function install() {
    if (document.getElementById('sc-defs')) return;
    const st = document.createElement('style'); st.id = 'sc-css'; st.textContent = CSS;
    document.head.appendChild(st);
    const d = document.createElement('div');
    d.innerHTML = `<svg id="sc-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${DEFS()}</defs></svg>`;
    document.body.prepend(d.firstChild);
  }
  if (document.body) install(); else document.addEventListener('DOMContentLoaded', install);

  const cache = {};
  function art(name, ...args) {
    const key = name + JSON.stringify(args);
    if (!cache[key]) {
      const f = A[name]; if (!f) throw new Error('Scenery: no art "' + name + '"');
      const [w, h, svg] = f(...args);
      cache[key] = { w, h, svg: `<svg class="sc-svg" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>` };
    }
    return cache[key];
  }
  function backdrop(name) {
    install();
    return `<svg class="sc-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${BACK[name]()}</svg>`;
  }

  const ORIGIN = { bottom: ['-50%', '-100%', '50% 100%'], center: ['-50%', '-50%', '50% 50%'], top: ['-50%', '0%', '50% 0%'] };
  function place(layer, props, W, H) {
    install();
    const unit = Math.min(W, H) / 100;
    return props.map(p => {
      const a = art(p.art, ...(p.args || []));
      const h = p.h * unit, w = h * a.w / a.h;
      const [tx, ty, origin] = ORIGIN[p.at || 'bottom'];
      const el = document.createElement('div');
      el.className = 'sc-prop' + (p.tap ? ' tap' : '') + (p.flip ? ' flip' : '');
      el.style.cssText = `left:${p.x}%;top:${p.y}%;width:${w}px;height:${h}px;translate:${tx} ${ty};transform-origin:${origin}`;
      if (p.z) el.style.zIndex = p.z;
      if (p.tap) el.dataset.tap = p.tap;
      const inner = document.createElement('div');
      inner.className = 'sc-in' + (p.anim ? ' sc-a-' + p.anim : '');
      if (p.dur) inner.style.setProperty('--dur', p.dur + 's');
      if (p.delay != null) inner.style.setProperty('--delay', p.delay + 's');
      inner.innerHTML = a.svg;
      el.appendChild(inner);
      layer.appendChild(el);
      return el;
    });
  }

  // replay a tap class on a prop
  function react(el, cls, ms = 1200) {
    el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
    clearTimeout(el._t && el._t[cls]); el._t = el._t || {};
    el._t[cls] = setTimeout(() => el.classList.remove(cls), ms);
  }

  const R = (a, b) => a + Math.random() * (b - a);
  function extras(layer, { stars = 0, bubbles = 0, snow = 0, fireflies = 0, shooting = false } = {}) {
    for (let i = 0; i < stars; i++) {
      const s = document.createElement('div'); s.className = 'sc-star';
      s.style.left = R(0, 100) + '%'; s.style.top = R(0, 80) + '%'; s.style.animationDelay = R(0, 2) + 's';
      const z = R(2, 5); s.style.width = s.style.height = z + 'px'; layer.appendChild(s);
    }
    for (let i = 0; i < bubbles; i++) {
      const b = document.createElement('div'); b.className = 'sc-bubble';
      const z = R(12, 34); b.style.width = b.style.height = z + 'px'; b.style.left = R(0, 100) + '%';
      b.style.animationDuration = R(7, 14) + 's'; b.style.animationDelay = -R(0, 14) + 's'; layer.appendChild(b);
    }
    for (let i = 0; i < snow; i++) {
      const f = document.createElement('div'); f.className = 'sc-flake';
      const z = R(4, 11); f.style.width = f.style.height = z + 'px'; f.style.left = R(-5, 100) + '%';
      f.style.setProperty('--sway', R(-60, 60) + 'px'); f.style.opacity = R(.6, 1);
      f.style.animationDuration = R(6, 13) + 's'; f.style.animationDelay = -R(0, 13) + 's'; layer.appendChild(f);
    }
    for (let i = 0; i < fireflies; i++) {
      const f = document.createElement('div'); f.className = 'sc-firefly';
      f.style.left = R(5, 95) + '%'; f.style.top = R(35, 90) + '%';
      f.style.animationDuration = R(5, 9) + 's, ' + R(1.2, 2.4) + 's'; f.style.animationDelay = -R(0, 8) + 's, ' + -R(0, 2) + 's';
      layer.appendChild(f);
    }
    if (shooting) place(layer, [{ art: 'shootingStar', x: 10, y: 12, h: 6, at: 'center', anim: 'shoot', delay: 3 }], layer.clientWidth || innerWidth, layer.clientHeight || innerHeight);
  }

  // a game can add its own pictures: Scenery.add('rocketship', (color) => [w, h, '<svg inner markup>'])
  // and its own backdrops: Scenery.addBackdrop('kitchen', ['#top', '#bottom'], () => '<inner markup on 1000x1000>')
  function add(name, fn) { A[name] = fn; }
  function addBackdrop(name, sky, fn) {
    SKY[name] = sky; BACK[name] = fn;
    const defs = document.querySelector('#sc-defs defs');
    if (defs && !document.getElementById('sc-sky-' + name)) defs.insertAdjacentHTML('beforeend',
      `<linearGradient id="sc-sky-${name}" x1="0" y1="0" x2="0" y2="1">${sky.map((c, i, a) => `<stop offset="${i / Math.max(1, a.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>`);
  }
  // building blocks for drawing in the same style
  const kit = { blob, face, ol, OL, sky, hillsPath, dots, grassTufts, spiral, seeded };

  self.Scenery = { art, backdrop, place, react, extras, install, add, addBackdrop, kit,
    get BACKDROPS() { return Object.keys(BACK); }, get ARTS() { return Object.keys(A); }, SKY };
})();
