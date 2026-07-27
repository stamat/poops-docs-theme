# poops-docs-theme

Documentation theme for sites built with [Poops](https://github.com/stamat/poops) — a
docs layout, its self-contained styles, and the client script (search, dark mode, copy
buttons, mobile nav). Ships as a dependency so a docs site consumes it instead of copying
files.

Requires Poops **≥ 1.9.0** (package-template resolution).

## What's in the box

| File | Role |
| --- | --- |
| `docs.html` | Nunjucks layout — topbar, sidebar nav, breadcrumb, TOC, prose |
| `navtree.html` | recursive sidebar-nav macro (`docs.html` imports it) |
| `scss/docs.scss` | styles — light/dark via `[data-theme]`, zero external deps |
| `src/docs.ts` | client behavior — search, theme toggle, copy, mobile nav |
| `preview/src` | mock docs site for looking at the theme — see [Preview](#preview) |

## Build

```bash
npm install
npm run build      # poops -b → dist/css/docs.min.css, dist/js/docs.min.js
```

## Use it in a Poops site

**1. Install** (published, or `npm link` for local dev).

**2. Point pages at the layout** — front matter:

```yaml
---
layout: poops-docs-theme/docs
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

- **Prebuilt** — `copy` the theme's `dist/css/docs.min.css` and `dist/js/docs.min.js` into your output.

The layout links `css/docs.min.css` + `js/docs.min.js` and reads `search-index.json`
from the site root — the consumer produces those.

## Requirements the layout expects from the host

Poops built-ins the layout uses, all present in any Poops build: the `toc`,
`breadcrumb`, `canonical`, `og`, `jsonld` filters, a generated `nav` tree
(`markup.nav`), a `search-index.json` (`markup.searchIndex`), and `site` config
(`title`, `description`, `repo`, `branch`, `lang`).

## Preview

`preview/src` is a mock docs site — five pages of filler that exist only to render the
layout. It builds with the theme, through the real `docs.html`, so there is no second copy
of the markup to keep in sync.

```bash
npm run preview   # poops: build + watch + serve on http://localhost:4040
```

Then open `/docs/`. `npm run build` produces it too, at `preview/dist` (gitignored, and not
in the published `files`). Pages: **Introduction**, **Getting started**, and a **Guide**
section whose **Kitchen sink** page carries every element `_prose.scss` styles —
headings, lists, table, blockquote, all five admonition flavours, highlighted code, image.

## Local development

To preview against real content instead of the mock, link the theme into a Poops docs site
(e.g. the Poops example) and build there:

```bash
# in this repo
npm link
# in the consuming site
npm link poops-docs-theme
```
