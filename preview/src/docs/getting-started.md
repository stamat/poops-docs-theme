---
layout: docs
title: Getting started
description: A short page with a couple of headings, a list and a shell block.
order: 1
updated: 2026-02-14
---

# Getting started

A deliberately short page — it checks that a page with little content still fills the
column properly and that the footer sits where it should. Its `updated` is written in front
matter, which is what keeps the date on this one page fixed — every other page here takes
its own from `markup.options.lastUpdated`, so the row renders both ways in the preview.

## Install

```bash
npm install poops-docs-theme
```

## Point a page at a layout

Front matter, one line:

```yaml
---
layout: poops-docs-theme/docs     # or poops-docs-theme/prose
---
```

`docs` is the full thing — sidebar, search, breadcrumb, TOC. `prose` is the standalone
page: the same topbar without search or the pill, one prose body, no sidebar. Each has
its own bundle pair, `docs.min.{css,js}` and `prose.min.{css,js}`. Never load both.

## Checklist

1. Install the package.
2. Set the layout in front matter.
3. Build the styles and script for that layout (from source, or copy the prebuilt files).
4. For `docs`, make sure `search-index.json` and the `nav` tree exist in the build.
   `prose` needs neither.

> [!TIP]
> If the sidebar renders but nothing is highlighted, the nav URLs and the page URL
> disagree — the client script normalises `index.html` and trailing slashes before
> comparing, so a mismatch usually means a wrong `relativePathPrefix`.
