(function () {
  var input = document.getElementById('cc-input');
  var output = document.getElementById('cc-output');

  function words(text) {
    return text.trim().split(/\s+/).filter(Boolean);
  }
  function titleCase(text) {
    return words(text).map(function (w) {
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    }).join(' ');
  }
  function sentenceCase(text) {
    return text.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, function (c) { return c.toUpperCase(); });
  }
  function toCamel(text) {
    var ws = words(text);
    return ws.map(function (w, i) {
      w = w.toLowerCase();
      return i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1);
    }).join('');
  }
  function toPascal(text) {
    return words(text).map(function (w) {
      w = w.toLowerCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    }).join('');
  }
  function toSnake(text) {
    return words(text).map(function (w) { return w.toLowerCase(); }).join('_');
  }
  function toKebab(text) {
    return words(text).map(function (w) { return w.toLowerCase(); }).join('-');
  }

  var actions = {
    upper: function (t) { return t.toUpperCase(); },
    lower: function (t) { return t.toLowerCase(); },
    title: titleCase,
    sentence: sentenceCase,
    camel: toCamel,
    pascal: toPascal,
    snake: toSnake,
    kebab: toKebab
  };

  document.querySelectorAll('.cc-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var c = btn.getAttribute('data-case');
      if (c === 'copy') {
        if (output.value) navigator.clipboard.writeText(output.value);
        return;
      }
      var text = input.value;
      if (!text.trim()) { output.value = ''; return; }
      output.value = actions[c](text);
    });
  });
})();
