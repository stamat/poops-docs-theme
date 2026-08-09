/**
 * @jest-environment jsdom
 */

// jsdom ships no matchMedia, so stand one in. Mutable and shared rather than a fresh object
// per call, because the subscriber is now `<disclosure-elemental>` and it re-reads
// `query.matches` when the change fires rather than trusting the event. Flipping
// `mql.matches` before calling `crossBreakpoint` is what simulates a rotation.
const mql = {
  media: '',
  matches: false,
  addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => { crossBreakpoint = fn },
  removeEventListener: () => {}
}
let crossBreakpoint: (e: { matches: boolean }) => void

// docs.ts has no exports — it boots on import. Build the DOM first, then import.
beforeAll(async () => {
  window.matchMedia = ((media: string) => {
    mql.media = media
    return mql
  }) as unknown as typeof window.matchMedia
  document.body.innerHTML = `
    <div class="prose"><pre>npm install poops</pre></div>
    <switch-elemental><button data-theme-toggle aria-label="Dark mode"></button></switch-elemental>
    <aside class="sidebar" id="sidebar-nav" data-sidebar>
      <a class="nav-link" href="http://localhost/docs/intro/">Intro</a>
      <a class="nav-link" href="http://localhost/docs/other/">Other</a>
    </aside>
    <disclosure-elemental for="sidebar-nav" media="(min-width: 60rem)"><button data-nav-toggle></button></disclosure-elemental>
    <button data-nav-close></button>
    <main><a href="/somewhere/">In the article</a></main>
  `
  window.history.replaceState({}, '', '/docs/intro/index.html')
  Element.prototype.scrollIntoView = jest.fn()
  await import('../src/docs')
})

// What the copy button does is `<copy-elemental>`'s and is covered in prose.test.ts, with the
// clipboard stub that needs. What is asserted here is the import: docs.ts leans on prose.ts
// for the copy buttons and the theme toggle, and a dropped import is a docs page that has
// neither while still looking like one.
test('the docs bundle carries prose.ts, so code blocks get their copy button', () => {
  const wrap = document.querySelector('.prose .code-wrap')
  expect(wrap).not.toBeNull()
  expect(wrap!.querySelector('pre')).not.toBeNull()
  expect(wrap!.querySelector('copy-elemental > button')).not.toBeNull()
})

test('marks the nav link for the current page active, ignoring index.html', () => {
  const links = document.querySelectorAll('.sidebar a.nav-link')
  expect(links[0].classList.contains('active')).toBe(true)
  expect(links[1].classList.contains('active')).toBe(false)
})

test('theme toggle flips the root theme and persists it', () => {
  const btn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!
  btn.click()
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem('theme')).toBe('dark')
  btn.click()
  expect(document.documentElement.dataset.theme).toBe('light')
})

// Before any test clicks anything, deliberately: the transition lives on that class, and the
// class is the guarantee that closed is where the drawer *loads* rather than somewhere it
// travelled to while the reader watched. The first toggle brings it, and that toggle still
// animates — the class lands in the same style recalc as the state it animates.
test('a drawer nobody has touched cannot slide: the class carrying the transition arrives with the first toggle', () => {
  const sidebar = document.getElementById('sidebar-nav')!
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!
  expect(sidebar.classList.contains('sidebar-nav-ready')).toBe(false)

  toggle.click()
  expect(sidebar.classList.contains('sidebar-nav-ready')).toBe(true)
  toggle.click()
})

test('the element owns the state: the toggle writes aria-expanded and unhides the panel', () => {
  const sidebar = document.querySelector('[data-sidebar]')!
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!
  expect(toggle.getAttribute('aria-expanded')).toBe('false')
  expect(sidebar.hasAttribute('hidden')).toBe(true)

  toggle.click()
  expect(toggle.getAttribute('aria-expanded')).toBe('true')
  expect(sidebar.hasAttribute('hidden')).toBe(false)

  toggle.click()
  expect(toggle.getAttribute('aria-expanded')).toBe('false')
  expect(sidebar.hasAttribute('hidden')).toBe(true)
})

// Closed is `hidden="until-found"` rather than an offscreen transform, which is what keeps
// the links out of the tab order — and, unlike the `visibility` this replaced, still lets
// find-in-page reach one.
test('a closed drawer is hidden with until-found, so find-in-page still reaches it', () => {
  const sidebar = document.querySelector('[data-sidebar]')!
  expect(sidebar.getAttribute('hidden')).toBe('until-found')
})

test('the scrim closes the drawer', () => {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!
  toggle.click()
  document.querySelector<HTMLButtonElement>('[data-nav-close]')!.click()
  expect(toggle.getAttribute('aria-expanded')).toBe('false')
})

test('escape closes the drawer', () => {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!
  toggle.click()
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  expect(toggle.getAttribute('aria-expanded')).toBe('false')
})

// The one bit of focus management a non-modal drawer still owes: closing sets `hidden`, and
// a focused link inside it would leave focus on <body> with the next Tab restarting from the
// top of the document.
test('closing while focus is inside the drawer hands it back to the toggle', () => {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!
  toggle.click()
  document.querySelector<HTMLAnchorElement>('.sidebar a')!.focus()
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  expect(document.activeElement).toBe(toggle)
})

// The panel is the last thing in the layout and its button is the first thing in the topbar,
// so `Tab` alone would walk the brand, the search field and every icon link before reaching
// what just opened.
test('opening the drawer hands focus to the current page inside it', () => {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!
  toggle.click()
  expect(document.activeElement).toBe(document.querySelector('.sidebar a.active'))
  toggle.click()
})

// Crossing the breakpoint opens the rail too, and a rail stealing focus because the window
// got wider is worse than the problem the handover solves.
test('the rail does not take focus when the breakpoint opens it', () => {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!
  toggle.focus()
  mql.matches = true
  crossBreakpoint({ matches: true })
  expect(document.activeElement).toBe(toggle)
  mql.matches = false
  crossBreakpoint({ matches: false })
})

// Not modal: the article stays reachable, which is the APG disclosure pattern and the right
// amount for a panel that is a list of links to the same site.
test('the article is never inerted — this is a disclosure, not a dialog', () => {
  const main = document.querySelector('main')!
  document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!.click()
  expect(main.hasAttribute('inert')).toBe(false)
})

// The breakpoint is the element's `media` attribute now, not a matchMedia listener in here.
test('crossing the breakpoint holds the rail open, and closes it again on the way back', () => {
  const sidebar = document.querySelector('[data-sidebar]')!
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!

  mql.matches = true
  crossBreakpoint({ matches: true })
  expect(toggle.getAttribute('aria-expanded')).toBe('true')
  expect(sidebar.hasAttribute('hidden')).toBe(false)
  expect(sidebar.getAttribute('data-mode')).toBe('pinned')

  mql.matches = false
  crossBreakpoint({ matches: false })
  expect(sidebar.hasAttribute('hidden')).toBe(true)
  expect(sidebar.getAttribute('data-mode')).toBe('free')
})