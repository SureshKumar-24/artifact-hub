# artifact-hub-guard

A mod for Claude Code that stops duplicate pages before they exist.

The main Artifact Hub plugin files a page after it is published. This mod acts one step
earlier. When Claude is about to publish a **new** artifact (an `Artifact` call with no
`url`) and your saved list already has a page with the same title, you get one question:

> A page titled "Pricing Page" already exists in shop, last published 2026-10-10.
> Update it instead of publishing a new one?
>
> Update the existing page · Publish a new page anyway

"Update" rewrites the call with the saved link, so the page is republished in place and
the old link keeps working. "Publish anyway" lets the call through as it was. Everything
else passes untouched: republishes that already carry a `url`, reads, lists, deletes,
asset uploads. If the guard itself fails for any reason, or there is nobody to ask (a
`claude -p` run), the call goes through as Claude made it. The mod can only ask; it never
blocks.

## Install

```
/plugin marketplace add SureshKumar-24/artifact-hub
/plugin install artifact-hub-guard@artifact-hub
```

It works alongside the main plugin and reads the list the main plugin keeps, so install
`artifact-hub` first. Start a new session after installing.

## Needs

Claude Code **2.1.287 or later** in the terminal (2.1.286 in the desktop app), where
hooks modules ("mods") are on by default. On an older version the mod does not load and
nothing else changes. Anthropic's own mods README says: hooks modules load only where
function hooks are enabled, and the API these mods are written against may change
between releases without notice. That is why this is a separate plugin: the main plugin
keeps working on every Claude Code that has classic hooks.

## What it reads, writes and sends

| | |
|---|---|
| **Hooks** | One: `tool.call` on the `Artifact` tool. |
| **Reads** | `~/.claude/artifact-hub/pages.json` (the main plugin's saved list) and, to find a title, the first 8 KB of the file about to be published. `HOME` (or `USERPROFILE`) to locate them. |
| **Writes** | Nothing. |
| **Sends** | Nothing. No network, no process, no other tool. |
| **Asks** | At most one question per new publish whose title is already saved. |

`claude plugin validate guard` lists exactly these: it reads the module the way the
engine does and prints every call it makes.

## Try it from a checkout

```
claude plugin test guard
claude --plugin-dir guard
```

The tests run against the engine's own test kit: a saved list, a page file and the
question dialog are answered beneath the mod, and the call that reaches the Artifact
tool is checked for the rewritten `url`.

## Developing

The hook is typed against the declarations Claude Code writes for the running version.
Run `/plugin-types` in a Claude Code session to generate them, copy the resulting
`claude-code.d.ts` (and `testing.d.ts`) into `guard/types/` (git-ignored), and `tsc -p guard`
checks the hook and its tests. `claude plugin test guard` runs the tests through the engine's
own test kit; `claude plugin validate guard` lists every `$` call the module makes.
