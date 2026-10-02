---
name: setup
description: Creates the user's Project Hub for the first time - one index page of all their published artifacts, grouped by project - and saves its address so later publishes are recorded automatically. Use when the user asks to set up, create or start the artifact hub, or when ~/.claude/artifact-hub/hub.json does not exist and they want one.
---

# Set up Project Hub

Do this once per user.

1. If `~/.claude/artifact-hub/hub.json` already exists and has a `hubUrl`, the hub is
   set up. Say so, give the link, and offer a rebuild (the `hub` skill) instead.
2. `Artifact` `action: "list"`, `scope: "mine"`, `limit: 50`.
3. Work out the projects from the titles: pages that share a leading name or an obvious
   subject belong together. Propose the list to the user in a short table (project name,
   number of pages, two example titles) and ask them to confirm or rename. Pages you
   cannot place go under "Other". Do not invent projects with one page unless the title
   clearly names a project.
4. Copy `${CLAUDE_PLUGIN_ROOT}/skills/hub/template.html` to a working file. Fill the
   `PROJECTS` array between `HUB-DATA-START` and `HUB-DATA-END` with one entry per
   project. Each `shelves` entry is a folder path inside the project (see the
   `hub` skill). Split a project into two to four subfolders by subject only when it has
   more than eight pages, nesting (`'Area / Topic'`) only where a subfolder would itself
   be crowded; otherwise use one entry named "All pages". Show the proposed folders in
   the table you ask the user to confirm. Each row is
   `['Page title', '<artifact id>', 'What it is, under 12 plain words', '3 Oct']`.
5. Publish it with `Artifact` (no `url`, icon `folder`). The page's `<title>` is
   "Project Hub" unless the user wants another name.
6. Write `~/.claude/artifact-hub/hub.json` with the published link as `hubUrl`, the title
   as `hubTitle`, and for each project an `id` (lowercase, no spaces), its `name`,
   `match` (the lowercase title words that identify it), `subfolders` (one
   `{ "path", "match" }` rule per subfolder you created) and `folders` (the name of the
   git repository or working folder for that project, when the user tells you or the
   current folder obviously belongs to it; otherwise an empty list).
7. Tell the user: the link, how many pages are listed, that it is private to them, that
   only the 50 most recently updated pages could be read (older ones can be added by
   name), and that new pages will now be added automatically. Offer once to pin it to
   their sidebar; pin only if they say yes.
