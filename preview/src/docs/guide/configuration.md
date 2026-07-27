---
layout: docs
title: Configuration
description: Tables, JSON blocks and a warning admonition.
order: 1
---

# Configuration

Mock options, invented for the preview. The point is the table and the JSON block.

## Options

| Option | Type | Default | What it does |
| --- | --- | --- | --- |
| `title` | `string` | — | Site title, used in `<title>` and as the brand fallback |
| `brand` | `string` | `title` | Text in the topbar next to the mark |
| `brandMark` | `string` | `💩` | Emoji left of the brand |
| `links` | `array` | — | Topbar nav links, `{ title, url }`; the one covering the current page is dropped |
| `repo` | `string` | — | Repository URL — GitHub button, and the "Edit this page" link |
| `branch` | `string` | `main` | Branch the edit link points at |
| `footer` | `string` | `title` | Footer text on the `prose` layout |
| `lang` | `string` | `en` | `lang` attribute on `<html>` |
| `contentMax` | `length` | `46rem` | Measure of the prose column |

## Example

```json
{
  "markup": {
    "in": "src/markup",
    "out": "dist",
    "site": {
      "title": "My Docs",
      "brand": "My Project",
      "repo": "https://github.com/you/your-docs",
      "branch": "main",
      "links": [{ "title": "Docs", "url": "docs/" }]
    },
    "searchIndex": "search-index.json",
    "nav": { "output": "nav.json", "root": "docs" }
  }
}
```

## Overriding tokens

```scss
:root {
  --content-max: 52rem;
  --radius: 0.25rem;
}

:root[data-theme="dark"] {
  --accent: #ffa94d;
}
```

> [!WARNING]
> Overriding `--accent` alone is not enough for contrast — `--accent-fg` is what sits on
> top of it, and the two are a pair.

> [!IMPORTANT]
> The theme ships no reset beyond `box-sizing: border-box`. If the host site loads its own
> global CSS, load it before the theme.
