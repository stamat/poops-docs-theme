# poops-docs-theme

[![npm version](https://img.shields.io/npm/v/poops-docs-theme)](https://www.npmjs.com/package/poops-docs-theme)
[![build status](https://github.com/stamat/poops-docs-theme/actions/workflows/ci.yml/badge.svg)](https://github.com/stamat/poops-docs-theme/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/stamat/poops-docs-theme.svg)](https://github.com/stamat/poops-docs-theme/blob/main/LICENSE)

Documentation theme for sites built with [Poops](https://github.com/stamat/poops) — two
layouts, their self-contained styles, and the client scripts. Ships as a dependency so a
site consumes it instead of copying files.

Requires Poops **≥ 2.5.0** — that is where the `description` filter arrived, which both
layouts use for `<meta name="description">`; an older Poops raises an unknown-filter error
rather than skipping it. (≥ 2.0.0 was the floor before that: the dev server appends its own
livereload client from there on, so the layouts stopped carrying the snippet and the
`livereload_port` global it read is gone.)

## Two layouts

|            | `docs`                                                             | `prose`                                     |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------- |
| For        | a real docs site                                                   | a small project — one page                  |
| Topbar     | brand + `docs` pill + search + nav links + icon links + theme switcher | brand + nav links + icon links + theme switcher |
| Body       | skip link, sidebar nav, breadcrumb, TOC, prose, last updated + edit link | skip link, one prose article           |
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
| `scss/_chrome.scss`    | docs-only chrome — `docs` pill, search, sidebar, breadcrumb, TOC, last-updated + edit link                    |
| `scss/docs.scss`       | entry: base + shell + chrome + prose                                                                         |
| `scss/prose-only.scss` | entry: base + shell + prose                                                                                  |
| `src/prose.ts`         | copy buttons, theme toggle, the topbar's nav element and icon-link tooltips — everything a bare page needs   |
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

`site.docsUrl` is where that pill points, for a site that keeps its docs somewhere other
than `docs/` — and `false` takes the pill off altogether, which is what a site whose docs
*are* the site root wants: the title already goes there, and a pill pointing at a `docs/`
nobody built is a 404 on every page of the site.

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

Below that same 40rem the icon links and the theme switch go into the drawer too, as the row
under the links, and come back onto the bar above it. The breakpoint and not the drawer: a row
that folded its links away because they stopped fitting is still on a screen with room for two
icon buttons, and moving them off it would free the room the links were measured against —
which is a bar that fits, folds, fits again for as long as the window sits there. They are
moved and not copied, so there is never a second switch able to disagree with the theme on
screen — and with scripting off, where there is no drawer either, they stay on the bar at
every width. Search
does stay: below 40rem the field shrinks to its icon and expands across the bar when you tap
it. What it does once you type is [Search](#search).

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
package registries, chat rooms, anything worth a permanent spot. On a phone they follow the
links into the drawer rather than staying on a bar with no room left.

A glyph names nothing to a reader who has not met it before, so `title` is both the link's
accessible name and the words in a tooltip —
[`<tooltip-elemental>`](https://stamat.github.io/book-of-elementals/elementals/tooltip.html),
which shows them on hover and on focus and takes Escape to dismiss. The GitHub button gets the
same treatment. There is no hover on a touch screen, and the element ignores pointer events
coming from one rather than half-handling them, so a tap opens the link instead of a bubble —
the name is on the link the whole time, which is what a screen reader reads either way. With
scripting off the browser's own tooltip does the job, from the `title` the element would
otherwise have taken over.

The look is the element's optional theme with `--tooltip-elemental-surface`,
`--tooltip-elemental-color` and `--tooltip-elemental-border-color` re-pointed at `--fg` and
`--bg`: its own default is `CanvasText` on `Canvas`, which follows the operating system rather
than the switch in this bar. The caret is off — the element draws it as two pseudo-elements
and the theme gives both `content: none`, so putting it back is restoring that rather than
setting `--tooltip-elemental-caret`.

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
`--content-max`, `--radius`, `--topbar-h`, `--topbar-border`, `--sidebar-w`, `--font-body`,
`--font-mono`, `--font-body-ex`.

Two of those are not colours or sizes you can set to taste. `--topbar-border` is the width
of the header's rules **and** the distance the open drawer steps past them, one name because
the step has to clear the line exactly — shorter and the rest of the line sits above the
panel, longer and a strip of header shows between the two. Set it in whole device pixels: a
sub-pixel border is painted at the width of a whole device pixel while a sub-pixel margin is
honoured as written, so `0.0625rem` against a `62.5%` root is a 1px line with a 0.625px step
past it, and the remainder is a hairline nobody can find. A px-to-rem pass over your own
stylesheet does the same thing, which is the reason to leave the value literal.

`--font-body-ex` is the other: it is the x-height of `--font-body` as a fraction of
its font-size, and a code block scales to 94% of it through `font-size-adjust` so mono
glyphs read at the size of the prose beside them — 94% rather than all of it because mono
sets wider and heavier, and an equal x-height still reads a size up. That lands the default
stack on the same 14px inline code takes. A code block stays at 16px whatever this says —
below that, iOS Safari zooms the page when a `code-preview` pane takes focus. The shipped
0.508 is measured for the default stack; override `--font-body` with a face of a different
x-height and override this too, or code will read a little large or small against it.

Nothing in the theme paints an error, so `--danger` is there for elements you embed in a
page — [Live samples](#live-samples) is the case it was added for.

### Table of contents

Poops' `toc` filter builds a flat list of a page's `H2`s and `H3`s, and `docs.html` nests it
under that page's link in the sidebar, so the tree and the page's own headings are one list.
`H3` entries are in the markup and hidden by `.nav-list .toc .toc-h3`, which is every place
this theme puts the list: a third level of indent inside `--sidebar-w` is a column of wrapped
fragments.

As you scroll, the entry for the section you are in gets `aria-current="location"`, styled by
`.toc a[aria-current]` in `var(--link)` at `font-weight: 600`. The line it measures against is
where a clicked entry parks its heading: the root's `scroll-padding-top` plus the heading's
`scroll-margin-top`, both derived from `--topbar-h`, so a taller bar moves the mark with it.

Two edges are deliberate. Nothing is marked while you are above the first `H2` — the text
under the `H1` is not in any section the list names, and marking the first would be a guess.
At the foot of the page the last entry is marked outright, because a final section shorter
than the screen never reaches the line. Un-hiding `.toc-h3` in your own CSS shows those
entries but does not light them up: the mark stays on their parent `H2`.

### Search

The field in the topbar of every `docs` page. It filters `search-index.json` — the file poops
writes from every page's front matter — on `title`, `description` and `keywords`, and shows
the first eight hits.

The index is fetched on the **first query**, not on page load: the field is on every page and
most visits never type in it. So the first search of a visit waits for the network and gets a
spinner; every one after it answers from memory. A load that fails is dropped rather than
remembered, so the next keystroke tries again.

Two elements from [book-of-elementals](https://github.com/stamat/book-of-elementals) do the
work, and between them they are the whole keyboard.
[`<search-elemental>`](https://stamat.github.io/book-of-elementals/elementals/search.html)
owns the query — a 100 ms debounce, one `AbortController` per query, the sequence number that
drops the slow answer arriving after the fast one, and a `role="status"` region that says
`5 results`, `No results` or `Search failed` out loud, which a panel silently filling itself
does not.
[`<suggest-elemental>`](https://stamat.github.io/book-of-elementals/elementals/suggest.html)
owns the panel: the listbox roles, the cursor that is `aria-activedescendant` rather than
focus so typing carries on while you walk the list, <kbd>↓</kbd> / <kbd>↑</kbd> wrapping,
<kbd>Home</kbd> / <kbd>End</kbd>, and <kbd>Enter</kbd> to follow the row under the cursor. The
theme fetches, builds the rows and owns the rest:

- **`/` and ⌘K / Ctrl+K put the cursor in the field.** The modifier pair works from inside
  another field and selects what is already typed; the slash does not, because it is a
  character somebody may be mid-word in. Both are taken off the browser when they land, so
  Firefox's quick-find and Chrome's address-bar shortcut do not fire on a docs page.
  `Ctrl+Shift+K` is left alone — the web console is not a docs site's to take. There is no
  visible hint beside the field: the shortcut is a shortcut, and at the small end that field
  is the width of the screen.
- **<kbd>Escape</kbd> empties the field**, and the panel goes with it. The element's own
  staging is one press to close and a second to clear; a reader pressing Escape at a search
  box means the search.
- **Focus leaving empties it too.** This field is in the topbar rather than in the middle of a
  page, so what is typed in it outlives the results it fetched — and on a phone a field with
  something in it will not fold back into its icon.
- **The cross at the end of the field is a real button.** `<input type="search">` gets one of
  its own in Chromium and Safari and none at all in Firefox, and the one it gets is drawn by
  the non-standard `::-webkit-search-cancel-button`: mouse-only, no tab stop, nothing in the
  accessibility tree. That one is taken off so there are not two, and `button.search-clear`
  replaces it — the octicon x at the magnifier's weight, a 24px target, an `aria-label`, and a
  focus ring. It is `visibility: hidden` while the field is empty, which drops it out of the
  tab order too: a stop that clears an empty field is a keystroke that does nothing.

**A result row is built as nodes, never as markup.** The index is front matter verbatim, so a
`title:` reading `<img src=x onerror=…>` would otherwise run on every page of the site. Text
goes in as `textContent`, and a url is resolved and dropped unless its scheme is `http:` or
`https:` — `href` takes a `javascript:` url as readily as a path.

**Nothing found and nothing fetched are different answers**, and both are said twice: once in
the live region, once in a box under the field. A site that never generated the index gets
**Search failed**, not **No results** — a search that never happened is not a search that
found nothing.

The DOM this produces, for a stylesheet that has to reach into it: the wrapper is
`search-elemental.search` carrying `data-state` (`idle`, `pending`, `results`, `empty`,
`error`), the field is `#search-input` with `.search-icon` and `button.search-clear` at its two
ends, the panel is `suggest-elemental` with `[open]` and `[role="option"]` on each row, and a
row is `li > a` holding `.sr-title` and `.sr-desc`. The two messages are
`p.sr-note.sr-empty` and `p.sr-note.sr-error`, shown by `data-state` alone. The panel's look
is the element's optional theme with `--suggest-elemental-surface`, `--suggest-elemental-active`,
`--suggest-elemental-radius`, `--suggest-elemental-inset` and `--suggest-elemental-max-height`
re-pointed at this theme's tokens and spacing; the spinner the pending state draws is
`--search-elemental-spinner-*`.

The message boxes sit outside the panel deliberately. A `listbox` may only own `option`s, so a
"No results" row inside it is `aria-required-children` — critical, and `script/a11y` fails the
build on it — however reasonable it looks on screen.

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

**Loading it is your site's job, not the theme's** — it is in neither bundle and not a
dependency of the published package. A docs site with no live samples should not pay for
an editor and an iframe runtime, and the sites that do want it load the bundle only on the
pages that have a preview. Add `code-preview-element` yourself, build or copy its script
and stylesheet in your own `poops.json`, and wrap the fences however suits your pages.
The mock site does exactly that, on one page, and
[`live-samples.md`](preview/src/docs/guide/live-samples.md) is the whole of it — two tags
in the page body and a fence wrapped in the element.

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
only), plus the optional `brand`, `brandMark`, `brandUrl`, `docsUrl`, `links` and `footer`
covered under [Topbar config](#topbar-config).

### Last updated

`docs` prints a `Last updated: <date>` line at the left of the edit-link row whenever a page
has `updated` — written in front matter, or filled in for every page by Poops' own
[`markup.options.lastUpdated`](https://github.com/stamat/poops#last-updated-dates) (Poops
≥ 2.4.0), which dates a page from a committed index of content hashes. A page without one
renders no line, and the edit link stays where it was. Below `40rem` the row stacks into a
centred column, date above button. The date is formatted `MMM D, YYYY`
and carries a machine-readable `<time datetime>` beside it; the format is the theme's, not a
config key.

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

The **Live samples** page beside it is the one page with a runtime dependency:
`code-preview-element` is a devDependency, copied into `preview/dist/vendor` by the
`copy` entry in `poops.json` and loaded by that page alone. It is filler with a job too —
the three collisions in [Live samples](#live-samples) are rules nothing else in the mock
exercises, so without it they are only claimed.

Inside `Guide` sits a **Deeper** section, and it is filler with a job: three levels of nav
render through a branch of `navtree.html` that two levels never reach, so a mock site
stopping at two leaves that branch unaudited while `script/a11y` reports green. Keep the
nesting when editing the mock.

**Kitchen sink** and **Live samples** sit under a **Samples** heading, and neither file
moved to get there: both carry `navGroup: Samples` in front matter, poops 2.3's way of
filing a page under a section the urls do not produce. The urls stay
`docs/guide/kitchen-sink` and `docs/guide/live-samples`, and so do the breadcrumbs — the
grouping is the sidebar's alone. It is filler with a job as well: a group is a section
node with **no page of its own**, so it renders with no **Overview** link, and every other
section in the mock has an index page that gives it one. Building the mock on a poops
older than 2.3 leaves the field unread and both pages sitting directly under `Guide` — the
grouping degrades to a flat list rather than failing, since the tree it renders arrives as
data either way. The peer range is `>=2.5.0` for a different reason: the layouts call the
`description` filter, which 2.5.0 introduced, and an older poops raises an unknown-filter
error rather than skipping it.

## Local development

To preview against real content instead of the mock, link the theme into a Poops docs site
(e.g. the Poops example) and build there:

```bash
# in this repo
npm link
# in the consuming site
npm link poops-docs-theme
```
