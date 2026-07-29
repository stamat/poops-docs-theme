/**
 * @jest-environment jsdom
 */

// prose.ts has no docs chrome to lean on — it must boot on a bare markdown page.
beforeAll(async () => {
  document.body.innerHTML = `
    <div class="prose"><pre>npm install poops</pre></div>
    <button data-theme-toggle></button>
    <nav class="topbar-nav"><ul class="topbar-links" id="topbar-links">
      <li><a href="/docs/">Docs</a></li>
      <li><a href="/blog/">Blog</a></li>
    </ul></nav>
    <button data-menu-toggle aria-expanded="false" aria-controls="topbar-links"></button>
    <a href="/after/" id="after-menu">After</a>
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

test('hamburger opens the topbar links, a click elsewhere and Escape close them', () => {
  const btn = document.querySelector<HTMLButtonElement>('[data-menu-toggle]')!
  const menu = document.querySelector('.topbar-links')!
  btn.click()
  expect(menu.classList.contains('open')).toBe(true)
  expect(btn.getAttribute('aria-expanded')).toBe('true')
  expect(document.activeElement).toBe(menu.querySelector('a'))

  document.body.click()
  expect(menu.classList.contains('open')).toBe(false)
  expect(btn.getAttribute('aria-expanded')).toBe('false')

  btn.click()
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  expect(menu.classList.contains('open')).toBe(false)
})

test('arrow keys walk the open panel and wrap around it', () => {
  const btn = document.querySelector<HTMLButtonElement>('[data-menu-toggle]')!
  const [first, second] = Array.from(document.querySelectorAll<HTMLAnchorElement>('.topbar-links a'))
  btn.click()
  expect(document.activeElement).toBe(first)

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
  expect(document.activeElement).toBe(second)
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
  expect(document.activeElement).toBe(first)
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
  expect(document.activeElement).toBe(second)

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  expect(document.activeElement).toBe(btn)
})

test('the open panel traps tab between the hamburger and its own links', () => {
  const btn = document.querySelector<HTMLButtonElement>('[data-menu-toggle]')!
  const [first, second] = Array.from(document.querySelectorAll<HTMLAnchorElement>('.topbar-links a'))
  const tab = (shiftKey = false): void => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey }))
  }
  btn.click()

  second.focus()
  tab() // past the last link, round to the hamburger
  expect(document.activeElement).toBe(btn)
  tab() // and back into the panel
  expect(document.activeElement).toBe(first)
  tab(true)
  expect(document.activeElement).toBe(btn)
  tab(true) // backwards off the hamburger, round to the last link
  expect(document.activeElement).toBe(second)

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  // closed: nothing to trap, so tab is the browser's again and jsdom moves nothing
  tab()
  expect(document.activeElement).toBe(btn)
})

test('tabbing out of the panel closes it, moving within it does not', () => {
  const btn = document.querySelector<HTMLButtonElement>('[data-menu-toggle]')!
  const menu = document.querySelector('.topbar-links')!
  const inside = menu.querySelector('a')!
  btn.click()

  btn.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: inside }))
  expect(menu.classList.contains('open')).toBe(true)

  inside.dispatchEvent(new FocusEvent('focusout', {
    bubbles: true,
    relatedTarget: document.getElementById('after-menu')
  }))
  expect(menu.classList.contains('open')).toBe(false)
})

test('boots without a sidebar, search field or nav toggle', () => {
  expect(document.querySelector('[data-sidebar]')).toBeNull()
  expect(document.getElementById('search-input')).toBeNull()
})
