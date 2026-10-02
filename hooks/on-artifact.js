#!/usr/bin/env node
// Runs after every Artifact tool call. When a page was published (not read, listed,
// pinned, an asset upload, or the hub itself), it tells Claude to record it in the
// user's Project Hub. The hub's address and project rules are the user's own, kept in
// ~/.claude/artifact-hub/hub.json (written by /artifact-hub:setup), never in the plugin.
const fs = require('fs');
const os = require('os');
const path = require('path');

const CONFIG = path.join(os.homedir(), '.claude', 'artifact-hub', 'hub.json');
const say = (text) =>
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: text } }));

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let event = {};
  try { event = JSON.parse(raw || '{}'); } catch { process.exit(0); }
  const input = event.tool_input || {};
  if ((input.action || 'publish') !== 'publish' || input.asset) process.exit(0);
  const response = JSON.stringify(event.tool_response || '');
  // a refused or failed publish has no page to record
  if (!/claude\.ai\/(code\/)?artifact\//.test(response)) process.exit(0);

  let hub = null;
  try { hub = JSON.parse(fs.readFileSync(CONFIG, 'utf8')); } catch { /* not set up yet */ }
  if (!hub || !hub.hubUrl) {
    // say it once per day at most, so a user who does not want a hub is not nagged
    const stamp = path.join(path.dirname(CONFIG), '.offered');
    try { if (Date.now() - fs.statSync(stamp).mtimeMs < 24 * 3600 * 1000) process.exit(0); } catch { /* first time */ }
    try { fs.mkdirSync(path.dirname(CONFIG), { recursive: true }); fs.writeFileSync(stamp, ''); } catch { /* read-only home */ }
    say('[artifact-hub] The artifact-hub plugin is installed but has no hub yet. After finishing the current request, tell the user in one line that /artifact-hub:setup creates one index page for all their published pages. Do not run it unless they ask.');
    return;
  }

  const id = (url) => String(url || '').split(/[/?#]/).filter(Boolean).pop();
  // the hub's own republish must not ask for another hub update
  if (id(input.url) === id(hub.hubUrl) || response.includes(id(hub.hubUrl))) process.exit(0);

  const projects = (hub.projects || []).map((p) => p.name).join(', ');
  say(
    `[artifact-hub] A page was just published. Before ending this turn, record it in ${hub.hubTitle || 'Project Hub'} (${hub.hubUrl}) ` +
    `by following the artifact-hub:hub skill in "add" mode: read the hub, add or update this page's row under the right project` +
    `${projects ? ` (${projects})` : ''}, republish the hub to the same URL, and tell the user in one line that the hub was updated. ` +
    `Skip this only if the user said not to record this page.`,
  );
});
