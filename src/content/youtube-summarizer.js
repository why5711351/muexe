(function () {
  var input = document.getElementById('yt-url');
  var btn = document.getElementById('yt-go');
  var status = document.getElementById('yt-status');
  var result = document.getElementById('yt-result');

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function toSeconds(t) {
    var parts = String(t).split(':').map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  }

  function render(data) {
    var html = '';

    html += '<h3 style="margin-bottom:10px">' + escapeHtml(data.title || 'Video summary') + '</h3>';

    html += '<div class="result-box"><strong>Summary</strong>';
    html += '<p style="margin-top:6px">' + escapeHtml(data.summary) + '</p></div>';

    if (data.keyPoints && data.keyPoints.length) {
      html += '<h3 style="margin-top:22px">Key points</h3>';
      html += '<ul style="padding-left:22px">';
      data.keyPoints.forEach(function (p) { html += '<li>' + escapeHtml(p) + '</li>'; });
      html += '</ul>';
    }

    if (data.chapters && data.chapters.length) {
      html += '<h3 style="margin-top:22px">Chapters</h3>';
      data.chapters.forEach(function (c) {
        var secs = toSeconds(c.time);
        var link = data.videoId && secs > 0
          ? 'https://www.youtube.com/watch?v=' + data.videoId + '&t=' + secs + 's'
          : null;
        html += '<div style="margin-bottom:12px;padding-left:12px;border-left:3px solid #2563eb">';
        if (link) {
          html += '<div style="font-weight:700"><a href="' + link + '" target="_blank" rel="noopener">' + escapeHtml(c.time) + '</a> — ' + escapeHtml(c.title) + '</div>';
        } else {
          html += '<div style="font-weight:700">' + escapeHtml(c.time) + ' — ' + escapeHtml(c.title) + '</div>';
        }
        html += '<p class="note" style="margin-top:2px">' + escapeHtml(c.summary) + '</p></div>';
      });
    }

    if (data.generated) {
      html += '<p class="note" style="margin-top:14px">Based on auto-generated captions, so some wording may differ from the audio.</p>';
    }

    result.innerHTML = html;
    result.style.display = 'block';
  }

  async function run() {
    var url = input.value.trim();
    if (!url) {
      status.innerHTML = '<p class="note">Please paste a YouTube URL first.</p>';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Summarizing…';
    status.innerHTML = '<p class="note">Fetching captions and generating the summary… (this can take 10–30 seconds)</p>';
    result.style.display = 'none';

    try {
      var res = await fetch('/api/summarize?url=' + encodeURIComponent(url));
      var data = await res.json();
      if (!res.ok) {
        status.innerHTML = '<p class="note" style="color:#dc2626">' + escapeHtml(data.error || 'Something went wrong.') + '</p>';
      } else {
        status.innerHTML = '';
        render(data);
      }
    } catch (e) {
      status.innerHTML = '<p class="note" style="color:#dc2626">Could not reach the summarizer. This tool works on the live site after deployment.</p>';
    } finally {
      btn.disabled = false;
      btn.textContent = 'Summarize';
    }
  }

  btn.addEventListener('click', run);
  input.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
})();
