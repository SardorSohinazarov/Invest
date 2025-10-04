function fmt(n) {
    // ikki xonali koma bilan va mahalliy format
    return Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calculateInvestment({ principal, years, ratePercent, rateIsMonthly, compoundMonthly, monthlyContribution = 0}) {
    principal = Number(principal);
    years = parseInt(years, 10);
    ratePercent = Number(ratePercent);
    monthlyContribution = Number(monthlyContribution) || 0;

    if (isNaN(principal) || isNaN(years) || isNaN(ratePercent) || principal < 0 || years < 0 || ratePercent < 0 || monthlyContribution < 0) {
    throw new Error("Noto'g'ri kirish qiymatlari.");
    }

    const periods = [];
    const start = new Date();
    if (compoundMonthly) {
        const totalMonths = years * 12;
        const monthlyRate = rateIsMonthly ? (ratePercent / 100) : ((ratePercent / 100) / 12);
        let balance = principal;
        for (let m = 1; m <= totalMonths; m++) {
            const prev = balance;
            // foizni qo'shamiz
            // so'ngra oy oxirida qo'shamiz (agar foydalanuvchi kiritgan bo'lsa)
            if (m > 1 && monthlyContribution > 0) {
                balance = +(balance + monthlyContribution).toFixed(8);
            }
            balance = +(balance * (1 + monthlyRate)).toFixed(8);
            
            const interest = +(balance - prev - ((m > 1 && monthlyContribution > 0) ? monthlyContribution : 0)).toFixed(8);
            periods.push({
            index: m,
            date: new Date(start.getFullYear(), start.getMonth() + m, start.getDate()),
            previous: +prev.toFixed(2),
            monthlyContribution: (m > 1 && monthlyContribution > 0) ? monthlyContribution : 0,
            balance: +balance.toFixed(2),
            interest: +interest.toFixed(2)
            });
        }
    } 
    else
    {
        const totalYears = years;
        const annualRate = rateIsMonthly ? ((ratePercent / 100) * 12) : (ratePercent / 100);
        let balance = principal;
        for (let y = 1; y <= totalYears; y++) {
            const prev = balance;
            balance = +(balance * (1 + annualRate)).toFixed(8);

            if (monthlyContribution > 0) {
                balance = +(balance + monthlyContribution * 12).toFixed(8);
            }

            const interest = +(balance - prev - (monthlyContribution > 0 ? monthlyContribution * 12 : 0)).toFixed(8);

            periods.push({
                index: y,
                date: new Date(start.getFullYear() + y, start.getMonth(), start.getDate()),
                previous: +prev.toFixed(2),
                monthlyContribution: 0,
                balance: +balance.toFixed(2),
                interest: +interest.toFixed(2)
            });
        }
    }

    const final = periods.length ? periods[periods.length - 1].balance : principal;
    const totalContrib = monthlyContribution * (compoundMonthly ? (years * 12) : (years * 12));
    const totalInterest = +(final - principal - totalContrib).toFixed(2);

    return { periods, final: +final.toFixed(2), totalInterest, periodUnit: compoundMonthly ? 'oy' : 'yil' };
}

function buildTableHtml(result) {
    if (!result.periods.length) return '<div style="padding:12px">Hech qanday davr yo‘q (yillar=0)</div>';

    const header = `<table>
        <thead>
            <tr>
                <th>Davr</th>
                <th>Sanasi</th>
                <th>Oy boshida</th>
                <th>Oylik investitsiya</th>
                <th>Foyda</th>
                <th>Oy oxirida</th>
            </tr>
        </thead>
        <tbody>`;

    const rows = result.periods.map(p => {
    // period label
    const label = result.periodUnit === 'oy' ? `${p.index} - oy` : `${p.index} - yil`;
    const dateStr = p.date ? new Date(p.date).toLocaleDateString() : '-';
    return `<tr>
        <td style="text-align:center">${label}</td>
        <td style="text-align:center">${dateStr}</td>
        <td style="text-align:center">${fmt(p.previous)}</td>
        <td style="text-align:center">${fmt(p.monthlyContribution)}</td>
        <td style="text-align:center">${fmt(p.interest)}</td>
        <td style="text-align:center">${fmt(p.balance)}</td>
    </tr>`;
    }).join("");

    return header + rows + '</tbody></table>';
}

document.getElementById('calcBtn').addEventListener('click', () => {
    try {
    const principal = document.getElementById('principal').value;
    const years = document.getElementById('years').value;
    const rate = document.getElementById('rate').value;
    const rateType = document.getElementById('rateType').value;
    const compoundType = document.getElementById('compoundType').value;
    const monthlyContribution = document.getElementById('monthlyContribution').value || 0;

    const rateIsMonthly = rateType === 'monthly';
    const compoundMonthly = compoundType === 'monthly';

    const res = calculateInvestment({
        principal,
        years,
        ratePercent: rate,
        rateIsMonthly,
        compoundMonthly,
        monthlyContribution
    });

    document.getElementById('result').style.display = 'block';
    document.getElementById('finalBalance').textContent = fmt(res.final) + " so'm";
    document.getElementById('totalInterest').textContent = fmt(res.totalInterest) + " so'm";
    document.getElementById('periodType').textContent = `${years} yil davomida ` + ((res.periodUnit === 'oy') ? `oyma-oy ${fmt(monthlyContribution)}` : `yilda bir ${fmt(monthlyContribution)}`) + ' dan';

    document.getElementById('tableWrap').innerHTML = buildTableHtml(res);

    // Save last result for CSV export
    window._lastCalcResult = res;
    } catch (err) {
    alert(err.message || "Hisoblashda xatolik.");
    }
});

// CSV export (soddalashtirilgan)
document.getElementById('exportCsv').addEventListener('click', () => {
    const res = window._lastCalcResult;
    if (!res) { alert("Avval hisoblang."); return; }
    const rows = [
    ['Index', 'Sana', 'Davr', 'Balans', 'Ushbu davrdagi foiz']
    ];
    res.periods.forEach(p => {
    const dateStr = p.date ? new Date(p.date).toLocaleDateString() : '';
    const label = res.periodUnit === 'oy' ? `${p.index} - oy` : `${p.index} - yil`;
    rows.push([p.index, dateStr, label, p.balance.toFixed(2), p.interest.toFixed(2)]);
    });
    const csvContent = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `investment_periods_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
});
