/* End-to-end UI smoke test in headless Google Chrome (no npm packages needed).
 * Run: node tests/ui.test.js          (needs google-chrome on PATH) */
'use strict';
const { spawn } = require('child_process');
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'index.html');
const PORT = 9300 + Math.floor(Math.random() * 400);
const PROFILE = path.join(__dirname, '.qa', 'ui-profile-' + process.pid);
const SHOTS = path.join(__dirname, '.qa');

/* ---------- minimal WebSocket client for the DevTools protocol ---------- */
function wsConnect(url) {
  return new Promise((resolve, reject) => {
    const u = new (require('url').URL)(url);
    const key = crypto.randomBytes(16).toString('base64');
    const req = http.request({ host: u.hostname, port: u.port, path: u.pathname, headers: { Connection: 'Upgrade', Upgrade: 'websocket', 'Sec-WebSocket-Key': key, 'Sec-WebSocket-Version': '13' } });
    req.on('upgrade', (res, socket) => {
      let buf = Buffer.alloc(0), frags = [];
      const handlers = [];
      socket.on('data', (d) => {
        buf = Buffer.concat([buf, d]);
        for (;;) {
          if (buf.length < 2) return;
          const fin = buf[0] & 0x80, op = buf[0] & 0x0f;
          let len = buf[1] & 0x7f, off = 2;
          if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
          else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); off = 10; }
          if (buf.length < off + len) return;
          const payload = buf.slice(off, off + len);
          buf = buf.slice(off + len);
          if (op === 9) { send(payload, 0xA); continue; }
          if (op === 8) { socket.end(); return; }
          frags.push(payload);
          if (fin) { const msg = Buffer.concat(frags).toString('utf8'); frags = []; handlers.forEach((hd) => hd(msg)); }
        }
      });
      function send(data, opcode) {
        const payload = Buffer.isBuffer(data) ? data : Buffer.from(data);
        const mask = crypto.randomBytes(4);
        let header;
        if (payload.length < 126) { header = Buffer.alloc(2); header[1] = 0x80 | payload.length; }
        else if (payload.length < 65536) { header = Buffer.alloc(4); header[1] = 0x80 | 126; header.writeUInt16BE(payload.length, 2); }
        else { header = Buffer.alloc(10); header[1] = 0x80 | 127; header.writeBigUInt64BE(BigInt(payload.length), 2); }
        header[0] = 0x80 | (opcode || 1);
        const masked = Buffer.alloc(payload.length);
        for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i % 4];
        socket.write(Buffer.concat([header, mask, masked]));
      }
      resolve({ send: (s) => send(s, 1), onMessage: (f) => handlers.push(f), close: () => socket.end() });
    });
    req.on('error', reject);
    req.end();
  });
}
const getJson = (p) => new Promise((resolve, reject) => {
  http.get({ host: '127.0.0.1', port: PORT, path: p }, (res) => { let s = ''; res.on('data', (d) => { s += d; }); res.on('end', () => { try { resolve(JSON.parse(s)); } catch (e) { reject(e); } }); }).on('error', reject);
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- test harness ---------- */
let pass = 0, fail = 0;
const failures = [];
async function check(name, fn) {
  try { await fn(); pass++; console.log('  ok   ' + name); } catch (e) { fail++; failures.push(name + ': ' + (e && e.message)); console.log('  FAIL ' + name + '\n       ' + (e && e.message)); }
}
const assert = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };

(async function main() {
  fs.mkdirSync(PROFILE, { recursive: true });
  const chrome = spawn('google-chrome', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + PROFILE, '--window-size=1400,1000', 'about:blank'], { stdio: 'ignore' });
  let targets;
  for (let i = 0; i < 50; i++) { try { targets = await getJson('/json'); if (targets.length) break; } catch (e) { /* not ready */ } await sleep(200); }
  const page = targets.find((t) => t.type === 'page');
  const ws = await wsConnect(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = {};
  ws.onMessage((m) => { const o = JSON.parse(m); if (o.id && pending[o.id]) { pending[o.id](o); delete pending[o.id]; } });
  const cmd = (method, params) => new Promise((resolve) => { const i = ++id; pending[i] = resolve; ws.send(JSON.stringify({ id: i, method, params: params || {} })); });
  const evaluate = async (expr) => {
    const r = await cmd('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) throw new Error('page error: ' + JSON.stringify(r.result.exceptionDetails.exception && r.result.exceptionDetails.exception.description));
    return r.result && r.result.result ? r.result.result.value : undefined;
  };
  const go = async (hash) => { await evaluate('location.hash = ' + JSON.stringify(hash) + '; true'); await sleep(350); };
  const errors = async () => evaluate('(window.__srweErrors || []).join("\\n")');
  const shot = async (name) => {
    if (!process.env.UI_SHOTS) return; // set UI_SHOTS=1 to keep screenshots in tests/.qa
    const r = await cmd('Page.captureScreenshot', { format: 'png' });
    fs.mkdirSync(SHOTS, { recursive: true });
    fs.writeFileSync(path.join(SHOTS, name + '.png'), Buffer.from(r.result.data, 'base64'));
  };
  const typeIn = (line) => evaluate(`(function(){ const i = document.querySelector('.term-in input'); i.focus(); i.value = ${JSON.stringify(line)};
      i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); return true; })()`);
  const termText = () => evaluate("document.querySelector('.term-out') ? document.querySelector('.term-out').innerText : ''");
  /* paste text into a lab's device box the way a user would (input event) */
  const paste = (devId, text) => evaluate(`(function(){ document.querySelector('.term-tab[id$="-${devId}"]').click();
      const ta = document.querySelector('textarea[id$="-${devId}"]'); ta.value = ${JSON.stringify(text)}; ta.dispatchEvent(new Event('input', { bubbles: true })); return true; })()`);

  await cmd('Page.enable');
  await cmd('Runtime.enable');
  await cmd('Page.navigate', { url: URL + '#home' });
  await sleep(1500);

  const nMods = await evaluate('SRWE.App.modules().length');
  await check('dashboard renders every module and no errors', async () => {
    assert((await evaluate("document.querySelectorAll('.modcard').length")) === nMods, 'module cards');
    assert(!(await errors()), await errors());
    await shot('ui-dashboard');
  });

  /* Packet Tracer output for a solved lab, from the test fixtures */
  const { load } = require('./load');
  const FIX = require('./labs.fixtures');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const NODE = load([...html.matchAll(/<script src="(js\/data\/[^"]+)"/g)].map((m) => m[1]));
  const labDef = (id) => NODE.labs.find((l) => l.id === id);

  await check('lab page shows topology, cabling, start config and tasks', async () => {
    await go('lab-m1-basic-switch');
    assert(await evaluate("!!document.querySelector('.topo svg text')"), 'no topology');
    assert(await evaluate("document.querySelectorAll('.codebox').length >= 1"), 'no starting config block');
    assert(await evaluate("document.querySelectorAll('.task').length") === labDef('m1-basic-switch').tasks.length, 'task count');
    assert((await evaluate("document.querySelector('.need-box').innerText")).includes('show running-config'), 'need box does not ask for show running-config');
    await shot('ui-lab-empty');
  });

  await check('lab: pasting Packet Tracer output turns every task green', async () => {
    const lab = labDef('m1-basic-switch');
    const pasted = FIX[lab.id].solved(lab);
    for (const [d, text] of Object.entries(pasted)) await paste(d, text);
    await sleep(900);
    const done = await evaluate("document.querySelectorAll('.task.done').length + '/' + document.querySelectorAll('.task').length");
    assert(done === lab.tasks.length + '/' + lab.tasks.length, 'tasks done ' + done + '\n' + (await evaluate("[...document.querySelectorAll('.task:not(.done)')].map(t => t.innerText).join('\\n')")));
    assert(await evaluate("!document.querySelector('.done-banner').hidden"), 'done banner hidden');
    assert(await evaluate("document.querySelector('.term-tab[id$=\"-S1\"] .led').className.includes('on')"), 'S1 tab LED not green');
    await shot('ui-lab-done');
  });

  await check('lab: pasted output survives a reload', async () => {
    await sleep(600);
    await cmd('Page.reload');
    await sleep(1500);
    const n = labDef('m1-basic-switch').tasks.length;
    assert(await evaluate("document.querySelectorAll('.task.done').length") === n, 'after reload');
  });

  await check('lab: answer tasks and wrong configuration give feedback', async () => {
    await go('lab-m3-troubleshoot');
    const lab = labDef('m3-troubleshoot');
    const start = FIX[lab.id].start(lab);
    for (const [d, text] of Object.entries(start)) await paste(d, text);
    await sleep(900);
    const bad = await evaluate("[...document.querySelectorAll('.tmsg.bad')].map(e => e.textContent).join(' | ')");
    assert(/VLAN 1, expected VLAN 10/.test(bad), 'no diagnostic for Fa0/6: ' + bad);
    await evaluate("(function(){ const i = document.getElementById('ans-m3-troubleshoot-0'); i.value = '1'; i.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); return true; })()");
    await sleep(200);
    assert(await evaluate("document.querySelector('.task[data-task=\"0\"]').classList.contains('done')"), 'answer not accepted');
    await shot('ui-lab-troubleshoot');
  });

  await check('drill: all steps accepted, including abbreviations', async () => {
    await go('drill-d-dtp');
    for (const l of ['conf t', 'int fa0/1', 'sw mo dyn des', 'end', 'sh dtp int fa0/1', 'conf t', 'int f0/1', 'switchport mode trunk', 'sw nonegotiate', 'end']) await typeIn(l);
    assert(await evaluate("!document.querySelector('.done-banner').hidden"), 'drill not completed:\n' + (await termText()).slice(-500));
  });

  await check('drill: a wrong command is rejected and the prompt stays', async () => {
    await go('drill-d-vlan');
    await typeIn('configure terminal');
    await typeIn('vlan 30');
    assert((await termText()).includes('Right command, wrong value'), 'no rejection note');
    await typeIn('exit');
    assert((await termText()).includes('not the command this step asks for'), 'exit was not rejected');
    assert(await evaluate("document.querySelector('.term-in .p').textContent") === 'S1(config)#', 'prompt changed');
    await shot('ui-drill');
  });

  await check('quiz: answering every question shows a result and records the attempt', async () => {
    await go('quiz-2.2');
    for (let i = 0; i < 20; i++) {
      const state = await evaluate(`(function(){
        const p = document.querySelector('.quiz .btn.primary');
        if (!p) return 'done';
        if (/See results|Next question/.test(p.textContent)) { p.click(); return 'next'; }
        const opt = document.querySelector('.opt:not([disabled])');
        if (opt) { opt.click(); const q = document.querySelectorAll('.opt'); if (/Choose (\\d)/.test(document.querySelector('.qcard').innerText)) { const n = Number(/Choose (\\d)/.exec(document.querySelector('.qcard').innerText)[1]); for (let k = 1; k < n; k++) q[k].click(); } }
        const sel = document.querySelectorAll('.qcard select'); sel.forEach((s) => { s.selectedIndex = 1; s.dispatchEvent(new Event('change')); });
        const cli = document.querySelector('.cli-q input'); if (cli) { cli.value = 'show version'; cli.dispatchEvent(new Event('input')); }
        if (!p.disabled) p.click();
        return 'checked';
      })()`);
      if (state === 'done') break;
      await sleep(60);
      if (await evaluate("!!document.querySelector('.result-hero')")) break;
    }
    assert(await evaluate("!!document.querySelector('.result-hero')"), 'no result screen');
    await sleep(400); // progress is written to localStorage after a short debounce
    assert(await evaluate("JSON.parse(localStorage.getItem('srwe-study-lab.v1')).quiz.attempts.some(a => a.scope === 'topic:2.2')"), 'attempt not saved');
  });

  await check('every topic quiz can be completed (all question types render and grade)', async () => {
    const topics = await evaluate('SRWE.App.topics().map(t => t.id)');
    let answered = 0;
    for (const t of topics) {
      await go('quiz-' + t);
      for (let i = 0; i < 60; i++) {
        if (await evaluate("!!document.querySelector('.result-hero')")) break;
        const st = await evaluate(`(function(){
          const p = document.querySelector('.quiz .btn.primary');
          if (!p) return 'none';
          if (/See results|Next question/.test(p.textContent)) { p.click(); return 'next'; }
          const card = document.querySelector('.qcard');
          const m = /Choose (\\d)/.exec(card.innerText);
          const opts = [...document.querySelectorAll('.opt:not([disabled])')];
          opts.slice(0, m ? Number(m[1]) : 1).forEach((o) => o.click());
          document.querySelectorAll('.qcard select').forEach((s) => { s.selectedIndex = 1; s.dispatchEvent(new Event('change')); });
          const cli = document.querySelector('.cli-q input'); if (cli) { cli.value = 'show version'; cli.dispatchEvent(new Event('input')); }
          if (!p.disabled) { p.click(); return 'checked'; }
          return 'stuck';
        })()`);
        if (st === 'checked') answered++;
        if (st === 'stuck' || st === 'none') throw new Error('quiz ' + t + ' stuck at step ' + i + ' (' + st + '): ' + (await evaluate("(document.querySelector('.qcard')||{}).innerText")));
      }
      assert(await evaluate("!!document.querySelector('.result-hero')"), 'quiz ' + t + ' did not finish');
    }
    const total = await evaluate('SRWE.quiz.length');
    assert(answered >= total, 'only ' + answered + ' of ' + total + ' questions answered');
    const e = await errors();
    assert(!e, e);
  });

  await check('practice exams list and start', async () => {
    await go('exam');
    assert(await evaluate("document.querySelectorAll('.list-item').length") === 6, 'exam list');
    await go('exam-m1-4-go');
    assert(await evaluate("!!document.querySelector('.qcard') && /Question 1 of 40/.test(document.querySelector('.qhead').innerText)"), 'exam did not start');
  });

  await check('flashcards: reveal and rate with the keyboard', async () => {
    await go('cards-1.1');
    const before = await evaluate("document.querySelector('.fcard .kv').textContent");
    await evaluate("document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true })); true");
    assert(await evaluate("!!document.querySelector('.fcard .back')"), 'answer not revealed');
    await evaluate("document.dispatchEvent(new KeyboardEvent('keydown', { key: '3', bubbles: true })); true");
    const after = await evaluate("document.querySelector('.fcard .kv').textContent");
    assert(before !== after, 'queue did not advance: ' + before + ' -> ' + after);
  });

  await check('understand widgets respond (MAC learning, DTP, 802.1Q, duplex)', async () => {
    await go('t-2.1-understand');
    await evaluate("[...document.querySelectorAll('.widget button')].find(b => /Send frame/.test(b.textContent)).click(); true");
    assert((await evaluate("document.querySelector('.widget table').innerText")).includes('00aa.aaaa.aaaa'), 'MAC not learned');
    await go('t-3.5-understand');
    await evaluate("(function(){ const s = document.getElementById('dtp-a'); s.value = 'dynamic desirable'; s.dispatchEvent(new Event('change')); return true; })()");
    assert((await evaluate("document.querySelector('.widget .feedback').innerText")).includes('Result: Trunk'), 'DTP result wrong');
    await go('t-3.2-understand');
    await evaluate("(function(){ const i = document.getElementById('dq-vid'); i.value = '100'; i.dispatchEvent(new Event('input')); return true; })()");
    assert((await evaluate("document.querySelector('.widget').innerText")).includes('81 00 00 64'), 'tag bytes wrong');
    await go('t-1.2-understand');
    await evaluate("(function(){ const s = document.getElementById('dx-a-d'); s.value = 'full'; s.dispatchEvent(new Event('change')); const t = document.getElementById('dx-a-s'); t.value = '100'; t.dispatchEvent(new Event('change')); return true; })()");
    assert((await evaluate("[...document.querySelectorAll('.widget')].map(w => w.innerText).join(' ')")).includes('Duplex mismatch'), 'duplex mismatch not shown');
  });

  await check('module 5–16 widgets respond (STP, EtherChannel, HSRP, longest match, floating route)', async () => {
    const pick = (id, v) => evaluate('(function(){ const s = document.getElementById(' + JSON.stringify(id) + '); s.value = ' + JSON.stringify(v) + '; s.dispatchEvent(new Event("change")); return true; })()');
    const text = () => evaluate("[...document.querySelectorAll('.widget')].map(w => w.innerText).join(' | ')");
    await go('t-5.2-understand');
    assert((await text()).includes('S2 wins'), 'default STP root should be S2');
    await pick('stp-S1', '24576');
    assert((await text()).includes('S1 wins'), 'S1 should become root');
    await shot('ui-widget-stp');
    await go('t-6.1-understand');
    await pick('ec-a', 'auto'); await pick('ec-b', 'auto');
    assert((await text()).includes('No channel'), 'auto/auto must not form a channel');
    await go('t-9.2-understand');
    await evaluate("[...document.querySelectorAll('.widget button')].find(b => /Fail R1/.test(b.textContent)).click(); true");
    assert(/R2\s*Active/.test(await text()), 'R2 should be active after R1 fails');
    await go('t-14.1-understand');
    await evaluate("(function(){ const i = document.getElementById('lm-dst'); i.value = '8.8.8.8'; i.dispatchEvent(new Event('input')); return true; })()");
    assert((await text()).includes('Forward via 209.165.200.226'), 'default route not chosen');
    await go('t-15.4-understand');
    await pick('af-p', 'OSPF');
    assert((await text()).includes('lower AD'), 'floating AD below OSPF should be flagged');
    const e = await errors();
    assert(!e, e);
  });

  await check('every topic page renders all four stages without errors', async () => {
    const topics = await evaluate('SRWE.App.topics().map(t => t.id)');
    for (const t of topics) for (const st of ['read', 'understand', 'practice', 'apply']) {
      await evaluate('location.hash = ' + JSON.stringify('t-' + t + '-' + st) + '; true');
      await sleep(40);
      if (st === 'understand') {
        const [want, got] = await evaluate('[SRWE.App.topic(' + JSON.stringify(t) + ').understand.widgets.length, document.querySelectorAll(".widget").length]');
        assert(want === got, 'topic ' + t + ': ' + got + ' of ' + want + ' widgets rendered');
      }
    }
    const e = await errors();
    assert(!e, e);
  });

  await check('every Packet Tracer lab page renders', async () => {
    const ids = await evaluate('SRWE.labs.map(l => l.id)');
    for (const id of ids) {
      await evaluate('location.hash = ' + JSON.stringify('lab-' + id) + '; true');
      await sleep(60);
      assert(await evaluate("!!document.querySelector('.topo svg') && document.querySelectorAll('.task').length > 0"), 'lab ' + id + ' did not render');
    }
    const e = await errors();
    assert(!e, e);
  });

  await check('topic stages: mark as read lights the Read LED', async () => {
    await go('t-1.2-read');
    await evaluate("[...document.querySelectorAll('.article-foot .btn')].find(b => /Mark as read/.test(b.textContent)).click(); true");
    await go('m1');
    assert(await evaluate("JSON.parse(localStorage.getItem('srwe-study-lab.v1')).read['1.2'] > 0"), 'read not stored');
  });

  await check('theme toggle and mobile navigation', async () => {
    await go('home');
    await evaluate("[...document.querySelectorAll('.rail-foot button')][0].click(); true");
    assert(await evaluate("document.documentElement.getAttribute('data-theme')") === 'dark', 'theme not dark');
    await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    await go('t-3.4-read');
    await sleep(300);
    assert(await evaluate("getComputedStyle(document.querySelector('.topbar')).display") === 'flex', 'topbar hidden on mobile');
    assert(await evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), 'horizontal page scroll on mobile: ' + await evaluate('document.documentElement.scrollWidth'));
    await shot('ui-mobile-read');
    await evaluate("document.getElementById('menu-btn').click(); true");
    assert(await evaluate("document.getElementById('rail').classList.contains('open')"), 'rail did not open');
    await shot('ui-mobile-nav');
    await evaluate("document.querySelector('.scrim').click(); true");
    await go('lab-m4-roas');
    await sleep(300);
    assert(await evaluate("document.documentElement.scrollWidth <= window.innerWidth + 1"), 'lab page scrolls sideways on mobile');
    await shot('ui-mobile-lab');
    await cmd('Emulation.clearDeviceMetricsOverride');
  });

  await check('no runtime errors were logged', async () => { const e = await errors(); assert(!e, e); });

  ws.close();
  chrome.kill();
  await sleep(300);
  fs.rmSync(PROFILE, { recursive: true, force: true });
  try { if (!fs.readdirSync(SHOTS).length) fs.rmdirSync(SHOTS); } catch (e) { /* keep */ }
  console.log('\nUI tests: ' + pass + ' passed, ' + fail + ' failed');
  if (fail) process.exitCode = 1;
})().catch((e) => { console.error(e); process.exitCode = 1; });
