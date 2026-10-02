# artifact-hub

Never lose a page you published with Claude Code: every artifact is saved to a list on your machine and filed, by project, on one index page.

![Project Hub: published pages grouped by project, with a search box](docs/hub.png)

*The screenshot shows example pages.*

## Install

```
/plugin marketplace add SureshKumar-24/artifact-hub
/plugin install artifact-hub@artifact-hub
```

Then run `/artifact-hub:setup` once. To pin this exact release instead of the latest
code, add `@v1.1.0` to the first command.

To try it without installing: `claude --plugin-dir path/to/artifact-hub`.

## Why

Claude's artifact gallery is one flat list of recent pages. Older pages drop out of
view, and if you no longer have the link, the page is hard to get back. Nothing
separates one project from another.

With this plugin:

- **Every link is kept.** The moment a page is published, its link, title and folder
  are written to a plain file on your machine. This is done by the plugin itself, so it
  does not depend on Claude remembering anything.
- **One page shows everything.** Your Project Hub lists all your pages under their
  projects, each with a line saying what it is, and a search box across all of them.
- **You do nothing extra.** Publish as usual. The new page is filed under the project
  of the folder you are working in.

## How to use it

| When | What to do | What happens |
|---|---|---|
| Once | `/artifact-hub:setup` | Claude reads your gallery, proposes how to group your pages into projects, and publishes your hub when you agree. |
| Every publish | Nothing | The link is saved locally and Claude adds the page to your hub. |
| Any time | `/artifact-hub:hub` | Rebuilds the hub from the gallery and the local list. Adds what is new, never removes what is there. |

## What it runs, reads and sends

A plugin can run code on your machine, so here is all of it.

- **Runs:** one hook, on the `PostToolUse` event for the `Artifact` tool. It starts
  `hooks/on-artifact.js` (86 lines, plain Node.js, no dependencies) directly, with no
  shell in between. Nothing runs at session start.
- **Reads:** the result of the Artifact tool call, the `<title>` of the file that was
  just published, and your hub settings. During setup or a rebuild, Claude reads the
  list of your own artifacts through its own Artifact tool.
- **Writes:** two files in `~/.claude/artifact-hub/`: `pages.json` (the list of your
  published links) and `hub.json` (your hub's address and project rules). And your hub
  artifact.
- **Sends:** nothing. No network request, no server, no analytics, no account. Your hub
  is a private artifact in your own Claude account and stays private unless you share it.

See [SECURITY.md](SECURITY.md) for how to check this yourself.

## What it costs

- Nothing at session start: no extra context, no startup step.
- One reminder of about 80 words, only in a turn where Claude publishes an artifact.
- Adding a page to the hub is one read and one republish of the hub.

## Limits

- Needs a plan that can publish artifacts from Claude Code, and Node.js on your PATH.
- Works in Claude Code only. Pages made in the claude.ai chat app are picked up when
  you run `/artifact-hub:hub`.
- Pages published before you installed the plugin come from the gallery listing, which
  shows the 50 most recently updated. Older ones have to be added by name once.
- Adding a page to the hub is done by Claude after a reminder. If a session ends right
  after a publish, the link is still in `pages.json`; run `/artifact-hub:hub` to put
  it on the hub.
- If Claude adds folders to the gallery itself, you will no longer need this.

## Uninstall

`/plugin uninstall artifact-hub`, then delete `~/.claude/artifact-hub/` if you no
longer want the saved list. Your hub artifact stays until you delete it yourself.

## Privacy

This plugin collects no data and contacts no server. Everything it stores is in
`~/.claude/artifact-hub/` on your machine and in your own Claude account.

## Contributing

Issues and pull requests are welcome. The whole plugin is a hook script, two skills and
a page template, so most changes are small. See [CHANGELOG.md](CHANGELOG.md).

## Licence

MIT. Not made by or affiliated with Anthropic.
