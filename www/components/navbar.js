// ═══════════════════════════════════════
//  navbar.js
// ═══════════════════════════════════════
document.addEventListener("DOMContentLoaded", function () {
  var hamburger = document.getElementById("hamburger");
  var navLinks = document.getElementById("navLinks");
  var navOverlay = document.getElementById("navOverlay");

  if (!hamburger || !navLinks || !navOverlay) return;

  function bukaMenu() {
    hamburger.classList.add("open");
    navLinks.classList.add("open");
    navOverlay.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function tutupMenu() {
    hamburger.classList.remove("open");
    navLinks.classList.remove("open");
    navOverlay.classList.remove("show");
    document.body.style.overflow = "";
  }

  hamburger.addEventListener("click", function () {
    if (navLinks.classList.contains("open")) {
      tutupMenu();
    } else {
      bukaMenu();
    }
  });

  navOverlay.addEventListener("click", tutupMenu);

  var links = navLinks.querySelectorAll(".nav-link");
  links.forEach(function (link) {
    link.addEventListener("click", tutupMenu);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) tutupMenu();
  });

  // Auto aktif link sesuai halaman
  var page = window.location.pathname.split("/").pop() || "index.html";
  links.forEach(function (link) {
    if (link.getAttribute("href") === page) {
      link.classList.add("active");
    }
  });
});
