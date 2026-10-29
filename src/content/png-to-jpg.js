(function () {
  var fileInput = document.getElementById('p2j-file');
  var bg = document.getElementById('p2j-bg');
  var quality = document.getElementById('p2j-quality');
  var qLabel = document.getElementById('p2j-q-label');
  var canvas = document.getElementById('p2j-canvas');
  var downloadBtn = document.getElementById('p2j-download');
  var image = null;

  quality.addEventListener('input', function () {
    qLabel.textContent = quality.value;
    render();
  });
  bg.addEventListener('input', render);

  fileInput.addEventListener('change', function (e) {
    var f = e.target.files[0];
    if (!f) return;
    var url = URL.createObjectURL(f);
    var im = new Image();
    im.onload = function () {
      image = im;
      canvas.style.display = 'block';
      render();
    };
    im.src = url;
  });

  function render() {
    if (!image) return;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = bg.value;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
  }

  downloadBtn.addEventListener('click', function () {
    if (!image) return;
    var dataUrl = canvas.toDataURL('image/jpeg', quality.value / 100);
    var a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'converted.jpg';
    a.click();
  });
})();
