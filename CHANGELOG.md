# Changelog

All notable changes to poops-docs-theme are recorded here. Releases up to 1.1.2
predate this file and are on the
[releases page](https://github.com/stamat/poops-docs-theme/releases).

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
the theme uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Contributing an entry

Write your change under `## [Unreleased]`, grouped under `### Added`,
`### Changed`, `### Fixed`, `### Deprecated`, `### Removed` or `### Security`.
Give the heading a short title after an em dash and open with one paragraph
saying what was wrong before:

```markdown
## [Unreleased] — the sidebar remembers where you were

Navigating between pages scrolled the nav tree back to the top.

### Fixed

- ...
```

Write it for the person upgrading the theme. This package ships markup, styles
and script that a site already depends on, so call out anything that changes
**the DOM a layout produces**, **a CSS custom property or class an author may be
overriding**, or **the shape of `poops.json` a consumer needs** — none of those
show up in a function signature.

On `script/publish`, `script/changelog` cuts this section into a released entry
in the same commit as the version bump, and the entry becomes the body of the
GitHub release verbatim.

## [Unreleased]

## [4.4.1] - 2026-08-21 — the topbar tooltips drop their caret

The bubbles naming the icon buttons carried a triangle pointing back at the
button under them. On a row of small square buttons with the bubble already
sitting directly below the one it belongs to, the triangle aims at something
nobody had to look for, and it is the only pointed corner in a bar built out of
flat rectangles. This is taste, not a bug — nothing was misplaced.

### Changed

- **`<tooltip-elemental>` bubbles in the topbar have no caret.** The element's
  theme draws it as two positioned pseudo-elements, so the theme turns those off
  with `content: none` rather than shrinking `--tooltip-elemental-caret` to zero,
  which would still leave two boxes and a border-width rim behind. CSS an author
  may be overriding: `--tooltip-elemental-caret` is still declared by the
  element's own theme and still does nothing here — putting the caret back means
  restoring `content` on `tooltip-elemental:defined > [role="tooltip"]::before`
  and `::after`, not setting the size again. No markup and no bundle changes, and
  the gap between button and bubble is unchanged.

  Checked by building and reading the compiled `dist/css/docs.min.css`: the rule
  is present and lands after the element theme's caret block, so it wins the
  cascade at level specificity. `npm run lint:css` is green. Not checked in a
  browser.

## [4.4.0] - 2026-08-21 — the docs pill can point somewhere else, or come off

### Added

- **`site.docsUrl` is where the `docs` pill next to the title goes**, and `false` takes the
  pill off the bar. It was hardcoded to `docs/` under the site root, which is right for a
  site with a landing page in front of its docs and wrong for one whose docs *are* the root:
  there the pill points at a directory nobody built, on every page of the site —
  [book-of-elementals](https://github.com/stamat/book-of-elementals) shipped 32 pages with a
  header link 404ing on all of them. Unset still means `docs/`, so a site that never sets the
  key sees no change; a string is site-relative and picks up the page's path prefix like
  every other url in the bar. DOM: with `false` the `<a class="brand-docs">` is absent rather
  than hidden, so a stylesheet reaching for it finds nothing rather than something invisible.

  Checked by rendering the macro against each state — unset, `false`, `""`, a path of its
  own, and the `prose` layout that has never had the pill — and reading the href out of the
  markup. The `preview/` site keeps its docs under `docs/` and so exercises the default only,
  which is the shape it was already testing.

### Changed

- **`code-preview-element` moves to `^3.0.2`**, which stops a sample too wide for
  its column reflowing the moment the element upgrades. CodeJar writes
  `white-space: pre-wrap` and `overflow-wrap: break-word` inline on the block it
  takes over, so an overflowing line scrolled sideways before upgrade and wrapped
  after it — one extra visual line for each, under a height reservation that could
  not see it coming. Editable blocks wear both from the start now, the same
  treatment `3.0.1` gave the editor's padding. The sibling-pane hide crosses the
  same line: keyed off `.is-tabbed` rather than `:defined`, so the later fences
  cannot stand on the page for the one frame between upgrade and the tab strip
  taking over.

  Nothing in the theme changes for it — the element stays a devDependency, in
  neither bundle and not a dependency of the published package, and the three
  collisions [Live samples](README.md#live-samples) settles are the same three.
  Checked here that the copy landing in `preview/dist/vendor` carries both rules,
  and that build, `npm test`, `npm run lint`, `npm run lint:browsers`,
  `npm run lint:es` and `npm run a11y` are green on it. The reflow itself is
  upstream's measurement, not one taken again here.

## [4.3.0] - 2026-08-17 — the drawer hangs off the bar with no seam

Opening the hamburger left a hairline between the bar and the menu under it. The
boxes were flush — that line was the header's own bottom border, and with the
same surface on both sides of it it read as a slit between two panels rather than
as an edge against the page.

### Fixed

- **The theme switch is already on when the page opens dark.** A visitor whose
  last choice was dark got a topbar switch painted in the *off* position over a
  page that had already painted dark, and then watched the knob slide across on
  its own a moment later. Measured on a docs site built with this theme: the
  button is on screen in the wrong state for two frames, about 90 milliseconds,
  before it corrects itself with the full 250ms transition.

  The boot script in `<head>` was never the problem — it stamps `data-theme`
  before first paint, as it always did. The switch was being seeded from it at
  `DOMContentLoaded`, and registering `<switch-elemental>` is what takes the
  button out of the `display: none` it wears until it is defined. Registration
  happens at the top of the bundle and four more elements register after it, so
  the button was on screen, off, for the whole gap.

  **`topbar.html` now declares the starting state on the element**, as
  `checked-if="[data-theme=dark]"`, and the bundle no longer seeds anything. The
  element reads that selector at upgrade — before its button comes out of the
  `display: none` it wears while undefined — so no load order can be wrong. What
  `setupTheme()` is left with is the two directions between the switch and the
  root attribute, below.

  **`checked-if` arrived in `book-of-elementals` 0.11.0**, which is why the floor
  moved to `^0.11.1` below. On an older one the attribute is inert and the switch
  starts off, which is the bug above rather than a crash.

  Verified in Chromium over a built site, sampling every rendering opportunity:
  the switch carries the right state in every frame, with no transition fired at
  load. Before, it was wrong for the first two frames and then slid.

- **The theme switch follows a theme changed from somewhere else.** It only ever
  listened to its own flips, so a page carrying a second toggle — a docs page
  demonstrating one in its prose, say — could leave the header switch saying "on"
  over a page that had gone light: two controls for one setting, disagreeing, which
  is the thing the drawer code refuses to create by never copying the switch. A
  `MutationObserver` on the root's `data-theme` now moves it, and the write is
  idempotent, so it and the flip listener cannot chase each other.

- **The header's border width and the drawer's step past it are one number.** The
  drawer hangs off `<navbar-elemental>`'s padding box, which is inside the border
  the header draws, so it steps down by that border's width to hand the line back
  whole. Written out as `1px` in both places, those were two numbers that could be
  rewritten one at a time — and a step shorter than the line leaves part of the
  line above the panel, a step longer leaves a strip of header between the two.
  Either way it reads as a gap between the bar and the menu it opened.

  **New custom property, `--topbar-border`**, shipped at `1px` and used for both
  of the header's rules and the drawer's step. Override it in device pixels only:
  a sub-pixel border is painted at the width of a whole device pixel while a
  sub-pixel margin is honoured as written, so `0.0625rem` against a `62.5%` root
  is a 1px line with a 0.625px step past it, and the remainder is the hairline
  this exists to prevent. A px-to-rem pass over this stylesheet has the same
  effect and is the reason to keep the value literal.

- **The topbar no longer flickers between a bar and a drawer at one width.** On
  a band of widths — 864px to 928px on this repo's own preview site, and
  wherever your links, labels and font put it on yours — the bar folded, sprang
  back and folded again, 72 mode changes in 600 milliseconds, for as long as the
  window sat there. The theme was moving the icon links and the theme switch into the
  drawer whenever `<navbar-elemental>` said it had stacked, and that move freed
  the room the element measures the links against: they fitted, the bar came
  back, the controls returned, the links stopped fitting. The element measures a
  copy of its row precisely so nothing can invalidate its own measurement; this
  invalidated it from the outside.

  **The controls now follow the breakpoint rather than the drawer** — the
  `media` attribute in `topbar.html`, read off the element so it is still
  declared once. Below it they ride into the drawer as before. Above it they
  stay on the bar, including at the widths where the links have folded away on
  their own: a media query cannot be changed by moving a button, so there is no
  loop left to enter. Between 40rem and wherever your links fold, this is a
  visible change — the icon links and the switch are on the bar where they used
  to be in the drawer, and a long `site.brand` truncates sooner for it.

### Changed

- **`book-of-elementals` moves from `^0.7.2` to `^0.11.1`.** The floor had to
  move for `checked-if` above, and what comes with it is that release's war on
  first-paint flashes. Progressive-enhancement markup is authored expanded —
  every navbar link visible, the tooltip's words a sentence in the flow — and it
  painted that way until the bundle collapsed it. The structure stylesheets now
  split that pre-upgrade rendering on `@media (scripting)`: scripting off keeps
  the old fallback, scripting on paints the closed state the upgrade is about to
  wire. The theme switch and the copy button change the other way — they were
  `display: none` until `:defined`, so the row they sit in closed up and reopened
  when they landed, and with scripting on they now hold their box with
  `visibility: hidden` instead: no click, no tab stop, no announcement, but no
  reflow either.

  **The trade is upstream's and it is worth knowing.** With scripting *on* and
  the bundle never arriving — blocked, 404, a syntax error in a sibling script —
  the closed state is what stays on screen, with nothing left to open it. The
  `scripting` fallback covers scripting turned off, not every way a script can
  fail to run. The navbar is the one to watch: whether it is a bar or a drawer is
  the `media` attribute's call and no stylesheet can read it, so a page about to
  stack shows a row for the length of the fetch.

  No DOM changed and nothing this theme styles moved. Between 0.7.2 and 0.11.1
  upstream also added `<slider-elemental>`, `<progress-elemental>`,
  `<marquee-elemental>` and `<tilt-elemental>`, and none of them is in here: the
  theme imports subpaths, so what it does not name is not bundled. Built both
  ways, the cost of the upgrade is 768 bytes of JS on each bundle — `checked-if`,
  which both import — and 831 and 699 bytes of CSS on `docs` and `prose`, which
  is the `@media (scripting)` split. Build, tests, `npm run lint` and
  `npm run a11y` are green on the new floor. The flash itself is upstream's
  measurement, not one taken again here.

- **The browser gate no longer fails on `@media (scripting)`.** The compiled CSS
  carries the new query fourteen times, and `npm run lint:browsers` failed on
  every one: caniuse's `css-media-scripting` is still a working draft with every
  engine marked unsupported. It is wrong. Measured with Playwright,
  `(scripting: enabled)` matches in Chromium 151, WebKit 26.5 and Firefox 153 —
  the whole of `.browserslistrc` and then some. Only `scripting: initial-only` is
  unimplemented anywhere, and nothing here uses it. `css-media-scripting` joins
  the ignore list in `stylelint.browsers.config.js` with those engines named in
  the comment, which is the first entry there that is a stale datum rather than a
  feature degrading to nothing — `CONTRIBUTING.md` says so now.

- **`code-preview-element` moves to `^3.0.1`**, which closes a seam under the code
  strip and stops a preview shifting the page twice while its manifest loads.
  Nothing in the theme changes for it — the element stays a devDependency, in
  neither bundle and not a dependency of the published package, and the three
  collisions [Live samples](README.md#live-samples) settles are the same three.
  It is here because the README tells a consuming site to add the element itself,
  and this is the floor worth adding. Measured on the mock's **Live samples** page
  at 1200×900 in Chromium: CLS 0.0000 over the load, and the console strip's
  padding resolves to the asymmetric `0px 0px 4px` the fix ships.

- **A code block reads at the size of the prose around it**, without moving off
  16px. It was already the same number as the body text and still looked a size
  larger: the mono face carries a taller x-height, and x-height is what the eye
  measures. `font-size-adjust: ex-height` now scales the glyphs against the body
  face's ratio — to 94% of it, because mono sets wider and carries heavier stems,
  so matching the x-height outright still leaves the block reading a size up.
  That is 13% down from 16px for the default stack, the same 14px inline code
  takes. `font-size` stays where it was, because that is the value iOS Safari
  reads before it zooms the page on a focused field, and a `code-preview` pane
  can make a block one.

  **New custom property, `--font-body-ex`**, the x-height of `--font-body` as a
  fraction of its font-size, shipped at `0.508` for the default stack. Override
  `--font-body` with a face of a different x-height and override this with it, or
  code will read slightly large or small beside the prose — the 94% above is the
  theme's and rides on whatever you set here. Before Safari 16.4 and Chrome 127
  the property is ignored and a block keeps the size it had.

## [4.2.0] - 2026-08-11 — the icon links say what they are

A row of glyphs told a sighted reader nothing a screen reader was not already
being told. The npm mark, the package cube, an emoji someone pasted in for a chat
room — the name was in `aria-label`, where a mouse and a pair of eyes never reach
it.

### Added

- **`site.iconLinks` and the GitHub button carry a tooltip**, shown on hover and
  on focus by
  [`<tooltip-elemental>`](https://stamat.github.io/book-of-elementals/elementals/tooltip.html),
  dismissed with Escape. The words are the `title` you already write: the element
  takes the attribute over so the browser's own tooltip cannot double up, and
  writes those same words back as `aria-label`, which is where they were before.
  Nothing to configure and no new key in `poops.json`.

  A touch screen has no hover, and the element ignores pointer events coming from
  one rather than half-handling them, so a tap opens a link instead of a bubble.
  Nothing is lost: the name is on the link the whole time, which is what a screen
  reader reads either way. With scripting off the browser draws the native tooltip
  from the `title` the element never came to claim.

  **New DOM in the topbar.** Each icon link is now
  `tooltip-elemental > a.icon-btn + span`, and the glyph inside the link is
  wrapped in `<span aria-hidden="true">` — `icon` may be an emoji or a pasted
  `<svg>`, and text the name computation can read would otherwise leave a link
  called "💬" described as "Discord". That wrapper is `display: flex`, so it is
  the size of the glyph rather than a line box with the glyph on its baseline —
  inline, it lands the icon a few pixels above the middle of its button. A site
  styling `.topbar-actions > .icon-btn` should drop the `>`; `.icon-btn` itself is
  unchanged.

  **New custom properties.** `--tooltip-elemental-surface`,
  `--tooltip-elemental-color` and `--tooltip-elemental-border-color` are
  re-pointed at `--fg` and `--bg`; the element's own default is `CanvasText` on
  `Canvas`, which follows the operating system rather than the switch in the bar.
  The bubble is also lifted to `z-index: 30`, over the drawer it can be opened
  inside.

### Fixed

- **A quote in a page's `description` no longer truncates the description.**
  Poops renders with `autoescape` off, so the hand-written
  `content="{{ page.description or page.excerpt or site.description }}"` shipped
  front matter verbatim — and one `"` in a sentence closed the attribute, leaving
  the page described by the words before it. Both layouts now use Poops'
  `description` filter, which reads the same chain and escapes what it emits:

  ```nunjucks
  {{ page | description(site) }}
  ```

- **Every other value written into an attribute is escaped.** Same cause, same
  silence, and none of it needed a filter — both engines ship `escape`. `lang`,
  `data-theme`, `robots`, the edit-link `href`, the brand and nav link `href`s and
  titles, and the footer's package links all go through it now, as does the
  `<title>` element, where a `<` opens a tag rather than ending a value. The
  favicon's `site.brandMark` gets `urlencode` instead: it sits inside a `data:`
  URI, which wants URI encoding, not entities.

  Site-owned front matter and config, so this was a footgun rather than a
  vulnerability — unless a site takes docs pages by pull request, where front
  matter is somebody else's input.

### Changed

- **`poops >=2.5.0` is now the peer range**, up from `>=2.0.0`. The `description`
  filter arrived in 2.5.0, and an older Poops raises an unknown-filter error
  rather than skipping it quietly.

## [4.1.0] - 2026-08-10 — a docs page says when it was last touched

The edit-link row asked readers to fix the page and told them nothing about how
stale it was. A page nobody has revised since a rewrite two versions ago reads
exactly like one corrected this morning.

### Added

- **`docs` renders a `Last updated:` line at the left of the edit-link row**
  whenever a page has `updated` in its data — hand-written in front matter, or
  filled in for every page by Poops ≥ 2.4.0's `markup.options.lastUpdated`, which
  dates pages from a committed index of content hashes rather than from git or an
  mtime a clone destroys. A page without `updated` renders no line, and the edit
  link stays exactly where it was. The date prints as `MMM D, YYYY` beside a
  machine-readable `<time datetime>`; the format is the theme's, not a new config
  key.

  **New DOM and a new class.** The row is now `.edit-link-row > p.last-updated +
  a.edit-link`, and it renders for a page carrying `updated` but no
  `repo`/`filePath` to link to — a case that previously rendered nothing at all.
  `.edit-link-row` gained `align-items`, `flex-wrap` and `gap`; it still ends
  flush right, with `.last-updated` pushed away from it by its own auto margin.
  Below `40rem` the row turns into a centred column instead — wrapped, the date
  hugging the left edge and the button the right read as two unrelated things. A
  site overriding either class should look at it once.

### Changed

- **The icon links and the theme switch go into the drawer with the links.** On a
  phone the bar held a brand, a search field, every `site.iconLinks` button, the
  GitHub link, the theme switch and a hamburger — so the title truncated to a few
  characters to pay for controls the drawer under it had room for. They now move
  into the drawer as the row under the links, and move back onto the bar when
  `<navbar-elemental>` measures its way out of stack mode. Search stays: it is
  already an icon at that width and expanding it is the reason to keep it in reach.

  **Moved, not copied.** One `<switch-elemental>` in the page at every width, so
  there is never a second switch left saying the theme is off while the page is
  dark. With scripting off there is no drawer either, and the controls stay on the
  bar exactly as before.

  **New DOM and a moved custom property.** In stack mode the row gains a final
  `<li class="drawer-actions" data-navbar-stack>` holding those controls —
  `data-navbar-stack` keeps it out of the element's measurement, so it never
  competes with a link for room on the bar. `--actions-inset` is now declared on
  `.topbar > navbar-elemental` rather than on `.topbar-actions`: read from the
  group the switch has just left, the padding it sets would compute to nothing. A
  site overriding it on `.topbar-actions` still gets what it asked for on the bar
  and should set it on the bar instead.

## [4.0.2] - 2026-08-10

### Fixed

- Bumps `book-of-elementals` to `^0.7.2` to pick up a fix for listboxes pointer events not
  working on iOS

## [4.0.1] - 2026-08-10

### Fixed

Issue where the search results would stack on a row and not wrap properly that was fixed in
book-of-elementals 0.7.1. This theme now depends on the version carrying the fix.

## [4.0.0] - 2026-08-10 — the search box was a text field with a div under it

Arrow keys did nothing. Enter did nothing. The panel had no role, the field never said it had
a popup, and results appearing in it announced nothing at all — a change a sighted reader
watches happen and a screen reader user is told nothing about, which is
[WCAG 2.2 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html) unmet. The
only way through a hit was the pointer.

The index behind it was fetched on every docs page whether or not anybody searched, and if
the file was not there the failure was swallowed: from then on every query answered
**No results**, which is a true sentence about a search that never happened.

The search index poops writes is every page's front matter copied out verbatim, and the
theme dropped a result's title, description and url straight into `innerHTML`. A `<img
src=x onerror=…>` in one page's `title:` therefore ran on every page of the site, since the
search box is in the topbar.

The default footer also credited Poops and stopped there, so the layout, styles and script a
visitor is actually looking at had no name anywhere on the page. The 💩 trailed after the
sentence as a full stop of its own, and a screen reader read it out as "pile of poo".

### Added

- **The search field is `<search-elemental>` and `<suggest-elemental>`**, which is the whole
  keyboard the panel never had: <kbd>↓</kbd> and <kbd>↑</kbd> walk the results and wrap,
  <kbd>Home</kbd> and <kbd>End</kbd> reach the ends once a row is under the cursor and stay
  with the caret until then, <kbd>Enter</kbd> follows the row, <kbd>Escape</kbd> closes. The
  cursor is `aria-activedescendant` rather than focus, so typing carries on while you look,
  and the field now reports itself as a combobox with a popup instead of as a plain text box.
  A settled search says `5 results`, `No results` or `Search failed` in a `role="status"`
  region — the announcement the panel filling itself never made.

  Two more things the reader gets: **<kbd>Escape</kbd> empties the field** rather than only
  closing the panel, and **focus leaving empties it too** — this field is in the topbar of
  every page, so a query left in it outlives the results it fetched, and on a phone a field
  with something in it will not fold back into its icon.

  The DOM changes, and a site with its own rules for it needs them: `#search-results` is gone.
  The panel is `suggest-elemental[open]` holding `ul > li > a[role="option"]`, the wrapper is
  `search-elemental.search` carrying `data-state`, and the row classes `.sr-title` / `.sr-desc`
  are unchanged inside it. `.sr-empty` still exists but has moved out of the panel and is now
  `p.sr-note.sr-empty` (see below). The panel's look is the element's optional theme with
  `--suggest-elemental-surface`, `--suggest-elemental-active`, `--suggest-elemental-radius`,
  `--suggest-elemental-inset` and `--suggest-elemental-max-height` pointed at this theme's
  tokens; anything that styled `.search-results` directly wants those instead.

  Measured against the same build before the change, `docs.min.js` grows by 8.4KB and
  `docs.min.css` by 3.5KB — minified, before compression, and everything in this entry
  included.

- **The search field has a clear button a keyboard can reach.** `<input type="search">` gets a
  cross of its own in Chromium and Safari, none in Firefox, and the one it gets is drawn by
  the non-standard `::-webkit-search-cancel-button` — mouse-only, no tab stop, and absent from
  the accessibility tree. It is switched off with `appearance: none` and replaced by
  `button.search-clear`: the octicon x at the magnifier's weight and distance from its end of
  the field, a 24px target around a 16px glyph, `aria-label="Clear the search"`, and a focus
  ring, because a control you can tab to and cannot see you have reached is
  [2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) unmet.
  It is `visibility: hidden` while the field is empty, which takes it out of the tab order with
  the look. Pressing it empties the field and hands the caret back.

  The field is 2rem of padding at both ends now, and the pending spinner moved one control
  inward to `--search-elemental-spinner-inset-inline: 2rem` so the two never share a corner.

- **The empty and failed searches are drawn as well as spoken.** `p.sr-note.sr-empty` says
  **No results** and `p.sr-note.sr-error` says **Search failed**, in a box under the field,
  shown by `data-state` alone with no script involved. The words are `empty-text` and
  `error-text` on the element, so what a reader sees and what the live region reads out is one
  sentence rather than two that can drift.

  They sit outside the panel, which is the one place this theme departs from the element's own
  advice: a `listbox` may only own `option`s, so a "No results" row inside the panel is
  `aria-required-children` — critical, and `script/a11y` fails the build on it. Measured, not
  assumed: the row was written that way first and the sweep caught it.

- **`/` and ⌘K / Ctrl+K put the cursor in the search field.** The field was reachable by
  pointer or by tabbing the length of the topbar, and every docs site a reader arrives from
  answers to one of these. The slash is ignored while an `<input>`, `<textarea>`, `<select>`
  or a `contenteditable` holds focus — it is a character somebody may be mid-word in — and the
  modifier pair works from inside a field, where it selects what is already typed. Shift is
  where it stops — `Ctrl+Shift+K` opens the web console and stays the browser's. What the two
  do cost is Firefox's quick-find and its `Ctrl+K` search bar, and Chrome's `Ctrl+K`
  address-bar search, on a docs page. Nothing was added to the markup: no hint sits beside the
  field.

- **A grouped section in the mock site, and poops 2.3 to build it with.** `Kitchen sink` and
  `Live samples` now carry `navGroup: Samples`, poops 2.3's front-matter grouping — the pages
  stay where they are, urls and breadcrumbs unchanged, and only the sidebar gains the heading.
  Filler with a job: a group is a section node with no page of its own, so it is the first
  thing in the mock to render the `navtree.html` branch that omits the **Overview** link —
  every other section there has an index page. The sweep and the unit suite cover it now
  rather than by claim. `poops` moved to `^2.3.0` as a devDependency only; the peer range
  stays `>=2.0.0`, because the theme reads the tree as data and an older poops just leaves the
  field unread.

### Changed

- **`search-index.json` is fetched on the first query, not on page load.** The field is in the
  topbar of every docs page and most visits never type in it, so the request went out for
  everybody and paid off for a few. The first search of a visit now waits for the network and
  gets a spinner while it does; every one after it answers from an index already in memory.

- **The search field is 2.2rem tall**, set rather than left to fall out of its padding and the
  16px iOS floor, which came to 2.6rem — the tallest thing in a bar standing next to 2.25rem
  icon buttons.

- **`book-of-elementals` moves to `^0.7.0`** from `^0.5.0`, which is where the two search
  elements arrive. Nothing this theme already used changed shape: the hover tint the 0.6
  release evened out across the book is re-pointed at `--bg-alt` here and always was.

- **The default footer names poops-docs-theme beside Poops**, and the 💩 moved in front of
  the Poops link with `aria-hidden="true"` on it, so it reads as decoration rather than as a
  word. Both layouts change; a site setting `site.footer` renders its own html and is
  untouched.

### Fixed

- **A missing search index says so instead of reporting no results.** `fetch` resolves on a
  404, and the load was wrapped in a `catch` that threw the error away — so a site that never
  generated `search-index.json`, or one whose file was briefly unreachable, had a search box
  that answered every query with **No results** for the rest of the visit. The response is
  checked, the failure reaches the element as a rejection, and the field says **Search failed**
  in the box and in the live region. The failed load is dropped rather than remembered, so the
  next keystroke tries again.

- **The mobile drawer no longer slides itself shut on page load.** Closed is the state the
  drawer _arrives_ in — `<disclosure-elemental>` writes it at upgrade — but the transform
  transition was live from the first frame, so on a load where the script landed after the
  first paint (a cold cache, a slow phone) the browser animated the difference between the
  rail the stylesheet had already drawn and the closed drawer the script asked for. The
  transition rules now key off a `sidebar-nav-ready` class that `docs.js` puts on
  `#sidebar-nav` when the toggle is first tapped, so a drawer nobody has touched cannot
  travel. That first tap still slides — the class goes on before the element writes the state,
  with a reflow between them. Counting animation frames instead was tried and measured: a
  closed panel painted for two frames still slid in from nothing when the rule arrived.
  Crossing the breakpoint before any tap now snaps instead of sliding, which is what the
  element already does with the state itself. A site overriding
  `#sidebar-nav { transition: … }` needs the class in its selector now.

- **Escape no longer closes the sidebar rail on a wide screen.** Escape and the scrim are the
  light dismiss a drawer over a scrim wants and the disclosure pattern does not owe it — but
  the keyboard is on the page at every width, and `<disclosure-elemental>` writes `open` from
  its `media` query only when the query _changes_. A query that still matches changes nothing,
  so Escape above 60rem closed the rail and nothing put it back: the navigation was gone for
  the rest of the visit, with the toggle that would reopen it `display: none` at that width.
  The close now returns early while the element reports `data-mode="pinned"`, which covers the
  scrim as well as the key.

### Security

- **Search results are built as nodes, so front matter cannot become markup.** The row is now
  the one place the index is crossed from data into DOM: `title` and `description` go in as
  `textContent`, and the url is resolved against the page and dropped unless its scheme is
  `http:` or `https:` — `href` takes a `javascript:` url as readily as a path. An entry that
  fails that check is left out of the list rather than rendered as a dead link. `.sr-title` and
  `.sr-desc` still name the two pieces of a row, though the box around them moved with the
  panel — see the search entry under _Added_. Authoring markup in a `title:` and expecting it
  to render never worked in the sidebar or the `<title>` either; it now does not work here.

## [3.1.1] - 2026-08-07 — a sidebar three levels deep was not a list any more

A nav nested three levels deep put a `<ul>` directly inside a `<ul>`, with no `<li>` between
them. Invalid HTML, and the counts a screen reader reads out of a list come from that
nesting — so the third level and everything under it was announced wrong. Two levels were
fine, which is why nothing caught it: the mock site stopped at two, so `script/a11y` never
rendered the markup and reported green over a branch it had never seen.

### Fixed

- **`navtree.html` emits a valid list at any depth.** The per-node `<li>` moved into its own
  `navnode` macro and the recursion goes through that, so a nested section arrives as an
  `<li>` rather than as the `<ul>` the old `navtree` call opened with. Only sites with three
  or more nav levels produced the broken markup; their DOM changes, everything shallower is
  byte-identical.

### Added

- **A third nav level in the mock site.** `preview/src/docs/guide/deep/` — a section inside
  `Guide` and one leaf under it. Filler pages, but they are what makes the recursive branch
  of `navtree.html` render at all, and reverting the fix now fails the sweep with
  `list (serious)` on every page instead of passing.

## [3.1.0] - 2026-08-07 — the theme audits itself

Nothing measured this theme's own accessibility. The unit suite runs in jsdom, which has no
layout and no colours, and the sweep in
[book-of-elementals](https://github.com/stamat/book-of-elementals) deliberately audits the
`<code-preview>` iframes and excludes the pages around them — because those pages are this
theme's markup, and reporting them there would file this repo's bugs against that one. The
hole was exactly the shape of the chrome: the topbar, the drawer, the nav tree, the prose
styles and every contrast ratio in the palette.

### Added

- **`script/a11y` — axe over the preview site, in Chromium.** Each page as served, then with
  everything that says it is closed opened, then with the search panel showing hits and
  again showing its empty state. The document-level rules stay on, which is the opposite
  call from the sibling sweep and for the opposite reason: a landmark, a skip link, a title
  and a `lang` are a fragment's business nowhere and this theme's business exactly.

  **Two viewports, not one.** The bar folds into a drawer below `40rem` and the sidebar
  toggle only exists below `60rem`, so the markup a phone gets is markup a desktop never
  renders. A sweep at one width audits half the theme and reports as though it did all of
  it. Two themes as well, seeded through `localStorage` before the page loads rather than
  set on the document after: the boot script reads that key and the topbar switch seeds
  itself from what it chose, so setting `data-theme` by hand would audit a dark page with a
  switch still reporting itself off — a disagreement the sweep would have introduced and
  then measured.

  It also fails on an `aria-controls`, `aria-labelledby`, `aria-describedby` or
  `aria-activedescendant` naming an id no element has. axe will not decide that one — a
  collapsed toggle may legitimately point at a panel not in the document yet — so a typo in
  one otherwise fails no run anywhere. None are dangling today.

  Contrast axe cannot compute, over a pseudo element or under something overlapping it, is
  printed by rule and by reason rather than guessed at. New devDependencies: `axe-core` and
  `playwright-core` — the same pair the sibling repo uses, `playwright-core` being the one
  that ships no browser, so `npm ci` does not download one.

  It found 161 violations across four rules on the first run. They are the **Fixed** list
  below, and CI now runs the sweep, so the count stays at nought.

- **A skip link, first in the body of both layouts.** Reaching the prose from a keyboard meant
  tabbing the whole topbar first — brand, `docs` pill, search, every `site.links` entry, the
  GitHub link, the theme switch — and on a docs page the entire nav tree after it: every
  heading of every section, on every page, before the one you asked for. That is
  [WCAG 2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG22/Understanding/bypass-blocks.html),
  and the sweep above did not catch it: axe's `bypass` rule is satisfied by a `<main>`
  landmark, which both layouts have had all along.

  Off-screen until focused rather than `display: none` — a hidden element is out of the tab
  order, which is the one thing this link cannot be. No script: `:focus` _is_ the keyboard
  intent, and a pointer never reaches the link to see it.

  **DOM change:** both layouts gain `<a class="skip-link" href="#content">` as the first child
  of `<body>`, and `<main class="content">` gains `id="content"` and `tabindex="-1"`. A site
  already using `#content` has a duplicate id to resolve. The `tabindex` is what makes the
  jump land: a fragment pointing at an element that cannot take focus moves the viewport and,
  in Safari, leaves focus on `<body>` — so the next Tab goes back to the topbar the link just
  skipped. **CSS change:** `.content:focus` drops the focus ring with it, because the theme's
  2px outline drawn around the whole column reads as breakage rather than as focus arriving.

### Fixed

- **Syntax highlighting and admonition titles now meet AA, in both themes.** The light code
  scheme ran 2.8:1 to 4.0:1 on `--bg-code` — a set of hues chosen against each other rather
  than against the surface behind them. Each is now the same hue darkened until it clears
  4.5:1, keeping 75% to 92% of what it was, so the scheme still reads as itself. The dark
  scheme was already 6.2:1 to 11.5:1 and is untouched.

  Admonitions were worse and failed at both ends, because `--adm` is one value doing three
  jobs: the border, the 7% tint behind the title, and the title's own text. One mid-range hue
  cannot be text on a white tint _and_ text on a dark one — `important` read at **1.8:1** in
  light, `caution` at 3.7:1 in dark. Light now takes a darkened set and dark keeps the
  original where it already cleared. Yellow is the one that could not keep its face: nothing
  about a 7%-tinted white leaves room for `#fab005`, so `important` is a dark gold in light
  now. **CSS change:** the `--adm` values, and a site overriding them should recheck its own.

- **The dark code scheme reaches a reader whose dark mode came from the OS.** The token
  colours were under `:root[data-theme="dark"]` alone, while `_base.scss` sets its own tokens
  under that _and_ `prefers-color-scheme`. With the script blocked the attribute never lands,
  so the surface went dark and the syntax colours stayed light — the one pairing neither set
  had been measured against. Both now come from one mixin applied in both places.

- **A code block and a wide table can be scrolled from the keyboard.** Both scroll sideways
  and neither could be reached without a pointer: nothing inside a `pre` takes focus, since
  the copy button is a sibling in the wrapper rather than a child. Both now take
  `tabindex="0"`. Unconditionally, not from a measurement — whether the content is wider than
  the column is a question the viewport answers, and an answer taken once is wrong at the
  first resize. **DOM change:** `.prose pre` and `.prose table` gain `tabindex="0"`.

- **The phone search field no longer leaves focus underneath itself.** Opening it expands it
  across the whole topbar, by design — but the brand, the nav toggle and the icon links stayed
  in the tab order behind it, so tabbing out of the field put focus on a GitHub link no one
  could see. That is WCAG 2.2's Focus Not Obscured (2.4.11), and it was a tap target too: axe
  measured 1px of the nav toggle left uncovered. Everything the open field covers is now
  `visibility: hidden` for as long as it covers it, which takes it out of the tab order and
  the accessibility tree together.

- **The heading permalink is not a tab stop on nothing.** Poops writes it `aria-hidden="true"`
  and focusable, so a keyboard landed on it once per heading with nothing to announce. Fixed
  at the source in [poops](https://github.com/stamat/poops), but `poops` is a peer at
  `>=2.0.0` and the versions this theme supports include the ones that write it — so the
  theme repairs it on load as well, and is measured green against a build that has not got
  the fix. That patch goes when the peer floor rises past the fixed release.

## [3.0.1] - 2026-08-05 — the landing page stops saying its name twice

A page whose front matter `title` matched `site.title` — which a one-page site's landing
page usually does — rendered `<title>Hydrargyri · Hydrargyri</title>`. The suffix went on
whenever `page.title` was set at all, without asking what it was being appended to.

### Fixed

- **The site name is not appended to itself.** Both layouts add the ` · {{ site.title }}`
  suffix only when `page.title` differs from it; when the two match, the tab, the bookmark
  and the search result read the name once. A page with no `title` is unchanged, and so is
  every reference page, whose title differs by definition. `og:title` was never affected —
  poops emits `page.title or site.title` there, with no suffix.

## [3.0.0] - 2026-08-05

### Added

- **`<kbd>` is styled in prose.** Nothing painted it before, so a key name rendered as
  body text and read as the word beside it. It takes the inline-code sizing — `--bg-alt`
  fill, `--font-mono`, `0.8em`, `nowrap` so a key never wraps mid-name — plus a cap edge:
  a 1px border and a `0 2px 0` shadow under it, both from `--kbd-edge`. That is a local
  mix of `--fg` into `--border`, which darkens on light and lightens on dark; a fixed
  color would have vanished into one theme or the other. A chord nests per the spec —
  `<kbd><kbd>Ctrl</kbd> + <kbd>C</kbd></kbd>` — where the outer element groups rather than
  names a key, so `:has(kbd)` takes the cap off it and leaves the inner two.

  **CSS:** the selector is `.prose kbd`. `--kbd-edge` is declared on that rule rather than
  on `:root`, same as `--adm` on admonitions, so a site retuning the edge sets it in its
  own `.prose kbd` block — setting it higher up will not reach.

### Changed

- **The copy button on a code block is `<copy-elemental>` now.** The one the theme drew
  itself did the visible half and none of the other. It swapped an icon to a tick and told a
  screen reader nothing at all, which is
  [WCAG 2.2 SC 4.1.3 Status Messages](https://www.w3.org/WAI/WCAG22/Understanding/status-changes.html)
  unmet — and a clipboard write that failed swapped nothing, so a refused copy and a button
  nobody pressed looked exactly alike. Both halves are what the element exists for, so the
  theme takes it rather than growing a live region of its own. **`book-of-elementals` is
  `^0.5.0`** (was `^0.4.0`), which is the release the element arrived in.

  **What a reader gets:** the tick is said out loud as well as drawn; a failed copy is red
  and says **Copy failed** in the same corner tooltip the success uses; and on a page served
  over plain `http`, where `navigator.clipboard` does not exist to be asked, there is no
  button rather than one that quietly does nothing. What lands on the clipboard is also
  trimmed now — leading newlines and trailing whitespace, so a pasted block does not run its
  last command on arrival, and indentation is left alone.

  **DOM this changes:** the `.code-wrap` around each `.prose pre` stays. Inside it the
  button is now
  `<copy-elemental for="…"><button data-tip data-tip-error></button></copy-elemental>`, plus
  the `<span role="status">` the element appends for the announcement. The button has lost
  its `.copy-btn` class and its two inline `<svg>`s — the icon is a CSS mask. A `<pre>` with
  no `id` is given `code-block-N`, since `for` is how the element finds what to copy; an id
  the page already uses is stepped over rather than taken.

  **CSS this changes:** every `.copy-btn` rule is gone, and a site overriding one is
  overriding nothing. The button is `copy-elemental > button`, its states are
  `copy-elemental[data-state="copied"]` and `[data-state="error"]`, and the stand-down inside
  a live sample is `code-preview copy-elemental { display: none }`. The look is the element's
  own theme with four properties re-pointed: `--copy-elemental-surface` to `--bg`,
  `--copy-elemental-border-color` to `--border`, `--copy-elemental-hover` to `--bg-alt`,
  `--copy-elemental-icon-size` to `1rem`. `Canvas` is what the first of those had been —
  the UA's page colour, which is a shade off this theme's own on a dark page.

- **The sidebar drawer inherits 0.5's `<disclosure-elemental>` fixes.** Its region — which
  here is `#sidebar-nav` — is now `display: flow-root`, so a region whose first or last child
  carries a margin no longer slides open past where it sits and snaps back, and it carries
  `data-state="open"` / `"closed"` alongside `hidden`. Nothing in this theme moves: the rail's
  inset is on `.sidebar > .nav` and nothing in there was collapsing a margin out through the
  edge. A site that gave the region a `display` of its own still wins — the rule is one
  class — but one leaning on a child margin escaping it has that to put back.

### Fixed

- **Tapping the search field no longer zooms iOS into the topbar.** Safari zooms the page
  whenever a field under 16px takes focus, and it does not zoom back out when the field is
  blurred — so one tap on search left the reader scrolled sideways through a magnified page
  with no way back but a pinch. `#search-input` was `0.9rem`, which is 14.4px at the default
  root size. It is `max(16px, 1em)` now: 16px is Safari's threshold verbatim, so it holds even
  for a reader whose root size is smaller, which a plain `rem` would follow straight back under
  it; the `1em` arm lets a scaled topbar carry the field up.

  It is not a phone-only bug and it is not gated behind a media query, because the two queries
  that look like they would scope it both miss the same device: an iPad with a trackpad
  attached clears the 40rem breakpoint **and** reports `pointer: fine`, and its screen still
  gets tapped. A site retuning the field wants a floor of its own, not a bare `font-size`.

### Changed

- **Code blocks carry the same 16px floor as the search field.** `.prose pre` was `0.85rem`
  — 13.6px on a default root, small enough on a phone that reading a snippet meant pinching,
  and pinching a block that scrolls sideways zooms the page instead. It is `max(16px, 1em)`
  now: body size in an ordinary article, and never under the size iOS zooms below. That
  second half is not only about legibility — a `code-preview` pane can make a block editable,
  and an editable block is a field Safari will zoom into on focus like any other.
  The extra width goes to the `overflow-x` the block already had.

  Inline code and `<kbd>` are unchanged: both are sized in `em`, so they follow whatever text
  they sit in rather than the root, and neither can take focus.

  **CSS:** the selector is `.prose pre`. A site that wants the old density should keep a floor
  rather than replace the declaration outright — a bare `font-size: 0.85rem` there puts an
  editable preview back under the threshold.

## [2.0.0] - 2026-08-04 — the header is built out of elements

The theme carried its own navigation. A dark-mode button that left its state to an
icon. A row of links that folded into a hamburger at a width typed into a stylesheet,
with a focus trap and an arrow-key walker behind it. A sidebar drawer driven by a
`matchMedia` listener. Three patterns, none of them this theme's business, and each one
a place where the markup and the ARIA could drift apart. They are
[book-of-elementals](https://github.com/stamat/book-of-elementals) elements now —
`<switch-elemental>`, `<navbar-elemental>` and `<disclosure-elemental>` — and what is
left here is the layout around them.

The switch brought its own three bugs on a phone, all of them width: it is wider than
the icon button it replaced, and the bar it sits in had no room spare.

### Changed

- **The `site.links` row is `<navbar-elemental>`, and the topbar is that element.** The
  old row folded into a hamburger below 40rem and did nothing at all above it — so a
  site with five links and a search field had them overlapping at 900px, and a site with
  two short ones hid both on a tablet with room to spare. Neither is a width anybody can
  type: it depends on the labels, the reader's font, and whether that font has arrived
  yet. The element measures the row instead. Links move into a **More** panel one at a
  time as the room goes, and when only one is left beside **More** the whole row is a drawer
  — 40rem is still there as the `media` attribute, but now it is the floor rather than the
  whole story. That last stop is `min-bar-items="2"`: a single link beside an overflow button
  is a drawer wearing a bar's clothes. The theme writes the attribute only for a site with
  more than one link in `site.links`, because the threshold is read against the total as well
  as against how many fit — set on a one-link site it would be a drawer at every width.

  **DOM:** the header is `<header class="topbar"><navbar-elemental>` wrapping everything
  in the bar. The links are `<nav class="rail" aria-label="Site"><ul>` between the brand
  and the action group — the box takes the room the bar leaves, which is what the row is
  measured against, and the links sit at its far end so they read as part of the controls
  on the right rather than as a second brand. They end in a `<li data-navbar-more>` the element fills, and the
  drawer's button is `<button data-navbar-toggle aria-label="Site navigation">` last in
  the action group — empty, because the element writes the hamburger and the X it crosses
  into. Gone: `.topbar-nav`, `ul.topbar-links#topbar-links`, `.menu-toggle` and its svg.
  The sidebar's toggle is labelled "Documentation navigation" rather than "Toggle
  navigation", now that a docs header has two navigation toggles in it.

  **CSS:** `.topbar` is no longer the flex row — it is the sticky frame and the banner
  landmark, and `.topbar > navbar-elemental` is the row, carrying the 1rem inset the
  header used to have. That move is load-bearing: the drawer is positioned against the
  element, so padding outside it would be a drawer floating clear of both edges of the
  screen. The theme takes the element's two stylesheets and re-points
  `--navbar-elemental-surface`, `--navbar-elemental-border`, `--navbar-elemental-hover`,
  `--navbar-elemental-shadow` and `--navbar-elemental-radius` at its own tokens.
  A page styling `.topbar-links` wants `.topbar .rail` instead. The
  `@media (max-width: 60rem)` block that grew the search field is gone — the rail is the
  flexible item now, and the field keeps its 16rem.

  **Known limit:** a sticky header is a positioned ancestor, so it is the containing
  block for the overflow panel and the element's `position-try-fallbacks` cannot fire
  against the viewport. The panel stays under its own button, which is where it wants to
  be; a bar whose **More** button ends up hard against the right edge is the case where
  that shows.

  **Script:** `setupMenu()` and `focusStep()` are gone from `src/prose.ts` — some seventy
  lines, and the four tests that covered them with them, because what they implemented is
  now the element's and jsdom cannot exercise a row that measures itself. `prose.ts`
  imports `book-of-elementals/navbar`, so both bundles register it.

- **The sidebar drawer is `<disclosure-elemental>`.** It was a `matchMedia` listener, a
  class on the panel and a focus trap; the panel is the element's region now and the
  breakpoint is its `media` attribute, declared once in `docs.html` rather than in the
  markup and the stylesheet both. It is no longer modal — focus is not trapped and the
  article is not `inert`, which is the APG disclosure pattern for what is, after all, a
  list of links to the same site. What the theme still owns is the two ends the pattern
  does not owe you: focus handed to the current page's link when the drawer opens, and
  Escape or the scrim closing it.

  **DOM:** `<disclosure-elemental for="sidebar-nav" media="(min-width: 60rem)">` wraps
  the toggle; the element writes `aria-expanded`, `aria-controls` and
  `hidden="until-found"`, so a closed drawer is reachable by find-in-page. **CSS:** the
  drawer's rules key off `[data-mode="free"]` on the element and on the panel instead of
  repeating 60rem, which also means none of them can apply before the script does. The
  sidebar's own section toggles took the same caret while they were at it: the `▸`/`▾` text
  markers are the chevron the elementals draw, as a mask on `summary::before` that rotates
  with `[open]` — so every caret on the page is one caret, and it takes its colour from the
  text it sits beside.

- **`book-of-elementals` is `^0.4.0`** (was `^0.3.0`). The row needs 0.4's two fixes to
  be usable at all: the copy it measures is clipped, so a header whose links do not fit
  no longer hands the whole page a horizontal scrollbar, and its items say
  `box-sizing: border-box` themselves rather than assuming the page has.

- **The theme toggle is `<switch-elemental>`** from
  [book-of-elementals](https://github.com/stamat/book-of-elementals), which is a new
  dependency of this package. It writes `role="switch"` and `aria-checked`, so the
  state is announced rather than drawn, and the accessible name is "Dark mode" —
  what the setting is, not what pressing it does, since "Toggle dark mode, switch,
  on" says it twice.

  **DOM:** the topbar now emits `<switch-elemental class="switch-elemental-small
switch-elemental-thin"><button data-theme-toggle>` with a `.switch-elemental-off`
  and a `.switch-elemental-on` span inside it, in place of `<button class="icon-btn"
data-theme-toggle>` with `.theme-sun` and `.theme-moon` svgs. Both old classes are
  gone, and so are the four rules that swapped them. The two icons are 14px, sized
  to the knob the `small` preset leaves rather than to the bar.

  **CSS:** the theme imports the element's own two stylesheets and re-points
  `--switch-elemental-knob-checked` to `--bg`, since the element's default there is
  `Canvas` and a themed dark page keeps a light one. The size is the element's own
  `small` and `thin` presets, 2.75rem × 1.5rem with a 1px border, taken as classes
  rather than set here. The rest of the look is mixed out of `currentcolor`, so a
  page that themes the topbar's text colour themes the switch with it. Anything that
  was styling `.theme-sun` or `.theme-moon` should style the element's own two spans
  instead.

- **The topbar's right-hand group is spaced by inset, not by gap.** An icon button
  is a 2.25rem box around a 20px glyph, so it brings 8px to each edge and the switch
  and the search field bring none — a single `gap` lands on top of the first and on
  nothing beside the second, and the icons read further apart than anything else in
  the row. No number fixes that; the padding had to move.

  **CSS:** `.topbar-actions` is `gap: 0` and declares `--actions-inset` (0.5rem),
  which `.search` and `switch-elemental` take as `padding-inline` —
  the icon buttons already have it in their box. Any two neighbours are now 16px
  apart. `switch-elemental` is `display: flex` rather than the element's own
  `contents`, so it has a box to pad, and `.search-results` hangs off
  `--actions-inset` rather than 0 so the panel still lines up with the field. A page
  overriding the group's spacing wants `--actions-inset`, not `gap`.

  The group's outer edge moves in by that inset too: the last control's ink sits
  24px from the viewport rather than 16px, against the brand's 16px on the left.
  The docs layout already looked like that — its leftmost control is an icon
  button.

- **The site title truncates instead of pushing the bar wider.** `.brand` is a block
  with `text-overflow: ellipsis` rather than a flex row, and `.brand-mark` keeps its
  place on `vertical-align` and a margin instead of `align-items` and `gap`. A page
  overriding either should check it still lands.

### Added

- `--danger` token, `#e03131` light and `#ff8787` dark, alongside `--link` and
  `--focus`. Nothing in the theme itself paints an error yet; the token exists so
  elements embedded in a page can find one. It matches the name sulphuris already
  emits through `$color-aliases`, so a component styled against one is styled
  against the other.

- **`.prose code-preview > :is(pre, .code-wrap) { margin: 0 }`**, so a page using
  [`<code-preview>`](https://github.com/stamat/code-preview-element) no longer has to
  write it. The element resets that margin itself, but its `code-preview > :is(pre,
.code-wrap)` is one class and one type against this theme's two-class
  `.prose :is(figure, .code-wrap)` — so the theme's 1.75rem came back as a gap between
  the frame and the code under it, doubled once `docs.js` had wrapped the `pre` for its
  copy button. Every site using the element was copying the same rule out of the
  package's README; the specificity is the theme's, so the rule is now too.

  The package itself stays a non-dependency and is in neither bundle: a docs site with
  no live samples should not carry an editor and an iframe runtime. Loading it is still
  the consuming site's `poops.json`, which is what the new **Live samples** section of
  the README says, along with the two accommodations the theme already made (`--danger`,
  and standing the copy button down inside the element) that were nowhere written.

- `--focus` and `--danger` in the README's token list, which had neither.

### Fixed

- The search icon sat on the field's rounded corner rather than inside it. `.search`
  carries the action group's `--actions-inset` as padding, and an absolute offset resolves
  against the padding box — so the icon's `left: 0.6rem` was 0.6rem from the wrapper and a
  tenth of that into the field. It is `calc(var(--actions-inset, 0rem) + 0.6rem)` now, the
  same compensation `.search-results` already made.

- On a phone, the theme switch painted on top of the search field that opens
  over it. The switch's button is `position: relative` — the knob is positioned
  against it — and it comes after the field in the row, so with both at
  `z-index: auto` dom order decided which covered which. The open field now takes
  a layer of its own.

- The topbar overflowed the viewport on a phone, and took the page with it: the
  document picked up a horizontal scrollbar and the prose scrolled off the right
  edge. A flex item does not shrink past its min-content width unless it is told
  it may, and every control on the bar is fixed-width, so the title had to be the
  one that gives — `.brand-group` and `.brand` are `min-width: 0` now and the
  title truncates. Which title overflows, and at which width, is the site's own:
  the switch is wider than the icon button it replaced, so a name that used to
  fit no longer does.

  Below roughly 25rem there is no room left for a title at all, only for the
  controls. If that is your site, the `docs` pill is the item to drop on a phone.

- The sidebar's rule stopped wherever the nav ran out — halfway down the page on a
  short tree, somewhere else on the next page, so the line moved as you navigated.
  The rail carries the border down the full column now.

  **CSS:** `.sidebar` is `height: calc(100dvh - var(--topbar-h))` rather than
  `max-height`, and the scrolling moved off it — `overflow-y: auto` and
  `overscroll-behavior: contain` sit on `.sidebar > .nav` now, which is
  `max-height: 100%`. A page overriding the rail's height, or hanging anything off
  its scroll, has to move with them.
