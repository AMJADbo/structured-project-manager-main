// kpi.js — Dashboard KPI (Kanban / Finance / Risks / Deliverables)
(function () {
  const ids = {
    progress: "kpiProgress",
    progressHint: "kpiProgressHint",
    budget: "kpiBudget",
    budgetHint: "kpiBudgetHint",
    risks: "kpiRisks",
    risksHint: "kpiRisksHint",
    deliverables: "kpiDeliverables",
    deliverablesHint: "kpiDeliverablesHint",
  };

  const LS = {
    kanban: "spm_kanban_v1",
    risks: "spm_risks_v1",
    deliverables: "spm_deliverables_v1",
  };

  const $ = (id) => document.getElementById(id);

  function parseJSON(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function fmtEuro(n) {
    const v = Number(n) || 0;
    return v.toLocaleString("fr-FR") + " €";
  }

  // --- Kanban progress ---
  function getKanbanProgress() {
    const data = parseJSON(LS.kanban);
    if (!data) return { done: 0, total: 0, pct: 0 };

    const todo = Array.isArray(data.todo) ? data.todo.length : 0;
    const doing = Array.isArray(data.doing) ? data.doing.length : 0;
    const done = Array.isArray(data.done) ? data.done.length : 0;

    const total = todo + doing + done;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  }

  // --- Budget from current finance table (inputs .fin-budget if present) ---
  function getFinanceBudget() {
    const finance = document.getElementById("financeContainer");
    if (!finance) return 0;

    const budgetInputs = finance.querySelectorAll(".fin-budget");
    if (budgetInputs.length) {
      let total = 0;
      budgetInputs.forEach((inp) => (total += Number(inp.value) || 0));
      return total;
    }

    // fallback: read 2nd column numbers (template table)
    const trs = finance.querySelectorAll("table tbody tr");
    let total = 0;
    trs.forEach((tr) => {
      if (tr.classList.contains("fin-total")) return;
      const tds = tr.querySelectorAll("td");
      if (tds.length >= 2) total += Number((tds[1].textContent || "").replace(/\s/g, "")) || 0;
    });
    return total;
  }

  // --- Risks ---
  function sev(prob, impact) {
    return (Number(prob) || 0) * (Number(impact) || 0);
  }

  function getRisksKpi() {
    const data = parseJSON(LS.risks);
    if (!Array.isArray(data)) return { count: 0, crit: 0, high: 0 };

    let crit = 0, high = 0;
    data.forEach((r) => {
      const s = sev(r.prob, r.impact);
      if (s >= 16) crit++;
      else if (s >= 9) high++;
    });

    return { count: data.length, crit, high };
  }

  // --- Deliverables ---
  function getDeliverablesKpi() {
    const data = parseJSON(LS.deliverables);
    if (!Array.isArray(data)) return { done: 0, total: 0 };

    const total = data.length;
    const done = data.filter((d) => d.status === "done").length;
    return { done, total };
  }

  function setText(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
  }

  function update() {
    const p = getKanbanProgress();
    setText(ids.progress, `${p.pct}%`);
    setText(ids.progressHint, `${p.done} / ${p.total} tâches terminées`);

    const budget = getFinanceBudget();
    setText(ids.budget, fmtEuro(budget));
    setText(ids.budgetHint, `Budget estimé`);

    const r = getRisksKpi();
    setText(ids.risks, String(r.count));
    setText(ids.risksHint, `${r.crit} critiques / ${r.high} élevés`);

    const d = getDeliverablesKpi();
    setText(ids.deliverables, `${d.done} / ${d.total}`);
    setText(ids.deliverablesHint, `Terminés`);
  }

  function init() {
    update();

    document.addEventListener("input", () => {
      clearTimeout(window.__kpiT);
      window.__kpiT = setTimeout(update, 200);
    });

    document.addEventListener("change", () => {
      clearTimeout(window.__kpiT);
      window.__kpiT = setTimeout(update, 200);
    });

    window.addEventListener("storage", () => update());

    setInterval(update, 1200);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();