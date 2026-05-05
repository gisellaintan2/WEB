document.addEventListener("DOMContentLoaded", () => {
    const btnEvaluate = document.getElementById("btnEvaluate");
    const btnPrint = document.getElementById("btnPrint");
    
    function isWithinTolerance(measured, expected) {
        if (expected === 0) return Math.abs(measured) < 0.1;
        const dev = Math.abs(expected - measured) / Math.abs(expected);
        return dev <= 0.05; // 5% max deviation
    }

    btnEvaluate.addEventListener("click", () => {
        const inputs = document.querySelectorAll('.j1-i');
        let allFilled = true, allCorrect = true, totalScore = 0;

        inputs.forEach(input => {
            const row = input.closest('tr');
            const calcCell = row.querySelector('.calc-cell');
            const statusCell = row.querySelector('.status-cell');
            const v = parseFloat(input.dataset.v);
            const r = parseFloat(input.dataset.r);
            const userI = parseFloat(input.value);
            const expectedI = v / r;

            input.classList.remove('ok', 'err'); statusCell.classList.remove('ok', 'err');

            if (isNaN(userI)) {
                allFilled = false; calcCell.textContent = "-"; statusCell.textContent = "-"; return;
            }

            const calcR = v / userI;
            calcCell.textContent = calcR.toFixed(2) + " Ω";

            if (isWithinTolerance(userI, expectedI)) {
                input.classList.add('ok'); statusCell.classList.add('ok');
                statusCell.textContent = "Sesuai"; totalScore += 33.3; 
            } else {
                input.classList.add('err'); statusCell.classList.add('err');
                statusCell.textContent = "Cek Ulang!"; allCorrect = false;
            }
        });
        
        if(totalScore > 90) totalScore = 100;

        const evalResult = document.getElementById("evalResult");
        evalResult.style.display = "block";
        if (!allFilled) {
            evalResult.className = "eval-banner error";
            evalResult.innerHTML = `<i data-feather="alert-triangle"></i> Harap isi semua sel pengukuran.`;
        } else if (allCorrect) {
            evalResult.className = "eval-banner success";
            evalResult.innerHTML = `<i data-feather="check-circle"></i> Sempurna! (Nilai: ${Math.round(totalScore)}/100) Status Hukum Ohm sangat presisi.`;
        } else {
            evalResult.className = "eval-banner error";
            evalResult.innerHTML = `<i data-feather="x-circle"></i> Evaluasi (Nilai: ${Math.round(totalScore)}/100) Periksa kembali sirkuit seri Anda.`;
        }
        feather.replace();
    });

    btnPrint.addEventListener("click", () => window.print());
});
