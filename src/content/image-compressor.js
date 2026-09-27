(function () {
  var input = document.getElementById('ic-input');
  var quality = document.getElementById('ic-quality');
  var qval = document.getElementById('ic-qval');
  var fmt = document.getElementById('ic-format');
  var result = document.getElementById('ic-result');
  var sizeOrig = document.getElementById('ic-size-orig');
  var sizeNew = document.getElementById('ic-size-new');
  var preview = document.getElementById('ic-preview');
  var downloadBtn = document.getElementById('ic-download');
  var status = document.getElementById('ic-status');
  var sourceImg = null, sourceFile = null, outUrl = null;

  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function compress() {
    if (!sourceImg) return;
    var canvas = document.createElement('canvas');
    canvas.width = sourceImg.naturalWidth;
    canvas.height = sourceImg.naturalHeight;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(sourceImg, 0, 0);
    var type = fmt.value;
    var ext = type === 'image/webp' ? 'webp' : 'jpg';
    outUrl = canvas.toDataURL(type, parseFloat(quality.value));
    preview.src = outUrl;
    // estimate new size from base64 length
    var approx = Math.round(outUrl.length * 3 / 4);
    sizeNew.textContent = 'Compressed: ~' + fmtSize(approx);
    result.style.display = 'block';
    downloadBtn.style.display = 'inline-flex';
    downloadBtn.textContent = 'Download ' + ext.toUpperCase();
    status.textContent = '';
  }

  quality.addEventListener('input', function () {
    qval.textContent = quality.value;
    compress();
  });
  fmt.addEventListener('change', compress);

  input.addEventListener('change', function () {
    var file = input.files && input.files[0];
    if (!file) return;
    sourceFile = file;
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      sourceImg = img;
      sizeOrig.textContent = 'Original: ' + fmtSize(file.size);
      compress();
    };
    img.onerror = function () { status.textContent = 'Could not read this image.'; };
    img.src = url;
  });

  downloadBtn.addEventListener('click', function () {
    if (!outUrl) return;
    var a = document.createElement('a');
    a.href = outUrl;
    a.download = 'compressed.' + (fmt.value === 'image/webp' ? 'webp' : 'jpg');
    a.click();
  });
})();
