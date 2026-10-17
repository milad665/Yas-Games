# Yas's Games 🎨

A little collection of creative, no-reading-needed games for Yas, made for the iPad.

| Game | What it is |
| --- | --- |
| **Magic Doodles** | Draw anything with your finger, tap ✨, and it comes alive with googly eyes and hops, flies, swims, floats or crawls around one of five worlds. |
| **Beep Boop Robot** | Build your own robot from parts, then program it with arrow cards to reach its battery. Teaches sequencing and debugging. |
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
  shared/lines.js         ← every spoken line, in English, Dutch, German, Spanish and Persian
  shared/voice.js         ← plays the recorded voice clips
  shared/kit.js, kit.css  ← common buttons, sounds, sparkles and saving for games
  shared/saved.js         ← photos and drawings kept on the device (IndexedDB)
  shared/robot.js         ← the robot drawing used by the robot games
  voice/                  ← recorded clips (made by tools/record-voice.mjs)
  games/
    magic-doodles/index.html
Dockerfile, nginx.conf    ← container that serves site/
deploy/docker-compose.yml ← how the homelab runs it
.github/workflows/        ← build & deploy pipeline
docs/homelab-setup.md     ← one-time server setup guide
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
     group: 'think',          // its row on the home page: make, think, words or pretend
     art: '🦄',
     extras: ['⭐', '🌈'],
     colors: ['#ffd6a5', '#ffadad'],
   },
   ```

5. If you added lines, record them: `node tools/record-voice.mjs` (see below).
6. Commit and push to `main`. The pipeline deploys it to the homelab.

## Voice (English, Dutch, German, Spanish, Persian)

Every spoken line lives in `site/shared/lines.js`. The language switch (🇬🇧 🇳🇱 🇮🇷) on the
home page applies to all games (German and Spanish are translated but switched off until they're
recorded: see `LANGS` in `site/shared/voice.js` and `site/sw.js`, and the flags in `site/index.html`).
Lines are pre-recorded with ElevenLabs (Jessica; Matilda for Persian) so they sound the same on
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
3. Commit `site/voice/` and push.

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
self-hosted runner on the homelab server pulls and restarts it. Tags like `v1.2.0` also
create a GitHub Release. See [docs/homelab-setup.md](docs/homelab-setup.md) for the
one-time server setup, releases and rollbacks.
