/**
 * @jest-environment jsdom
 */

// prose.ts has no docs chrome to lean on — it must boot on a bare markdown page.
beforeAll(async () => {
  document.body.innerHTML = `
    <div class="prose"><pre>npm install poops</pre></div>
    <button data-theme-toggle></button>
  `
  await import('../src/prose')
})

test('wraps code blocks and adds a copy button', () => {
  const wrap = document.querySelector('.prose .code-wrap')
  expect(wrap).not.toBeNull()
  expect(wrap!.querySelector('pre')).not.toBeNull()
  expect(wrap!.querySelector('button.copy-btn')).not.toBeNull()
})

test('theme toggle flips the root theme and persists it', () => {
  const btn = document.querySelector<HTMLButtonElement>('[data-theme-toggle]')!
  btn.click()
  expect(document.documentElement.dataset.theme).toBe('dark')
  expect(localStorage.getItem('theme')).toBe('dark')
  btn.click()
  expect(document.documentElement.dataset.theme).toBe('light')
})

test('boots without a sidebar, search field or nav toggle', () => {
  expect(document.querySelector('[data-sidebar]')).toBeNull()
  expect(document.getElementById('search-input')).toBeNull()
})
