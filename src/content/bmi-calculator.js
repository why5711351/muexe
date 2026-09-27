(function () {
  var unit = document.getElementById('bmi-unit');
  var metricBox = document.getElementById('bmi-metric');
  var imperialBox = document.getElementById('bmi-imperial');
  var calcBtn = document.getElementById('bmi-calc');
  var result = document.getElementById('bmi-result');

  unit.addEventListener('change', function () {
    var imp = unit.value === 'imperial';
    metricBox.style.display = imp ? 'none' : 'block';
    imperialBox.style.display = imp ? 'block' : 'none';
  });

  function category(bmi) {
    if (bmi < 18.5) return { label: 'Underweight', color: '#0891b2' };
    if (bmi < 25) return { label: 'Healthy weight', color: '#16a34a' };
    if (bmi < 30) return { label: 'Overweight', color: '#f59e0b' };
    return { label: 'Obesity', color: '#dc2626' };
  }

  calcBtn.addEventListener('click', function () {
    var bmi;
    if (unit.value === 'metric') {
      var cm = parseFloat(document.getElementById('bmi-hcm').value);
      var kg = parseFloat(document.getElementById('bmi-wkg').value);
      if (!cm || !kg) { result.style.display = 'block'; result.textContent = 'Please enter valid height and weight.'; return; }
      var m = cm / 100;
      bmi = kg / (m * m);
    } else {
      var ft = parseFloat(document.getElementById('bmi-hft').value) || 0;
      var inn = parseFloat(document.getElementById('bmi-hin').value) || 0;
      var lb = parseFloat(document.getElementById('bmi-wlb').value);
      if (!lb || (ft === 0 && inn === 0)) { result.style.display = 'block'; result.textContent = 'Please enter valid height and weight.'; return; }
      var totalIn = ft * 12 + inn;
      bmi = 703 * lb / (totalIn * totalIn);
    }
    var cat = category(bmi);
    result.style.display = 'block';
    result.innerHTML =
      '<p>Your BMI: <strong style="font-size:1.6rem">' + bmi.toFixed(1) + '</strong></p>' +
      '<p>Category: <strong style="color:' + cat.color + '">' + cat.label + '</strong></p>' +
      '<p class="note">Healthy range is 18.5 – 24.9 for most adults.</p>';
  });
})();
