(function () {
  var length = document.getElementById('pw-length');
  var lenLabel = document.getElementById('pw-len-label');
  var output = document.getElementById('pw-output');
  var genBtn = document.getElementById('pw-gen');
  var copyBtn = document.getElementById('pw-copy');

  var UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  var LOWER = 'abcdefghijkmnpqrstuvwxyz';
  var NUM = '23456789';
  var SYM = '!@#$%^&*()-_=+[]{};:,.?';

  length.addEventListener('input', function () { lenLabel.textContent = length.value; });

  function randInt(max) {
    var arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  }

  function gen() {
    var sets = [];
    if (document.getElementById('pw-upper').checked) sets.push(UPPER);
    if (document.getElementById('pw-lower').checked) sets.push(LOWER);
    if (document.getElementById('pw-num').checked) sets.push(NUM);
    if (document.getElementById('pw-sym').checked) sets.push(SYM);
    if (!sets.length) { output.value = ''; return; }
    var len = parseInt(length.value, 10);
    var chars = [];
    for (var i = 0; i < sets.length; i++) {
      var s = sets[i];
      chars.push(s.charAt(randInt(s.length)));
    }
    var all = sets.join('');
    for (var j = chars.length; j < len; j++) {
      chars.push(all.charAt(randInt(all.length)));
    }
    for (var k = chars.length - 1; k > 0; k--) {
      var m = randInt(k + 1);
      var tmp = chars[k]; chars[k] = chars[m]; chars[m] = tmp;
    }
    output.value = chars.join('');
  }

  genBtn.addEventListener('click', gen);
  copyBtn.addEventListener('click', function () {
    if (output.value) navigator.clipboard.writeText(output.value);
  });
  gen();
})();
