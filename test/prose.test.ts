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
