# Contributing to poops-docs-theme

Issues and pull requests are welcome.

This package is the documentation theme for [Poops](https://github.com/stamat/poops)
sites: the Nunjucks layouts (`docs.html`, `prose.html`, `navtree.html`,
`topbar.html`), the SCSS in `scss/`, and the TypeScript in `src/` that becomes
`dist/js`. Sites depend on all four, which makes the DOM and the class names part
of the public API — see the note in the changelog section below.

## Getting set up

```bash
git clone https://github.com/stamat/poops-docs-theme.git
cd poops-docs-theme
npm install
```

```bash
script/server    # builds and serves preview/ with live reload, http://localhost:4040
script/build     # compiles dist/ and the preview site
script/test      # jest
script/lint      # eslint + stylelint
script/a11y      # axe over the preview site, in Chromium — run script/build first
```

`preview/` is a mock docs site and the only place the theme is exercised end to
end — if you add a layout or a component, give it something to render there, or
nobody will notice when it breaks.

## Reporting a bug

Include the theme version, the Poops version, the relevant part of your
`poops.json`, and the markup you got versus the markup you expected. A page in
`preview/src` that reproduces it is worth more than a description.

## Pull requests

- **Add a check that fails without the fix.** Jest suites live in `test/` as
  `*.test.ts` and cover `src/`, in jsdom. The Nunjucks layouts have no jest
  coverage and are not meant to grow one — rendering them is what `preview/`
  already does — so a layout fix gets a page in `preview/src` that renders the
  markup it got wrong, and the failing check is `script/a11y`. Either way, run it
  against the unfixed code first: a check that passes both ways is not one.
- **Keep the layouts consumable.** Anything a site can override — a class name, a
  custom property, a block name, a `site` key in `poops.json` — is a breaking
  change when it moves. If it has to move, say so in the changelog entry.
- **Run `script/lint`.** `eslint` and `stylelint` are the authority, and CI runs
  them on Node 22 and 24.
- **Run `script/a11y`.** It builds nothing itself — `script/build` first — then
  drives the preview site in Chromium and runs axe over it: as served, then with
  everything that says it is closed opened, then with the search panel showing
  both a list of hits and the empty state. Four passes over each page, light and
  dark by two viewports, because the bar folds into a drawer below `40rem` and
  the sidebar toggle only exists below `60rem` — a sweep at one width audits half
  the theme and reports as though it did all of it. The document-level rules stay
  on here, unlike the sibling sweep in
  [book-of-elementals](https://github.com/stamat/book-of-elementals): a landmark,
  a skip link, a title and a `lang` are a fragment's business nowhere and this
  theme's business exactly. It also fails on an `aria-controls`,
  `aria-labelledby`, `aria-describedby` or `aria-activedescendant` naming an id
  no element has, which axe files as undecided rather than failing.

  A rule it cannot decide is listed as needing review, by rule and by reason,
  rather than failing the run — mostly contrast over a pseudo element or under
  something overlapping it, which stays unknowable. Hover-only states and
  anything a click cannot reach are not covered, which is what a browser and a
  screen reader are still for.
- **Keep the bundles supportable.** `script/build` then `npm run lint:browsers`
  and `npm run lint:es` check the compiled CSS and JS against
  [.browserslistrc](.browserslistrc) and the esbuild target. CI runs both after
  the build; a feature that degrades to nothing can be added to the ignore list
  in [stylelint.browsers.config.js](stylelint.browsers.config.js), with a
  comment saying why.
- **Add a changelog entry** under `## [Unreleased]` in
  [CHANGELOG.md](CHANGELOG.md) — that file explains the format.

Commit messages are freeform, write something that says what changed.

## How a release works

`script/publish [version]` bumps `package.json`, runs `script/changelog` to cut
`[Unreleased]` into a released entry, builds, tags and pushes. Pushing the tag
triggers [publish.yml](.github/workflows/publish.yml), which publishes to npm via
trusted publishing — OIDC, no tokens stored anywhere. The changelog entry becomes
the body of the GitHub release verbatim.
