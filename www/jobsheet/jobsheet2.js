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
            const inputI1 = row.querySelector('.j2-i1');
            const inputI2 = row.querySelector('.j2-i2');
            const inputIs = row.querySelector('.j2-is');
            const calcCell = row.querySelector('.calc-cell');
            const statusCell = row.querySelector('.status-cell');

            const i1 = parseFloat(inputI1.value);
            const i2 = parseFloat(inputI2.value);
            const is = parseFloat(inputIs.value);
            const isTarget = parseFloat(inputIs.dataset.target); 

            [inputI1, inputI2, inputIs, statusCell].forEach(el => el.classList.remove('ok', 'err'));

            if (isNaN(i1) || isNaN(i2) || isNaN(is)) {
                allFilled = false; calcCell.textContent = "-"; statusCell.textContent = "-"; return;
            }

            const iSum = i1 + i2;
            calcCell.textContent = iSum.toFixed(2) + " A";

            if (isWithinTolerance(iSum, is) && isWithinTolerance(is, isTarget)) {
                [inputI1, inputI2, inputIs, statusCell].forEach(el => el.classList.add('ok'));
                statusCell.textContent = "KCL Valid"; totalScore += 50; 
            } else {
                [inputI1, inputI2, inputIs, statusCell].forEach(el => el.classList.add('err'));
                statusCell.textContent = "Berbeda!"; allCorrect = false;
            }
        });

        const evalResult = document.getElementById("evalResult");
        evalResult.style.display = "block";
        if (!allFilled) {
            evalResult.className = "eval-banner error";
            evalResult.innerHTML = `<i data-feather="alert-triangle"></i> Harap isi semua sel tabel terlebih dahulu.`;
        } else if (allCorrect) {
            evalResult.className = "eval-banner success";
            evalResult.innerHTML = `<i data-feather="check-circle"></i> Sempurna! (Nilai: ${totalScore}/100) Arus membuktikan persamaan KCL.`;
        } else {
            evalResult.className = "eval-banner error";
            evalResult.innerHTML = `<i data-feather="x-circle"></i> Evaluasi (Nilai: ${totalScore}/100) Terdapat perbedaan arus.`;
        }
        feather.replace();
    });

    btnPrint.addEventListener("click", () => window.print());
});
