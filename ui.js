// ============================================================
// UI — toast, loading, navigation, trophées
// ============================================================

var isAdmin = false;

// ---------- Loading ----------
function showLoad(on, txt) {
  var ov = document.getElementById("ldOv");
  if (!ov) return;
  ov.classList.toggle("on", on);
  if (txt) {
    var t = document.getElementById("ldTxt");
    if (t) t.textContent = txt;
  }
}

// ---------- Toast ----------
var _toastT;
function toast(msg, type) {
  type = type || "ok";
  var t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.className = "toast " + type + " on";
  clearTimeout(_toastT);
  _toastT = setTimeout(function(){ t.classList.remove("on"); }, 3200);
}

// ---------- Navigation ----------
function goTo(id) {
  document.querySelectorAll(".pg").forEach(function(p){ p.classList.remove("on"); });
  document.querySelectorAll(".nb").forEach(function(b){ b.classList.remove("on"); });
  var pg = document.getElementById("pg-" + id);
  var nb = document.getElementById("nb-" + id);
  if (pg) pg.classList.add("on");
  if (nb) nb.classList.add("on");
  if (id === "info") renderInfoStats();
}

// ---------- Admin ----------
function toggleAdmin() {
  if (isAdmin) {
    isAdmin = false;
    localStorage.removeItem("adm_exp");
    document.getElementById("adminBtn").classList.remove("on");
    updateAdminUI();
    toast("Mode admin désactivé");
    return;
  }
  var pin = prompt("Code admin :");
  if (!pin) return;
  if (pin === CFG.ADMIN_PIN) {
    isAdmin = true;
    localStorage.setItem("adm_exp", Date.now() + CFG.ADMIN_MS);
    document.getElementById("adminBtn").classList.add("on");
    updateAdminUI();
    toast("Mode admin activé — 30 min");
  } else {
    toast("Code incorrect", "err");
  }
}

function updateAdminUI() {
  var panel = document.getElementById("adminPanel");
  if (panel) panel.classList.toggle("on", isAdmin);
  if (isAdmin) renderHistAdmin();
}

// ---------- Trophées du mois ----------
function renderTrophies() {
  var pl = Object.entries(STATE.players || {});
  if (!pl.length) return;

  // Meilleur Elo
  var sorted = pl.slice().sort(function(a,b){ return (b[1].elo||1000)-(a[1].elo||1000); });
  set("tr-elo-name", sorted[0][0]);
  set("tr-elo-val",  (sorted[0][1].elo||1000) + " pts");

  // Meilleur buteur (min 3 matchs, stats encodées)
  var att = pl.filter(function(e){ return (e[1].matches||0)>=3 && (e[1].attGoals||0)>0; })
              .sort(function(a,b){ return (b[1].attGoals||0)-(a[1].attGoals||0); });
  if (att.length) {
    set("tr-att-name", att[0][0]);
    set("tr-att-val",  att[0][1].attGoals + " buts", "");
  } else {
    set("tr-att-name", "—");
    set("tr-att-val",  "Stats requises", "var(--t3)");
  }

  // Meilleur défenseur (min 3 matchs, ratio_def)
  var def = pl.filter(function(e){ return (e[1].matches||0)>=3 && e[1].ratio_def && e[1].ratio_def!=="-"; })
              .sort(function(a,b){
                return parseFloat((b[1].ratio_def||"0").replace("%","").replace(",",".")) -
                       parseFloat((a[1].ratio_def||"0").replace("%","").replace(",","."));
              });
  if (def.length) {
    set("tr-def-name", def[0][0]);
    set("tr-def-val",  def[0][1].ratio_def, "");
  } else {
    set("tr-def-name", "—");
    set("tr-def-val",  "Stats requises", "var(--t3)");
  }
}

function set(id, txt, color) {
  var el = document.getElementById(id);
  if (!el) return;
  el.textContent = txt;
  if (color !== undefined) el.style.color = color;
}

// ---------- Render global ----------
function renderAll() {
  renderTrophies();
  renderMatchForm();
  renderRanking();
  renderBadgesPage();
  renderAdminSelects();
  if (isAdmin) renderHistAdmin();
}
