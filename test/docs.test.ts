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

// Which element was scrolled to, not how many times: what the rail owes the reader is *their*
// page brought into view, and a call count cannot tell that from scrolling to the top of the
// list. `mock.instances` is the receiver of each call, which on a prototype stub is the element.
const scrolledIntoView = (): unknown =>
  (Element.prototype.scrollIntoView as jest.Mock).mock.instances[0]

// The index poops writes is every page's front matter verbatim, so these three entries are
// what a docs author can put in one: markup in a title, markup in a description, and a url
// that is not a url. Nothing here is exotic — it is the same file the theme fetches.
const INDEX = [
  { title: 'Getting started', description: 'How to <b>begin</b>', url: 'docs/getting-started/' },
  { title: '<img src=x onerror="alert(1)">', description: 'about xss', url: 'docs/evil/' },
  { title: 'Bad link', description: 'a scheme that is not a scheme', url: 'javascript:alert(1)' }
]

// The query goes out a debounce after the keystroke and the answer a promise after that — the
// index is fetched on the first search, not at boot. So typing is asynchronous now, and every
// caller waits out `delay="10"` on the element below plus the microtasks the fetch stub takes.
async function search(query: string): Promise<HTMLElement> {
  const input = document.getElementById('search-input') as HTMLInputElement
  input.value = query
  input.dispatchEvent(new Event('input'))
  await new Promise((resolve) => setTimeout(resolve, 30))
  return document.querySelector('suggest-elemental')!
}

// docs.ts has no exports — it boots on import. Build the DOM first, then import.
beforeAll(async () => {
  window.matchMedia = ((media: string) => {
    mql.media = media
    return mql
  }) as unknown as typeof window.matchMedia
  // jsdom ships no fetch, and an undefined one is a ReferenceError thrown at the first query
  // rather than a rejection the element can report.
  window.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve(INDEX) })) as unknown as typeof window.fetch
  document.body.innerHTML = `
    <div class="prose"><pre>npm install poops</pre><h2 id="one">One</h2><h3 id="one-a">One, closer up</h3><h2 id="two">Two</h2></div>
    <switch-elemental><button data-theme-toggle aria-label="Dark mode"></button></switch-elemental>
    <search-elemental class="search" delay="10">
      <search>
        <input type="search" id="search-input" placeholder="Search docs…">
        <button type="button" class="search-clear" aria-label="Clear the search" data-search-clear></button>
      </search>
      <suggest-elemental for="search-input"><ul></ul></suggest-elemental>
      <p class="sr-note sr-empty">No results</p>
      <p class="sr-note sr-error">Search failed</p>
    </search-elemental>
    <style>.nav-list .toc .toc-h3 { display: none }</style>
    <aside class="sidebar" id="sidebar-nav" data-sidebar>
      <nav class="nav" aria-label="Documentation"><ul class="nav-list">
        <li><a class="nav-link active" aria-current="page" href="http://localhost/docs/intro/">Intro</a>
          <nav class="toc" aria-label="On this page"><ul>
            <li class="toc-h2"><a href="#one">One</a></li>
            <li class="toc-h3"><a href="#one-a">One, closer up</a></li>
            <li class="toc-h2"><a href="#two">Two</a></li>
            <li class="toc-h2"><a href="#gone">A heading nobody wrote</a></li>
            <li class="toc-h2"><a href="#100%">A heading id nothing can decode</a></li>
          </ul></nav>
        </li>
        <li><a class="nav-link" href="http://localhost/docs/other/">Other</a></li>
      </ul></nav>
    </aside>
    <disclosure-elemental for="sidebar-nav" open-when="(min-width: 60rem)"><button data-nav-toggle></button></disclosure-elemental>
    <button data-nav-close></button>
    <main><a href="/somewhere/">In the article</a><textarea id="scratch"></textarea></main>
  `
  window.history.replaceState({}, '', '/docs/intro/index.html')
  Element.prototype.scrollIntoView = jest.fn()
  // The scrollspy reads geometry, and jsdom has none: every heading gets a fixed place in a
  // document tall enough to scroll past all of them. Installed before the import, because
  // docs.ts boots on it and takes its first reading there.
  Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
  Object.defineProperty(document.documentElement, 'scrollHeight', { value: 5000, configurable: true })
  window.innerHeight = 800
  for (const [id, top] of [['one', 1000], ['one-a', 1500], ['two', 2000]] as [string, number][]) {
    const heading = document.getElementById(id)!
    heading.getBoundingClientRect = () => ({ top: top - window.scrollY, height: 0 }) as DOMRect
    heading.style.scrollMarginTop = '28px'
  }
  // Inline, because jsdom has no stylesheet to read them from. The two together are the line a
  // clicked link parks a heading on, and 68 is the number the assertions below are pinned to.
  document.documentElement.style.scrollPaddingTop = '40px'
  await import('../src/docs')
  // the elements upgrade on import; let their connected callbacks land before anything types
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

// Which link carries the mark is `navtree.html`'s, and its cases are in navtree.test.ts. What
// is left here is the half a template cannot do: a rail deeper than the viewport opens at the
// reader's own page rather than at the top of the list.
test('the rail opens at the page the reader is on, not at the top of the list', () => {
  expect(scrolledIntoView()).toBe(document.querySelector('.sidebar a.nav-link.active'))
})

// The fixture's TOC carries `#100%`, which is a `URIError` out of `decodeURIComponent` rather
// than a link that fails to match. Every other test in this file is the rest of the assertion:
// the search box and the drawer below still work, because the boot no longer stops here.
test('a heading id that cannot be decoded drops out of the contents, and takes nothing with it', () => {
  expect(document.querySelector('.toc a[href="#100%"]')).not.toBeNull()
  expect(document.querySelector('search-elemental input')).not.toBeNull()
  expect(document.querySelector('[data-nav-toggle]')).not.toBeNull()
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

// The breakpoint is the element's `open-when` attribute now, not a matchMedia listener in here.
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

// First of the search tests on purpose: the index is fetched once and kept, so the only run
// that can fail is the one before it has ever arrived — which is also the site this catches,
// the one that never generated the file. `fetch` resolves on a 404, and the old code swallowed
// it and answered every query with "No results" — a true sentence about a search that never
// happened. The field is emptied at the end because the element treats a repeat of the query
// it last answered as nothing to do, error or not.
test('an index that never arrives says the search failed, not that nothing matched', async () => {
  ;(window.fetch as jest.Mock).mockImplementationOnce(() => Promise.resolve({ ok: false, status: 404 }))
  const panel = await search('begin')
  expect(document.querySelector('search-elemental')!.getAttribute('data-state')).toBe('error')
  expect(panel.hasAttribute('open')).toBe(false)
  expect(document.querySelector('.sr-error')!.textContent).toBe('Search failed')
  expect(document.querySelector('.search-elemental-status')!.textContent).toBe('Search failed')
  await search('')
})

// And the next query tries again rather than living with it: the failed load is dropped, so a
// blip is one search, not a dead box for the rest of the visit.
test('search finds a page by its description and links to it', async () => {
  const panel = await search('begin')
  const a = panel.querySelector('a')!
  expect(a.getAttribute('href')).toBe('http://localhost/docs/intro/docs/getting-started/')
  expect(a.querySelector('.sr-title')!.textContent).toBe('Getting started')
})

// A row is only an option to `<suggest-elemental>` if it is an `<a href>` inside the list, and
// only an option can be reached with the arrow keys or counted in what the live region says.
test('a hit is an option: a link in the list, and one the panel is open to show', async () => {
  const panel = await search('begin')
  expect(panel.hasAttribute('open')).toBe(true)
  expect(panel.querySelector('li > a')!.getAttribute('role')).toBe('option')
  expect(document.querySelector('.search-elemental-status')!.textContent).toBe('1 result')
})

// The field going back under the minimum is a question no longer being asked, and a panel
// left standing is an answer to it.
test('emptying the field takes the panel down', async () => {
  const panel = await search('begin')
  expect(panel.hasAttribute('open')).toBe(true)
  await search('')
  expect(panel.hasAttribute('open')).toBe(false)
})

// The index is front matter, verbatim — nothing between the author and this list escapes a
// thing. A title interpolated into `innerHTML` runs on every page the topbar sits on, which
// is every page.
test('a title carrying markup arrives as text: the tags are the title, not tags', async () => {
  const panel = await search('xss')
  expect(panel.querySelector('img')).toBeNull()
  expect(panel.querySelector('.sr-title')!.textContent).toBe('<img src=x onerror="alert(1)">')
})

test('a description carrying markup arrives as text too', async () => {
  const panel = await search('begin')
  expect(panel.querySelector('b')).toBeNull()
  expect(panel.querySelector('.sr-desc')!.textContent).toBe('How to <b>begin</b>')
})

// `href` takes a `javascript:` url as readily as a path, and a row whose link cannot be
// followed safely is worth less than no row — so the entry is dropped rather than rendered
// dead, and a search left with nothing says so.
//
// A listbox owns options, so the message is a box outside the panel rather than a row inside
// it, and the panel closes because nothing is in it. The live region says the same words: one
// sentence on screen and a different one in the reader's ear is two answers to one question.
test('a url with a scheme that is not http never becomes a link', async () => {
  const panel = await search('bad link')
  expect(panel.querySelector('a')).toBeNull()
  expect(panel.hasAttribute('open')).toBe(false)
  expect(document.querySelector('search-elemental')!.getAttribute('data-state')).toBe('empty')
  expect(document.querySelector('.sr-empty')!.textContent).toBe('No results')
  expect(document.querySelector('.search-elemental-status')!.textContent).toBe('No results')
})

// A search box in the topbar is on every page, so what is typed in it outlives the results it
// fetched. Both are the field being emptied, and the `input` event is the load-bearing part:
// `<search-elemental>` listens for nothing else, so a clear that fires none leaves the panel
// answering a query that is gone.
// The button replaces a native cross no keyboard could reach, so the caret goes back where it
// was: clearing is what a reader does before typing the next query.
test('the clear button empties the field and hands the caret back', async () => {
  const input = document.getElementById('search-input') as HTMLInputElement
  const panel = await search('begin')
  expect(panel.hasAttribute('open')).toBe(true)

  document.querySelector<HTMLButtonElement>('[data-search-clear]')!.click()
  expect(input.value).toBe('')
  expect(panel.hasAttribute('open')).toBe(false)
  expect(document.activeElement).toBe(input)
})

test('escape empties the field, and the panel goes with it', async () => {
  const input = document.getElementById('search-input') as HTMLInputElement
  const panel = await search('begin')
  expect(panel.hasAttribute('open')).toBe(true)

  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  expect(input.value).toBe('')
  expect(panel.hasAttribute('open')).toBe(false)
})

test('focus leaving the field empties it, and focus into the panel does not', async () => {
  const input = document.getElementById('search-input') as HTMLInputElement
  const panel = await search('begin')

  input.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: panel.querySelector('a') }))
  expect(input.value).toBe('begin')

  input.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: document.querySelector('main a') }))
  expect(input.value).toBe('')
  expect(panel.hasAttribute('open')).toBe(false)
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

// The rail is not a drawer to dismiss. `open-when` writes `open` when the query *changes*, so
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
// The table of contents, and which of its entries carries the mark. Where the reading line
// falls, and what happens at the foot of the page, are `scrollSpy`'s own tests in
// book-of-spells — what is covered here is the wiring: the right link, one at a time, and the
// entries this theme does not show left out of it.
function scrollTo(y: number): void {
  (window as unknown as { scrollY: number }).scrollY = y
  // rAF only, and only for the length of the scroll: the throttle is what makes the update
  // asynchronous, and every assertion below wants the answer on the next line.
  const raf = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { (cb as FrameRequestCallback)(0); return 1 })
  window.dispatchEvent(new Event('scroll'))
  raf.mockRestore()
}

const marked = (): string[] => Array.from(document.querySelectorAll('.toc a[aria-current]')).map((a) => (a as HTMLAnchorElement).hash)

test('the section being read is the one marked in the table of contents', () => {
  scrollTo(1100)
  expect(marked()).toEqual(['#one'])
  scrollTo(2100)
  expect(marked()).toEqual(['#two'])
})

test('the mark says location, not page — the page is the sidebar link this list hangs under', () => {
  scrollTo(1100)
  expect(document.querySelector('.toc a[href="#one"]')!.getAttribute('aria-current')).toBe('location')
  // The sidebar link keeps `page` throughout — it is written server-side and nothing here
  // touches it, which is the distinction this test exists to hold.
  expect(document.querySelector('.nav-link.active')!.getAttribute('aria-current')).toBe('page')
})

test('an H3 entry the rail does not show never takes the mark, and its H2 keeps it', () => {
  scrollTo(1600)
  expect(marked()).toEqual(['#one'])
})

test('a link pointing at a heading that is not on the page is left out rather than thrown at', () => {
  scrollTo(4200)
  expect(marked()).toEqual(['#two'])
})

test('the reading line is where a clicked link parks a heading: the root\'s scroll padding and the heading\'s own margin, added', () => {
  // 40 + 28 = 68. At 950 the first heading sits 50px down — inside the line, so it is being
  // read; at 920 it is 80px down, still below it. Either declaration dropped moves the line
  // past one of these two.
  scrollTo(950)
  expect(marked()).toEqual(['#one'])
  scrollTo(920)
  expect(marked()).toEqual([])
})

test('nothing is marked above the first heading', () => {
  scrollTo(0)
  expect(marked()).toEqual([])
})
