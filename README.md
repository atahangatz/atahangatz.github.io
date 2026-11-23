# Duck Initiative — site

Static site, no build step. Open `index.html` in a browser (double-click works) or put the folder on any host.

```
index.html      home: hero tape, shelf, Polygraph, the cube (8 vs 24), Waddle, sign-up, contact, privacy
waddle.html     the Waddle shop: three aisles, one stocked
addons.html     Waddle, aisle 01: add-ons (Polygraph: trailer, what it does, editions and prices)
polygraph/      Polygraph's guide, press kit, licence and refunds (its own repository when live)
picker.html     staff room: design the workers
assets/css/site.css         all page styles and colour tokens
assets/css/story.css        home page scroll story: one block per scene, driven by --p
assets/js/story.js          sets --p per scene, scroll speed (--v) and the on-screen display
assets/css/addons.css       add-ons page extras
assets/css/extras.css       ducks, top bar, Polygraph notification, Waddle tab, worker stations, shop page
assets/js/ducks.js          the waddling ducks (every page except the picker)
assets/js/site.js           workers, VCR deck, shelf, Polygraph needle, tape effects
assets/js/workers.js        the workers' looks, jobs and lines (data only; the picker can replace it)
assets/js/workers-store.js  loads workers.js plus any looks saved in this browser by the picker
assets/js/duck-avatar.js    avatar engine (copy of ../duck-avatars/src/duck-avatar.js)
assets/brand/               logos copied from ../brand-kits
```

## Workers
Avatars are part of the design, each with a job: `operator` (hero), `courier` (walks the strip),
`clerk` (shelf), `inspector` (Polygraph), `shopkeeper` (Waddle), `rewinder` (footer).
Add one anywhere with `<button data-worker="clerk" data-pose="point" data-facing="left"></button>`
inside a positioned section, and place it with CSS.

Design their looks in `picker.html`. It saves to the browser as you go; **Download workers.js** and
replace `assets/js/workers.js` to make the looks permanent for every visitor.

## Logos
Duck Initiative and Polygraph files are used exactly as supplied. Only the Waddle mark is recoloured
(`waddle-mark-tile-site-duo.svg`: duck yellow on video blue).

## Fonts
Archivo Black, Besley, IBM Plex Sans and IBM Plex Mono are all served from `assets/fonts/` (and Archivo Black
and the two Plex faces again from `polygraph/fonts/`, so the Polygraph folder stands alone). All four are
under the SIL Open Font Licence, `fonts/OFL.txt`. No page loads anything from another site, which is what
the Privacy paragraph on the home page says. The one request that leaves is the visit count, below.

## Going live: two repositories
The live site is two GitHub Pages repositories, and this folder is laid out to drop into both.

- **Homepage repository (duckinitiative.com):** everything here except `polygraph/`. `CNAME`, `.nojekyll`,
  `favicon.ico`, `apple-touch-icon.png` and `img/` are the live ones, unchanged. `robots.txt`, `llms.txt`
  and `sitemap.xml` are new and belong at this repository's root. `404.html` and
  `newsletter/check-email/`, `newsletter/confirmed/` are restyled with the same words; they use absolute
  addresses (`/assets/fonts/...`), so they only look right on the server.
- **Polygraph repository (duckinitiative.com/polygraph/):** the contents of `polygraph/`. Copy them over the
  repository and keep its videos and GIFs: the archive this was built from had none, and the pages still
  point at the same file names (`polygraph-trailer.webm`, `polygraph-01-engine-vertex-count.mp4`, ...).
  `version.json` (read by the add-on's update check), `editions/`, `licence/`, the icons, `og.png` and
  `site.webmanifest` are the live files, untouched. New: `pg.css`, `pg.js`, `fonts/`.

## Search engines and AI search
All of this is invisible on the pages.

- `robots.txt`: everyone may crawl, except the three crawlers that only gather text to train models
  (GPTBot, ClaudeBot, Google-Extended). AI search that cites its sources (OAI-SearchBot, ChatGPT-User,
  PerplexityBot) is allowed by name. It also points at `sitemap.xml`. Both must sit at the root of the
  homepage repository; a robots.txt inside `/polygraph/` would be ignored.
- `llms.txt`: a plain Markdown summary of the studio, Polygraph's facts and prices, and where each page is.
- `sitemap.xml`: the seven public pages. Update `lastmod` when a page changes. `pond.html` and `picker.html`
  are marked `noindex` and left out.
- IndexNow: `4e63042861bc3e25a5aae4fbc267c64e.txt` at the root is the key. `.github/workflows/indexnow.yml`, here
  and in the Polygraph repository, tells Bing and the other IndexNow engines when a page in `sitemap.xml`
  changes. Run it by hand from the Actions tab to send every page, for example on launch day.
- Every public page has a canonical address, Open Graph and Twitter tags, and a JSON-LD block in its head:
  Organization and WebSite (home), SoftwareApplication with the three editions as offers (home, add-ons,
  guide), TechArticle (guide), WebPage and BreadcrumbList (the rest).
- **Prices and dates live in several places.** When one changes, change it in: `addons.html` (the cards and
  the JSON-LD), `index.html` and `polygraph/index.html` (JSON-LD), `polygraph/press/index.html` (fact table)
  and `llms.txt`.
- Not added, because the site has nothing true to put in them: FAQPage (no page is written as questions and
  answers), Article and Person (no blog and no named authors).

## Speed and accessibility
Fonts are preloaded and served locally; the hero film on the home page is fetched only when its scene is one
screen away (`assets/js/launch.js`) and never for visitors who asked for less motion or less data; images
below the fold load lazily and carry their sizes. The tape shelf is a group of toggle buttons
(`aria-pressed`), each Polygraph page has one banner, and no page draws a grid pattern behind its content.

## Polygraph pages
`polygraph/index.html` (guide), `press/`, `license/`, `refunds/`. Their text, links, tables and pictures are
the live pages' own, word for word: `pg.css` restyles them and `pg.js` adds the extras (clips that play only
on screen and each have a pause button, the contents list marking where you are, a finder over the budgets
table, copy buttons on the press descriptions). With scripts off everything still reads and works.
Links between pages are clean (`license/`); when the site is opened from a folder the scripts add
`index.html` so they still open.

To change the words, edit the HTML directly. Prices and dates also appear on `addons.html` (the edition
cards) and `index.html`; the lines marked `data-after` switch to their "out now" wording by themselves on
December 8, 2026, Istanbul time (`assets/js/launch.js`).

## Home page story
`index.html` is one tape. Each `<section data-scene="NAME">` is taller than the screen and holds a
`.pin` that sticks while you scroll through it. `story.js` writes `--p` (0 at the start of the scene,
1 at the end) onto the section, and the CSS in `story.css` turns that number into motion. To retime a
scene change its `height`; to add one, copy a section, give it an id and style it from `--p`.
Scenes: insert tape, title, what we make, pick a tape, Polygraph, Waddle.
On phones, short windows and reduced-motion settings pinning is off and every scene shows finished.

## Top bar, Waddle and the notification
`site.js` builds the top bar on every page (set `data-page="home|waddle|addons"` on `<body>`): home button,
a scrolling "now playing" display, and the Waddle button with its aisle menu. Add-ons sit inside Waddle.
`data-notify` on `<body>` shows the Polygraph notification; it leaves after the first two scenes and
stays dismissed for the visit. Edit its text in `site.js`.

## Ducks
`ducks.js` adds a mother duck and ducklings that waddle along the bottom of the page, follow the pointer,
run when you scroll fast and dive when clicked. Add `data-no-ducks` to `<body>` to switch them off.

## Music
`audio.js` plays a built-in lo-fi loop made in the browser (no audio file). It starts from the MUSIC button
on the tape deck, because browsers block sound until the visitor clicks. The pitch bends when you scroll
fast and the tracking slider adds wobble. To use your own track, put the file in `assets/audio/` and set
`SRC` at the top of `audio.js`.

## Feeding the ducks
The FEED button on the tape deck throws bread; the ducks race for it and the count shows on the button.
Every eight crumbs a new duckling joins (up to nine ducks, five on phones). The count lasts for the visit.

## Links
`assets/js/links.js` holds the social and shop links shown in the right-hand rail and the footer.
Paste each address in; an entry with no address shows greyed out.

## Visit counts
GoatCounter counts visits and outbound clicks, without cookies. Dashboard: duckinitiative.goatcounter.com.

- `assets/js/count.js` is GoatCounter's own script, copied here so nothing loads from elsewhere. It doesn't update
  itself: now and then, replace it with a fresh copy of https://gc.zgo.at/count.js.
- `assets/js/clicks.js` sends one event for each click on a link that leaves the site, named after where it goes:
  `click/gumroad/polygraph`, `click/superhive/polygraph`, `click/extensions/polygraph`, `click/press-kit/<file>`,
  `click/mail/support`, and `click/out/<site>` for the rest. The buttons themselves carry nothing extra.
- Every public page, the Polygraph pages and the two newsletter pages load both scripts just before `</head>`.
  A new page needs the same two lines. The 404 page, `pond.html` and `picker.html` are left uncounted.
- Newsletter sign-ups show up as visits to `/newsletter/check-email/`; Buttondown has the confirmed number.
