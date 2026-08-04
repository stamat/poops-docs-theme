# poops-docs-theme

[![npm version](https://img.shields.io/npm/v/poops-docs-theme)](https://www.npmjs.com/package/poops-docs-theme)
[![build status](https://github.com/stamat/poops-docs-theme/actions/workflows/ci.yml/badge.svg)](https://github.com/stamat/poops-docs-theme/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/stamat/poops-docs-theme.svg)](https://github.com/stamat/poops-docs-theme/blob/main/LICENSE)

Documentation theme for sites built with [Poops](https://github.com/stamat/poops) — two
layouts, their self-contained styles, and the client scripts. Ships as a dependency so a
site consumes it instead of copying files.

Requires Poops **≥ 1.9.0** (package-template resolution).

## Two layouts

|            | `docs`                                                             | `prose`                                     |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------- |
| For        | a real docs site                                                   | a small project — one page                  |
| Topbar     | brand + `docs` pill + search + nav links + icon links + theme switcher | brand + nav links + icon links + theme switcher |
| Body       | sidebar nav, breadcrumb, TOC, prose, edit link                     | one prose article                           |
| Stylesheet | `dist/css/docs.min.css`                                            | `dist/css/prose.min.css`                    |
| Script     | `dist/js/docs.min.js`                                              | `dist/js/prose.min.js`                      |

Pick one per page. The bundles are alternatives, not layers — `docs.min.css` already
contains everything `prose.min.css` has, and `docs.min.js` already contains
`prose.min.js`. Never load both.

## What's in the box

| File                   | Role                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `docs.html`            | full docs layout — topbar, sidebar nav, breadcrumb, TOC, prose                                               |
| `prose.html`           | standalone layout — topbar, one prose body, no sidebar or search                                             |
| `topbar.html`          | shared topbar macro (both layouts import it)                                                                 |
| `navtree.html`         | recursive sidebar-nav macro (`docs.html` imports it)                                                         |
| `scss/_base.scss`      | tokens + element base                                                                                        |
| `scss/_shell.scss`     | the frame both layouts share — topbar, brand, icon buttons (GitHub + theme switcher), content column, footer |
| `scss/_chrome.scss`    | docs-only chrome — `docs` pill, search, sidebar, breadcrumb, TOC, edit link                                  |
| `scss/docs.scss`       | entry: base + shell + chrome + prose                                                                         |
| `scss/prose-only.scss` | entry: base + shell + prose                                                                                  |
| `src/prose.ts`         | copy buttons, theme toggle, the topbar's nav element — everything a bare page needs                          |
| `src/docs.ts`          | imports `prose.ts`, adds search, active nav, the sidebar drawer                                              |
| `preview/src`          | mock site for looking at the theme — see [Preview](#preview)                                                 |

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
layout: poops-docs-theme/docs # or poops-docs-theme/prose
---
```

**3. Build the styles + script.** Two ways:

- **From source** (fresh every build) — in the consumer's `poops.json`:

  ```json
  {
    "styles": [
      {
        "in": "node_modules/poops-docs-theme/scss/docs.scss",
        "out": "dist/css/docs.css",
        "options": { "minify": true, "justMinified": true }
      }
    ],
    "scripts": [
      {
        "in": "node_modules/poops-docs-theme/src/docs.ts",
        "out": "dist/js/docs.js",
        "options": {
          "minify": true,
          "justMinified": true,
          "format": "iife",
          "target": "es2019"
        }
      }
    ]
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
button — omit both and the button disappears. Both render `site.footer` (html, unescaped)
if set; without it both fall back to the same brand/version/license/Poops line, read from
the consuming site's `package.json` (`homepage`, `version`, `license` — a missing `license`
just drops that clause).

`brandMark` is also the tab icon, drawn as an inline svg — no favicon file needed.

The title is its own link and goes to the site root. `site.brandUrl` retargets it — a
site-relative url gets the page's path prefix, an absolute one opens in a new tab. On the
`docs` layout the `docs` pill next to it is a second link, back to `docs/`, so the title
leaves the docs section and the pill returns to it.

`site.links` adds nav links — a row at the right of the bar, against the search field and the
icon buttons rather than against the brand. Site-relative
urls get the page's path prefix; absolute ones open in a new tab. Every link shows on every
page, and the one you are inside is marked rather than hidden: `aria-current="page"` on the
page itself, `aria-current="true"` anywhere under it (`docs/` stays lit through all of
`/docs/`), styled in the accent colour. An optional `icon` sets a mark before the label.

The row is [`<navbar-elemental>`](https://github.com/stamat/book-of-elementals), which is
where its behaviour comes from. A link that stops fitting moves into a **More** panel, one
at a time as the room goes — measured rather than guessed, so it answers the labels you
actually wrote in the font that actually arrived — and when the window is under 40rem, or
only one link is left beside **More**, the whole row becomes a drawer behind a hamburger
that crosses into an X. One link and an overflow button is not a navigation bar, which is
what `min-bar-items="2"` says; the theme sets it only when you have given it more than one
link, since the threshold counts the links you have as well as the ones that fit — with a
single link it would be a drawer at every width.
It is the APG *disclosure navigation* pattern and not a menubar: the items stay links, `Tab`
reaches every one of them, the arrow keys walk the row, and Escape closes what is open.
`aria-expanded`, `aria-controls` and `hidden` are the element's to write. The breakpoint is
declared once, as the `media` attribute in `topbar.html`, and no stylesheet here repeats it.

Search, the icon links and the theme switch stay on the bar at every width — only the links
fold away. Below 40rem the search field shrinks to its icon and expands across the bar when
you tap it.

The docs sidebar is the same idea with a different element: a rail above 60rem and a drawer
below it, [`<disclosure-elemental>`](https://github.com/stamat/book-of-elementals) with the
breakpoint as its `media` attribute, so a drawer left open cannot survive a rotation into a
layout that has no drawer. It is **not** modal — focus is not trapped, the article is not
`inert`, and tabbing past the last link leaves it, which is the disclosure pattern. What the
theme adds is the two ends that pattern does not owe you: opening the drawer hands focus to
the link for the page you are on (only as a drawer — a rail stealing focus because the window
got wider would be worse), and Escape or a click on the scrim closes it and gives focus back
to the toggle. Closed, it is `hidden="until-found"`, so find-in-page still reaches a link
inside it and opens it.

```json
{
  "markup": {
    "site": {
      "links": [
        { "title": "Docs", "url": "docs/" },
        { "title": "Changelog", "url": "https://github.com/you/repo/releases", "icon": "package" }
      ]
    }
  }
}
```

`site.iconLinks` is the same shape without labels: buttons in the row next to GitHub, for
package registries, chat rooms, anything worth a permanent spot. They keep their spot on a
phone rather than folding away, and `title` becomes the `aria-label`.

```json
{
  "markup": {
    "site": {
      "iconLinks": [
        { "title": "npm", "url": "https://www.npmjs.com/package/you-pkg", "icon": "npm" },
        { "title": "Packagist", "url": "https://packagist.org/packages/you/pkg", "icon": "package" },
        { "title": "Discord", "url": "https://discord.gg/xxxx", "icon": "💬" }
      ]
    }
  }
}
```

Both lists take the same `icon` values:

| `icon`        | renders                                                        |
| ------------- | -------------------------------------------------------------- |
| `github`      | the GitHub mark                                                 |
| `npm`         | the npm mark                                                    |
| `package`     | a generic package box — use it for Packagist, PyPI, crates.io…  |
| anything else | printed as given, so an emoji or a pasted `<svg>` works         |

### Pinning the theme

`site.theme` takes the choice away from the visitor. Any value drops the boot script and
the toggle button.

| `site.theme` | Behaviour                                                                    |
| ------------ | ---------------------------------------------------------------------------- |
| unset        | follows the OS, visitor can toggle, choice kept in `localStorage` (default)   |
| `"light"`    | always light — `data-theme="light"` on `<html>`                              |
| `"dark"`     | always dark — `data-theme="dark"` on `<html>`                                |
| `"system"`   | always follows the OS, no toggle, nothing remembered                          |

```json
{
  "markup": {
    "site": {
      "theme": "light"
    }
  }
}
```

`"system"` sets no attribute — the stylesheet's `prefers-color-scheme` block handles it,
so it works with JavaScript off. That same block is why an unset `site.theme` still tracks
the OS for a visitor whose browser blocked the inline script.

### Your colours

Every colour is a custom property on `:root` (see `scss/_base.scss`), so a site keeps its
own accent by overriding the handful it cares about _after_ the theme. Build your own
entry instead of the theme's:

```scss
// src/scss/docs.scss — point poops.json at this
@use "poops-docs-theme/scss/docs";

:root,
:root[data-theme="light"] {
  --accent: #9a6b00;
  --link: #8a6414;
}
:root[data-theme="dark"] {
  --accent: #f6c026;
  --link: #f6c026;
}
```

Sass resolves the bare `poops-docs-theme/...` specifier through `includePaths`, so the
consumer's `poops.json` needs `"includePaths": ["node_modules"]` (top level, not inside
`styles`). The theme's own stylesheets load `book-of-elementals/...` the same way — it is a
dependency of this package, so npm installs it, and the same `includePaths` is what finds
it. The full token set: `--bg`, `--bg-alt`, `--bg-code`, `--fg`, `--fg-muted`,
`--border`, `--accent`, `--accent-fg`, `--link`, `--shadow`, plus `--content-max`,
`--radius`, `--topbar-h`, `--sidebar-w`, `--font-body`, `--font-mono`.

## Requirements the layouts expect from the host

All Poops built-ins, present in any Poops build:

|         | `docs`                                                                | `prose`                     |
| ------- | --------------------------------------------------------------------- | --------------------------- |
| Filters | `toc`, `breadcrumb`, `canonical`, `og`, `jsonld`                      | `canonical`, `og`, `jsonld` |
| Data    | `nav` tree (`markup.nav`), `search-index.json` (`markup.searchIndex`) | —                           |

Both read `site` config: `title`, `description`, `lang`, `repo`, `branch` (edit link, docs
only), plus the optional `brand`, `brandMark`, `brandUrl`, `links` and `footer` covered under
[Topbar config](#topbar-config).

### Structured data

The `jsonld` filter types a dateless page as `WebPage`. Documentation is `TechArticle` —
set it once for the whole site (Poops ≥ 1.9.7), rather than per page:

```json
"markup": {
  "site": {
    "jsonld": { "@type": "TechArticle" }
  }
}
```

Precedence is defaults → `site.jsonld` → page front-matter `jsonld`, so an odd page out
(a `FAQPage`, a `SoftwareSourceCode` listing) still overrides it locally.

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
