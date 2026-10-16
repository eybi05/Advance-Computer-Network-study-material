/* Helpers for the practice files of modules 5–16 (mN-practice.js). Same conventions as quiz.js / cards.js:
 *   mc:    options[0] is the correct answer (options are shuffled at run time)
 *   multi: the first n options are correct
 *   order: items in the correct order;  match: [term, meaning] pairs;  tf: statement + true/false
 *   cli:   typed IOS command at the given prompt; abbreviations are accepted (js/app/cmd.js)
 *   card:  flashcard, front / back */
(function (root) {
  'use strict';
  const SRWE = root.SRWE = root.SRWE || {};
  const Q = SRWE.quiz = SRWE.quiz || [];
  const C = SRWE.cards = SRWE.cards || [];
  const qn = {}, cn = {};
  const add = (o) => { qn[o.t] = (qn[o.t] || 0) + 1; o.id = 'q' + o.t + '-' + qn[o.t]; Q.push(o); };
  SRWE.QuizKit = {
    mc: (t, q, o, ex) => add({ t, type: 'mc', q, o, ex }),
    multi: (t, q, n, o, ex) => add({ t, type: 'multi', q, n, o, ex }),
    order: (t, q, items, ex) => add({ t, type: 'order', q, items, ex }),
    match: (t, q, pairs, ex) => add({ t, type: 'match', q, pairs, ex }),
    tf: (t, q, ans, ex) => add({ t, type: 'tf', q, ans, ex }),
    cli: (t, q, prompt, answer, ex, accept) => add({ t, type: 'cli', q, prompt, answer, accept, ex }),
    card: (t, f, b) => { cn[t] = (cn[t] || 0) + 1; C.push({ id: 'c' + t + '-' + cn[t], t, f, b }); },
  };
})(typeof window !== 'undefined' ? window : globalThis);
