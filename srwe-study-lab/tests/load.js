/* Loads the browser scripts into a Node vm context for testing. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const BASE = ['js/app/cmd.js', 'js/pt/check.js'];

function load(extra) {
  const ctx = { console, Date, Math, JSON, Set, Map, BigInt, setTimeout, clearTimeout };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of BASE.concat(extra || [])) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  }
  return ctx.SRWE;
}

module.exports = { load, ROOT };
