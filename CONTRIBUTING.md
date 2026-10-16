# Contributing

Thank you. The plugin is small enough to read in an hour; [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) is the map.

## Set up

```
git clone https://github.com/SureshKumar-24/artifact-hub
cd artifact-hub
node --test test/                       # the whole suite, no install step
claude --plugin-dir "$PWD"              # run Claude Code with this checkout as the plugin
```

Hooks and skills in the checkout are live in that session. Edit, then start a new session to pick up a changed hook.

## Try the page locally

The hub page is `skills/hub/template.html`. Put a `PROJECTS` array between the `HUB-DATA-START` and `HUB-DATA-END` markers of a copy (the array in `test/fixtures/projects.txt` works), prepend `<meta charset="utf-8">`, and open the copy in a browser or serve the folder with `python3 -m http.server`. Outside claude.ai the Save to hub button stays hidden; to see it, prepend a stub before the page script:

```html
<script>window.claude = { use: n => Promise.resolve(n === 'artifact' ? { publish: () => Promise.resolve({ version: 'x' }) } : null) };</script>
```

## The bar for a change to the page

This plugin is used for its UI. Before opening a pull request that touches `template.html`:

- Check at 390 px (touch), 768 px and 1280 px, in light and dark, in both looks (`?` → Look).
- No horizontal scroll at 390 px; every control at least 40 px on a touch screen.
- Text contrast at or above 4.5:1 in both themes.
- Keyboard: every new control reachable by Tab, every icon-only button with an `aria-label`, the `?` sheet and the palette updated if a key was added.
- No page text through `innerHTML`; every `localStorage` access through the guarded helpers; every colour a token on `:root`.
- `node --test test/` green; add a test for the invariant you introduced.

## Copy

Plain words, exact, short. No hype, no emoji in prose, no exclamation marks. Say what a thing does, not how good it is. A button is named by its verb ("Save to hub", "Copy link"). The page never claims to know something it does not (a page's sharing state, its content).

## Pull requests

One change per pull request, with the "what" and the "why" in the description and the checks you ran. Add a line to `CHANGELOG.md` under a new version heading if the change is user-visible; the maintainer bumps `plugin.json` and tags.

## Reporting a problem

Use the issue forms: they ask for the Claude Code version, the plugin version from `claude plugin list`, and what happened. For anything security-related, use GitHub's "Report a vulnerability" on the Security tab instead of a public issue.
