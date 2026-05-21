// ============================================================
// BADGES + HOF + INFO STATS
// ============================================================

function renderBadgesPage() {
  renderHOF();
  renderBadgesPerPlayer();
}

// ---------- Hall of Fame ----------
function renderHOF() {
  var hof = document.getElementById("hofList");
  if (!hof) return;

  hof.innerHTML = Object.entries(CFG.BADGE_LBL).map(function(e) {
    var key = e[0], lbl = e[1];
    var holders = Object.entries(STATE.players||{})
      .filter(function(p){ return ((p[1].badges_level||{})[key]||0) === 5; })
      .map(function(p){ return p[0]; });

    return '<div class="hof-item">'+
      '<div class="hof-ico">'+(CFG.HOF_ICO[key]||"🏆")+'</div>'+
      '<div>'+
        '<div class="hof-cat">'+lbl+'</div>'+
        '<div class="hof-name">'+(holders.length ? holders.join(", ") : "—")+'</div>'+
      '</div>'+
      '<div style="margin-left:auto;font-size:20px;">'+(holders.length?"💎":"")+'</div>'+
    '</div>';
  }).join("");
}

// ---------- Badges par joueur ----------
function renderBadgesPerPlayer() {
  var bl = document.getElementById("badgesList");
  if (!bl) return;

  var arr = Object.entries(STATE.players||{})
    .map(function(e){ return Object.assign({name:e[0]}, e[1]); })
    .sort(function(a,b){ return (b.elo||0)-(a.elo||0); });

  if (!arr.length) { bl.innerHTML='<div class="empty">Aucun joueur</div>'; return; }

  bl.innerHTML = arr.map(function(p) {
    var b = p.badges_level||{};
    var pills = Object.entries(CFG.BADGE_LBL).map(function(e){
      return '<div class="bpill">'+
        '<span>'+CFG.BADGE_EMO[b[e[0]]||0]+'</span>'+
        '<span class="bpill-l">'+e[1]+'</span>'+
      '</div>';
    }).join("");
    return '<div style="margin-bottom:14px;">'+
      '<div style="font-size:15px;font-weight:700;margin-bottom:6px;">'+xe(p.name)+'</div>'+
      '<div style="display:flex;flex-wrap:wrap;gap:5px;">'+pills+'</div>'+
    '</div>';
  }).join("");
}

// ---------- Stats saison (page infos) ----------
function renderInfoStats() {
  var hist = STATE.history||[];
  var pl   = STATE.players||{};

  document.getElementById("infoMatches").textContent = hist.length;

  var goals = hist.reduce(function(a,m){ return a+(m.scoreA||0)+(m.scoreB||0); }, 0);
  document.getElementById("infoGoals").textContent = goals;

  var arr = Object.entries(pl).map(function(e){ return Object.assign({name:e[0]}, e[1]); });

  var act = arr.slice().sort(function(a,b){ return (b.matches||0)-(a.matches||0); })[0];
  document.getElementById("infoActive").textContent = act
    ? act.name+" ("+(act.matches||0)+" matchs)" : "—";

  var attB = arr.filter(function(p){ return (p.matches||0)>=3 && (p.attGoals||0)>0; })
               .sort(function(a,b){ return (b.attGoals||0)-(a.attGoals||0); })[0];
  document.getElementById("infoBestAtt").textContent = attB
    ? attB.name+" ("+attB.attGoals+" buts)" : "Pas encore (min. 3 matchs)";

  var defB = arr.filter(function(p){ return (p.matches||0)>=3 && p.ratio_def && p.ratio_def!=="-"; })
               .sort(function(a,b){
                 return parseFloat((b.ratio_def||"0").replace("%","").replace(",",".")) -
                        parseFloat((a.ratio_def||"0").replace("%","").replace(",","."));
               })[0];
  document.getElementById("infoBestDef").textContent = defB
    ? defB.name+" ("+defB.ratio_def+")" : "Pas encore (min. 3 matchs)";
}
