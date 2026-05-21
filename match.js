// ============================================================
// MATCH — formulaire, soumission, popup résultat
// ============================================================

var curMode  = "1v1";
var prevElos = {};

// ---------- Mode switch ----------
function setMode(m) {
  curMode = m;
  document.getElementById("btn1v1").classList.toggle("on", m==="1v1");
  document.getElementById("btn2v2").classList.toggle("on", m==="2v2");
  renderMatchForm();
}

// ---------- Options joueurs ----------
function opts() {
  return '<option value="">-- Choisir --</option>' +
    Object.keys(STATE.players||{}).sort().map(function(p){
      return '<option value="'+xe(p)+'">'+xe(p)+'</option>';
    }).join("");
}

// ---------- Formulaire ----------
function renderMatchForm() {
  var c = document.getElementById("matchForm");
  if (!c) return;
  var o = opts();

  if (curMode === "1v1") {
    c.innerHTML =
      fg("Joueur A", '<select id="p1">'+o+'</select>') +
      fg("Joueur B", '<select id="p2">'+o+'</select>') +
      fgScore();
  } else {
    c.innerHTML =
      teamBlock("a", "⚽ Équipe A", "Aatt", "Adef", o) +
      teamBlock("b", "🔵 Équipe B", "Batt", "Bdef", o) +
      fgScore() +
      '<button class="stats-toggle" onclick="toggleStats(this)">+ Stats détaillées (optionnel — trophées Buteur &amp; Gardien)</button>'+
      statsBlock();
  }
}

function fg(lbl, html) {
  return '<div class="fg"><label class="fl">'+lbl+'</label>'+html+'</div>';
}

function fgScore() {
  return '<div class="fg"><label class="fl">Score final</label>'+
    '<div class="score-row">'+
      '<input type="number" id="sA" min="0" max="20" placeholder="A" inputmode="numeric"/>'+
      '<span class="score-vs">—</span>'+
      '<input type="number" id="sB" min="0" max="20" placeholder="B" inputmode="numeric"/>'+
    '</div></div>';
}

function teamBlock(cls, lbl, attId, defId, o) {
  return '<div class="team-block">'+
    '<span class="team-lbl '+cls+'">'+lbl+'</span>'+
    fg(attId==="Aatt"?"Attaquant A":"Attaquant B",
      '<select id="'+attId+'">'+o+'</select>'+
      '<input type="text" id="'+attId+'_m" placeholder="Ou nouveau pseudo (invité)" style="margin-top:6px" autocorrect="off" autocapitalize="off" spellcheck="false"/>') +
    fg(defId==="Adef"?"Défenseur A":"Défenseur B",
      '<select id="'+defId+'">'+o+'</select>'+
      '<input type="text" id="'+defId+'_m" placeholder="Ou nouveau pseudo (invité)" style="margin-top:6px" autocorrect="off" autocapitalize="off" spellcheck="false"/>') +
  '</div>';
}

function statsBlock() {
  return '<div class="stats-block" id="statsBlock">'+
    statTeam("A","#ff6b6b","Stats Équipe A","Aag","Aam","Ads","Adp","Adg","Adc")+
    statTeam("B","#40c4ff","Stats Équipe B","Bag","Bam","Bds","Bdp","Bdg","Bdc")+
    '<p class="hint">⚠️ Sans stats détaillées : seuls Victoire écrasante et Progrès continu sont attribuables.</p>'+
  '</div>';
}

function statTeam(t, color, lbl, ag, am, ds, dp, dg, dc) {
  return '<div class="fg"><label class="fl" style="color:'+color+'">'+lbl+'</label>'+
    '<div class="sgrid">'+
      sfi("Att "+t+" — Buts",      ag)+sfi("Att "+t+" — Tirs ratés", am)+
      sfi("Déf "+t+" — Arrêts",    ds)+sfi("Déf "+t+" — Passes",    dp)+
      sfi("Déf "+t+" — Buts",      dg)+sfi("Déf "+t+" — Encaissés", dc)+
    '</div></div>';
}

function sfi(lbl, id) {
  return '<div><label class="fl">'+lbl+'</label><input type="number" id="'+id+'" min="0" placeholder="0" inputmode="numeric"/></div>';
}

function toggleStats(btn) {
  var b = document.getElementById("statsBlock");
  var o = b.classList.toggle("on");
  btn.textContent = o ? "− Masquer les stats" : "+ Stats détaillées (optionnel — trophées Buteur & Gardien)";
}

function resetForm() { renderMatchForm(); }

// ---------- Submit ----------
async function submitMatch() {
  var btn = document.getElementById("submitBtn");
  btn.disabled = true;
  showLoad(true, "Enregistrement…");

  prevElos = {};
  Object.entries(STATE.players||{}).forEach(function(e){ prevElos[e[0]] = e[1].elo||1000; });

  try {
    if (curMode === "1v1") await do1v1();
    else await do2v2();
  } catch(e) {
    toast("Erreur — réessaie", "err");
    console.error(e);
  }

  showLoad(false);
  btn.disabled = false;
}

async function do1v1() {
  var p1=g("p1"), p2=g("p2"), sA=gi("sA"), sB=gi("sB");
  if (!p1||!p2) return toast("Sélectionne les deux joueurs","err");
  if (p1===p2)  return toast("Deux joueurs différents requis","err");
  if (isNaN(sA)||isNaN(sB)) return toast("Entre les scores","err");

  var r = await apiPost({action:"submitMatch",mode:"1v1",p1:p1,p2:p2,scoreA:sA,scoreB:sB});
  if (!r||!r.ok) return toast("Erreur serveur","err");
  await loadState(true);
  showResult([p1,p2], sA, sB);
  resetForm();
}

async function do2v2() {
  var Aatt=(gm("Aatt_m")||g("Aatt")).trim(), Adef=(gm("Adef_m")||g("Adef")).trim();
  var Batt=(gm("Batt_m")||g("Batt")).trim(), Bdef=(gm("Bdef_m")||g("Bdef")).trim();
  var sA=gi("sA"), sB=gi("sB");

  if (!Aatt||!Adef||!Batt||!Bdef) return toast("Sélectionne tous les joueurs","err");
  if ((new Set([Aatt,Adef,Batt,Bdef])).size<4) return toast("Chaque joueur doit être unique","err");
  if (isNaN(sA)||isNaN(sB)) return toast("Entre les scores","err");

  var st = {
    Aatt_goals:gi2("Aag"), Aatt_misses:gi2("Aam"),
    Adef_saves:gi2("Ads"), Adef_passes:gi2("Adp"), Adef_goals:gi2("Adg"), Adef_conceded:gi2("Adc"),
    Batt_goals:gi2("Bag"), Batt_misses:gi2("Bam"),
    Bdef_saves:gi2("Bds"), Bdef_passes:gi2("Bdp"), Bdef_goals:gi2("Bdg"), Bdef_conceded:gi2("Bdc")
  };
  var hasStats = Object.values(st).some(function(v){return v>0;});

  var r = await apiPost(Object.assign(
    {action:"submitMatch",mode:"2v2",a1:Aatt,d1:Adef,a2:Batt,d2:Bdef,scoreA:sA,scoreB:sB,hasStats:hasStats},
    st
  ));
  if (!r||!r.ok) return toast("Erreur serveur","err");

  if (hasStats) {
    await loadState(true);
    applyStatsLocally(Aatt,Adef,Batt,Bdef,sA,sB,st);
    await apiPost({action:"updatePlayers", players:STATE.players});
  }

  await loadState(true);
  showResult([Aatt,Adef,Batt,Bdef], sA, sB);
  resetForm();
}

// ---------- Stats locales ----------
function applyStatsLocally(Aatt,Adef,Batt,Bdef,sA,sB,s) {
  var ep = function(n){ if(!STATE.players[n]) STATE.players[n]=newPlayer(); return STATE.players[n]; };
  var pAa=ep(Aatt),pAd=ep(Adef),pBa=ep(Batt),pBd=ep(Bdef);
  var ag=s.Aatt_goals,am=s.Aatt_misses,as_=s.Adef_saves,ap=s.Adef_passes,adg=s.Adef_goals,adc=s.Adef_conceded;
  var bg=s.Batt_goals,bm=s.Batt_misses,bs=s.Bdef_saves,bp=s.Bdef_passes,bdg=s.Bdef_goals,bdc=s.Bdef_conceded;

  // Déductions auto
  if(adc===0&&sB>0) adc=sB;
  if(bdc===0&&sA>0) bdc=sA;
  if(sA>0&&ag>0&&adg===0) adg=Math.max(0,sA-ag);
  if(sA>0&&adg>0&&ag===0) ag=Math.max(0,sA-adg);
  if(sB>0&&bg>0&&bdg===0) bdg=Math.max(0,sB-bg);
  if(sB>0&&bdg>0&&bg===0) bg=Math.max(0,sB-bdg);

  var add=function(p,k,v){p[k]=(p[k]||0)+v;};
  add(pAa,"attGoals",ag); add(pAa,"attMisses",am);
  add(pAd,"defSaves",as_);add(pAd,"defPasses",ap);add(pAd,"defGoals",adg);add(pAd,"defConceded",adc);
  add(pBa,"attGoals",bg); add(pBa,"attMisses",bm);
  add(pBd,"defSaves",bs); add(pBd,"defPasses",bp);add(pBd,"defGoals",bdg);add(pBd,"defConceded",bdc);
  [pAa,pAd,pBa,pBd].forEach(recompRatios);
}

// ---------- Popup résultat ----------
function showResult(players, sA, sB) {
  document.getElementById("resScore").textContent = sA + " — " + sB;
  var ch = document.getElementById("resChanges");
  ch.innerHTML = "";

  players.forEach(function(name) {
    var newE = (STATE.players[name]||{}).elo||1000;
    var oldE = prevElos[name]||1000;
    var d    = newE - oldE;
    var div  = document.createElement("div");
    div.className = "elo-row";
    div.innerHTML =
      '<span class="elo-name">'+xe(name)+'</span>'+
      '<span class="elo-delta '+(d>=0?"pos":"neg")+'">'+(d>=0?"+":"")+d+" ("+newE+")</span>";
    ch.appendChild(div);
  });

  var sorted = Object.entries(STATE.players||{}).sort(function(a,b){return (b[1].elo||0)-(a[1].elo||0);});
  var rank   = sorted.findIndex(function(e){return e[0]===players[0];})+1;
  document.getElementById("resRank").textContent = players[0]+" · "+rank+"e / "+sorted.length;
  document.getElementById("resOv").classList.add("on");
}

function closeResult() { document.getElementById("resOv").classList.remove("on"); }
