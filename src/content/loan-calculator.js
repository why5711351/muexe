(function () {
  var amount = document.getElementById('loan-amount');
  var rate = document.getElementById('loan-rate');
  var term = document.getElementById('loan-term');
  var result = document.getElementById('loan-result');

  function money(x) { return '$' + x.toFixed(2); }

  function calc() {
    var P = parseFloat(amount.value);
    var annual = parseFloat(rate.value);
    var years = parseInt(term.value, 10);
    if (isNaN(P) || P <= 0 || isNaN(annual) || annual < 0 || !years || years < 1) {
      result.innerHTML = '<p>Enter your loan amount, rate and term.</p>';
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
    var totalPaid = monthly * n;
    var totalInterest = totalPaid - P;

    var bal = P;
    var rows = '';
    for (var year = 1; year <= Math.ceil(n / 12); year++) {
      var yearlyInterest = 0, yearlyPrincipal = 0;
      for (var m = 0; m < 12 && (year - 1) * 12 + m < n; m++) {
        var interest = bal * r;
        var principal = monthly - interest;
        bal -= principal;
        yearlyInterest += interest;
        yearlyPrincipal += principal;
      }
      rows += '<tr><td>' + year + '</td><td>' + money(yearlyPrincipal) + '</td><td>' + money(yearlyInterest) + '</td><td>' + money(Math.max(bal, 0)) + '</td></tr>';
    }

    result.innerHTML =
      '<p>Monthly payment: <strong>' + money(monthly) + '</strong></p>' +
      '<p>Total interest: <strong>' + money(totalInterest) + '</strong></p>' +
      '<p>Total repayment: <strong>' + money(totalPaid) + '</strong></p>' +
      '<table class="cat-table"><thead><tr><th>Year</th><th>Principal</th><th>Interest</th><th>Balance</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  amount.addEventListener('input', calc);
  rate.addEventListener('input', calc);
  term.addEventListener('input', calc);
  calc();
})();
