#!/usr/bin/env node
// Checks every Beep Boop Robot level: the map is well formed, it can be solved within its card limit,
// and the new thing in each level (doors, swirls, the repeat button) is really needed.
//
//   node tools/check-robot-levels.mjs
import fs from 'node:fs';
const src = fs.readFileSync(new URL('../site/games/beep-boop-robot/index.html', import.meta.url), 'utf8');
const m = src.match(/\/\/ ==== engine[\s\S]*?\/\/ ==== engine end ====/);
const E = new Function(m[0] + '\nreturn { WORLDS, LEVELS, DIRS, parse, solveFrom, startState, step, isDone, toCards, cardsFor, hintMoves, MAX_PROG };')();
let bad = 0;
E.LEVELS.forEach((def, i) => {
  const errs = [], map = def.map;
  if (!map.every(r => r.length === map[0].length)) errs.push('ragged');
  const count = ch => map.join('').split(ch).length - 1;
  if (count('R') !== 1 || count('B') !== 1) errs.push('R/B count');
  if (count('K') > 1) errs.push('keys>1');
  if (![0, 2].includes(count('O'))) errs.push('swirls');
  if (count('D') && !count('K')) errs.push('door no key');
  const L = E.parse(def);
  const sol = errs.length ? null : E.solveFrom(L, E.startState(L));
  if (!sol) errs.push('UNSOLVABLE');
  let info = '';
  if (sol) {
    const cards = E.cardsFor(L, sol);
    if (cards.length > L.max) errs.push(`cards ${cards.length} > max ${L.max}`);
    // uses features?
    let s = E.startState(L), swirl = false, door = false;
    for (const d of sol) { const r = E.step(L, s, d); if (r.swirl) swirl = true; if (L.doors.has(r.enter.x + ',' + r.enter.y)) door = true; s = r.s; }
    if (L.portals.length && !swirl) errs.push('swirl unused');
    if (L.doors.size && !door) errs.push('door unused');
    if (L.repeat && def.max && sol.length <= def.max) errs.push('repeat not needed');
    info = `moves ${sol.length} cards ${cards.length}${def.max ? '/' + def.max : ''} ${swirl ? 'swirl ' : ''}${door ? 'door ' : ''}`;
  }
  if (errs.length) bad++;
  console.log(String(i).padStart(2), 'w' + def.w, info, errs.join('; '));
});
console.log(bad ? `${bad} problem(s)` : 'all good');
process.exit(bad ? 1 : 0);
