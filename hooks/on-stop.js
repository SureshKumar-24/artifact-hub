#!/usr/bin/env node
// Runs when Claude finishes a turn. If a page was published this turn and asked to be filed
// (on-artifact.js wrote ~/.claude/artifact-hub/.pending) but the hub was not republished
// since, it reminds Claude once. The marker is removed first, so the reminder never repeats.
// It makes no network request and starts no other program.
const fs = require('fs');
const os = require('os');
const path = require('path');

const DIR = path.join(os.homedir(), '.claude', 'artifact-hub');
const PENDING = path.join(DIR, '.pending');
const CONFIG = path.join(DIR, 'hub.json');
const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return fallback; } };

function main(raw) {
  let event = {};
  try { event = JSON.parse(raw || '{}'); } catch { return; }
  const pending = readJson(PENDING, null);
  if (!pending || !pending.url) return;
  try { fs.unlinkSync(PENDING); } catch { return; } // another process already handled it
  const hub = readJson(CONFIG, null);
  if (!hub || !hub.hubUrl) return;
  if (Date.now() - (+pending.at || 0) > 30 * 60 * 1000) return; // stale: a turn that ended long ago
  const said = String(event.last_assistant_message || '');
  if (/hub/i.test(said)) return; // Claude reported the hub was updated, or explained why not
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'Stop',
      additionalContext: `[artifact-hub] The page published this turn (${pending.url}${pending.title ? `, "${pending.title}"` : ''}) was not recorded in ${hub.hubTitle || 'Project Hub'} (${hub.hubUrl}). Record it now by following the artifact-hub:hub skill ("Recording one page"), unless the user said not to; then tell the user in one line.`,
    },
  }));
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => { try { main(raw); } catch { /* never break the user's turn */ } });
