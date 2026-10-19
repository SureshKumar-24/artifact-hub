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
  assert.doesNotMatch(TEMPLATE, /<iframe|<img\s|fetch\((?!location\.href)|XMLHttpRequest/, 'the page embeds nothing and fetches only its own source');
});

test('the selection bar sits above the save bar, and small controls grow for touch', () => {
  assert.ok(TEMPLATE.indexOf('id="sel"') < TEMPLATE.indexOf('id="save"'), 'selection (transient) before unsaved changes (persistent)');
  assert.match(TEMPLATE, /id="sel-clear"[^>]*title="Clear the selection \(Esc\)"/);
  const touch = TEMPLATE.match(/@media \(hover: none\) \{\s*\.ctx button, \.dotbtn, \.swatch[^}]*\}/);
  assert.ok(touch, 'a hover-less block sizes the small controls to 40px');
  assert.match(touch[0], /40px/);
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
  const renderSel = TEMPLATE.match(/function renderSel\(\) \{[\s\S]*?\n  \}/);
  assert.ok(renderSel && !/option/.test(renderSel[0]), 'the selection bar buttons are menu buttons: renderSel never fills them with <option>s');
  assert.match(TEMPLATE, /All ' \+ s\.total \+ ' in ' \+ s\.label/, 'a crowded project in All pages ends with a line to its folder');
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

test('a bare day reads as a local day, and Claude Code page ids link under /code/artifact/', () => {
  assert.match(TEMPLATE, /\^\\s\*\(\\d\{4\}\)-\(\\d\{2\}\)-\(\\d\{2\}\)\\s\*\$\/\.exec\(s\)/, 'parseDate handles YYYY-MM-DD itself');
  assert.match(TEMPLATE, /new Date\(\+iso\[1\], \+iso\[2\] - 1, \+iso\[3\]\)/, 'as a local date, not UTC midnight');
  assert.match(TEMPLATE, /function urlOf\(id\)/);
  assert.strictEqual((TEMPLATE.match(/\bA \+ /g) || []).length, 0, 'every link goes through urlOf');
});

test('the command palette: a dialog, stable action ids, a guarded recents key, and no innerHTML', () => {
  const js = script(TEMPLATE);
  assert.match(TEMPLATE, /<dialog id="palette" aria-labelledby="pal-label">/, 'the palette is a dialog like the others');
  assert.match(TEMPLATE, /<input id="pal-q"[^>]*role="combobox"/, 'one input, a combobox');
  assert.match(js, /palette: 'project-hub\.palette\.v1'/, 'recent actions have their own key in K');
  assert.match(js, /function palRemember\(id\) \{[^\n]*var ids = getJSON\(K\.palette/, 'recents go through the guarded helpers');
  const ids = [...js.matchAll(/\{ id: '([a-z.]+)', label:/g)].map((m) => m[1]);
  assert.ok(ids.length >= 30, 'at least thirty actions');
  assert.strictEqual(new Set(ids).size, ids.length, 'action ids are unique');
  for (const id of ['view.gallery', 'view.list', 'page.pin', 'page.details', 'page.copy', 'page.prompt', 'page.move', 'folder.copy', 'edits.save', 'export.md', 'export.json', 'help']) assert.ok(ids.includes(id), id);
  assert.match(js, /if \(mod && !e\.altKey && \(e\.key === 'k' \|\| e\.key === 'K'\)\) \{ e\.preventDefault\(\); palOpen\(\); return; \}/, '⌘K opens it');
  assert.match(js, /raw\.charAt\(0\) === '>' \? 'act' : raw\.charAt\(0\) === '#' \? 'dir'/, '> and # narrow the search');
  assert.match(js, /\[MOD \+ 'K', 'Command palette: pages, folders and actions'\]/, 'listed first in the ? sheet');
  const palBlock = js.slice(js.indexOf('// ---- Command palette'), js.indexOf('// sticky group headers'));
  assert.doesNotMatch(palBlock, /innerHTML/, 'results are built as DOM');
});

test('duplicates and untouched pages: one map, two chips, a label, and Esc clears the filter', () => {
  const js = script(TEMPLATE);
  assert.match(js, /function computeDups\(\) \{[\s\S]*?seen\[p\.ft\] = \(seen\[p\.ft\] \|\| 0\) \+ 1/, 'one pass over the folded titles');
  assert.match(js, /function isStale\(p\) \{ return p\.status !== 'archived' && age\(p\) >= STALE/, 'archived pages are not stale');
  assert.match(js, /\(!dupFilter \|\| p\.dup\) && \(!staleFilter \|\| isStale\(p\)\)/, 'both are filters in visible()');
  assert.match(js, /el\('span', 'st s-dup', 'Duplicate\?'\)/, 'the row label');
  assert.match(js, /else if \(\(dupFilter \|\| staleFilter\) && !inSearch\) \{ e\.preventDefault\(\); dupFilter = false; staleFilter = false; render\(\); \}/, 'Esc clears them');
  assert.match(js, /computeDups\(\); applyLook\(false\)/, 'computed before the first draw');
});

test('exports and the project message: JSON built from data, the project text capped at 60, every link through urlOf', () => {
  const js = script(TEMPLATE);
  assert.match(js, /function hubJSON\(\) \{[\s\S]*?hub: document\.title, exported: new Date\(\)\.toISOString\(\), projects:/);
  assert.match(js, /JSON\.stringify\(hubJSON\(\), null, 2\)/, 'pretty, two spaces');
  assert.match(TEMPLATE, /<button class="lnk" type="button" id="export-json"/);
  assert.match(js, /function projectText\(node\)[\s\S]*?ps\.slice\(0, 60\)[\s\S]*?'…and ' \+ \(ps\.length - 60\) \+ ' more in the hub\.'/);
  assert.match(js, /read it with the Artifact tool and publish to the same URL instead of making a new page:/);
  assert.strictEqual((js.match(/\bA \+ /g) || []).length, 0, 'every link goes through urlOf');
  assert.match(js, /function hint\(label, key\) \{ return POINTER && key \? label \+ ' · ' \+ key : label; \}/, 'key hints only on pointer devices');
});

test('the page can save itself: a serializer, a guarded runtime, one marker pair, and every error code handled', () => {
  const js = script(TEMPLATE);
  assert.match(js, /function dataText\(\)/, 'the data block is rebuilt from what the page holds');
  assert.match(js, /function rowText\(p\)/);
  assert.match(js, /window\.hubData = dataText/, 'readable from the console');
  assert.match(js, /function saveToHub\(\)/);
  assert.match(js, /fetch\(location\.href, \{ cache: 'no-store' \}\)/, 'reads its own served source, nothing else');
  assert.match(js, /src\.split\(MK \+ 'START'\)\.length !== 2/, 'exactly one marker pair or no save');
  for (const code of ['conflict', 'not_writer', 'not_granted', 'not_declared', 'capability_disabled', 'rate_limited']) assert.match(js, new RegExp(`code === '${code}'`), code);
  assert.match(js, /hubWriteDenied = true; done\(\); renderSaveBar\(\)/, 'a read-only view hides the button for good');
  assert.match(js, /function claudeUse\(name\) \{ try \{ if \(typeof claude !== 'undefined'/, 'the runtime is never assumed');
  assert.strictEqual((js.replace(/\/\/[^\n]*/g, '').match(/\bclaude\.use\(/g) || []).length, 1, 'claude.use is called in one guarded place only');
  assert.match(js, /pn\.color0 = COLORS\.indexOf\(p\.color\) >= 0 \? p\.color : ''/, 'the data\'s colour is kept apart from the browser preference');
  assert.match(js, /edits\[pn\.key\]\.color !== undefined \? edits\[pn\.key\]\.color : pn\.color0/, 'a swatch picked on the page is written by Save to hub');
  assert.match(js, /set the colour of project/, 'and named in the message for Claude');
  assert.match(js, /if \(pc\) head \+= ', color: '/);
  assert.match(TEMPLATE, /id="save-hub" hidden/, 'Save to hub starts hidden and lights up with the runtime');
  assert.match(TEMPLATE, /id="dl-wrap" hidden/, 'downloads start hidden too');
  assert.match(js, /downloader\.save\(\{ filename: name, data: text \}\)/);
  for (const id of ['edits.save', 'edits.copy', 'export.md.download', 'export.json.download']) assert.match(js, new RegExp(`id: '${id}'`), id);
});

test('no dead CSS, no native selects, and every stored key goes through the guarded helpers', () => {
  const css = TEMPLATE.slice(TEMPLATE.indexOf('<style>'), TEMPLATE.indexOf('</style>'));
  const rest = TEMPLATE.slice(TEMPLATE.indexOf('</style>'));
  const dynamic = /^(c|s|k)-/; // project colours, statuses and kinds are built as 'c-' + name and so on
  const dead = [...new Set([...css.matchAll(/\.([a-zA-Z_][\w-]*)/g)].map((m) => m[1]))]
    .filter((c) => !dynamic.test(c) && !new RegExp(`(?<![\\w-])${c}(?![\\w-])`).test(rest));
  assert.deepStrictEqual(dead, [], 'every class the CSS styles appears in the markup or the script');
  assert.doesNotMatch(TEMPLATE, /<select\b|\.save select/, 'menus are .field buttons, never native selects');
  const js = TEMPLATE.slice(TEMPLATE.lastIndexOf('<script>'));
  const direct = js.match(/(?:local|session)Storage\.[a-zA-Z]+/g) || [];
  assert.deepStrictEqual([...new Set(direct)].sort(), ['localStorage.getItem', 'localStorage.setItem'], 'storage is touched only inside getRaw / setRaw');
  assert.strictEqual((js.match(/localStorage\./g) || []).length, 2, 'one read and one write site, both guarded');
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
          if (x.was) { assert.ok(Array.isArray(x.was) && x.was.length <= 10, 'earlier titles are a short list'); assert.ok(x.was.every((t) => typeof t === 'string' && t && t !== row[0]), 'earlier titles are strings and never the current one'); }
        }
      }
    }
  }
  assert.ok(projects[0].shelves[0][1].some((row) => row[4] && Array.isArray(row[4].was)), 'the fixture has a renamed page');
});

test('earlier titles: parsed from the row, searched between title and description, shown only on a hit, serialized back, exported', () => {
  const js = script(TEMPLATE);
  assert.match(js, /was: Array\.isArray\(x\.was\) \? x\.was\.map\([\s\S]*?\.slice\(0, 10\) : \[\]/, 'at most ten, strings only');
  assert.match(js, /p\.fa = p\.was\.map\(fold\)\.join\(' \\u0001 '\)/, 'folded like the title, kept apart');
  const chain = js.slice(js.indexOf('function match(p, words, whole)'), js.indexOf('function paint('));
  const at = (s) => chain.indexOf(s);
  assert.ok(at('p.ft.indexOf(w)) >= 0) { hit.score += 60') < at('wordAt(p.fa, w) >= 0) { hit.score += 50') && at('hit.score += 50') < at('wordAt(p.fd, w)) >= 0) { hit.score += 45'), 'a whole word in an earlier title ranks under the title and above the description');
  assert.ok(at('p.fa.indexOf(w) >= 0) { hit.score += 35') > at('hit.score += 40') && at('hit.score += 35') < at('hit.score += 30'), 'inside an earlier title ranks under a folder word and above inside the description');
  assert.match(chain, /p\.fa && p\.fa\.indexOf\(whole\) >= 0 \? 50 : 0/, 'the whole phrase in an earlier title counts too');
  assert.match(js, /ws = el\('span', 'st s-was', 'was ' \+ p\.was\[0\]\)[^\n]*ws\.hidden = true/, 'the label starts hidden');
  assert.match(js, /if \(r\._ws\) r\._ws\.hidden = !\(h && h\.a\)/, 'and shows only when the search matched an earlier name');
  assert.match(TEMPLATE, /<dt id="insp-was-dt" hidden>Formerly<\/dt><dd id="insp-was" hidden><\/dd>/);
  assert.match(js, /\$\('insp-was'\)\.textContent = p\.was\.join\(', '\)/);
  assert.match(js, /if \(p\.was\.length\) o\.was = p\.was;/, 'Save to hub writes it back');
  assert.match(js, /k === 'was' \? '\[' \+ o\.was\.map\(q1\)\.join\(', '\) \+ '\]'/, 'as a quoted list');
  assert.match(js, /if \(p\.was\.length\) r\.formerly = p\.was\.slice\(\)/, 'the JSON export names them');
  // the serializer's output for the fixture row parses back to the same list
  const page = inject(TEMPLATE, FIXTURE);
  const projects = vm.runInNewContext(page.match(DATA)[2] + '\nPROJECTS;');
  const row = projects[0].shelves[0][1].find((r) => r[0] === 'Tablevo Admin Dashboard');
  assert.deepStrictEqual(Array.from(row[4].was), ['Restaurant Dashboard', 'Shop Ops Board']);
  const q1 = (v) => "'" + String(v == null ? '' : v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n') + "'";
  const text = "[" + [q1(row[0]), q1(row[1]), q1(row[2]), q1(row[3])].join(', ') + ", { status: 'review', was: [" + row[4].was.map(q1).join(', ') + "] }]";
  assert.strictEqual(JSON.stringify(vm.runInNewContext(text)), JSON.stringify(row), 'the row as Save to hub writes it reads back the same (compared as JSON: the two come from different vm realms)');
});

test('audit 4: dates in month-first order, projects told apart by id, gone pages marked, the fold button desktop-only', () => {
  const js = script(TEMPLATE);
  // the date parser, run on its own: 'Oct 15' is this year's 15 October, never the year 2001 Date.parse gives it
  const ctx = {};
  vm.runInNewContext(js.slice(js.indexOf('var MONTHS'), js.indexOf('function age(')) + '\nthis.parseDate = parseDate; this.today = today;', ctx);
  const y = new Date(ctx.today).getFullYear();
  const day = (t) => { const d = new Date(t); return [d.getFullYear() === y || d.getFullYear() === y - 1, d.getMonth(), d.getDate()]; };
  assert.deepStrictEqual(day(ctx.parseDate('Oct 15')), [true, 9, 15]);
  assert.deepStrictEqual(day(ctx.parseDate('15 Oct')), [true, 9, 15]);
  assert.deepStrictEqual(day(ctx.parseDate('October 15th, 2026')), [true, 9, 15]);
  assert.strictEqual(ctx.parseDate('Oct 15'), ctx.parseDate('15 Oct'), 'both orders mean the same day');
  assert.strictEqual(new Date(ctx.parseDate('2026-10-01')).getDate(), 1, 'a bare day is a local day');
  assert.strictEqual(ctx.parseDate(''), 0); assert.strictEqual(ctx.parseDate('today'), 0); assert.strictEqual(ctx.parseDate('not a date'), 0);
  assert.ok(ctx.parseDate('2026-10-14T09:30:00.000Z') > 0, 'an ISO stamp still parses');
  // two projects with the same name stay two projects (matched by id), so Save to hub loses neither
  assert.match(js, /if \(key && byKey\[key\] && byKey\[key\]\.up === parent\) return byKey\[key\]/);
  assert.match(js, /if \(!key\) for \(var i = 0; i < parent\.kids\.length; i\+\+\) if \(parent\.kids\[i\]\.name\.toLowerCase\(\)/, 'folders inside a project still merge by name');
  // a row marked gone by the link check shows it, is searchable, and the details panel explains it
  assert.match(js, /if \(p\.gone\) \{ var gn = el\('span', 'st s-gone', 'Gone\?'\)/);
  assert.match(js, /\(p\.gone \? ' gone' : ''\)/);
  assert.match(js, /\$\('insp-gone'\)\.hidden = !p\.gone/);
  assert.match(TEMPLATE, /id="insp-gone" hidden/);
  assert.match(TEMPLATE, /\.s-gone \{/);
  // the sidebar fold button: hidden by a rule that outranks .ib, shown again only from 1024px
  const css = TEMPLATE.slice(TEMPLATE.indexOf('<style>'), TEMPLATE.indexOf('</style>'));
  const hide = css.indexOf('.ib.fold { display: none;'), show = css.indexOf('.ib.fold { display: inline-grid; }'), ib = css.indexOf('.ib { width: 36px');
  assert.ok(hide > 0 && show > 0, 'both rules exist');
  assert.ok(hide < show, 'the base rule comes first, the desktop media rule after it, so the later one wins there');
  assert.ok(show < ib, 'and .ib alone, later in the sheet, cannot outrank .ib.fold');
  assert.doesNotMatch(css, /\n\.fold \{/, 'no bare .fold rule that .ib would override');
  // menus survive a phone keyboard (height-only resize); bulk actions hand focus to the list; palette actions are ranked
  assert.match(js, /if \(window\.innerWidth !== lastW\) \{ lastW = window\.innerWidth; closeMenu\(false\); \}/);
  assert.strictEqual((js.match(/list\.focus\(\{ preventScroll: true \}\); \}\); \}\);/g) || []).length, 2, 'both selection-bar menus');
  assert.match(js, /if \(fl\.indexOf\(w\) === 0\) score \+= 4; else if \(wordAt\(fl, w\) >= 0\) score \+= 3; else if \(f\.indexOf\(w\) >= 0\) score \+= 2; else if \(fuzzy\(fl, w\)\) score \+= 1; else return null;/);
  assert.strictEqual((js.match(/^\s+check: '/gm) || []).length, 1, 'one check icon, not two');
});
