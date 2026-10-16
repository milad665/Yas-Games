# Homelab deployment setup

Every push to `main` builds a Docker image on GitHub, stores it in GitHub's container
registry (GHCR), and then a **self-hosted GitHub Actions runner on your homelab server**
pulls that image and restarts the site.

```
 git push ──► GitHub Actions (cloud)          ──► ghcr.io/milad665/yas-games:sha-…
               build multi-arch image                       │
                                                            ▼
              GitHub Actions runner (your server) ──► docker compose pull && up -d
                                                            │
                                                            ▼
                                              http://<server>:8080  (Yas's Games)
```

Why a self-hosted runner? The runner connects *out* to GitHub, so you don't have to open
any ports on your router or hand GitHub an SSH key to your server.

You do this setup once. It takes about 15 minutes.

---

## 1. Prepare the server

You need a Linux machine (Ubuntu/Debian/Raspberry Pi OS etc.), x86-64 or ARM64, with
Docker, the Compose plugin and `curl`.

Check what's already there:

```bash
docker --version && docker compose version && curl --version | head -1
```

If Docker is missing, install it with Docker's official script:

```bash
curl -fsSL https://get.docker.com | sudo sh
```

Let your user run Docker without sudo (log out and back in afterwards):

```bash
sudo usermod -aG docker $USER
```

> Running Proxmox? Do all of this inside a small Debian/Ubuntu VM or LXC container
> (for LXC, enable "nesting" so Docker works).

## 2. Install the GitHub Actions runner

1. On GitHub, open **milad665/Yas-Games → Settings → Actions → Runners → New self-hosted runner**.
2. Pick **Linux** and your architecture (**x64**, or **ARM64** for a Raspberry Pi).
3. On the server, run the **Download** commands GitHub shows you (they create an
   `actions-runner` folder).
4. For the **Configure** step, use GitHub's command but add the `homelab` label
   (the pipeline looks for it). It looks like this, with the token GitHub gives you:

   ```bash
   ./config.sh --url https://github.com/milad665/Yas-Games --token <TOKEN-FROM-GITHUB> --name homelab --labels homelab --unattended
   ```

5. Install it as a service so it starts on boot:

   ```bash
   sudo ./svc.sh install $USER
   ```

   ```bash
   sudo ./svc.sh start
   ```

6. Back on the GitHub Runners page you should now see **homelab** with a green
   **Idle** dot.

## 3. Lock things down (the repo is public)

The pipeline only runs on pushes, tags and manual runs, never on pull requests, so
strangers can't run code on your server. Add this as a second safety net:

- **Settings → Actions → General → "Approval for running fork pull request workflows
  from contributors"** → choose **Require approval for all external contributors**.

(Alternatively, make the repository private. Everything still works the same.)

## 4. Optional settings

- **Different port:** the site listens on **8080** by default. To change it, go to
  **Settings → Secrets and variables → Actions → Variables** and add
  `HOMELAB_PORT` (e.g. `80`).
- **Approve each deploy:** **Settings → Environments → production** →
  enable **Required reviewers** and add yourself. Deploys then wait for a click.

## 5. First deploy

If you pushed before the runner existed, the deploy job is waiting in the queue. It will start
on its own once the runner is online. Otherwise, go to **Actions → Build & Deploy → Run workflow**.

When it's green, open `http://<server-ip>:8080` on the iPad. In Safari,
tap **Share → Add to Home Screen** and Yas gets an app icon that opens full screen.

---

## Everyday use

| I want to… | Do this |
| --- | --- |
| Deploy my latest changes | `git push` to `main` |
| Make a named release | `git tag v1.1.0` then `git push origin v1.1.0` — builds image `1.1.0`, deploys it, creates a GitHub Release with notes |
| Roll back | **Actions → Build & Deploy → Run workflow**, enter an older tag in *image_tag* (e.g. `1.0.0` or `sha-<commit>`) |
| See what's running | `docker ps --filter name=yas-games` on the server |
| See logs | `docker logs yas-games` |

## Nice extras

- **A friendly address** instead of an IP: if you run Pi-hole/AdGuard, add a local DNS
  record such as `games.home` → your server IP. If you run a reverse proxy (Caddy,
  Traefik, Nginx Proxy Manager), point it at `http://<server-ip>:8080`.
- **Saved drawings live on the iPad** (in Safari's storage for this address), not on the
  server. Keep the same address over time or Yas's creatures won't be found.

## HTTPS (needed for offline play and app install)

Browsers only run the offline service worker on secure sites. On `http://<server-ip>:8080`
the games still work and the iPad's **Add to Home Screen** still gives a full-screen app,
but it won't work offline, and Android won't offer to install it. Pick one of these:

- **Tailscale (easiest if you use it):** on the server run
  `tailscale serve --bg 8080`. You get `https://<machine>.<tailnet>.ts.net` with a real
  certificate. Install Tailscale on the tablet too.
- **Your own domain + reverse proxy:** point e.g. `games.example.com` at the server's LAN IP
  in your local DNS, and let Caddy, Traefik or Nginx Proxy Manager fetch a Let's Encrypt
  certificate with a DNS challenge. Proxy it to `http://<server-ip>:8080`.
- **Caddy with its own local certificate:** works, but you must install and trust Caddy's
  root certificate on the tablet (Settings → General → About → Certificate Trust Settings).

> Saved drawings, robot designs and progress are stored per web address, and an installed
> iPad app keeps its own storage separate from Safari. Choose the final address first, then
> install the app from that address.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Deploy job stuck on *"Waiting for a runner to pick up this job"* | Runner is offline or missing the `homelab` label. Check `sudo ./svc.sh status` in `actions-runner/`. |
| `permission denied … /var/run/docker.sock` | The runner's user isn't in the `docker` group. Run `sudo usermod -aG docker <user>`, then `sudo ./svc.sh stop && sudo ./svc.sh start`. |
| `denied` when pulling from ghcr.io | On GitHub open your profile → **Packages → yas-games → Package settings → Manage Actions access** and make sure **Yas-Games** is listed. |
| Health check fails | Something else uses the port. Set `HOMELAB_PORT` to a free port (see step 4). |
