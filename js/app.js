/* Soft Skills Check · SKG Education — οθόνες, σειρά ερωτήσεων, βαθμολογία. Τα κείμενα είναι στο content.js. */
(function () {
  'use strict';
  const Q = window.QUIZ;
  const view = document.getElementById('view');
  const skillById = Object.fromEntries(Q.skills.map((s) => [s.id, s]));
  const LETTERS = ['Α', 'Β', 'Γ', 'Δ', 'Ε'];

  const state = { screen: 'intro', order: [], idx: 0, answers: {}, optOrder: {}, shared: null };

  // ---------- βοηθητικά ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function shuffle(a) {
    const r = a.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    return r;
  }
  const icon = (d) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  const ICONS = {
    back: icon('<path d="M15 18l-6-6 6-6"/>'),
    arrow: icon('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    share: icon('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>'),
    redo: icon('<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'),
    check: icon('<path d="M20 6L9 17l-5-5"/>'),
    star: icon('<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>'),
    up: icon('<path d="M12 19V5M5 12l7-7 7 7"/>'),
  };

  // Σειρά: ανακατεύονται οι ερωτήσεις κάθε δεξιότητας και μοιράζονται σε γύρους,
  // ώστε να μην έρχονται συνεχόμενες ερωτήσεις της ίδιας δεξιότητας.
  function buildOrder() {
    const bySkill = {};
    Q.questions.forEach((q, i) => { (bySkill[q.skill] = bySkill[q.skill] || []).push(i); });
    Object.keys(bySkill).forEach((k) => { bySkill[k] = shuffle(bySkill[k]); });
    const rounds = Math.max(...Object.values(bySkill).map((a) => a.length));
    const order = [];
    for (let r = 0; r < rounds; r++) {
      let skills = shuffle(Object.keys(bySkill).filter((k) => bySkill[k][r] !== undefined));
      if (order.length && Q.questions[order[order.length - 1]].skill === skills[0] && skills.length > 1) {
        skills.push(skills.shift());
      }
      skills.forEach((k) => order.push(bySkill[k][r]));
    }
    return order;
  }

  function scores() {
    const sum = {}, max = {};
    Q.questions.forEach((q, qi) => {
      const top = Math.max(...q.answers.map((a) => a[1]));
      max[q.skill] = (max[q.skill] || 0) + top;
      const a = state.answers[qi];
      if (a !== undefined) sum[q.skill] = (sum[q.skill] || 0) + q.answers[a][1];
    });
    return Q.skills.map((s) => ({ skill: s, pct: max[s.id] ? Math.round(((sum[s.id] || 0) / max[s.id]) * 100) : 0 }));
  }
  const levelFor = (pct) => Q.levels.find((l) => pct >= l.min);

  // Κοινοποίηση: ο σύνδεσμος κρατά μόνο τα έξι ποσοστά, με τη σειρά των skills (π.χ. #r=100-83-67-50-17-0).
  // Το κομμάτι μετά το # δεν φτάνει ποτέ στον server, και δεν υπάρχει όνομα ή άλλο στοιχείο.
  const encodeResults = (data) => `r=${Q.skills.map((s) => data.find((d) => d.skill === s).pct).join('-')}`;
  function decodeResults(hash) {
    const m = /^#?r=([\d-]+)$/.exec(hash || '');
    if (!m) return null;
    const nums = m[1].split('-').map(Number);
    if (nums.length !== Q.skills.length || nums.some((n) => !Number.isInteger(n) || n < 0 || n > 100)) return null;
    return Q.skills.map((s, i) => ({ skill: s, pct: nums[i] }));
  }
  const baseUrl = () => location.href.split('#')[0];
  function clearHash() {
    if (location.hash) history.replaceState(null, '', baseUrl());
  }

  function header(withBack) {
    return `<header class="bar">
      <div class="bar-l">${withBack ? `<button class="icon-btn" data-act="back" aria-label="Προηγούμενη ερώτηση">${ICONS.back}</button>` : ''}</div>
      <img class="bar-logo" src="img/skg-logo.png" alt="SKG Education" width="1861" height="629">
      <div class="bar-r"></div>
    </header>`;
  }

  // ---------- οθόνες ----------
  function renderIntro() {
    const t = Q.intro;
    view.innerHTML = `${header(false)}
    <section class="screen intro">
      <p class="kicker">${esc(t.kicker)}</p>
      <h1>${esc(t.heading)}</h1>
      <p class="lead">${esc(t.lead)}</p>
      <ul class="chips">${Q.skills.map((s) => `<li>${esc(s.name)}</li>`).join('')}</ul>
      <ul class="facts">${t.facts.map((f) => `<li>${ICONS.check}<span>${esc(f)}</span></li>`).join('')}</ul>
      <p class="note">${esc(t.note)}</p>
      <button class="btn btn-primary btn-start" data-act="start">${esc(t.start)} ${ICONS.arrow}</button>
      <p class="privacy">${esc(t.privacy)}</p>
    </section>`;
  }

  function renderQuestion() {
    const qi = state.order[state.idx];
    const q = Q.questions[qi];
    const total = state.order.length;
    if (!state.optOrder[qi]) state.optOrder[qi] = shuffle(q.answers.map((_, i) => i));
    const chosen = state.answers[qi];
    view.innerHTML = `${header(true)}
    <section class="screen question" aria-live="polite">
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${state.idx + 1}" aria-label="Πρόοδος">
        <div class="progress-fill" style="width:${((state.idx) / total) * 100}%"></div>
      </div>
      <p class="count">Ερώτηση <strong>${state.idx + 1}</strong> από ${total}</p>
      <h2 class="q-text">${esc(q.text)}</h2>
      <div class="options" role="radiogroup" aria-label="Απαντήσεις">
        ${state.optOrder[qi].map((ai, pos) => `
          <button class="option${chosen === ai ? ' is-chosen' : ''}" role="radio" aria-checked="${chosen === ai}" data-act="answer" data-a="${ai}">
            <span class="opt-key" aria-hidden="true">${LETTERS[pos]}</span>
            <span class="opt-text">${esc(q.answers[ai][0])}</span>
          </button>`).join('')}
      </div>
      <p class="hint">Στον υπολογιστή μπορείς να πατήσεις και 1–${q.answers.length}.</p>
    </section>`;
    requestAnimationFrame(() => {
      const f = view.querySelector('.progress-fill');
      if (f) f.style.width = `${((state.idx + (chosen !== undefined ? 1 : 0)) / total) * 100}%`;
    });
  }

  // Λεζάντα meme: κάθε δεξιότητα παίρνει άλλη λεζάντα του επιπέδου της (βάσει της θέσης της στη λίστα).
  const captionFor = (d) => {
    const lvl = levelFor(d.pct);
    const i = Q.skills.indexOf(d.skill);
    return lvl.captions[i % lvl.captions.length];
  };

  function batteryTile(d, i) {
    const lvl = levelFor(d.pct);
    return `<li class="bat-tile lvl-${lvl.key}" style="--d:${i * 60}ms">
      <div class="bat-head"><span class="bat-emoji" aria-hidden="true">${d.skill.emoji}</span><span class="bat-name">${esc(d.skill.name)}</span></div>
      <div class="battery" role="img" aria-label="${esc(d.skill.name)}: ${d.pct}%">
        <div class="bat-fill" data-w="${d.pct}"></div>
        <span class="bat-pct">${lvl.key === 'top' ? '⚡ ' : ''}${d.pct}%</span>
      </div>
      <p class="bat-cap">${esc(captionFor(d))}</p>
    </li>`;
  }

  function skillCard(d, i) {
    const lvl = levelFor(d.pct);
    const fb = d.skill.feedback[lvl.key];
    return `<article class="skill-card lvl-${lvl.key}" style="--d:${i * 70}ms">
      <header class="sc-head">
        <div class="sc-title">
          <span class="sc-emoji" aria-hidden="true">${d.skill.emoji}</span>
          <div>
            <h3>${esc(d.skill.name)}</h3>
            <p class="sc-el">${esc(d.skill.el)}</p>
          </div>
        </div>
        <div class="sc-pct"><strong>${d.pct}%</strong><span class="badge">${esc(lvl.label)}</span></div>
      </header>
      <div class="meter" aria-hidden="true"><div class="meter-fill" data-w="${d.pct}"></div></div>
      <p class="sc-summary">${esc(fb.summary)}</p>
      ${fb.strengths.length ? `<h4>${ICONS.star}${esc(Q.results.strengthsTitle)}</h4><ul class="list list-good">${fb.strengths.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
      ${fb.tips.length ? `<h4>${ICONS.up}${esc(Q.results.tipsTitle)}</h4><ul class="list list-tip">${fb.tips.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : ''}
    </article>`;
  }

  function renderResults() {
    const R = Q.results;
    const shared = !!state.shared;
    const data = shared ? state.shared : scores();
    const sorted = data.slice().sort((a, b) => b.pct - a.pct);
    const best = sorted.filter((d) => d.pct === sorted[0].pct);
    const worstPct = sorted[sorted.length - 1].pct;
    const worst = sorted.filter((d) => d.pct === worstPct);
    const overall = Math.round(data.reduce((s, d) => s + d.pct, 0) / data.length);
    const allEqual = best.length === data.length;
    const names = (arr) => arr.map((d) => `${d.skill.emoji} ${d.skill.name}`).join(' · ');

    view.innerHTML = `${header(false)}
    <section class="screen results">
      <p class="kicker">${esc(Q.title)}</p>
      <h1>${esc(shared ? R.sharedHeading : R.heading)}</h1>
      ${shared ? `<div class="shared-note"><p>${esc(R.sharedNote)}</p><button class="btn btn-primary" data-act="start">${esc(R.sharedCta)} ${ICONS.arrow}</button></div>` : ''}

      <div class="highlights">
        ${allEqual ? '' : `<div class="hl hl-best"><span class="hl-k">${esc(R.strongest)}</span><span class="hl-v">${esc(names(best))}</span><span class="hl-p">${best[0].pct}%</span></div>`}
        ${allEqual && worstPct >= 80 ? '' : `<div class="hl hl-work"><span class="hl-k">${esc(R.weakest)}</span><span class="hl-v">${esc(names(worst))}</span><span class="hl-p">${worstPct}%</span></div>`}
        <div class="hl hl-all"><span class="hl-k">${esc(R.overall)}</span><span class="hl-v">${esc(levelFor(overall).overall)}</span><span class="hl-p">${overall}%</span></div>
      </div>

      <h2 class="section-title">${esc(R.batteryTitle)}</h2>
      <ul class="batteries">${sorted.map(batteryTile).join('')}</ul>

      <div class="cards">${sorted.map(skillCard).join('')}</div>

      <p class="disclaimer">${esc(R.disclaimer(Q.questions.length))}</p>
      ${shared
    ? `<div class="actions actions-one"><button class="btn btn-primary" data-act="start">${esc(R.sharedCta)} ${ICONS.arrow}</button></div>`
    : `<div class="actions">
        <button class="btn btn-primary" data-act="share">${ICONS.share} <span>${esc(R.share)}</span></button>
        <button class="btn btn-ghost" data-act="restart">${ICONS.redo} ${esc(R.restart)}</button>
      </div>`}
    </section>`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      view.querySelectorAll('[data-w]').forEach((el) => { el.style.width = `${el.dataset.w}%`; });
    }));
  }
  function render() {
    if (state.screen === 'intro') renderIntro();
    else if (state.screen === 'q') renderQuestion();
    else renderResults();
    window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
    const focus = view.querySelector('h1, h2');
    if (focus) { focus.setAttribute('tabindex', '-1'); focus.focus({ preventScroll: true }); }
  }

  // ---------- ενέργειες ----------
  let busy = false;
  function answer(ai) {
    if (busy) return;
    const qi = state.order[state.idx];
    state.answers[qi] = ai;
    view.querySelectorAll('.option').forEach((b) => {
      const on = Number(b.dataset.a) === ai;
      b.classList.toggle('is-chosen', on);
      b.setAttribute('aria-checked', on);
    });
    const f = view.querySelector('.progress-fill');
    if (f) f.style.width = `${((state.idx + 1) / state.order.length) * 100}%`;
    busy = true;
    setTimeout(() => {
      busy = false;
      if (state.idx < state.order.length - 1) state.idx++;
      else state.screen = 'results';
      render();
    }, 320);
  }

  function back() {
    if (state.screen !== 'q' || busy) return;
    if (state.idx > 0) state.idx--;
    else state.screen = 'intro';
    render();
  }

  function start() {
    state.shared = null; clearHash();
    state.order = buildOrder();
    state.idx = 0; state.answers = {}; state.optOrder = {};
    state.screen = 'q';
    render();
  }

  async function share(btn) {
    const data = scores();
    const lines = data.slice().sort((a, b) => b.pct - a.pct).map((d) => `${d.skill.emoji} ${d.skill.name}: ${d.pct}%`);
    const text = `${Q.results.shareText}\n${lines.join('\n')}`;
    const url = `${baseUrl()}#${encodeResults(data)}`;
    try {
      if (navigator.share) { await navigator.share({ title: Q.title, text, url }); return; }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      const s = btn.querySelector('span'); const old = s.textContent;
      s.textContent = Q.results.copied; setTimeout(() => { s.textContent = old; }, 1800);
    } catch (e) { /* ο χρήστης ακύρωσε */ }
  }

  view.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'start') start();
    else if (act === 'answer') answer(Number(el.dataset.a));
    else if (act === 'back') back();
    else if (act === 'share') share(el);
    else if (act === 'restart') { state.shared = null; clearHash(); state.screen = 'intro'; render(); }
  });
  document.addEventListener('keydown', (e) => {
    if (state.screen !== 'q' || e.altKey || e.ctrlKey || e.metaKey) return;
    const n = parseInt(e.key, 10);
    const opts = view.querySelectorAll('.option');
    if (n >= 1 && n <= opts.length) { e.preventDefault(); answer(Number(opts[n - 1].dataset.a)); }
    else if (e.key === 'Backspace' || e.key === 'ArrowLeft') { e.preventDefault(); back(); }
  });

  // Άνοιγμα από σύνδεσμο κοινοποίησης: δείχνει τα αποτελέσματα που έστειλαν.
  function openFromHash() {
    const data = decodeResults(location.hash);
    if (data) { state.shared = data; state.screen = 'results'; }
    else if (location.hash) clearHash();
  }
  window.addEventListener('hashchange', () => { openFromHash(); render(); });
  openFromHash();
  render();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
