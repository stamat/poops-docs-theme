// jsdom implements `attachInternals()` and the ElementInternals object, but none of the
// form-associated half of it — `setFormValue`, `setValidity`, `checkValidity` and
// `reportValidity` are all undefined. `<switch-elemental>` is form-associated, so it calls
// `setFormValue` on upgrade and the whole suite dies inside `customElements.define`.
//
// Removable once book-of-elementals ships the guard for `setFormValue` that it already has
// for `setValidity` — the fix is in its main branch but not in 0.3.0, which is what this
// package depends on. Nothing here asserts on form data; the theme's switch is not in a form.
const proto = (globalThis as unknown as { ElementInternals?: { prototype: Record<string, unknown> } }).ElementInternals?.prototype

if (proto) {
  proto.setFormValue ??= () => {}
  proto.setValidity ??= () => {}
  proto.checkValidity ??= () => true
  proto.reportValidity ??= () => true
}
