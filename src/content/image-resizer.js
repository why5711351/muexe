(function () {
  var input = document.getElementById('ir-input');
  var keep = document.getElementById('ir-keep');
  var width = document.getElementById('ir-width');
  var height = document.getElementById('ir-height');
  var fmt = document.getElementById('ir-format');
  var orig = document.getElementById('ir-orig');
  var downloadBtn = document.getElementById('ir-download');
  var status = document.getElementById('ir-status');
  var sourceImg = null, outUrl = null;
  var natW = 0, natH = 0;

  input.addEventListener('change', function () {
    var file = input.files && input.files[0];
    if (!file) return;
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      sourceImg = img;
      natW = img.naturalWidth;
      natH = img.naturalHeight;
      width.value = natW;
      height.value = natH;
      orig.textContent = 'Original size: ' + natW + ' × ' + natH + ' px';
      status.textContent = '';
    };
    img.onerror = function () { status.textContent = 'Could not read this image.'; };
    img.src = url;
  });

  function resize() {
    if (!sourceImg) return;
    var w = parseInt(width.value, 10);
    var h = parseInt(height.value, 10);
    if (!w || !h) { status.textContent = 'Enter valid width and height.'; return; }
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceImg, 0, 0, w, h);
    var type = fmt.value;
    outUrl = canvas.toDataURL(type, 0.92);
    var ext = type === 'image/png' ? 'png' : (type === 'image/webp' ? 'webp' : 'jpg');
    downloadBtn.style.display = 'inline-flex';
    downloadBtn.textContent = 'Download ' + w + '×' + h + ' ' + ext.toUpperCase();
    status.textContent = '';
  }

  width.addEventListener('input', function () {
    if (keep.checked && natW && natH) {
      var w = parseInt(width.value, 10);
      if (w) height.value = Math.round(w * natH / natW);
    }
    resize();
  });
  height.addEventListener('input', function () {
    if (keep.checked && natW && natH) {
      var h = parseInt(height.value, 10);
      if (h) width.value = Math.round(h * natW / natH);
    }
    resize();
  });
  keep.addEventListener('change', function () {
    if (keep.checked && natW && natH) {
      height.value = Math.round((parseInt(width.value, 10) || natW) * natH / natW);
    }
    resize();
  });
  fmt.addEventListener('change', resize);

  downloadBtn.addEventListener('click', function () {
    if (!outUrl) return;
    var a = document.createElement('a');
    a.href = outUrl;
    var ext = fmt.value === 'image/png' ? 'png' : (fmt.value === 'image/webp' ? 'webp' : 'jpg');
    a.download = 'resized.' + ext;
    a.click();
  });
})();
