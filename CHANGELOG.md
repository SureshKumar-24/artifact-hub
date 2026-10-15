# Changelog

## 1.5.0

- Gallery or list: a switch next to the sort buttons (or press `v`). The gallery shows
  each page as a card with a drawn cover: a symbol for the kind of page, read from the
  words in its title (Document, Report, Code, Design, Slides, or Page), on a tint of the
  project colour. Covers are drawn, not screenshots: the hub keeps links, not page
  content, and the page says so. The gallery is the default on wide screens, the list
  elsewhere; the choice is remembered in the browser (`project-hub.view.v1`).
- Details for every page (the ⓘ button, or `i`): title, description, folder as links,
  the updated date as stored, the full link to copy, and open, pin and "Show folder"
  buttons. A side panel on desktop, a sheet on phones; `Esc` closes it and focus goes
  back where it was. It shows only what the hub knows, and says that copying a link does
  not change who can open the page.
- "Continue working" at the top of All pages: the pages opened last, after the pinned
  ones. Same data as before (this browser only), new name.
- Inside a folder, a heading with the project colour, its note, the page count and
  subfolder shortcuts, at every width.
- Search ranking: a whole word found in the description or the folder now beats a loose
  letter-by-letter match in the title, so "seo" finds the SEO folder's pages before pages
  whose titles merely contain those letters spread out.
- On phones and tablets, card actions (pin, details, copy, open) are always visible at
  touch size; on desktop they appear on hover or when the card is selected.
- Phone header: one row for menu, search and the view switch, and one strip that scrolls
  sideways for sort, density, theme and shortcuts, so nothing wraps into a stray row.
  Subfolder chips scroll sideways too.
- The intro sentence under the title is gone: the pages start right under the search
  box. The shortcuts are still one `?` away.
- A second hook, on `Stop`: if a page was published this turn and the hub was not
  republished, Claude gets one reminder to file it. Once per page, never repeated.
- Replaced pages: a new page with the title of a known page is marked as replacing it
  (`replacedBy` in the saved list; nothing is removed), and Claude is told to update the
  existing row instead of adding one. This is what happens when a page is published again
  from a session that lost its link.
- New `find` skill: "where is my pricing page?" answers with the folder and link, and
  offers to read the page so the next publish updates it instead of making a new one.
- Setup asks once for links to pages from before the install, and notes that opening an
  old page brings it back into Claude's gallery.
- Documents made with the Claude Docs connector are saved and filed like pages (the hook
  now also watches that connector's call that creates a document; edits are ignored).
- "Copy for Claude Code" in the details panel: one line with the page's link to paste into
  a new session, so Claude updates that page instead of publishing a duplicate (the most
  common way pages get lost, from what people report).
- "Download this list as Markdown" at the bottom of the page: every folder, title,
  description and link, written by the browser into a file; nothing is sent anywhere.
- Fixed: a project's branch in the folder tree could not be closed while you were inside
  that project (every redraw forced it open). It opens once when you enter the folder,
  and the caret closes it.
- Keyboard: `i` for details, `v` to switch views; the gallery is walked in reading order
  with the same keys as the list.
- The template is `data-hub-template="3"`; a 1.4 hub moves to it on the next rebuild
  with every row, pin, recent page and folder link kept.
- More template tests: the view switch, the details panel, no embeds or fetches, page
  text never passed through `innerHTML`, every browser key guarded.

## 1.4.0

- New hub page design: a calm, quick index with a sticky search box, one list grouped by
  project, and a colour per project (fixed by its order, or set with the optional `color`
  field).
- Search matches titles, descriptions, projects and folders, forgives typos, ranks the
  best match first and highlights what matched. A folder can be used as a filter, shown
  as a chip you can clear; search runs inside it.
- Pins and recently opened pages, kept in your browser only. Row actions: pin, copy
  link, open in a new tab (behind a ⋯ button on phones).
- Sort by recently opened, by updated date (grouped Today / This week / This month /
  Earlier, with relative dates like "3d"), or A–Z. Compact or comfortable rows. Light,
  dark or follow the system.
- Keyboard: `/` or ⌘K to search, arrows or j/k to move, Enter to open, c to copy, p to
  pin, ? for the full list.
- Tablets get a rail of project dots; phones get a folder drawer. No horizontal scrolling
  at phone width.
- Nothing changes in the data: rows are still `[title, id, description, date]`, folder
  links (`#folder`) and the last folder opened carry over, and older hubs move to the new
  page on the next rebuild with every row kept.
- Tests for the page template: data markers, the artifact page contract, and that a real
  `PROJECTS` array still runs.

## 1.3.0

- Deleted pages: when you delete an artifact, it is marked in the saved list and its row
  is taken off the hub.
- Finding a page: ask Claude where a page is and it answers from the hub and the saved
  list.
- The project folder is now the repository root, not the subfolder you happened to be in.
- Setup uses the pages already saved since install, not only the gallery listing.
- The script ignores other tools whose names start with "Artifact", falls back to the
  file name when a page has no title, and can no longer interrupt a turn on an error.
- Automated tests, run on Linux, macOS and Windows.

## 1.2.0

- Folders and subfolders. The hub is now a folder tree: a folder per project, subfolders
  to any depth, a count on each folder, breadcrumbs, and a link straight to any folder.
- Ask Claude to create, rename or move folders in plain words; rules are saved so new
  pages land in the right subfolder.
- Existing hubs keep all their rows and are upgraded to the new layout on the next
  rebuild.

## 1.1.0

- Every published link is now saved by the plugin itself to
  `~/.claude/artifact-hub/pages.json`, so a page is kept even if Claude does not add it
  to the hub in that turn. This works from install, before setup.
- Rebuild reads that file as well as the gallery, so pages too old for the gallery
  listing are still filed.
- A page's project is taken from the folder you are working in first, then from its
  title.
- The hook script is started directly, without a shell.
- README: screenshot, install first, and a full account of what the plugin runs, reads,
  writes and sends. Added SECURITY.md.

## 1.0.0

- First release: setup, rebuild, and a reminder after each publish.
