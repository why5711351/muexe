(function () {
  var text = document.getElementById('qr-text');
  var size = document.getElementById('qr-size');
  var sizeLabel = document.getElementById('qr-size-label');
  var fg = document.getElementById('qr-fg');
  var bg = document.getElementById('qr-bg');
  var genBtn = document.getElementById('qr-gen');
  var result = document.getElementById('qr-result');
  var download = document.getElementById('qr-download');

  size.addEventListener('input', function () { sizeLabel.textContent = size.value; });

  function gen() {
    var val = text.value.trim();
    if (!val || typeof qrcode !== 'function') {
      result.innerHTML = '';
      download.style.display = 'none';
      return;
    }
    var qr = qrcode(0, 'M');
    qr.addData(val);
    qr.make();
    var n = qr.getModuleCount();
    var cell = Math.max(1, Math.floor(size.value / n));
    var px = cell * n;
    var canvas = document.createElement('canvas');
    canvas.width = px;
    canvas.height = px;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = bg.value;
    ctx.fillRect(0, 0, px, px);
    ctx.fillStyle = fg.value;
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        if (qr.isDark(r, c)) ctx.fillRect(c * cell, r * cell, cell, cell);
      }
    }
    result.innerHTML = '';
    canvas.style.maxWidth = '100%';
    result.appendChild(canvas);
    download.style.display = 'inline-flex';
    download.onclick = function () {
      var a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'qrcode.png';
      a.click();
    };
  }

  genBtn.addEventListener('click', gen);
  text.addEventListener('input', gen);
  fg.addEventListener('input', gen);
  bg.addEventListener('input', gen);
  size.addEventListener('input', gen);

  // Load the QR encoding library, then generate if there is already input.
  var script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
  script.onload = function () { gen(); };
  document.head.appendChild(script);
})();
