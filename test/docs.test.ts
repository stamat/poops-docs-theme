/**
 * @jest-environment jsdom
 */

// jsdom ships no matchMedia, so stand one in and keep the change handler: it is
// what closes the drawer when a rotation crosses the breakpoint.
let crossBreakpoint: (e: { matches: boolean }) => void

// docs.ts has no exports — it boots on import. Build the DOM first, then import.
beforeAll(async () => {
  window.matchMedia = ((media: string) => ({
    media,
    matches: false,
    addEventListener: (_: string, fn: (e: { matches: boolean }) => void) => { crossBreakpoint = fn }
  })) as unknown as typeof window.matchMedia
  document.body.innerHTML = `
    <div class="prose"><pre>npm install poops</pre></div>
    <button data-theme-toggle></button>
    <aside class="sidebar" data-sidebar>
      <a class="nav-link" href="http://localhost/docs/intro/">Intro</a>
      <a class="nav-link" href="http://localhost/docs/other/">Other</a>
    </aside>
    <button data-nav-toggle></button>
    <button data-nav-close></button>
    <main><a href="/somewhere/">In the article</a></main>
  `
  window.history.replaceState({}, '', '/docs/intro/index.html')
  Element.prototype.scrollIntoView = jest.fn()
  await import('../src/docs')
})

test('wraps code blocks and adds a copy button', () => {
  const wrap = document.querySelector('.prose .code-wrap')
  expect(wrap).not.toBeNull()
  expect(wrap!.querySelector('pre')).not.toBeNull()
  expect(wrap!.querySelector('button.copy-btn')).not.toBeNull()
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

test('mobile nav toggle opens and closes the sidebar, and inerts the article while open', () => {
  const sidebar = document.querySelector('[data-sidebar]')!
  const main = document.querySelector('main')!
  document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!.click()
  expect(sidebar.classList.contains('open')).toBe(true)
  expect(main.hasAttribute('inert')).toBe(true)
  document.querySelector<HTMLButtonElement>('[data-nav-close]')!.click()
  expect(sidebar.classList.contains('open')).toBe(false)
  expect(main.hasAttribute('inert')).toBe(false)
})

test('the open drawer takes focus at the current page and gives it back on close', () => {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!
  const active = document.querySelector('.sidebar a.nav-link.active')
  toggle.click()
  expect(document.activeElement).toBe(active)

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  expect(document.activeElement).toBe(toggle)
})

// Tab is dispatched at the document, where the trap listens; jsdom moves no focus
// on its own, so whatever ends up focused is the trap's doing.
const tab = (shiftKey = false): void => {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey }))
}

test('the open drawer traps tab between the toggle and its own links', () => {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!
  const links = document.querySelectorAll<HTMLAnchorElement>('.sidebar a.nav-link')
  const last = links[links.length - 1]
  toggle.click()

  last.focus()
  tab() // past the last link, round to the toggle
  expect(document.activeElement).toBe(toggle)
  tab() // and back into the drawer
  expect(document.activeElement).toBe(links[0])
  tab(true)
  expect(document.activeElement).toBe(toggle)
  tab(true) // backwards off the toggle, round to the last link
  expect(document.activeElement).toBe(last)

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
})

test('the trap is off once the drawer is closed', () => {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!
  toggle.focus()
  tab()
  expect(document.activeElement).toBe(toggle) // untouched: no trap, jsdom moves nothing
})

test('arrows walk the sidebar and wrap, at any width, without taking in the toggle', () => {
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!
  const links = document.querySelectorAll<HTMLAnchorElement>('.sidebar a.nav-link')
  const arrow = (key: string): void => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key }))
  }

  links[0].focus() // drawer closed: arrows still work inside the sidebar
  arrow('ArrowDown')
  expect(document.activeElement).toBe(links[1])
  arrow('ArrowDown')
  expect(document.activeElement).toBe(links[0]) // wraps, never onto the toggle
  arrow('ArrowUp')
  expect(document.activeElement).toBe(links[1])

  toggle.focus() // focus outside the sidebar: arrows are the page's again
  arrow('ArrowDown')
  expect(document.activeElement).toBe(toggle)
})

test('space opens a sidebar link, like enter does natively', () => {
  const link = document.querySelector<HTMLAnchorElement>('.sidebar a.nav-link')!
  const opened = jest.fn((e: Event) => e.preventDefault())
  link.addEventListener('click', opened)
  link.focus()
  link.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
  expect(opened).toHaveBeenCalled()
  link.removeEventListener('click', opened)
})

test('growing past the breakpoint closes the drawer, so inert cannot stick', () => {
  const sidebar = document.querySelector('[data-sidebar]')!
  const main = document.querySelector('main')!
  document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!.click()
  expect(main.hasAttribute('inert')).toBe(true)

  crossBreakpoint({ matches: true })
  expect(sidebar.classList.contains('open')).toBe(false)
  expect(main.hasAttribute('inert')).toBe(false)
})
