---
layout: docs
title: Introduction
navTitle: Introduction
description: Mock content used to preview the Poops docs theme without a real docs site.
order: 0
---

# Poops docs theme

This site is **mock content**. It exists so the theme can be looked at — topbar, sidebar,
table of contents, breadcrumb, prose, code blocks, admonitions — without linking the
package into a real docs site.

Nothing here is documentation. Every page is filler chosen to exercise a part of the layout.

## What to look at

- The **topbar** — brand, the `site.links` row, search (try typing `config`), GitHub link,
  dark-mode toggle. The links sit at the right of the bar and measure themselves: narrow the
  window and they go behind **More** one at a time, then the whole row becomes a drawer.
- The **sidebar** — nested sections, active link, and the TOC that opens under it.
- The **breadcrumb** above each page title.
- The **prose** — see [Kitchen sink](guide/kitchen-sink) for every markdown element at once.
- The **[standalone page](../)** — the other layout, `prose`: same topbar minus search,
  the `docs` pill and the sidebar, one prose body.

## Toggling dark mode

The toggle writes `theme` to `localStorage` and sets `data-theme` on `<html>`. A blocking
inline script in `<head>` applies it before first paint, so there is no flash:

```js
;(function () {
  try {
    var t = localStorage.getItem('theme')
    if (!t) t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    document.documentElement.dataset.theme = t
  } catch (e) {}
})()
```

> [!NOTE]
> Both themes are driven by custom properties on `:root[data-theme]`. Nothing in the
> theme hardcodes a color outside those two blocks and the syntax-token colors.

## Where to next

Start at [Getting started](getting-started), or jump to the [Guide](guide/) for the
nested-section behaviour of the sidebar.
