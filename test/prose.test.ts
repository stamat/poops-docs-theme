/**
 * @jest-environment jsdom
 */

// prose.ts has no docs chrome to lean on — it must boot on a bare markdown page. What the
// topbar's row of links then does is `<navbar-elemental>`'s and is deliberately not covered
// here: it measures its own row with an `IntersectionObserver`, which jsdom does not have, and
// a stub of one would be a test of the stub. What this file owes that element is the import
// that registers it, and that is asserted.
let written = ''

beforeAll(async () => {
  // `<copy-elemental>` takes the button away where there is no clipboard to write to, and
  // jsdom has none — so the stub is what makes a copy button exist here at all, and it has
  // to be in place before the import, which is when the element upgrades and looks.
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText: (text: string) => { written = text; return Promise.resolve() } }
  })
  document.body.innerHTML = `
    <div class="prose"><pre>npm install poops</pre></div>
    <switch-elemental><button data-theme-toggle aria-label="Dark mode"></button></switch-elemental>
  `
  await import('../src/prose')
})

// The `for` is the whole wiring: the element copies the block that id names, so an id that
// points at nothing — or at the wrong block — is a button that looks right and copies the
// neighbour's code.
test('every code block is wrapped and pointed at by a copy button that copies it', async () => {
  const wrap = document.querySelector('.prose .code-wrap')
  expect(wrap).not.toBeNull()
  const pre = wrap!.querySelector('pre')
  expect(pre).not.toBeNull()

  const copy = wrap!.querySelector('copy-elemental')
  expect(copy).not.toBeNull()
  expect(copy!.getAttribute('for')).toBe(pre!.id)

  copy!.querySelector('button')!.click()
  expect(written).toBe('npm install poops')
  await new Promise((resolve) => setTimeout(resolve, 0))
  expect((copy as HTMLElement).dataset.state).toBe('copied')
})

// A tick that a screen reader is never told about is the gap the element was taken for, so
// the announcement is asserted rather than assumed.
test('the copy says so out loud, not only in the icon', async () => {
  // The element clears the live region and writes to it a task later, so that a second copy
  // is a change the region announces rather than the same text set twice.
  await new Promise((resolve) => setTimeout(resolve, 0))
  const status = document.querySelector('copy-elemental > [role="status"]')
  expect(status).not.toBeNull()
  expect(status!.textContent).toBe('Copied')
})

// The state has to reach a screen reader as well as the stylesheet, so `aria-checked` is
// asserted beside `data-theme` — those two disagreeing is the whole failure mode a switch
// exists to prevent.
test('the theme switch flips the root theme, persists it, and announces it', () => {
  const btn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!
  expect(btn.getAttribute('role')).toBe('switch')

  btn.click()
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem('theme')).toBe('dark')
  expect(btn.getAttribute('aria-checked')).toBe('true')

  btn.click()
  expect(document.documentElement.dataset.theme).toBe('light')
  expect(btn.getAttribute('aria-checked')).toBe('false')
})

// The topbar is built out of two custom elements, and this bundle is the only thing that
// registers them: a dropped import is a theme switch that does nothing and a row of links that
// never folds away — both of which still look like a topbar until you use them.
test('the bundle registers the custom elements the topbar is built out of', () => {
  expect(customElements.get('switch-elemental')).toBeDefined()
  expect(customElements.get('navbar-elemental')).toBeDefined()
})

test('boots without a sidebar, search field or nav toggle', () => {
  expect(document.querySelector('[data-sidebar]')).toBeNull()
  expect(document.getElementById('search-input')).toBeNull()
})

// The bar's mode is measured by `<navbar-elemental>` and jsdom cannot measure anything, so
// `data-mode` is written by hand here — which is the seam the theme's own code reads anyway.
// What is asserted is that the controls are *moved*: found in one place and gone from the
// other, in both directions. A copy left behind is a second switch for one setting, and a
// switch missing on the way back is a theme a reader cannot change again without a reload.
describe('the icon links and the theme switch ride into the drawer', () => {
  let bar: HTMLElement

  beforeEach(async () => {
    document.body.innerHTML = `
      <header class="topbar"><navbar-elemental>
        <nav class="rail"><ul><li><a href="/docs/">Docs</a></li></ul></nav>
        <div class="topbar-actions">
          <tooltip-elemental><a class="icon-btn" href="https://example.com" title="npm"><span aria-hidden="true">n</span></a><span>npm</span></tooltip-elemental>
          <switch-elemental><button data-theme-toggle aria-label="Dark mode"></button></switch-elemental>
          <button data-navbar-toggle aria-label="Site navigation"></button>
        </div>
      </navbar-elemental></header>
    `
    bar = document.querySelector('navbar-elemental')!
    bar.dataset.mode = 'bar'
    const { setupDrawerActions, setupTheme } = await import('../src/prose')
    // The bundle wired the switch that was in the document at boot, and this one is not it.
    setupTheme()
    setupDrawerActions()
  })

  // A `MutationObserver` delivers on a microtask, so every mode change is awaited before it is
  // asked about.
  const setMode = async (mode: string): Promise<void> => {
    bar.dataset.mode = mode
    await Promise.resolve()
  }

  test('into the drawer as its own row, and out of the bar', async () => {
    await setMode('stack')

    const slot = document.querySelector('.rail > ul > li.drawer-actions')
    expect(slot).not.toBeNull()
    // The element measures its row against this attribute's absence: an item without it is a
    // link competing for room on a bar it is never going to be on.
    expect(slot!.hasAttribute('data-navbar-stack')).toBe(true)
    expect(slot!.querySelector('.icon-btn')).not.toBeNull()
    expect(slot!.querySelector('switch-elemental')).not.toBeNull()
    expect(document.querySelectorAll('switch-elemental')).toHaveLength(1)
    expect(document.querySelector('.topbar-actions .icon-btn')).toBeNull()
    // The link travels alone. Its `<tooltip-elemental>` stays on the bar holding the bubble it
    // already wired, which is what keeps the element from being torn down and built again.
    expect(document.querySelector('.topbar-actions > tooltip-elemental')).not.toBeNull()
    expect(slot!.querySelector('tooltip-elemental')).toBeNull()
  })

  test('and back onto the bar ahead of the drawer button when the row is one again', async () => {
    await setMode('stack')
    await setMode('bar')

    expect(document.querySelector('.drawer-actions')).toBeNull()
    const order = Array.from(document.querySelectorAll('.topbar-actions > *'))
      .map((el) => el.className || el.localName)
    expect(order).toEqual(['tooltip-elemental', 'switch-elemental', 'button'])
    // Back inside the wrapper it started in, and not merely back in the row: a link left beside
    // its own tooltip is markup no template would produce and nothing downstream expects.
    expect(document.querySelector('.topbar-actions > tooltip-elemental > .icon-btn')).not.toBeNull()
  })

  // The words in `title` are the only name this link has, so the element writes them back as
  // `aria-label` and stops there. The trip into the drawer is where that can come undone: an
  // element rebuilt against a trigger whose `title` is gone reads the bubble as a description
  // instead, and the link is announced as "npm, npm".
  test('the icon link is named once, before and after the trip', async () => {
    const link = document.querySelector<HTMLElement>('.icon-btn')!
    expect(link.getAttribute('aria-label')).toBe('npm')
    expect(link.hasAttribute('title')).toBe(false)

    await setMode('stack')
    await setMode('bar')

    expect(link.getAttribute('aria-label')).toBe('npm')
    expect(link.getAttribute('aria-describedby')).toBeNull()
  })

  test('the switch still flips the theme after the trip', async () => {
    await setMode('stack')
    await setMode('bar')

    document.documentElement.dataset.theme = 'light'
    document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!.click()
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
