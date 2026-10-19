/* Content integrity tests. Run: node tests/data.test.js
 * Loads the same data scripts as index.html (in the same order) and checks every lesson, question,
 * flashcard, drill and Packet Tracer lab. Each lab is graded against Packet Tracer-style output of its
 * solved state (tests/labs.fixtures.js): every task must pass; with the starting state some must not. */
'use strict';
const fs = require('fs');
const path = require('path');
const { load, ROOT } = require('./load');
const FIX = require('./labs.fixtures');

const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const DATA = [...html.matchAll(/<script src="(js\/data\/[^"]+)"/g)].map((m) => m[1]);
const SRWE = load(DATA);
const PT = SRWE.PT;

let pass = 0, fail = 0;
const failures = [];
function test(name, fn) {
  try { fn(); pass++; } catch (e) { fail++; failures.push('FAIL ' + name + '\n   ' + String(e && e.message || e).split('\n').join('\n   ')); }
}
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };

const topics = {};
for (const m of SRWE.content.modules) for (const t of m.topics) topics[t.id] = t;
const modules = SRWE.content.modules.map((m) => m.num).sort((a, b) => a - b);

test('every script in index.html exists and parses', () => {
  const vm = require('vm');
  for (const m of html.matchAll(/<script src="([^"]+)"/g)) {
    const f = path.join(ROOT, m[1]);
    assert(fs.existsSync(f), 'missing ' + m[1]);
    try { new vm.Script(fs.readFileSync(f, 'utf8'), { filename: m[1] }); } catch (e) { throw new Error(m[1] + ': ' + e.message); }
  }
});

test('modules are numbered 1..n and every topic has read + understand content', () => {
  modules.forEach((n, i) => assert(n === i + 1, 'module numbers: ' + modules.join(',')));
  for (const t of Object.values(topics)) {
    assert(t.read && t.read.length > 500, t.id + ' read too short');
    assert(t.slides && t.objective, t.id + ' slides/objective');
    const u = t.understand;
    assert(u && u.big && u.why && u.analogy && u.keys.length >= 3 && u.traps.length >= 2 && u.explain.length >= 2, t.id + ' understand incomplete');
    assert(Array.isArray(u.widgets), t.id + ' widgets');
  }
});

test('lesson HTML is balanced', () => {
  for (const t of Object.values(topics)) {
    for (const tag of ['table', 'pre', 'ul', 'ol', 'div', 'p', 'h3', 'h4', 'li', 'tr', 'td', 'th', 'code', 'b']) {
      const open = (t.read.match(new RegExp('<' + tag + '[\\s>]', 'g')) || []).length;
      const close = (t.read.match(new RegExp('</' + tag + '>', 'g')) || []).length;
      assert(open === close, t.id + ': <' + tag + '> open ' + open + ' close ' + close);
    }
  }
});

test('quiz bank structure', () => {
  const ids = new Set();
  for (const q of SRWE.quiz) {
    assert(!ids.has(q.id), 'duplicate id ' + q.id);
    ids.add(q.id);
    assert(topics[q.t], q.id + ' unknown topic');
    assert(q.q && q.ex, q.id + ' needs question and explanation');
    if (q.type === 'mc') assert(q.o.length >= 3 && new Set(q.o).size === q.o.length, q.id + ' options');
    if (q.type === 'multi') assert(q.n >= 2 && q.n < q.o.length && new Set(q.o).size === q.o.length, q.id + ' multi n');
    if (q.type === 'order') assert(q.items.length >= 3, q.id + ' order items');
    if (q.type === 'match') assert(q.pairs.length >= 3 && new Set(q.pairs.map((p) => p[1])).size === q.pairs.length, q.id + ' match pairs');
    if (q.type === 'tf') assert(typeof q.ans === 'boolean', q.id + ' tf');
    if (q.type === 'cli') assert(q.prompt && q.answer, q.id + ' cli needs prompt and answer');
  }
  for (const t of Object.keys(topics)) {
    const qs = SRWE.quiz.filter((q) => q.t === t);
    assert(qs.length >= 8, 'topic ' + t + ' has only ' + qs.length + ' questions');
    assert(qs.filter((q) => q.type === 'mc' || q.type === 'tf').length >= 3, 'topic ' + t + ' needs 3+ mc/tf questions for the quick check');
  }
});

test('every CLI question accepts its model answers and rejects a wrong command', () => {
  for (const q of SRWE.quiz.filter((x) => x.type === 'cli')) {
    for (const a of [q.answer].concat(q.accept || [])) assert(SRWE.Cmd.check(q, a).ok, q.id + ' model answer "' + a + '" rejected');
    assert(!SRWE.Cmd.check(q, 'show version').ok, q.id + ' accepted "show version"');
  }
});

test('CLI answers accept IOS abbreviations', () => {
  const byAnswer = (a) => SRWE.quiz.find((q) => q.type === 'cli' && q.answer === a);
  const cases = [
    ['switchport trunk native vlan 99', 'sw tr nat vl 99'],
    ['switchport mode access', 'sw mo acc'],
    ['show ip interface brief | include up', 'sh ip int br | i up'],
    ['interface g0/0/1.20', 'int gigabitEthernet 0/0/1.20'],
    ['crypto key generate rsa general-keys modulus 1024', 'crypto key gen rsa mod 1024'],
  ];
  for (const [answer, abbr] of cases) {
    const q = byAnswer(answer);
    assert(q, 'no question with answer ' + answer);
    assert(SRWE.Cmd.check(q, abbr).ok, '"' + abbr + '" should be accepted for ' + answer);
  }
});

test('flashcards reference real topics', () => {
  const ids = new Set();
  for (const c of SRWE.cards) {
    assert(!ids.has(c.id), 'duplicate card ' + c.id); ids.add(c.id);
    assert(topics[c.t] && c.f && c.b, 'card ' + c.id);
  }
  for (const t of Object.keys(topics)) assert(SRWE.cards.filter((c) => c.t === t).length >= 4, 'topic ' + t + ' needs at least 4 cards');
});

test('every drill step has a prompt and accepts its model answer', () => {
  const ids = new Set();
  for (const d of SRWE.drills) {
    assert(!ids.has(d.id), 'duplicate drill ' + d.id); ids.add(d.id);
    assert(topics[d.t], d.id + ' topic');
    d.steps.forEach((st, i) => {
      assert(st.prompt && /[#>]$/.test(st.prompt), d.id + ' step ' + (i + 1) + ' prompt');
      assert(SRWE.Cmd.check(st, st.answer).ok, d.id + ' step ' + (i + 1) + ' "' + st.answer + '" rejected');
    });
  }
});

test('every widget named in a lesson exists', () => {
  const src = ['js/app/widgets.js', 'js/app/widgets2.js'].map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
  const have = new Set([...src.matchAll(/\bW\.(\w+) = function/g)].map((m) => m[1]));
  for (const t of Object.values(topics)) for (const w of t.understand.widgets) assert(have.has(w), t.id + ' uses unknown widget ' + w);
});

test('glossary and command reference point at real topics', () => {
  for (const g of SRWE.reference) assert(topics[g.t], 'reference group ' + g.title + ' topic ' + g.t);
  for (const g of SRWE.glossary) assert(topics[g[2]], 'glossary ' + g[0] + ' topic ' + g[2]);
});

/* ---------------- labs ---------------- */
test('lab definitions are complete', () => {
  const ids = new Set();
  for (const lab of SRWE.labs) {
    assert(!ids.has(lab.id), 'duplicate lab ' + lab.id); ids.add(lab.id);
    assert(modules.includes(lab.module), lab.id + ' module');
    for (const t of lab.topics || []) assert(topics[t], lab.id + ' topic ' + t);
    assert(lab.title && lab.goal && lab.level && lab.minutes, lab.id + ' header');
    const devs = new Set(lab.devices.map((d) => d.id));
    for (const l of lab.links) assert(devs.has(l[0]) && devs.has(l[2]), lab.id + ' link ' + l.join(' '));
    for (const d of Object.keys(lab.collect || {})) assert(devs.has(d), lab.id + ' collect device ' + d);
    for (const d of Object.keys(lab.start || {})) assert(devs.has(d), lab.id + ' start device ' + d);
    for (const d of Object.keys(lab.solution || {})) assert(devs.has(d), lab.id + ' solution device ' + d);
    lab.tasks.forEach((t, i) => assert(t.text && (typeof t.check === 'function' || t.answer !== undefined || t.self), lab.id + ' task ' + (i + 1)));
  }
  for (const m of modules) assert(SRWE.labs.some((l) => l.module === m), 'module ' + m + ' has no lab');
});

function answersFor(lab, pasted) {
  const h = PT.helpers(lab, pasted);
  const answers = {}, ticks = {};
  lab.tasks.forEach((t, i) => {
    if (t.self) ticks[i] = true;
    if (t.answer !== undefined) {
      try { const a = typeof t.answer === 'function' ? t.answer(h) : t.answer; answers[i] = a[0]; } catch (e) { answers[i] = undefined; }
    }
  });
  return { answers, ticks };
}

test('every lab has fixtures', () => { for (const lab of SRWE.labs) assert(FIX[lab.id], 'no fixture for ' + lab.id); });
test('every lab has a ready-made Packet Tracer network and activity (python3 tools/pkt/build.py)', () => {
  const files = fs.readdirSync(path.join(ROOT, 'pt'));
  for (const lab of SRWE.labs) for (const ext of ['.pkt', '.pka']) assert(files.includes(lab.id + ext), 'no pt/' + lab.id + ext);
  for (const f of files) assert(SRWE.labs.some((l) => l.id + '.pkt' === f || l.id + '.pka' === f), 'pt/' + f + ' belongs to no lab');
});

for (const lab of SRWE.labs) {
  if (!FIX[lab.id]) continue;
  test('lab ' + lab.id + ': solved output passes every task', () => {
    const pasted = FIX[lab.id].solved(lab);
    const { answers, ticks } = answersFor(lab, pasted);
    const res = PT.grade(lab, { pasted, answers, ticks });
    const bad = res.filter((r) => r.status !== 'pass').map((r) => '#' + (r.i + 1) + ' [' + r.status + '] ' + r.text.replace(/<[^>]+>/g, '') + (r.msg ? '  -> ' + r.msg : '') + (r.need ? '  -> needs ' + r.need.what + ' from ' + r.need.dev : '') + (r.error ? '\n' + r.error.split('\n').slice(0, 3).join('\n') : ''));
    assert(!bad.length, bad.join('\n'));
    // everything the checks read is in the collect list, so the learner is told to paste it
    for (const [d, text] of Object.entries(pasted)) assert(lab.collect[d], lab.id + ': fixture pastes output for ' + d + ' but collect has no entry for it');
  });
  if (FIX[lab.id].start) test('lab ' + lab.id + ': starting output does not pass', () => {
    const pasted = FIX[lab.id].start(lab);
    const res = PT.grade(lab, { pasted, answers: {}, ticks: {} });
    const checked = res.filter((r, i) => typeof lab.tasks[i].check === 'function');
    assert(checked.some((r) => r.status !== 'pass'), 'all checked tasks already pass at the start');
    const n = checked.filter((r) => r.status === 'pass').length;
    assert(n <= checked.length * 0.6, n + ' of ' + checked.length + ' checked tasks pass at the start');
  });
}

/* ---------- instructor's activities (js/data/teacher-labs.js, imported by tools/pkt/teacher.py) ---------- */
const TL = SRWE.teacherLabs || [];
const APP = load(DATA.concat(['js/app/core.js', 'js/app/teacher.js'])).App;
test('instructor activities: every .pka in the folder is imported and every entry points at a file there', () => {
  const dir = path.join(ROOT, SRWE.teacherDir);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.pka'));
  assert(TL.length === files.length, files.length + ' .pka files but ' + TL.length + ' imported: run python3 tools/pkt/teacher.py');
  for (const tl of TL) assert(files.includes(tl.file), tl.id + ': no file ' + tl.file);
  assert(new Set(TL.map((tl) => tl.id)).size === TL.length, 'two files with the same activity number');
});
const TAGS = ['h3', 'h4', 'h5', 'p', 'span', 'b', 'i', 'code', 'br', 'pre', 'ul', 'li', 'div', 'table', 'tr', 'th', 'td'];
for (const tl of TL) {
  test('instructor activity ' + tl.id + ': instructions, questions, topology and topics', () => {
    assert(tl.module === Number(tl.id.split('.')[0]) && modules.includes(tl.module), 'module ' + tl.module);
    assert(tl.title && tl.html.length > 1000, 'title or instructions missing');
    for (const m of tl.html.matchAll(/<\/?([a-z0-9]+)([^>]*)>/g)) {
      assert(TAGS.includes(m[1]), 'unexpected tag <' + m[1] + '>');
      assert(!/\son\w+\s*=|javascript:|style=/i.test(m[2]), 'unexpected attribute in ' + m[0]);
    }
    for (const t of ['ul', 'li', 'pre', 'div', 'table', 'tr', 'p']) {
      const open = (tl.html.match(new RegExp('<' + t + '[ >]', 'g')) || []).length, close = (tl.html.match(new RegExp('</' + t + '>', 'g')) || []).length;
      assert(open === close, '<' + t + '> opened ' + open + ' times, closed ' + close);
    }
    assert((tl.html.match(/class="tl-q /g) || []).length === tl.questions, 'question count');
    assert(!/Type your answers here|Open configuration window|End of document/i.test(tl.html), 'Packet Tracer window markers left in the instructions');
    assert(tl.devices.length, 'no devices');
    const names = new Set(tl.devices.map((d) => d.id));
    assert(names.size === tl.devices.length, 'two devices with the same name');
    for (const d of tl.devices) assert(Number.isFinite(d.x) && Number.isFinite(d.y) && d.model, d.id + ': position or model');
    for (const l of tl.links) assert(names.has(l[0]) && names.has(l[2]) && l[1] && l[3], 'cable to an unknown device or port: ' + l.join(' '));
    const ts = APP.teacherTopics(tl);
    assert(ts.length && ts.every((t) => topics[t]), 'no course topics: ' + ts.join(', '));
    assert(APP.teacherRelated(tl).length, 'no study lab on the same topics');
  });
}

console.log('\nData tests: ' + pass + ' passed, ' + fail + ' failed  (' + Object.keys(topics).length + ' topics, ' + SRWE.quiz.length + ' questions, ' + SRWE.cards.length + ' cards, ' + SRWE.drills.length + ' drills, ' + SRWE.labs.length + ' labs, ' + TL.length + ' instructor activities)');
if (failures.length) { console.log('\n' + failures.join('\n\n')); process.exitCode = 1; }
