# Yas's Games 🎨

A little collection of creative, no-reading-needed games for Yas, made for the iPad.

There is also **Lili's Games**, the same games for Lili in Germany: her name in Letter Trace and
Cake Shop, German by default (English, Dutch and Persian too), hosted on her family's homelab.
And a public edition for every child, **Little Sparks**, with Yas taken out, a donate button and
search-engine friendly pages. See [docs/public-site.md](docs/public-site.md).

| Game | What it is |
| --- | --- |
| **Magic Doodles** | Draw anything with your finger, tap ✨, and it comes alive with googly eyes and hops, flies, swims, floats, crawls, rolls or bounces around one of ten animated cartoon worlds. Tap the scenery (the volcano erupts, the rocket launches, the cow moos), drop treats, throw a dance party, or sweep everyone away with 🧹 (↩️ brings them back). |
| **Beep Boop Robot** | Build your own robot, then program it with arrow cards to reach its battery: 64 levels in six worlds that add gears to collect, keys and doors, teleporting swirls and a repeat card. Teaches sequencing, loops and debugging (`node tools/check-robot-levels.mjs` checks every level). |
| **Music Painter** | Colors are instruments and height is pitch: paint a picture, press play, and it becomes a song. |
| **Story Theater** | Pick a stage, drag on characters and props, tap them to act, and film a story with her own voice. |
| **Creature Lab** | Mix heads, bodies, legs, tails and wings into a creature with a silly name, then feed, bathe and play with it. |
| **Pattern Train** | Finish the pattern on each train car; patterns grow from AB to AABB, big-small and gaps. |
| **Shadow Match** | Drag each picture onto its shadow; later shadows are turned, resized or look-alikes. |
| **Robot Factory** | Build robots from picture recipes, or find and fix the silly robot's mistakes. |
| **Counting Garden** | Plant exactly the number shown, then harvest and count, from 1 to 10. |
| **Animal Safari** | "Where is the lion?" / "Who says moo?" in English or Dutch; found animals fill a photo album. |
| **Feelings Friends** | Little stories: name the feeling, choose a kind way to help, and build feeling faces. |
| **Letter Trace** | Trace all 26 letters with a finger, starting with Y-A-S; each letter has a word in both languages. |
| **Mirror Painter** | Paint once and a magic mirror copies it: butterfly, flower or snowflake symmetry, plus a gallery. |
| **Doodle Puzzles** | Jigsaw puzzles from her own Magic Doodles and Mirror Painter pictures (4 to 12 pieces). |
| **Cake Shop** | Stack layers, frost and decorate, count the candles, sing and blow them out. |
| **Dress-Up Studio** | Dress up as a princess, astronaut, firefighter, mermaid and more; take photos. |
| **Little Vet** | Help animal patients with the right tool; every tool named in English and Dutch. |
| **Where's Teddy?** | Position words (on, under, next to, in, behind) by finding and placing Teddy. |
| **Memory Match** | Flip cards to find pairs, from 6 up to 16 cards. |
| **Sink or Float** | Guess, drop it in the tub, and see; twenty real-life objects. |
| **Maze Mouse** | Drag the mouse through growing mazes to the cheese, with keys and doors later. |
| **Rhythm Copy** | The animal band plays a tune; copy it as it grows longer. |

## Project layout

```
site/                     ← everything that gets served
  index.html              ← the Yas's Games home page
  sw.js, manifest.webmanifest, icon-*.png  ← installable app + offline support
  shared/games.js         ← the list of games
  shared/edition.js       ← which edition this is (Yas's: her name, age, languages; other builds swap it)
  shared/lines.js         ← every spoken line, in English, Dutch, German, Spanish and Persian
  shared/voice.js         ← plays the recorded voice clips
  shared/kit.js, kit.css  ← common buttons, sounds, sparkles and saving for games
  shared/saved.js         ← photos and drawings kept on the device (IndexedDB)
  shared/robot.js         ← the robot drawing used by the robot games
  shared/scenery.js       ← animated cartoon backdrops and props (SVG) any game can use
  voice/                  ← recorded clips (made by tools/record-voice.mjs)
  games/
    magic-doodles/index.html
editions/public/         ← the public edition: name, home page extras for grown-ups
editions/lili/           ← Lili's edition: name, age, languages, her own lines and clips
tools/build.mjs           ← builds an edition into dist/ (node tools/build.mjs yas|lili|public)
firebase.json             ← how Firebase serves the public edition
Dockerfile, nginx.conf    ← container that serves one edition (--build-arg EDITION=yas|lili)
deploy/docker-compose*.yml ← how the homelabs run it (Yas's, and .lili for Lili's)
.github/workflows/        ← build & deploy pipeline
docs/homelab-setup.md     ← one-time server setup guide
docs/public-site.md       ← the public edition: Firebase, Stripe donations, search engines
```

## Adding a new game

1. Create `site/games/<game-name>/index.html` (one self-contained page is easiest).
2. Give it a 🏠 button that links back home: `<a href="../../">🏠</a>`.
3. To make it speak, load the shared voice and add its lines to `site/shared/lines.js` (en, nl, de, es, fa):

   ```html
   <script src="/shared/lines.js"></script>
   <script src="/shared/voice.js"></script>
   <script>Voice.say('mygame.hello');</script>
   ```

4. Add it to the `GAMES` list in `site/shared/games.js` (the offline cache reads it too):

   ```js
   {
     name: 'My New Game',
     path: 'games/my-new-game/',
     about: 'One sentence for grown-ups and search engines.',
     group: 'think',          // its row on the home page: make, think, words or pretend
     art: '🦄',
     extras: ['⭐', '🌈'],
     colors: ['#ffd6a5', '#ffadad'],
   },
   ```

5. If you added lines, record them: `node tools/record-voice.mjs` (see below).
6. Keep Yas out of the other editions: anything personal comes from `EDITION.kid`, and lines
   that say her name get `kid: true` (see [docs/public-site.md](docs/public-site.md)). If Lili
   should hear her own version, add it with the same key to `editions/lili/lines.js`.
7. Commit and push to `main`. The pipeline deploys it to both homelabs and the public site.

## Voice (English, Dutch, German, Spanish, Persian)

Every spoken line lives in `site/shared/lines.js`. The language switch on the
home page applies to all games. Each edition picks its languages with `langs` (and the first-visit
language with `lang`) in its `edition.js` / `site.json`: Yas's has 🇬🇧 🇳🇱 🇮🇷, Lili's 🇩🇪 🇬🇧 🇳🇱 🇮🇷.
Spanish is translated but not recorded yet. Lines are pre-recorded with ElevenLabs (Jessica;
Lucy Fennek, a native German narrator, for German; Matilda for Persian) so they sound the same on
every device and work offline:

1. Put your ElevenLabs API key in `.env` in the project root (it's git-ignored):

   ```bash
   read -rs "k?ElevenLabs API key: " && printf 'ELEVENLABS_API_KEY=%s\n' "$k" > .env && chmod 600 .env && unset k
   ```

2. Record (only new or changed lines are re-recorded; `--dry-run` shows the character cost,
   `--lang en,nl` limits it to some languages):

   ```bash
   node tools/record-voice.mjs
   ```

   If the monthly quota runs out it stops cleanly; run it again after the reset to finish.
   It also records each personal edition's own lines (`editions/lili/lines.js` →
   `editions/lili/voice/`).
3. Commit `site/voice/` and `editions/*/voice/` and push.

If a clip is missing, the games fall back to the device's built-in voice.

## Installing on a tablet (PWA)

Yas's Games is an installable web app that works offline once installed.

- **iPad:** open the site in Safari → Share → **Add to Home Screen** (the 📲 button on the
  home page shows these steps).
- **Android:** Chrome shows an install prompt, or tap the 📲 button.

Offline mode and the Android install prompt need **HTTPS** (browsers only allow service
workers on secure sites). See *HTTPS* in [docs/homelab-setup.md](docs/homelab-setup.md).

## Run it locally

```bash
python3 -m http.server 8000 --directory site
```

Then open http://localhost:8000. To try it on the iPad, use your computer's IP instead of `localhost` while on the same Wi-Fi.

## Deploying

Pushing to `main` builds a Docker image, pushes it to `ghcr.io/milad665/yas-games`, and a
self-hosted runner on the homelab server pulls and restarts it. At the same time the public
edition is built and deployed to Firebase Hosting ([docs/public-site.md](docs/public-site.md)). Tags like `v1.2.0` also
create a GitHub Release. See [docs/homelab-setup.md](docs/homelab-setup.md) for the
one-time server setup, releases and rollbacks.
