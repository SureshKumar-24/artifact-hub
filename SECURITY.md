# Security

## What this plugin can do

It registers one hook: `PostToolUse`, matcher `Artifact`. The hook starts
`hooks/on-artifact.js` with Node.js in exec form (no shell). There is no
`SessionStart` hook, no MCP server, no agent and no dependency to install.

The script:

- reads the hook event from stdin, the first 8 KB of the file that was just published
  (to find its `<title>`), and `~/.claude/artifact-hub/hub.json`;
- writes `~/.claude/artifact-hub/pages.json` and `~/.claude/artifact-hub/.offered`;
- prints one JSON object for Claude to read.

Its behaviour is covered by `test/hook.test.js`, run on Linux, macOS and Windows for
every change.

It does not open a network connection, start another program, read environment
variables or credentials, or change any Claude Code setting or permission.

## Check it yourself

The script is 121 lines: [hooks/on-artifact.js](hooks/on-artifact.js). These should
all print nothing:

```
grep -nE "require\\('(http|https|net|dgram|child_process|tls)'\\)|fetch\\(|process\\.env" hooks/on-artifact.js
```

The two skills are plain instructions in `skills/*/SKILL.md`. They ask Claude to use
its own Artifact tool and to read and write the two files above, nothing else.

## Install a fixed version

To avoid picking up future changes without reviewing them, install a tagged release:

```
/plugin marketplace add SureshKumar-24/artifact-hub@v1.3.0
```

## Report a problem

Open an issue at https://github.com/SureshKumar-24/artifact-hub/issues. For something
that should not be public, use GitHub's "Report a vulnerability" on the Security tab.
