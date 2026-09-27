(function () {
  var mode = document.getElementById('dc-mode');
  var addBox = document.getElementById('dc-add');
  var betweenBox = document.getElementById('dc-between');
  var calcBtn = document.getElementById('dc-calc');
  var result = document.getElementById('dc-result');

  mode.addEventListener('change', function () {
    var b = mode.value === 'between';
    addBox.style.display = b ? 'none' : 'block';
    betweenBox.style.display = b ? 'block' : 'none';
  });

  function fmt(d) {
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  calcBtn.addEventListener('click', function () {
    if (mode.value === 'add') {
      var d = new Date(document.getElementById('dc-date').value + 'T00:00:00');
      if (isNaN(d)) { result.style.display = 'block'; result.textContent = 'Please choose a start date.'; return; }
      var num = parseInt(document.getElementById('dc-num').value, 10) || 0;
      var unit = document.getElementById('dc-unit').value;
      var op = document.getElementById('dc-op').value;
      var sign = op === 'sub' ? -1 : 1;
      var out = new Date(d);
      if (unit === 'days') out.setDate(out.getDate() + sign * num);
      else if (unit === 'weeks') out.setDate(out.getDate() + sign * num * 7);
      else if (unit === 'months') out.setMonth(out.getMonth() + sign * num);
      else out.setFullYear(out.getFullYear() + sign * num);
      result.style.display = 'block';
      result.innerHTML = '<p class="note">Result date</p><strong style="font-size:1.25rem">' + fmt(out) + '</strong>';
    } else {
      var d1 = new Date(document.getElementById('dc-date1').value + 'T00:00:00');
      var d2 = new Date(document.getElementById('dc-date2').value + 'T00:00:00');
      if (isNaN(d1) || isNaN(d2)) { result.style.display = 'block'; result.textContent = 'Please choose both dates.'; return; }
      var diff = Math.abs(Math.round((d2 - d1) / 86400000));
      result.style.display = 'block';
      result.innerHTML = '<strong style="font-size:1.5rem">' + diff + '</strong> days between these two dates.';
    }
  });
})();
