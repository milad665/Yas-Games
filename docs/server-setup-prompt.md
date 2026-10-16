You are setting up my homelab server so it automatically deploys a small static website from GitHub. You are running on (or have shell access to) that server. Work step by step, check before you change anything, and ask me before anything risky.

## Background

- Repo: https://github.com/milad665/Yas-Games (public). It is "Yas's Games", a static website with kids' games for my daughter, served by nginx in a Docker container.
- The pipeline is already written: `.github/workflows/deploy.yml` in the repo. Read it first so you understand what it expects.
  - A `build` job on GitHub's cloud runners builds a multi-arch image (linux/amd64 and linux/arm64) and pushes it to `ghcr.io/milad665/yas-games`, tagged `sha-<full commit sha>`, `latest`, and semver tags for `v*` git tags.
  - A `deploy` job runs on `runs-on: [self-hosted, homelab]`. It checks out the repo, logs in to ghcr.io with the job's `GITHUB_TOKEN`, then runs `docker compose -p yas-games -f deploy/docker-compose.yml pull` and `up -d`. Finally it curls `http://localhost:${PORT}/healthz`. PORT comes from the repo variable `HOMELAB_PORT` and defaults to 8080.
  - The container is named `yas-games` and publishes `${PORT:-8080}:80`.
- One deploy job is already queued on GitHub, waiting for a runner with the `homelab` label. Once the runner is online it should pick that job up by itself.

## Goal

Set up a GitHub Actions self-hosted runner on this server, registered to the `milad665/Yas-Games` repository with the label `homelab` and the name `homelab`. It must run as a service that starts on boot, as a non-root user that can use Docker. Then confirm that the queued deploy succeeds and the site is reachable.

## Steps

1. **Look around first. Change nothing yet.** Report back:
   - OS, version, CPU architecture (`uname -m`), and whether this is a VM, an LXC container or bare metal. On Proxmox LXC, check whether nesting is enabled, because Docker needs it.
   - Whether Docker Engine, the Docker Compose v2 plugin (`docker compose version`), `curl`, `git` and `tar` are installed.
   - Whether a GitHub runner is already installed, e.g. an existing `actions-runner` folder or `actions.runner.*` systemd services.
   - Whether port 8080 is already in use (`ss -ltnp`). If it is, tell me and suggest a free port.
   - Whether a reverse proxy (Caddy, Traefik, Nginx Proxy Manager, nginx) or a firewall (ufw, firewalld) is running.

   Then give me a short plan and wait for my OK before installing anything.

2. **Install the prerequisites if they're missing.** Use Docker's official repository or `curl -fsSL https://get.docker.com | sudo sh`, and make sure the Compose plugin is installed. Enable and start Docker. Don't touch existing containers.

3. **Create a dedicated user for the runner**, e.g. `github-runner`, with a home directory. Add it to the `docker` group. Don't give it passwordless sudo.

4. **Download and register the runner** as that user, in `/home/github-runner/actions-runner`:
   - Get the latest runner release for this architecture (x64 or arm64) from https://github.com/actions/runner/releases. Verify the SHA-256 checksum listed on the release page.
   - Get a registration token:
     - If the GitHub CLI is installed and logged in with admin access to the repo, run `gh api -X POST repos/milad665/Yas-Games/actions/runners/registration-token --jq .token`.
     - If not, ask me to get one. On GitHub I go to Settings → Actions → Runners → New self-hosted runner and copy the token from the `config.sh` command. Tokens expire after about 1 hour.
   - Configure it:
     `./config.sh --url https://github.com/milad665/Yas-Games --token <TOKEN> --name homelab --labels homelab --unattended --replace`
   - Never print the token back to me or save it in a file.

5. **Install it as a systemd service** for that user, using `sudo ./svc.sh install github-runner` and then `sudo ./svc.sh start`. Confirm with `sudo ./svc.sh status` that it's active and enabled on boot.

6. **Verify the whole flow:**
   - Have me check, or check with `gh` if it's available, that the runner shows **Idle** or **Active** at https://github.com/milad665/Yas-Games/settings/actions/runners.
   - Watch the queued "Build & Deploy" run until the `deploy` job finishes. If it already failed or expired, re-run it with `gh run rerun <id>` or `gh workflow run deploy.yml --repo milad665/Yas-Games`, or ask me to click "Re-run jobs".
   - On the server: `docker ps --filter name=yas-games` shows it running and healthy, and `curl -fsS http://localhost:8080/healthz` returns `ok`.
   - Give me the LAN address to open on the iPad, `http://<server LAN IP>:8080`. If a host firewall is active, tell me whether 8080 needs to be allowed on the LAN and ask before you open it.

7. **If something fails, diagnose it before you retry.** Common causes:
   - `permission denied /var/run/docker.sock`: the runner user isn't in the docker group, or the service needs a restart.
   - ghcr.io pull `denied`: package access for the repo is missing. Tell me to check GitHub → Packages → yas-games → Package settings → Manage Actions access.
   - Health check timeout: the port is in use. Suggest setting the repo variable `HOMELAB_PORT`.

## Rules

- Don't open router or WAN ports, don't expose the Docker socket over TCP, and don't run the runner as root.
- Don't modify or remove any existing containers, services or reverse-proxy configs unless I agree.
- Don't edit files in the GitHub repo. The pipeline is already done. If you think it needs a change, tell me what and why.
- Ask before every `sudo` step that installs packages, creates users, or changes firewall or system settings. Batching those questions is fine.
- At the end, give me a short summary: what you installed, where the runner lives, how to check its status and logs (`journalctl -u actions.runner.*`), and how to remove it if I ever want to.

## Optional extras (offer these, don't do them unprompted)

- A friendly LAN name (e.g. `games.home`) via my DNS (Pi-hole/AdGuard) or an existing reverse proxy.
- Automatic Docker image cleanup is already done by the pipeline (`docker image prune -f`), so no cron job is needed.
