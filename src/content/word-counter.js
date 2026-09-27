(function () {
  var input = document.getElementById('wc-input');
  var words = document.getElementById('wc-words');
  var chars = document.getElementById('wc-chars');
  var charsns = document.getElementById('wc-charsns');
  var sent = document.getElementById('wc-sent');
  var para = document.getElementById('wc-para');
  var read = document.getElementById('wc-read');
  var speak = document.getElementById('wc-speak');

  input.addEventListener('input', function () {
    var text = input.value;
    var w = text.trim() ? text.trim().split(/\s+/).length : 0;
    words.textContent = w;
    chars.textContent = text.length;
    charsns.textContent = text.replace(/\s/g, '').length;
    var sentences = text.match(/[^.!?]+[.!?]+/g);
    sent.textContent = sentences ? sentences.length : 0;
    var paragraphs = text.trim() ? text.trim().split(/\n+/).filter(function (p) { return p.trim(); }).length : 0;
    para.textContent = paragraphs;
    var mins = w / 220; // 220 wpm reading
    read.textContent = mins < 1 ? Math.max(1, Math.round(mins * 60)) + 's' : mins.toFixed(1) + ' min';
    var smins = w / 130; // 130 wpm speaking
    speak.textContent = smins < 1 ? Math.max(1, Math.round(smins * 60)) + 's' : smins.toFixed(1) + ' min';
  });
})();
