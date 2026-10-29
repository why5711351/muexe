(function () {
  var dob = document.getElementById('age-dob');
  var result = document.getElementById('age-result');

  function calc() {
    var val = dob.value;
    if (!val) { result.innerHTML = '<p>Select your date of birth to see your exact age.</p>'; return; }
    var birth = new Date(val + 'T00:00:00');
    var now = new Date();
    if (birth > now) { result.innerHTML = '<p>That date is in the future.</p>'; return; }

    var years = now.getFullYear() - birth.getFullYear();
    var months = now.getMonth() - birth.getMonth();
    var days = now.getDate() - birth.getDate();
    if (days < 0) {
      months--;
      var prevMonthDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      days += prevMonthDays;
    }
    if (months < 0) { years--; months += 12; }

    var totalDays = Math.floor((now - birth) / 86400000);
    var totalWeeks = Math.floor(totalDays / 7);

    var next = new Date(now.getFullYear(), birth.getMonth(), birth.getDate());
    if (next <= now) next = new Date(now.getFullYear() + 1, birth.getMonth(), birth.getDate());
    var daysToBday = Math.ceil((next - now) / 86400000);

    result.innerHTML =
      '<p>You are <strong>' + years + '</strong> years, <strong>' + months + '</strong> months and <strong>' + days + '</strong> days old.</p>' +
      '<p>Total: <strong>' + totalDays.toLocaleString() + '</strong> days (about <strong>' + totalWeeks.toLocaleString() + '</strong> weeks).</p>' +
      '<p>Your next birthday is in <strong>' + daysToBday + '</strong> days.</p>';
  }

  dob.addEventListener('input', calc);
  calc();
})();
