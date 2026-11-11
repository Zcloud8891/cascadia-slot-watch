/* Cascadia Slot Watch: live openings (browser fetches the public CBP scheduler directly; CORS allowed) + free-signup tap counter. */
(function () {
  var C = window.CSW || {}, es = C.lang === 'es';
  var S = es ? { none: 'No hay entrevistas abiertas ahora.', soon: 'La más pronto:', n: ' abiertas', err: 'No se pudo cargar. Revisa ttp.cbp.dhs.gov.', at: 'Revisado a las ' }
             : { none: 'No open interviews right now.', soon: 'Soonest:', n: ' open', err: "Couldn't load. Check ttp.cbp.dhs.gov.", at: 'Checked at ' };
  var MON = es ? ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'] : ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var DOW = es ? ['dom','lun','mar','mié','jue','vie','sáb'] : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  function fmt(s) {
    var y = +s.slice(0, 4), m = +s.slice(5, 7), d = +s.slice(8, 10), h = +s.slice(11, 13), mi = s.slice(14, 16);
    var w = DOW[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    if (es) return w + ' ' + d + ' ' + MON[m - 1] + ', ' + (h < 10 ? '0' : '') + h + ':' + mi;
    return w + ' ' + MON[m - 1] + ' ' + d + ', ' + (h % 12 || 12) + ':' + mi + ' ' + (h >= 12 ? 'PM' : 'AM');
  }
  function render(card, starts, limit) {
    var n = +card.getAttribute('data-n') || 3, soon = card.querySelector('.soon'), ul = card.querySelector('.slots');
    ul.innerHTML = '';
    if (!starts.length) { soon.textContent = S.none; return; }
    soon.textContent = S.soon + ' ' + fmt(starts[0]) + ' · ' + starts.length + (starts.length >= limit ? '+' : '') + S.n;
    starts.slice(n > 3 ? 0 : 1, n).forEach(function (s) { var li = document.createElement('li'); li.textContent = fmt(s); ul.appendChild(li); });
  }
  function fallback(card, key) {
    if (!C.gate) { card.querySelector('.soon').textContent = S.err; return; }
    fetch(C.gate + '?a=openings').then(function (r) { return r.json(); }).then(function (j) {
      var l = j.locs && j.locs[key]; if (!l || !l.slots) throw 0; render(card, l.slots, 12);
    }).catch(function () { card.querySelector('.soon').textContent = S.err; });
  }
  [].forEach.call(document.querySelectorAll('.live[data-id]'), function (card) {
    var id = card.getAttribute('data-id'), key = card.getAttribute('data-loc'), limit = 25;
    fetch(C.cbp + '?orderBy=soonest&limit=' + limit + '&locationId=' + id + '&minimum=1', { credentials: 'omit' })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (arr) {
        var seen = {}, starts = [];
        arr.forEach(function (s) { var t = s.startTimestamp; if (s.active !== false && t && !seen[t]) { seen[t] = 1; starts.push(t); } });
        starts.sort(); render(card, starts, limit);
      }).catch(function () { fallback(card, key); });
  });
  // free signup counter: log a tap (no personal data), then let the link/copy proceed
  function vid() {
    try { var v = localStorage.getItem('csw_v'); if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem('csw_v', v); } return v; }
    catch (e) { return 'nols'; }
  }
  function hit(loc) {
    if (!C.gate) return;
    var url = C.gate + '?a=hit&loc=' + encodeURIComponent(loc) + '&lang=' + (es ? 'es' : 'en') + '&v=' + vid();
    try { fetch(url, { mode: 'no-cors', keepalive: true, credentials: 'omit' }); } catch (e) { (new Image()).src = url; }
  }
  [].forEach.call(document.querySelectorAll('a.sub'), function (a) {
    a.addEventListener('click', function (ev) {
      hit(a.getAttribute('data-loc'));
      if (C.gate) { ev.preventDefault(); var h = a.href; setTimeout(function () { location.href = h; }, 250); }
    });
  });
  [].forEach.call(document.querySelectorAll('button.copy'), function (b) {
    b.addEventListener('click', function () {
      var t = b.getAttribute('data-copy');
      if (navigator.clipboard) navigator.clipboard.writeText(t);
      b.textContent = '✓'; hit(b.getAttribute('data-loc'));
    });
  });
})();
