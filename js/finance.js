// finance.js — tableau financier simple (lignes + total)

(function () {
  const containerId = "financeContainer";
  const months = ["Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre"];

  let rows = [
    { task: "A", budget: 20, m: [20, 0, 0, 0, 0, 0] },
    { task: "B", budget: 250, m: [0, 50, 100, 100, 0, 0] },
    { task: "C", budget: 200, m: [0, 0, 0, 0, 80, 120] },
  ];

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function render() {
    const el = document.getElementById(containerId);
    if (!el) return;

    const head = months.map(m => `<th>${m}</th>`).join("");

    const body = rows.map((r, i) => {
      const monthCells = r.m.map((v, j) =>
        `<td><input type="number" class="fin-m" data-i="${i}" data-j="${j}" value="${v}" /></td>`
      ).join("");

      return `<tr>
        <td><input type="text" class="fin-task" data-i="${i}" value="${escapeHtml(r.task)}" /></td>
        <td><input type="number" class="fin-budget" data-i="${i}" value="${r.budget}" /></td>
        ${monthCells}
        <td><button class="fin-del" data-i="${i}">Suppr</button></td>
      </tr>`;
    }).join("");

    const totals = calcTotals();
    const totalRow = `
      <tr class="fin-total">
        <td><b>TOTAL</b></td>
        <td><b>${totals.budget}</b></td>
        ${totals.months.map(v => `<td><b>${v}</b></td>`).join("")}
        <td></td>
      </tr>
    `;

    el.innerHTML = `
      <div class="section-actions">
        <button id="finAddRow">+ Ligne</button>
      </div>

      <div style="padding: 0 16px 16px;">
        <div style="overflow:auto;">
          <table class="fin-table">
            <thead>
              <tr>
                <th>Tâches</th>
                <th>Budget</th>
                ${head}
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${body}
              ${totalRow}
            </tbody>
          </table>
        </div>
      </div>
    `;

    bind();
  }

  function calcTotals() {
    const budget = rows.reduce((s, r) => s + (Number(r.budget) || 0), 0);
    const monthsTotal = months.map((_, j) =>
      rows.reduce((s, r) => s + (Number(r.m[j]) || 0), 0)
    );
    return { budget, months: monthsTotal };
  }

  function bind() {
    document.getElementById("finAddRow")?.addEventListener("click", () => {
      rows.push({ task: "Nouvelle", budget: 0, m: months.map(() => 0) });
      render();
    });

    document.querySelectorAll(".fin-del").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.getAttribute("data-i"));
        rows.splice(i, 1);
        render();
      });
    });

    document.querySelectorAll(".fin-task").forEach(inp => {
      inp.addEventListener("input", () => {
        const i = Number(inp.getAttribute("data-i"));
        rows[i].task = inp.value;
      });
    });

    document.querySelectorAll(".fin-budget").forEach(inp => {
      inp.addEventListener("input", () => {
        const i = Number(inp.getAttribute("data-i"));
        rows[i].budget = Number(inp.value) || 0;
        render();
      });
    });

    document.querySelectorAll(".fin-m").forEach(inp => {
      inp.addEventListener("input", () => {
        const i = Number(inp.getAttribute("data-i"));
        const j = Number(inp.getAttribute("data-j"));
        rows[i].m[j] = Number(inp.value) || 0;
        render();
      });
    });
  }

  function init() { render(); }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();