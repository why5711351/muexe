(function () {
  var calcBtn = document.getElementById('mc-calc');
  var result = document.getElementById('mc-result');

  function money(n) {
    return '$' + n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  }

  calcBtn.addEventListener('click', function () {
    var P = parseFloat(document.getElementById('mc-amount').value);
    var annual = parseFloat(document.getElementById('mc-rate').value);
    var years = parseInt(document.getElementById('mc-term').value, 10);
    var extra = parseFloat(document.getElementById('mc-extra').value) || 0;
    var tax = parseFloat(document.getElementById('mc-tax').value) || 0;
    var ins = parseFloat(document.getElementById('mc-ins').value) || 0;

    if (!P || isNaN(annual) || !years) {
      result.style.display = 'block';
      result.textContent = 'Please enter a valid loan amount, rate and term.';
      return;
    }

    var r = annual / 100 / 12;
    var n = years * 12;
    var monthly;
    if (r === 0) {
      monthly = P / n;
    } else {
      monthly = P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
    }

    var totalBase = monthly * n;
    var totalInterest = totalBase - P;

    // with extra payments
    var payoffMonths = n;
    var paidInterest = 0;
    if (extra > 0) {
      var bal = P, m = 0;
      while (bal > 0 && m < n * 2) {
        var interest = bal * r;
        var principal = monthly - interest + extra;
        bal -= principal;
        paidInterest += interest;
        m++;
        if (bal < 0) bal = 0;
      }
      payoffMonths = m;
    } else {
      paidInterest = totalInterest;
    }

    var escrow = (tax + ins) / 12;
    var totalMonthly = monthly + escrow + extra;

    result.style.display = 'block';
    result.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' +
      '<div><p class="note">Monthly payment (P&amp;I)</p><strong style="font-size:1.3rem">' + money(monthly) + '</strong></div>' +
      '<div><p class="note">With tax &amp; insurance</p><strong style="font-size:1.3rem">' + money(monthly + escrow) + '</strong></div>' +
      '<div><p class="note">Total interest paid</p><strong style="font-size:1.1rem">' + money(paidInterest) + '</strong></div>' +
      '<div><p class="note">Payoff time</p><strong style="font-size:1.1rem">' +
        (payoffMonths >= 12 ? Math.round(payoffMonths / 12) + ' years' : payoffMonths + ' months') + '</strong></div>' +
      '</div>' +
      '<p class="note">This is an estimate for guidance only — actual terms depend on your lender.</p>';
  });
})();
