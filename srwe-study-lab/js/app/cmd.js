/* SRWE Study Lab — typed IOS command checker (no simulator).
 * Compares what the learner typed with a model answer the way IOS reads a line:
 * keywords may be abbreviated ("sh ip int br", "sw mo tr"), interface names may be
 * short or long ("g0/0/1", "gig 0/0/1", "GigabitEthernet0/0/1"), values must match. */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};

  /* Interface types: canonical name and the shortest prefix IOS accepts in practice. */
  const IF_TYPES = [
    ['fastethernet', 1], ['gigabitethernet', 1], ['tengigabitethernet', 2], ['serial', 1], ['loopback', 1],
    ['vlan', 2], ['port-channel', 2], ['ethernet', 1], ['tunnel', 2],
  ];
  /* Keywords that contain digits but are still keywords (abbreviable). */
  const KW_DIGITS = new Set(['dot1q', 'ipv6', 'md5', 'sha1', 'p2p', 'ospfv3', 'ospf', 'rsa', 'aes', 'des', '3des', 'version']);
  /* Words after which the next token(s) are free values, compared exactly (case-insensitive). */
  const VALUE_AFTER = new Set(['hostname', 'name', 'password', 'secret', 'username', 'domain-name', 'community']);
  const TEXT_AFTER = new Set(['description', 'motd', 'login', 'exec']); // rest of the line is free text (banner motd / login / exec)
  /* Single-letter abbreviations that are unambiguous where they are normally used. */
  const ONE_LETTER = new Set(['terminal', 'include', 'exclude', 'begin', 'section']);

  function ifType(word) {
    const w = word.toLowerCase();
    if (!w) return null;
    for (const [name, min] of IF_TYPES) if (w.length >= min && name.startsWith(w)) return name;
    // common two-letter forms that are not plain prefixes
    if (w === 'po') return 'port-channel';
    if (w === 'te') return 'tengigabitethernet';
    return null;
  }
  const IF_NUM = /^\d+(\/\d+)*(\.\d+)?(-\d+)?$/;
  const IF_WORDS = new Set(['interface', 'interfaces', 'range']);

  /* "g0/0/1" or "gig0/0/1.20" in one token */
  function oneTokenIf(tok) {
    const m = /^([a-z][a-z-]*?)(\d+(?:\/\d+)*(?:\.\d+)?(?:-\d+)?)$/i.exec(tok);
    if (!m) return null;
    const t = ifType(m[1]);
    if (!t) return null;
    if (!/\//.test(m[2]) && !['loopback', 'vlan', 'port-channel', 'tunnel'].includes(t)) return null;
    return t + m[2];
  }

  function tokenize(cmd) {
    let s = String(cmd || '').replace(/\s+/g, ' ').trim();
    // ranges: "fa0/1 - 4", "fa0/1 -4", "fa0/1- 4" -> "fa0/1-4"
    s = s.replace(/(\d)\s*-\s*(\d)/g, '$1-$2');
    const raw = s ? s.split(' ') : [];
    const out = [];
    for (let i = 0; i < raw.length; i++) {
      const tok = raw[i];
      const prev = out.length ? out[out.length - 1].low : '';
      const prevIsIfWord = IF_WORDS.has(prev) || ['int', 'inter', 'interf', 'interfa', 'interfac'].includes(prev);
      const one = oneTokenIf(tok);
      if (one) { out.push({ raw: tok, low: one, kind: 'if' }); continue; }
      const t = ifType(tok);
      const next = raw[i + 1];
      if (t && next && IF_NUM.test(next) && (/\//.test(next) || prevIsIfWord)) {
        out.push({ raw: tok + ' ' + next, low: t + next, kind: 'if' });
        i++;
        continue;
      }
      out.push({ raw: tok, low: tok.toLowerCase(), kind: 'w' });
    }
    return out;
  }

  /* split off an output filter: "show x | include y" */
  function splitFilter(cmd) {
    const m = /^(.*?)\s\|\s?(.*)$/.exec(String(cmd || ''));
    return m ? [m[1], m[2]] : [String(cmd || ''), null];
  }

  function expandV6(a) {
    a = a.toLowerCase();
    let len = '';
    const k = a.indexOf('/');
    if (k >= 0) { len = a.slice(k); a = a.slice(0, k); }
    if (!/^[0-9a-f:]+$/.test(a) || a.indexOf(':') < 0) return null;
    const halves = a.split('::');
    if (halves.length > 2) return null;
    const head = halves[0] ? halves[0].split(':') : [];
    const tail = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
    const fill = halves.length === 2 ? 8 - head.length - tail.length : 0;
    const parts = head.concat(new Array(Math.max(0, fill)).fill('0'), tail);
    if (parts.length !== 8) return null;
    return parts.map((p) => p.replace(/^0+(?=.)/, '')).join(':') + len;
  }
  function sameValue(exp, got) {
    if (exp === got) return true;
    const e6 = expandV6(exp), g6 = expandV6(got);
    if (e6 && g6) return e6 === g6;
    if (/^\d+$/.test(exp) && /^\d+$/.test(got)) return Number(exp) === Number(got);
    if (/^[\d,-]+$/.test(exp)) return exp.replace(/\s/g, '') === got.replace(/\s/g, '');
    return exp.toLowerCase() === got.toLowerCase();
  }
  function isValueToken(tok, prevExp) {
    if (tok.kind === 'if') return false;
    if (prevExp && VALUE_AFTER.has(prevExp)) return true;
    const w = tok.low;
    if (/[0-9:.]/.test(w) && !KW_DIGITS.has(w)) return true;
    if (/^[*#$%^&]/.test(w)) return true;
    return false;
  }
  function keywordOk(exp, got) {
    if (got === exp) return true;
    if (!exp.startsWith(got)) return false;
    if (got.length >= 2) return true;
    return got.length === 1 && ONE_LETTER.has(exp);
  }
  function freeText(s) {
    s = String(s).trim();
    if (s.length >= 2 && /[^A-Za-z0-9\s]/.test(s[0]) && s[s.length - 1] === s[0]) s = s.slice(1, -1);
    return s.replace(/\s+/g, ' ').trim().toLowerCase();
  }

  /* Compare one command (no filter) — returns 'ok' | 'wrong' | 'value' */
  function compareCmd(expected, typed) {
    const e = tokenize(expected), g = tokenize(typed);
    let reason = 'ok';
    for (let i = 0; i < e.length; i++) {
      const et = e[i], gt = g[i];
      const prev = i ? e[i - 1].low : '';
      const textStart = i < e.length - 1 && (et.low === 'description' || (i === 1 && e[0].low === 'banner' && TEXT_AFTER.has(et.low)));
      if (textStart) {
        // keyword itself, then the rest of the line is free text
        if (!gt || !keywordOk(et.low, gt.low)) return 'wrong';
        const restE = e.slice(i + 1).map((t) => t.raw).join(' ');
        const restG = g.slice(i + 1).map((t) => t.raw).join(' ');
        return freeText(restE) === freeText(restG) ? reason : 'value';
      }
      if (!gt) return 'wrong';
      if (et.kind === 'if' || gt.kind === 'if') {
        if (et.kind !== gt.kind) return 'wrong';
        if (et.low !== gt.low) reason = 'value';
        continue;
      }
      if (isValueToken(et, prev)) {
        if (!sameValue(et.raw, gt.raw)) reason = 'value';
        continue;
      }
      if (!keywordOk(et.low, gt.low)) return 'wrong';
    }
    if (g.length > e.length) return 'wrong';
    return reason;
  }

  function compareFilter(expF, gotF) {
    if (!expF && !gotF) return 'ok';
    if (!expF || !gotF) return 'filter';
    const e = expF.trim().split(/\s+/), g = gotF.trim().split(/\s+/);
    if (!g.length || !keywordOk(e[0].toLowerCase(), g[0].toLowerCase())) return 'filter';
    return e.slice(1).join(' ') === g.slice(1).join(' ') ? 'ok' : 'filter';
  }

  /* spec: { answer, accept?: [alternative full answers] } */
  function check(spec, typed) {
    const answers = [spec.answer].concat(spec.accept || []);
    const [gotCmd, gotF] = splitFilter(typed);
    let best = 'wrong';
    const rank = { ok: 3, value: 2, filter: 1, wrong: 0 };
    for (const a of answers) {
      const [expCmd, expF] = splitFilter(a);
      let r = compareCmd(expCmd, gotCmd);
      if (r === 'ok') r = compareFilter(expF, gotF);
      if (rank[r] > rank[best]) best = r;
      if (best === 'ok') break;
    }
    if (!String(typed || '').trim()) best = 'wrong';
    return { ok: best === 'ok', reason: best };
  }

  SRWE.Cmd = { check, tokenize, expandV6, sameValue };
})(typeof window !== 'undefined' ? window : globalThis);
