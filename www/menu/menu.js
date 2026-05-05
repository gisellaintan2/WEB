// ═══════════════════════════════════════
//  menu.js
//  1. Animasi Partikel
//  2. Hamburger Menu Toggle
// ═══════════════════════════════════════

// ── 1. PARTIKEL ──────────────────────
const particleContainer = document.getElementById("particles");
const jumlahPartikel = 25;

for (let i = 0; i < jumlahPartikel; i++) {
  const partikel = document.createElement("div");
  partikel.classList.add("particle");
  partikel.style.left = Math.random() * 100 + "vw";
  const ukuran = Math.random() * 2 + 1 + "px";
  partikel.style.width = ukuran;
  partikel.style.height = ukuran;
  partikel.style.animationDuration = Math.random() * 8 + 5 + "s";
  partikel.style.animationDelay = Math.random() * 6 + "s";
  partikel.style.background = Math.random() > 0.7 ? "#ff6a00" : "#00d4ff";
  particleContainer.appendChild(partikel);
}

// ── 2. HAMBURGER MENU ────────────────
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
const navOverlay = document.getElementById("navOverlay");

// Fungsi buka menu
function bukaMenu() {
  hamburger.classList.add("open");
  navLinks.classList.add("open");
  navOverlay.classList.add("show");
  document.body.style.overflow = "hidden"; // cegah scroll body
}

// Fungsi tutup menu
function tutupMenu() {
  hamburger.classList.remove("open");
  navLinks.classList.remove("open");
  navOverlay.classList.remove("show");
  document.body.style.overflow = "";
}

// Klik hamburger → toggle buka/tutup
hamburger.addEventListener("click", () => {
  if (navLinks.classList.contains("open")) {
    tutupMenu();
  } else {
    bukaMenu();
  }
});

// Klik overlay → tutup menu
navOverlay.addEventListener("click", tutupMenu);

// Klik salah satu link → tutup menu otomatis
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", tutupMenu);
});

// Jika layar diperbesar ke desktop → tutup menu otomatis
window.addEventListener("resize", () => {
  if (window.innerWidth > 900) {
    tutupMenu();
  }
});
