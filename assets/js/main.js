// Muexe — common site scripts (nav toggle, search, year)
(function () {
  // Footer year
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  // Mobile nav toggle
  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  // Search with autocomplete
  var input = document.getElementById('site-search');
  var box = document.getElementById('search-results');
  if (input && box) {
    var index = [];
    fetch('/assets/search.json')
      .then(function (r) { return r.json(); })
      .then(function (data) { index = data; })
      .catch(function () {});

    function render(q) {
      q = q.trim().toLowerCase();
      if (!q) { box.classList.remove('show'); box.innerHTML = ''; return; }
      var hits = index.filter(function (t) {
        return t.name.toLowerCase().indexOf(q) !== -1;
      }).slice(0, 8);
      if (!hits.length) {
        box.innerHTML = '<div class="sr-empty">No tools found for "' + escapeHtml(q) + '"</div>';
      } else {
        box.innerHTML = hits.map(function (t) {
          return '<a href="/' + t.slug + '.html">' + t.icon + ' <span>' + escapeHtml(t.name) +
            ' <span class="sr-cat">' + t.category + '</span></span></a>';
        }).join('');
      }
      box.classList.add('show');
    }

    input.addEventListener('input', function () { render(input.value); });
    document.addEventListener('click', function (e) {
      if (!box.contains(e.target) && e.target !== input) box.classList.remove('show');
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var first = box.querySelector('a');
        if (first) window.location.href = first.getAttribute('href');
      }
    });
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
})();
