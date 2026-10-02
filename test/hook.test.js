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

test('a damaged list is replaced, not crashed on', () => {
  const h = home(); fs.mkdirSync(h.store, { recursive: true }); fs.writeFileSync(path.join(h.store, 'pages.json'), '{broken');
  h.run({ tool_input: {}, tool_response: published('AAA111') });
  assert.strictEqual(h.pages().length, 1);
});
