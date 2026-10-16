# Architecture

One page for contributors: what runs, what it writes, the data contract, and where the page's logic lives. Everything here is checked against the code at v1.7.2; when the code and this page disagree, the code wins and this page needs a fix.

## Pieces

```
.claude-plugin/plugin.json      name, version, keywords, documentation and support links
.claude-plugin/marketplace.json this repository as a one-plugin marketplace
hooks/hooks.json                three hook registrations, exec form (node + args), no shell
hooks/on-artifact.js            PostToolUse: save the link, ask Claude to file the page
hooks/on-stop.js                Stop: one reminder if a page was published and not filed
hooks/on-session.js             SessionStart: the last two pages from this repository
skills/setup/SKILL.md           first run: list, propose projects, publish the hub, write hub.json
skills/hub/SKILL.md             rebuild, file one page, folders, notes, link check, page edits
skills/hub/template.html        the hub page: HTML, CSS, vanilla JS, no libraries
skills/find/SKILL.md            find a page by words, hand its link to the session
skills/week/SKILL.md            digest from pages.json and activity.log
skills/pin/SKILL.md             pin or unpin the hub
test/hook.test.js               the hooks, run in a temp HOME
test/template.test.js           the page contract and the template's invariants
```

## Hooks

| Event | Matcher | Script | Reads | Writes | Says |
|---|---|---|---|---|---|
| `PostToolUse` | `Artifact\|mcp__claude_ai_Claude_Docs__batch` | `on-artifact.js` | stdin event, first 8 KB of the published file (its `<title>`), `hub.json` | `pages.json`, `activity.log`, `.pending`, `.offered` | once per publish: file this page; once per delete: remove its row; once a day before setup: offer setup |
| `Stop` | none | `on-stop.js` | stdin event (`last_assistant_message`, `stop_hook_active`), `.pending`, `hub.json` | removes `.pending` | one reminder when a page published in the last 30 minutes was not filed and Claude did not mention the hub |
| `SessionStart` | `startup\|resume\|clear\|fork` | `on-session.js` | `pages.json`, `hub.json`, `cwd` | nothing | the two most recent pages published from this repository in the last 30 days, or nothing |

`on-artifact.js` decides what the tool call was from `tool_input`: a `publish` (no `asset`, a link in the result, not a refusal), a `delete`, or something to ignore (`read`, `list`, assets, other tools whose name starts with `Artifact`). A publish of the hub itself (its id equals `hubUrl`'s) is logged as `filed` and clears `.pending`. A publish whose title matches a saved page under a different id marks the old entry `replacedBy`. A Docs `batch` call that creates a document is a page with `type: 'doc'`; a `type_url` on a publish becomes `typeId`. Every hook exits 0 and writes nothing to stderr, whatever stdin holds.

### Files in `~/.claude/artifact-hub/`

| File | Written by | Shape |
|---|---|---|
| `pages.json` | `on-artifact.js` | `[{ url, title, folder, first, last, type?, typeId?, replacedBy?, deleted? }]`; `first`/`last` are ISO times; `folder` is the git root or working directory name |
| `hub.json` | Claude (setup, hub skill) | `{ hubUrl, hubTitle, shared?, projects: [{ id, name, folders: [], match: [], subfolders: [{ path, match }] }] }` |
| `activity.log` | `on-artifact.js` | one line per event, `ISO\tpublished <url>` or `ISO\tfiled`, the 500 latest |
| `.pending` | `on-artifact.js` | `{ url, at }` for a page asked to be filed; removed by the hub's republish or by `on-stop.js` |
| `.offered` | `on-artifact.js` | a timestamp: setup was suggested today |

## The data contract

The hub page keeps its rows in one JavaScript array between two comment markers. Only that block changes between versions; the hub skill, the `inject.js`-style tooling in tests, and the page's own `saveToHub()` all rely on there being exactly one pair.

```js
var A = 'https://claude.ai/artifact/';
// HUB-DATA-START — only this array changes; one entry per project
var PROJECTS = [
  { id: 'shop', name: 'Shop', about: 'One line on what the project is', note: 'what matters now', color: 'amber', shelves: [
    ['All pages', [
      ['Page title', '<artifact id>', 'Description under 12 words', '2026-10-16T18:42:11.000Z'],
      ['Q4 Pitch', '<id>', 'Ten slides', '2026-10-14', 'review'],
      ['Teardown', '<id>', 'From the growth team', '12 Oct', { by: 'Priya', kind: 'doc', status: 'final', gone: true }]
    ]],
    ['Marketing / SEO', [ /* rows */ ]]
  ]}
];
// HUB-DATA-END
```

- A row is `[title, id, description, date]` plus an optional fifth item: a bare status (`draft`, `review`, `final`, `archived`) or an object `{ status?, kind?, by?, gone? }`.
- `kind` is set only when Claude knows it from the artifact type: `slides`, `design`, `designsystem`, `dashboard`, `motion`, `doc`. Otherwise `kindOf()` reads it from the title and the panel says "from the title".
- `date` is an ISO time, a bare day `YYYY-MM-DD` (read as a local day), or `'3 Oct'` (the most recent such day).
- A shelf path is a folder path inside the project, parts separated by ` / `; `'All pages'` is the project folder itself. Folders exist only while they hold pages.
- `id` of a Claude Code artifact is a uuid; `urlOf()` links it under `claude.ai/code/artifact/`.
- `note` and `color` are optional; a note or a swatch picked on the page is an edit, saved by Save to hub or named in the message for Claude.
- `<div id="app" data-hub-template="3">` marks the current page design; the hub skill upgrades older hubs by moving their block into the new template.

## The page

`skills/hub/template.html` is one IIFE in `'use strict'`. Reading order inside it:

| Area | Functions | Notes |
|---|---|---|
| Storage | `getRaw`, `setRaw`, `getJSON`, `setJSON`, the `K` map | every `localStorage` access is in a `try`; keys below |
| Model | `child`, `trail`, `under`, `index`, `pathOf`, `kindOf`, `parseDate`, `age`, `rel`, `exact` | `PROJECTS` becomes a folder tree (`root`, `byKey`, `byId`, `PAGES`) once at load |
| Edits | `noteEdit`, `movePage`, `setStatus`, `setNote`, `discardEdits`, `editsText` | kept in `project-hub.edits.v1`; an edit that matches the data is dropped at load |
| Search | `fold`, `wordAt`, `fuzzy`, `match`, `paint`, `sections`, `cmp` | a whole word in the title beats a title tail beats fuzzy; highlights are built as DOM, never HTML |
| Render | `render`, `getSec`, `getRow`, `getCard`, `fillItem`, `renderBar`, `renderEmpty`, `renderSide`, `setActive`, `move`, `jump` | `itemCache` and `secCache` keep DOM nodes across renders; `render()` only re-parents |
| Filters | `visible`, `visibleBut`, `chipOff`, `computeDups`, `isStale`, `isNew`, `isHidden`, `shownCount` | chip counts are computed under the other active filters; All pages caps each project at `CAP` (8) only when nothing is filtered |
| Details and menus | `inspect`, `fillInspector`, `menu`, `statusOptions`, `folderOptions`, `setField`, `renderSel` | `<dialog>` elements; the popover mounts inside the open dialog |
| Palette | `ACTIONS`, `palOpen`, `palDraw`, `palItem`, `palMark`, `palRun`, `palRemember`, `palRecentActions` | 38 actions with stable ids and `when()`; recents in `project-hub.palette.v1` |
| Save and export | `claudeUse`, `dataText`, `rowText`, `q1`, `saveToHub`, `renderSaveBar`, `download`, `hubJSON`, `mdText`, `projectText`, `copyProject` | `saveToHub()` fetches the page's own source, requires one marker pair, swaps the block for `dataText()`, publishes through the `artifact` capability |
| Keys | the `keydown` handler, `armQuick`, `clearQuick` | `/`, `⌘K`, `j k`, `Enter`, `i`, `c`, `p`, `x`, `v`, `o`+digit, `[`, `?`, `Esc` |

### Browser storage keys

`project-hub.folder.v2`, `pins.v1`, `opened.v1`, `sort.v1`, `density.v1`, `theme.v1`, `view.v1`, `look.v1`, `hidden.v1`, `colors.v1`, `side.v1`, `edits.v1`, `visit.v1`, `hint.v1`, `palette.v1` (all prefixed `project-hub.`), plus `project-hub.saving.v1` in `sessionStorage` around a save. All are per-browser conveniences; nothing in them is data.

### Runtime capabilities

The hub is published with `capabilities: {"artifact": {}, "downloads": true}`. `claude.use('artifact')` resolves inside the claude.ai viewer and is `null` everywhere else; `claudeUse()` guards every call, so a local copy of the page behaves as before 1.7.0. `artifact.publish(html)` is compare-and-set: a `conflict` means another view saved first and the shell reloads; `not_writer` turns the Save button off for that view. `downloads.save()` shows a consent prompt; `declined` is silent.

## Tests

```
node --test test/
```

`test/hook.test.js` runs the real scripts with `spawnSync` in a fresh temporary `HOME` for each case: first publish, republish, delete, refusals, assets, Docs, entities in titles, replaced pages, the Stop reminder, the session line, the log cap, a damaged list. `test/template.test.js` checks the page contract (title first, viewport meta, one marker pair, theme tokens), that page text never reaches `innerHTML`, that every storage access is guarded, the palette's action ids, the serializer and the save path, and that a real `PROJECTS` array evaluates. CI runs both on Linux, macOS and Windows (`.github/workflows/test.yml`).

To look at the page with data, inject a `PROJECTS` array between the markers of a copy of the template, prepend `<meta charset="utf-8">`, and open it; `test/fixtures/projects.txt` is a small one. Outside claude.ai the Save button stays hidden; stub `window.claude.use` to see it.

## Releasing

1. Bump `version` in `.claude-plugin/plugin.json`; add a section at the top of `CHANGELOG.md`.
2. `claude plugin validate .` and `node --test test/`.
3. Merge to `main`, then `git tag vX.Y.Z && git push origin vX.Y.Z`.
4. `gh release create vX.Y.Z --title vX.Y.Z --notes "<the changelog section>"`.
5. Users get it with `claude plugin update artifact-hub`; a running session needs a restart.

Changes to `template.html` reach a user's hub on their next rebuild (`/artifact-hub:hub`), which moves their data block into the new template unchanged.
