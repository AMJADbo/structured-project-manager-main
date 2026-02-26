// pert.js — Tableau PERT (ES/EF/LS/LF/Marge) + localStorage
(function () {
  const containerId = "pertContainer";
  const STORAGE_KEY = "spm_pert_v1";

  // modèle: {id, code, name, duration, deps:"A,B"}
  let tasks = load() || [
    { id: uid(), code: "A", name: "Cadrage", duration: 2, deps: "" },
    { id: uid(), code: "B", name: "Design", duration: 3, deps: "A" },
    { id: uid(), code: "C", name: "Dev", duration: 5, deps: "B" },
  ];

  function uid() {
    return "p_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function esc(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function parseDeps(s) {
    return String(s || "")
      .split(",")
      .map(x => x.trim())
      .filter(Boolean);
  }

  function compute() {
    // map code -> task
    const byCode = new Map();
    tasks.forEach(t => byCode.set(String(t.code || "").trim(), t));

    // adjacency + indegree
    const indeg = new Map();
    const succ = new Map();
    tasks.forEach(t => {
      const c = String(t.code || "").trim();
      indeg.set(c, 0);
      succ.set(c, []);
    });

    // deps list for each task
    const depsMap = new Map();
    tasks.forEach(t => {
      const c = String(t.code || "").trim();
      const deps = parseDeps(t.deps);
      depsMap.set(c, deps);
      deps.forEach(d => {
        if (!succ.has(d)) succ.set(d, []);
        succ.get(d).push(c);
        indeg.set(c, (indeg.get(c) || 0) + 1);
      });
    });

    // topo (Kahn)
    const q = [];
    indeg.forEach((v, k) => { if (v === 0) q.push(k); });
    const order = [];
    while (q.length) {
      const n = q.shift();
      order.push(n);
      (succ.get(n) || []).forEach(m => {
        indeg.set(m, indeg.get(m) - 1);
        if (indeg.get(m) === 0) q.push(m);
      });
    }

    const hasCycle = order.length !== tasks.length;
    const ES = new Map(), EF = new Map(), LS = new Map(), LF = new Map();

    // forward pass
    order.forEach(c => {
      const t = byCode.get(c);
      const dur = Number(t?.duration) || 0;
      const deps = depsMap.get(c) || [];
      const es = deps.length ? Math.max(...deps.map(d => EF.get(d) ?? 0)) : 0;
      ES.set(c, es);
      EF.set(c, es + dur);
    });

    const projectDuration = order.length ? Math.max(...order.map(c => EF.get(c) ?? 0)) : 0;

    // backward pass
    const rev = [...order].reverse();
    rev.forEach(c => {
      const t = byCode.get(c);
      const dur = Number(t?.duration) || 0;
      const s = succ.get(c) || [];
      const lf = s.length ? Math.min(...s.map(x => LS.get(x) ?? projectDuration)) : projectDuration;
      LF.set(c, lf);
      LS.set(c, lf - dur);
    });

    const rows = tasks.map(t => {
      const c = String(t.code || "").trim();
      const es = ES.get(c) ?? 0;
      const ef = EF.get(c) ?? 0;
      const ls = LS.get(c) ?? 0;
      const lf = LF.get(c) ?? 0;
      const slack = ls - es; // marge totale
      return { ...t, ES: es, EF: ef, LS: ls, LF: lf, slack };
    });

    return { rows, projectDuration, hasCycle };
  }

  function render() {
    const root = document.getElementById(containerId);
    if (!root) return;

    const { rows, projectDuration, hasCycle } = compute();

    root.innerHTML = `
      <div class="section-actions">
        <button id="pertAdd">+ Tâche</button>
      </div>

      <div style="padding: 0 16px 16px;">
        ${hasCycle ? `<div class="alert">⚠️ Dépendances invalides (cycle ou code manquant). Corrige “Dépendances”.</div>` : ""}
        <div class="pert-meta">Durée projet (calculée) : <b>${projectDuration}</b></div>

        <div style="overflow:auto;">
          <table class="fin-table pert-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Tâche</th>
                <th>Durée</th>
                <th>Dépendances (codes)</th>
                <th>ES</th>
                <th>EF</th>
                <th>LS</th>
                <th>LF</th>
                <th>Marge</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => `
                <tr data-i="${i}" class="${r.slack === 0 ? "crit" : ""}">
                  <td><input class="p-code" value="${esc(r.code)}" placeholder="A"/></td>
                  <td><input class="p-name" value="${esc(r.name)}" placeholder="Nom"/></td>
                  <td><input class="p-dur" type="number" min="0" value="${esc(r.duration)}" style="max-width:90px"/></td>
                  <td><input class="p-deps" value="${esc(r.deps)}" placeholder="A,B"/></td>
                  <td>${r.ES}</td>
                  <td>${r.EF}</td>
                  <td>${r.LS}</td>
                  <td>${r.LF}</td>
                  <td><b>${r.slack}</b></td>
                  <td style="text-align:right;"><button class="p-del">Suppr</button></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <div class="pert-hint">Astuce : une ligne en surbrillance = <b>marge 0</b> (chemin critique).</div>
      </div>
    `;

    bind(root);
  }

  function bind(root) {
    root.querySelector("#pertAdd")?.addEventListener("click", () => {
      tasks.push({ id: uid(), code: "", name: "", duration: 1, deps: "" });
      save(); render();
    });

    root.addEventListener("input", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      const tr = t.closest("tr[data-i]");
      if (!tr) return;
      const i = Number(tr.getAttribute("data-i"));
      if (Number.isNaN(i)) return;

      if (t.classList.contains("p-code")) tasks[i].code = t.value.trim();
      if (t.classList.contains("p-name")) tasks[i].name = t.value;
      if (t.classList.contains("p-dur")) tasks[i].duration = Number(t.value) || 0;
      if (t.classList.contains("p-deps")) tasks[i].deps = t.value;

      save();
      render(); // recalcul direct
    });

    root.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (!t.classList.contains("p-del")) return;

      const tr = t.closest("tr[data-i]");
      if (!tr) return;
      const i = Number(tr.getAttribute("data-i"));
      if (Number.isNaN(i)) return;

      if (!confirm("Supprimer cette tâche ?")) return;
      tasks.splice(i, 1);
      save(); render();
    });
  }

  function init() { render(); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();