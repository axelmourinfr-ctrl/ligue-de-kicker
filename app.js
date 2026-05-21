// ============================================================
// APP — point d'entrée, initialisation
// ============================================================

window.addEventListener("load", function() {

  // Check session admin
  var exp = localStorage.getItem("adm_exp");
  if (exp && Date.now() < parseInt(exp)) {
    isAdmin = true;
    var btn = document.getElementById("adminBtn");
    if (btn) btn.classList.add("on");
  }
  updateAdminUI();

  // Formulaire match par défaut
  renderMatchForm();

  // Chargement avec cache
  loadState(false);
});
