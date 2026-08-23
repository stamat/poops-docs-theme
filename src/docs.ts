// Poops docs client — the docs-layout extras: sidebar nav, mobile nav, search.
// Imports prose.ts for copy buttons + theme toggle, so this is the only script a
// docs page loads. Bundled to IIFE by poops.

import { onReady } from './prose'
// Registers `<disclosure-elemental>` on include - nothing on window, nothing to
// instantiate. The drawer's state, its ARIA and its breakpoint are all the element's.
import 'book-of-elementals/disclosure'
// The search field, in two halves that meet at the row: `<search-elemental>` debounces the
// query, aborts the one it replaces and announces the count, `<suggest-elemental>` is the
// panel with the listbox roles and the arrow keys. Neither fetches, which is the whole of
// what is left below.
import 'book-of-elementals/search'
import 'book-of-elementals/suggest'
// The scrollspy under the table of contents. Which section counts as the one being read, and
// the two cases a naive IntersectionObserver gets wrong, are the helper's problem — what is
// left here is which headings to watch and what to write on the link.
import { scrollSpy } from 'book-of-spells'

// The drawer is `<disclosure-elemental>`: it owns `open`, writes `aria-expanded` on the
// toggle and `hidden="until-found"` on the panel, and its `open-when` attribute holds the rail
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
    // no `open-when` has no mode and is a drawer at every width.
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

// Bring the current page into view in the sidebar. Which link that is comes from `navtree.html`,
// which compares the page's url against the urls poops built the nav from and writes `.active`
// and `aria-current="page"` there — so the mark is in the HTML, and a page whose script never
// loaded still says where the reader is. What a template cannot do is scroll: a rail of forty
// links opens at the top with the reader's own page somewhere below the fold.
function revealCurrentNav(): void {
  document.querySelector<HTMLAnchorElement>('.sidebar a.nav-link.active')?.scrollIntoView({ block: 'center' })
}

// Mark the section being read in the table of contents, the one poops built from the page's own
// headings and `navtree.html` nested under the active nav link.
//
// The links are the source of the list, not the headings: a heading the TOC skipped — an
// `.sr-only` one, an H4 — is not a place the reader can be taken to, so it is not a place worth
// reporting. That is why an entry the rail does not show is left out too — `.toc-h3` is
// `display: none` in there, and its enclosing H2 stays current while reading it. Which entries
// those are is read back off the CSS rather than restated here, so a site that unhides them gets
// them lighting up instead of showing without ever being marked.
//
// `aria-current="location"` rather than `page`: `page` is the sidebar link for the document you
// are on, and it is already on one of these links' parent. A section of that page is a location
// within it. `:target-current` and `scroll-target-group` would do the highlight in CSS with no
// script at all, but they are Chromium-only and, as of Chrome 144, not exposed to the
// accessibility tree — so the attribute would still have to be written from here.
//
// The line the spy measures against is where a clicked TOC link parks a heading, and that is
// two declarations added together, not one: the root's `scroll-padding-top` shrinks the
// scrollport, the heading's own `scroll-margin-top` pads the target inside it, and the browser
// applies both. Measured in Chromium on the kitchen-sink page, a heading lands 136px down from
// 68px of each — reading only the margin puts the line at half the height and marks the section
// above the one on screen. Read once: both are `--topbar-h` plus a rem, and neither changes with
// the viewport. Nothing scrolls the rail to follow the mark either — a sidebar that jumps while
// the reader scrolls the article is worse than one entry out of sight.
function setupToc(): void {
  const toc = document.querySelector('.toc')
  if (!toc) return

  // `display` computes whatever an ancestor is doing, so this reads the rail's own rule with the
  // mobile drawer shut exactly as it does with it open.
  const shown = (link: HTMLAnchorElement): boolean =>
    !!link.parentElement && getComputedStyle(link.parentElement).display !== 'none'
  const links = Array.from(toc.querySelectorAll<HTMLAnchorElement>('li > a[href^="#"]')).filter(shown)
  const linkFor = new Map<string, HTMLAnchorElement>()
  const headings: HTMLElement[] = []
  for (const link of links) {
    // A heading id is the author's, and one written by hand can carry a lone `%` — which is a
    // `URIError` out of `decodeURIComponent`, not a link that fails to match. Decoding is still
    // needed for the ids that are percent-encoded, so the malformed one drops out of the spy
    // rather than the decode coming out.
    let id: string
    try { id = decodeURIComponent(link.hash.slice(1)) } catch { continue }
    const heading = document.getElementById(id)
    if (!heading || linkFor.has(id)) continue
    linkFor.set(id, link)
    headings.push(heading)
  }
  if (!headings.length) return

  const px = (value: string): number => parseFloat(value) || 0
  const offset = px(getComputedStyle(document.documentElement).scrollPaddingTop) +
    px(getComputedStyle(headings[0]).scrollMarginTop)

  scrollSpy(headings, (section: HTMLElement | null) => {
    for (const link of links) link.removeAttribute('aria-current')
    if (section) linkFor.get(section.id)?.setAttribute('aria-current', 'location')
  }, { offset })
}

interface Entry { title: string; description?: string; url: string; keywords?: string[] }

// What `search-query` carries. `wait` is how the page hands the element the work, which is
// what buys the pending state; `signal` aborts the request this query replaces, and is
// deliberately unused below.
interface SearchQuery { query: string; signal: AbortSignal | null; wait: (work: Promise<unknown>) => void }

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
function resultRow(base: string, entry: Entry): HTMLLIElement | null {
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
  // `<li>` because the panel is a `<ul>`, and `<a href>` because that is the one thing
  // `<suggest-elemental>` counts as an option — the arrow keys walk links and nothing else.
  const li = document.createElement('li')
  li.append(a)
  return li
}

// The rows for one query, and nothing at all when there are none.
//
// A panel with nothing in it closes itself, which is the whole of the empty state here: the
// message a reader sees is a box beside the panel in `topbar.html`, shown by CSS off
// `data-state="empty"`. Written into the list instead — which is what the element's own docs
// suggest — it would hold a `listbox` open over a single row that is not an `option`, and
// that is `aria-required-children`, which `script/a11y` fails on.
function resultRows(base: string, query: string, index: Entry[]): HTMLLIElement[] {
  const needle = query.toLowerCase()
  return index.filter((e) => {
    const hay = (e.title + ' ' + (e.description || '') + ' ' + (e.keywords || []).join(' ')).toLowerCase()
    return hay.includes(needle)
  }).slice(0, 8).map((e) => resultRow(base, e)).filter((row) => row !== null)
}

function setupSearch(base: string): void {
  const search = document.querySelector('search-elemental')
  const list = document.querySelector('suggest-elemental > ul')
  const input = document.getElementById('search-input') as HTMLInputElement | null
  if (!search || !list || !input) return

  // Fetched on the first query rather than at boot: the field is in the topbar of every docs
  // page and most visits never type in it. `??=` is the whole cache, and the `catch` drops it
  // so a blip is one failed search rather than a dead box for the rest of the visit.
  //
  // The query's `signal` is not passed here on purpose. It aborts whatever the *previous*
  // query started, and this request is not the query's — it is the index every query shares.
  // Hooked up, a second keystroke would cancel the download the first one started and begin
  // it again from nothing, for as long as somebody kept typing.
  let index: Promise<Entry[]> | null = null
  const load = (): Promise<Entry[]> => (index ??= fetch(base + 'search-index.json')
    .then((response) => {
      // `fetch` resolves on a 404, so this is the check that turns a missing index into a
      // failed search rather than a successful one that found nothing.
      if (!response.ok) throw new Error('search-index.json: ' + response.status)
      return response.json() as Promise<Entry[]>
    })
    .catch((error: unknown) => { index = null; throw error }))

  // Two ways in, one function, because the part that is easy to get wrong is shared: setting
  // `.value` from script fires no `input` event, and `<search-elemental>` listens for nothing
  // else — so a field cleared without one leaves the panel standing over a query that no
  // longer exists. `form.reset()` and a `<button type="reset">` fire none either, for whoever
  // wraps this in a form.
  const clear = (): void => {
    if (!input.value) return
    input.value = ''
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }

  // The clear button is markup rather than the browser's cross, so pressing it is the page's
  // to handle. Focus goes back to the field: the reader pressed clear to type again, and a
  // button that empties the field and keeps the caret has asked for one more click.
  search.querySelector('[data-search-clear]')?.addEventListener('click', () => {
    clear()
    input.focus()
  })

  // Escape empties the field, and the panel goes with it because the empty query closes it.
  // The element's own staging is Escape-closes-then-Escape-clears — `<suggest-elemental>`
  // takes the key only while the panel is open and hands it back saying clearing is the
  // page's usual answer — but a reader pressing Escape at a search box means the search, not
  // the popup, and two presses to undo one search is a keystroke spent on the difference.
  // Both listeners are on the field, so both run: nothing here is swallowed.
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') clear() })

  // Focus leaving empties it too. This field is in the topbar of every page rather than in
  // the middle of one, so what is typed in it outlives the reading of the results it fetched
  // — a query still sitting there after a trip through three pages is a box that has to be
  // cleared before it can be used, and on a phone it is a field that will not fold back into
  // its icon. Focus moving *into* the panel is not focus leaving, though the element cancels
  // the pointerdown that would cause it, so it rarely happens.
  search.addEventListener('focusout', (e) => {
    const next = (e as FocusEvent).relatedTarget
    if (next instanceof Node && search.contains(next)) return
    clear()
  })

  // Handing the promise back is what buys the loading state, and it is honest here in both
  // directions: the first query really does wait for the network, and every one after it
  // settles on an index in memory, inside a microtask nothing gets painted in.
  search.addEventListener('search-query', (event) => {
    const { query, wait } = (event as CustomEvent<SearchQuery>).detail
    wait(load().then((entries) => { list.replaceChildren(...resultRows(base, query, entries)) }))
  })

  // `/` and ⌘K/Ctrl+K, because both are already in a docs reader's hands — MDN, GitHub,
  // DocSearch and Starlight answer to one or the other and mostly to both. `/` only while
  // nothing editable holds focus, since it is a character somebody may be mid-word in; the
  // modifier pair carries no such risk and so works from inside the field too, where it
  // selects what is there to be typed over.
  //
  // Both are taken off the browser: `/` is Firefox's quick-find and Ctrl+K opens the search
  // bar in Firefox and the address bar in Chrome. That is the trade every docs site with a
  // shortcut makes, and it is only made once the keystroke is one this page answers. Shift is
  // where the trade stops — Ctrl+Shift+K opens the web console in Firefox and Chrome both, and
  // a docs page that swallows a devtools shortcut has taken something it cannot give back.
  //
  // `composedPath()[0]` rather than `document.activeElement`: for an input inside a custom
  // element's shadow root the latter reports the *host*, whose tagName is the element's and
  // whose `isContentEditable` is false — so a slash typed into one would read as "nothing
  // editable has focus" and be eaten.
  //
  // No visible `⌘K` hint in the field — the shortcut is a shortcut, and the field is already
  // the width of a phone's screen at the small end.
  document.addEventListener('keydown', (e) => {
    const target = (e.composedPath?.()[0] ?? e.target) as HTMLElement | null
    const editable = target instanceof HTMLElement &&
      (/^(?:INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)
    const key = typeof e.key === 'string' ? e.key.toLowerCase() : ''
    // The modifier pair fires from inside a field, where the slash cannot: it is unambiguous,
    // and a reader who has drifted into a comment box wanting the docs should not have to
    // leave it first. Selecting rather than only focusing is what makes a second ⌘K a retype.
    const hit = (e.metaKey || e.ctrlKey)
      ? key === 'k' && !e.shiftKey && !e.altKey
      : key === '/' && !e.altKey && !editable
    if (!hit) return
    e.preventDefault()
    input.focus()
    input.select()
  })
}

const BASE = (document.currentScript as HTMLScriptElement | null)?.dataset.base ?? ''

// Four independent features, each in its own `try`. They used to be four bare calls, where a
// throw in one took the ones after it with it — one heading id the TOC could not decode left the
// page with no search box and no mobile drawer. The error still reaches the console: this
// degrades to three working features, it does not swallow the reason for the fourth.
onReady(() => {
  for (const setup of [revealCurrentNav, setupToc, setupMobileNav, (): void => setupSearch(BASE)]) {
    try {
      setup()
    } catch (error) {
      console.error(error)
    }
  }
})
