document.addEventListener("DOMContentLoaded", () => {
    const CALC_COLORS = {
        0: { code: "#111", name: "Hitam" },
        1: { code: "#8b4513", name: "Coklat" },
        2: { code: "#cc0000", name: "Merah" },
        3: { code: "#ff8c00", name: "Oranye" },
        4: { code: "#ffd700", name: "Kuning" },
        5: { code: "#228b22", name: "Hijau" },
        6: { code: "#0000cd", name: "Biru" },
        7: { code: "#8a2be2", name: "Ungu" },
        8: { code: "#808080", name: "Abu-abu" },
        9: { code: "#f0f8ff", name: "Putih" }
    };
    
    const MULT_COLORS = {
        0: { code: "#111", val: 1, name: "Hitam (x1)" },
        1: { code: "#8b4513", val: 10, name: "Coklat (x10)" },
        2: { code: "#cc0000", val: 100, name: "Merah (x100)" },
        3: { code: "#ff8c00", val: 1000, name: "Oranye (x1K)" },
        4: { code: "#ffd700", val: 10000, name: "Kuning (x10K)" },
        5: { code: "#228b22", val: 100000, name: "Hijau (x100K)" },
        6: { code: "#0000cd", val: 1000000, name: "Biru (x1M)" },
        7: { code: "#8a2be2", val: 10000000, name: "Ungu (x10M)" },
        8: { code: "#808080", val: 100000000, name: "Abu-abu (x100M)" },
        9: { code: "#f0f8ff", val: 1000000000, name: "Putih (x1G)" },
        gold: { code: "#d4af37", val: 0.1, name: "Emas (x0.1)" },
        silver: { code: "#bdc3c7", val: 0.01, name: "Perak (x0.01)" }
    };

    const TOL_COLORS = {
        brown: { code: "#8b4513", val: 1, name: "Coklat" },
        red: { code: "#cc0000", val: 2, name: "Merah" },
        orange: { code: "#ff8c00", val: 3, name: "Oranye" },
        yellow: { code: "#ffd700", val: 4, name: "Kuning" },
        green: { code: "#228b22", val: 0.5, name: "Hijau" },
        blue: { code: "#0000cd", val: 0.25, name: "Biru" },
        violet: { code: "#8a2be2", val: 0.1, name: "Ungu" },
        gray: { code: "#808080", val: 0.05, name: "Abu-abu" },
        gold: { code: "#d4af37", val: 5, name: "Emas" },
        silver: { code: "#bdc3c7", val: 10, name: "Perak" },
    };

    let calcState = { b1: 1, b2: 0, b3: 2, b4: 'gold' };

    function buildGrid(gridId, sourceObj, bandKey, isTol) {
        const grid = document.getElementById(gridId);
        Object.keys(sourceObj).forEach(k => {
            const cube = document.createElement("div");
            cube.className = "color-cube";
            cube.style.backgroundColor = sourceObj[k].code;
            
            let hoverText = isTol ? `±${sourceObj[k].val}% (${sourceObj[k].name})` : (sourceObj[k].name || k);
            cube.title = hoverText;
            
            if (calcState[bandKey] == k) cube.classList.add("active");

            cube.addEventListener("click", () => {
                grid.querySelectorAll(".color-cube").forEach(el => el.classList.remove("active"));
                cube.classList.add("active");
                calcState[bandKey] = isTol ? k : (isNaN(k) ? k : parseInt(k));
                updateCalcResult();
            });
            grid.appendChild(cube);
        });
    }

    buildGrid("gridB1", CALC_COLORS, "b1", false);
    buildGrid("gridB2", CALC_COLORS, "b2", false);
    buildGrid("gridB3", MULT_COLORS, "b3", false);
    buildGrid("gridB4", TOL_COLORS, "b4", true);
    
    function updateCalcResult() {
        const val = (calcState.b1 * 10) + calcState.b2;
        const multiplier = MULT_COLORS[calcState.b3].val;
        let total = val * multiplier;
        
        let unit = "Ω";
        if (total >= 1000000000) { total = total / 1000000000; unit = "GΩ"; }
        else if (total >= 1000000) { total = total / 1000000; unit = "MΩ"; }
        else if (total >= 1000) { total = total / 1000; unit = "kΩ"; }
        
        // Let's format nicely. Avoid "1.00", keep "1", but "1.20" keep "1.2"
        let totalStr = Number.isInteger(total) ? total : parseFloat(total.toFixed(2));

        const tolVal = TOL_COLORS[calcState.b4].val;
        document.getElementById("calcResult").textContent = `${totalStr} ${unit} ±${tolVal}%`;

        document.getElementById("calcB1").setAttribute("fill", CALC_COLORS[calcState.b1].code);
        document.getElementById("calcB2").setAttribute("fill", CALC_COLORS[calcState.b2].code);
        document.getElementById("calcB3").setAttribute("fill", MULT_COLORS[calcState.b3].code);
        document.getElementById("calcB4").setAttribute("fill", TOL_COLORS[calcState.b4].code);
    }
    
    updateCalcResult();
});
