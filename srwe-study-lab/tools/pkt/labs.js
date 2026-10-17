/* Prints the Packet Tracer labs (js/data/labs*.js) as JSON for build.py.
 * Every LabKit check is tagged with what built it (meta: ['ping', 'PC1', '172.17.99.11'] and so on),
 * so build.py can turn tasks into Packet Tracer assessment items. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');
const ctx = { console, Date, Math, JSON, Set, Map, BigInt, setTimeout, clearTimeout };
ctx.window = ctx;
vm.createContext(ctx);
const run = (f) => vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
['js/app/cmd.js', 'js/pt/check.js', 'js/data/labkit.js'].forEach(run);
const K = ctx.SRWE.LabKit;
const metaOf = (a) => (typeof a === 'function' ? a.meta || null : a instanceof RegExp ? String(a) : a);
for (const name of Object.keys(K)) {
  const build = K[name];
  if (typeof build !== 'function' || name === 'intf') continue;
  K[name] = (...args) => {
    const check = build(...args);
    if (typeof check === 'function') check.meta = [name, ...args.map(metaOf)];
    return check;
  };
}
['js/data/labs1.js', 'js/data/labs2.js', 'js/data/labs3.js'].forEach(run);

const strip = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
process.stdout.write(JSON.stringify(ctx.SRWE.labs.map((l) => ({
  id: l.id, module: l.module, title: l.title, goal: l.goal, scenario: strip(l.scenario), level: l.level, minutes: l.minutes,
  devices: l.devices, links: l.links, addressing: l.addressing || [], start: l.start || {}, ptNotes: (l.ptNotes || []).map(strip),
  solution: l.solution || {},
  tasks: l.tasks.map((t) => ({ part: t.part, text: strip(t.text), meta: typeof t.check === 'function' ? t.check.meta || null : null, kind: t.check ? 'check' : t.answer ? 'answer' : 'self' })),
}))));
