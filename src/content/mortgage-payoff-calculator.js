(function () {
  var calcBtn = document.getElementById('pc-calc');
  var result = document.getElementById('pc-result');

  var CURRENCIES = {
    USD: { symbol: '$', locale: 'en-US' },
    EUR: { symbol: '€', locale: 'de-DE' },
    GBP: { symbol: '£', locale: 'en-GB' },
    CAD: { symbol: 'C$', locale: 'en-CA' },
    AUD: { symbol: 'A$', locale: 'en-AU' },
    JPY: { symbol: '¥', locale: 'ja-JP' },
    CNY: { symbol: '¥', locale: 'zh-CN' }
  };

  function money(n, cur) {
    var c = CURRENCIES[cur] || CURRENCIES.USD;
    var s = n.toLocaleString(c.locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
    return c.symbol + s;
  }

  function fmtTime(months) {
    months = Math.round(months);
    var y = Math.floor(months / 12);
    var m = months % 12;
    if (y === 0) return m + ' mo';
    if (m === 0) return y + ' yr';
    return y + ' yr ' + m + ' mo';
  }

  function fmtDate(months) {
    var d = new Date();
    d.setMonth(d.getMonth() + Math.round(months));
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  // Build an amortization plan with optional extra payment.
  // Returns { months, totalInterest, rows:[{start,int,prin,pay,end,m}] }
  function buildPlan(P, r, monthly, extra) {
    var balance = P, months = 0, totalInterest = 0, rows = [];
    var yearStart = P, yInt = 0, yPrin = 0, yPay = 0;
    var cap = 1200; // 100 years safety
    while (balance > 0.005 && months < cap) {
      var interest = balance * r;
      var principal = monthly - interest + extra;
      if (principal <= 0.0001) break; // payment can't even cover interest
      balance = Math.max(0, balance - principal);
      totalInterest += interest;
      months++;
      yInt += interest;
      yPrin += principal;
      yPay += monthly + extra;
      if (months % 12 === 0) {
        rows.push({ start: yearStart, int: yInt, prin: yPrin, pay: yPay, end: balance, m: months });
        yearStart = balance; yInt = 0; yPrin = 0; yPay = 0;
      }
    }
    if (months % 12 !== 0 && months > 0) {
      rows.push({ start: yearStart, int: yInt, prin: yPrin, pay: yPay, end: balance, m: months });
    }
    return { months: months, totalInterest: totalInterest, rows: rows };
  }

  function yearLabel(row) {
    var fullYears = Math.floor(row.m / 12);
    var rem = row.m % 12;
    if (rem === 0) return String(fullYears);
    return fullYears + ' (' + rem + ' mo)';
  }

  function renderTable(rows, cur, title) {
    var body = rows.map(function (r) {
      return '<tr><td>' + yearLabel(r) + '</td><td>' + money(r.start, cur) + '</td><td>' +
        money(r.pay, cur) + '</td><td>' + money(r.int, cur) + '</td><td>' +
        money(r.prin, cur) + '</td><td>' + money(r.end, cur) + '</td></tr>';
    }).join('');
    return '<h3 style="margin:18px 0 10px;font-size:1rem">' + title + '</h3>' +
      '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.86rem">' +
      '<thead><tr style="border-bottom:2px solid #e2e8f0;color:#475569">' +
      '<th style="text-align:left;padding:8px 6px">Year</th>' +
      '<th style="text-align:right;padding:8px 6px">Start balance</th>' +
      '<th style="text-align:right;padding:8px 6px">Paid</th>' +
      '<th style="text-align:right;padding:8px 6px">Interest</th>' +
      '<th style="text-align:right;padding:8px 6px">Principal</th>' +
      '<th style="text-align:right;padding:8px 6px">End balance</th>' +
      '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  // store last computed plans for the toggle
  var lastBase = null, lastExtra = null, lastCur = 'USD', lastExtraAmt = 0;

  function showTable(which) {
    var wrap = document.getElementById('pc-table');
    if (!wrap || !lastBase) return;
    if (which === 'base') {
      wrap.innerHTML = renderTable(lastBase.rows, lastCur, 'Original schedule — year by year');
    } else {
      wrap.innerHTML = renderTable(lastExtra.rows, lastCur, 'Accelerated schedule — year by year');
    }
  }

  calcBtn.addEventListener('click', function () {
    var P = parseFloat(document.getElementById('pc-amount').value);
    var annual = parseFloat(document.getElementById('pc-rate').value);
    var years = parseFloat(document.getElementById('pc-term').value);
    var extra = parseFloat(document.getElementById('pc-extra').value) || 0;
    var cur = document.getElementById('pc-currency').value;

    if (!(P > 0) || isNaN(annual) || annual < 0 || !(years > 0)) {
      result.style.display = 'block';
      result.innerHTML = '<p class="note">Please enter a valid loan balance, interest rate and remaining term.</p>';
      return;
    }
    if (extra < 0) extra = 0;

    var r = annual / 100 / 12;
    var n = Math.round(years * 12);
    var monthly;
    if (r === 0) {
      monthly = P / n;
    } else {
      monthly = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    }

    var base = buildPlan(P, r, monthly, 0);
    var accel = buildPlan(P, r, monthly, extra);

    lastBase = base; lastExtra = accel; lastCur = cur; lastExtraAmt = extra;

    var monthsSaved = Math.max(0, base.months - accel.months);
    var interestSaved = Math.max(0, base.totalInterest - accel.totalInterest);
    var baseTotal = P + base.totalInterest;
    var accelTotal = P + accel.totalInterest;

    var html =
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:8px">' +
        '<div style="background:#ecfdf5;border:1px solid #a7e3cf;border-radius:10px;padding:14px">' +
          '<p class="note" style="margin:0">Interest saved</p>' +
          '<strong style="font-size:1.4rem;color:#059669">' + money(interestSaved, cur) + '</strong></div>' +
        '<div style="background:#eff6ff;border:1px solid #bfd3fb;border-radius:10px;padding:14px">' +
          '<p class="note" style="margin:0">Paid off sooner</p>' +
          '<strong style="font-size:1.4rem;color:#2563eb">' + fmtTime(monthsSaved) + '</strong></div>' +
        '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px">' +
          '<p class="note" style="margin:0">New payoff date</p>' +
          '<strong style="font-size:1.15rem">' + fmtDate(accel.months) + '</strong></div>' +
        '<div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:14px">' +
          '<p class="note" style="margin:0">Original payoff date</p>' +
          '<strong style="font-size:1.15rem">' + fmtDate(base.months) + '</strong></div>' +
      '</div>';

    // comparison table
    html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:.9rem;margin-top:14px">' +
      '<thead><tr style="border-bottom:2px solid #e2e8f0">' +
      '<th style="text-align:left;padding:10px 8px"></th>' +
      '<th style="text-align:right;padding:10px 8px;color:#64748b">Original plan</th>' +
      '<th style="text-align:right;padding:10px 8px;color:#2563eb">With extra payment</th>' +
      '</tr></thead><tbody>' +
      '<tr><td style="padding:10px 8px;font-weight:600">Monthly payment</td>' +
      '<td style="text-align:right;padding:10px 8px">' + money(monthly, cur) + '</td>' +
      '<td style="text-align:right;padding:10px 8px">' + money(monthly + extra, cur) + '</td></tr>' +
      '<tr><td style="padding:10px 8px;font-weight:600">Payoff time</td>' +
      '<td style="text-align:right;padding:10px 8px">' + fmtTime(base.months) + '</td>' +
      '<td style="text-align:right;padding:10px 8px;color:#059669;font-weight:700">' + fmtTime(accel.months) + '</td></tr>' +
      '<tr><td style="padding:10px 8px;font-weight:600">Total interest</td>' +
      '<td style="text-align:right;padding:10px 8px">' + money(base.totalInterest, cur) + '</td>' +
      '<td style="text-align:right;padding:10px 8px;color:#059669;font-weight:700">' + money(accel.totalInterest, cur) + '</td></tr>' +
      '<tr><td style="padding:10px 8px;font-weight:600">Total repaid</td>' +
      '<td style="text-align:right;padding:10px 8px">' + money(baseTotal, cur) + '</td>' +
      '<td style="text-align:right;padding:10px 8px;color:#059669;font-weight:700">' + money(accelTotal, cur) + '</td></tr>' +
      '</tbody></table></div>';

    // toggle + year-by-year table
    html += '<div style="display:flex;gap:8px;margin-top:18px">' +
      '<button class="btn-secondary" style="padding:7px 14px;font-size:.85rem" data-which="extra">Accelerated</button>' +
      '<button class="btn-secondary" style="padding:7px 14px;font-size:.85rem" data-which="base">Original</button>' +
      '</div>' +
      '<div id="pc-table"></div>' +
      '<p class="note" style="margin-top:12px">Estimates for guidance only — actual terms depend on your lender and whether prepayment penalties apply.</p>';

    result.innerHTML = html;
    result.style.display = 'block';
    showTable('extra');

    // wire up toggle buttons
    result.querySelectorAll('[data-which]').forEach(function (b) {
      b.addEventListener('click', function () { showTable(b.getAttribute('data-which')); });
    });
  });
})();
