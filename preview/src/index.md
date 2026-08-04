---
layout: prose
title: Standalone page
description: The prose layout — docs topbar without search or the pill, one prose body, no sidebar.
jsonld:
  "@type": WebPage
---

# Standalone page

This page is the **prose layout** (`layout: poops-docs-theme/prose`). Same topbar as the
docs — brand, nav links, GitHub link, dark-mode toggle — minus the search field, the
`docs` pill and the sidebar. One body, `prose.min.css`, `prose.min.js`.

Use it for a small project that wants a single good-looking page instead of a docs site.
The **Docs** link up top comes from `site.links`, at the right of the bar where the docs
layout also puts search — it goes to the [docs preview →](docs/), which shows the other
layout.

## What still works

Everything `_prose.scss` styles renders the same here, and `prose.min.js` keeps the copy
button and the theme toggle:

```bash
npm install poops-docs-theme
```

> Blockquotes, tables, admonitions, highlighted code — all shared with the docs layout,
> because both stylesheets build from the same `_prose` partial.

| Layout  | Stylesheet      | Script         | Chrome                                       |
| ------- | --------------- | -------------- | -------------------------------------------- |
| `docs`  | `docs.min.css`  | `docs.min.js`  | topbar + search + sidebar + breadcrumb + TOC |
| `prose` | `prose.min.css` | `prose.min.js` | topbar only                                  |

> [!TIP]
> Never load both bundles — `docs.min.css` already contains everything `prose.min.css` has.

### A list, for rhythm

1. Tokens and base styles come from `_base.scss`.
2. The frame — topbar, icon buttons, content column, footer — from `_shell.scss`.
3. Docs-only chrome from `_chrome.scss`, which this page skips.
