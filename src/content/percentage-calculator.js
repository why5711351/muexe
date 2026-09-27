(function () {
  function fmt(n) {
    return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  // 1. What is X% of Y?
  document.getElementById('pct-run1').addEventListener('click', function () {
    var x = parseFloat(document.getElementById('pct-x1').value);
    var y = parseFloat(document.getElementById('pct-y1').value);
    var box = document.getElementById('pct-r1');
    if (isNaN(x) || isNaN(y)) { box.style.display = 'block'; box.textContent = 'Please enter both numbers.'; return; }
    var r = y * x / 100;
    box.style.display = 'block';
    box.innerHTML = x + '% of ' + fmt(y) + ' = <strong>' + fmt(r) + '</strong>';
  });

  // 2. X is what percent of Y?
  document.getElementById('pct-run2').addEventListener('click', function () {
    var x = parseFloat(document.getElementById('pct-x2').value);
    var y = parseFloat(document.getElementById('pct-y2').value);
    var box = document.getElementById('pct-r2');
    if (isNaN(x) || isNaN(y)) { box.style.display = 'block'; box.textContent = 'Please enter both numbers.'; return; }
    if (y === 0) { box.style.display = 'block'; box.textContent = 'Y cannot be zero.'; return; }
    var r = x / y * 100;
    box.style.display = 'block';
    box.innerHTML = fmt(x) + ' is <strong>' + fmt(r) + '%</strong> of ' + fmt(y);
  });

  // 3. Percentage change from A to B
  document.getElementById('pct-run3').addEventListener('click', function () {
    var a = parseFloat(document.getElementById('pct-x3').value);
    var b = parseFloat(document.getElementById('pct-y3').value);
    var box = document.getElementById('pct-r3');
    if (isNaN(a) || isNaN(b)) { box.style.display = 'block'; box.textContent = 'Please enter both numbers.'; return; }
    if (a === 0) { box.style.display = 'block'; box.textContent = 'Original value cannot be zero.'; return; }
    var r = (b - a) / Math.abs(a) * 100;
    var dir = r >= 0 ? 'increase' : 'decrease';
    box.style.display = 'block';
    box.innerHTML = 'Change from ' + fmt(a) + ' to ' + fmt(b) + ' = <strong>' +
      fmt(Math.abs(r)) + '% ' + dir + '</strong>';
  });
})();
