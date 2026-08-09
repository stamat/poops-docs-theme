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

// The index poops writes is every page's front matter verbatim, so these three entries are
// what a docs author can put in one: markup in a title, markup in a description, and a url
// that is not a url. Nothing here is exotic — it is the same file the theme fetches.
const INDEX = [
  { title: 'Getting started', description: 'How to <b>begin</b>', url: 'docs/getting-started/' },
  { title: '<img src=x onerror="alert(1)">', description: 'about xss', url: 'docs/evil/' },
  { title: 'Bad link', description: 'a scheme that is not a scheme', url: 'javascript:alert(1)' }
]

function search(query: string): HTMLElement {
  const input = document.getElementById('search-input') as HTMLInputElement
  input.value = query
  input.dispatchEvent(new Event('input'))
  return document.getElementById('search-results')!
}

// docs.ts has no exports — it boots on import. Build the DOM first, then import.
beforeAll(async () => {
  window.matchMedia = ((media: string) => {
    mql.media = media
    return mql
  }) as unknown as typeof window.matchMedia
  // jsdom ships no fetch, and an undefined one throws a ReferenceError the `.catch` on the
  // promise never sees — the whole boot would go down with it.
  window.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(INDEX) })) as unknown as typeof window.fetch
  document.body.innerHTML = `
    <div class="prose"><pre>npm install poops</pre></div>
    <switch-elemental><button data-theme-toggle aria-label="Dark mode"></button></switch-elemental>
    <div class="search">
      <input type="search" id="search-input">
      <div class="search-results" id="search-results" hidden></div>
    </div>
    <aside class="sidebar" id="sidebar-nav" data-sidebar>
      <a class="nav-link" href="http://localhost/docs/intro/">Intro</a>
      <a class="nav-link" href="http://localhost/docs/other/">Other</a>
    </aside>
    <disclosure-elemental for="sidebar-nav" media="(min-width: 60rem)"><button data-nav-toggle></button></disclosure-elemental>
    <button data-nav-close></button>
    <main><a href="/somewhere/">In the article</a><textarea id="scratch"></textarea></main>
  `
  window.history.replaceState({}, '', '/docs/intro/index.html')
  Element.prototype.scrollIntoView = jest.fn()
  await import('../src/docs')
  // the index arrives on a promise; let it land before anything types
  await new Promise((resolve) => setTimeout(resolve, 0))
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

test('search finds a page by its description and links to it', () => {
  const box = search('begin')
  const a = box.querySelector('a')!
  expect(a.getAttribute('href')).toBe('http://localhost/docs/intro/docs/getting-started/')
  expect(a.querySelector('.sr-title')!.textContent).toBe('Getting started')
})

// The index is front matter, verbatim — nothing between the author and this list escapes a
// thing. A title interpolated into `innerHTML` runs on every page the topbar sits on, which
// is every page.
test('a title carrying markup arrives as text: the tags are the title, not tags', () => {
  const box = search('xss')
  expect(box.querySelector('img')).toBeNull()
  expect(box.querySelector('.sr-title')!.textContent).toBe('<img src=x onerror="alert(1)">')
})

test('a description carrying markup arrives as text too', () => {
  const box = search('begin')
  expect(box.querySelector('b')).toBeNull()
  expect(box.querySelector('.sr-desc')!.textContent).toBe('How to <b>begin</b>')
})

// `href` takes a `javascript:` url as readily as a path, and a row whose link cannot be
// followed safely is worth less than no row — so the entry is dropped rather than rendered
// dead, and a list left with nothing says so.
test('a url with a scheme that is not http never becomes a link', () => {
  const box = search('bad link')
  expect(box.querySelector('a')).toBeNull()
  expect(box.querySelector('.sr-empty')!.textContent).toBe('No results')
})

// Dispatched at whatever holds focus and left to bubble, which is where a real keydown
// starts — the handler reads its target to decide whether somebody is mid-word, so an event
// fired at `document` would be a test that cannot tell the two cases apart.
function press(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  ;(document.activeElement ?? document).dispatchEvent(event)
  return event
}

test('slash puts the cursor in the search field, and is not typed into it', () => {
  const input = document.getElementById('search-input') as HTMLInputElement
  document.querySelector<HTMLAnchorElement>('main a')!.focus()
  expect(press('/').defaultPrevented).toBe(true)
  expect(document.activeElement).toBe(input)
})

// The one keystroke a reader may be in the middle of. Firefox's own quick-find makes the
// same exception, and a shortcut that eats a slash out of a sentence is worse than no
// shortcut.
test('slash typed while a field has focus is a slash, not a shortcut', () => {
  const scratch = document.getElementById('scratch') as HTMLTextAreaElement
  scratch.focus()
  expect(press('/').defaultPrevented).toBe(false)
  expect(document.activeElement).toBe(scratch)
})

test('cmd-k and ctrl-k reach the field from anywhere, a text field included', () => {
  const input = document.getElementById('search-input') as HTMLInputElement
  const scratch = document.getElementById('scratch') as HTMLTextAreaElement

  scratch.focus()
  expect(press('k', { metaKey: true }).defaultPrevented).toBe(true)
  expect(document.activeElement).toBe(input)

  scratch.focus()
  expect(press('K', { ctrlKey: true }).defaultPrevented).toBe(true)
  expect(document.activeElement).toBe(input)
})

// A plain `k` is a letter, Alt+K is a character on layouts that are not this one, and
// Ctrl+Shift+K opens the web console — a docs page that swallows a devtools shortcut has
// taken something it cannot give back.
test('k without a modifier, with the wrong one, or with shift held, is left alone', () => {
  const scratch = document.getElementById('scratch') as HTMLTextAreaElement
  scratch.focus()
  expect(press('k').defaultPrevented).toBe(false)
  expect(press('k', { altKey: true }).defaultPrevented).toBe(false)
  expect(press('K', { ctrlKey: true, shiftKey: true }).defaultPrevented).toBe(false)
  expect(press('k', { metaKey: true, shiftKey: true }).defaultPrevented).toBe(false)
  expect(document.activeElement).toBe(scratch)
})

// The rail is not a drawer to dismiss. `media` writes `open` when the query *changes*, so
// nothing puts back a rail Escape closed, and the toggle that would is `display: none` up
// here — the panel would be gone for the rest of the visit.
test('escape leaves the rail standing above the breakpoint', () => {
  const sidebar = document.querySelector('[data-sidebar]')!
  const toggle = document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!

  mql.matches = true
  crossBreakpoint({ matches: true })
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  expect(toggle.getAttribute('aria-expanded')).toBe('true')
  expect(sidebar.hasAttribute('hidden')).toBe(false)

  document.querySelector<HTMLButtonElement>('[data-nav-close]')!.click()
  expect(sidebar.hasAttribute('hidden')).toBe(false)

  mql.matches = false
  crossBreakpoint({ matches: false })
})