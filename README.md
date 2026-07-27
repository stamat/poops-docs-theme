# poops-docs-theme

Documentation theme for sites built with [Poops](https://github.com/stamat/poops) — two
layouts, their self-contained styles, and the client scripts. Ships as a dependency so a
site consumes it instead of copying files.

Requires Poops **≥ 1.9.0** (package-template resolution).

## Two layouts

| | `docs` | `prose` |
| --- | --- | --- |
| For | a real docs site | a small project — one page |
| Topbar | brand + `docs` pill + search + nav links + GitHub + theme switcher | brand + nav links + GitHub + theme switcher |
| Body | sidebar nav, breadcrumb, TOC, prose, edit link | one prose article |
| Stylesheet | `dist/css/docs.min.css` | `dist/css/prose.min.css` |
| Script | `dist/js/docs.min.js` | `dist/js/prose.min.js` |

Pick one per page. The bundles are alternatives, not layers — `docs.min.css` already
contains everything `prose.min.css` has, and `docs.min.js` already contains
`prose.min.js`. Never load both.

## What's in the box

| File | Role |
| --- | --- |
| `docs.html` | full docs layout — topbar, sidebar nav, breadcrumb, TOC, prose |
| `prose.html` | standalone layout — topbar, one prose body, no sidebar or search |
| `topbar.html` | shared topbar macro (both layouts import it) |
| `navtree.html` | recursive sidebar-nav macro (`docs.html` imports it) |
| `scss/_base.scss` | tokens + element base |
| `scss/_shell.scss` | the frame both layouts share — topbar, brand, icon buttons (GitHub + theme switcher), content column, footer |
| `scss/_chrome.scss` | docs-only chrome — `docs` pill, search, sidebar, breadcrumb, TOC, edit link |
| `scss/docs.scss` | entry: base + shell + chrome + prose |
| `scss/prose-only.scss` | entry: base + shell + prose |
| `src/prose.ts` | copy buttons + theme toggle — everything a bare page needs |
| `src/docs.ts` | imports `prose.ts`, adds search, active nav, mobile nav |
| `preview/src` | mock site for looking at the theme — see [Preview](#preview) |

## Build

```bash
npm install
npm run build      # poops -b → dist/css/{docs,prose}.min.css, dist/js/{docs,prose}.min.js
```

## Use it in a Poops site

**1. Install** (published, or `npm link` for local dev).

**2. Point pages at a layout** — front matter:

```yaml
---
layout: poops-docs-theme/docs     # or poops-docs-theme/prose
---
```

**3. Build the styles + script.** Two ways:

- **From source** (fresh every build) — in the consumer's `poops.json`:

  ```json
  {
    "styles":  [{ "in": "node_modules/poops-docs-theme/scss/docs.scss", "out": "dist/css/docs.css", "options": { "minify": true, "justMinified": true } }],
    "scripts": [{ "in": "node_modules/poops-docs-theme/src/docs.ts",   "out": "dist/js/docs.js",  "options": { "minify": true, "justMinified": true, "format": "iife", "target": "es2019" } }]
  }
  ```

  Swap `scss/docs.scss` → `scss/prose-only.scss` and `src/docs.ts` → `src/prose.ts`
  (out: `dist/css/prose.css`, `dist/js/prose.js`) for the `prose` layout.

- **Prebuilt** — `copy` the theme's `dist/css` and `dist/js` into your output.

To render markdown outside either layout, load `prose.min.css` and give the markdown
container `class="prose"`. The script is optional there — it only adds copy buttons and
the theme toggle.

`docs.html` links `css/docs.min.css` + `js/docs.min.js` and reads `search-index.json`
from the site root; `prose.html` links `css/prose.min.css` + `js/prose.min.js` and needs
no index. The consumer produces those files.

### Topbar config

Both layouts read `site` for the header: `brand` (falls back to `title`), `brandMark`
(the emoji, defaults to 💩), and `repo` (falls back to `package.homepage`) for the GitHub
button — omit both and the button disappears. `prose.html` also renders `site.footer` if
set, otherwise `site.title`.

`site.links` adds nav links — on the `prose` layout they fill the slot search takes on
the `docs` layout. Site-relative urls get the page's path prefix; absolute ones open in a
new tab. A link is dropped on the pages it covers — `docs/` disappears everywhere under
`/docs/`, so the docs never link to themselves. Links are hidden below 40rem.

```json
{ "markup": { "site": { "links": [
  { "title": "Docs", "url": "docs/" },
  { "title": "Changelog", "url": "https://github.com/you/repo/releases" }
] } } }
```

## Requirements the layout expects from the host

Poops built-ins the layout uses, all present in any Poops build: the `toc`,
`breadcrumb`, `canonical`, `og`, `jsonld` filters, a generated `nav` tree
(`markup.nav`), a `search-index.json` (`markup.searchIndex`), and `site` config
(`title`, `description`, `repo`, `branch`, `lang`).

## Preview

`preview/src` is a mock site — filler pages that exist only to render the layouts. It
builds with the theme, through the real `docs.html` and `prose.html`, so there is no
second copy of the markup to keep in sync.

```bash
npm run preview   # poops: build + watch + serve on http://localhost:4040
```

`/` is the standalone **prose** layout demo; `/docs/` is the docs layout. `npm run build`
produces both too, at `preview/dist` (gitignored, and not in the published `files`). Docs
pages: **Introduction**, **Getting started**, and a **Guide** section whose **Kitchen
sink** page carries every element `_prose.scss` styles — headings, lists, table,
blockquote, all five admonition flavours, highlighted code, image.

## Local development

To preview against real content instead of the mock, link the theme into a Poops docs site
(e.g. the Poops example) and build there:

```bash
# in this repo
npm link
# in the consuming site
npm link poops-docs-theme
```
