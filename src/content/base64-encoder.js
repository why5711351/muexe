(function () {
  var input = document.getElementById('b64-input');
  var output = document.getElementById('b64-output');
  var encodeBtn = document.getElementById('b64-encode');
  var decodeBtn = document.getElementById('b64-decode');
  var copyBtn = document.getElementById('b64-copy');

  function encode() {
    try {
      var bytes = new TextEncoder().encode(input.value);
      var bin = '';
      for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      output.value = btoa(bin);
    } catch (e) { output.value = ''; }
  }
  function decode() {
    try {
      var bin = atob(input.value.trim());
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      output.value = new TextDecoder().decode(bytes);
    } catch (e) { output.value = ''; }
  }

  encodeBtn.addEventListener('click', encode);
  decodeBtn.addEventListener('click', decode);
  copyBtn.addEventListener('click', function () {
    if (output.value) navigator.clipboard.writeText(output.value);
  });
})();
