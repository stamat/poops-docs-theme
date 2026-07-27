---
layout: docs
title: Kitchen sink
description: Every prose element the theme styles, on one page.
order: 2
---

# Kitchen sink

Every element `_prose.scss` has an opinion about, in one place. If something looks wrong
in the theme, it should look wrong here first.

## Headings

### Third level

#### Fourth level

Hover any heading to reveal the permalink `#` in the gutter.

## Text

A paragraph with **bold**, _italic_, ***both***, ~~strikethrough~~, `inline code`, and a
[link to the introduction](../). Lorem ipsum dolor sit amet, consectetur adipiscing elit,
sed do eiusmod tempor incididunt ut labore et dolore magna aliqua — long enough to wrap at
the `--content-max` measure so the line length can be judged.

---

## Lists

- Unordered item
- Another item
  - Nested item
  - Nested sibling
- Third item

1. Ordered item
2. Second item
   1. Nested ordered
   2. Nested sibling
3. Third item

## Blockquote

> A plain blockquote — muted text, left rule, no background.
>
> Second paragraph inside the same quote.

## Admonitions

> [!NOTE]
> Purple. The default flavour.

> [!TIP]
> Green. For the "you probably want this" aside.

> [!IMPORTANT]
> Blue, same as info.

> [!WARNING]
> Orange. For things that break.

> [!CAUTION]
> Also orange — reserved for destructive operations.

## Code

TypeScript, to check the token colors:

```ts
interface Entry {
  title: string
  url: string
  keywords?: string[]
}

// Filter the index by a lowercase query, cap the result list.
export function search(index: Entry[], query: string, limit = 8): Entry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return index
    .filter((e) => (e.title + ' ' + (e.keywords ?? []).join(' ')).toLowerCase().includes(q))
    .slice(0, limit)
}
```

A very wide line, to check that the block scrolls instead of the page:

```bash
docker run --rm -it -v "$PWD":/app -w /app --env NODE_ENV=production node:22-alpine sh -c "npm ci --no-audit --no-fund && npm run build && npm test -- --runInBand"
```

## Table

| Element | Selector | Note |
| --- | --- | --- |
| Code block | `.prose pre` | Wrapped in `.code-wrap` by the client script |
| Copy button | `.copy-btn` | Injected, tooltip via `data-tip` |
| Admonition | `.marked-github-alert` | Color set per-flavour with `--adm` |
| Table | `.prose table` | Scrolls on its own, zebra rows |

## Image

![A placeholder banner](data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPSc2NDAnIGhlaWdodD0nMjQwJz48cmVjdCB3aWR0aD0nNjQwJyBoZWlnaHQ9JzI0MCcgZmlsbD0nIzcwNDhlOCcvPjx0ZXh0IHg9JzMyMCcgeT0nMTM0JyBmb250LWZhbWlseT0nc2Fucy1zZXJpZicgZm9udC1zaXplPScyOCcgZmlsbD0nI2ZmZicgdGV4dC1hbmNob3I9J21pZGRsZSc+cGxhY2Vob2xkZXI8L3RleHQ+PC9zdmc+)

Images are capped at the column width and get the theme radius.
