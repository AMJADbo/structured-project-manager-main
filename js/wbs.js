/**
 * WBS / OT — 4 niveaux (N1 -> N4)
 * Ajouter / supprimer des tâches et sous-tâches, rendu en arbre.
 */
(function () {
  const MAX_LEVEL = 4;

  /** @typedef {{id:string, level:number, title:string, children:WbsNode[]}} WbsNode */

  /** @type {WbsNode[]} */
  let roots = [];

  /** @type {Record<number, number>} */
  const counters = { 1: 0, 2: 0, 3: 0, 4: 0 };

  /** @type {HTMLElement|null} */
  let container = null;

  function nextId(level) {
    counters[level] = (counters[level] || 0) + 1;
    return `N${level}-${counters[level]}`;
  }

  /** @returns {WbsNode} */
  function createNode(level) {
    return { id: nextId(level), level, title: "", children: [] };
  }

  /** @param {WbsNode[]} list */
  function findNodeById(list, id) {
    for (const n of list) {
      if (n.id === id) return n;
      const inChild = findNodeById(n.children, id);
      if (inChild) return inChild;
    }
    return null;
  }

  /** @param {WbsNode[]} list */
  function removeNodeById(list, id) {
    const idx = list.findIndex(n => n.id === id);
    if (idx >= 0) {
      list.splice(idx, 1);
      return true;
    }
    for (const n of list) {
      if (removeNodeById(n.children, id)) return true;
    }
    return false;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function render() {
    if (!container) return;

    if (roots.length === 0) {
      container.innerHTML = `
        <div class="wbs-empty">
          Aucun élément WBS. Clique sur <b>“Ajouter une tâche niveau 1”</b> pour commencer.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <ul class="wbs">
        ${roots.map(n => renderNode(n)).join("")}
      </ul>
    `;

    bindEvents();
  }

  /** @param {WbsNode} node */
  function renderNode(node) {
    const canAddChild = node.level < MAX_LEVEL;
    const title = escapeHtml(node.title || "");

    return `
      <li class="wbs-node wbs-level-${node.level}" data-id="${node.id}">
        <div class="wbs-node__row">
          <div class="wbs-node__meta">
            <span class="wbs-badge">Niveau ${node.level}</span>
            <span class="wbs-id">${node.id}</span>
          </div>

          <div class="wbs-node__title">
            <input
              type="text"
              class="wbs-title-input"
              placeholder="Nom de la tâche (ex: Définir les attentes utilisateurs)"
              value="${title}"
            />
          </div>

          <div class="wbs-node__actions">
            ${canAddChild ? `<button class="wbs-btn" data-action="add-child">+ Sous-tâche</button>` : ""}
            <button class="wbs-btn secondary" data-action="add-sibling">+ Même niveau</button>
            <button class="wbs-btn danger" data-action="remove">Supprimer</button>
          </div>
        </div>

        <div class="wbs-children">
          ${node.children.length > 0
            ? `<div class="wbs-children__inner">
                 <ul class="wbs">
                   ${node.children.map(c => renderNode(c)).join("")}
                 </ul>
               </div>`
            : ""
          }
        </div>
      </li>
    `;
  }

  function bindEvents() {
    container.querySelectorAll(".wbs-node").forEach(li => {
      const id = li.getAttribute("data-id");
      if (!id) return;

      const input = li.querySelector(".wbs-title-input");
      if (input) {
        input.addEventListener("input", () => {
          const node = findNodeById(roots, id);
          if (node) node.title = input.value;
        });
      }

      li.querySelectorAll("button[data-action]").forEach(btn => {
        btn.addEventListener("click", () => {
          const action = btn.getAttribute("data-action");
          if (!action) return;

          if (action === "remove") {
            removeNodeById(roots, id);
            render();
            return;
          }

          const current = findNodeById(roots, id);
          if (!current) return;

          if (action === "add-child") {
            if (current.level >= MAX_LEVEL) return;
            current.children.push(createNode(current.level + 1));
            render();
            return;
          }

          if (action === "add-sibling") {
            addSibling(id);
            render();
          }
        });
      });
    });
  }

  function addSibling(targetId) {
    const placed = addSiblingInList(roots, targetId);
    if (!placed) {
      const idx = roots.findIndex(n => n.id === targetId);
      if (idx >= 0) roots.splice(idx + 1, 0, createNode(1));
    }
  }

  /** @param {WbsNode[]} list */
  function addSiblingInList(list, targetId) {
    for (const n of list) {
      const idx = n.children.findIndex(c => c.id === targetId);
      if (idx >= 0) {
        const target = n.children[idx];
        n.children.splice(idx + 1, 0, createNode(target.level));
        return true;
      }
      if (addSiblingInList(n.children, targetId)) return true;
    }
    return false;
  }

  function init() {
    container = document.getElementById("wbsContainer");
    const addBtn = document.getElementById("addWbs");
    if (!container || !addBtn) return;

    addBtn.addEventListener("click", () => {
      roots.push(createNode(1));
      render();
    });

    render();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();