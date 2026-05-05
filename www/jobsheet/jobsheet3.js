document.addEventListener("DOMContentLoaded", () => {
    const btnEvaluate = document.getElementById("btnEvaluate");
    const btnPrint = document.getElementById("btnPrint");
    
    function isWithinTolerance(measured, expected) {
        if (expected === 0) return Math.abs(measured) < 0.1;
        const dev = Math.abs(expected - measured) / Math.abs(expected);
        return dev <= 0.05;
    }

    btnEvaluate.addEventListener("click", () => {
        const rows = document.querySelectorAll('tbody tr');
        let allFilled = true, allCorrect = true, totalScore = 0;

        rows.forEach(row => {
            const inV1 = row.querySelector('.j3-v1');
            const inV2 = row.querySelector('.j3-v2');
            const calcCell = row.querySelector('.calc-cell');
            const statusCell = row.querySelector('.status-cell');

            const v1 = parseFloat(inV1.value);
            const v2 = parseFloat(inV2.value);
            const expectedSum = 24.0;

            [inV1, inV2, statusCell].forEach(el => el.classList.remove('ok', 'err'));

            if (isNaN(v1) || isNaN(v2)) {
                allFilled = false; calcCell.textContent = "-"; statusCell.textContent = "-"; return;
            }

            const vSum = v1 + v2;
            calcCell.textContent = vSum.toFixed(2) + " V";

            if (isWithinTolerance(vSum, expectedSum)) {
                [inV1, inV2, statusCell].forEach(el => el.classList.add('ok'));
                statusCell.textContent = "Terbukti"; totalScore += 50; 
            } else {
                [inV1, inV2, statusCell].forEach(el => el.classList.add('err'));
                statusCell.textContent = "Melenceng"; allCorrect = false;
            }
        });

        const evalResult = document.getElementById("evalResult");
        evalResult.style.display = "block";
        if (!allFilled) {
            evalResult.className = "eval-banner error";
            evalResult.innerHTML = `<i data-feather="alert-triangle"></i> Harap isi semua sel tabel terlebih dahulu.`;
        } else if (allCorrect) {
            evalResult.className = "eval-banner success";
            evalResult.innerHTML = `<i data-feather="check-circle"></i> Sempurna! (Nilai: ${totalScore}/100) Total pembagi tegangan memenuhi KVL.`;
        } else {
            evalResult.className = "eval-banner error";
            evalResult.innerHTML = `<i data-feather="x-circle"></i> Evaluasi (Nilai: ${totalScore}/100) Tegangan tidak terserap habis/tersisa secara fatal.`;
        }
        feather.replace();
    });

    btnPrint.addEventListener("click", () => window.print());
});
