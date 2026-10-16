<div align="center">

# Artifact Hub

**Every Claude artifact you publish, filed, searchable, and one keystroke away.**

A Claude Code plugin. The moment a page is published, its link is saved on your machine and filed into a project folder on one private index page: your Project Hub.

[![test](https://github.com/SureshKumar-24/artifact-hub/actions/workflows/test.yml/badge.svg)](https://github.com/SureshKumar-24/artifact-hub/actions/workflows/test.yml)
[![release](https://img.shields.io/github/v/tag/SureshKumar-24/artifact-hub?label=release)](https://github.com/SureshKumar-24/artifact-hub/releases)
[![licence](https://img.shields.io/badge/licence-MIT-blue)](LICENSE)
![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
![network calls](https://img.shields.io/badge/network%20calls-0-brightgreen)

![Project Hub in the gallery view: a folder tree on the left, pinned pages first, then each project's pages as cards with a drawn cover, a status label and the folder](docs/hub.png)

<sub>Example data. Covers are drawn from each page's kind, never screenshots.</sub>

</div>

```
/plugin marketplace add SureshKumar-24/artifact-hub
/plugin install artifact-hub@artifact-hub
/artifact-hub:setup
```

## Contents

- [Why](#why)
- [A tour](#a-tour)
- [Install](#install)
- [What you get](#what-you-get)
- [How it works](#how-it-works)
- [Using it](#using-it)
- [Keyboard](#keyboard)
- [Folders and subfolders](#folders-and-subfolders)
- [What it runs, reads and sends](#what-it-runs-reads-and-sends)
- [What it costs](#what-it-costs)
- [Limits](#limits)
- [Questions](#questions)
- [Troubleshooting](#troubleshooting)
- [Uninstall](#uninstall)
- [Contributing](#contributing)

## Why

Claude's artifact gallery is one flat list of recent pages.

- Older pages drop out of view. If you no longer have the link, the page is hard to get back. One open Claude Code report describes the gallery and the `list` action stopping at a date, with every older page invisible until opened by its link ([anthropics/claude-code#94552](https://github.com/anthropics/claude-code/issues/94552)).
- Nothing separates one project from another. A client report sits next to a study plan. People ask for exactly this: named groups, filed at publish time ([anthropics/claude-code#102010](https://github.com/anthropics/claude-code/issues/102010)).
- Titles that made sense on the day stop making sense a month later ([one developer's account](https://dev.to/amsyeung/i-kept-losing-my-claude-artifacts-so-i-made-a-mod-3bph)).
- Without the link, a new Claude Code session makes a new page instead of updating the old one, so duplicates pile up.

Artifact Hub answers each one: every link is saved on your machine at publish time, pages are filed into project folders with a plain description each, and the details panel hands you the one line that makes a new session update the right page.

## A tour

<table>
<tr>
<td width="50%"><img src="docs/details.png" alt="The details panel: title, description, folder as links, exact date and time, kind, status and move-to selects, the full link, Open page, Pinned, Show folder and Copy for Claude Code"></td>
<td width="50%"><img src="docs/dark-search.png" alt="Dark theme, list view, a search for 'plan' inside the Bakery shop folder with the match highlighted"></td>
</tr>
<tr>
<td><b>Details</b> — everything the hub knows about a page, and nothing it does not. Change the folder or status right here; <b>Copy for Claude Code</b> gives a new session the link so it updates this page instead of making another.</td>
<td><b>Search, list, dark</b> — one box searches titles, descriptions and folders, forgives typos and highlights the match. The list view is for people who know the title; the theme follows your system or your choice.</td>
</tr>
<tr>
<td><img src="docs/phone.png" alt="Phone layout: a search row, a sideways strip for sort and options, the project heading with its note, kind and folder chips, and two columns of cards" width="60%"></td>
<td>
<b>Phone</b> — one search row, one strip that scrolls sideways for sort and options, chips that scroll instead of stacking, cards in two columns, every action at touch size.<br><br>
<b>Keyboard</b> — <code>/</code> search, <code>j</code> <code>k</code> move, <code>Enter</code> open, <code>i</code> details, <code>c</code> copy, <code>p</code> pin, <code>x</code> select, <code>v</code> gallery or list, <code>[</code> fold the sidebar, <code>o</code> then a digit to open that result, <code>?</code> for the full list.
</td>
</tr>
</table>

## Install

In Claude Code:

```
/plugin marketplace add SureshKumar-24/artifact-hub
/plugin install artifact-hub@artifact-hub
```

Then run this once:

```
/artifact-hub:setup
```

| You want to | Do this |
|---|---|
| Install a fixed, reviewed version | Add `@v1.5.2` to the first command |
| Try it without installing | `claude --plugin-dir path/to/artifact-hub` |
| Read the code first | Three short scripts, five instruction files and one page template; see [SECURITY.md](SECURITY.md) |

**Needs:** Claude Code on a plan that can publish artifacts, and Node.js on your PATH.

## What you get

**Finding pages**

| | |
|---|---|
| **Gallery or list** | Cards with a drawn cover for the kind of page (document, report, code, design, slides, dashboard), or a dense list. One switch, remembered. Same search, folders and sorting in both. |
| **Search** | Titles, descriptions, folders, kinds and statuses at once. Forgives typos, puts the best match first, highlights what matched. Pick a folder to search inside it. |
| **Filters** | One chip per kind, like the gallery's type filter, and one per status. Both combine with the folder you are in. |
| **Pinned and Continue working** | The pages you pinned, then the ones you opened last, at the top of All pages. Kept in your browser only. |
| **Since you were here** | "8 pages updated since your last visit", with a chip to show just those. |
| **Find by asking** | "Where is my pricing page?" or `/artifact-hub:find pricing` returns the folder and link and offers to open the page so your next publish updates it. |

**Organising**

| | |
|---|---|
| **Every link is kept** | The moment a page is published, its link, title, time and project folder are written to a plain file on your machine. The plugin does this itself, so it does not depend on Claude remembering. |
| **Folders and subfolders** | A folder per project, each with its own colour, subfolders to any depth, a count on each. Pages are filed under the project of the repository you are working in. |
| **Status** | Draft, review, final, archived: a label on the page and a filter chip. Archived pages stay in the hub, out of the way. Set it in words or in the details panel. |
| **Move and bulk actions** | "Move to" in the details panel, or select several pages (shift-click, `x`) to move them, set a status or copy their links in one go. Changes show at once, marked "Unsaved", and one button copies the list for Claude to write into the hub, so the data has one owner. |
| **Project notes** | One short line per project of what matters now ("client wants v2 by November"), under its heading, editable on the page. |
| **Kinds Claude knows** | A page made from one of Claude's artifact types (Slides, Design, Design system, Dashboard, Docs) keeps that kind. Others get a kind from the title, and the panel says which. |
| **Shared with you** | Pages other people shared with you can sit under "Shared with me", with the owner's name on each. Listed, never edited. |

**Working**

| | |
|---|---|
| **Keep working on a page** | "Copy for Claude Code" gives a new session one line with the link, so Claude updates that page instead of making another. At session start, Claude also knows the last pages you published from the repository you are in. |
| **Replaced pages** | Publish a page again from a session that lost the link and the hub keeps one row, pointing at the new page. The old link still opens. |
| **Exact times** | Each row keeps the time it was published: "3w" on the card, the day and time on hover and in details, in your own time zone. |
| **This week** | `/artifact-hub:week`: what you published this week by project, what has sat untouched for two months, likely duplicates, pages shared with you. |
| **Link check** | Ask "check my links": a page that no longer opens is marked gone, never removed. |
| **Your list, anywhere** | "Copy this list as Markdown" puts every folder, title, description and link on your clipboard. |

**Trust**

| | |
|---|---|
| **Private** | The hub is a private artifact in your own account. Nothing leaves your machine except through Claude's own publish. Copying a link does not change who can open that page. |
| **Honest** | Covers are drawn, not screenshots; the kind says whether Claude recorded it or the title suggested it; nothing is invented. |
| **Nothing extra to do** | Publish as usual. A page made with the Claude Docs connector is filed the same way. Delete an artifact and its row leaves the hub. |

## How it works

```mermaid
flowchart LR
  A[Claude publishes a page] --> B[Plugin script runs]
  B --> C[(pages.json<br/>on your machine)]
  B --> D[Reminder to Claude]
  D --> E[Claude files the page<br/>in the right folder]
  E --> F[Project Hub<br/>your private index page]
  C -. rebuild reads it .-> F
```

There are two layers, on purpose:

1. **The script** saves the link to `~/.claude/artifact-hub/pages.json`. This always happens.
2. **Claude** adds the page to your hub after a short reminder. If that step is ever missed, a second hook reminds it once at the end of the turn; if the session is cut short, the link is still saved, and `/artifact-hub:hub` puts it on the hub.

## Using it

| When | What you do | What happens |
|---|---|---|
| Once | `/artifact-hub:setup` | Claude reads your gallery, proposes projects and folders, and publishes your hub when you agree. |
| Every publish | Nothing | The link is saved and the page is filed on your hub. |
| You delete a page | Nothing | Its row is taken off the hub. |
| You cannot find a page | Ask: "where is my pricing page?" or `/artifact-hub:find pricing` | Claude answers with the title, folder and link, and offers to open the page so your next publish updates it instead of making a new one. |
| You publish a page again from a new session | Nothing | The hub keeps one row, pointing at the new page; the old link still opens. |
| You want to reorganise | Ask: "move the SEO pages into Shop / Marketing", or do it on the page and press "Save changes with Claude" | Claude moves them and remembers the rule. |
| Any time | `/artifact-hub:hub` | Rebuilds the hub from the gallery and the saved list. Adds what is new, never removes what is there. |
| Once a week | `/artifact-hub:week` | A short digest: published this week, untouched for 60 days, likely duplicates, shared with you. |
| You want it one click away | `/artifact-hub:pin` | Pins the hub to your sidebar; unpins on request. |
| You suspect dead links | Ask: "check my links" | Each page is read once; a page that no longer opens is marked gone, never removed. Slow, so Claude asks first past 40 pages. |

## Keyboard

| Key | Does |
|---|---|
| `/` or `⌘K` | Search |
| `j` `k` or `↑` `↓` | Move between pages (the gallery in reading order) |
| `Enter` | Open the page in a new tab |
| `i` | Details of the page |
| `c` | Copy the page link |
| `p` | Pin or unpin the page |
| `x` | Select the page (shift-click does the same) |
| `v` | Gallery or list |
| `o` then `1`–`9` | Open that result |
| `[` | Hide or show the sidebar |
| `?` | All shortcuts |
| `Esc` | Clear the selection, then the search, then leave it |

## Folders and subfolders

A project is a top-level folder. Inside it you can have folders within folders:

```
All folders
├── Bakery shop
│   ├── Design
│   └── Marketing
│       ├── Offers
│       └── SEO
├── Fitness app
└── Client reports
    └── 2026
```

You manage them by asking Claude in plain words:

| Say | Result |
|---|---|
| "make a folder Reports inside Shop" | A new subfolder |
| "move the SEO pages into Shop / Marketing" | Pages moved, rule saved for new pages |
| "rename Marketing to Growth" | Folder renamed, pages kept |
| "remove the Offers folder" | Its pages move up to the parent folder |
| "this folder belongs to the Shop project" | Pages published from that repository go to Shop from now on |

How a new page finds its place:

1. **The repository you are working in**, if you have linked it to a project.
2. **Words in the page title**, matched against each project's and subfolder's rules.
3. Otherwise **Other**, and Claude tells you so you can correct it once.

No row is ever deleted by a move, a rename or a rebuild.

## What it runs, reads and sends

A plugin can run code on your machine, so here is all of it.

| | |
|---|---|
| **Runs** | Three hooks. `PostToolUse` for the `Artifact` tool and for the Claude Docs connector's `batch` call (only when it creates a document) starts `hooks/on-artifact.js` (163 lines). `Stop` starts `hooks/on-stop.js` (36 lines), which only speaks when a page published that turn was not filed. `SessionStart` starts `hooks/on-session.js` (56 lines), which adds one line naming the last two pages published from the current repository in the past 30 days, and nothing when there are none. Plain Node.js, no dependencies, no shell in between. |
| **Reads** | The result of that tool call, the `<title>` of the file just published (or the new document's name), Claude's last message of the turn, and your hub settings. During setup or a rebuild, Claude reads the list of your own artifacts through its own Artifact tool. |
| **Writes** | Three files in `~/.claude/artifact-hub/`: `pages.json` (your published links), `hub.json` (your hub's address and folder rules) and `activity.log` (one line per publish and per filing, the 500 latest, for the weekly digest), plus a small `.pending` marker between a publish and its filing. And your hub artifact. |
| **Sends** | Nothing. No network request, no server, no analytics, no account. |

Check it yourself in a minute: [SECURITY.md](SECURITY.md). The scripts' behaviour is covered by tests that run on Linux, macOS and Windows for every change.

## What it costs

- At session start: one line of about 40 words, only in a repository you published from in the last 30 days; otherwise nothing.
- One reminder of about 80 words, only in a turn where Claude publishes or deletes an artifact.
- Filing a page is one read and one republish of the hub.

## Limits

- **Claude Code only.** Pages made in the claude.ai chat app are picked up when you run `/artifact-hub:hub`.
- **Pages from before you installed** come from the gallery listing, which covers the 200 most recently updated. Older ones can be added by pasting their links once.
- **The folders live on your hub page.** They do not change Claude's own gallery.
- **Covers are drawn, not screenshots.** The hub holds a title, a description, a date and a link per page, never the page itself, so a card's cover is a symbol for the kind of page. Real thumbnails would need a safe way to capture a private page; there is none today, so the hub does not pretend.
- **Filing is done by Claude** after a reminder. The saved list is the safety net; a rebuild catches up.
- **Two sessions publishing at the same instant** could miss one saved link. A rebuild picks it up from the gallery.
- If Claude adds folders to the gallery itself, you will no longer need this.

## Questions

<details>
<summary><b>Can other people see my hub?</b></summary>

No. It is private to you, like any artifact, unless you share it yourself. Each page it links to keeps its own sharing setting.
</details>

<details>
<summary><b>Gallery or list: which should I use?</b></summary>

The gallery is the default on a wide screen: cards with a cover and two lines of description make similar pages easier to tell apart. The list is the default on phones and tablets, and the better choice when you know the title and want to scan fast; press `v` to switch any time. Both show the same pages in the same order.
</details>

<details>
<summary><b>Why is the cover a symbol and not a picture of the page?</b></summary>

Because the hub never reads your pages. It knows each page's title, description, date and link, nothing more, and it says so in the details panel. Showing a made-up picture would be worse than an honest symbol.
</details>

<details>
<summary><b>Will a rebuild delete rows?</b></summary>

No. A page missing from the gallery listing is treated as old, not deleted. A row is removed only when you delete the artifact or say the page is gone.
</details>

<details>
<summary><b>Does it work for a team?</b></summary>

Each person has their own hub, and it can hold the team's pages too: pages other people shared with you go under "Shared with me", with the owner's name on each, so your work and theirs sit under one roof. Those rows are listed, not edited: only the owner can republish a page. You can share your hub page like any artifact, but the pages it links to must be shared too for others to open them.
</details>

<details>
<summary><b>What kinds of pages does it know?</b></summary>

The kinds Claude records itself: Slides, Design, Design system, Dashboard and Docs, taken from the type a page was made from. For a plain page the kind is read from the title (Document, Report, Code, Design) and the details panel says so. One filter chip per kind, like the gallery's type filter.
</details>

<details>
<summary><b>What happens when I move a page on the hub page?</b></summary>

It moves at once in your browser and is marked "Unsaved". The hub's data is written only by Claude, so a bar at the top offers "Save changes with Claude": one message, listing each change, to paste into Claude Code. After Claude republishes the hub, the marker goes away. "Discard" forgets the changes.
</details>

<details>
<summary><b>Can I edit the saved list by hand?</b></summary>

Yes. `~/.claude/artifact-hub/pages.json` is plain JSON: one entry per page with `url`, `title`, `folder`, `first`, `last`.
</details>

<details>
<summary><b>What if I do not want a hub, only the saved list?</b></summary>

Install and skip setup. Every published link is still saved. You will see one mention of setup per day at most, and only in a turn where you publish.
</details>

<details>
<summary><b>Is this made by Anthropic?</b></summary>

No. It is an independent open-source plugin.
</details>

## Troubleshooting

| Symptom | Try |
|---|---|
| A page is not on the hub | `/artifact-hub:hub` |
| A page went to the wrong folder | Tell Claude where it belongs; the rule is saved |
| Nothing happens after a publish | Check `node --version` works in your terminal, and that the plugin is enabled in `/plugin` |
| The hub still has the old flat layout, or no gallery switch | Run `/artifact-hub:hub` once; it moves the hub to the current page design and keeps every row, pin and folder link |
| The plugin seems old after an update | `/plugin uninstall artifact-hub`, then install again; check the version in `/plugin` |
| A second hub appeared | Tell Claude which one to keep; the other can be deleted from the gallery |

Anything else: [open an issue](https://github.com/SureshKumar-24/artifact-hub/issues).

## Uninstall

`/plugin uninstall artifact-hub`, then delete `~/.claude/artifact-hub/` if you no longer want the saved list. Your hub artifact stays until you delete it yourself.

## Contributing

Issues and pull requests are welcome. The whole plugin is small:

```
.claude-plugin/   plugin and marketplace manifests
hooks/            hooks.json, on-artifact.js, on-stop.js, on-session.js (the only code that runs)
skills/hub/       rebuild, filing, folders; template.html is the hub page
skills/find/      find a page by a few words and hand its link to the session
skills/week/      the weekly digest
skills/pin/       pin or unpin the hub
skills/setup/     first-time setup
docs/             screenshots
test/             node --test test/
```

Changes are listed in [CHANGELOG.md](CHANGELOG.md).

## Licence

MIT, by Suresh Kumar. Not made by or affiliated with Anthropic.
