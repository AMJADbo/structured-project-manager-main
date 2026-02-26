// main.js — glue + (optionnel) sauvegarde locale simple

(function () {
  const STORAGE_KEY = "spm_data_v1";

  function $id(id) {
    return document.getElementById(id);
  }

  function collectBasicFields() {
    // ⚠️ Pour l’instant on n’a pas mis d’ID sur les inputs du projet
    // Donc on ne sauvegarde pas ces champs ici. On le fera quand tu voudras.
    return {};
  }

  function saveAll() {
    const data = {
      meta: collectBasicFields(),
      ts: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function init() {
    // Auto-save léger quand tu modifies des inputs/textarea
    document.addEventListener("input", (e) => {
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        // debounce simple
        window.clearTimeout(window.__spmSaveT);
        window.__spmSaveT = window.setTimeout(saveAll, 300);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();