(function () {
  var input = document.getElementById('jf-input');
  var output = document.getElementById('jf-output');
  var status = document.getElementById('jf-status');

  function parse() {
    var text = input.value.trim();
    if (!text) { status.textContent = 'Please paste some JSON first.'; status.style.color = '#dc2626'; return null; }
    try {
      return JSON.parse(text);
    } catch (e) {
      status.textContent = 'Invalid JSON: ' + e.message;
      status.style.color = '#dc2626';
      return undefined;
    }
  }

  function ok(msg) {
    status.textContent = msg;
    status.style.color = '#16a34a';
  }

  document.getElementById('jf-format').addEventListener('click', function () {
    var v = parse();
    if (v === null || v === undefined) return;
    output.value = JSON.stringify(v, null, 2);
    ok('Valid JSON — formatted.');
  });

  document.getElementById('jf-minify').addEventListener('click', function () {
    var v = parse();
    if (v === null || v === undefined) return;
    output.value = JSON.stringify(v);
    ok('Valid JSON — minified.');
  });

  document.getElementById('jf-validate').addEventListener('click', function () {
    var text = input.value.trim();
    if (!text) { status.textContent = 'Please paste some JSON first.'; status.style.color = '#dc2626'; return; }
    try {
      JSON.parse(text);
      ok('Valid JSON ✓');
    } catch (e) {
      status.textContent = 'Invalid JSON: ' + e.message;
      status.style.color = '#dc2626';
    }
  });

  document.getElementById('jf-copy').addEventListener('click', function () {
    if (!output.value) { status.textContent = 'Nothing to copy yet.'; status.style.color = '#dc2626'; return; }
    navigator.clipboard.writeText(output.value).then(function () { ok('Copied to clipboard.'); });
  });
})();
