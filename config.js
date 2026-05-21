// ============================================================
// CONFIG — modifier ici uniquement
// ============================================================
var CFG = {
  API_URL:   "https://script.google.com/macros/s/AKfycbzaYj_dmVJtKGYBod7r7YA3HIkVh7yUdwTme98p15KxonEWhdsLAxe2CGu7aMcjwgzOZQ/exec",
  ADMIN_PIN: "7800",
  ADMIN_MS:  30 * 60 * 1000,   // 30 minutes
  CACHE_KEY: "ligue_state_v1",
  CACHE_MS:  60 * 1000,         // 1 minute avant refresh auto

  BADGE_EMO: { 0:"—", 1:"🪵", 2:"🥉", 3:"🥈", 4:"🥇", 5:"💎" },

  BADGE_LBL: {
    vainqueur_ecrasant:  "💥 Vainqueur écrasant",
    mur_de_fer:          "🧱 Mur de fer",
    hat_trick_def:       "🎩 Hat-trick Déf.",
    precision_chir:      "🎯 Précision chir.",
    serial_passeur_def:  "🎁 Serial passeur",
    progres_continu:     "📈 Progrès continu"
  },

  HOF_ICO: {
    vainqueur_ecrasant: "💥",
    mur_de_fer:         "🧱",
    hat_trick_def:      "🎩",
    precision_chir:     "🎯",
    serial_passeur_def: "🎁",
    progres_continu:    "📈"
  },

  // Badges qui nécessitent des stats détaillées
  STATS_ONLY_BADGES: ["precision_chir", "mur_de_fer", "hat_trick_def", "serial_passeur_def"]
};
