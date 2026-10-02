#!/usr/bin/env node
// Runs after every Artifact tool call. When a page was published (not read, listed,
// pinned, an asset upload, or the hub itself) it does two things:
//   1. saves the page's link in ~/.claude/artifact-hub/pages.json — a plain local list,
//      written by this script, so a link is kept even if nothing else happens;
//   2. reminds Claude to add the page to the user's Project Hub.
// It makes no network request and starts no other program.
const fs = require('fs');
const os = require('os');
const path = require('path');

const DIR = path.join(os.homedir(), '.claude', 'artifact-hub');
const CONFIG = path.join(DIR, 'hub.json');
const PAGES = path.join(DIR, 'pages.json');

const say = (text) =>
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: text } }));
const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };
const idOf = (url) => String(url || '').split(/[/?#]/).filter(Boolean).pop();

/** The page's own <title>, read from the file that was just published (first 8 KB, as the gallery does). */
function titleOf(filePath) {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(8192);
    const n = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    const m = buf.toString('utf8', 0, n).match(/<title[^>]*>([^<]{1,200})<\/title>/i);
    return m ? m[1].trim() : null;
  } catch { return null; }
}

/** Adds or refreshes one entry in the local list. Never removes anything. */
function remember(url, title, folder) {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    const pages = readJson(PAGES, []);
    const list = Array.isArray(pages) ? pages : [];
    const now = new Date().toISOString();
    const hit = list.find((p) => idOf(p.url) === idOf(url));
    if (hit) { hit.last = now; if (title) hit.title = title; if (folder) hit.folder = folder; }
    else list.push({ url, title: title || null, folder: folder || null, first: now, last: now });
    const tmp = `${PAGES}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, `${JSON.stringify(list, null, 2)}\n`);
    fs.renameSync(tmp, PAGES); // whole-file swap, so a crash cannot leave half a list
    return true;
  } catch { return false; }
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  let event = {};
  try { event = JSON.parse(raw || '{}'); } catch { process.exit(0); }
  const input = event.tool_input || {};
  if ((input.action || 'publish') !== 'publish' || input.asset) process.exit(0);
  const response = typeof event.tool_response === 'string' ? event.tool_response : JSON.stringify(event.tool_response || '');
  // a refused or failed publish has no page to record
  const found = response.match(/https:\/\/claude\.ai\/(?:code\/)?artifact\/[A-Za-z0-9_-]+/);
  if (!found) process.exit(0);
  const url = found[0];

  const hub = readJson(CONFIG, null);
  // the hub's own republish is not a page to record, and must not ask for another hub update
  if (hub && hub.hubUrl && idOf(url) === idOf(hub.hubUrl)) process.exit(0);

  const folder = event.cwd ? path.basename(String(event.cwd)) : null;
  const saved = remember(url, input.file_path ? titleOf(String(input.file_path)) : input.title || null, folder);

  if (!hub || !hub.hubUrl) {
    // mention setup once a day at most, so someone who does not want a hub is not nagged
    const stamp = path.join(DIR, '.offered');
    try { if (Date.now() - fs.statSync(stamp).mtimeMs < 24 * 3600 * 1000) process.exit(0); } catch { /* first time */ }
    try { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(stamp, ''); } catch { /* read-only home */ }
    say(`[artifact-hub] ${saved ? 'The link to the page just published was saved in ~/.claude/artifact-hub/pages.json. ' : ''}There is no Project Hub yet. After finishing the current request, tell the user in one line that /artifact-hub:setup creates one index page for all their published pages. Do not run it unless they ask.`);
    return;
  }

  const projects = (hub.projects || []).map((p) => p.name).join(', ');
  say(
    `[artifact-hub] A page was just published${saved ? ' and its link saved locally' : ''}. Before ending this turn, record it in ${hub.hubTitle || 'Project Hub'} (${hub.hubUrl}) ` +
    `by following the artifact-hub:hub skill ("Recording one page"): read the hub, add or update this page's row under the right project` +
    `${projects ? ` (${projects})` : ''}, republish the hub to the same URL, and tell the user in one line that the hub was updated. ` +
    `Skip this only if the user said not to record this page.`,
  );
});
