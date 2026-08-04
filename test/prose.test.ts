/**
 * @jest-environment jsdom
 */

// prose.ts has no docs chrome to lean on — it must boot on a bare markdown page. What the
// topbar's row of links then does is `<navbar-elemental>`'s and is deliberately not covered
// here: it measures its own row with an `IntersectionObserver`, which jsdom does not have, and
// a stub of one would be a test of the stub. What this file owes that element is the import
// that registers it, and that is asserted.
beforeAll(async () => {
  document.body.innerHTML = `
    <div class="prose"><pre>npm install poops</pre></div>
    <switch-elemental><button data-theme-toggle aria-label="Dark mode"></button></switch-elemental>
  `
  await import('../src/prose')
})

test('wraps code blocks and adds a copy button', () => {
  const wrap = document.querySelector('.prose .code-wrap')
  expect(wrap).not.toBeNull()
  expect(wrap!.querySelector('pre')).not.toBeNull()
  expect(wrap!.querySelector('button.copy-btn')).not.toBeNull()
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
