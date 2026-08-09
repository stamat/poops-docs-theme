---
layout: docs
title: Live samples
navTitle: Live samples
description: A code-preview block running inside the theme, and the three collisions the theme settles for it.
order: 3
---

# Live samples

A docs page that shows a sample usually wants to *run* it too.
[`<code-preview>`](https://github.com/stamat/code-preview-element) wraps a code fence and
renders it in an iframe above the code that produced it, so the example on the page and
the thing it documents cannot drift apart.

**The theme does not ship it** — it is not a dependency here and nothing in either bundle.
A docs site with no live samples should not pay for an editor and an iframe runtime. This
page loads it the way your site would: two tags, no build step.

## What this page loads

<link rel="stylesheet" href="{{ relativePathPrefix }}vendor/code-preview.min.css">
<script src="{{ relativePathPrefix }}vendor/code-preview-hljs.min.js" defer></script>

```html
<link rel="stylesheet" href="../../vendor/code-preview.min.css">
<script src="../../vendor/code-preview-hljs.min.js" defer></script>
```

The `-hljs` build rather than the smaller default, because Poops highlights fences at
build time and the page ships no runtime highlighter: the default would leave the first
paint coloured and then stop recolouring the moment a reader typed. Only
`code-preview.css` comes with it — the package's own hljs theme is left out, since
`_prose.scss` already colours `.hljs-*` in both modes.

## The sample

Three fences, so the element renders three tabs — the language is read off each one,
nothing is configured. The frame loads this theme's `docs.min.css` and mirrors
`[data-theme]` across the boundary, so the sample answers the switch in the topbar along
with the page around it: `var(--accent)` below is the same purple as the links.

<code-preview css="{{ relativePathPrefix }}css/docs.min.css" theme-attribute="data-theme">

```html
<div class="callout">
  <p>Rendered in the frame — edit any tab and watch this change.</p>
</div>
```

```css
.callout {
  border: 1px solid var(--accent);
  border-radius: var(--radius);
  padding: 1rem;
  font-family: var(--font-body);
  color: var(--fg);
}
```

```js
console.log('The strip under the code is the frame’s console, not the browser’s.')
console.error('An error line, painted in this theme’s --danger.')
```

</code-preview>

## What the theme does for it

Three collisions, each one only the host stylesheet can settle. All three are visible
above rather than described:

| Collision | What you can see |
| --- | --- |
| Two copy buttons — the theme puts one on every `.prose pre`, the element has its own on the strip | only the element's is there. Its copies whichever pane is showing; a button bolted to one `<pre>` cannot, and this sample is two fences |
| A gap between the frame and its code, from the theme's `1.75rem` block rhythm outranking the package's reset | the code sits flush under the preview |
| The package's error red falls back to a fixed `#cf222e`, dark-mode-blind | the console strip finds this theme's `--danger` |

The middle one is a specificity fight the package cannot win from its side:
`code-preview > :is(pre, .code-wrap)` is one class and one type against the theme's
two-class `.prose :is(figure, .code-wrap)`. The theme ends it, once, in `_prose.scss`:

```scss
.prose code-preview > :is(pre, .code-wrap) { margin: 0; }
```

The `.code-wrap` arm is there because the theme's own copy script wraps every `.prose pre`
in one, including the one inside the element — so the block the rule has to reach is
sometimes the `<pre>` and sometimes its wrapper.

Wiring, attributes and the rest of what the element can do are in
[its README](https://github.com/stamat/code-preview-element#readme); what the theme
settles for it is in [this theme's](https://github.com/stamat/poops-docs-theme#live-samples).
