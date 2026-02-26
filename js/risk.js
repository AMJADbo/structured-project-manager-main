// risks.js — Registre des risques (CRUD) + gravité auto (P x I) + localStorage
(function () {
  const containerId = "risksContainer";
  const STORAGE_KEY = "spm_risks_v1";

  // Probabilité / Impact sur 1..5 (classique)
  const SCALE = [1, 2, 3, 4, 5];

  let rows = load() || [
    {
      id: uid(),
      risk: "Retard sur la définition des besoins",
      prob: 3,
      impact: 4,
      action: "Planifier un atelier MOA/MOE + valider le périmètre",
      owner: "Chef de projet",
    },
  ];

  function uid() {
    return "r_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
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

  function severity(prob, impact) {
    const p = Number(prob) || 0;
    const i = Number(impact) || 0;
    return p * i;
  }

  function severityLabel(score) {
    if (score >= 16) return { txt: "Critique", cls: "sev-crit" };
    if (score >= 9) return { txt: "Élevé", cls: "sev-high" };
    if (score >= 4) return { txt: "Moyen", cls: "sev-med" };
    return { txt: "Faible", cls: "sev-low" };
  }

  function render() {
    const root = document.getElementById(containerId);
    if (!root) return;

    root.innerHTML = `
      <div class="section-actions">
        <button id="riskAdd">+ Risque</button>
      </div>

      <div style="padding: 0 16px 16px;">
        <div style="overflow:auto;">
          <table class="fin-table risk-table">
            <thead>
              <tr>
                <th>Risque</th>
                <th>Probabilité (1-5)</th>
                <th>Impact (1-5)</th>
                <th>Gravité</th>
                <th>Plan d’action</th>
                <th>Responsable</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${rows.map((r, i) => rowHtml(r, i)).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;

    bind(root);
  }

  function rowHtml(r, i) {
    const score = severity(r.prob, r.impact);
    const lab = severityLabel(score);

    return `
      <tr data-i="${i}">
        <td>
          <input type="text" class="risk-risk" value="${esc(r.risk || "")}" placeholder="Décris le risque" />
        </td>

        <td>
          <select class="risk-prob">
            ${SCALE.map(v => `<option value="${v}" ${Number(r.prob) === v ? "selected" : ""}>${v}</option>`).join("")}
          </select>
        </td>

        <td>
          <select class="risk-impact">
            ${SCALE.map(v => `<option value="${v}" ${Number(r.impact) === v ? "selected" : ""}>${v}</option>`).join("")}
          </select>
        </td>

        <td>
          <span class="risk-sev ${lab.cls}">${score} — ${lab.txt}</span>
        </td>

        <td>
          <input type="text" class="risk-action" value="${esc(r.action || "")}" placeholder="Plan de mitigation / action" />
        </td>

        <td>
          <input type="text" class="risk-owner" value="${esc(r.owner || "")}" placeholder="Responsable" />
        </td>

        <td style="text-align:right;">
          <button class="risk-del">Suppr</button>
        </td>
      </tr>
    `;
  }

  function bind(root) {
    root.querySelector("#riskAdd")?.addEventListener("click", () => {
      rows.push({
        id: uid(),
        risk: "",
        prob: 1,
        impact: 1,
        action: "",
        owner: "",
      });
      save();
      render();
    });

    // inputs
    root.addEventListener("input", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;

      const tr = t.closest("tr[data-i]");
      if (!tr) return;

      const i = Number(tr.getAttribute("data-i"));
      if (Number.isNaN(i)) return;

      if (t.classList.contains("risk-risk")) rows[i].risk = t.value;
      if (t.classList.contains("risk-action")) rows[i].action = t.value;
      if (t.classList.contains("risk-owner")) rows[i].owner = t.value;

      save();
    });

    // selects (prob/impact)
    root.addEventListener("change", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;

      const tr = t.closest("tr[data-i]");
      if (!tr) return;

      const i = Number(tr.getAttribute("data-i"));
      if (Number.isNaN(i)) return;

      if (t.classList.contains("risk-prob")) rows[i].prob = Number(t.value) || 1;
      if (t.classList.contains("risk-impact")) rows[i].impact = Number(t.value) || 1;

      save();
      render(); // recalcul gravité + badge
    });

    // delete
    root.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof HTMLElement)) return;

      if (!t.classList.contains("risk-del")) return;

      const tr = t.closest("tr[data-i]");
      if (!tr) return;

      const i = Number(tr.getAttribute("data-i"));
      if (Number.isNaN(i)) return;

      const ok = confirm("Supprimer ce risque ?");
      if (!ok) return;

      rows.splice(i, 1);
      save();
      render();
    });
  }

  function injectMinimalCss() {
    const id = "risk_min_css";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .risk-sev{
        display:inline-flex;
        align-items:center;
        gap:8px;
        padding:6px 10px;
        border-radius:999px;
        font-weight:900;
        border:1px solid rgba(230,238,242,.9);
        white-space:nowrap;
      }
      .sev-low{ background: rgba(159,231,245,.18); color:#053F5C; }
      .sev-med{ background: rgba(247,173,25,.18); color:#1b1200; }
      .sev-high{ background: rgba(247,173,25,.35); color:#1b1200; }
      .sev-crit{ background: rgba(247,173,25,.55); color:#1b1200; }
      .risk-table select{ min-width:64px; }
    `;
    document.head.appendChild(style);
  }

  function init() {
    injectMinimalCss();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();