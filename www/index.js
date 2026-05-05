// ═══════════════════════════════════════
//  index.js — Animasi Partikel
//  Virtual Lab Rangkaian Listrik Dasar
// ═══════════════════════════════════════

// Ambil elemen kontainer partikel
const particleContainer = document.getElementById("particles");

// Jumlah partikel yang dibuat
const jumlahPartikel = 35;

// Buat partikel satu per satu
for (let i = 0; i < jumlahPartikel; i++) {
  // Buat elemen div baru
  const partikel = document.createElement("div");
  partikel.classList.add("particle");

  // Posisi horizontal acak
  partikel.style.left = Math.random() * 100 + "vw";

  // Ukuran acak antara 1–3px
  const ukuran = Math.random() * 2 + 1 + "px";
  partikel.style.width = ukuran;
  partikel.style.height = ukuran;

  // Durasi animasi acak (5–13 detik)
  partikel.style.animationDuration = Math.random() * 8 + 5 + "s";

  // Delay acak agar tidak muncul bersamaan
  partikel.style.animationDelay = Math.random() * 8 + "s";

  // Warna: 70% cyan, 30% oranye
  partikel.style.background = Math.random() > 0.7 ? "#ff6a00" : "#00d4ff";

  // Masukkan partikel ke kontainer
  particleContainer.appendChild(partikel);
}
