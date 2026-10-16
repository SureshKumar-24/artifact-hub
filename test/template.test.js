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

test('the selection bar sits above the save bar, and small controls grow for touch', () => {
  assert.ok(TEMPLATE.indexOf('id="sel"') < TEMPLATE.indexOf('id="save"'), 'selection (transient) before unsaved changes (persistent)');
  assert.match(TEMPLATE, /id="sel-clear"[^>]*title="Clear the selection \(Esc\)"/);
  const touch = TEMPLATE.match(/@media \(hover: none\) \{\s*\.ctx button, \.dotbtn, \.swatch[^}]*\}/);
  assert.ok(touch, 'a hover-less block sizes the small controls to 36px');
  assert.match(touch[0], /36px/);
  assert.match(script(TEMPLATE), /'Text to copy'/, 'the copy fallback box is labelled for any text, not only links');
  assert.match(script(TEMPLATE), /function redraw\(\)/, 'bulk actions draw once');
});

test('has the gallery / list switch, the details panel and the shortcut sheet', () => {
  assert.match(TEMPLATE, /data-view="gallery"[^>]*aria-pressed=/);
  assert.match(TEMPLATE, /data-view="list"[^>]*aria-pressed=/);
  assert.match(TEMPLATE, /<dialog id="inspector" aria-labelledby="insp-title">/);
  for (const id of ['insp-close', 'insp-url', 'insp-open', 'insp-pin', 'insp-copy', 'insp-go']) assert.match(TEMPLATE, new RegExp(`id="${id}"`), id);
  assert.match(TEMPLATE, /id="insp-open"[^>]*target="_blank"[^>]*rel="noopener"/, 'opens the saved link in a new tab, safely');
  assert.match(TEMPLATE, /<dialog id="keys"/);
  assert.match(TEMPLATE, /id="sel"[^>]*hidden/, 'the selection bar starts hidden');
  for (const id of ['sel-move', 'sel-status', 'sel-copy', 'sel-clear', 'save-copy', 'save-drop']) assert.match(TEMPLATE, new RegExp(`id="${id}"`), id);
  assert.match(script(TEMPLATE), /\['o  then  1–9', 'Open the 1st to 9th page shown'\]/, 'quick open is in the shortcut sheet');
  assert.match(script(TEMPLATE), /\['x', 'Select or unselect the page/);
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
  for (const k of ['folder.v2', 'pins.v1', 'opened.v1', 'sort.v1', 'density.v1', 'theme.v1', 'view.v1', 'colors.v1', 'side.v1', 'hidden.v1', 'edits.v1', 'visit.v1', 'hint.v1']) assert.match(keys, new RegExp(`project-hub\\.${k.replace('.', '\\.')}`), k);
});

test('the first-visit hint shows once, never on an empty hub, and is only a toast', () => {
  const js = script(TEMPLATE);
  const hint = js.match(/first open in this browser[\s\S]*?\}, 1500\);/);
  assert.ok(hint, 'the hint block exists and waits 1.5s');
  assert.match(hint[0], /!getRaw\(K\.hint\) && Object\.keys\(byId\)\.length/, 'guarded by the key and by the hub having pages');
  assert.match(hint[0], /setRaw\(K\.hint, '1'\)/, 'the key is set when shown');
  assert.match(hint[0], /toast\(/, 'uses the toast');
  assert.doesNotMatch(hint[0], /showDialog|<dialog/, 'no new dialog');
  assert.match(hint[0], /Press \? for shortcuts/);
  assert.match(hint[0], /Tap ⓘ on any page/);
  assert.match(hint[0], /6000/, 'stays about 6s');
});

test('o then a digit: the first nine pages wear their digit, and the badges go on Esc, a digit or a timeout', () => {
  const js = script(TEMPLATE);
  assert.match(js, /function armQuick\(\)[\s\S]*?shown\.slice\(0, 9\)[\s\S]*?el\('span', 'qk', String\(i \+ 1\)\)/, 'one badge per page, 1 to 9');
  assert.match(js, /b\.setAttribute\('aria-hidden', 'true'\)/, 'badges are decoration');
  assert.match(js, /function clearQuick\(\) \{ quick = 0;[\s\S]*?each\('\.qk'/, 'clearing removes every badge');
  assert.match(js, /if \(quick\) \{ e\.preventDefault\(\); clearQuick\(\);/, 'Esc disarms');
  assert.match(js, /\/\^\[1-9\]\$\/\.test\(e\.key\)\) \{ e\.preventDefault\(\); var qr = shown\[\+e\.key - 1\]; clearQuick\(\);/, 'a digit disarms');
  assert.match(js, /quickTimer = setTimeout\(clearQuick, 2500\)/, 'a timeout disarms');
  assert.match(TEMPLATE, /\.qk \{ position: absolute;[^}]*pointer-events: none;/, 'badges are not interactive');
  assert.match(js, /\['o  then  1–9', 'Open the 1st to 9th page shown'\]/, 'listed in the shortcuts sheet');
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
  assert.strictEqual(typeof projects[1].note, 'string');
  assert.ok(projects[1].note.length <= 200, 'a project note is short');
  for (const p of projects) {
    assert.ok(p.id && p.name && Array.isArray(p.shelves));
    for (const [folder, rows] of p.shelves) {
      assert.strictEqual(typeof folder, 'string');
      for (const row of rows) {
        assert.ok(row.length === 4 || row.length === 5, 'title, id, description, date, and an optional fifth item');
        assert.ok(row.slice(0, 4).every((x) => typeof x === 'string'));
        if (row.length === 5) {
          const x = typeof row[4] === 'object' ? row[4] : { status: row[4] };
          if (x.status) assert.ok(['draft', 'review', 'final', 'archived'].includes(x.status), x.status);
          if (x.kind) assert.ok(['slides', 'design', 'designsystem', 'dashboard', 'doc', 'code', 'report', 'page'].includes(x.kind), x.kind);
          if (x.by) assert.strictEqual(typeof x.by, 'string');
        }
      }
    }
  }
});
