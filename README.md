# artifact-hub

A Claude Code plugin that keeps your own index of every page you publish.

Claude's artifact gallery is one flat list of recent pages. Older pages drop out of
view, and nothing separates one project from another. This plugin gives you **Project
Hub**: one artifact that lists all your published pages, grouped by project, with a
search box. A page once listed stays listed.

## What it does

- **Setup** - `/artifact-hub:setup` reads your gallery, proposes how to group the pages
  into projects, and publishes your hub once you agree.
- **Rebuild** - `/artifact-hub:hub` brings the hub up to date from the gallery. It adds
  what is new and never removes what is already there.
- **Automatic** - each time Claude publishes a page, the plugin reminds Claude to record
  it, filed under the project of the folder you are working in.

## Install

```
/plugin marketplace add SureshKumar-24/artifact-hub
/plugin install artifact-hub@artifact-hub
```

Then run `/artifact-hub:setup` once.

To try it without installing: `claude --plugin-dir path/to/artifact-hub`.

## What it costs

- Nothing at session start: no extra context, no startup step.
- One reminder of about 80 words, only in a turn where Claude publishes an artifact.
- Recording a page is one read and one republish of the hub.

## What it runs, reads and sends

- **Runs:** one small Node script (`hooks/on-artifact.js`, about 50 lines, readable)
  after an Artifact tool call. It is started directly, with no shell in between. It
  reads the tool's result and your hub settings and prints a reminder. It makes no
  network request, runs no other program and changes no setting. It needs Node.js on
  your PATH.
- **Reads:** the list of your own artifacts, through Claude's own Artifact tool, when
  you run setup or a rebuild.
- **Writes:** `~/.claude/artifact-hub/hub.json` (your hub's address and project rules)
  and your hub artifact.
- **Sends:** nothing. There is no server, no analytics and no account. Your hub is a
  private artifact in your own Claude account, and it stays private unless you share it.

## Limits

- Needs a plan that can publish artifacts from Claude Code.
- Works in Claude Code only. Pages made in the claude.ai chat app are picked up when
  you run `/artifact-hub:hub`.
- The gallery listing shows the 50 most recently updated pages, so older pages have to
  be added by name the first time. After that they stay in the hub.
- The automatic step is a reminder to Claude, not a direct write. If a session ends
  right after a publish, run `/artifact-hub:hub` to catch up.
- If Claude adds folders to the gallery itself, you will no longer need this.

## Uninstall

`/plugin uninstall artifact-hub`, then delete `~/.claude/artifact-hub/` if you no
longer want the saved address. Your hub artifact stays until you delete it yourself.

## Privacy

This plugin collects no data. See "What it runs, reads and sends" above.

## Licence

MIT
