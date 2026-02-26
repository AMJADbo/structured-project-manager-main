// raci.js — RACI (ajout/suppression d'acteurs + activités) avec conservation des choix
(function () {
  const containerId = "raciContainer";

  // État
  let actors = ["Robert", "Denise", "Michèle"];
  let activities = ["Évaluer l’existant", "Définir attentes utilisateurs", "Définir attentes contenu"];

  // matrix[i][j] => "R" | "A" | "C" | "I" | ""
  let matrix = activities.map(() => actors.map(() => ""));

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function ensureMatrixSize() {
    if (!Array.isArray(matrix)) matrix = [];

    // Ajuste le nombre de lignes (activités)
    while (matrix.length < activities.length) matrix.push([]);
    while (matrix.length > activities.length) matrix.pop();

    // Ajuste le nombre de colonnes (acteurs)
    for (let i = 0; i < activities.length; i++) {
      if (!Array.isArray(matrix[i])) matrix[i] = [];
      while (matrix[i].length < actors.length) matrix[i].push("");
      while (matrix[i].length > actors.length) matrix[i].pop();
    }
  }

  function render() {
    const el = document.getElementById(containerId);
    if (!el) return;

    ensureMatrixSize();

    const headCols = actors
      .map(
        (a, j) => `
          <th>
            <div class="raci-th">
              <span>${escapeHtml(a)}</span>
              <button class="raci-del-actor" title="Supprimer cet acteur" data-actor="${j}">×</button>
            </div>
          </th>
        `
      )
      .join("");

    const bodyRows = activities
      .map((act, i) => {
        const cols = actors
          .map((_, j) => {
            const val = matrix?.[i]?.[j] ?? "";
            return `
              <td>
                <select class="raci-cell" data-act="${i}" data-actor="${j}">
                  <option value="" ${val === "" ? "selected" : ""}></option>
                  <option value="R" ${val === "R" ? "selected" : ""}>R</option>
                  <option value="A" ${val === "A" ? "selected" : ""}>A</option>
                  <option value="C" ${val === "C" ? "selected" : ""}>C</option>
                  <option value="I" ${val === "I" ? "selected" : ""}>I</option>
                </select>
              </td>
            `;
          })
          .join("");

        return `
          <tr>
            <td>
              <input type="text" class="raci-act" data-actname="${i}" value="${escapeHtml(act)}" />
            </td>
            ${cols}
          </tr>
        `;
      })
      .join("");

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
    // Ajouter acteur
    document.getElementById("raciAddActor")?.addEventListener("click", () => {
      const name = prompt("Nom de l’acteur ?");
      if (!name) return;
      actors.push(name.trim());
      ensureMatrixSize();
      render();
    });

    // Ajouter activité
    document.getElementById("raciAddActivity")?.addEventListener("click", () => {
      activities.push("Nouvelle activité");
      ensureMatrixSize();
      render();
    });

    // Supprimer acteur
    document.querySelectorAll(".raci-del-actor").forEach((btn) => {
      btn.addEventListener("click", () => {
        const j = Number(btn.getAttribute("data-actor"));
        if (Number.isNaN(j)) return;

        if (actors.length <= 1) {
          alert("Il doit rester au moins 1 acteur.");
          return;
        }

        const ok = confirm(`Supprimer l’acteur : ${actors[j]} ?`);
        if (!ok) return;

        actors.splice(j, 1);
        for (let i = 0; i < matrix.length; i++) {
          matrix[i].splice(j, 1);
        }
        ensureMatrixSize();
        render();
      });
    });

    // Renommer activité
    document.querySelectorAll(".raci-act").forEach((input) => {
      input.addEventListener("input", () => {
        const i = Number(input.getAttribute("data-actname"));
        if (Number.isNaN(i)) return;
        activities[i] = input.value;
      });
    });

    // Choix R/A/C/I
    document.querySelectorAll(".raci-cell").forEach((sel) => {
      sel.addEventListener("change", () => {
        const i = Number(sel.getAttribute("data-act"));
        const j = Number(sel.getAttribute("data-actor"));
        if (Number.isNaN(i) || Number.isNaN(j)) return;
        ensureMatrixSize();
        matrix[i][j] = sel.value;
      });
    });
  }

  function init() {
    ensureMatrixSize();
    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();