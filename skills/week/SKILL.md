---
name: week
description: A short digest of the user's published pages: what was published this week by project, what has gone untouched for two months, likely duplicates, and pages shared with them. Use when the user asks what they published this week, for a weekly summary or review of their pages, or what to clean up.
---

# This week's pages

Everything comes from two local files and the hub; nothing is sent anywhere.

1. Read `~/.claude/artifact-hub/pages.json` (one entry per page: `url`, `title`,
   `folder`, `first`, `last`, and `deleted`, `replacedBy`, `type`, `typeId` when set) and
   `~/.claude/artifact-hub/activity.log` (one line per publish and per filing, newest
   last, ISO time first). The log may not exist yet (it starts with 1.5.0): then use
   `first` and `last` alone. If `hub.json` has a `hubUrl`, `Artifact` `action: "read"`
   it and use its `PROJECTS` to name each page's project; otherwise group by `folder`.
2. Work out, from `first` and `last` (and the log's `published` lines):
   - **Published this week**: pages whose `first` is in the last 7 days, by project:
     the count and the titles. Pages whose `last` moved this week but `first` is older
     are "updated", listed after.
   - **Untouched for 60 days**: pages whose `last` is older than 60 days and that are not
     `deleted`, `replacedBy` or archived in the hub. Titles and projects, oldest first,
     at most ten; say how many more.
   - **Likely duplicates**: entries with the same title and different ids, where
     neither is `deleted` or `replacedBy`. Pairs with both links.
   - **Shared with the user**: rows under "Shared with me" in the hub whose date is in
     the last 7 days, with the owner's name.
3. Answer in one short message, these four headings in this order, skipping a heading
   that has nothing. Numbers first, then titles with links. No advice unless something
   needs a decision: a duplicate pair ("keep which?"), or many untouched pages ("archive
   them?"). Do not change the hub or the files here; if the user then asks to archive or
   merge, follow the `hub` skill.

If `pages.json` does not exist, say the plugin has not recorded a publish yet and that
the hub (if there is one) can still be rebuilt with the `hub` skill.
