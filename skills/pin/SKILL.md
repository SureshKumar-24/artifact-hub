---
name: pin
description: Pins the user's Project Hub to their claude.ai sidebar, or unpins it. Use when the user asks to pin, unpin, or keep the hub in the sidebar.
---

# Pin the hub

1. Read `~/.claude/artifact-hub/hub.json`. If the file is missing or has no `hubUrl`,
   there is no hub yet: say so in one line and point to the `setup` skill; do not guess a
   link from the gallery.
2. To pin: `Artifact` `action: "pin"` with `url` set to `hubUrl`. To unpin:
   `action: "unpin"`.
3. Say in one line what happened: "Project Hub is pinned to your sidebar" or "unpinned".
   If the tool refuses, say so and give the link so the user can pin it from the page's
   own menu.

Pin only when asked. Never pin any other page from here.
