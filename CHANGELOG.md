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

## [Unreleased] — the dark-mode toggle is a switch

The control that turns dark mode on announced itself as a button called "Toggle
dark mode" and left its state to the icon — nothing said whether the mode was on,
and a reader who has never seen the other icon has no way to tell. It is a setting
with two values, which is what the APG calls a switch, so it is one now.

The change brought its own three bugs on a phone, all of them width: the switch is
wider than the icon button it replaced, and the bar it sits in had no room spare.

### Changed

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
  which `.topbar-nav`, `.search` and `switch-elemental` take as `padding-inline` —
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

### Fixed

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
