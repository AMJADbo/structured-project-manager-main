// pdf.js — version simple : impression navigateur (Ctrl/Cmd + P)

(function () {
  function init() {
    const btn = document.getElementById("exportPdf");
    if (!btn) return;

    btn.addEventListener("click", () => {
      // Plus tard on mettra jsPDF / html2pdf pour un vrai export propre.
      window.print();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();