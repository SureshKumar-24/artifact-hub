#!/usr/bin/env node
// Runs after every Artifact tool call, and after a Claude Docs call that creates a document.
//   publish -> saves the page's link in ~/.claude/artifact-hub/pages.json (a plain local
//              list written by this script, so a link is kept even if nothing else
//              happens) and reminds Claude to file the page on the user's Project Hub;
//   new doc -> the same, for a document made with the Claude Docs connector;
//   delete  -> marks that page as deleted in the list and reminds Claude to take its row
//              off the hub.
// Everything else (read, list, pin, asset uploads, edits to an existing doc, the hub's own
// republish) is ignored. It makes no network request and starts no other program.
const fs = require('fs');
const os = require('os');
const path = require('path');

const DIR = path.join(os.homedir(), '.claude', 'artifact-hub');
const CONFIG = path.join(DIR, 'hub.json');
const PAGES = path.join(DIR, 'pages.json');
const PENDING = path.join(DIR, '.pending'); // a page asked to be filed; cleared by the hub's republish or by on-stop.js
const LINK = /https:\/\/claude\.ai\/(?:code\/)?artifact\/[A-Za-z0-9_-]+/;
const DOCS = 'mcp__claude_ai_Claude_Docs__batch';

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
    return m ? m[1].trim() : path.basename(filePath).replace(/\.[^.]+$/, '');
  } catch { return null; }
}

/** Name of the project folder: the nearest folder holding a .git entry, else the working folder. */
function projectFolder(cwd) {
  if (!cwd) return null;
  let dir = path.resolve(String(cwd));
  for (let i = 0; i < 40; i++) {
    try { if (fs.existsSync(path.join(dir, '.git'))) return path.basename(dir); } catch { break; }
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return path.basename(path.resolve(String(cwd)));
}

/** Reads the list, lets `change` edit it, and swaps the whole file in. Never drops an entry. */
function update(change) {
  try {
    fs.mkdirSync(DIR, { recursive: true });
    const pages = readJson(PAGES, []);
    const list = Array.isArray(pages) ? pages : [];
    change(list, new Date().toISOString());
    const tmp = `${PAGES}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, `${JSON.stringify(list, null, 2)}\n`);
    fs.renameSync(tmp, PAGES); // whole-file swap, so a crash cannot leave half a list
    return true;
  } catch { return false; }
}

function main(raw) {
  let event = {};
  try { event = JSON.parse(raw || '{}'); } catch { return; }
  // the matcher also lets through tools whose name merely starts with "Artifact"
  const isDoc = event.tool_name === DOCS;
  if (event.tool_name && event.tool_name !== 'Artifact' && !isDoc) return;
  const input = event.tool_input || {};
  // a Docs call counts only when it creates a document; edits to an existing one carry an id
  const newDoc = isDoc && input.container && input.container.create ? input.container.create : null;
  if (isDoc && !newDoc) return;
  const action = isDoc ? 'publish' : input.action || 'publish';
  const response = typeof event.tool_response === 'string' ? event.tool_response : JSON.stringify(event.tool_response || '');
  const hub = readJson(CONFIG, null);
  const hubName = hub && hub.hubUrl ? `${hub.hubTitle || 'Project Hub'} (${hub.hubUrl})` : null;

  if (action === 'delete') {
    // `path` means one uploaded asset was removed, not the page
    if (input.path || !LINK.test(String(input.url || '')) || /refus|denied|declin|not deleted|error/i.test(response)) return;
    const gone = idOf(input.url);
    if (hub && hub.hubUrl && idOf(hub.hubUrl) === gone) return;
    let known = false;
    update((list, now) => { const hit = list.find((p) => idOf(p.url) === gone); if (hit) { hit.deleted = now; known = true; } });
    if (hubName && known) say(`[artifact-hub] A published page was deleted (${input.url}). Before ending this turn, remove its row from ${hubName} by following the artifact-hub:hub skill, republish the hub to the same URL, and tell the user in one line.`);
    return;
  }

  if (action !== 'publish' || input.asset) return;
  // a refused or failed publish has no page to record
  const found = response.match(LINK);
  if (!found) return;
  const url = found[0];
  // the hub's own republish is not a page to record, and must not ask for another hub update;
  // it also means the pending page was filed
  if (hub && hub.hubUrl && idOf(url) === idOf(hub.hubUrl)) { try { fs.unlinkSync(PENDING); } catch { /* none pending */ } return; }

  const folder = projectFolder(event.cwd);
  const title = newDoc ? (typeof newDoc.name === 'string' && newDoc.name.trim()) || null
    : input.file_path ? titleOf(String(input.file_path)) : input.title || null;
  // a new page with the title of a known page is most likely that page published again from a
  // session that had lost the link; the old entry is marked, never removed, and Claude is told
  let replaced = null;
  const saved = update((list, now) => {
    const hit = list.find((p) => idOf(p.url) === idOf(url));
    if (hit) { hit.last = now; delete hit.deleted; if (title) hit.title = title; if (folder) hit.folder = folder; return; }
    const twin = title && list.find((p) => p.title === title && !p.deleted && !p.replacedBy);
    if (twin) { twin.replacedBy = url; replaced = twin.url; }
    // what kind of page: a Claude Docs document, or a page made from one of Claude's artifact types
    // (slides, design, dashboard...), kept as the type's own id for the hub skill to name
    const kind = newDoc ? { type: 'doc' } : input.type_url && LINK.test(String(input.type_url)) ? { typeId: idOf(input.type_url) } : {};
    list.push({ url, title: title || null, folder: folder || null, first: now, last: now, ...kind });
  });
  try { fs.writeFileSync(PENDING, JSON.stringify({ url, title, at: Date.now() })); } catch { /* read-only home */ }

  if (!hubName) {
    // mention setup once a day at most, so someone who does not want a hub is not nagged
    const stamp = path.join(DIR, '.offered');
    try { if (Date.now() - fs.statSync(stamp).mtimeMs < 24 * 3600 * 1000) return; } catch { /* first time */ }
    try { fs.mkdirSync(DIR, { recursive: true }); fs.writeFileSync(stamp, ''); } catch { /* read-only home */ }
    say(`[artifact-hub] ${saved ? 'The link to the page just published was saved in ~/.claude/artifact-hub/pages.json. ' : ''}There is no Project Hub yet. After finishing the current request, tell the user in one line that /artifact-hub:setup creates one index page for all their published pages. Do not run it unless they ask.`);
    return;
  }

  const projects = (hub.projects || []).map((p) => p.name).join(', ');
  say(
    `[artifact-hub] A ${newDoc ? 'document was just created' : 'page was just published'}${saved ? ' and its link saved locally' : ''}. Before ending this turn, record it in ${hubName} ` +
    `by following the artifact-hub:hub skill ("Recording one page"): read the hub, add or update this page's row in the right folder` +
    `${projects ? ` (projects: ${projects})` : ''}, republish the hub to the same URL, and tell the user in one line that the hub was updated. ` +
    `${replaced ? `It has the same title as ${replaced}, which was most likely this page published again without its link: if so, change that row's id to the new page instead of adding a row, and tell the user the old link still works. ` : ''}` +
    `Skip this only if the user said not to record this page.`,
  );
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => { try { main(raw); } catch { /* never break the user's turn */ } });
