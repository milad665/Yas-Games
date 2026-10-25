// Which edition of the games this is. This file is Yas's own edition (the homelab site).
// The other builds (tools/build.mjs public, tools/build.mjs lili) replace the EDITION data below
// and keep the code after it.
//
//   kid:   the child the games are made for. Letter Trace teaches her name first and
//          Cake Shop has her birthday. Lines spoken only for her are marked kid: true in
//          lines.js; other editions leave them out (and personal editions bring their own).
//          age is used until a grown-up sets the birthday in ⚙️ settings.
//   kids:  instead of kid, several children (brothers and sisters): the home page gets a switch,
//          title becomes the home page title ({kid} is the child's name), and lines ending in
//          @<id> are said instead of the plain ones for that child (see shared/voice.js)
//   langs: the languages on the switch, in order (each needs its clips recorded)
//   lang:  the language on a first visit (otherwise the device's language, else English)
self.EDITION = {
  name: "Yas's Games",
  kid: { id: 'yas', name: 'Yas', emoji: '👧', age: 5 },
  langs: ['en', 'nl', 'fa'],
};

// ---------- which child is playing, and how old they're turning ----------
//   EDITION.kid      the child playing now: { id, name, emoji, born, age }
//   EDITION.kids     all of them
//   EDITION.setKid(id), EDITION.setBorn(id, 'YYYY-MM-DD')
(() => {
  const E = self.EDITION;
  const kids = E.kids || (E.kid ? [E.kid] : []);
  if (!kids.length) return;
  const KEY = 'yasGames.kids'; // { current: id, born: { id: 'YYYY-MM-DD' } }
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { /* no storage here (offline cache) */ }
  saved.born = saved.born || {};

  // the age at the next birthday (today's, on the day itself): Cake Shop says "is turning N"
  function turning(born) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(born || '');
    if (!m) return null;
    const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const birthday = new Date(now.getFullYear(), m[2] - 1, +m[3]);
    return Math.max(1, now.getFullYear() - m[1] + (birthday < today ? 1 : 0));
  }
  function update() {
    E.kids = kids.map(k => {
      const born = saved.born[k.id] || k.born || '';
      return { ...k, born, age: turning(born) || k.age };
    });
    E.kid = E.kids.find(k => k.id === saved.current) || E.kids[0];
    if (E.title) E.name = E.title.replace('{kid}', E.kid.name);
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {}
    update();
  }
  E.setKid = id => { saved.current = id; save(); };
  E.setBorn = (id, born) => { saved.born[id] = born; save(); };
  update();
})();
