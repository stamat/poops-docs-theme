/**
 * @jest-environment jsdom
 */

// docs.ts has no exports — it boots on import. Build the DOM first, then import.
beforeAll(async () => {
  document.body.innerHTML = `
    <div class="prose"><pre>npm install poops</pre></div>
    <button data-theme-toggle></button>
    <aside class="sidebar" data-sidebar>
      <a class="nav-link" href="http://localhost/docs/intro/">Intro</a>
      <a class="nav-link" href="http://localhost/docs/other/">Other</a>
    </aside>
    <button data-nav-toggle></button>
    <button data-nav-close></button>
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

test('mobile nav toggle opens and closes the sidebar', () => {
  const sidebar = document.querySelector('[data-sidebar]')!
  document.querySelector<HTMLButtonElement>('[data-nav-toggle]')!.click()
  expect(sidebar.classList.contains('open')).toBe(true)
  document.querySelector<HTMLButtonElement>('[data-nav-close]')!.click()
  expect(sidebar.classList.contains('open')).toBe(false)
})
