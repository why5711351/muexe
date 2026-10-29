(function () {
  var count = document.getElementById('uuid-count');
  var output = document.getElementById('uuid-output');
  var genBtn = document.getElementById('uuid-gen');
  var copyBtn = document.getElementById('uuid-copy');

  function gen() {
    var n = parseInt(count.value, 10);
    if (!n || n < 1) n = 1;
    if (n > 100) n = 100;
    count.value = n;
    var upper = document.querySelector('input[name="uuid-case"]:checked').value === 'upper';
    var out = [];
    for (var i = 0; i < n; i++) {
      var u = crypto.randomUUID();
      out.push(upper ? u.toUpperCase() : u);
    }
    output.value = out.join('\n');
  }

  genBtn.addEventListener('click', gen);
  copyBtn.addEventListener('click', function () {
    if (output.value) navigator.clipboard.writeText(output.value);
  });
  gen();
})();
