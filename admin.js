// ============================================================
// ADMIN — gestion joueurs, import tournoi, fix badges
// ============================================================

var importData = null;

// ---------- Selects admin ----------
function renderAdminSelects() {
  var pl = Object.keys(STATE.players||{}).sort();
  var o  = '<option value="">-- Joueur --</option>' +
    pl.map(function(p){ return '<option value="'+xe(p)+'">'+xe(p)+'</option>'; }).join("");
  ["bonusSel","renameSel","deleteSel"].forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.innerHTML = o;
  });
}

// ---------- Historique admin ----------
function renderHistAdmin() {
  var list = document.getElementById("histList");
  if (!list || !isAdmin) return;

  var hist = (STATE.history||[]).slice(-10).reverse();
  if (!hist.length) { list.innerHTML='<div class="empty">Aucun match</div>'; return; }

  list.innerHTML = hist.map(function(m) {
    var d    = new Date(m.date||"");
    var when = isNaN(d.getTime()) ? "" :
      d.toLocaleString("fr-BE",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});
    return '<div class="hist-item">'+
      '<div class="hist-score">'+(m.scoreA||0)+' — '+(m.scoreB||0)+'</div>'+
      '<div class="hist-meta">'+(m.mode||"?")+(when?" · "+when:"")+'</div>'+
    '</div>';
  }).join("");
}

// ---------- Ajouter joueur ----------
async function addPlayer() {
  var inp  = document.getElementById("newPlayerName");
  var name = (inp.value||"").trim();
  if (!name) return toast("Entre un pseudo","err");
  if (STATE.players[name]) return toast(name+" existe déjà","err");

  showLoad(true, "Ajout…");
  STATE.players[name] = newPlayer();
  await apiPost({action:"updatePlayers", players:STATE.players});
  inp.value = "";
  await loadState(true);
  toast(name+" ajouté ✓");
  showLoad(false);
}

// ---------- Bonus Elo ----------
async function applyBonus() {
  if (!isAdmin) return;
  var name = g("bonusSel"), amt = gi("bonusAmt");
  if (!name || isNaN(amt)) return toast("Joueur et montant requis","err");

  showLoad(true, "Bonus…");
  await apiPost({action:"applyBonus", name:name, amount:amt});
  await loadState(true);
  toast("Bonus "+amt+" pts appliqué à "+name);
  showLoad(false);
}

// ---------- Renommer ----------
async function renamePlayer() {
  if (!isAdmin) return;
  var old = g("renameSel");
  var nw  = (document.getElementById("renameInput").value||"").trim();
  if (!old) return toast("Choisis un joueur","err");
  if (!nw)  return toast("Entre un nouveau pseudo","err");
  if (STATE.players[nw] && nw!==old) return toast("Ce pseudo existe déjà","err");

  showLoad(true, "Renommage…");
  STATE.players[nw] = STATE.players[old];
  if (nw!==old) delete STATE.players[old];
  await apiPost({action:"updatePlayers", players:STATE.players});
  document.getElementById("renameInput").value = "";
  await loadState(true);
  toast(old+" → "+nw);
  showLoad(false);
}

// ---------- Supprimer ----------
async function deletePlayer() {
  if (!isAdmin) return;
  var name = g("deleteSel");
  if (!name) return toast("Choisis un joueur","err");
  if (!confirm("Supprimer "+name+" du classement ?")) return;

  showLoad(true, "Suppression…");
  delete STATE.players[name];
  await apiPost({action:"updatePlayers", players:STATE.players});
  await loadState(true);
  toast(name+" supprimé");
  showLoad(false);
}

// ---------- Nouvelle saison ----------
async function newSeason() {
  if (!isAdmin) return;
  if (!confirm("Réinitialiser toutes les stats et badges ? L'Elo est conservé.")) return;

  showLoad(true, "Nouvelle saison…");
  await apiPost({action:"newSeason"});
  await loadState(true);
  toast("Nouvelle saison lancée 🎉");
  showLoad(false);
}

// ---------- FIX BADGES INCORRECTS ----------
// Remet à 0 les badges qui nécessitent des stats pour les joueurs
// qui les ont obtenus sans avoir de stats encodées
async function fixBadges() {
  if (!isAdmin) return;
  if (!confirm(
    "Réinitialiser les badges obtenus sans stats ?\n\n"+
    "Badges concernés : Précision chirurgicale, Mur de fer, Hat-trick Déf., Serial passeur.\n\n"+
    "Seuls les joueurs sans stats encodées sont affectés."
  )) return;

  showLoad(true, "Correction des badges…");

  var changed = 0;
  Object.entries(STATE.players||{}).forEach(function(entry) {
    var name = entry[0], p = entry[1];
    var hasStats = (p.attGoals||0)>0 || (p.attMisses||0)>0 ||
                   (p.defSaves||0)>0 || (p.defPasses||0)>0 ||
                   (p.defGoals||0)>0 || (p.defConceded||0)>0;

    if (!hasStats && p.badges_level) {
      CFG.STATS_ONLY_BADGES.forEach(function(key) {
        if (p.badges_level[key] > 0) {
          p.badges_level[key] = 0;
          changed++;
        }
      });
    }
  });

  if (changed === 0) {
    showLoad(false);
    toast("Aucun badge incorrect détecté ✓", "ok");
    return;
  }

  await apiPost({action:"updatePlayers", players:STATE.players});
  await loadState(true);
  showLoad(false);
  toast(changed+" badge(s) incorrect(s) réinitialisé(s) ✓");
}

// ---------- IMPORT TOURNOI ----------
function previewImport(input) {
  importData = null;
  var preview = document.getElementById("importPreview");
  var btn     = document.getElementById("importBtn");
  preview.classList.remove("on");
  btn.style.display = "none";

  if (!input.files||!input.files[0]) return;

  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);
      if (!data.matchs||!Array.isArray(data.matchs)) throw new Error("Format invalide — champ 'matchs' manquant");

      var ligueKeys = Object.keys(STATE.players||{}).map(function(k){return k.toLowerCase();});
      var invites   = new Set();
      data.matchs.forEach(function(m) {
        var names = m.mode==="1v1" ? [m.p1,m.p2] : [m.a1,m.d1,m.a2,m.d2];
        (names||[]).forEach(function(n){
          if (n && !ligueKeys.includes(n.toLowerCase())) invites.add(n);
        });
      });

      importData = data;
      preview.innerHTML =
        '<div class="ir-info">📋 <strong>'+xe(data.tournoi||input.files[0].name)+'</strong></div>'+
        '<div>📅 '+(data.date||"Date non spécifiée")+'</div>'+
        '<div class="ir-ok">✓ '+data.matchs.length+' match(s) à importer</div>'+
        (invites.size>0?'<div style="color:var(--t3)">👥 Invités (sans profil créé) : '+Array.from(invites).map(xe).join(", ")+'</div>':'')+
        '<div style="color:var(--t3);font-size:11px;margin-top:4px;">Compte comme matchs de ligue normaux.</div>';
      preview.classList.add("on");
      btn.style.display = "";
    } catch(err) {
      preview.innerHTML = '<div class="ir-err">❌ Fichier invalide : '+err.message+'</div>';
      preview.classList.add("on");
    }
  };
  reader.readAsText(input.files[0]);
}

async function runImport() {
  if (!importData||!importData.matchs) return toast("Aucun fichier chargé","err");
  if (!isAdmin) return toast("Réservé à l'admin","err");
  if (!confirm("Importer "+importData.matchs.length+" match(s) du tournoi \""+importData.tournoi+"\" dans la ligue ?")) return;

  var btn     = document.getElementById("importBtn");
  var preview = document.getElementById("importPreview");
  btn.disabled = true;

  var ligueKeys = Object.keys(STATE.players||{}).map(function(k){return k.toLowerCase();});
  var ok=0, skip=0, errs=[];

  showLoad(true, "Import 0 / "+importData.matchs.length);

  for (var i=0; i<importData.matchs.length; i++) {
    var m = importData.matchs[i];
    document.getElementById("ldTxt").textContent = "Import "+(i+1)+" / "+importData.matchs.length;

    try {
      var payload;
      if (m.mode==="1v1") {
        var p1ok = ligueKeys.includes((m.p1||"").toLowerCase());
        var p2ok = ligueKeys.includes((m.p2||"").toLowerCase());
        if (!p1ok && !p2ok) { skip++; continue; }
        payload = {action:"submitMatch",mode:"1v1",p1:m.p1,p2:m.p2,scoreA:m.scoreA,scoreB:m.scoreB};
      } else {
        var names = [m.a1,m.d1,m.a2,m.d2];
        if (!names.some(function(n){return n&&ligueKeys.includes(n.toLowerCase());})) { skip++; continue; }
        payload = {action:"submitMatch",mode:"2v2",a1:m.a1,d1:m.d1,a2:m.a2,d2:m.d2,scoreA:m.scoreA,scoreB:m.scoreB};
      }

      var r = await apiPost(payload);
      if (r&&r.ok) ok++;
      else errs.push("Match "+(i+1)+" : erreur serveur");

      await new Promise(function(res){setTimeout(res,400);}); // anti-flood Apps Script

    } catch(e2) {
      errs.push("Match "+(i+1)+" : "+e2.message);
    }
  }

  await loadState(true);
  showLoad(false);
  btn.disabled = false;

  preview.innerHTML =
    '<div class="ir-ok">✅ '+ok+' match(s) importé(s)</div>'+
    (skip?'<div style="color:var(--t3)">⏭ '+skip+' ignoré(s) (100% invités)</div>':'')+
    (errs.length?'<div class="ir-err">⚠️ '+errs.length+' erreur(s)</div>':'')+
    '<div style="color:var(--t3);font-size:11px;margin-top:6px;">Classement mis à jour.</div>';

  document.getElementById("importFile").value = "";
  btn.style.display = "none";
  importData = null;
  toast(ok+" match(s) importé(s) ✓");
}
