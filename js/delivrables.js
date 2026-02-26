// deliverables.js — Tableau des livrables (CRUD simple) + localStorage
(function () {
  const containerId = "deliverablesContainer";
  const STORAGE_KEY = "spm_deliverables_v1";

  const STATUS = [
    { id: "todo", label: "À faire" },
    { id: "doing", label: "En cours" },
    { id: "done", label: "Terminé" },
    { id: "late", label: "En retard" },
  ];

  let rows = load() || [
    {
      id: uid(),
      name: "Cahier des charges",
      desc: "Document de besoins + périmètre",
      owner: "Chef de projet",
      date: "",
      status: "todo",
    },
  ];

  function uid() {
    return "d_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
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

  function render() {
    const root = document.getElementById(containerId);
    if (!root) return;

    root.innerHTML = `
      <div class="section-actions">
        <button id="delivAdd">+ Livrable</button>
        <button id="delivReset" class="wbs-btn danger" style="display:none"></button>
      </div>

      <div style="padding: 0 16px 16px;">
        <div style="overflow:auto;">
          <table class="fin-table deliv-table">
            <thead>
              <tr>
                <th>Livrable</th>
                <th>Description</th>
                <th>Responsable</th>
                <th>Date</th>
                <th>Statut</th>
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
    return `
      <tr data-i="${i}">
        <td>
          <input type="text" class="deliv-name" value="${esc(r.name || "")}" placeholder="Nom du livrable" />
        </td>
        <td>
          <input type="text" class="deliv-desc" value="${esc(r.desc || "")}" placeholder="Description" />
        </td>
        <td>
          <input type="text" class="deliv-owner" value="${esc(r.owner || "")}" placeholder="Responsable" />
        </td>
        <td>
          <input type="date" class="deliv-date" value="${esc(r.date || "")}" />
        </td>
        <td>
          <select class="deliv-status">
            ${STATUS.map(s => `<option value="${s.id}" ${r.status === s.id ? "selected" : ""}>${s.label}</option>`).join("")}
          </select>
        </td>
        <td style="text-align:right;">
          <button class="deliv-del">Suppr</button>
        </td>
      </tr>
    `;
  }

  function bind(root) {
    root.querySelector("#delivAdd")?.addEventListener("click", () => {
      rows.push({
        id: uid(),
        name: "",
        desc: "",
        owner: "",
        date: "",
        status: "todo",
      });
      save();
      render();
    });

    // Event delegation sur le tableau
    root.addEventListener("input", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;

      const tr = target.closest("tr[data-i]");
      if (!tr) return;

      const i = Number(tr.getAttribute("data-i"));
      if (Number.isNaN(i)) return;

      if (target.classList.contains("deliv-name")) rows[i].name = target.value;
      if (target.classList.contains("deliv-desc")) rows[i].desc = target.value;
      if (target.classList.contains("deliv-owner")) rows[i].owner = target.value;
      if (target.classList.contains("deliv-date")) rows[i].date = target.value;

      save();
    });

    root.addEventListener("change", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;

      const tr = target.closest("tr[data-i]");
      if (!tr) return;

      const i = Number(tr.getAttribute("data-i"));
      if (Number.isNaN(i)) return;

      if (target.classList.contains("deliv-status")) {
        rows[i].status = target.value;
        save();
      }
    });

    root.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;

      if (!target.classList.contains("deliv-del")) return;

      const tr = target.closest("tr[data-i]");
      if (!tr) return;

      const i = Number(tr.getAttribute("data-i"));
      if (Number.isNaN(i)) return;

      const ok = confirm("Supprimer ce livrable ?");
      if (!ok) return;

      rows.splice(i, 1);
      save();
      render();
    });
  }

  function init() {
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();