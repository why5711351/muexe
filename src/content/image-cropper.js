(function () {
  var fileInput = document.getElementById('ic-file');
  var wrap = document.getElementById('ic-wrap');
  var img = document.getElementById('ic-img');
  var sel = document.getElementById('ic-sel');
  var cropBtn = document.getElementById('ic-crop');
  var image = null;
  var startX = 0, startY = 0, dragging = false;

  fileInput.addEventListener('change', function (e) {
    var f = e.target.files[0];
    if (!f) return;
    var url = URL.createObjectURL(f);
    var im = new Image();
    im.onload = function () {
      image = im;
      img.src = url;
      wrap.style.display = 'block';
      sel.style.display = 'none';
      cropBtn.disabled = false;
    };
    im.src = url;
  });

  function pos(e) {
    var rect = img.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(x, y) {
    startX = x; startY = y;
    dragging = true;
    sel.style.display = 'block';
    sel.style.left = startX + 'px';
    sel.style.top = startY + 'px';
    sel.style.width = '0px';
    sel.style.height = '0px';
  }

  function move(x, y) {
    if (!dragging) return;
    var l = Math.min(startX, x), t = Math.min(startY, y);
    sel.style.left = l + 'px';
    sel.style.top = t + 'px';
    sel.style.width = Math.abs(x - startX) + 'px';
    sel.style.height = Math.abs(y - startY) + 'px';
  }

  img.addEventListener('mousedown', function (e) {
    var p = pos(e);
    start(p.x, p.y);
    e.preventDefault();
  });
  document.addEventListener('mousemove', function (e) {
    var p = pos(e);
    move(p.x, p.y);
  });
  document.addEventListener('mouseup', function () { dragging = false; });

  img.addEventListener('touchstart', function (e) {
    var t = e.touches[0];
    var p = pos(t);
    start(p.x, p.y);
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchmove', function (e) {
    if (!dragging) return;
    var t = e.touches[0];
    var p = pos(t);
    move(p.x, p.y);
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchend', function () { dragging = false; });

  cropBtn.addEventListener('click', function () {
    if (!image || !img.clientWidth) return;
    var rw = image.naturalWidth / img.clientWidth;
    var rh = image.naturalHeight / img.clientHeight;
    var x = parseFloat(sel.style.left) * rw;
    var y = parseFloat(sel.style.top) * rh;
    var w = parseFloat(sel.style.width) * rw;
    var h = parseFloat(sel.style.height) * rh;
    if (!(w >= 2) || !(h >= 2)) return;
    var cw = Math.round(w), ch = Math.round(h);
    var canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(image, Math.round(x), Math.round(y), cw, ch, 0, 0, cw, ch);
    var a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'cropped.png';
    a.click();
  });
})();
