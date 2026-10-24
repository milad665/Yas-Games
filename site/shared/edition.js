// Which edition of the games this is. This file is Yas's own edition (the homelab site).
// The other builds (tools/build.mjs public, tools/build.mjs lili) replace it.
//
//   kid:   the child the games are made for. Letter Trace teaches her name first and
//          Cake Shop has her birthday. Lines spoken only for her are marked kid: true in
//          lines.js; other editions leave them out (and personal editions bring their own).
//   langs: the languages on the switch, in order (each needs its clips recorded)
//   lang:  the language on a first visit (otherwise the device's language, else English)
self.EDITION = {
  name: "Yas's Games",
  kid: { name: 'Yas', emoji: '👧', age: 5 },
  langs: ['en', 'nl', 'fa'],
};
