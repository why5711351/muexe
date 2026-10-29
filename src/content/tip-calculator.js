(function () {
  var bill = document.getElementById('tip-bill');
  var pct = document.getElementById('tip-pct');
  var people = document.getElementById('tip-people');
  var result = document.getElementById('tip-result');

  function money(x) { return '$' + x.toFixed(2); }

  function calc() {
    var b = parseFloat(bill.value);
    var p = parseFloat(pct.value);
    var n = parseInt(people.value, 10);
    if (!n || n < 1) n = 1;
    if (isNaN(b) || b < 0 || isNaN(p) || p < 0) {
      result.innerHTML = '<p>Enter your bill amount and tip percentage.</p>';
      return;
    }
    var tip = b * p / 100;
    var total = b + tip;
    var per = total / n;
    result.innerHTML =
      '<p>Tip: <strong>' + money(tip) + '</strong></p>' +
      '<p>Total: <strong>' + money(total) + '</strong></p>' +
      '<p>Per person: <strong>' + money(per) + '</strong></p>';
  }

  bill.addEventListener('input', calc);
  pct.addEventListener('input', calc);
  people.addEventListener('input', calc);
  document.querySelectorAll('.tip-pct').forEach(function (btn) {
    btn.addEventListener('click', function () {
      pct.value = btn.getAttribute('data-pct');
      calc();
    });
  });
  calc();
})();
