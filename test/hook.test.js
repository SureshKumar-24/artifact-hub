// Runs the hook the way Claude Code does: one JSON event on stdin, a fresh home folder each time.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const HOOK = path.join(__dirname, '..', 'hooks', 'on-artifact.js');
const A = 'https://claude.ai/artifact/';

function home() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ah-'));
  const store = path.join(dir, '.claude', 'artifact-hub');
  return {
    dir, store,
    run(event) {
      const r = spawnSync(process.execPath, [HOOK], {
        input: typeof event === 'string' ? event : JSON.stringify({ tool_name: 'Artifact', ...event }),
        env: { ...process.env, HOME: dir, USERPROFILE: dir }, encoding: 'utf8',
      });
      assert.strictEqual(r.status, 0);
      return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.additionalContext : '';
    },
    pages() { try { return JSON.parse(fs.readFileSync(path.join(store, 'pages.json'), 'utf8')); } catch { return []; } },
    hub(url) { fs.mkdirSync(store, { recursive: true }); fs.writeFileSync(path.join(store, 'hub.json'), JSON.stringify({ hubUrl: url, projects: [{ id: 's', name: 'Shop' }] })); },
  };
}
const published = (id) => `Published /x.html at ${A}${id} (Version 1)`;

test('first publish saves the link, title and project folder, and offers setup once', () => {
  const h = home();
  const repo = path.join(h.dir, 'my-shop'); fs.mkdirSync(path.join(repo, '.git'), { recursive: true }); fs.mkdirSync(path.join(repo, 'docs'));
  const file = path.join(repo, 'docs', 'p.html'); fs.writeFileSync(file, '<title>Launch checklist</title>');
  const out = h.run({ cwd: path.join(repo, 'docs'), tool_input: { file_path: file }, tool_response: published('AAA111') });
  assert.match(out, /artifact-hub:setup/);
  assert.deepStrictEqual(h.pages().map((p) => [p.url, p.title, p.folder]), [[`${A}AAA111`, 'Launch checklist', 'my-shop']]);
  assert.strictEqual(h.run({ tool_input: { file_path: file }, tool_response: published('BBB222') }), '', 'no second offer the same day');
  assert.strictEqual(h.pages().length, 2);
});

test('republishing the same page updates its entry instead of adding one', () => {
  const h = home();
  h.run({ tool_input: { title: 'One' }, tool_response: published('AAA111') });
  h.run({ tool_input: { title: 'One, renamed' }, tool_response: published('AAA111').replace('Version 1', 'Version 2') });
  assert.deepStrictEqual(h.pages().map((p) => p.title), ['One, renamed']);
});

test('with a hub, a publish asks Claude to file the page; the hub itself is ignored', () => {
  const h = home(); h.hub(`${A}HUB000`);
  assert.match(h.run({ tool_input: {}, tool_response: published('AAA111') }), /Recording one page.*Shop/);
  assert.strictEqual(h.run({ tool_input: { url: `${A}HUB000` }, tool_response: published('HUB000') }), '');
  assert.deepStrictEqual(h.pages().map((p) => p.url), [`${A}AAA111`]);
});

test('deleting a page marks it and asks for its row to be removed; publishing again clears the mark', () => {
  const h = home(); h.hub(`${A}HUB000`);
  h.run({ tool_input: {}, tool_response: published('AAA111') });
  assert.match(h.run({ tool_input: { action: 'delete', url: `${A}AAA111` }, tool_response: 'Deleted.' }), /remove its row/);
  assert.ok(h.pages()[0].deleted);
  h.run({ tool_input: {}, tool_response: published('AAA111') });
  assert.strictEqual(h.pages()[0].deleted, undefined);
});

test('a refused delete, an asset delete and an unknown page change nothing', () => {
  const h = home(); h.hub(`${A}HUB000`);
  h.run({ tool_input: {}, tool_response: published('AAA111') });
  assert.strictEqual(h.run({ tool_input: { action: 'delete', url: `${A}AAA111` }, tool_response: 'The user declined.' }), '');
  assert.strictEqual(h.run({ tool_input: { action: 'delete', url: `${A}AAA111`, path: 'a'.repeat(32) }, tool_response: 'Deleted.' }), '');
  assert.strictEqual(h.run({ tool_input: { action: 'delete', url: `${A}ZZZ999` }, tool_response: 'Deleted.' }), '');
  assert.strictEqual(h.pages()[0].deleted, undefined);
});

test('reads, lists, asset uploads, failed publishes, other tools and junk are ignored', () => {
  const h = home();
  for (const e of [
    { tool_input: { action: 'list' }, tool_response: `${A}AAA111` },
    { tool_input: { action: 'read', url: `${A}AAA111` }, tool_response: `${A}AAA111` },
    { tool_input: { asset: true, url: `${A}AAA111` }, tool_response: published('AAA111') },
    { tool_input: {}, tool_response: 'Publish refused.' },
    { tool_name: 'ArtifactComments', tool_input: {}, tool_response: published('AAA111') },
    'not json',
  ]) assert.strictEqual(h.run(e), '');
  assert.strictEqual(fs.existsSync(path.join(h.store, 'pages.json')), false);
});

test('a new Claude Doc is saved and filed like a page; edits to an existing doc are ignored', () => {
  const h = home(); h.hub(`${A}HUB000`);
  const docs = 'mcp__claude_ai_Claude_Docs__batch';
  const out = h.run({ tool_name: docs, tool_input: { container: { kind: 'project', create: { name: 'Quarter plan', doc: {} } }, batch: [] }, tool_response: `Created. Open it at ${A}DOC001 .` });
  assert.match(out, /document was just created.*Recording one page/);
  assert.deepStrictEqual(h.pages().map((p) => [p.url, p.title, p.type]), [[`${A}DOC001`, 'Quarter plan', 'doc']]);
  assert.strictEqual(h.run({ tool_name: docs, tool_input: { container: { kind: 'project', id: 'DOC001' }, batch: [] }, tool_response: `Updated ${A}DOC001` }), '');
  assert.strictEqual(h.pages().length, 1);
});

test('titles come out as plain text: entities decoded, whitespace collapsed, from a file or the input', () => {
  const h = home();
  const file = path.join(h.dir, 'p.html'); fs.writeFileSync(file, '<title>\n  Fish &amp; Chips &#8212; Q4 &quot;plan&quot;   &#x1F600;\n</title>');
  h.run({ tool_input: { file_path: file }, tool_response: published('AAA111') });
  h.run({ tool_input: { title: '  Two   words &lt;b&gt; ' }, tool_response: published('BBB222') });
  const empty = path.join(h.dir, 'launch-plan.html'); fs.writeFileSync(empty, '<title> &nbsp; </title>');
  h.run({ tool_input: { file_path: empty }, tool_response: published('CCC333') });
  assert.deepStrictEqual(h.pages().map((p) => p.title), ['Fish & Chips — Q4 "plan" 😀', 'Two words <b>', 'launch-plan']);
});

test('a result given as an object, a nested cwd with a trailing separator, and several links in one result', () => {
  const h = home();
  const repo = path.join(h.dir, 'My Shop'); fs.mkdirSync(path.join(repo, '.git'), { recursive: true }); fs.mkdirSync(path.join(repo, 'src', 'deep'), { recursive: true });
  const out = h.run({ cwd: path.join(repo, 'src', 'deep', path.sep), tool_input: { title: 'Nested' }, tool_response: { content: [{ type: 'text', text: `Created ${A}DOC001 (viewer ${A}VIEW02)` }] } });
  assert.match(out, /artifact-hub:setup/, 'no hub yet, so setup is offered once');
  assert.deepStrictEqual(h.pages().map((p) => [p.url, p.folder]), [[`${A}DOC001`, 'My Shop']]);
});

test('a page made from an artifact type keeps the type id', () => {
  const h = home();
  h.run({ tool_input: { type_url: `${A}TYPE01`, title: 'Q4 deck' }, tool_response: published('AAA111') });
  h.run({ tool_input: { title: 'Plain page' }, tool_response: published('BBB222') });
  assert.deepStrictEqual(h.pages().map((p) => [p.title, p.typeId]), [['Q4 deck', 'TYPE01'], ['Plain page', undefined]]);
});

test('a new page with the title of a known page is marked as replacing it, and Claude is told', () => {
  const h = home(); h.hub(`${A}HUB000`);
  h.run({ tool_input: { title: 'Pricing page' }, tool_response: published('AAA111') });
  const out = h.run({ tool_input: { title: 'Pricing page' }, tool_response: published('BBB222') });
  assert.match(out, new RegExp(`same title as ${A}AAA111`));
  const pages = h.pages();
  assert.strictEqual(pages.length, 2, 'the old entry is kept');
  assert.strictEqual(pages[0].replacedBy, `${A}BBB222`);
  assert.strictEqual(pages[1].replacedBy, undefined);
  assert.strictEqual(h.run({ tool_input: { title: 'Pricing page' }, tool_response: published('BBB222') }).includes('same title'), false, 'a republish of the new page is not a replacement');
});

const STOP = path.join(__dirname, '..', 'hooks', 'on-stop.js');
function stop(h, lastMessage) {
  const r = spawnSync(process.execPath, [STOP], { input: JSON.stringify({ hook_event_name: 'Stop', last_assistant_message: lastMessage }), env: { ...process.env, HOME: h.dir, USERPROFILE: h.dir }, encoding: 'utf8' });
  assert.strictEqual(r.status, 0);
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.additionalContext : '';
}

test('at the end of a turn, a page that was published but not filed gets one reminder', () => {
  const h = home(); h.hub(`${A}HUB000`);
  h.run({ tool_input: { title: 'One' }, tool_response: published('AAA111') });
  assert.match(stop(h, 'Done, the file is written.'), /AAA111.*was not recorded/);
  assert.strictEqual(stop(h, 'Done, the file is written.'), '', 'only once');
  h.run({ tool_input: { title: 'Two' }, tool_response: published('BBB222') });
  assert.strictEqual(stop(h, 'Published, and the hub was updated under Shop.'), '', 'Claude said it filed it');
  h.run({ tool_input: { title: 'Three' }, tool_response: published('CCC333') });
  h.run({ tool_input: { url: `${A}HUB000` }, tool_response: published('HUB000') }); // the hub's republish clears it
  assert.strictEqual(stop(h, 'Done.'), '');
  assert.strictEqual(stop(home(), 'Done.'), '', 'nothing pending, nothing said');
});

const SESSION = path.join(__dirname, '..', 'hooks', 'on-session.js');
function session(h, cwd) {
  const r = spawnSync(process.execPath, [SESSION], { input: JSON.stringify({ hook_event_name: 'SessionStart', source: 'startup', cwd }), env: { ...process.env, HOME: h.dir, USERPROFILE: h.dir }, encoding: 'utf8' });
  assert.strictEqual(r.status, 0);
  return r.stdout ? JSON.parse(r.stdout).hookSpecificOutput.additionalContext : '';
}

test('at session start, the last pages published from this repository are mentioned, nothing else', () => {
  const h = home();
  const repo = path.join(h.dir, 'my-shop'); fs.mkdirSync(path.join(repo, '.git'), { recursive: true }); fs.mkdirSync(path.join(repo, 'src'));
  const other = path.join(h.dir, 'other'); fs.mkdirSync(path.join(other, '.git'), { recursive: true });
  assert.strictEqual(session(h, repo), '', 'no hub yet');
  h.hub(`${A}HUB000`);
  assert.strictEqual(session(h, repo), '', 'nothing published');
  h.run({ cwd: repo, tool_input: { title: 'Old plan' }, tool_response: published('AAA111') });
  h.run({ cwd: repo, tool_input: { title: 'Launch checklist' }, tool_response: published('BBB222') });
  h.run({ cwd: repo, tool_input: { title: 'Pricing page' }, tool_response: published('CCC333') });
  h.run({ cwd: other, tool_input: { title: 'Elsewhere' }, tool_response: published('DDD444') });
  const out = session(h, path.join(repo, 'src'));
  assert.match(out, /"Pricing page" \(.*CCC333\) and "Launch checklist" \(.*BBB222\)/);
  assert.doesNotMatch(out, /AAA111|DDD444/);
  assert.strictEqual(session(h, h.dir), '', 'a folder with no pages');
});

test('publishes and filings are logged, and the log keeps the 500 latest lines', () => {
  const h = home(); h.hub(`${A}HUB000`);
  const logFile = path.join(h.store, 'activity.log');
  h.run({ tool_input: { title: 'One' }, tool_response: published('AAA111') });
  h.run({ tool_input: { url: `${A}HUB000` }, tool_response: published('HUB000') });
  const lines = fs.readFileSync(logFile, 'utf8').trim().split('\n');
  assert.strictEqual(lines.length, 2);
  assert.match(lines[0], new RegExp(`^\\d{4}-\\d{2}-\\d{2}T.* published ${A}AAA111$`));
  assert.match(lines[1], /^\d{4}-\d{2}-\d{2}T.* filed$/);
  fs.writeFileSync(logFile, Array.from({ length: 600 }, (_, i) => `2026-01-01T00:00:00.000Z old ${i}`).join('\n') + '\n');
  h.run({ tool_input: { title: 'Two' }, tool_response: published('BBB222') });
  const after = fs.readFileSync(logFile, 'utf8').trim().split('\n');
  assert.strictEqual(after.length, 500);
  assert.match(after[0], /old 101$/);
  assert.match(after[499], /published .*BBB222$/);
});

test('a damaged list is replaced, not crashed on', () => {
  const h = home(); fs.mkdirSync(h.store, { recursive: true }); fs.writeFileSync(path.join(h.store, 'pages.json'), '{broken');
  h.run({ tool_input: {}, tool_response: published('AAA111') });
  assert.strictEqual(h.pages().length, 1);
});
