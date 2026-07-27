---
layout: docs
title: Getting started
description: A short page with a couple of headings, a list and a shell block.
order: 1
---

# Getting started

A deliberately short page — it checks that a page with little content still fills the
column properly and that the footer sits where it should.

## Install

```bash
npm install poops-docs-theme
```

## Point a page at the layout

Front matter, one line:

```yaml
---
layout: poops-docs-theme/docs
---
```

## Checklist

1. Install the package.
2. Set the layout in front matter.
3. Build the styles and script (from source, or copy the prebuilt files).
4. Make sure `search-index.json` and the `nav` tree exist in the build.

> [!TIP]
> If the sidebar renders but nothing is highlighted, the nav URLs and the page URL
> disagree — the client script normalises `index.html` and trailing slashes before
> comparing, so a mismatch usually means a wrong `relativePathPrefix`.
