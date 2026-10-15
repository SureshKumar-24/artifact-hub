# Security

## What this plugin can do

It registers three hooks. `PostToolUse`, matcher `Artifact|mcp__claude_ai_Claude_Docs__batch`
(the Artifact tool, and the Claude Docs connector call that creates a document), starts
`hooks/on-artifact.js`. `Stop` starts `hooks/on-stop.js`. `SessionStart` (startup and
resume) starts `hooks/on-session.js`, which reads the two JSON files and prints one line
or nothing. All run with Node.js in exec form (no shell). There is no MCP server, no
agent and no dependency to install.

The scripts:

- read the hook event from stdin, the first 8 KB of the file that was just published
  (to find its `<title>`), and `~/.claude/artifact-hub/hub.json`;
- write `~/.claude/artifact-hub/pages.json`, `.offered` and `.pending`;
- print one JSON object for Claude to read.

Its behaviour is covered by `test/hook.test.js`, run on Linux, macOS and Windows for
every change.

It does not open a network connection, start another program, read environment
variables or credentials, or change any Claude Code setting or permission.

## Check it yourself

The scripts are 137, 36 and 56 lines: [on-artifact.js](hooks/on-artifact.js), [on-stop.js](hooks/on-stop.js), [on-session.js](hooks/on-session.js). These should
all print nothing:

```
grep -nE "require\\('(http|https|net|dgram|child_process|tls)'\\)|fetch\\(|process\\.env" hooks/*.js
```

The three skills are plain instructions in `skills/*/SKILL.md`. They ask Claude to use
its own Artifact tool and to read and write the two files above, nothing else.

## Install a fixed version

To avoid picking up future changes without reviewing them, install a tagged release:

```
/plugin marketplace add SureshKumar-24/artifact-hub@v1.3.0
```

## Report a problem

Open an issue at https://github.com/SureshKumar-24/artifact-hub/issues. For something
that should not be public, use GitHub's "Report a vulnerability" on the Security tab.
