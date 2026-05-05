// ═══════════════════════════════════════
//  materi.js — Animasi partikel
// ═══════════════════════════════════════
const container = document.getElementById("particles");
for (let i = 0; i < 20; i++) {
  const p = document.createElement("div");
  p.classList.add("particle");
  p.style.left = Math.random() * 100 + "vw";
  const s = Math.random() * 2 + 1 + "px";
  p.style.width = p.style.height = s;
  p.style.animationDuration = Math.random() * 8 + 5 + "s";
  p.style.animationDelay = Math.random() * 6 + "s";
  p.style.background = Math.random() > 0.7 ? "#ff6a00" : "#00d4ff";
  container.appendChild(p);
}

// ═══════════════════════════════════════
//  Animasi Elektron Diagram Seri
// ═══════════════════════════════════════
(function () {
  var svg = document.getElementById("diagram-seri");
  if (!svg) return;

  // Jalur elektron: titik-titik waypoint [x, y]
  // Atas kiri → R1 → R2 → R3 → kanan → bawah → kiri → baterai
  var path = [
    [40, 25],
    [80, 25],
    [120, 25],
    [160, 25],
    [200, 25],
    [240, 25],
    [280, 25],
    [320, 25],
    [320, 60],
    [320, 95],
    [260, 95],
    [180, 95],
    [100, 95],
    [40, 95],
    [40, 78],
    [40, 62],
    [40, 42],
    [40, 25],
  ];

  var elektrons = svg.querySelectorAll(".elektron");

  // Posisi awal tiap elektron berbeda (offset)
  var offsets = [0, 0.33, 0.66];

  function getTotalLength() {
    var total = 0;
    for (var i = 1; i < path.length; i++) {
      var dx = path[i][0] - path[i - 1][0];
      var dy = path[i][1] - path[i - 1][1];
      total += Math.sqrt(dx * dx + dy * dy);
    }
    return total;
  }

  function getPosAtFraction(frac) {
    var total = getTotalLength();
    var target = frac * total;
    var acc = 0;
    for (var i = 1; i < path.length; i++) {
      var dx = path[i][0] - path[i - 1][0];
      var dy = path[i][1] - path[i - 1][1];
      var seg = Math.sqrt(dx * dx + dy * dy);
      if (acc + seg >= target) {
        var t = (target - acc) / seg;
        return [path[i - 1][0] + dx * t, path[i - 1][1] + dy * t];
      }
      acc += seg;
    }
    return path[path.length - 1];
  }

  var fracs = offsets.slice();
  var speed = 0.0008;

  function animate() {
    for (var i = 0; i < elektrons.length; i++) {
      fracs[i] = (fracs[i] + speed) % 1;
      var pos = getPosAtFraction(fracs[i]);
      elektrons[i].setAttribute("cx", pos[0]);
      elektrons[i].setAttribute("cy", pos[1]);
    }
    requestAnimationFrame(animate);
  }

  // Set posisi awal
  for (var i = 0; i < elektrons.length; i++) {
    var pos = getPosAtFraction(fracs[i]);
    elektrons[i].setAttribute("cx", pos[0]);
    elektrons[i].setAttribute("cy", pos[1]);
  }

  animate();
})();

// ═══════════════════════════════════════
//  Animasi Elektron Diagram Paralel
// ═══════════════════════════════════════
(function () {
  var svg = document.getElementById("diagram-paralel");
  if (!svg) return;

  // Jalur tiap cabang: atas → turun cabang → bawah → naik balik
  var pathMain = [
    [40, 20],
    [300, 20],
    [300, 140],
    [40, 140],
    [40, 20],
  ];
  var pathR1 = [
    [120, 20],
    [120, 42],
    [120, 98],
    [120, 140],
  ];
  var pathR2 = [
    [180, 20],
    [180, 42],
    [180, 98],
    [180, 140],
  ];
  var pathR3 = [
    [240, 20],
    [240, 42],
    [240, 98],
    [240, 140],
  ];

  function getPos(path, frac) {
    var total = 0;
    for (var i = 1; i < path.length; i++) {
      var dx = path[i][0] - path[i - 1][0],
        dy = path[i][1] - path[i - 1][1];
      total += Math.sqrt(dx * dx + dy * dy);
    }
    var target = frac * total,
      acc = 0;
    for (var i = 1; i < path.length; i++) {
      var dx = path[i][0] - path[i - 1][0],
        dy = path[i][1] - path[i - 1][1];
      var seg = Math.sqrt(dx * dx + dy * dy);
      if (acc + seg >= target) {
        var t = (target - acc) / seg;
        return [path[i - 1][0] + dx * t, path[i - 1][1] + dy * t];
      }
      acc += seg;
    }
    return path[path.length - 1];
  }

  var e1 = svg.querySelector(".elek-p1");
  var e2 = svg.querySelector(".elek-p2");
  var e3 = svg.querySelector(".elek-p3");
  var em = svg.querySelector(".elek-main");

  var f1 = 0,
    f2 = 0.5,
    f3 = 0.25,
    fm = 0;
  var spd = 0.006;

  function animate() {
    f1 = (f1 + spd) % 1;
    f2 = (f2 + spd) % 1;
    f3 = (f3 + spd) % 1;
    fm = (fm + spd * 0.5) % 1;
    var p1 = getPos(pathR1, f1),
      p2 = getPos(pathR2, f2);
    var p3 = getPos(pathR3, f3),
      pm = getPos(pathMain, fm);
    if (e1) {
      e1.setAttribute("cx", p1[0]);
      e1.setAttribute("cy", p1[1]);
    }
    if (e2) {
      e2.setAttribute("cx", p2[0]);
      e2.setAttribute("cy", p2[1]);
    }
    if (e3) {
      e3.setAttribute("cx", p3[0]);
      e3.setAttribute("cy", p3[1]);
    }
    if (em) {
      em.setAttribute("cx", pm[0]);
      em.setAttribute("cy", pm[1]);
    }
    requestAnimationFrame(animate);
  }
  animate();
})();
