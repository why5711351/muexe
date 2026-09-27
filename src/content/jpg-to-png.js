(function () {
  var input = document.getElementById('jtp-input');
  var previewRow = document.getElementById('jtp-preview-row');
  var preview = document.getElementById('jtp-preview');
  var downloadBtn = document.getElementById('jtp-download');
  var status = document.getElementById('jtp-status');
  var pngUrl = null;

  input.addEventListener('change', function () {
    var file = input.files && input.files[0];
    if (!file) return;
    status.textContent = 'Converting…';
    var img = new Image();
    var url = URL.createObjectURL(file);
    img.onload = function () {
      var canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      pngUrl = canvas.toDataURL('image/png');
      preview.src = pngUrl;
      previewRow.style.display = 'block';
      downloadBtn.style.display = 'inline-flex';
      status.textContent = 'Converted! Click “Download PNG” to save.';
    };
    img.onerror = function () {
      status.textContent = 'Could not read this image. Please choose a valid JPG.';
    };
    img.src = url;
  });

  downloadBtn.addEventListener('click', function () {
    if (!pngUrl) return;
    var a = document.createElement('a');
    a.href = pngUrl;
    a.download = 'muexe-image.png';
    a.click();
  });
})();
