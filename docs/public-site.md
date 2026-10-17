# The public site (Firebase)

Every push to `main` deploys two editions of the games:

| Edition | Where | What's different |
| --- | --- | --- |
| **Yas's Games** | the homelab (Docker) | `site/` as it is: her name in Letter Trace, her birthday in Cake Shop |
| **Little Sparks** (public) | Firebase Hosting | no mention of Yas anywhere, search-engine friendly, a 💝 donate button |

`tools/build.mjs` makes the public edition from `site/`. It swaps in a `shared/edition.js` with no
child in it, drops every line marked `kid: true` in `lines.js` (and its voice clips), renames the site
and its storage keys (from `editions/public/site.json`), adds titles, descriptions, social cards,
structured data, `robots.txt` and `sitemap.xml`, and adds `editions/public/home.html` (the grown-ups'
section and donate button) to the home page. **The build fails if "Yas" is left anywhere in it.**

To try it locally:

```bash
node tools/build.mjs public && python3 -m http.server 8001 --directory dist/public
```

## Keeping Yas out of the public edition

- Write games so the personal parts come from `self.EDITION.kid` (see Letter Trace and Cake Shop).
- Lines that say her name get `kid: true` in `lines.js`, plus a neutral line for everyone else.
- The site name and comments are fine: "Yas's Games", `yasGames` and `yas-` are renamed automatically.
- If the build stops with "still mentions Yas", it lists the file and line.

## One-time setup

### 1. Firebase project

1. Create a project at <https://console.firebase.google.com> (no Google Analytics needed) and open
   **Build → Hosting → Get started** once.
2. Create a deploy key: Google Cloud console → **IAM & Admin → Service accounts** for that project →
   **Create service account**, give it the roles **Firebase Hosting Admin** and
   **API Keys Viewer**, then **Keys → Add key → JSON**.

   (Or run `npx firebase-tools init hosting:github` in this folder; it makes the key and stores it as a
   GitHub secret for you. Say no when it offers to write its own workflow files.)

### 2. GitHub settings

In the repository → **Settings → Secrets and variables → Actions**:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `FIREBASE_SERVICE_ACCOUNT` | the whole JSON key file |
| Variable | `FIREBASE_PROJECT_ID` | the project id, e.g. `little-sparks-games` |
| Variable | `PUBLIC_SITE_URL` | optional: overrides `url` in `editions/public/site.json` (`https://kids.studioaices.com`) |
| Variable | `STRIPE_DONATE_URL` | the Stripe Payment Link below (leave it out and there's no donate button) |

### 3. Donations with Stripe (any amount)

1. In the Stripe Dashboard → **Payment Links → New**.
2. Choose **Customers choose what to pay**, set a suggested amount (e.g. 5) and a minimum (e.g. 1),
   and name the product something like "Donation to Little Sparks".
3. Optionally turn on **Adaptive Pricing** so people pay in their own currency.
4. Copy the link (`https://buy.stripe.com/...`) into the `STRIPE_DONATE_URL` variable.

Nothing secret goes into the site: the button only opens that link. Grown-ups press and hold 💝 for a
second to open it, like the ⚙️, so children don't wander onto a payment page.

### 4. Search engines

After the first deploy:

1. Add the site in [Google Search Console](https://search.google.com/search-console) and
   [Bing Webmaster Tools](https://www.bing.com/webmasters) (verify with an HTML file in
   `editions/public/static/` or a DNS record if you use your own domain).
2. Submit `https://<your site>/sitemap.xml` in both.

### 5. The domain: kids.studioaices.com

The site is built for `https://kids.studioaices.com` (canonical links, sitemap, social cards), set by
`url` in `editions/public/site.json`. To point the domain at Firebase:

1. Firebase console → Hosting → **Add custom domain** → `kids.studioaices.com`.
2. At the DNS provider for `studioaices.com`, add the records Firebase shows (for a subdomain
   usually a `CNAME` or `A` record for `kids`, plus a `TXT` record to prove ownership).
3. Wait for Firebase to say **Connected**; it sets up the HTTPS certificate itself (minutes to a
   few hours).

Until then the site is also at `https://<project>.web.app`, which the pipeline's health check uses.
