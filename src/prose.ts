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
    // A block that scrolls sideways is a box a mouse can reach and a keyboard cannot, unless
    // something inside it takes focus — and nothing does: the copy button is a sibling in the
    // wrapper below, not a child of the `pre`. Set for every block rather than the ones
    // measured to overflow, because whether the code is wider than the column is a question
    // the viewport answers, and a tabindex decided once is wrong at the first resize.
    pre.tabIndex = 0

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

// Poops writes a permalink anchor into every heading, and before 2.2.0 it wrote one that was
// `aria-hidden="true"` and still focusable — a link a keyboard reaches once per heading and a
// screen reader cannot name when it lands there. Fixed at the source, but `poops` is a peer
// here at `>=2.0.0`, so the versions this theme says it supports include the ones that write
// it. Cheap to make right from this end, and a no-op on a build that already did.
//
// Remove when the peer floor rises past the fixed release.
export function fixHeadingAnchors(): void {
  document.querySelectorAll<HTMLAnchorElement>('.heading-anchor[aria-hidden="true"]').forEach((a) => {
    a.tabIndex = -1
    a.removeAttribute('aria-label')
  })
}

// A wide table scrolls sideways inside the column — `.prose table` is `display: block` with
// `overflow-x: auto` — which is the same box a mouse can pan and a keyboard cannot. Focusable
// for the same reason a code block is, and by the same unconditional rule: how wide the column
// is at the moment says nothing about how wide it will be after a rotation.
//
// `display: block` costs the element none of its semantics here: the browser's own
// accessibility tree still reports table, rowgroup, row, cell and columnheader for it.
export function makeTablesScrollable(): void {
  document.querySelectorAll<HTMLTableElement>('.prose table').forEach((table) => { table.tabIndex = 0 })
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

// The icon links and the theme switch sit at the right of the bar, which on a phone is a row
// already holding a brand, a search field and a hamburger. Once the site's links have folded
// into the drawer, these follow them down into it and come back up when the bar returns.
//
// Moved and never copied. A second `<switch-elemental>` is a second control for one setting,
// and two of them is one that can be left saying the opposite of the theme on screen; a second
// copy of the links is a second thing to keep in step with `site.iconLinks`. `<navbar-elemental>`
// moves nothing the page wrote — that is its promise — so the move is the page's own.
//
// `data-navbar-stack` is the element's hook for a row belonging to the drawer alone: it is left
// out of the measurement and out of the copy being measured, so a bar that has room for one
// more link still gets it.
export function setupDrawerActions(): void {
  const bar = document.querySelector<HTMLElement>('.topbar navbar-elemental')
  const actions = document.querySelector<HTMLElement>('.topbar-actions')
  // The row of links *is* the drawer, so no `site.links` means there is nowhere to move to —
  // and no hamburger either. The controls stay on the bar at every width, which is where a
  // topbar with nothing else on it has the room for them anyway.
  const row = bar?.querySelector<HTMLElement>('.rail > ul:not([data-navbar-probe])')
  if (!bar || !actions || !row) return

  const controls = Array.from(actions.querySelectorAll<HTMLElement>(':scope > .icon-btn, :scope > switch-elemental'))
  if (!controls.length) return

  const slot = document.createElement('li')
  slot.className = 'drawer-actions'
  slot.setAttribute('data-navbar-stack', '')

  const sync = (): void => {
    const stacked = bar.dataset.mode === 'stack'
    if (stacked === slot.isConnected) return
    if (stacked) {
      row.append(slot)
      slot.append(...controls)
      return
    }
    // Back where the markup had them, in their own order: ahead of the drawer's button, which
    // is last in the row and stays there.
    const toggle = actions.querySelector('[data-navbar-toggle]')
    for (const control of controls) actions.insertBefore(control, toggle)
    slot.remove()
  }

  // The element writes `data-mode` and rewrites it on every resize that crosses the point where
  // the links stop fitting — which is measured, not a breakpoint, so there is no media query
  // here to watch instead.
  new MutationObserver(sync).observe(bar, { attributeFilter: ['data-mode'] })
  sync()
}

// Run fn once the DOM is parsed. Exported so docs.ts boots on the same tick.
export function onReady(fn: () => void): void {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn)
  else fn()
}

onReady(() => {
  addCopyButtons()
  makeTablesScrollable()
  fixHeadingAnchors()
  setupTheme()
  setupDrawerActions()
})
