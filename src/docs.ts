// Poops docs client — the docs-layout extras: sidebar nav, mobile nav, search.
// Imports prose.ts for copy buttons + theme toggle, so this is the only script a
// docs page loads. Vanilla, no deps, bundled to IIFE by poops.

import { onReady } from './prose'

// Disclosure pattern: the toggle owns aria-expanded, the sidebar owns the class.
// Escape closes and hands focus back, since the scrim is mouse-only.
function setupMobileNav(): void {
  const sidebar = document.querySelector('[data-sidebar]')
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')
  if (!sidebar || !toggle) return
  const setOpen = (open: boolean): void => {
    sidebar.classList.toggle('open', open)
    toggle.setAttribute('aria-expanded', String(open))
  }
  toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('open')))
  document.querySelector('[data-nav-close]')?.addEventListener('click', () => setOpen(false))
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !sidebar.classList.contains('open')) return
    setOpen(false)
    toggle.focus()
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
