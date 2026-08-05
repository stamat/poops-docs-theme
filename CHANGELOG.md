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
