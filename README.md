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
| Body       | skip link, sidebar nav, breadcrumb, TOC, prose, edit link          | skip link, one prose article                |
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
| `scss/_shell.scss`     | the frame both layouts share — skip link, topbar, brand, icon buttons (GitHub + theme switcher), content column, footer |
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
if set; without it both fall back to the same line — brand, version, license, then credit to
Poops and this theme — read from the consuming site's `package.json` (`homepage`, `version`,
`license` — a missing `license` just drops that clause).

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
you tap it. `/` puts the cursor in it, and so does ⌘K / Ctrl+K — the second pair works from
inside another field, the slash does not, because it is a character somebody may be
mid-word in. Both are taken off the browser when they land, so Firefox's quick-find and
Chrome's omnibox shortcut do not fire on a docs page. There is no visible hint next to the
field: the shortcut is a shortcut, and at the small end that field is the width of the
screen.

The docs sidebar is the same idea with a different element: a rail above 60rem and a drawer
below it, [`<disclosure-elemental>`](https://github.com/stamat/book-of-elementals) with the
breakpoint as its `media` attribute, so a drawer left open cannot survive a rotation into a
layout that has no drawer. It is **not** modal — focus is not trapped, the article is not
`inert`, and tabbing past the last link leaves it, which is the disclosure pattern. What the
theme adds is the two ends that pattern does not owe you: opening the drawer hands focus to
the link for the page you are on (only as a drawer — a rail stealing focus because the window
got wider would be worse), and Escape or a click on the scrim closes it and gives focus back
to the toggle. Both are the drawer's only: above the breakpoint Escape leaves the rail
standing, because a rail it closed is one the reader has no toggle left to reopen. Closed, it
is `hidden="until-found"`, so find-in-page still reaches a link inside it and opens it.

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
`--border`, `--accent`, `--accent-fg`, `--link`, `--focus`, `--danger`, `--shadow`, plus
`--content-max`, `--radius`, `--topbar-h`, `--sidebar-w`, `--font-body`, `--font-mono`.

Nothing in the theme paints an error, so `--danger` is there for elements you embed in a
page — [Live samples](#live-samples) is the case it was added for.

### Code blocks

Every `<pre>` in `.prose` gets a copy button in its corner. The script adds it, so a page
that loaded the stylesheet and nothing else has code blocks and no buttons, which is the
right way round.

The button is [`<copy-elemental>`](https://github.com/stamat/book-of-elementals), and what
that brings is the half after the click. The icon becomes a tick and the same word reaches
a screen reader, through the live region the element appends — an icon swap on its own
announces nothing, which is
[WCAG 2.2 SC 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-changes.html) unmet.
A write the clipboard refuses turns the button red and says **Copy failed** in the same
corner tooltip, rather than looking like a button nobody pressed. And `navigator.clipboard`
does not exist on a page served over plain `http`: there the element takes the button away
instead of leaving a dead one, so the code is still there to select and nothing lies about
copying it.

What lands on the clipboard is the block's text with leading newlines and trailing
whitespace stripped — a trailing newline pasted into a terminal runs the command the reader
was still reading. Indentation is untouched, which Python and YAML need.

The DOM this produces, for a stylesheet that has to reach into it: the `<pre>` is wrapped in
`.code-wrap`, the button is `copy-elemental > button` with `[data-state="copied"]` and
`[data-state="error"]` on the element while there is something to report, and a `<pre>` with
no `id` of its own is given `code-block-N` — that is how `for` finds what to copy, and an id
the page already uses is stepped over rather than taken. The look is the element's optional
theme with `--copy-elemental-surface`, `--copy-elemental-border-color`,
`--copy-elemental-hover` and `--copy-elemental-icon-size` re-pointed at this theme's tokens.

### Live samples

A docs page that shows a sample usually wants to *run* it too.
[`<code-preview>`](https://github.com/stamat/code-preview-element) is one way: it wraps a
code fence and renders it in an isolated iframe above the code that produced it.

**Loading it is your site's job, not the theme's** — it is not a dependency here and
nothing in either bundle. A docs site with no live samples should not pay for an editor
and an iframe runtime, and the sites that do want it load the bundle only on the pages
that have a preview. Add `code-preview-element` yourself, build or copy its script and
stylesheet in your own `poops.json`, and wrap the fences however suits your pages.

What the theme does do is get out of the element's way. Three collisions, each one only
this stylesheet can settle — the first two because the theme caused them, the third
because the element has no palette of its own to reach for:

| Collision                                                              | What the theme does                                                |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Two copy buttons — ours on every `.prose pre`, the element's own on the strip above | hides ours inside `code-preview` and gives back the 3.7rem it reserved |
| A gap between the frame and its code: `.prose :is(figure, .code-wrap)` is two classes against the package's one-class-one-type reset | zeroes it — `code-preview` owns the spacing around itself, the block inside gets none |
| The package's error red falls back to a fixed `#cf222e`, in no palette and dark-mode-blind | ships `--danger` for it to find                                     |

Keeping ours would be the worse button, not just a second one: it copies the single `pre`
it sits on, where the element's copies whichever pane is showing — and a sample written as
several fences has more than one.

Theming the preview itself is the package's business and needs nothing from here: its
stylesheet reads `--border`, `--radius`, `--bg`, `--accent`, `--fg-muted` and
`--font-mono` with fallbacks, so it wears whatever your `:root` says. Its frame is a
separate document and inherits none of that — pass the stylesheets it should load, and
`theme-attribute="data-theme"` to carry this theme's dark mode across the boundary.

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
blockquote, all five admonition flavours, highlighted code, keyboard keys, image.

Inside `Guide` sits a **Deeper** section, and it is filler with a job: three levels of nav
render through a branch of `navtree.html` that two levels never reach, so a mock site
stopping at two leaves that branch unaudited while `script/a11y` reports green. Keep the
nesting when editing the mock.

## Local development

To preview against real content instead of the mock, link the theme into a Poops docs site
(e.g. the Poops example) and build there:

```bash
# in this repo
npm link
# in the consuming site
npm link poops-docs-theme
```
