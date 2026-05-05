document.addEventListener("DOMContentLoaded", () => {
    const btnEvaluate = document.getElementById("btnEvaluate");
    const btnPrint = document.getElementById("btnPrint");
    
    function isWithinTolerance(measured, expected) {
        if (expected === 0) return Math.abs(measured) < 0.1;
        const dev = Math.abs(expected - measured) / Math.abs(expected);
        return dev <= 0.05;
    }

    btnEvaluate.addEventListener("click", () => {
        const inputIt = document.querySelector('.j4-it');
        const inputVt = document.querySelector('.j4-vt');
        const calcCell = document.querySelector('.calc-cell');
        const statusCell = document.querySelector('.status-cell');

        let allFilled = true, allCorrect = true, totalScore = 0;
        
        const it = parseFloat(inputIt.value);
        const vt = parseFloat(inputVt.value);
        // expected req is 10 ohm
        const expectedReq = parseFloat(inputVt.dataset.req);

        [inputIt, inputVt, statusCell].forEach(el => el.classList.remove('ok', 'err'));

        if (isNaN(it) || isNaN(vt)) {
            allFilled = false; calcCell.textContent = "-"; statusCell.textContent = "-"; 
        } else {
            const req = vt / it;
            calcCell.textContent = req.toFixed(2) + " Ω";
            
            if (isWithinTolerance(req, expectedReq) && isWithinTolerance(vt, 30)) {
                [inputIt, inputVt, statusCell].forEach(el => el.classList.add('ok'));
                 statusCell.textContent = "Benar"; totalScore = 100;
            } else {
                 [inputIt, inputVt, statusCell].forEach(el => el.classList.add('err'));
                 statusCell.textContent = "Salah"; allCorrect = false;
            }
        }

        const evalResult = document.getElementById("evalResult");
        evalResult.style.display = "block";
        if (!allFilled) {
            evalResult.className = "eval-banner error";
            evalResult.innerHTML = `<i data-feather="alert-triangle"></i> Harap isi kolom terlebih dahulu.`;
        } else if (allCorrect) {
            evalResult.className = "eval-banner success";
            evalResult.innerHTML = `<i data-feather="check-circle"></i> Sempurna! (Nilai: ${totalScore}/100) Daya nalar pada sirkuit kompleks sangat tajam!`;
        } else {
            evalResult.className = "eval-banner error";
            evalResult.innerHTML = `<i data-feather="x-circle"></i> Evaluasi (Nilai: 0/100) Kemungkinan Anda salah pasang resistor paralelnya.`;
        }
        feather.replace();
    });

    btnPrint.addEventListener("click", () => window.print());
});
