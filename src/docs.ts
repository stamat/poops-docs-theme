// Poops docs client — the docs-layout extras: sidebar nav, mobile nav, search.
// Imports prose.ts for copy buttons + theme toggle, so this is the only script a
// docs page loads. Bundled to IIFE by poops.

import { onReady } from './prose'
// Registers `<disclosure-elemental>` on include - nothing on window, nothing to
// instantiate. The drawer's state, its ARIA and its breakpoint are all the element's.
import 'book-of-elementals/disclosure'

// The drawer is `<disclosure-elemental>`: it owns `open`, writes `aria-expanded` on the
// toggle and `hidden="until-found"` on the panel, and its `media` attribute holds the rail
// open above the breakpoint. So there is no state here, and no matchMedia — what is left is
// light dismiss, which the APG disclosure pattern does not owe you and a drawer over a scrim
// still wants.
//
// Not modal: focus is not trapped, the article is not `inert`, and tabbing past the last
// link leaves the drawer. That is the pattern the element implements, and for a panel that
// is a list of links to the same site it is the right amount — a keyboard user who tabs out
// of it has not lost anything.
function setupMobileNav(): void {
  const drawer = document.querySelector('disclosure-elemental')
  const sidebar = document.querySelector('[data-sidebar]')
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')
  if (!drawer || !sidebar || !toggle) return

  const close = (): void => {
    if (!(drawer as HTMLElement & { open?: boolean }).open) return
    // Light dismiss is for the drawer, and `pinned` is the rail. The element writes `open`
    // from its query when the query *changes*, and a query that still matches changes
    // nothing — so a rail closed by Escape stays closed, with the toggle that would bring it
    // back `display: none` at this width. `pinned` rather than not-`free`: a disclosure with
    // no `media` has no mode and is a drawer at every width.
    if ((drawer as HTMLElement).dataset.mode === 'pinned') return
    // Focus first, while the drawer is still rendered. Closing sets `hidden`, which takes
    // the panel out of the a11y tree with the focused link inside it — focus would land on
    // <body> and the next Tab would restart from the top of the document.
    if (sidebar.contains(document.activeElement)) toggle.focus()
    ;(drawer as HTMLElement & { open?: boolean }).open = false
  }

  // The pattern does not move focus, and for a region that sits right after its button it
  // should not. This one does not: the toggle is the first thing in the topbar and the panel
  // is the last thing in the layout, so between them are the brand, the search field and
  // every icon link. A drawer five tabs from the button that opened it has opened for the
  // mouse only. `free` matters — crossing the breakpoint opens the rail too, and a rail
  // stealing focus because the window got wider is worse than the thing being fixed.
  drawer.addEventListener('disclosure-toggle', (e) => {
    if (!(e as CustomEvent<{ open: boolean }>).detail.open) return
    if ((drawer as HTMLElement).dataset.mode !== 'free') return
    // the current page rather than the top of the list
    sidebar.querySelector<HTMLElement>('a.active, a[aria-current], a')?.focus()
  })

  document.querySelector('[data-nav-close]')?.addEventListener('click', close)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })

  // The drawer's closed state arrives at upgrade, and on a phone that painted the rail first —
  // a cold cache, a slow connection — the transition would carry the panel off-screen as the
  // page's opening move. So the transition does not exist until a tap asks for one. Counting
  // frames instead was tried and does not hold: a closed panel painted for two frames still
  // slid in from nothing the moment the rule arrived.
  //
  // On the button, not on `disclosure-toggle`, and with the reflow: this runs before the
  // element writes the state, and reading a layout property flushes the closed panel *with*
  // the transition on it. Both land in one recalc otherwise, which is a style change the
  // transition was not there for — the first tap would open with a jump and every tap after
  // it would slide.
  toggle.addEventListener('click', () => {
    sidebar.classList.add('sidebar-nav-ready')
    void (sidebar as HTMLElement).offsetWidth
  }, { once: true })
}

// Highlight the current page in the sidebar. Done client-side because the
// server-side page.url carries the output-dir prefix while nav urls don't.
function markActiveNav(): void {
  const norm = (p: string): string => (p.replace(/index\.html$/, '').replace(/\/$/, '') || '/')
  const here = norm(location.pathname)
  document.querySelectorAll<HTMLAnchorElement>('.sidebar a.nav-link').forEach((a) => {
    if (norm(new URL(a.href).pathname) === here) {
      a.classList.add('active')
      a.setAttribute('aria-current', 'page') // colour alone shouldn't carry it
      a.scrollIntoView({ block: 'center' })
    }
  })
}

interface Entry { title: string; description?: string; url: string; keywords?: string[] }

// One result row, built as nodes.
//
// Every field in the index is a doc author's front matter verbatim — poops copies a page's
// keys into search-index.json without touching them — so this is a boundary, and the row is
// the one place it gets crossed. Through `innerHTML` a title reading `<img src=x onerror=…>`
// would run on every page of the site, and `href` takes a `javascript:` url as readily as a
// path. Text goes in as `textContent`, the url is resolved and its scheme checked.
//
// `null` rather than a row with a dead link: a scheme that is not http(s) is either an
// attack or a broken entry, and neither is worth a line in the list.
function resultRow(base: string, entry: Entry): HTMLAnchorElement | null {
  let url: URL
  try { url = new URL(base + entry.url, location.href) } catch { return null }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null

  const a = document.createElement('a')
  a.href = url.href
  const title = document.createElement('span')
  title.className = 'sr-title'
  title.textContent = entry.title
  a.append(title)
  if (entry.description) {
    const desc = document.createElement('span')
    desc.className = 'sr-desc'
    desc.textContent = entry.description
    a.append(desc)
  }
  return a
}

function setupSearch(base: string): void {
  const input = document.getElementById('search-input') as HTMLInputElement | null
  const box = document.getElementById('search-results')
  if (!input || !box) return
  let index: Entry[] = []
  fetch(base + 'search-index.json').then((r) => r.json()).then((d) => { index = d }).catch(() => {})

  const render = (q: string): void => {
    const query = q.trim().toLowerCase()
    if (!query) { box.hidden = true; box.replaceChildren(); return }
    const hits = index.filter((e) => {
      const hay = (e.title + ' ' + (e.description || '') + ' ' + (e.keywords || []).join(' ')).toLowerCase()
      return hay.includes(query)
    }).slice(0, 8)
    box.hidden = false
    const rows = hits.map((e) => resultRow(base, e)).filter((a) => a !== null)
    if (!rows.length) {
      const empty = document.createElement('div')
      empty.className = 'sr-empty'
      empty.textContent = 'No results'
      box.replaceChildren(empty)
      return
    }
    box.replaceChildren(...rows)
  }
  input.addEventListener('input', () => render(input.value))

  // `/` and ⌘K/Ctrl+K, because both are already in a docs reader's hands — MDN, GitHub,
  // DocSearch and Starlight answer to one or the other and mostly to both. `/` only while
  // nothing editable holds focus, since it is a character somebody may be mid-word in; the
  // modifier pair carries no such risk and so works from inside the field too, where it
  // selects what is there to be typed over.
  //
  // Both are taken off the browser: `/` is Firefox's quick-find and Ctrl+K opens the search
  // bar in Firefox and the omnibox in Chrome. That is the trade every docs site with a
  // shortcut makes, and it is only made once the keystroke is one this page answers.
  //
  // No visible `⌘K` hint in the field — the shortcut is a shortcut, and the field is already
  // the width of a phone's screen at the small end.
  document.addEventListener('keydown', (e) => {
    const active = document.activeElement as HTMLElement | null
    const editable = !!active && (/^(?:INPUT|TEXTAREA|SELECT)$/.test(active.tagName) || active.isContentEditable)
    const key = typeof e.key === 'string' ? e.key.toLowerCase() : ''
    const hit = (e.metaKey || e.ctrlKey)
      ? key === 'k' && !e.altKey
      : key === '/' && !e.altKey && !editable
    if (!hit) return
    e.preventDefault()
    input.focus()
    input.select()
  })

  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('.search')) box.hidden = true
  })
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { input.value = ''; box.hidden = true } })
}

const BASE = (document.currentScript as HTMLScriptElement | null)?.dataset.base ?? ''

onReady(() => {
  markActiveNav()
  setupMobileNav()
  setupSearch(BASE)
})
