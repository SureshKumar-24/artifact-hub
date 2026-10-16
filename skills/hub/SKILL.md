---
name: hub
description: Keeps Project Hub, the user's own index page of every artifact they have published, grouped by project. Use when the user asks to rebuild, refresh, update or fix the hub, says a page is missing from it or cannot find an artifact, or right after publishing an artifact (to record it).
---

# Project Hub

Project Hub is one artifact that lists every page the user has published, in folders:
a folder per project, with subfolders inside it to any depth. The promise it makes: **a page once listed is never lost**, even when the
gallery stops showing it. The plugin backs that promise with a local list,
`~/.claude/artifact-hub/pages.json`, which it writes itself at every publish.

The user's settings are in `~/.claude/artifact-hub/hub.json`:

```json
{
  "hubUrl": "https://claude.ai/artifact/…",
  "hubTitle": "Project Hub",
  "projects": [
    { "id": "shop", "name": "Shop", "folders": ["shop-web", "shop-api"], "match": ["shop", "checkout"],
      "subfolders": [ { "path": "Marketing / SEO", "match": ["seo", "keyword"] } ] }
  ]
}
```

If that file does not exist, the hub has not been created: follow the `setup` skill
instead and stop here.

The hub's rows live in the `PROJECTS` array inside the page's `<script>`, between the
`HUB-DATA-START` and `HUB-DATA-END` comments (in an older hub, the `var PROJECTS = [`
array):

```js
{ id: 'shop', name: 'Shop', about: 'One line on what the project is', shelves: [
  ['Marketing / SEO', [ ['Page title', '<artifact id>', 'What it is, in a few plain words', '3 Oct'] ]]
]}
```

The first item of each `shelves` entry is a **folder path inside the project**, parts
separated by ` / `: `'Marketing / SEO'` is the folder SEO inside Marketing inside Shop.
`'All pages'` means the project folder itself. The page draws the tree from these paths,
so creating a subfolder is just using a new path, and a folder exists only while it has
pages.

Each row stays `[title, id, description, date]`. Write the date as the exact time when
you have it: the entry's `last` in `pages.json` (`'2026-10-16T18:42:11.000Z'`), so the
page can show the day and the time. Otherwise write the day like `'3 Oct'` (no year; the
page reads it as the most recent such day). A row may carry a fifth item: a status word,
or an object when more is known:

```js
['Q4 Pitch', '<id>', 'Ten slides for the board', '2026-10-14T09:30:00.000Z', { kind: 'slides', status: 'review' }]
['Competitor Teardown', '<id>', 'From the growth team', '12 Oct', { by: 'Priya', kind: 'doc' }]
```

- `status`: `'draft'`, `'review'`, `'final'` or `'archived'`. The page shows it as a
  label, offers one filter chip per status, and hides archived pages unless their chip is
  pressed. The user sets it in plain words: "mark the pricing page final", "archive the
  old logo page" (archive, never delete: the row stays).
- `kind`: what Claude itself knows the page to be: `'slides'`, `'design'`,
  `'designsystem'`, `'dashboard'` or `'doc'` (a page made from one of Claude's artifact
  types, or a Claude Docs document). A `pages.json` entry with `type: 'doc'` is `'doc'`;
  one with `typeId` was made from a type: `Artifact` `action: "list"`, `scope: "types"`
  names each type and its `type_url`, and the id at the end of that URL is the `typeId`.
  Set `kind` only when known this way; without it the page reads the kind from the title
  and says so.
- `by`: the owner's name, for a page shared with the user (see "Pages shared with the
  user"). Leave it out for the user's own pages.

Leave the fifth item out when none of these apply.

A project may also have an optional `color`, one of `teal`, `indigo`, `amber`, `rose`,
`green`, `violet`, `sky`, `clay`:

```js
{ id: 'shop', name: 'Shop', about: '…', color: 'amber', shelves: [ … ] }
```

Leave it out and the project takes the colour of its place in `PROJECTS` (first teal,
second indigo, and so on), so colours stay fixed as long as the order does. Set it only
when the user asks for a colour, or to keep a project's colour when you reorder projects.
On the page itself, the colour dot next to an open project's name offers the eight
swatches; a choice made there is kept in that browser only, and the page says to ask you
to make it permanent: when the user does, set `color` here.

The artifact id is the last part of the page's link. Only that array changes; leave the
styles and the rest of the script alone.

The page draws a cover for each row from its `kind` when set, otherwise from the words in
its title (Document, Report, Code, Design, Slides, or plain Page), and says which on the
page; it never fetches or shows the page's content. A clear title and a plain description are what make a page easy to
recognise, so write both with care.

## Rebuild (the main job)

Run this whenever asked, and whenever you are unsure the hub is current. It must leave
the hub correct on its own, without relying on any earlier step having happened.

1. `Artifact` `action: "read"` with `hubUrl`. Build on the file it returns.
2. `Artifact` `action: "list"`, `scope: "mine"`, `limit: 200` (the most it returns; it
   says how many more exist). Then `scope: "shared"`, `limit: 200`, for pages other
   people shared with the user.
3. Read `~/.claude/artifact-hub/pages.json` if it exists. The plugin writes one entry
   there for every page published while it is installed (`url`, `title`, `folder`,
   `first`, `last`, and `deleted` once the page was deleted), so it also holds pages too
   old to appear in the listing. An entry with `type: 'doc'` is a document made with the
   Claude Docs connector; it is a row like any other. Skip entries marked `deleted`, and
   remove their rows. An entry with `replacedBy` is a page that was published again under
   the same title from a session without its link: keep one row, pointing at the newer
   page, and keep the description; the old link still opens, so mention it to the user
   only if they ask.
4. For every page in the listing or in that file that is not in `PROJECTS`, add a row.
   For pages already there (same id), update the title and date if they changed; the
   id is what identifies a page, never its title. If the same id appears in two folders,
   keep the one row whose folder the rules below would choose and drop the other. An
   entry's `folder` is the folder it was published from: use it to pick the project. If
   `PROJECTS` is empty (a hub with no rows yet), build it as in the `setup` skill's step
   3 and 4, from the listing and `pages.json`, and confirm the projects with the user.
5. **Never remove a row because it is missing from the listing.** The listing shows the
   most recently updated pages, up to 200, and the gallery itself has been seen to drop
   older pages that still exist, so an absent row is old, not deleted. Remove a row only
   when the user says that page is gone or `pages.json` marks it `deleted`.
6. Never add the hub itself as a row.
7. Republish with `url` set to `hubUrl`. Never publish the hub without `url`: that
   creates a second hub.
8. Report in two or three lines: how many added, how many updated, how many kept from
   before, and any page placed under "Other" so the user can correct it.

## Recording one page (right after a publish)

Same as a rebuild, but only for the page just published: read the hub, add or update
that one row, republish to the same URL, and tell the user in one line which project it
went under. If anything about the hub looks out of date while you are there, do a full
rebuild instead.

## Finding a page

When the user cannot find a page ("where is my pricing page?"), follow the `find` skill:
it looks in `pages.json` and in the hub's `PROJECTS` and answers with the title, folder
and link. If it finds nothing, run a rebuild here and look again before saying the page
is not there.

## When a page is deleted

Remove its row from the hub, republish, and say so in one line. Do not delete any
artifact yourself as part of hub upkeep; only the user decides that.

## Which project a page belongs to

In this order:

1. **The folder you are working in.** Take the name of the git repository root, or of
   the working directory if there is no repository. If a project in `hub.json` lists
   that name under `folders`, use that project. This is the most reliable signal for a
   page you just published.
2. **The title.** The first project whose `match` words appear in the title
   (case-insensitive). Use this for pages found by a rebuild, where the folder is unknown.
3. **Otherwise "Other"** (create it if missing), and say so.

When a page published from a folder lands in a project by rule 2 or 3, ask the user once
whether that folder belongs to a project, and save their answer under `folders` so it is
automatic next time.

Write each row's description yourself in plain words (what the page is for), under 12
words.

## Subfolders

- Within a project, use the first `subfolders` rule in `hub.json` whose `match` words
  appear in the title; otherwise put the page in the project folder (`'All pages'`).
- Suggest subfolders only when a folder holds more than about eight pages, and group by
  what the pages are about (a product area, a client, a kind of document). Two or three
  levels is plenty; do not create a folder for one page.
- The user can ask in plain words: "make a folder Reports inside Shop", "move the SEO
  pages into Shop / Marketing", "rename that folder", "put this at the top level". Do it
  by changing the paths, keep every row, and save a `subfolders` rule so new pages follow.
- Removing a folder moves its pages to the parent folder. It never deletes rows.

## Upgrading an older hub

If the hub you read has no `data-hub-template="3"` attribute, it uses an older page
design (`data-hub-template="2"` is the 1.4 list page; a hub with no `id="tree"` element
does not have folders yet either). Take `${CLAUDE_PLUGIN_ROOT}/skills/hub/template.html`,
put the hub's existing `PROJECTS` array into it unchanged, keep the hub's `<title>` and
`<h1>`, and republish to the same URL. Tell the user in one line what changed: folders,
if it had none; otherwise the new page (a gallery of cards or a list, a details panel for
each page, search, pins, "Continue working", keyboard shortcuts, dark mode). Folder links
(`#folder`), pins, recently opened pages and the folder the viewer last opened carry over,
because the data and the browser keys are unchanged.

## Project notes

A project may carry `note: '…'`, separate from `about`: a short line of what matters now
("client wants v2 by November", "on hold until the audit"), under 200 characters, plain
words. The page shows it under the project's heading. The user sets it in plain words
("note on Shop: launch moved to 3 Nov") or on the page, whose "Save changes with Claude"
message may contain a line like `- set the note of project Shop to: launch moved to
3 Nov`. Put it in the `note` field, or remove the field when told to clear it.

## Checking links

Only when the user asks ("check my links", "are any pages gone?"). For each row,
`Artifact` `action: "read"` with the page's link. A page that comes back not found or
without access is marked in the row's fifth item with `gone: true` (keep every other
field: `{ status: 'final', gone: true }`), never removed; a page that opens again on a
later check loses the mark. Then republish the hub and report how many were checked
and how many are gone, with their titles. This is slow, one read per page: say so, and
ask before running it on more than 40 pages (offer one project at a time).

## Pages shared with the user

A team's pages can sit under the same roof. Pages from `scope: "shared"` go in a project
named "Shared with me" (id `shared`), one subfolder per owner when there are several
owners, each row with `by` set to the owner's name as the listing gives it. They are
listed, never changed: the user cannot republish them, and the hub must never suggest
they can. Ask once, the first time shared pages appear, whether the user wants them on
the hub; remember the answer in `hub.json` as `"shared": true` or `false`.

## Changes the user made on the page

The hub page lets the user move a page to another folder or set its status right there.
The message may name the hub by a frame address (`…claudeusercontent.com/…`) or not at
all: always use `hubUrl` from `hub.json`, never that address.
Those changes live in their browser until you write them: the page gives them a message
to paste that starts "Update my Project Hub at … with these changes I made on the page"
and lists each move, status and project note. When you get it: read the hub, apply
every line (move the row to the named folder path, creating the path if needed; set or
clear the fifth item; set the project's `note`), republish to the same URL, and tell the
user in one line how many changes were written. A line that names a project the hub
does not have, or a page id that is not in `PROJECTS`: ask before inventing anything,
and apply the rest. They then press "Discard" on the page, or reload it: a saved change
matches the data and the marker goes away.

## Changing the rules

When the user says a page belongs to another project, move the row and update
`hub.json` (`folders` or `match`) so the same mistake does not repeat. A new project is
a new entry in both `hub.json` and `PROJECTS`.

## Privacy

The hub holds titles and links only. It is private to the user unless they share it
themselves; never suggest sharing it, and never copy its contents anywhere else. Its
rows link to pages that each keep their own sharing setting.
