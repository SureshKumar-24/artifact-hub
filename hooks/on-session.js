#!/usr/bin/env node
// Runs when a session starts or resumes. If the user published pages from this repository
// in the last 30 days, it tells Claude the two most recent ones (title and link), so "continue
// the pricing page" can go to the right page without a search. One short line, nothing else;
// silent when there is no hub, no match, or the folder is unknown.
// It makes no network request and starts no other program.
const fs = require('fs');
const os = require('os');
const path = require('path');

const DIR = path.join(os.homedir(), '.claude', 'artifact-hub');
const CONFIG = path.join(DIR, 'hub.json');
const PAGES = path.join(DIR, 'pages.json');
const DAYS = 30;
const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };

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

function main(raw) {
  let event = {};
  try { event = JSON.parse(raw || '{}'); } catch { return; }
  const hub = readJson(CONFIG, null);
  if (!hub || !hub.hubUrl) return;
  const folder = projectFolder(event.cwd || process.cwd());
  if (!folder) return;
  const pages = readJson(PAGES, []);
  if (!Array.isArray(pages)) return;
  const since = Date.now() - DAYS * 24 * 3600 * 1000;
  const recent = pages
    .filter((p) => p && p.url && p.folder === folder && !p.deleted && !p.replacedBy && Date.parse(p.last || p.first || '') > since)
    .sort((a, b) => Date.parse(b.last || b.first) - Date.parse(a.last || a.first))
    .slice(0, 2);
  if (!recent.length) return;
  const list = recent.map((p) => `${p.title ? `"${p.title}"` : 'a page'} (${p.url})`).join(' and ');
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: `[artifact-hub] From this repository the user last published ${list}. If they ask to continue or update one of these, read it with the Artifact tool and publish to the same URL; the artifact-hub:find skill finds others.`,
    },
  }));
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => { try { main(raw); } catch { /* never break the user's session */ } });
