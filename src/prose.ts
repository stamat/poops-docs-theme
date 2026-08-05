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
// And `<copy-elemental>`, which is the copy button below: the clipboard write, the copied and
// failed states, and the live region that says which — a swapped icon announces nothing, and
// telling a screen reader the copy landed is the whole reason the element exists. It also
// takes the button away on a page where `navigator.clipboard` is not there to be asked, which
// is any page served over plain `http`.
import 'book-of-elementals/copy'

// Put a copy button on every code block. Markdown output has none, so something has to add
// them; what a press then does is the element's, and the button is only markup here.
export function addCopyButtons(): void {
  document.querySelectorAll<HTMLPreElement>('.prose pre').forEach((pre, i) => {
    const wrap = document.createElement('div')
    wrap.className = 'code-wrap'
    pre.parentNode!.insertBefore(wrap, pre)
    wrap.appendChild(pre)

    // The element copies what `for` names, so the block needs an id — and the page it is on
    // is someone's markdown, where a heading or a hand-written anchor may already hold the
    // one we were about to mint. Taken rather than reused: pointing two elements at one id
    // is a copy button that copies the wrong block.
    if (!pre.id) {
      let n = i
      while (document.getElementById(`code-block-${n}`)) n++
      pre.id = `code-block-${n}`
    }

    const copy = document.createElement('copy-elemental')
    copy.setAttribute('for', pre.id)
    const btn = document.createElement('button')
    // Icon-only — the stylesheet draws the octicon, and the tick it becomes — so the name is
    // the label's job. `data-tip` is the same two words on screen; the element's own
    // `copied-text` and `error-text` defaults are what it says out loud.
    btn.setAttribute('aria-label', 'Copy code')
    btn.dataset.tip = 'Copied'
    btn.dataset.tipError = 'Copy failed'
    copy.appendChild(btn)
    wrap.appendChild(copy)
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
