/* ============================================================================
   CCAR revision app — shared view logic for CCAR-F and CCAR-P.
   Vanilla ES2020, no build step, no modules: must run from file://.
   Reads window.CERT, assembled by <cert>/data.js.
   Generalised from the CCDV-F revision app.
   ============================================================================ */
(function () {
  const { EXAM_INFO, DOMAINS, SCENARIOS, QUESTIONS, PREP } = window.CERT;
  const LESSONS = window.CERT.LESSONS || [];
  const OVERVIEW = window.CERT.OVERVIEW || null;
  const app = document.getElementById("app");
  const tabs = document.getElementById("tabs");

  const LS = EXAM_INFO.lsKey;

  /* ---------- exam constants (per cert, from EXAM_INFO) ---------- */
  const EXAM_LENGTHS = EXAM_INFO.examLengths;           // e.g. [20, 60]
  const SCALE_MIN = EXAM_INFO.scaleMin;
  const SCALE_MAX = EXAM_INFO.scaleMax;
  const PASS_SCALED = EXAM_INFO.pass;
  const REAL_EXAM_ITEMS = EXAM_INFO.items;
  const REAL_EXAM_SECONDS = EXAM_INFO.minutes * 60;
  const SCENARIOS_PER_EXAM = EXAM_INFO.scenariosPerExam || 0;
  const MAX_ATTEMPTS_STORED = 25;
  const HAS_SCENARIOS = Array.isArray(SCENARIOS) && SCENARIOS.length > 0;

  /* ---------- utils ---------- */
  const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  /* esc first, then `identifier` -> <code> and **x** -> <strong>; escaping first means no injection. */
  const fmt = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\{\{(\d+\.\d+)\}\}/g, '<button type="button" class="lref" data-lesson="$1">$1</button>');   // {{1.5}} = link to lesson 1.5
  const shuffle = (a) => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  const domain = (id) => DOMAINS.find((d) => d.id === id);
  const scenario = (id) => (SCENARIOS || []).find((s) => s.id === id);
  const isMulti = (q) => q.type === "multi";
  const arrEq = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
  const pct = (c, t) => (t ? Math.round((c / t) * 100) : 0);

  /* ---------- persistence ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; }
  }
  const save = (s) => { try { localStorage.setItem(LS, JSON.stringify(s)); } catch { /* private mode */ } };

  /* ---------- theme (shared across both certs) ---------- */
  const THEME_KEY = "ccar_theme";
  const themeBtn = document.getElementById("themeToggle");
  const applyTheme = (t) => {
    document.documentElement.setAttribute("data-theme", t);
    themeBtn.textContent = t === "dark" ? "☀️" : "🌙";
  };
  (function initTheme() {
    let t = null;
    try { t = localStorage.getItem(THEME_KEY); } catch { /* ignore */ }
    applyTheme(t || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  })();
  themeBtn.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch { /* ignore */ }
  });

  /* ============================================================================
     SCORING AND EXAM CONSTRUCTION
     ========================================================================= */

  /* Largest remainder with an explicit tie-break (larger weight first, then
     lower domain index) so the allocation is reproducible. Mirrored in
     tools/check-bank.mjs. */
  function allocateByWeight(weights, total) {
    const sum = weights.reduce((a, b) => a + b, 0);
    if (!sum || total <= 0) return weights.map(() => 0);
    const raw = weights.map((w) => (w / sum) * total);
    const counts = raw.map(Math.floor);
    const remainder = total - counts.reduce((a, b) => a + b, 0);
    const order = raw
      .map((r, i) => ({ i, frac: r - Math.floor(r), w: weights[i] }))
      .sort((a, b) => (b.frac - a.frac) || (b.w - a.w) || (a.i - b.i));
    for (let k = 0; k < remainder; k++) counts[order[k % order.length].i] += 1;
    return counts;
  }
  const examAllocation = (total) => allocateByWeight(DOMAINS.map((d) => d.poids), total);

  function scaleScore(correct, total) {
    if (!total) return SCALE_MIN;
    return Math.round(SCALE_MIN + (correct / total) * (SCALE_MAX - SCALE_MIN));
  }

  /* Shuffles options and remaps the correct answer(s): authored position is
     invisible to the learner. */
  function prepareItems(list) {
    return list.map((q) => {
      const order = shuffle(q.options.map((_, i) => i));
      const options = order.map((i) => q.options[i]);
      const was = new Set(isMulti(q) ? q.correct : [q.correct]);
      const correct = order.map((orig, idx) => (was.has(orig) ? idx : -1)).filter((x) => x >= 0);
      return { ...q, options, correct, _multi: isMulti(q) };
    });
  }

  /* Orders a list so items sharing a scenario are contiguous, scenario
     groups in the given order, shuffled within each group. */
  function groupByScenario(list, order) {
    if (!HAS_SCENARIOS) return shuffle(list);
    const rest = [...new Set(list.map((q) => q.scenario))].filter((sid) => !(order || []).includes(sid));
    const out = [];
    (order || []).concat(rest).forEach((sid) => { out.push(...shuffle(list.filter((q) => q.scenario === sid))); });
    return out;
  }

  function buildPracticeSet(filter, count, opts = {}) {
    const pool = shuffle(QUESTIONS.filter(filter));
    const n = count === "Max" ? pool.length : Math.min(count, pool.length);
    const picked = pool.slice(0, n);
    return prepareItems(opts.grouped ? groupByScenario(picked) : picked);
  }

  /* Blueprint-weighted draw. With scenarios (CCAR-F): pick SCENARIOS_PER_EXAM
     scenarios at random, draw each domain's allocation from items of those
     scenarios, then present grouped by scenario. A domain short of items in
     the picked scenarios is topped up from other scenarios and the shortfall
     is recorded in the plan — tools/check-bank.mjs asserts that every
     scenario combination can fill a full-length exam, so this is a fallback. */
  function buildExamSet(total) {
    const counts = examAllocation(total);
    const picks = HAS_SCENARIOS && SCENARIOS_PER_EXAM
      ? shuffle(SCENARIOS.map((s) => s.id)).slice(0, SCENARIOS_PER_EXAM) : null;
    const plan = [];
    let picked = [];
    DOMAINS.forEach((d, idx) => {
      const all = QUESTIONS.filter((q) => q.domain === d.id);
      const inScen = picks ? all.filter((q) => picks.includes(q.scenario)) : all;
      const want = counts[idx];
      let take = shuffle(inScen).slice(0, want);
      let topUp = 0;
      if (take.length < want && picks) {
        const extra = shuffle(all.filter((q) => !picks.includes(q.scenario))).slice(0, want - take.length);
        topUp = extra.length; take = take.concat(extra);
      }
      picked = picked.concat(take);
      plan.push({ id: d.id, want, got: take.length, available: inScen.length, topUp });
    });
    const ordered = picks ? groupByScenario(picked, picks) : shuffle(picked);
    return { items: prepareItems(ordered), plan, scenarios: picks };
  }

  /* Diagnostic: 2 per domain over (up to) 5 domains — CCAR-P rotates which
     5 of its 7 domains are covered. */
  function buildDiagnostic() {
    const doms = shuffle(DOMAINS.map((d) => d.id)).slice(0, 5).sort((a, b) => a - b);
    const picked = [];
    doms.forEach((id) => picked.push(...shuffle(QUESTIONS.filter((q) => q.domain === id)).slice(0, 2)));
    return prepareItems(picked);
  }

  /* ============================================================================
     ROUTER
     ========================================================================= */
  const views = {};
  let session = null;

  tabs.addEventListener("click", (e) => {
    const b = e.target.closest(".tab"); if (!b) return;
    go(b.dataset.view);
  });
  function setActive(v) {
    [...tabs.children].forEach((b) => {
      const on = b.dataset.view === v;
      b.classList.toggle("active", on);
      if (on && tabs.scrollWidth > tabs.clientWidth) {
        const left = b.offsetLeft - (tabs.clientWidth - b.offsetWidth) / 2;
        tabs.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
      }
    });
  }
  function go(v) {
    setActive(v); app.innerHTML = ""; window.scrollTo(0, 0);
    (views[v] || views.home)();
  }

  /* ============================================================================
     HOME
     ========================================================================= */
  views.home = function () {
    const st = load();
    const lastExam = (st.attempts || [])[0];
    const maxWeight = Math.max(...DOMAINS.map((d) => d.poids));
    const weak = (st.wrong || []).length;

    const wrap = el(`<div>
      <h1>Prepare for the ${esc(EXAM_INFO.code)} certification</h1>
      <p class="lead">${esc(EXAM_INFO.titre)} · ${esc(EXAM_INFO.version)}</p>

      <div class="grid stats" style="margin-bottom:8px">
        <div class="card stat"><div class="num">${EXAM_INFO.items}</div><div class="lbl">exam items</div></div>
        <div class="card stat"><div class="num">${EXAM_INFO.minutes}<span style="font-size:15px"> min</span></div><div class="lbl">duration</div></div>
        <div class="card stat"><div class="num">${PASS_SCALED}</div><div class="lbl">to pass (${esc(EXAM_INFO.echelle)})</div></div>
        <div class="card stat"><div class="num">${QUESTIONS.length}</div><div class="lbl">practice questions</div></div>
      </div>

      ${lastExam ? `<div class="card last-attempt">
        <div><strong>Last mock exam</strong> · ${esc(new Date(lastExam.date).toLocaleString())}</div>
        <div class="last-line">
          <span class="score-chip ${lastExam.pass ? "pass" : "fail"}">${lastExam.scaled}</span>
          <span class="hint">${lastExam.correct}/${lastExam.total} correct · ${lastExam.length}-item exam · ${lastExam.pass ? "pass" : `below ${PASS_SCALED}`}</span>
        </div>
      </div>` : ""}

      <div class="btn-row" style="margin:14px 0 4px">
        <button class="btn" id="ctaLearn">Learn (${LESSONS.length} lessons)</button>
        <button class="btn ghost" id="ctaDiag">10-question diagnostic</button>
        <button class="btn ghost" id="ctaExam">Take a mock exam</button>
        <button class="btn ghost" id="ctaQuiz">Practice</button>
        ${weak ? `<button class="btn ghost" id="ctaWeak">Weak spots (${weak})</button>` : ""}
      </div>

      <h2>Blueprint — weight by domain</h2>
      <div class="card" id="bp"></div>

      ${HAS_SCENARIOS ? `<h2>Exam structure</h2>
      <div class="card"><p style="margin:0">${esc(EXAM_INFO.structure)}</p>
      <div class="btn-row" style="margin-top:10px"><button class="btn ghost" id="ctaScen">See the 6 scenarios</button></div></div>` : ""}

      <h2>How to prepare (Exam Guide)</h2>
      <div class="card"><ol class="prep" id="prep"></ol></div>

      <h2>The exam at a glance</h2>
      <div class="card">
        <div class="grid two">
          <div><strong>Code</strong><br><span class="hint">${esc(EXAM_INFO.code)}</span></div>
          <div><strong>Format</strong><br><span class="hint">${esc(EXAM_INFO.format)}</span></div>
          <div><strong>Delivery</strong><br><span class="hint">${esc(EXAM_INFO.livraison)}</span></div>
          <div><strong>Price</strong><br><span class="hint">${esc(EXAM_INFO.prix)}</span></div>
          <div><strong>Validity</strong><br><span class="hint">${esc(EXAM_INFO.validite)}</span></div>
          <div><strong>Score report</strong><br><span class="hint">${esc(EXAM_INFO.reussite)}</span></div>
          <div><strong>Retake policy</strong><br><span class="hint">${esc(EXAM_INFO.retake)}</span></div>
          <div><strong>Renewal</strong><br><span class="hint">${esc(EXAM_INFO.renouvellement)}</span></div>
          <div><strong>Scoring model</strong><br><span class="hint">${esc(EXAM_INFO.notation)}</span></div>
          <div><strong>Audience</strong><br><span class="hint">${esc(EXAM_INFO.audience)}</span></div>
        </div>
      </div>
    </div>`);

    const bp = wrap.querySelector("#bp");
    DOMAINS.forEach((d) => {
      const row = el(`<div class="bp-row" title="Open domain ${d.id}">
        <div class="bp-name">${d.id}. ${esc(d.nom)}</div>
        <div class="bp-track"><div class="bp-fill" style="width:0%;background:${d.couleur}"></div></div>
        <div class="bp-val">${d.poids}%</div>
      </div>`);
      row.addEventListener("click", () => { openDomain = d.id; go("learn"); });
      bp.appendChild(row);
      requestAnimationFrame(() => { row.querySelector(".bp-fill").style.width = (d.poids / maxWeight * 100) + "%"; });
    });
    const prep = wrap.querySelector("#prep");
    PREP.forEach((p) => prep.appendChild(el(`<li>${fmt(p)}</li>`)));

    wrap.querySelector("#ctaLearn").addEventListener("click", () => go("learn"));
    wrap.querySelector("#ctaDiag").addEventListener("click", startDiagnostic);
    wrap.querySelector("#ctaExam").addEventListener("click", () => go("exam"));
    wrap.querySelector("#ctaQuiz").addEventListener("click", () => go("quiz"));
    const w = wrap.querySelector("#ctaWeak"); if (w) w.addEventListener("click", startWeakSpots);
    const sc = wrap.querySelector("#ctaScen"); if (sc) sc.addEventListener("click", () => go("scenarios"));
    app.appendChild(wrap);
  };

  function startDiagnostic() {
    startSession({ items: buildDiagnostic(), mode: "end", exam: null, kind: "diagnostic" });
  }
  function startWeakSpots() {
    const wrong = new Set(load().wrong || []);
    const items = buildPracticeSet((q) => wrong.has(q.id), 20);
    if (!items.length) { alert("No weak spots recorded yet — answer some questions first."); return; }
    startSession({ items, mode: "immediate", exam: null, kind: "weak" });
  }

  /* ============================================================================
     LEARN — one short lesson per task statement / objective, with a diagram.
     Lessons live in <cert>/lessons-*.js (window.CERT.LESSONS), keyed by the
     sub-skill id ("1.1"). Read state is kept per cert in localStorage.
     ========================================================================= */
  let openDomain = null;
  const skillOf = (id) => {
    for (const d of DOMAINS) for (const s of d.skills) if (s.nom.split(" ")[0] === id) return { d, s };
    return null;
  };
  const lessonOrder = () => DOMAINS.flatMap((d) => d.skills.map((s) => s.nom.split(" ")[0]))
    .filter((id) => LESSONS.some((l) => l.id === id));
  const readSet = () => new Set(load().read || []);

  /* ---------- diagrams: small declarative kinds rendered as HTML/CSS ---------- */
  const box = (n, cls = "") => `<div class="dg-box ${n.tone ? "t-" + n.tone : ""} ${cls}"><b>${fmt(n.label)}</b>${n.sub ? `<span>${fmt(n.sub)}</span>` : ""}</div>`;
  const DIAGRAMS = {
    flow: (g) => `<div class="dg-row">${g.steps.map((s, i) => box(s) +
        (i < g.steps.length - 1 ? `<div class="dg-arrow"><i>→</i>${s.edge ? `<small>${fmt(s.edge)}</small>` : ""}</div>` : "")).join("")}</div>
      ${g.loop ? `<div class="dg-loop">↺ ${fmt(g.loop)}</div>` : ""}`,
    hub: (g) => `<div class="dg-hub">${box(g.center, "dg-center")}
      <div class="dg-fan">${g.edge ? `<small>${fmt(g.edge)}</small>` : ""}</div>
      <div class="dg-spokes">${g.spokes.map((s) => box(s)).join("")}</div></div>`,
    layers: (g) => `<div class="dg-layers">${g.layers.map((l) => `<div class="dg-layer ${l.tone ? "t-" + l.tone : ""}">
        <b>${fmt(l.label)}</b><span>${fmt(l.sub || "")}</span>${l.tag ? `<em>${fmt(l.tag)}</em>` : ""}</div>`).join("")}
      ${g.axis ? `<div class="dg-axis">${fmt(g.axis)}</div>` : ""}</div>`,
    compare: (g) => `<div class="dg-compare">${g.columns.map((c) => `<div class="dg-col ${c.tone ? "t-" + c.tone : ""}">
        <div class="dg-col-h">${c.tone === "good" ? "✓ " : c.tone === "bad" ? "✗ " : ""}${fmt(c.title)}</div>
        <ul>${c.items.map((x) => `<li>${fmt(x)}</li>`).join("")}</ul></div>`).join("")}</div>`,
    decision: (g) => `<div class="dg-decision"><div class="dg-q">${fmt(g.question)}</div>
      <div class="dg-branches">${g.branches.map((b) => `<div class="dg-branch ${b.tone ? "t-" + b.tone : ""}">
        <small>${fmt(b.when)}</small><b>${fmt(b.then)}</b></div>`).join("")}</div></div>`,
    /* Big-picture kinds: containers that literally nest, and a numbered walk-through. */
    nest: (g) => `<div class="nest">${g.nodes.map((n) => nestNode(n, 0)).join("")}</div>`,
    trace: (g) => `<ol class="trace">${g.steps.map((s, i) => `<li class="tr-step${s.inner ? " tr-in" : ""}">
        <span class="tr-n">${i + 1}</span>
        <div class="tr-body"><div class="tr-head"><span class="tr-who ${s.tone ? "t-" + s.tone : ""}">${esc(s.who)}</span><b>${fmt(s.title)}</b></div>
        <p>${fmt(s.text)}</p></div></li>`).join("")}</ol>`,
  };
  function nestNode(n, depth) {
    if (n.arrow !== undefined) return `<div class="nest-arrow"><i>↓</i>${n.arrow ? `<small>${fmt(n.arrow)}</small>` : ""}</div>`;
    const tone = n.tone ? "t-" + n.tone : "";
    if (!n.children) {
      const id = n.id;
      const inner = `<b>${fmt(n.label)}</b>${n.sub ? `<span>${fmt(n.sub)}</span>` : ""}${id ? `<em class="lid">${esc(id)}</em>` : ""}`;
      return id ? `<button type="button" class="nest-leaf ${tone}" data-lesson="${esc(id)}">${inner}</button>` : `<div class="nest-leaf ${tone}">${inner}</div>`;
    }
    return `<div class="nest-box d${Math.min(depth, 2)} ${n.col ? "col" : ""} ${tone}"${n.grow ? ` style="flex-grow:${+n.grow}"` : ""}>
      <div class="nest-h"><b>${fmt(n.label)}</b>${n.sub ? `<span>${fmt(n.sub)}</span>` : ""}</div>
      <div class="nest-kids">${n.children.map((c) => nestNode(c, depth + 1)).join("")}</div></div>`;
  }
  function diagramHtml(g) {
    if (!g || !DIAGRAMS[g.kind]) return "";
    return `<figure class="dg dg-k-${g.kind}">${g.title ? `<figcaption>${fmt(g.title)}</figcaption>` : ""}
      ${DIAGRAMS[g.kind](g)}${g.caption ? `<p class="dg-cap">${fmt(g.caption)}</p>` : ""}</figure>`;
  }

  views.learn = function () {
    const read = readSet();
    const total = lessonOrder().length;
    const done = lessonOrder().filter((id) => read.has(id)).length;
    const wrap = el(`<div>
      <h1>Learn</h1>
      <p class="lead">One short lesson per ${esc(EXAM_INFO.subLabel)}: the idea in one sentence, a diagram, the key points,
      the exam traps and a question to check yourself. Built for a quick read.</p>
      ${OVERVIEW ? `<button type="button" class="card big-cta" data-big="1">
        <span class="tldr-tag">Start here</span><b>${esc(OVERVIEW.title)}</b>
        <span>${esc(OVERVIEW.teaser)}</span><em>Open the big picture →</em></button>` : ""}
      <div class="card learn-progress">
        <div><strong>${done} of ${total}</strong> lessons read</div>
        <div class="progress"><div style="width:${total ? (done / total) * 100 : 0}%"></div></div>
      </div>
      <div id="doms"></div>
    </div>`);
    const doms = wrap.querySelector("#doms");
    DOMAINS.forEach((d) => {
      const nQ = QUESTIONS.filter((q) => q.domain === d.id).length;
      const block = el(`<section class="card learn-dom" id="dom-${d.id}">
        <div class="learn-dom-h">
          <span class="dom-num" style="background:${d.couleur}">${d.id}</span>
          <div><h2>${esc(d.nom)}</h2><span class="hint">${d.poids}% of the exam · ${d.skills.length} lessons · ${nQ} questions</span></div>
        </div>
        <p class="dom-resume">${esc(d.resume)}</p>
        <ol class="lesson-list"></ol>
        <div class="btn-row"><button class="btn ghost small">Practise this domain</button></div>
      </section>`);
      const ol = block.querySelector("ol");
      d.skills.forEach((s) => {
        const id = s.nom.split(" ")[0];
        const lesson = LESSONS.find((l) => l.id === id);
        const li = el(`<li class="lesson-row${read.has(id) ? " done" : ""}${lesson ? "" : " missing"}">
          <span class="lr-check">${read.has(id) ? "✓" : ""}</span>
          <span class="lr-id">${esc(id)}</span>
          <span class="lr-body"><b>${esc(s.nom.slice(id.length + 1))}</b><span>${lesson ? fmt(lesson.tldr) : "Lesson not written yet"}</span></span>
        </li>`);
        if (lesson) li.addEventListener("click", () => openLesson(id));
        ol.appendChild(li);
      });
      block.querySelector("button").addEventListener("click", () => {
        if (nQ) startSession({ items: buildPracticeSet((q) => q.domain === d.id, 20), mode: "immediate", exam: null });
      });
      doms.appendChild(block);
    });
    app.appendChild(wrap);
    if (openDomain) { const t = wrap.querySelector("#dom-" + openDomain); if (t) t.scrollIntoView(); openDomain = null; }
  };

  function openLesson(id) {
    setActive("learn"); app.innerHTML = ""; window.scrollTo(0, 0);
    const L = LESSONS.find((l) => l.id === id);
    const { d, s } = skillOf(id);
    const order = lessonOrder();
    const i = order.indexOf(id);
    const prevId = order[i - 1], nextId = order[i + 1];
    const read = readSet();
    const nQ = QUESTIONS.filter((q) => q.skill === s.nom).length;
    const off = s.official || {};
    const offList = (t, arr) => (arr && arr.length ? `<div class="off-title">${t}</div><ul class="off-list">${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");

    const wrap = el(`<article class="lesson">
      <div class="crumbs"><a href="#" data-go="learn">Learn</a> › <a href="#" data-dom="${d.id}">D${d.id} · ${esc(d.nom)}</a> › ${esc(id)}</div>
      <h1>${esc(s.nom)}</h1>
      <p class="lead">${esc(s.desc)}</p>
      <div class="card tldr"><span class="tldr-tag">In one sentence</span>${fmt(L.tldr)}</div>
      ${diagramHtml(L.diagram)}
      <h2>Key points</h2>
      <ul class="kp">${L.points.map((p) => `<li>${fmt(p)}</li>`).join("")}</ul>
      ${L.table ? `<div class="lt-wrap"><table class="lt"><thead><tr>${L.table.head.map((h) => `<th>${fmt(h)}</th>`).join("")}</tr></thead>
        <tbody>${L.table.rows.map((r) => `<tr>${r.map((c) => `<td>${fmt(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
      ${L.code ? `<pre class="lcode"><code>${esc(L.code)}</code></pre>` : ""}
      <h2>Exam traps</h2>
      <div class="traps">${L.traps.map((t) => `<div class="trap"><div class="trap-x">✗ ${fmt(t.wrong)}</div><div class="trap-v">✓ ${fmt(t.right)}</div></div>`).join("")}</div>
      <div class="card exam-tip"><span class="tldr-tag">In the exam</span>${fmt(L.exam)}</div>
      ${off.knowledge || off.skills ? `<details class="off"><summary>Exam guide wording (verbatim)</summary>${offList("Knowledge of", off.knowledge)}${offList("Skills in", off.skills)}</details>` : ""}
      <h2>Check yourself</h2>
      <div id="check"></div>
      ${L.sources && L.sources.length ? `<div class="sources"><span class="hint">Sources:</span> ${L.sources.map((x) => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.label)}</a>`).join(" · ")}</div>` : ""}
      <div class="lesson-nav">
        <button class="btn ghost" id="prevL"${prevId ? "" : " disabled"}>← ${prevId ? esc(prevId) : "Previous"}</button>
        <button class="btn${read.has(id) ? " ghost" : ""}" id="markL">${read.has(id) ? "✓ Read — mark unread" : "Mark as read"}</button>
        <button class="btn ghost" id="nextL"${nextId ? "" : " disabled"}>${nextId ? esc(nextId) : "Next"} →</button>
      </div>
    </article>`);

    wrap.querySelector("[data-go]").addEventListener("click", (e) => { e.preventDefault(); go("learn"); });
    wrap.querySelector("[data-dom]").addEventListener("click", (e) => { e.preventDefault(); openDomain = d.id; go("learn"); });
    if (prevId) wrap.querySelector("#prevL").addEventListener("click", () => openLesson(prevId));
    else if (OVERVIEW) { const p = wrap.querySelector("#prevL"); p.disabled = false; p.textContent = "← Big picture"; p.dataset.big = "1"; }
    if (nextId) wrap.querySelector("#nextL").addEventListener("click", () => openLesson(nextId));
    wrap.querySelector("#markL").addEventListener("click", () => {
      const st = load(); const r = new Set(st.read || []);
      if (r.has(id)) r.delete(id); else r.add(id);
      st.read = [...r]; save(st);
      if (!read.has(id) && nextId) openLesson(nextId); else openLesson(id);
    });
    renderCheck(wrap.querySelector("#check"), s, nQ);
    app.appendChild(wrap);
  }

  /* ---------- Big picture: the course-wide map shown before the lessons ---------- */
  const OVERVIEW_BLOCKS = {
    text: (b) => `<p class="ov-text">${fmt(b.text)}</p>`,
    diagram: (b) => diagramHtml(b.diagram),
    callout: (b) => `<div class="card exam-tip">${b.tag ? `<span class="tldr-tag">${esc(b.tag)}</span>` : ""}${fmt(b.text)}</div>`,
    table: (b) => `<div class="lt-wrap"><table class="lt"><thead><tr>${b.head.map((h) => `<th>${fmt(h)}</th>`).join("")}</tr></thead>
      <tbody>${b.rows.map((r) => `<tr>${r.map((c) => `<td>${fmt(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`,
    themes: (b) => b.families.map((f) => `<h3 class="ov-fam">${fmt(f.name)}</h3><div class="themes">${f.items.map((t) => `<div class="theme">
      <div class="theme-h"><b>${fmt(t.term)}</b>${(t.ids || []).map((i) => `{{${i}}}`).map(fmt).join("")}</div>
      <p>${fmt(t.what)}</p><p class="theme-link">↔ ${fmt(t.fits)}</p></div>`).join("")}</div>`).join(""),
  };

  function openOverview() {
    setActive("learn"); app.innerHTML = ""; window.scrollTo(0, 0);
    const first = lessonOrder()[0];
    const wrap = el(`<article class="lesson overview">
      <div class="crumbs"><a href="#" data-go="learn">Learn</a> › Big picture</div>
      <h1>${esc(OVERVIEW.title)}</h1>
      <p class="lead">${fmt(OVERVIEW.lead)}</p>
      <nav class="ov-nav">${OVERVIEW.sections.map((s) => `<button type="button" class="chip" data-sec="${esc(s.id)}">${esc(s.nav)}</button>`).join("")}</nav>
      ${OVERVIEW.sections.map((s, i) => `<section class="ov-sec" id="ov-${esc(s.id)}">
        <h2><span class="ov-num">${i + 1}</span>${esc(s.title)}</h2>
        ${s.intro ? `<p class="ov-text">${fmt(s.intro)}</p>` : ""}
        ${s.blocks.map((b) => OVERVIEW_BLOCKS[b.type](b)).join("")}</section>`).join("")}
      <div class="lesson-nav">
        <button class="btn ghost" data-go="learn">← All lessons</button>
        ${first ? `<button class="btn" data-lesson="${esc(first)}">Start with lesson ${esc(first)} →</button>` : ""}
      </div>
    </article>`);
    wrap.addEventListener("click", (e) => {
      const sec = e.target.closest("[data-sec]");
      if (sec) wrap.querySelector("#ov-" + sec.dataset.sec).scrollIntoView();
      if (e.target.closest("[data-go]")) { e.preventDefault(); go("learn"); }
    });
    app.appendChild(wrap);
  }

  /* One random question from this sub-skill, corrected in place. */
  function renderCheck(host, s, nQ) {
    const pool = QUESTIONS.filter((q) => q.skill === s.nom);
    if (!pool.length) { host.innerHTML = `<p class="hint">No question for this lesson yet.</p>`; return; }
    const q = prepareItems([pool[Math.floor(Math.random() * pool.length)]])[0];
    const picked = new Set();
    const letters = "ABCDEFGH";
    const card = el(`<div class="card">
      <div class="q-text">${fmt(q.q)}</div>
      <div class="opts">${q.options.map((o, i) => `<div class="opt${q._multi ? " multi" : ""}" data-idx="${i}"><span class="mk">${letters[i]}</span><span class="opt-txt">${fmt(o)}</span></div>`).join("")}</div>
      <div class="expl-box"></div>
      <div class="btn-row"><button class="btn" disabled>Check answer</button>
        <button class="btn ghost">Practise all ${nQ} questions</button><button class="btn ghost">Another question</button></div>
    </div>`);
    const [checkBtn, allBtn, anotherBtn] = card.querySelectorAll(".btn-row .btn");
    let checked = false;
    card.querySelector(".opts").addEventListener("click", (e) => {
      const o = e.target.closest(".opt"); if (!o || checked) return;
      const idx = +o.dataset.idx;
      if (q._multi) { if (picked.has(idx)) picked.delete(idx); else picked.add(idx); } else { picked.clear(); picked.add(idx); }
      card.querySelectorAll(".opt").forEach((x) => x.classList.toggle("sel", picked.has(+x.dataset.idx)));
      checkBtn.disabled = !picked.size;
    });
    checkBtn.addEventListener("click", () => {
      checked = true;
      const ok = arrEq([...picked], q.correct);
      card.querySelectorAll(".opt").forEach((x) => {
        const i = +x.dataset.idx;
        x.classList.remove("sel"); x.classList.add("locked");
        if (q.correct.includes(i)) x.classList.add("correct"); else if (picked.has(i)) x.classList.add("wrong");
      });
      card.querySelector(".expl-box").appendChild(el(`<div class="expl ${ok ? "ok" : "ko"}"><strong>${ok ? "✓ Correct" : "✗ Incorrect"}</strong> ${fmt(q.expl)}</div>`));
      checkBtn.disabled = true;
      const st = load(); const w = new Set(st.wrong || []);
      if (ok) w.delete(q.id); else w.add(q.id);
      st.wrong = [...w]; save(st);
    });
    allBtn.addEventListener("click", () => startSession({ items: buildPracticeSet((x) => x.skill === s.nom, "Max"), mode: "immediate", exam: null }));
    anotherBtn.addEventListener("click", () => { host.innerHTML = ""; renderCheck(host, s, nQ); });
    host.appendChild(card);
  }

  /* ============================================================================
     SCENARIOS (CCAR-F only)
     ========================================================================= */
  views.scenarios = function () {
    if (!HAS_SCENARIOS) return views.home();
    const wrap = el(`<div>
      <h1>The ${SCENARIOS.length} exam scenarios</h1>
      <p class="lead">${esc(EXAM_INFO.structure)} Scenario texts are verbatim from the exam guide.</p>
    </div>`);
    SCENARIOS.forEach((s) => {
      const n = QUESTIONS.filter((q) => q.scenario === s.id).length;
      const card = el(`<div class="card scen">
        <h3>Scenario ${s.id} · ${esc(s.nom)}</h3>
        <p>${esc(s.text)}</p>
        <p class="hint">Primary domains: ${s.primary.map((id) => `D${id} ${esc(domain(id).nom)}`).join(" · ")}</p>
        <div class="btn-row"><button class="btn ghost"${n ? "" : " disabled"}>Practise this scenario (${n})</button></div>
      </div>`);
      card.querySelector("button").addEventListener("click", () => {
        if (n) startSession({ items: buildPracticeSet((q) => q.scenario === s.id, 15), mode: "immediate", exam: null });
      });
      wrap.appendChild(card);
    });
    app.appendChild(wrap);
  };

  /* ============================================================================
     EXAM SETUP
     ========================================================================= */
  views.exam = function () {
    if (session && !session.finished && session.exam) return renderRun();
    renderExamSetup();
  };

  function renderExamSetup() {
    const attempts = load().attempts || [];
    const wrap = el(`<div>
      <h1>Mock exam</h1>
      <p class="lead">Questions are drawn in the official blueprint proportions and scored on the exam's
      ${esc(EXAM_INFO.echelle)} scale, with ${PASS_SCALED} to pass. Correction is deferred to the end.
      ${HAS_SCENARIOS ? `As on the real exam, ${SCENARIOS_PER_EXAM} of the ${SCENARIOS.length} scenarios are picked at random and their questions come grouped.` : ""}</p>
      <div class="card">
        <div class="field-lbl">Exam length</div>
        <div class="chips" id="lens"></div>
        <div class="field-lbl">Timer</div>
        <div class="chips" id="timer">
          <button class="chip" data-timer="off">Off</button>
          <button class="chip on" data-timer="on">On (pro-rated from ${EXAM_INFO.minutes} min / ${REAL_EXAM_ITEMS} items)</button>
        </div>
        <div class="spacer"></div>
        <div class="btn-row"><button class="btn" id="startBtn">Start exam</button></div>
        <div id="planInfo" class="plan-info"></div>
      </div>
      ${attempts.length ? `<h2>Attempt history</h2><div class="card" id="hist"></div>` : ""}
    </div>`);

    let selLen = EXAM_LENGTHS[EXAM_LENGTHS.length - 1];
    let timerOn = true;
    const lens = wrap.querySelector("#lens");
    EXAM_LENGTHS.forEach((n) => lens.appendChild(el(`<button class="chip${n === selLen ? " on" : ""}" data-len="${n}">${n} questions</button>`)));

    const planInfo = wrap.querySelector("#planInfo");
    function renderPlan() {
      const counts = examAllocation(selLen);
      const rows = DOMAINS.map((d, i) => ({ d, want: counts[i], have: QUESTIONS.filter((q) => q.domain === d.id).length }));
      planInfo.innerHTML = "";
      planInfo.appendChild(el(`<div class="plan-title">Draw for a ${selLen}-item exam</div>`));
      const tbl = el(`<div class="plan-grid"></div>`);
      rows.forEach((r) => tbl.appendChild(el(`<div class="plan-cell${r.have < r.want ? " short" : ""}">
          <span class="plan-dom" style="color:${r.d.couleur}">D${r.d.id}</span>
          <span class="plan-n">${r.want}</span>
          <span class="plan-w">${r.d.poids}%</span>
        </div>`)));
      planInfo.appendChild(tbl);
      const short = rows.filter((r) => r.have < r.want);
      if (short.length) {
        planInfo.appendChild(el(`<p class="warn">The bank is still incomplete: ${short.map((r) => `D${r.d.id} needs ${r.want} but has ${r.have}`).join(", ")}.
          The exam will be shorter than ${selLen} items and the score is computed on what was actually drawn.</p>`));
      }
    }
    lens.addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      lens.querySelectorAll(".chip").forEach((x) => x.classList.remove("on"));
      b.classList.add("on"); selLen = +b.dataset.len; renderPlan();
    });
    wrap.querySelector("#timer").addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      wrap.querySelector("#timer").querySelectorAll(".chip").forEach((x) => x.classList.remove("on"));
      b.classList.add("on"); timerOn = b.dataset.timer === "on";
    });
    wrap.querySelector("#startBtn").addEventListener("click", () => {
      const { items, plan, scenarios } = buildExamSet(selLen);
      if (!items.length) { alert("The question bank is empty."); return; }
      const budget = Math.round(items.length * (REAL_EXAM_SECONDS / REAL_EXAM_ITEMS));
      startSession({ items, mode: "end", exam: { length: selLen, plan, scenarios, timer: timerOn, budgetSeconds: budget } });
    });

    if (attempts.length) {
      const hist = wrap.querySelector("#hist");
      attempts.forEach((at) => hist.appendChild(el(`<div class="hist-row">
          <span class="score-chip ${at.pass ? "pass" : "fail"}">${at.scaled}</span>
          <span class="hist-meta">${esc(new Date(at.date).toLocaleDateString())} · ${at.length}-item · ${at.correct}/${at.total}${at.scenarios ? ` · scenarios ${at.scenarios.join(", ")}` : ""}</span>
          <span class="hist-pct">${pct(at.correct, at.total)}%</span>
        </div>`)));
    }
    app.appendChild(wrap);
    renderPlan();
  }

  /* ============================================================================
     PRACTICE SETUP
     ========================================================================= */
  views.quiz = function () {
    if (session && !session.finished && !session.exam) return renderRun();
    renderQuizSetup();
  };

  function renderQuizSetup() {
    const st = load();
    const best = st.best || {};
    const weak = (st.wrong || []).length;
    const bestLine = best.pct != null
      ? `<span class="badge-best">Best practice score: ${best.pct}% (${best.correct}/${best.total})</span>` : "";

    const wrap = el(`<div>
      <h1>Practice</h1>
      <p class="lead">Free practice with immediate correction. ${bestLine}</p>
      <div class="btn-row" style="margin-bottom:12px">
        <button class="btn ghost" id="diag">10-question diagnostic</button>
        <button class="btn ghost" id="weak"${weak ? "" : " disabled"}>Weak spots (${weak})</button>
      </div>
      <div class="card">
        <div class="field-lbl">Domains</div>
        <div class="chips" id="chips"><button class="chip on" data-all>All domains</button></div>
        <div id="subBox" hidden>
          <div class="field-lbl">${esc(EXAM_INFO.subLabelPlural)} (optional)</div>
          <div class="chips" id="subs"></div>
        </div>
        ${HAS_SCENARIOS ? `<div class="field-lbl">Scenarios</div>
        <div class="chips" id="scens"><button class="chip on" data-all>All scenarios</button></div>` : ""}
        <div class="field-lbl">Number of questions</div>
        <div class="chips" id="counts"></div>
        <div class="field-lbl">Correction</div>
        <div class="chips" id="mode">
          <button class="chip on" data-mode="immediate">Immediate (after each question)</button>
          <button class="chip" data-mode="end">At the end</button>
        </div>
        <div class="spacer"></div>
        <div class="btn-row"><button class="btn" id="startBtn">Start</button></div>
        <p class="hint" id="poolInfo" style="margin-top:10px"></p>
      </div>
    </div>`);

    const selDomains = new Set();
    const selSubs = new Set();
    const selScens = new Set();
    let selCount = 15;
    let mode = "immediate";

    const chips = wrap.querySelector("#chips");
    DOMAINS.forEach((d) => chips.appendChild(el(`<button class="chip" data-dom="${d.id}">${d.id}. ${esc(d.nom)}</button>`)));
    const subBox = wrap.querySelector("#subBox");
    const subs = wrap.querySelector("#subs");
    const scens = wrap.querySelector("#scens");
    if (scens) SCENARIOS.forEach((s) => scens.appendChild(el(`<button class="chip" data-scen="${s.id}">S${s.id}. ${esc(s.nom)}</button>`)));
    const counts = wrap.querySelector("#counts");
    [10, 15, 20, 30, "Max"].forEach((c) => counts.appendChild(el(`<button class="chip${c === 15 ? " on" : ""}" data-count="${c}">${c}</button>`)));

    const filter = (q) =>
      (!selDomains.size || selDomains.has(q.domain)) &&
      (!selSubs.size || selSubs.has(q.skill)) &&
      (!selScens.size || selScens.has(q.scenario));
    const updateInfo = () => {
      const p = QUESTIONS.filter(filter).length;
      const n = selCount === "Max" ? p : Math.min(selCount, p);
      wrap.querySelector("#poolInfo").textContent = `${n} question(s) drawn from ${p} available.`;
    };
    /* Sub-skill chips appear only when exactly one domain is selected. */
    const renderSubs = () => {
      selSubs.clear(); subs.innerHTML = "";
      if (selDomains.size !== 1) { subBox.hidden = true; return; }
      const d = domain([...selDomains][0]);
      d.skills.forEach((s) => subs.appendChild(el(`<button class="chip" data-sub="${esc(s.nom)}">${esc(s.nom)}</button>`)));
      subBox.hidden = false;
    };
    const toggleGroup = (box, set, attr, parse) => (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      if (b.hasAttribute("data-all")) {
        set.clear();
        box.querySelectorAll(`[${attr}]`).forEach((x) => x.classList.remove("on"));
        b.classList.add("on");
      } else {
        const v = parse(b.getAttribute(attr));
        b.classList.toggle("on");
        if (b.classList.contains("on")) set.add(v); else set.delete(v);
        const all = box.querySelector("[data-all]"); if (all) all.classList.toggle("on", set.size === 0);
      }
    };
    chips.addEventListener("click", (e) => { toggleGroup(chips, selDomains, "data-dom", Number)(e); renderSubs(); updateInfo(); });
    subs.addEventListener("click", (e) => { toggleGroup(subs, selSubs, "data-sub", String)(e); updateInfo(); });
    if (scens) scens.addEventListener("click", (e) => { toggleGroup(scens, selScens, "data-scen", Number)(e); updateInfo(); });
    counts.addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      counts.querySelectorAll(".chip").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      selCount = b.dataset.count === "Max" ? "Max" : +b.dataset.count;
      updateInfo();
    });
    wrap.querySelector("#mode").addEventListener("click", (e) => {
      const b = e.target.closest(".chip"); if (!b) return;
      wrap.querySelector("#mode").querySelectorAll(".chip").forEach((x) => x.classList.remove("on"));
      b.classList.add("on"); mode = b.dataset.mode;
    });
    wrap.querySelector("#startBtn").addEventListener("click", () => {
      const items = buildPracticeSet(filter, selCount, { grouped: selScens.size > 0 });
      if (!items.length) { alert("No questions match that selection."); return; }
      startSession({ items, mode, exam: null });
    });
    wrap.querySelector("#diag").addEventListener("click", startDiagnostic);
    wrap.querySelector("#weak").addEventListener("click", startWeakSpots);

    app.appendChild(wrap);
    updateInfo();
  }

  /* ============================================================================
     SESSION RUN (shared by practice, diagnostic and exam)
     ========================================================================= */
  function startSession({ items, mode = "immediate", exam = null, kind = "practice" }) {
    session = { items, i: 0, answers: [], mode, exam, kind, finished: false, startedAt: Date.now() };
    setActive(exam ? "exam" : "quiz");
    app.innerHTML = ""; window.scrollTo(0, 0);
    renderRun();
  }

  let timerHandle = null;
  function stopTimer() { if (timerHandle) { clearInterval(timerHandle); timerHandle = null; } }

  /* Scenario context: full card at the first question of a scenario group,
     a collapsed reminder on the following ones. */
  function scenarioBlock(s) {
    const q = s.items[s.i];
    if (!HAS_SCENARIOS || !q.scenario) return "";
    const sc = scenario(q.scenario);
    const first = s.i === 0 || s.items[s.i - 1].scenario !== q.scenario;
    return first
      ? `<div class="card scen-ctx"><div class="scen-tag">Scenario ${sc.id} · ${esc(sc.nom)}</div><p>${esc(sc.text)}</p></div>`
      : `<details class="scen-mini"><summary>Scenario ${sc.id} · ${esc(sc.nom)}</summary><p>${esc(sc.text)}</p></details>`;
  }

  function renderRun() {
    stopTimer();
    app.innerHTML = "";
    const s = session;
    const q = s.items[s.i];
    const d = domain(q.domain);
    const total = s.items.length;
    if (!s.answers[s.i]) s.answers[s.i] = { picked: [], checked: false };
    const a = s.answers[s.i];
    const isExam = !!s.exam;
    const showCorrection = s.mode === "immediate";
    const nSel = q._multi ? q.correct.length : 1;
    let label = "Practice";
    if (isExam) label = `${s.exam.length}-item mock exam`;
    else if (s.kind === "diagnostic") label = "Diagnostic";
    else if (s.kind === "weak") label = "Weak spots";

    const wrap = el(`<div>
      <div class="q-top">
        <span>Question ${s.i + 1} / ${total} · ${label}</span>
        <span class="q-top-right">
          ${isExam && s.exam.timer ? `<span id="clock" class="clock">–:–</span>` : ""}
          <span>${q._multi ? `Multiple response · select ${nSel}` : "Single answer"}</span>
        </span>
      </div>
      <div class="progress"><div style="width:${(s.i / total) * 100}%"></div></div>
      ${scenarioBlock(s)}
      <div class="card">
        <div class="q-meta">
          <span class="q-badge" style="background:${d.couleur}22;color:${d.couleur}">D${d.id} · ${esc(d.nom)}</span>
          ${q.official ? '<span class="q-badge official">Exam-guide sample</span>' : ""}
          <span>${esc(q.skill)}</span>
        </div>
        <div class="q-text">${fmt(q.q)}</div>
        <div class="opts" id="opts"></div>
        <div id="explBox"></div>
        <div class="btn-row" id="controls"></div>
      </div>
    </div>`);

    const optsBox = wrap.querySelector("#opts");
    const letters = "ABCDEFGH";
    q.options.forEach((opt, idx) => optsBox.appendChild(el(`<div class="opt${q._multi ? " multi" : ""}" data-idx="${idx}">
        <span class="mk">${letters[idx]}</span><span class="opt-txt">${fmt(opt)}</span></div>`)));

    const controls = wrap.querySelector("#controls");
    const explBox = wrap.querySelector("#explBox");

    const renderControls = () => {
      controls.innerHTML = "";
      const last = s.i === total - 1;
      if (showCorrection && !a.checked) {
        const validate = el(`<button class="btn" ${a.picked.length ? "" : "disabled"}>Check answer</button>`);
        validate.addEventListener("click", check);
        controls.appendChild(validate);
      } else {
        const nx = el(`<button class="btn">${last ? (isExam ? "Submit exam" : "See my results") : "Next question →"}</button>`);
        nx.addEventListener("click", last ? finish : next); controls.appendChild(nx);
        if (s.i > 0) {
          const pv = el(`<button class="btn ghost">← Previous</button>`);
          pv.addEventListener("click", prev); controls.appendChild(pv);
        }
      }
      const quit = el(`<button class="btn ghost">Quit</button>`);
      quit.addEventListener("click", () => {
        if (confirm("Quit? Progress will be lost.")) { stopTimer(); session = null; go(isExam ? "exam" : "quiz"); }
      });
      controls.appendChild(quit);
    };

    const paint = () => {
      [...optsBox.children].forEach((o) => {
        const idx = +o.dataset.idx;
        o.classList.remove("sel", "correct", "wrong", "locked");
        if (showCorrection && a.checked) {
          o.classList.add("locked");
          if (q.correct.includes(idx)) o.classList.add("correct");
          else if (a.picked.includes(idx)) o.classList.add("wrong");
        } else if (a.picked.includes(idx)) o.classList.add("sel");
      });
    };

    optsBox.addEventListener("click", (e) => {
      const o = e.target.closest(".opt"); if (!o) return;
      if (showCorrection && a.checked) return;
      const idx = +o.dataset.idx;
      if (q._multi) a.picked = a.picked.includes(idx) ? a.picked.filter((x) => x !== idx) : a.picked.concat(idx);
      else a.picked = [idx];
      paint(); renderControls();
    });

    const explHtml = (ok) => `<div class="expl ${ok ? "ok" : "ko"}">
        <strong>${ok ? "✓ Correct" : "✗ Incorrect"}${q._multi ? ` — correct: ${q.correct.map((i) => letters[i]).join(", ")}` : ""}</strong>
        ${fmt(q.expl)}</div>`;
    function check() {
      if (!a.picked.length) return;
      a.checked = true;
      a.correct = arrEq(a.picked, q.correct);
      paint(); renderControls();
      explBox.innerHTML = "";
      explBox.appendChild(el(explHtml(a.correct)));
    }
    function next() { s.i++; renderRun(); }
    function prev() { s.i--; renderRun(); }
    function finish() { stopTimer(); computeFinal(); renderResults(); }

    paint(); renderControls();
    if (showCorrection && a.checked) explBox.appendChild(el(explHtml(arrEq(a.picked, q.correct))));
    app.appendChild(wrap);

    if (isExam && s.exam.timer) {
      const clock = wrap.querySelector("#clock");
      const tick = () => {
        const left = s.exam.budgetSeconds - Math.floor((Date.now() - s.startedAt) / 1000);
        const v = Math.abs(left);
        clock.textContent = `${left < 0 ? "+" : ""}${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
        clock.classList.toggle("over", left < 0);
      };
      tick();
      timerHandle = setInterval(tick, 1000);
    }
  }

  /* ============================================================================
     RESULTS
     ========================================================================= */
  function computeFinal() {
    const s = session;
    s.items.forEach((q, i) => {
      const a = s.answers[i] || (s.answers[i] = { picked: [], checked: false });
      a.correct = arrEq(a.picked || [], q.correct);
    });
    s.finished = true;

    const total = s.items.length;
    const correct = s.answers.filter((a) => a && a.correct).length;
    const scaled = scaleScore(correct, total);
    const pass = scaled >= PASS_SCALED;
    const perDomain = DOMAINS.map((d) => {
      let c = 0, t = 0;
      s.items.forEach((q, i) => { if (q.domain !== d.id) return; t++; if (s.answers[i].correct) c++; });
      return { id: d.id, correct: c, drawn: t, weight: d.poids };
    });
    s.result = { correct, total, pct: pct(correct, total), scaled, pass, perDomain,
      elapsed: Math.floor((Date.now() - s.startedAt) / 1000) };

    const st = load();
    /* Weak-spot memory: an id enters on a miss and leaves on a later hit. */
    const wrong = new Set(st.wrong || []);
    s.items.forEach((q, i) => { if (s.answers[i].correct) wrong.delete(q.id); else wrong.add(q.id); });
    st.wrong = [...wrong];

    if (s.exam) {
      st.attempts = st.attempts || [];
      st.attempts.unshift({
        date: new Date().toISOString(), length: s.exam.length, correct, total, scaled, pass, perDomain,
        scenarios: s.exam.scenarios || null,
        wrongIds: s.items.filter((q, i) => !s.answers[i].correct).map((q) => q.id),
      });
      st.attempts = st.attempts.slice(0, MAX_ATTEMPTS_STORED);
    } else if (s.kind === "practice" && (!st.best || s.result.pct > st.best.pct)) {
      st.best = { pct: s.result.pct, correct, total };
    }
    save(st);
  }

  function renderResults() {
    app.innerHTML = "";
    const s = session;
    const r = s.result;
    const isExam = !!s.exam;
    const letters = "ABCDEFGH";
    const mmss = `${Math.floor(r.elapsed / 60)} min ${String(r.elapsed % 60).padStart(2, "0")} s`;
    const passPct = Math.ceil(((PASS_SCALED - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 1000) / 10;

    const hero = isExam
      ? `<div class="card score-hero">
          <div class="score-ring ${r.pass ? "pass" : "fail"}">${r.scaled}</div>
          <div class="score-sub">${r.correct} / ${r.total} correct · ${r.pct}% · ${esc(mmss)}</div>
          <div class="verdict ${r.pass ? "pass" : "fail"}">${r.pass ? `Pass — at or above ${PASS_SCALED}` : `Below the ${PASS_SCALED} pass mark`}</div>
          <p class="hint" style="margin-top:12px">Scaled linearly onto ${SCALE_MIN}–${SCALE_MAX}, so ${PASS_SCALED} sits at
          ${passPct}% correct. The real exam uses a scaled score set by a standard-setting study, so its raw-to-scaled
          mapping differs — treat this as an approximation, not a prediction.</p>
        </div>`
      : `<div class="card score-hero">
          <div class="score-ring">${r.pct}%</div>
          <div class="score-sub">${r.correct} / ${r.total} correct · ${esc(mmss)}</div>
          <p class="hint" style="margin-top:12px">${s.kind === "diagnostic"
            ? "Diagnostic: two questions per domain — use the breakdown below to decide where to start."
            : "Practice sets are not blueprint-weighted, so no scaled score is shown."}</p>
        </div>`;

    let title = "Practice results";
    if (isExam) title = "Mock exam results";
    else if (s.kind === "diagnostic") title = "Diagnostic results";
    const wrap = el(`<div>
      <h1>${title}</h1>
      ${hero}
      <h2>By domain</h2>
      <div class="card" id="byDom"></div>
      <h2>Question review</h2>
      <div class="card" id="review"></div>
      <div class="btn-row" style="margin-top:16px">
        <button class="btn" id="again">${isExam ? "New mock exam" : "New practice set"}</button>
        <button class="btn ghost" id="homeBtn">Home</button>
      </div>
    </div>`);

    const bd = wrap.querySelector("#byDom");
    r.perDomain.forEach((row) => {
      const d = domain(row.id);
      const p = row.drawn ? pct(row.correct, row.drawn) : null;
      const node = el(`<div class="bp-row" style="cursor:default">
        <div class="bp-name">${d.id}. ${esc(d.nom)} <span class="bp-weight">${d.poids}%</span></div>
        <div class="bp-track"><div class="bp-fill" style="width:0%;background:${d.couleur}"></div></div>
        <div class="bp-val">${row.drawn ? `${row.correct}/${row.drawn} · ${p}%` : "—"}</div>
      </div>`);
      bd.appendChild(node);
      if (row.drawn) requestAnimationFrame(() => { node.querySelector(".bp-fill").style.width = p + "%"; });
    });
    bd.appendChild(el(`<p class="hint" style="margin:10px 0 0">As on the real score report, per-domain percentages are informational: pass or fail rests on the total scaled score alone.</p>`));

    const rv = wrap.querySelector("#review");
    s.items.forEach((q, i) => {
      const a = s.answers[i] || { picked: [] };
      const ok = a.correct;
      const yours = (a.picked || []).map((x) => letters[x]).sort().join(", ") || "—";
      const good = q.correct.map((x) => letters[x]).sort().join(", ");
      rv.appendChild(el(`<div class="review-item">
        <div class="review-q"><span class="tag ${ok ? "ok" : "ko"}">${ok ? "OK" : "KO"}</span>
          <span class="review-dom">D${q.domain}${q.scenario ? ` · S${q.scenario}` : ""}</span> ${fmt(q.q)}</div>
        <ol class="review-opts">${q.options.map((o, oi) => `<li class="${q.correct.includes(oi) ? "good" : ""}${(a.picked || []).includes(oi) && !q.correct.includes(oi) ? " bad" : ""}">${fmt(o)}</li>`).join("")}</ol>
        <div class="hint" style="margin:6px 0 4px">Your answer: ${yours} · Correct: ${good}</div>
        <div class="expl ${ok ? "ok" : "ko"}" style="margin-top:6px">${fmt(q.expl)}</div>
      </div>`));
    });

    wrap.querySelector("#again").addEventListener("click", () => { const e = isExam; session = null; go(e ? "exam" : "quiz"); });
    wrap.querySelector("#homeBtn").addEventListener("click", () => { session = null; go("home"); });
    app.appendChild(wrap);
  }

  /* ============================================================================
     CHEAT SHEET
     ========================================================================= */
  views.cheatsheet = function () {
    const wrap = el(`<div>
      <h1>Cheat sheet</h1>
      <p class="lead">Every key takeaway from the ${DOMAINS.length} domains on one page, heaviest domain first.</p>
      <div id="cheat"></div>
    </div>`);
    const c = wrap.querySelector("#cheat");
    DOMAINS.slice().sort((a, b) => b.poids - a.poids).forEach((d) => {
      const block = el(`<div class="card cheat-dom">
        <h3><span class="pill" style="background:${d.couleur}">D${d.id} · ${d.poids}%</span> ${esc(d.nom)}</h3>
        <ul class="cheat-list"></ul></div>`);
      const ul = block.querySelector("ul");
      d.cles.forEach((k) => ul.appendChild(el(`<li>${fmt(k)}</li>`)));
      c.appendChild(block);
    });
    app.appendChild(wrap);
  };

  /* ---------- dev helper: parity checks from tools/ ---------- */
  window.CCAR_DEV = { allocateByWeight, examAllocation, scaleScore, prepareItems, buildExamSet, buildDiagnostic, openLesson, openOverview };

  /* Lesson links ({{1.5}}, map boxes) and "big picture" links, wherever they are rendered. */
  app.addEventListener("click", (e) => {
    const big = e.target.closest("[data-big]");
    if (big) { e.preventDefault(); openOverview(); return; }
    const link = e.target.closest("[data-lesson]");
    if (link && LESSONS.some((l) => l.id === link.dataset.lesson)) { e.preventDefault(); openLesson(link.dataset.lesson); }
  });

  go("home");
})();
