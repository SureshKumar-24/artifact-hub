# Changelog

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
