// ============================================================
// CLASSEMENT + MODAL JOUEUR
// ============================================================

function renderRanking() {
  var list = document.getElementById("rankList");
  if (!list) return;

  var arr = Object.entries(STATE.players||{})
    .map(function(e){ return Object.assign({name:e[0]}, e[1]); })
    .sort(function(a,b){ return (b.elo||0)-(a.elo||0); });

  if (!arr.length) {
    list.innerHTML = '<div class="empty">Aucun joueur encore</div>';
    return;
  }

  list.innerHTML = arr.map(function(p, i) {
    var pos   = i + 1;
    var pc    = pos===1?"p1":pos===2?"p2":pos===3?"p3":"";
    var rc    = pos===1?"r1":pos===2?"r2":pos===3?"r3":"";
    var rival = pos < arr.length
      ? "🎯 vs "+arr[i+1].name+" (+"+ ((p.elo||0)-(arr[i+1].elo||0))+" pts)"
      : "👑 Leader";

    // Titre dynamique
    var title = getTitle(p, arr);

    return '<div class="rank-card '+rc+'" onclick="openModal(\''+xe(p.name)+'\')">'+
      '<div class="rank-pos '+pc+'">'+pos+'</div>'+
      '<div class="rank-info">'+
        '<div class="rank-name">'+xe(p.name)+'</div>'+
        '<div class="rank-sub">'+xe(title)+'</div>'+
        '<div class="rank-rival">'+rival+'</div>'+
      '</div>'+
      '<div class="rank-stats">'+
        '<div class="rank-elo">'+(p.elo||1000)+'</div>'+
        '<div class="rank-wl">'+
          '<span class="w">'+(p.w||0)+'V</span><br>'+
          '<span class="l">'+(p.l||0)+'D</span>'+
        '</div>'+
      '</div>'+
    '</div>';
  }).join("");
}

// ---------- Titre dynamique ----------
function getTitle(p, arr) {
  // Streak (approximée via ratio V/D)
  var streak = getStreak(p.name);
  if (streak >= 3) return "🔥 " + streak + " victoires d'affilée";

  // Leader Elo
  if (arr[0] && arr[0].name === p.name) return "👑 La Bête";

  // Meilleur ratio attaque
  var topAtt = arr.filter(function(x){ return (x.attGoals||0)>0; })
                  .sort(function(a,b){ return parseFloat((b.ratio_att||"0"))-parseFloat((a.ratio_att||"0")); })[0];
  if (topAtt && topAtt.name === p.name && (p.matches||0)>=3) return "🎯 Le Sniper";

  // Meilleur défenseur
  var topDef = arr.filter(function(x){ return x.ratio_def && x.ratio_def!=="-"; })
                  .sort(function(a,b){
                    return parseFloat((b.ratio_def||"0").replace("%","").replace(",",".")) -
                           parseFloat((a.ratio_def||"0").replace("%","").replace(",","."));
                  })[0];
  if (topDef && topDef.name === p.name && (p.matches||0)>=3) return "🧱 Le Mur";

  // Diamant HOF
  var hasDiamond = Object.values(p.badges_level||{}).some(function(v){ return v===5; });
  if (hasDiamond) return "💎 Légende";

  // Défaites consécutives
  if ((p.l||0) > (p.w||0) && (p.matches||0)>=3) return "💪 En reconstruction";

  return "⚽ Joueur";
}

// Approximation streak depuis history (5 derniers matchs du joueur)
function getStreak(name) {
  var hist = (STATE.history||[]).slice().reverse();
  var streak = 0;
  for (var i=0; i<hist.length; i++) {
    var m = hist[i];
    var inA = (m.p1===name||m.a1===name||m.d1===name);
    var inB = (m.p2===name||m.a2===name||m.d2===name);
    if (!inA && !inB) continue;
    var won = (inA && m.scoreA > m.scoreB) || (inB && m.scoreB > m.scoreA);
    if (won) streak++;
    else break;
    if (streak >= 10) break;
  }
  return streak;
}

// ---------- Modal joueur ----------
function openModal(name) {
  var p = STATE.players[name];
  if (!p) return;

  document.getElementById("mName").textContent = name;
  document.getElementById("mElo").textContent  = (p.elo||1000) + " ELO";

  // Grade Elo
  var grade = eloGrade(p.elo||1000);
  document.getElementById("mGrade").innerHTML = grade.ico + ' <span style="color:'+grade.color+'">'+grade.lbl+'</span>';

  document.getElementById("mGrid").innerHTML = [
    ["Matchs",    p.matches||0],
    ["Victoires", p.w||0],
    ["Défaites",  p.l||0],
    ["Buts Att.", p.attGoals||0],
    ["Arrêts",    p.defSaves||0],
    ["Ratio Att.", p.ratio_att||"-"]
  ].map(function(s){
    return '<div class="mstat"><span class="mstat-v">'+s[1]+'</span><span class="mstat-l">'+s[0]+'</span></div>';
  }).join("");

  var b = p.badges_level||{};
  var pills = Object.entries(CFG.BADGE_LBL).map(function(e){
    var lvl = b[e[0]]||0;
    if (!lvl) return "";
    return '<div class="bpill"><span>'+CFG.BADGE_EMO[lvl]+'</span><span class="bpill-l">'+e[1]+'</span></div>';
  }).join("");

  document.getElementById("mBadges").innerHTML = pills ||
    '<span style="color:var(--t3);font-size:13px;">Aucun badge encore</span>';

  document.getElementById("playerModal").classList.add("on");
}

function closeModal(e) {
  if (!e || e.target.id==="playerModal")
    document.getElementById("playerModal").classList.remove("on");
}

// ---------- Grade Elo ----------
function eloGrade(elo) {
  if (elo >= 1300) return { ico:"💎", lbl:"Diamant",  color:"#40c4ff" };
  if (elo >= 1200) return { ico:"🥇", lbl:"Or",       color:"#ffd54f" };
  if (elo >= 1100) return { ico:"🥈", lbl:"Argent",   color:"#b0bec5" };
  if (elo >= 1050) return { ico:"🥉", lbl:"Bronze",   color:"#a1887f" };
  if (elo >= 1000) return { ico:"🪵", lbl:"Bois",     color:"#8d6e63" };
  return               { ico:"💀", lbl:"Danger Zone", color:"#e53935" };
}
