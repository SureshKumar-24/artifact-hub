// Checks the hub page template: the data markers the skills rely on, the artifact page
// contract, and that a real PROJECTS array dropped between the markers still runs.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const TEMPLATE = fs.readFileSync(path.join(__dirname, '..', 'skills', 'hub', 'template.html'), 'utf8');
const FIXTURE = fs.readFileSync(path.join(__dirname, 'fixtures', 'projects.txt'), 'utf8');
const DATA = /(\/\/ HUB-DATA-START[^\n]*\n)([\s\S]*?)(\n[ \t]*\/\/ HUB-DATA-END)/;

const script = (html) => html.match(/<script>([\s\S]*?)<\/script>/)[1];
const inject = (html, data) => html.replace(DATA, (m, start, old, end) => start + data.replace(/\n$/, '') + end);

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
  const hosts = [...TEMPLATE.matchAll(/(?:src|href)="(https?:\/\/[^/"]+)/g)].map((m) => m[1]);
  assert.deepStrictEqual([...new Set(hosts)].sort(), ['https://fonts.googleapis.com', 'https://fonts.gstatic.com']);
});

test('every storage access is guarded', () => {
  const uses = script(TEMPLATE).split('\n').filter((l) => /localStorage/.test(l));
  assert.ok(uses.length > 0);
  for (const line of uses) assert.match(line, /try \{/, line.trim());
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
