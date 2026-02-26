// kanban.js — Kanban simple (À faire / En cours / Terminé) + localStorage
(function () {
  const containerId = "kanbanContainer";
  const STORAGE_KEY = "spm_kanban_v1";

  const COLUMNS = [
    { id: "todo", title: "À faire" },
    { id: "doing", title: "En cours" },
    { id: "done", title: "Terminé" },
  ];

  // State: { todo: [{id,text}], doing: [...], done: [...] }
  let state = load() || {
    todo: [],
    doing: [],
    done: [],
  };

  function uid() {
    return "k_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
      <div class="kanban">
        ${COLUMNS.map(col => renderColumn(col)).join("")}
      </div>
    `;

    bind(root);
  }

  function renderColumn(col) {
    const cards = state[col.id] || [];
    return `
      <div class="kanban-col" data-col="${col.id}">
        <div class="kanban-col__head">
          <div class="kanban-col__title">${esc(col.title)}</div>
          <button class="kanban-add" data-col="${col.id}">+ Carte</button>
        </div>

        <div class="kanban-col__body">
          ${cards.map(card => renderCard(col.id, card)).join("")}
        </div>
      </div>
    `;
  }

  function renderCard(colId, card) {
    return `
      <div class="kanban-card" data-col="${colId}" data-id="${card.id}">
        <div class="kanban-card__text">${esc(card.text || "")}</div>
        <div class="kanban-card__actions">
          <button class="kanban-move" data-dir="left" title="Déplacer à gauche">←</button>
          <button class="kanban-move" data-dir="right" title="Déplacer à droite">→</button>
          <button class="kanban-del" title="Supprimer">✕</button>
        </div>
      </div>
    `;
  }

  function bind(root) {
    // Ajouter carte
    root.querySelectorAll(".kanban-add").forEach(btn => {
      btn.addEventListener("click", () => {
        const col = btn.getAttribute("data-col");
        if (!col) return;

        const text = prompt("Titre de la carte ?");
        if (!text) return;

        state[col].push({ id: uid(), text: text.trim() });
        save();
        render();
      });
    });

    // Actions carte (event delegation)
    root.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;

      const cardEl = target.closest(".kanban-card");
      if (!cardEl) return;

      const col = cardEl.getAttribute("data-col");
      const id = cardEl.getAttribute("data-id");
      if (!col || !id) return;

      if (target.classList.contains("kanban-del")) {
        removeCard(col, id);
        save();
        render();
        return;
      }

      if (target.classList.contains("kanban-move")) {
        const dir = target.getAttribute("data-dir");
        moveCard(col, id, dir === "left" ? -1 : 1);
        save();
        render();
        return;
      }
    });
  }

  function removeCard(col, id) {
    state[col] = (state[col] || []).filter(c => c.id !== id);
  }

  function moveCard(fromCol, cardId, step) {
    const fromIndex = COLUMNS.findIndex(c => c.id === fromCol);
    if (fromIndex < 0) return;

    const toIndex = fromIndex + step;
    if (toIndex < 0 || toIndex >= COLUMNS.length) return;

    const fromArr = state[fromCol] || [];
    const idx = fromArr.findIndex(c => c.id === cardId);
    if (idx < 0) return;

    const [card] = fromArr.splice(idx, 1);
    const toCol = COLUMNS[toIndex].id;
    state[toCol] = state[toCol] || [];
    state[toCol].push(card);
  }

  function injectMinimalCss() {
    // Petit CSS inline si tu n’as pas encore de styles kanban
    // (Tu peux ensuite le déplacer dans css/componant.css)
    const id = "kanban_min_css";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .kanban{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:16px}
      .kanban-col{border:1px solid rgba(230,238,242,.9);border-radius:16px;background:#fff;box-shadow:0 8px 16px rgba(5,63,92,.06);overflow:hidden}
      .kanban-col__head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 12px;border-bottom:1px solid rgba(230,238,242,.85);background:linear-gradient(90deg, rgba(159,231,245,.30), rgba(255,255,255,0))}
      .kanban-col__title{font-weight:900;color:#053F5C}
      .kanban-add{padding:8px 10px;border-radius:999px;border:1px solid rgba(66,158,189,.35);background:linear-gradient(135deg, rgba(66,158,189,.95), rgba(66,158,189,.75));color:#fff;font-weight:800;cursor:pointer}
      .kanban-col__body{padding:12px;display:flex;flex-direction:column;gap:10px;min-height:120px}
      .kanban-card{border:1px solid rgba(230,238,242,.9);border-radius:14px;background:linear-gradient(180deg, rgba(255,255,255,.98), rgba(159,231,245,.08));padding:10px 10px;box-shadow:0 6px 14px rgba(5,63,92,.07)}
      .kanban-card__text{font-weight:700;color:#053F5C}
      .kanban-card__actions{display:flex;gap:8px;justify-content:flex-end;margin-top:10px}
      .kanban-move,.kanban-del{width:34px;height:34px;border-radius:999px;border:1px solid rgba(230,238,242,.9);background:#fff;font-weight:900;cursor:pointer;color:#053F5C}
      .kanban-del:hover{border-color: rgba(247,173,25,.55);background:linear-gradient(135deg, rgba(247,173,25,.95), rgba(247,173,25,.75));color:#1b1200}
      @media (max-width: 900px){.kanban{grid-template-columns:1fr}}
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