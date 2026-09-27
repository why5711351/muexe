(function () {
  var input = document.getElementById('itp-input');
  var list = document.getElementById('itp-list');
  var status = document.getElementById('itp-status');
  var convertBtn = document.getElementById('itp-convert');
  var sizeSel = document.getElementById('itp-size');
  var files = [];

  input.addEventListener('change', function () {
    files = Array.prototype.slice.call(input.files);
    render();
  });

  function render() {
    list.innerHTML = '';
    files.forEach(function (f, i) {
      var thumb = document.createElement('img');
      thumb.src = URL.createObjectURL(f);
      thumb.className = 'itp-thumb';
      thumb.title = f.name;
      thumb.addEventListener('click', function () {
        files.splice(i, 1);
        render();
      });
      list.appendChild(thumb);
    });
    status.textContent = files.length ? files.length + ' image(s) selected' : '';
  }

  function loadImage(file) {
    return new Promise(function (resolve) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = url;
    });
  }

  convertBtn.addEventListener('click', function () {
    if (!files.length) { status.textContent = 'Please choose at least one image.'; return; }
    if (!window.jspdf || !window.jspdf.jsPDF) { status.textContent = 'PDF library is still loading — please try again.'; return; }
    status.textContent = 'Converting…';
    var jsPDF = window.jspdf.jsPDF;
    var size = sizeSel.value;

    Promise.all(files.map(loadImage)).then(function (images) {
      images = images.filter(function (i) { return i; });
      if (!images.length) { status.textContent = 'Could not read the selected images.'; return; }

      var pdf = null;
      images.forEach(function (img, idx) {
        var w, h, unit, format;
        if (size === 'fit') {
          unit = 'px';
          w = img.naturalWidth;
          h = img.naturalHeight;
          format = [w, h];
        } else {
          unit = 'mm';
          var maxW = size === 'a4' ? 210 : 216;
          var maxH = size === 'a4' ? 297 : 279;
          var ratio = img.naturalHeight / img.naturalWidth;
          w = maxW;
          h = maxW * ratio;
          if (h > maxH) { h = maxH; w = maxH / ratio; }
          format = size === 'a4' ? 'a4' : 'letter';
        }
        if (idx === 0) {
          pdf = new jsPDF({
            orientation: img.naturalWidth > img.naturalHeight ? 'landscape' : 'portrait',
            unit: unit,
            format: format
          });
        } else {
          pdf.addPage();
        }
        pdf.addImage(img, 'JPEG', 0, 0, w, h, undefined, 'FAST');
      });

      pdf.save('muexe-images.pdf');
      status.textContent = 'Done! Your PDF has been downloaded.';
    });
  });
})();
