# Google Ads campaign for Little Sparks

Search ads that reach **parents and teachers** who are looking for free, safe learning games
for young children, and send them to https://kids.studioaices.com.

Everything here is ready to import into **Google Ads Editor** (the CSV files), and it's all
written out below too, so you can type it into the web interface if you prefer.

| File | What's in it |
| --- | --- |
| `1-campaigns.csv` | 4 Search campaigns, budgets, dates, bidding, languages, locations (all start **Paused**) |
| `2-ad-groups.csv` | 18 ad groups (8 per English campaign, 1 Dutch, 1 Persian) |
| `3-keywords.csv` | 322 keywords (each one as phrase and exact match) |
| `4-negative-keywords.csv` | 51 negative keywords for every campaign |
| `5-responsive-search-ads.csv` | 18 responsive search ads (15 headlines and 4 descriptions each) |
| `6-sitelinks.csv`, `7-callouts.csv`, `8-structured-snippets.csv` | extra links and lines under the ads |

All text has been checked against Google's limits (headlines 30, descriptions 90, sitelinks 25/35,
callouts and snippet values 25, display path 15), and every landing page returns 200.

---

## 1. Before you start: things that matter for a kids' site

**Target grown-ups, never children.** Google doesn't allow personalised ads aimed at under-18s,
and children don't search for this anyway. Every ad is written for parents ("for kids aged 3 to 7",
"no ads", "no sign-up"). Don't add audience segments or age targeting below 18.

**Don't add the Google tag to the site.** The site promises *no tracking*, and that's one of its
best selling points for parents (and keeps it clear of children's-privacy rules like COPPA and
GDPR-K). So these campaigns don't use conversion tracking. Instead they use **Maximize clicks** with a
cost cap per click: you pay only for visits, and you judge success by clicks, cost per click and
how many people find the site through Google Search Console.

**Apply for Google Ad Grants if you can.** Registered non-profits get **US$10,000 per month of free
Search ads** ([google.com/grants](https://www.google.com/grants/)). A free educational project for
every child is exactly what it's for, but it needs a registered charity (for example a Dutch
*stichting* with ANBI status) and a Google for Nonprofits account. Worth it if you plan to keep
advertising: the campaigns below work in an Ad Grants account as they are.

**Words to avoid:** "best", "#1", "award-winning" (needs proof), competitor names (ABCmouse,
Khan Academy Kids, etc.) and trademarks such as "iPad" in ad text. None of the ads use them.

---

## 2. Campaign settings

**A 2-day test: €20 a day, 17–18 October 2026 (€40 in total).**

| Campaign | Daily budget | Max cost per click | Language | Locations |
| --- | --- | --- | --- | --- |
| LS \| Search \| EN \| Tier 1 | €9 | €0.60 | English | United States, United Kingdom, Canada, Australia, Ireland, New Zealand |
| LS \| Search \| EN \| World | €6 | €0.15 | English | India, Philippines, Nigeria, Kenya, South Africa, Pakistan, Ghana, Malaysia, Singapore, Uganda, Tanzania, Zambia, Jamaica |
| LS \| Search \| NL | €4 | €0.40 | Dutch | Netherlands, Belgium |
| LS \| Search \| FA (optional) | €1 | €0.30 | Persian | Canada, United States, Germany, United Kingdom, Sweden, Australia, Netherlands, Turkey, United Arab Emirates |

Together that's **€20 a day**. Each campaign has a **start date of 17 October 2026 and an end date of
18 October 2026**, so it stops by itself after two days. If you launch on another day, change both
dates in Editor (or under *Campaign → Settings → Start and end dates*); the end date is what makes it
stop.

**Keeping it to €40 in total:** Google may spend up to twice a daily budget on a busy day. Over two
days that can mean up to €40 on day one. To be sure it never goes over €40:

- If your account offers it, choose **Campaign total budget** instead of daily budget when you
  create the campaign (in the web interface: *Budget → Set a campaign total budget*), with
  €18 / €12 / €8 / €2 for the four campaigns, or
- check spending on the evening of day one and pause campaigns if they've already used most of €40.

If you skip the optional Persian campaign, add its €1 to the Dutch one.

With a budget this short there's no time for Google to learn, so **Maximize clicks with a cost cap**
is right: it simply buys as many relevant clicks as the budget allows. The cheapest clicks (and many
families who can't afford paid apps) are in the "World" campaign.

The English campaign is split in two because a click costs 5–10 times more in the US than in India
or Nigeria: one shared budget would be spent almost entirely in the expensive countries.

Persian ads can't be shown in Iran (Google Ads isn't available there), so the optional Persian
campaign reaches Persian speakers abroad. The games pick the language from the visitor's device,
so Dutch and Persian visitors hear their own language straight away.

Settings for **every** campaign:

- **Campaign type:** Search. **Goal:** Website traffic. No conversion goal.
- **Networks:** Google Search only. Turn **off** "Search partners" and **off** "Display Network".
- **Bidding:** Maximize clicks, with "Maximum cost per click bid limit" from the table.
- **Locations → Location options:** "Presence: people in or regularly in your targeted locations"
  (not "interest in").
- **Ad schedule:** all day to start. Later, look at *When and where ads showed* and lower bids at
  night if clicks are poor then.
- **Devices:** all. Parents search on phones; the games run on any phone, tablet or computer.
- **Automatically created assets:** off for now, so every ad says only what's written here.
- **Broad match keywords:** off (the keywords are phrase and exact match on purpose, to keep the
  small budget on the right searches).

---

## 3. Importing with Google Ads Editor (recommended)

1. Install [Google Ads Editor](https://ads.google.com/intl/en/home/tools/ads-editor/) and sign in.
2. **Account → Download** your account first.
3. Every file has an **Account** column with the customer ID `893-409-5478` (Editor needs it). For
   another account, change that column first. Then import the files **in order**, one at a time: **Account → Import → From file…** →
   `1-campaigns.csv`, then `2-ad-groups.csv`, and so on to `8-structured-snippets.csv`.
   After each one, check the **Review changes** screen and click **Finish and review changes →
   Keep**.
4. Open each campaign and check the settings from section 2 (networks, location options), since
   Editor sometimes keeps its own defaults for those.
5. Click **Post** to upload. Everything arrives **Paused**.
6. In the web interface, look at each ad's **Ad strength** and fix anything flagged, then
   **enable** the campaigns.

**What actually worked (17 October 2026):** these campaigns were set up with Google Ads' own web upload
(*Tools → Bulk actions → Uploads*) using the files in `without-account-column/`. Files 1, 2, 3, 5, 6 and 7
uploaded cleanly. The rest had to be done by hand in the website: the web upload ignores the
*Languages*, *Locations* and *Max CPC Bid Limit* columns on campaign rows (locations work as separate
`Campaign,Location` rows; "Turkey" must be "Türkiye"), rejects the negative keyword type (so the
negatives became one shared *negative keyword list*, "Little Sparks negatives", applied to all four
campaigns), and doesn't recognise the structured snippets file (not added).

Prefer the web interface? Create the campaigns by hand with the settings in section 2 and copy the
text from section 4 (and the keywords from `3-keywords.csv`).

---

## 4. The ads

### English: shared headlines and descriptions

Every English ad uses these 10 headlines, plus 5 of its own (below):

| # | Headline |
| --- | --- |
| 1 | Free Learning Games for Kids |
| 2 | Little Sparks: Kids Games |
| 3 | 100% Free, No Ads, No Sign-Up |
| 4 | 22 Creative Games, Ages 3-7 |
| 5 | No Reading Needed |
| 6 | Works Offline on Any Tablet |
| 7 | Play Right in Your Browser |
| 8 | Made for Little Fingers |
| 9 | Free for Every Child |
| 10 | No Tracking, No Accounts |

Descriptions (all 4 in every English ad):

1. 22 free creative and learning games for kids aged 3 to 7. No ads, no sign-up, no tracking.
2. Drawing, music, stories, letters, counting and coding. Every word is spoken aloud.
3. Works on any tablet or phone, even offline. Add it to your home screen in one tap.
4. Made with love and free for every child, everywhere. Start playing in seconds.

### English: ad groups

| Ad group | Lands on | Its own headlines | Example keywords |
| --- | --- | --- | --- |
| Free kids games | home page | Free Kids Games, Really Free · Free Games for Ages 3 to 7 · No In-App Purchases · No Ads Interrupting Play · Free Toddler & Preschool Games | free games for kids, kids games no ads, games for 4 year olds |
| Preschool learning | home page | Preschool Learning Games · Kindergarten Games, Free · Learn Through Play · Letters, Numbers, Patterns · Creative Early Learning | educational games for preschoolers, kindergarten learning games |
| Drawing and creativity | Magic Doodles | Free Drawing Games for Kids · Doodles That Come Alive · Paint a Picture, Hear a Song · Mirror Painting & Puzzles · Draw It, Watch It Move | drawing games for kids, art games for kids, music games for kids |
| Letters and ABC | Letter Trace | Free Letter Tracing Game · Trace All 26 Letters · Big and Small Letters · ABC Tracing for Little Ones · Learn Letters With a Finger | letter tracing for kids, abc tracing game, alphabet games for kids |
| Counting and numbers | Counting Garden | Free Counting Games for Kids · Count From 1 to 10 in a Garden · Plant, Harvest and Count · Patterns, Shapes & Numbers · Early Math Made Playful | counting games for kids, learn to count game, preschool math games |
| Coding for kids | Beep Boop Robot | Free Coding Game for Kids · First Steps in Coding · Program a Robot With Arrows · Build and Code Your Robot · Learn Sequencing and Debugging | coding games for kids, coding for preschoolers, robot coding game for kids |
| Feelings and kindness | Feelings Friends | Feelings Games for Kids · Name Feelings, Help Friends · Kindness and Empathy Stories · Social-Emotional Play, Free · Build Feeling Faces | emotions games for kids, social emotional learning games |
| Offline and tablet | home page | Kids Games That Work Offline · Free Tablet Games for Kids · Plays Without Internet · Add to Home Screen in 1 Tap · No App Store, No Download | kids games offline, tablet games for toddlers |

Display URL: `kids.studioaices.com/<path>` with paths like `free-games`, `drawing`, `letters`,
`counting`, `coding`, `feelings`, `offline`, `preschool`.

### Dutch (one ad group, lands on the home page)

Headlines: Gratis Leerzame Spelletjes · Little Sparks: Kinderspellen · Geen Reclame, Geen Account ·
22 Spellen voor 3 tot 7 Jaar · Lezen Is Niet Nodig · Alles Wordt Voorgelezen · Werkt Ook Zonder
Internet · Speel Direct in de Browser · Tekenen, Muziek en Verhalen · Letters, Tellen en Patronen ·
Gratis voor Ieder Kind · Veilig en Zonder Reclame · Voor Peuters en Kleuters · Op Elke Tablet of
Telefoon · Geen Download Nodig

Descriptions:

1. 22 gratis creatieve en leerzame spelletjes voor kinderen van 3 tot 7. Geen reclame.
2. Tekenen, muziek, verhalen, letters, tellen en programmeren. Alles wordt uitgesproken.
3. Werkt op elke tablet of telefoon, ook offline. Met één tik op je beginscherm.
4. Met liefde gemaakt en gratis voor ieder kind, overal. Begin meteen met spelen.

Keywords: gratis spelletjes voor kinderen, kinderspelletjes gratis, educatieve spelletjes
kinderen, leerzame spelletjes peuters, spelletjes voor kleuters, spelletjes zonder reclame,
tekenspelletjes kinderen, letters leren spelletje, tellen leren spelletje, programmeren voor kleuters…

### Persian (optional, one ad group, lands on the home page)

Headlines: بازی‌های آموزشی رایگان کودک · کاملاً رایگان، بدون تبلیغ · بدون ثبت‌نام و بدون ردیابی ·
برای کودکان ۳ تا ۷ ساله · با صدای فارسی · بدون نیاز به خواندن · نقاشی، موسیقی و قصه ·
حروف، شمارش و الگوها · بدون اینترنت هم کار می‌کند · روی هر تبلت و گوشی · Little Sparks ·
۲۲ بازی خلاقانه برای کودک · یادگیری با بازی · رایگان برای همه بچه‌ها · بدون دانلود، در مرورگر

Descriptions:

1. ۲۲ بازی خلاقانه و آموزشی رایگان برای کودکان ۳ تا ۷ سال. بدون تبلیغ و بدون ثبت‌نام.
2. همه‌چیز با صدای فارسی گفته می‌شود و کودک نیازی به خواندن ندارد.
3. روی هر تبلت و گوشی، حتی بدون اینترنت. با یک لمس به صفحهٔ اصلی اضافه کنید.
4. با عشق ساخته شده و برای همهٔ کودکان، همه‌جا، رایگان است.

Keywords: بازی کودکانه رایگان، بازی آموزشی کودک، بازی آموزشی پیش دبستانی، بازی برای کودک ۴ ساله،
نقاشی کودک آنلاین، آموزش حروف به کودک، بازی فارسی برای کودک…

### Extra lines under the ads (assets)

**Sitelinks (English):** Magic Doodles · Letter Trace · Beep Boop Robot · Music Painter · Counting
Garden · Story Theater, each with two short description lines and a link to that game.
**Sitelinks (Dutch):** the same games with Dutch descriptions.

**Callouts (English):** 100% Free · No Ads · No Sign-Up · No Tracking · Works Offline · No Reading
Needed · Ages 3 to 7 · English, Dutch, Persian · Any Tablet or Phone · No In-App Purchases
**Callouts (Dutch):** 100% Gratis · Geen Reclame · Geen Account Nodig · Werkt Offline · Lezen Niet
Nodig · 3 tot 7 Jaar · In het Nederlands
**Callouts (Persian):** کاملاً رایگان · بدون تبلیغ · بدون ثبت‌نام · با صدای فارسی · کار بدون اینترنت

**Structured snippets, header "Types":** Drawing, Music, Stories, Letters, Counting, Coding,
Puzzles, Feelings (Dutch: Tekenen, Muziek, Verhalen, Letters, Tellen, Programmeren, Puzzels).

**Image asset (add in the web interface):** upload `site/icon-512.png` as the square image and the
business name **Little Sparks** under *Assets → Business name & logo*.

### Negative keywords (every campaign)

Stops ads showing for searches that aren't looking for this, such as teen and console gaming,
downloads, printables, jobs and adult content: apk, mod, hack, cheats, unblocked, roblox,
minecraft, fortnite, poki, shooting, gun, war, zombie, horror, scary, adult(s), sex, casino,
gambling, betting, job(s), salary, developer, how to make, game design, template, worksheet(s),
printable, pdf, coloring pages, teen(s), high school, middle school, multiplayer, xbox,
playstation, nintendo, switch, steam, pc games, board games, toy(s), buy, login, sign in, cracked.

---

## 5. After launch

**Before the 2 days start:** submit the campaigns a day early. New ads are usually reviewed within a
day, and an ad still *Under review* on day one won't show.

**During the 2 days:** check for **Disapproved** or **Limited** ads (Ads → Status column), and the
**Search terms** report (Insights and reports → Search terms). Add anything irrelevant as a
negative keyword.

**If you continue after the test** (remove the end date, or copy the campaigns), over weeks 2–4:

- Look at click-through rate (CTR) per ad group. Under 3%? Rewrite that group's own headlines.
  Over 8%? Give that campaign more budget.
- In each ad, check **Asset details**: replace headlines rated "Low" after about 2 weeks.
- If a campaign rarely spends its budget, raise its cost-per-click cap a little (10–20%).
- Search terms that keep bringing clicks can become their own exact-match keywords.

**Measuring without tracking:** Google Ads shows clicks, cost and where they came from. Google
Search Console (set it up for the site, see `docs/public-site.md`) shows how people find the site
for free over time, which is the real long-term goal. Stripe shows whether visitors donate.

**Later ideas:**

- A **YouTube** video campaign aimed at parents: a 15-second screen recording of Magic Doodles
  coming alive works well. (Use a "Video views" goal; Google doesn't allow targeting children.)
- Seasonal headlines ("Rainy day? Free creative games for kids", "Long car trip? Works offline")
  in school holidays.
- More languages once German and Spanish voices are recorded: copy the Dutch campaign and translate.
