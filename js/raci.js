// raci.js — RACI simple (acteurs + activités manuelles)

(function () {
  const containerId = "raciContainer";

  let actors = ["Robert", "Denise", "Michèle"];
  let activities = ["Évaluer l’existant", "Définir attentes utilisateurs", "Définir attentes contenu"];

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

    const headCols = actors.map(a => `<th>${escapeHtml(a)}</th>`).join("");

    const bodyRows = activities.map((act, i) => {
      const cols = actors.map((_, j) => `
        <td>
          <select data-act="${i}" data-actor="${j}">
            <option value=""></option>
            <option value="R">R</option>
            <option value="A">A</option>
            <option value="C">C</option>
            <option value="I">I</option>
          </select>
        </td>
      `).join("");

      return `<tr>
        <td><input type="text" class="raci-act" data-actname="${i}" value="${escapeHtml(act)}" /></td>
        ${cols}
      </tr>`;
    }).join("");

    el.innerHTML = `
      <div class="section-actions">
        <button id="raciAddActor">+ Acteur</button>
        <button id="raciAddActivity">+ Activité</button>
      </div>

      <div style="padding: 0 16px 16px;">
        <div style="overflow:auto;">
          <table class="raci-table">
            <thead>
              <tr>
                <th>Activités</th>
                ${headCols}
              </tr>
            </thead>
            <tbody>
              ${bodyRows}
            </tbody>
          </table>
        </div>
        <div class="raci-legend">R = Responsable • A = Accountable • C = Consulté • I = Informé</div>
      </div>
    `;

    bind();
  }

  function bind() {
    document.getElementById("raciAddActor")?.addEventListener("click", () => {
      const name = prompt("Nom de l’acteur ?");
      if (!name) return;
      actors.push(name);
      render();
    });

    document.getElementById("raciAddActivity")?.addEventListener("click", () => {
      activities.push("Nouvelle activité");
      render();
    });

    document.querySelectorAll(".raci-act").forEach(input => {
      input.addEventListener("input", () => {
        const idx = Number(input.getAttribute("data-actname"));
        activities[idx] = input.value;
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