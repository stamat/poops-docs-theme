// Poops prose client — the behavior a bare markdown page needs: copy buttons and
// the theme toggle. Vanilla, no deps, bundled to IIFE by poops.
// docs.ts imports this, so the docs bundle gets it too. Never load both scripts.

// Octicons: copy-16 and check-16.
const COPY_SVG = '<svg class="icon-copy" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path></svg>'
const CHECK_SVG = '<svg class="icon-check" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L1.72 8.78a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>'

// Add a copy button to every code block.
export function addCopyButtons(): void {
  document.querySelectorAll<HTMLPreElement>('.prose pre').forEach((pre) => {
    const wrap = document.createElement('div')
    wrap.className = 'code-wrap'
    pre.parentNode!.insertBefore(wrap, pre)
    wrap.appendChild(pre)
    const btn = document.createElement('button')
    btn.className = 'copy-btn'
    btn.type = 'button'
    btn.setAttribute('aria-label', 'Copy code')
    btn.dataset.tip = 'Copied'
    btn.innerHTML = COPY_SVG + CHECK_SVG
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(pre.innerText).then(() => {
        btn.classList.add('copied')
        setTimeout(() => btn.classList.remove('copied'), 1500)
      })
    })
    wrap.appendChild(btn)
  })
}

export function setupTheme(): void {
  const btn = document.querySelector('[data-theme-toggle]')
  btn?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('theme', next) } catch { /* private mode */ }
  })
}

// Move focus `by` places through a list, wrapping at both ends. Focus adrift
// outside the list — a stray click, say — comes back into it. Shared with the
// docs sidebar, which walks its own tree the same way.
export function focusStep(list: HTMLElement[], by: number): void {
  const at = list.indexOf(document.activeElement as HTMLElement)
  const next = at < 0 ? (by > 0 ? 0 : list.length - 1) : (at + by + list.length) % list.length
  list[next]?.focus()
}

// Topbar links fold into a hamburger on phones. This is the APG *disclosure
// navigation* pattern, not menu button: the panel holds plain links, so no
// role="menu"/menuitem — that would cost the link semantics screen readers
// announce. Button owns aria-expanded + aria-controls, panel owns the class.
// Closed means display:none, which keeps the links out of the tab order; above
// the breakpoint css shows them and the class goes inert.
//
// Collapsed and open, it is modal: Tab cycles the panel and the hamburger, and
// nothing else. The hamburger is in the loop because it is the way back out.
export function setupMenu(): void {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]')
  const menu = document.querySelector('.topbar-links')
  if (!toggle || !menu) return
  const links = (): HTMLAnchorElement[] => Array.from(menu.querySelectorAll('a'))
  const isOpen = (): boolean => menu.classList.contains('open')
  // past the breakpoint the links are on screen anyway: no hamburger, no panel,
  // nothing to trap. A stale `open` class would only surprise on the way back down.
  const collapsed = window.matchMedia?.('(max-width: 40rem)')
  const isModal = (): boolean => isOpen() && (collapsed?.matches ?? true)
  const setOpen = (open: boolean): void => {
    menu.classList.toggle('open', open)
    toggle.setAttribute('aria-expanded', String(open))
  }
  collapsed?.addEventListener('change', (e) => { if (!e.matches) setOpen(false) })
  // Opening moves focus to the first link. The panel sits before the button in
  // the dom — it has to, or the links would land after the whole action row in
  // the desktop tab order — so tabbing out of the button would otherwise walk
  // away from the panel it just opened.
  toggle.addEventListener('click', () => {
    setOpen(!isOpen())
    if (isOpen()) links()[0]?.focus()
  })
  // anywhere else — including a link inside the panel, which navigates anyway
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('[data-menu-toggle]')) setOpen(false)
  })
  // tabbing past the last link leaves an open panel behind: close it, quietly,
  // without stealing the focus the visitor just moved on to
  document.addEventListener('focusout', (e) => {
    const next = (e as FocusEvent).relatedTarget as Node | null
    if (isOpen() && !(next && (menu.contains(next) || next === toggle))) setOpen(false)
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) {
      setOpen(false)
      toggle.focus()
      return
    }
    // Space opens a link, the way Enter already does natively — otherwise it would
    // scroll the page behind the panel. Same deal as the docs sidebar.
    const link = (e.target as HTMLElement | null)?.closest?.('a[href]')
    if (e.key === ' ' && link && menu.contains(link)) {
      e.preventDefault()
      ;(link as HTMLAnchorElement).click()
      return
    }
    // Arrows walk the panel itself, the hamburger left out of it — it is a button,
    // not one of the links.
    const by = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0
    if (by && isOpen() && menu.contains(document.activeElement)) {
      e.preventDefault()
      focusStep(links(), by)
      return
    }
    // Tab is the trap, so it takes the hamburger in, and only while the panel is
    // both open and collapsed.
    if (e.key !== 'Tab' || !isModal()) return
    e.preventDefault()
    focusStep([toggle, ...links()], e.shiftKey ? -1 : 1)
  })
}

// Run fn once the DOM is parsed. Exported so docs.ts boots on the same tick.
export function onReady(fn: () => void): void {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn)
  else fn()
}

onReady(() => {
  addCopyButtons()
  setupTheme()
  setupMenu()
})
