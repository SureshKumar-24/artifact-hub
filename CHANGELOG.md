# Changelog

## 2.0.0

The launch release. Everything since 1.0.0, in one place; the entries below it are the
history, kept for anyone upgrading step by step. Nothing in the data changed: a hub from
any 1.x version moves to this page on its next rebuild with every row, pin and folder kept.

- **Never lose a page.** Three hooks save every published link on your machine the moment
  it exists, mark deleted and replaced pages, and remind Claude once if a page was not
  filed. Claude Docs documents are filed like pages. The gallery cutoff cannot reach them.
- **One index page, your Project Hub.** Folders and subfolders to any depth, a gallery of
  drawn covers or a list, search that forgives typos, pins, "Continue working", a details
  panel, status labels, project notes and colours, light and dark, a look that matches
  claude.ai. Fast with hundreds of rows.
- **Command palette on ⌘K.** Pages, folders and 38 actions in one box, with the key shown
  beside each action; `>` for actions, `#` for folders.
- **Save to hub.** Move pages, set statuses and notes on the page and save them into the
  hub itself, right there in claude.ai; the paste message for Claude remains for read-only
  views. JSON and Markdown export, as copy or as a file.
- **For sessions that lost the link.** "Copy for Claude Code" for one page and "Copy this
  project for Claude Code" for a whole project; "Duplicates" and "Untouched 60d+" chips
  show the two ways pages go stale.
- **Skills.** `setup` once; `hub` to rebuild or record; `find` to answer "where is my
  pricing page?"; `week` for a local digest; `pin` for the sidebar; an opt-in link check.
- **Kinds.** Docs, Slides, Design, Design system, Dashboard and Motion pages keep the kind
  Claude knows; others get one from the title, and the panel says which.
- **Shared with me.** Pages others shared are listed with the owner, filed and marked, and
  never offered for republishing.
- **Zero dependencies, zero network.** Three short Node scripts, five instruction files,
  one HTML page; 31 tests on Linux, macOS and Windows.

## 1.7.4

- Filter chips are always clickable again. A chip whose count is zero under the filters
  that are on is dimmed, not disabled; pressing it turns the other filters off so the one
  you pressed wins, and a toast says which were turned off. The Duplicates and Untouched
  chips no longer vanish while another filter is on.

## 1.7.3

- A code audit before the launch: a search keystroke over 154 pages renders in 2 ms
  (the first in 50 ms while the rows are built once), the hooks finish well under their
  200 ms budget, and every path in them exits quietly. Dead code and one unused browser
  key were removed; the tests now fail on any CSS class nothing uses, on a native select,
  and on a storage call outside the guarded helpers. Nothing changes in what the page
  does.

## 1.7.2

- A `motion` kind for animations made with Claude Motion (in beta on Team and Enterprise
  since 8 October 2026): its own cover, label and filter chip, recorded from the type id
  like the other kinds, or read from the title (animation, explainer, video).
- README notes that Docs, Slides and Design are on every plan now, and that each lands
  on the hub with its kind.

## 1.7.1

- Filter chips never lead to an empty page any more: each chip's count is what it would
  show under the other filters that are on, and a chip whose count is zero is dimmed and
  cannot be pressed. When a combination still comes up empty (after "Show what changed",
  say), the empty state names each filter that is on, each with its own ×, next to "Show
  every page here"; and the message says what was asked for ("No page pages marked final
  here"), not "No such pages here".

## 1.7.0

- The hub saves its own changes. Inside claude.ai the save bar's first button is "Save to
  hub": the page reads its own source, rewrites the data block from what it holds (every
  move, status and project note) and publishes a new version of itself, so the Unsaved
  marks clear on the reload that follows and Claude reads the same data next time. The
  message for Claude stays one click away ("or copy for Claude"), and is the only path
  for a view that cannot write (an old viewer, a read-only share) or a local copy.
  Needs the hub published with `capabilities: {"artifact": {}, "downloads": true}`; the
  skills now pass it.
- "Download Markdown" and "Download JSON" beside the copy buttons, when the viewer offers
  file saves (a confirmation is shown each time). The copy buttons stay for everyone.
- Pages marked `gone` keep the mark when the page writes its data back.
- From the third audit: a palette button on touch screens; "Show what changed" and the
  chips show every page, never the eight-per-project cut; chips and header buttons are
  40px on phones; palette headers read darker in the light looks; "Show hidden folders"
  in the palette; short queries no longer match letters spread across a title; PageUp and
  PageDown move the palette by eight; Esc with nothing to return to lands in the search box.

## 1.6.0

- A command palette on ⌘K (Ctrl K): one box that finds pages, folders and actions. Nothing
  typed shows the pages opened last and the actions run last; typing searches pages (ranked
  like the main search, across the whole hub), folders and about thirty actions, each with
  its shortcut shown. `>` narrows to actions, `#` to folders. Enter opens a page or runs an
  action, Shift+Enter shows a page's details. The search box's `/` hint reads `⌘K` on a
  pointer device; `/` still focuses plain search.
- Key hints in tooltips: "Pin · p", "Details · i", "Copy link · c", "Open in new tab ·
  Enter", "Gallery · v", "Keyboard shortcuts · ?", and so on. Never on touch screens.
- "Copy this project for Claude Code": a button in the folder header (and a palette action)
  copies one message with every page of the project and its link, newest first, so a new
  session can continue the project without publishing duplicates. Capped at 60 pages.
- Two quiet chips for the ways pages get lost, shown only when there is something to show:
  "Duplicates" (pages that share a title with another page; their rows carry a dashed
  "Duplicate?" label) and "Untouched 60d+" (not updated for 60 days, archived left out).
  Both filter the list; Esc clears them.
- "Copy this list as JSON" next to the Markdown export: projects, pages, links, dates,
  folders, kinds and status, pretty-printed. Made in the browser, sent nowhere.

## 1.5.10

- Dates written as a bare day (`2026-09-17`) are that day for every viewer; they used to
  slip to the day before west of UTC.
- A refused publish that quotes the live page's link is no longer recorded as a publish.
- The session hook also runs after `/clear` and `/fork`.
- A page whose id is a Claude Code uuid links under `claude.ai/code/artifact/`.
- Sidebar, chip and rail counts match what the lists show (hidden folders and archived
  pages left out).
- Covers carry a faint pattern per kind (lines for a document, bars for a report, a grid
  for a design, diagonals for code), so the cards of one project differ at a glance.
- On tablets the project chips at the top level take one sideways row; on phones every
  sideways row fades at its edges to say it goes on.
- A shared page's details no longer offer "Copy for Claude Code": it is listed, can be
  filed and marked, and says plainly that only its owner can change it. A row whose
  owner is unknown reads "Shared", not "shared by Shared".
- "Show" after "N pages updated since your last visit" starts from All pages, so every
  changed page is in the list, not only the open folder's.
- The save bar counts changes (a move and a status on one page are two), and updates at
  once when a note is cleared.
- Enter keeps a project note; Shift+Enter makes a line break.
- Touch: chips, the sort and view switches, the save bar buttons, card actions and the
  rail dots are all 40px on a touch screen.
- Text links and status labels read darker in the light looks (contrast above 4.5:1).
- `plugin.json` names the documentation and support pages for the plugin directory.

## 1.5.9

- Fixed: with pages selected, the selection bar's "Move to…" button was filled with every
  folder path as plain text and ran off the bar (since 1.5.4). It is a menu button again.
- All pages shows at most eight pages per project, newest first, with "All 64 in Fixkart →"
  under them; a hub with a hundred pages opens on every project instead of one.
- Details open with focus on the title, not the close button; on phones the status label
  steps aside while a row's actions show; the kind badge in the details panel reads darker
  in the light Claude look; status labels are 11px; touch targets are 40px; the page count
  leaves the phone layout and the empty state.

## 1.5.8

- First open in a browser: one quiet line, "Press ? for shortcuts · i for details on any
  page" (on touch, "Tap ⓘ on any page for details"), shown once about a second after the
  page loads and never on an empty hub (`project-hub.hint.v1`).
- `o` then a digit: while the page waits for the digit, the first nine pages shown wear a
  small numbered badge, so the mapping is visible instead of guessed. The badges go when a
  digit is pressed, on Esc, or after 2.5 seconds.
- A hidden folder no longer appears in the chip row at the top level (the row the tablet
  rail shows), and "Show" in the sidebar brings it back there too.

## 1.5.7

- After Claude writes your changes, the page forgets them on its own: an edit kept in the
  browser that the hub's data already has (status, folder or note) is dropped at load, so
  the Unsaved marks and the save bar disappear on reload without pressing Discard.

## 1.5.6

- The "Save changes with Claude" message no longer names the viewer's frame address as
  the hub's link (the page cannot see its own claude.ai link from inside the viewer); it
  says "my Project Hub" and the skill uses `hub.json`. Fixed from the first real use.

## 1.5.5

- "Save changes with Claude" and "Copy for Claude Code" open a sheet instead of a passing
  toast: the message in a box you can select, a line that says whether it reached the
  clipboard (and what to press if it did not), the three steps to follow, and "Copy
  again". Works when the viewer refuses the clipboard.

## 1.5.4

- Menus instead of native selects, in the details panel and the selection bar: a
  field-shaped button opens a list under it, with a dot per status, a dot or folder
  symbol per folder, subfolders indented, a check on the current item, arrow keys, Enter,
  Esc back to the button, and a filter box when the list is long. Opens upward when the
  screen runs out, and inside the details dialog so it works there too.
- Shorter note at the foot of the details panel.

## 1.5.3

- Unpin from the sidebar: each pinned page has its own × (on hover, or always on touch).
- The sidebar no longer lists recent pages; "Continue working" on the home view is the one
  place for them.
- Hide a folder: the eye button next to an open folder's name, or on hover in the
  sidebar, takes that folder and its pages out of All pages, the counts and the tree, on
  this page only (kept in the browser, `project-hub.hidden.v1`). The sidebar says how
  many folders are hidden and shows them again on request; opening a hidden folder by its
  link still works and says it is hidden.

## 1.5.2

- A new default look that matches claude.ai: cream background, charcoal text, terracotta
  accent, serif headings, in light and dark. The hub's own look (warm paper, teal) is
  still there under `?` → Look; the choice is remembered in the browser
  (`project-hub.look.v1`). Project colours are the same in both looks.

## 1.5.1

- Titles are saved as plain text: entities decoded (`&amp;` is `&`), whitespace
  collapsed, a title that is only whitespace falls back to the file name.
- The skills cover the edge cases: a hub with no rows, a page whose title changed (the
  id is what identifies it), the same page in two folders (one row kept), a saved
  message that names an unknown project or page (ask, apply the rest), `find` with too
  many matches, `week` before the activity log exists, `pin` without a hub.
- On the page: bulk actions redraw once, not once per page; the pencil for a project
  note sits inline on phones; the toast wraps on phones instead of overflowing; focus
  rings and touch targets audited; the screen reader hears search counts and the
  selection; long titles and empty descriptions are handled.
- README: a keyboard reference.

## 1.5.0

- `/artifact-hub:week`: a short digest from the files on your machine: published this
  week by project, untouched for 60 days, likely duplicates (same title, two links),
  and pages shared with you. Nothing is sent anywhere.
- `/artifact-hub:pin`: pins the hub to the sidebar, or unpins it.
- Link check, when asked: Claude reads each page once; a page that no longer opens is
  marked `gone` in its row, never removed. Slow, so it asks before more than 40 pages.
- Project notes: one short line per project of what matters now, under its heading;
  set in plain words, or on the page and saved through "Save changes with Claude".
- The hook keeps `activity.log` (one line per publish and per filing, the 500 latest)
  as the local source for the digest.
- On the page: a "Since you were here" line with how many pages changed since the last
  visit and a chip to show them; quick open with `o` and a digit; bulk selection
  (shift-click) to move pages, set a status or copy their links in one go; an empty hub
  shows a designed empty state with example rows marked as examples.

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
- Kinds Claude records itself: a page made from one of Claude's artifact types (Slides,
  Design, Design system, Dashboard, Docs) keeps that kind; the hook saves the type's id,
  the skill names it, and the row carries `{ kind }`. Other pages still get a kind from
  the title, and the details panel says which it was. One filter chip per kind in the
  bar, like the gallery's type filter.
- Pages shared with you, under one roof: a rebuild also lists `scope: "shared"` and files
  them under "Shared with me" with the owner's name on each row (`{ by }`). Listed, not
  edited. Asked once, remembered in `hub.json`.
- The listing covers 200 pages, not 50: setup and rebuild ask for 200.
- The fifth row item may be an object `{ status, kind, by }`; a bare status word still
  works.
- Move and set status on the page itself: the details panel has "Move to" and "Status".
  A change shows at once, marked "Unsaved", and a bar at the top counts the changes with
  "Save changes with Claude" (one message to paste, listing each change) and "Discard".
  The hub's data is written only by Claude, so nothing silently diverges.
- Exact date and time: a row's date may be the full time stamp the plugin saved
  (`2026-10-16T18:42:11Z`). The page keeps the short "3w" label and shows the day and
  time on hover and in the details panel. Days like `'3 Oct'` still work.
- The sidebar's Recent list shows 6 and says how many there are, with "all" opening the
  full list, most recently opened first.
- Status on a page: `draft`, `review`, `final` or `archived`, an optional fifth item in the
  row, set in plain words ("mark the pricing page final"). A small label on the page, one
  filter chip per status; archived pages stay in the hub but show only through their chip.
- Project colour from the page: the colour dot next to an open project's name opens the
  eight swatches. The choice is kept in that browser; ask Claude to make it permanent.
- The sidebar folds to the rail of project dots on desktop (the button in its corner, the
  menu button, or `[`), and the choice is remembered.
- A third hook, on `SessionStart`: if pages were published from this repository in the
  last 30 days, Claude is told the two most recent ones, in one line, so "continue the
  pricing page" goes to the right page. Silent otherwise.
- Relative dates: "0mo" no longer appears; 30 to 44 days read as weeks.
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
- "Copy this list as Markdown" at the bottom of the page: every folder, title,
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
