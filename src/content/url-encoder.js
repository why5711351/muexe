(function () {
  var input = document.getElementById('url-input');
  var output = document.getElementById('url-output');
  var encodeBtn = document.getElementById('url-encode');
  var decodeBtn = document.getElementById('url-decode');
  var copyBtn = document.getElementById('url-copy');

  function encode() {
    try { output.value = encodeURIComponent(input.value); } catch (e) { output.value = ''; }
  }
  function decode() {
    try { output.value = decodeURIComponent(input.value.trim()); } catch (e) { output.value = ''; }
  }

  encodeBtn.addEventListener('click', encode);
  decodeBtn.addEventListener('click', decode);
  copyBtn.addEventListener('click', function () {
    if (output.value) navigator.clipboard.writeText(output.value);
  });
})();
