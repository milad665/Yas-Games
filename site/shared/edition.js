// Which edition of the games this is. This file is Yas's own edition (the homelab site).
// The public build (tools/build.mjs public) replaces it with editions/public/edition.js.
//
//   kid: the child the games are made for. Letter Trace teaches her name first and
//        Cake Shop has her birthday. Lines spoken only for her are marked kid: true in
//        lines.js, and the public edition leaves them out.
self.EDITION = {
  name: "Yas's Games",
  kid: { name: 'Yas', emoji: '👧', age: 5 },
};
