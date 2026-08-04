// Poops prose client — the behavior a bare markdown page needs: copy buttons and
// the theme toggle. Bundled to IIFE by poops.
// docs.ts imports this, so the docs bundle gets it too. Never load both scripts.

// Registers `<switch-elemental>` on include. Here rather than in docs.ts because the theme
// toggle is in the topbar of both layouts, and prose is the one they share.
import 'book-of-elementals/switch'
// And `<navbar-elemental>`, for the same reason: the topbar's row of `site.links` is the
// element, and with it the overflow panel, the drawer, the hamburger and the APG's disclosure
// navigation keyboard. Nothing to instantiate and no state here — the element measures its own
// row, so the only breakpoint anyone writes is the `media` attribute in topbar.html.
import 'book-of-elementals/navbar'

// Octicons: copy-16 and check-16.
const COPY_SVG = '<svg class="icon-copy" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"></path><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path></svg>'
const CHECK_SVG = '<svg class="icon-check" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L1.72 8.78a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path></svg>'

// Add a copy button to every code block.
export function addCopyButtons(): void {
  document.querySelectorAll<HTMLPreElement>('.prose pre').forEach((pre) => {
    const wrap = document.createElement('div')
    wrap.className = 'code-wrap'
    pre.parentNode!.insertBefore(wrap, pre)
    wrap.appendChild(pre)
    const btn = document.createElement('button')
    btn.className = 'copy-btn'
    btn.type = 'button'
    btn.setAttribute('aria-label', 'Copy code')
    btn.dataset.tip = 'Copied'
    btn.innerHTML = COPY_SVG + CHECK_SVG
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(pre.innerText).then(() => {
        btn.classList.add('copied')
        setTimeout(() => btn.classList.remove('copied'), 1500)
      })
    })
    wrap.appendChild(btn)
  })
}

// `<switch-elemental>` owns `checked`, and `role="switch"` plus `aria-checked` follow it. What
// is left here is the two ends: seeding the switch from the theme the inline boot script has
// already chosen, and writing the theme back out when it flips.
export function setupTheme(): void {
  const sw = document.querySelector('switch-elemental') as (HTMLElement & { checked?: boolean }) | null
  if (!sw) return

  // The boot script in the <head> sets data-theme before this bundle runs — from storage, or
  // from prefers-color-scheme on a first visit. Seeding rather than defaulting to off is what
  // stops a page that rendered dark from announcing its dark-mode switch as off.
  sw.checked = document.documentElement.dataset.theme === 'dark'

  sw.addEventListener('switch-toggle', (e) => {
    const next = (e as CustomEvent<{ checked: boolean }>).detail.checked ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('theme', next) } catch { /* private mode */ }
  })
}

// Run fn once the DOM is parsed. Exported so docs.ts boots on the same tick.
export function onReady(fn: () => void): void {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn)
  else fn()
}

onReady(() => {
  addCopyButtons()
  setupTheme()
})
