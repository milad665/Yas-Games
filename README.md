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

## Project layout

```
site/                     ← everything that gets served
  index.html              ← the Yas's Games home page
  sw.js, manifest.webmanifest, icon-*.png  ← installable app + offline support
  shared/games.js         ← the list of games
  shared/lines.js         ← every spoken line, English + Dutch
  shared/voice.js         ← plays the recorded voice clips
  shared/kit.js, kit.css  ← common buttons, sounds, sparkles and saving for games
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
3. To make it speak, load the shared voice and add its lines to `site/shared/lines.js` (English + Dutch):

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
     art: '🦄',
     extras: ['⭐', '🌈'],
     colors: ['#ffd6a5', '#ffadad'],
   },
   ```

5. If you added lines, record them: `node tools/record-voice.mjs` (see below).
6. Commit and push to `main`. The pipeline deploys it to the homelab.

## Voice (English + Dutch)

Every spoken line lives in `site/shared/lines.js`. The language switch (🇬🇧/🇳🇱) on the
home page applies to all games. Lines are pre-recorded with natural Apple voices so they
sound the same on every device and work offline:

1. On the Mac: **System Settings → Accessibility → Spoken Content → System voice →
   Manage Voices…**, then download an English voice, e.g. **Zoe (Premium)** or **Ava (Premium)**,
   and a Dutch voice, e.g. **Xander (Enhanced)** or **Claire (Enhanced)**.
2. Record (only new or changed lines are re-recorded):

   ```bash
   node tools/record-voice.mjs
   ```

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
