# Yas's Games 🎨

A little collection of creative, no-reading-needed games for Yas, made for the iPad.

There is also **Lilli & Liam**, the same games for Lilli and her little brother Liam in Germany:
a switch on the home page picks whose games they are (the title, their name in Letter Trace, their
birthday in Cake Shop and every spoken line follow it). German by default (English, Dutch and
Persian too), hosted on their family's homelab.
And a public edition for every child, **Little Sparks**, with Yas taken out, a donate button and
search-engine friendly pages. See [docs/public-site.md](docs/public-site.md).

| Game | What it is |
| --- | --- |
| **Magic Doodles** | Draw anything with your finger, tap ✨, and it comes alive with googly eyes and hops, flies, swims, floats, crawls, rolls or bounces around one of ten animated cartoon worlds. Tap the scenery (the volcano erupts, the rocket launches, the cow moos), drop treats, throw a dance party, or sweep everyone away with 🧹 (↩️ brings them back). |
| **Space Discovery** | Start at home on real satellite photos and zoom out until the whole Earth floats in space (real day and night, city lights, the real Moon phase), look up at the real sky from home, then fly to the Moon, the Sun, every planet, the asteroids, a comet and the stars. Sizes are true to scale. Grown-ups add family and friends' homes in ⚙️ (behind the grown-ups' question); they appear as faces to fly to. See *Space Discovery* below. |
| **Story Books** | Picture books from the Global Digital Library, read aloud in English, Dutch, German or Persian while every word lights up. Tap a word to hear it again, tap things in the pictures to hear what they are, colour in the black-and-white books with crayons, and answer a picture question at the end. See *Story Books* below. |
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
  books/                  ← the Story Books: books.js (the shelf), <slug>/book.json, pictures and recordings
  voice/                  ← recorded clips (made by tools/record-voice.mjs)
  games/
    magic-doodles/index.html
editions/public/         ← the public edition: name, home page extras for grown-ups
editions/lili/           ← Lilli & Liam's edition: the children, languages, their own lines and clips
tools/build.mjs           ← builds an edition into dist/ (node tools/build.mjs yas|lili|public)
tools/import-books.mjs    ← imports picture books from the Global Digital Library into site/books/
firebase.json             ← how Firebase serves the public edition
Dockerfile, nginx.conf    ← container that serves one edition (--build-arg EDITION=yas|lili)
deploy/docker-compose*.yml ← how the homelabs run it (Yas's, and .lili for Lilli's)
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
   that say her name get `kid: true` (see [docs/public-site.md](docs/public-site.md)). If Lilli
   and Liam should hear their own version, add it as `<key>@lilli` and `<key>@liam` to
   `editions/lili/lines.js`.
7. Commit and push to `main`. The pipeline deploys it to both homelabs and the public site.

## Voice (English, Dutch, German, Spanish, Persian)

Every spoken line lives in `site/shared/lines.js`. The language switch on the
home page applies to all games. Each edition picks its languages with `langs` (and the first-visit
language with `lang`) in its `edition.js` / `site.json`: Yas's has 🇬🇧 🇳🇱 🇮🇷, Lilli's 🇩🇪 🇬🇧 🇳🇱 🇮🇷.
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

## Story Books

The books come from the [Global Digital Library](https://digitallibrary.io) (GDL), the open library of
children's books run by Norad (the Norwegian Agency for Development Cooperation) and the Global Book Alliance.
Each book was made by its publisher (Book Dash, Room to Read, Pratham Books, ...) and is free to use under
**CC BY 4.0**: we may translate, change and use it anywhere, also on the public site, as long as we credit the
authors, illustrators, publisher and the GDL, link the licence and say what we changed. The shelf names the
GDL, and ℹ️ in every book shows its full credits, a link to the original and the changes. Books under
NonCommercial or NoDerivatives licences are not used (`tools/import-books.mjs` refuses them).

- **Adding a book:** find it on digitallibrary.io and take the last part of its link (`/book/<slug>/`), then
  `node tools/import-books.mjs <slug>`. That downloads its EPUB, checks the licence and writes
  `site/books/<slug>/` (pictures resized, `book.json` with the English text and the credits) and adds it to
  `site/books/books.js`. Then write its Dutch, German and Persian text, the `spots` (things to tap: `x`, `y` and
  `r` in percent of the picture, and the `word` said) and one or two `quiz` questions (the right page among
  `choices`) into `book.json`, and record. `"colouring": true` gives a black-and-white book crayons.
- **Reading:** `node tools/record-voice.mjs` records the books along with the games' lines (`--book <slug>`
  for just one book), with the time of every word so the words light up as they're read. The books' narrators:
  Jessica (English), Ruth (Dutch, a native Dutch storyteller), Lucy Fennek (German), Matilda (Persian); the
  books' list is `BOOK_VOICES` in the tool. A word said in several pictures of a book is recorded once.
- **Offline:** after the voice clips, the offline cache downloads every book's pictures and its reading in the
  chosen language.
- **Colouring** is saved per child as the taps (where, which crayon), not as pictures.

## Space Discovery: maps and pictures

- **Earth from space, city lights, Moon:** NASA Blue Marble, Black Marble and LRO (public domain), kept in
  `site/games/space-discovery/` so space works offline.
- **Close-up photos:** Esri World Imagery tiles, loaded live (needs the internet; the credit line shows on the
  map). Esri's terms are meant for non-commercial use like this, with the credit shown; check them again
  before anything commercial, or swap `TILE_URL` in the game for another provider (for example EOX Sentinel-2 cloudless 2016, CC BY 4.0,
  which shows towns but not single houses).
- **Satellites:** the ISS, Tiangong, Hubble, a GPS satellite and Meteosat at their real positions and heights
  right now, with their orbits drawn. Orbits come from CelesTrak (at most every 6 hours, saved on the device;
  the game has a copy for offline use) and satellite.js (MIT, kept in the game folder) works out positions.
- **Day and night** follow the real Sun to within about a minute (the US Naval Observatory's formula,
  including the equation of time).
- **Address search** (grown-ups' places): OpenStreetMap Nominatim, only when a grown-up searches.
- **Places** are saved on the device (shared by brothers and sisters), never sent anywhere.
- Every size is true to every other (the Sun is 109 Earths wide, Jupiter 11), and so is the Moon's distance
  (60 Earth radii). Only the distances from the Sun are squeezed, about 90 times, or the planets would be
  too tiny to find.
- 🔭 *Our sky*: standing at home (or wherever the map is zoomed in), the real sky right now: the Sun and the
  Moon (real phase, real size; ➕ zooms in like binoculars) and, once it's dark, the planets where they
  really are. Tap one to blast off from the house and fly there.

## Children's birthdays

Cake Shop has the child's own birthday ("Yas is turning five!"). Grown-ups set each child's date of
birth in ⚙️ settings on the home page, and the age then moves on by itself (until it's set, the `age`
in the edition settings is used). The age lines are recorded for ages 1 to 10 (`cs.age.kid.<age>`).

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
