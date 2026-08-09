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

function setupSearch(base: string): void {
  const input = document.getElementById('search-input') as HTMLInputElement | null
  const box = document.getElementById('search-results')
  if (!input || !box) return
  let index: Entry[] = []
  fetch(base + 'search-index.json').then((r) => r.json()).then((d) => { index = d }).catch(() => {})

  const render = (q: string): void => {
    const query = q.trim().toLowerCase()
    if (!query) { box.hidden = true; box.innerHTML = ''; return }
    const hits = index.filter((e) => {
      const hay = (e.title + ' ' + (e.description || '') + ' ' + (e.keywords || []).join(' ')).toLowerCase()
      return hay.includes(query)
    }).slice(0, 8)
    box.hidden = false
    if (!hits.length) { box.innerHTML = '<div class="sr-empty">No results</div>'; return }
    box.innerHTML = hits.map((e) =>
      `<a href="${base}${e.url}"><span class="sr-title">${e.title}</span>` +
      (e.description ? `<span class="sr-desc">${e.description}</span>` : '') + '</a>'
    ).join('')
  }
  input.addEventListener('input', () => render(input.value))
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
