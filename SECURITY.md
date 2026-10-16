# Security

## What this plugin can do

It registers three hooks, all run with Node.js in exec form (no shell), with no MCP
server, no agent and no dependency to install:

| Event | Matcher | Script |
|---|---|---|
| `PostToolUse` | `Artifact\|mcp__claude_ai_Claude_Docs__batch` (the Artifact tool, and the Claude Docs connector call that creates a document) | `hooks/on-artifact.js`, 164 lines |
| `Stop` | none | `hooks/on-stop.js`, 36 lines |
| `SessionStart` | `startup\|resume\|clear\|fork` | `hooks/on-session.js`, 56 lines |

The scripts:

- read the hook event from stdin, the first 8 KB of the file that was just published
  (to find its `<title>`), and `~/.claude/artifact-hub/hub.json`;
- write `~/.claude/artifact-hub/pages.json`, `activity.log` (a line per publish and per
  filing, the 500 latest), `.offered` and `.pending`;
- print one JSON object for Claude to read, or nothing.

The five skills are plain instructions in `skills/*/SKILL.md`. They ask Claude to use its
own Artifact tool and to read and write the files above, nothing else.

The hub page (the artifact) declares two claude.ai runtime capabilities: `artifact`, so
that "Save to hub" can publish a new version of the page itself from inside the viewer,
and `downloads`, so that the JSON and Markdown exports can be saved as files after you
confirm. Both act as you, inside claude.ai. A read-only viewer cannot save.

## What it cannot do

- Open a network connection. The scripts import only `fs`, `path` and `os`; the page
  makes no request except reading its own source, and the viewer's content-security
  policy would block any other host.
- Start another program, read environment variables or credentials, or change any
  Claude Code setting or permission.
- Delete an artifact. Rows leave the hub only when you delete the page yourself or say
  it is gone.
- See the content of your pages. The hub holds a title, a description, a date and a
  link per page.

Behaviour is covered by `test/hook.test.js` and `test/template.test.js`, run on Linux,
macOS and Windows for every change.

## Check it yourself

These should all print nothing:

```
grep -nE "require\\('(http|https|net|dgram|child_process|tls)'\\)|fetch\\(|process\\.env" hooks/*.js
grep -nE "fetch\\(|XMLHttpRequest|WebSocket|<script src|<iframe" skills/hub/template.html | grep -v "fetch(location.href"
```

The one `fetch` in the template reads the page's own address, so that Save to hub can
rewrite the data block and republish exactly what was served.

## Install a fixed version

To avoid picking up future changes without reviewing them, install a tagged release:

```
/plugin marketplace add SureshKumar-24/artifact-hub@v2.0.0
```

## Report a problem

Open an issue at https://github.com/SureshKumar-24/artifact-hub/issues. For something
that should not be public, use GitHub's "Report a vulnerability" on the Security tab.
