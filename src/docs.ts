// Poops docs client — the docs-layout extras: sidebar nav, mobile nav, search.
// Imports prose.ts for copy buttons + theme toggle, so this is the only script a
// docs page loads. Vanilla, no deps, bundled to IIFE by poops.

import { onReady } from './prose'

// Disclosure pattern: the toggle owns aria-expanded, the sidebar owns the class.
// Escape closes and hands focus back, since the scrim is mouse-only.
//
// The open drawer covers the article behind a scrim, so tabbing on past its last
// link would put focus somewhere the visitor cannot see. `inert` on the article
// says that natively — no hand-rolled focus trap, and unlike a trap it leaves the
// topbar (and the toggle itself) reachable, which is where a nav drawer should
// let you back out to.
function setupMobileNav(): void {
  const sidebar = document.querySelector('[data-sidebar]')
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')
  if (!sidebar || !toggle) return
  const main = document.querySelector('main')
  // the drawer is a phone/tablet thing: past the breakpoint it is just the
  // sidebar again, focus can stay in it, and a stale `inert` would lock the
  // article for good
  const wide = window.matchMedia?.('(min-width: 60rem)')

  const setOpen = (open: boolean): void => {
    sidebar.classList.toggle('open', open)
    toggle.setAttribute('aria-expanded', String(open))
    main?.toggleAttribute('inert', open)
    // The drawer sits after the whole topbar in the dom, so tab alone would walk
    // the topbar instead of the thing that just opened: hand focus over, starting
    // at the page you are on, and take it back to the toggle on the way out.
    // preventScroll because the panel is still sliding in.
    if (open) {
      const start = sidebar.querySelector<HTMLElement>('a.active') ?? sidebar.querySelector<HTMLElement>('a, summary')
      start?.focus({ preventScroll: true })
      // focus is refused while the drawer still computes to hidden; the css flips
      // it instantly on open, but engines disagree on when "instantly" lands, so
      // take one more shot on the next frame if the first was ignored
      if (document.activeElement !== start) requestAnimationFrame(() => start?.focus({ preventScroll: true }))
    } else if (!wide?.matches && sidebar.contains(document.activeElement)) {
      toggle.focus()
    }
  }

  wide?.addEventListener('change', (e) => { if (e.matches) setOpen(false) })
  toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('open')))
  document.querySelector('[data-nav-close]')?.addEventListener('click', () => setOpen(false))
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('open')) setOpen(false)
  })
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
