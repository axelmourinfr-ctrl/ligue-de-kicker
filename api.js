// ============================================================
// API + CACHE
// Affichage instantané depuis le cache, sync en arrière-plan
// ============================================================

var STATE = { players:{}, history:[], version:1 };

// ---------- Cache ----------
function cacheLoad() {
  try {
    var raw = localStorage.getItem(CFG.CACHE_KEY);
    if (!raw) return null;
    var obj = JSON.parse(raw);
    if (!obj || !obj.ts) return null;
    return obj;
  } catch(e) { return null; }
}

function cacheSave(state) {
  try {
    localStorage.setItem(CFG.CACHE_KEY, JSON.stringify({ ts: Date.now(), data: state }));
  } catch(e) {}
}

function cacheAge() {
  var c = cacheLoad();
  if (!c) return Infinity;
  return Date.now() - c.ts;
}

// ---------- Fetch ----------
async function apiFetch() {
  var r = await fetch(CFG.API_URL + "?t=" + Date.now());
  var data = await r.json();
  STATE = data;
  cacheSave(data);
  return data;
}

async function apiPost(payload) {
  var r = await fetch(CFG.API_URL, { method:"POST", body: JSON.stringify(payload) });
  var data = await r.json();
  return data;
}

// ---------- Load principal ----------
// 1) Affiche le cache immédiatement (si dispo)
// 2) Lance le fetch en arrière-plan
// 3) Met à jour l'UI quand le fetch revient
async function loadState(silent) {
  var cached = cacheLoad();

  if (cached && cached.data) {
    // Affichage instantané depuis le cache
    STATE = cached.data;
    renderAll();
    if (!silent) showLoad(false); // pas de spinner si cache dispo
  } else {
    // Pas de cache → spinner obligatoire
    showLoad(true, "Chargement…");
  }

  // Fetch en arrière-plan (toujours)
  try {
    await apiFetch();
    renderAll();
  } catch(e) {
    if (!cached) {
      toast("Erreur réseau — vérifie ta connexion", "err");
    }
    // Sinon on garde le cache sans message d'erreur
  }

  showLoad(false);
}

// ---------- Helpers joueur ----------
function newPlayer() {
  return {
    prenom:"", elo:1000, paid:false,
    w:0, l:0, matches:0,
    attGoals:0, attMisses:0,
    defSaves:0, defPasses:0, defGoals:0, defConceded:0,
    ratio_att:"-", ratio_def:"-",
    badges_level:{
      hat_trick_def:0, mur_de_fer:0, precision_chir:0,
      serial_passeur_def:0, vainqueur_ecrasant:0, progres_continu:0
    }
  };
}

function recompRatios(p) {
  var sh = (p.attGoals||0) + (p.attMisses||0);
  p.ratio_att = sh > 0 ? Math.round((p.attGoals||0)*100/sh) + "%" : "-";
  var dg = (p.defSaves||0) + (p.defPasses||0) + (p.defGoals||0);
  var dt = dg + (p.defConceded||0);
  p.ratio_def = dt > 0 ? Math.round(dg*100/dt) + "%" : "-";
}

// ---------- Helpers DOM ----------
function g(id)  { var el=document.getElementById(id); return el?(el.value||""):""; }
function gm(id) { var el=document.getElementById(id); return el?(el.value||"").trim():""; }
function gi(id) { var v=g(id); var n=parseInt(v,10); return isNaN(n)?NaN:n; }
function gi2(id){ var v=g(id); if(v===""||v===null)return 0; var n=parseInt(v,10); return isNaN(n)?0:n; }
function xe(s)  { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
