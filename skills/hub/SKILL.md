---
name: hub
description: Keeps Project Hub, the user's own index page of every artifact they have published, grouped by project. Use when the user asks to rebuild, refresh, update or fix the hub, says a page is missing from it or cannot find an artifact, or right after publishing an artifact (to record it).
---

# Project Hub

Project Hub is one artifact that lists every page the user has published, grouped by
project. The promise it makes: **a page once listed is never lost**, even when the
gallery stops showing it.

The user's settings are in `~/.claude/artifact-hub/hub.json`:

```json
{
  "hubUrl": "https://claude.ai/artifact/…",
  "hubTitle": "Project Hub",
  "projects": [
    { "id": "shop", "name": "Shop", "folders": ["shop-web", "shop-api"], "match": ["shop", "checkout"] }
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
  ['Shelf name', [ ['Page title', '<artifact id>', 'What it is, in a few plain words', '3 Oct'] ]]
]}
```

The artifact id is the last part of the page's link. Only that array changes; leave the
styles and the rest of the script alone.

## Rebuild (the main job)

Run this whenever asked, and whenever you are unsure the hub is current. It must leave
the hub correct on its own, without relying on any earlier step having happened.

1. `Artifact` `action: "read"` with `hubUrl`. Build on the file it returns.
2. `Artifact` `action: "list"`, `scope: "mine"`, `limit: 50`.
3. For every listed page that is not in `PROJECTS`, add a row. For pages already there,
   update the title and date if they changed.
4. **Never remove a row because it is missing from the listing.** The listing shows only
   the 50 most recently updated pages, so an absent row is old, not deleted. Remove a
   row only when the user says that page is gone.
5. Never add the hub itself as a row.
6. Republish with `url` set to `hubUrl`. Never publish the hub without `url`: that
   creates a second hub.
7. Report in two or three lines: how many added, how many updated, how many kept from
   before, and any page placed under "Other" so the user can correct it.

## Recording one page (right after a publish)

Same as a rebuild, but only for the page just published: read the hub, add or update
that one row, republish to the same URL, and tell the user in one line which project it
went under. If anything about the hub looks out of date while you are there, do a full
rebuild instead.

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

## Changing the rules

When the user says a page belongs to another project, move the row and update
`hub.json` (`folders` or `match`) so the same mistake does not repeat. A new project is
a new entry in both `hub.json` and `PROJECTS`.

## Privacy

The hub holds titles and links only. It is private to the user unless they share it
themselves; never suggest sharing it, and never copy its contents anywhere else. Its
rows link to pages that each keep their own sharing setting.
