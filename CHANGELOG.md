# Changelog

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
