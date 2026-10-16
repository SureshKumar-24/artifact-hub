## What

<!-- One or two sentences. Link the issue if there is one. -->

## Why

<!-- The moment this helps, or the bug it fixes. -->

## Checks

- [ ] `node --test test/` passes, and a test covers the invariant this change introduces
- [ ] `claude plugin validate .` passes (if a manifest or hooks.json changed)
- [ ] Page changes checked at 390 px (touch), 768 px and 1280 px, light and dark, both looks
- [ ] No horizontal scroll at 390 px; new controls at least 40 px on touch; contrast at or above 4.5:1
- [ ] New keys listed in the `?` sheet and the palette; icon-only buttons have `aria-label`
- [ ] `CHANGELOG.md` has a line under a new version heading (user-visible changes)
- [ ] Copy follows CONTRIBUTING.md: plain, exact, no hype

## Screenshots

<!-- Before and after, if the page changed. -->
