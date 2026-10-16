# Yas's Games 🎨

A little collection of creative, no-reading-needed games for Yas, made for the iPad.

| Game | What it is |
| --- | --- |
| **Magic Doodles** | Draw anything with your finger, tap ✨, and it comes alive with googly eyes and hops, flies, swims, floats or crawls around one of five worlds. |

## Project layout

```
site/                     ← everything that gets served
  index.html              ← the Yas's Games home page (game list lives here)
  icon.png                ← home-screen icon
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
3. Add it to the `GAMES` list near the top of the script in `site/index.html`:

   ```js
   {
     name: 'My New Game',
     path: 'games/my-new-game/',
     art: '🦄',
     extras: ['⭐', '🌈'],
     colors: ['#ffd6a5', '#ffadad'],
   },
   ```

4. Commit and push to `main`. The pipeline deploys it to the homelab.

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
