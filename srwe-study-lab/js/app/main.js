/* SRWE Study Lab — start-up. */
(function (root) {
  'use strict';
  const SRWE = root.SRWE;
  const App = SRWE.App;

  root.__srweErrors = root.__srweErrors || [];
  root.addEventListener('error', (e) => { root.__srweErrors.push(String(e.message || e) + (e.filename ? ' @ ' + e.filename + ':' + e.lineno : '')); flagErrors(); });
  root.addEventListener('unhandledrejection', (e) => { root.__srweErrors.push('promise: ' + String(e.reason)); flagErrors(); });
  function flagErrors() {
    const el = document.getElementById('__errors');
    if (el) el.textContent = root.__srweErrors.join('\n');
  }

  function closeRail() {
    document.getElementById('rail').classList.remove('open');
    const s = document.querySelector('.scrim');
    if (s) s.remove();
    document.getElementById('menu-btn').setAttribute('aria-expanded', 'false');
  }
  function openRail() {
    const rail = document.getElementById('rail');
    rail.classList.add('open');
    const scrim = App.h('div', { class: 'scrim', onclick: closeRail });
    document.body.appendChild(scrim);
    document.getElementById('menu-btn').setAttribute('aria-expanded', 'true');
    const first = rail.querySelector('a');
    if (first) first.focus();
  }

  App.afterRender = function () {
    App.renderRail();
    closeRail();
    root.scrollTo(0, 0);
    const h1 = document.querySelector('#page h1');
    document.title = (h1 ? h1.textContent + ' · ' : '') + 'SRWE Study Lab';
    flagErrors();
  };

  function start() {
    App.applyTheme();
    document.getElementById('menu-btn').addEventListener('click', () => (document.getElementById('rail').classList.contains('open') ? closeRail() : openRail()));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeRail(); });
    root.addEventListener('hashchange', App.render);
    root.addEventListener('beforeunload', () => { App.leave(); App.save(true); });
    if (root.matchMedia) root.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => App.renderRail());
    App.render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})(typeof window !== 'undefined' ? window : globalThis);
