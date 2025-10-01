// JavaScriptdagi hisoblash: C#dagi logikaga moslash
function calculate(principal, years, ratePercent, rateIsMonthly, compoundMonthly) {
    principal = Number(principal);
    years = parseInt(years, 10);
    ratePercent = Number(ratePercent);
    if (isNaN(principal) || isNaN(years) || isNaN(ratePercent)) return null;
    if (principal < 0 || years < 0 || ratePercent < 0) return null;

    const periods = [];
    if (compoundMonthly) {
    const totalMonths = years * 12;
    let monthlyRate;
    if (rateIsMonthly) {
        monthlyRate = ratePercent / 100.0;
    } else {
        monthlyRate = (ratePercent / 100.0) / 12.0;
    }
    let balance = principal;
    for (let m = 1; m <= totalMonths; m++) {
        const old = balance;
        balance = +(balance * (1 + monthlyRate)).toFixed(8);
        periods.push({ idx: m, dateOffsetMonths: m, balance: balance, interest: +(balance - old).toFixed(8) });
    }
    const final = periods.length ? Number(periods[periods.length - 1].balance) : principal;
    const totalInterest = +(final - principal).toFixed(8);
    return { periods, final, totalInterest, periodUnit: 'oy' };
    } else {
    const totalYears = years;
    let annualRate;
    if (rateIsMonthly) {
        annualRate = (ratePercent / 100.0) * 12.0;
    } else {
        annualRate = ratePercent / 100.0;
    }
    let balance = principal;
    for (let y = 1; y <= totalYears; y++) {
        const old = balance;
        balance = +(balance * (1 + annualRate)).toFixed(8);
        periods.push({ idx: y, dateOffsetYears: y, balance: balance, interest: +(balance - old).toFixed(8) });
    }
    const final = periods.length ? Number(periods[periods.length - 1].balance) : principal;
    const totalInterest = +(final - principal).toFixed(8);
    return { periods, final, totalInterest, periodUnit: 'yil' };
    }
}

function formatNumber(x) {
    // 2 onlikgacha chiqarsin
    return Number(x).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

document.getElementById('calc').addEventListener('click', () => {
    const principal = document.getElementById('principal').value;
    const years = document.getElementById('years').value;
    const rate = document.getElementById('rate').value;
    const rateType = document.getElementById('rateType').value;
    const compoundMonthly = document.getElementById('compoundMonthly').checked;

    const rateIsMonthly = (rateType === 'month');

    const res = calculate(principal, years, rate, rateIsMonthly, compoundMonthly);
    if (!res) {
    alert('Iltimos, barcha maydonlarni to\'g\'ri to\'ldiring va manfiy qiymat bermang.');
    return;
    }

    document.getElementById('result').style.display = 'block';
    document.getElementById('finalBalance').textContent = formatNumber(res.final);
    document.getElementById('totalInterest').textContent = formatNumber(res.totalInterest);
    document.getElementById('periodType').textContent = res.periodUnit === 'oy' ? 'Oyma-oy' : 'Yillik';

    // Jadval yaratish
    const wrap = document.getElementById('tableWrap');
    let html = '<table><thead><tr><th>#</th><th>Davr</th><th>Balans</th><th>Ushbu davrdagi foiz</th></tr></thead><tbody>';
    if (res.periods.length === 0) {
    html += `<tr><td colspan="4" style="text-align:center">Hech qanday davr yo'q (yillar=0)</td></tr>`;
    } else {
    res.periods.forEach(p => {
        const periodLabel = (res.periodUnit === 'oy') ? `${p.idx} - oy` : `${p.idx} - yil`;
        html += `<tr>
                <td>${p.idx}</td>
                <td>${periodLabel}</td>
                <td>${formatNumber(p.balance)}</td>
                <td>${formatNumber(p.interest)}</td>
                </tr>`;
    });
    }
    html += '</tbody></table>';
    wrap.innerHTML = html;
});
