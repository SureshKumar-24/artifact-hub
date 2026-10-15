// Checks the hub page template: the data markers the skills rely on, the artifact page
// contract, the controls the page promises (views, details, shortcuts), and that a real
// PROJECTS array dropped between the markers still runs.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const TEMPLATE = fs.readFileSync(path.join(__dirname, '..', 'skills', 'hub', 'template.html'), 'utf8');
const FIXTURE = fs.readFileSync(path.join(__dirname, 'fixtures', 'projects.txt'), 'utf8');
const DATA = /(\/\/ HUB-DATA-START[^\n]*\n)([\s\S]*?)(\n[ \t]*\/\/ HUB-DATA-END)/;

const script = (html) => html.match(/<script>([\s\S]*?)<\/script>/)[1];
const inject = (html, data) => html.replace(DATA, (_m, start, _old, end) => start + data.replace(/\n$/, '') + end);

test('exactly one HUB-DATA-START / HUB-DATA-END pair, with the PROJECTS array between them', () => {
  assert.strictEqual((TEMPLATE.match(/HUB-DATA-START/g) || []).length, 1);
  assert.strictEqual((TEMPLATE.match(/HUB-DATA-END/g) || []).length, 1);
  const between = TEMPLATE.match(DATA);
  assert.ok(between, 'START comes before END');
  assert.match(between[2], /var PROJECTS = \[/);
  assert.match(TEMPLATE, /var A = 'https:\/\/claude\.ai\/artifact\/';/);
});

test('follows the artifact page contract', () => {
  assert.ok(TEMPLATE.startsWith('<title>Project Hub</title>'));
  assert.doesNotMatch(TEMPLATE, /<!doctype|<(html|head|body)[\s>]/i);
  assert.match(TEMPLATE, /<meta name="claude:viewport-fit-sides" content="cover">/);
  assert.match(TEMPLATE, /id="tree"/, 'the hub skill detects the folder layout by this id');
  assert.match(TEMPLATE, /data-hub-template="3"/, 'the hub skill detects this page design by this attribute');
  const hosts = [...TEMPLATE.matchAll(/(?:src|href)="(https?:\/\/[^/"]+)/g)].map((m) => m[1]);
  assert.deepStrictEqual([...new Set(hosts)].sort(), ['https://fonts.googleapis.com', 'https://fonts.gstatic.com']);
  assert.doesNotMatch(TEMPLATE, /<iframe|<img\s|fetch\(|XMLHttpRequest/, 'the page embeds and fetches nothing');
});

test('has the gallery / list switch, the details panel and the shortcut sheet', () => {
  assert.match(TEMPLATE, /data-view="gallery"[^>]*aria-pressed=/);
  assert.match(TEMPLATE, /data-view="list"[^>]*aria-pressed=/);
  assert.match(TEMPLATE, /<dialog id="inspector" aria-labelledby="insp-title">/);
  for (const id of ['insp-close', 'insp-url', 'insp-open', 'insp-pin', 'insp-copy', 'insp-go']) assert.match(TEMPLATE, new RegExp(`id="${id}"`), id);
  assert.match(TEMPLATE, /id="insp-open"[^>]*target="_blank"[^>]*rel="noopener"/, 'opens the saved link in a new tab, safely');
  assert.match(TEMPLATE, /<dialog id="keys"/);
  assert.match(TEMPLATE, /id="q"[^>]*role="combobox"/);
  assert.match(TEMPLATE, /id="list" role="listbox" tabindex="0"/);
});

test('page text never goes through innerHTML', () => {
  // innerHTML is used only to draw the fixed icon paths; titles and descriptions are built as DOM
  const uses = script(TEMPLATE).split('\n').filter((l) => /innerHTML/.test(l) && !/^\s*\/\//.test(l));
  assert.strictEqual(uses.length, 2);
  for (const line of uses) assert.match(line, /(ICONS|KIND_ICON)\[/, line.trim());
});

test('every storage access is guarded, and the view has its own key', () => {
  const uses = script(TEMPLATE).split('\n').filter((l) => /localStorage/.test(l));
  assert.ok(uses.length > 0);
  for (const line of uses) assert.match(line, /try \{/, line.trim());
  const keys = script(TEMPLATE).match(/var K = \{[\s\S]*?\};/)[0];
  for (const k of ['folder.v2', 'pins.v1', 'opened.v1', 'sort.v1', 'density.v1', 'theme.v1', 'view.v1']) assert.match(keys, new RegExp(`project-hub\\.${k.replace('.', '\\.')}`), k);
});

test('the empty template script parses', () => {
  assert.doesNotThrow(() => new vm.Script(script(TEMPLATE)));
});

test('a real PROJECTS array injected between the markers still parses and evaluates', () => {
  const page = inject(TEMPLATE, FIXTURE);
  assert.strictEqual((page.match(/HUB-DATA-START/g) || []).length, 1);
  assert.doesNotThrow(() => new vm.Script(script(page)));
  const projects = vm.runInNewContext(page.match(DATA)[2] + '\nPROJECTS;');
  assert.strictEqual(projects.length, 2);
  assert.strictEqual(projects[1].color, 'indigo');
  for (const p of projects) {
    assert.ok(p.id && p.name && Array.isArray(p.shelves));
    for (const [folder, rows] of p.shelves) {
      assert.strictEqual(typeof folder, 'string');
      for (const row of rows) {
        assert.strictEqual(row.length, 4);
        assert.ok(row.every((x) => typeof x === 'string'));
      }
    }
  }
});
