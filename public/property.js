// Property page: availability calendar, live pricing, alternative dates, and checkout hand-off.
(function () {
  'use strict';
  var U = window.IM, $ = U.$, $$ = U.$$;
  var boot = JSON.parse($('#boot').textContent);
  var state = {
    arrival: boot.arrival, departure: boot.departure, guests: boot.guests || 1, pets: boot.pets || 0,
    days: {}, loaded: false, quoteSeq: 0,
  };
  var minDate = U.addDays(U.today(), U.leadDays);

  // ---- photos, description, share, section tabs ----
  var photosModal = $('#photos-modal');
  $$('[data-photo]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!photosModal) return;
      photosModal.showModal();
      var f = document.getElementById('photo-' + b.getAttribute('data-photo'));
      if (f && b.getAttribute('data-photo') !== '0') f.scrollIntoView();
      else photosModal.scrollTop = 0;
    });
  });

  var desc = $('#desc'), more = $('#desc-more');
  if (desc && more) {
    if (desc.scrollHeight <= desc.clientHeight + 4) { desc.classList.remove('clamp5'); more.hidden = true; }
    more.addEventListener('click', function () {
      var clamped = desc.classList.toggle('clamp5');
      more.textContent = clamped ? 'Read more' : 'Show less';
    });
  }

  var share = $('[data-share]');
  if (share) share.addEventListener('click', function () {
    var url = location.origin + location.pathname;
    if (navigator.share) { navigator.share({ title: document.title, url: url }).catch(function () {}); return; }
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () {
      share.setAttribute('aria-label', 'Link copied');
      share.title = 'Link copied';
    });
  });

  var tabs = $('#ptabs'), gallery = $('#photos');
  if (tabs && gallery) {
    var links = $$('a', tabs);
    var onScroll = function () {
      var show = gallery.getBoundingClientRect().bottom < 0;
      tabs.hidden = !show;
      if (!show) return;
      var current = links[0];
      links.forEach(function (a) {
        var el = document.getElementById(a.getAttribute('href').slice(1));
        if (el && el.getBoundingClientRect().top < 120) current = a;
      });
      links.forEach(function (a) { a.classList.toggle('on', a === current); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- map ----
  var pm = $('#pmap');
  if (pm && window.L) {
    var lat = +pm.getAttribute('data-lat'), lng = +pm.getAttribute('data-lng');
    var map = L.map(pm, { scrollWheelZoom: false, zoomControl: true }).setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    L.circle([lat, lng], { radius: 350, color: '#1a2b4a', weight: 1.5, fillColor: '#1a2b4a', fillOpacity: 0.12 }).addTo(map);
    L.marker([lat, lng], { icon: L.divIcon({ className: '', html: '<div class="pin-dot"></div>', iconSize: [0, 0] }) }).addTo(map);
  }

  // ---- availability rules ----
  function day(s) { return state.days[s]; }
  function canArrive(s) { var d = day(s); return !!d && d.open && !d.noArrive && s >= minDate; }
  function stayProblem(a, b) {
    if (b <= a) return 'Check-out must be after check-in.';
    for (var s = a; s < b; s = U.addDays(s, 1)) { var d = day(s); if (!d || !d.open) return 'Some nights in that range are booked.'; }
    var dep = day(b);
    if (dep && dep.noDepart) return 'Check-out is not allowed on ' + U.shortDate(b) + '.';
    var first = day(a) || {};
    var n = U.nights(a, b);
    if (first.minNights && n < first.minNights) return 'Minimum stay from ' + U.shortDate(a) + ' is ' + first.minNights + ' nights.';
    if (first.maxNights && n > first.maxNights) return 'Maximum stay from ' + U.shortDate(a) + ' is ' + first.maxNights + ' nights.';
    return '';
  }
  function validStay(a, b) { return !!a && !!b && canArrive(a) && !stayProblem(a, b); }

  // ---- booking card ----
  var el = {
    title: $('#b-title'), price: $('#b-price'), direct: $('#b-direct'), body: $('#b-body'),
    fin: $('#f-in'), fout: $('#f-out'), guests: $('#f-guests'), reserve: $('#reserve'), action: $('#b-action'),
    gbtn: $('#g-btn'), gpop: $('#g-pop'),
  };
  var fields = $$('[data-field]');

  function syncUrl() {
    var u = new URL(location.href);
    if (state.arrival && state.departure) { u.searchParams.set('checkin', state.arrival); u.searchParams.set('checkout', state.departure); }
    else { u.searchParams.delete('checkin'); u.searchParams.delete('checkout'); }
    u.searchParams.set('guests', String(state.guests));
    if (state.pets) u.searchParams.set('pets', String(state.pets)); else u.searchParams.delete('pets');
    history.replaceState(null, '', u.toString());
    // keep the header search pill in step with the card
    var pill = $('.site-header [data-when]');
    if (pill) { pill.textContent = state.arrival && state.departure ? U.rangeLabel(state.arrival, state.departure) : 'When'; pill.classList.toggle('set', !!(state.arrival && state.departure)); }
  }

  function paintFields() {
    el.fin.textContent = state.arrival ? U.shortDate(state.arrival) : 'Add date';
    el.fout.textContent = state.departure ? U.shortDate(state.departure) : 'Add date';
    el.guests.textContent = U.plural(state.guests, 'guest') + (state.pets ? ', ' + U.plural(state.pets, 'pet') : '');
    var gn = $('#g-n'), pn = $('#p-n');
    if (gn) gn.textContent = state.guests;
    if (pn) pn.textContent = state.pets;
    $$('[data-step]', el.gpop).forEach(function (b) {
      var k = b.getAttribute('data-step'), d = +b.getAttribute('data-d');
      var max = k === 'guests' ? boot.maxGuests : boot.maxPets, min = k === 'guests' ? 1 : 0;
      b.disabled = d < 0 ? state[k] <= min : state[k] >= max;
    });
  }

  function setMode(mode) {
    // mode: 'choose' | 'loading' | 'priced' | 'unavailable'
    var priced = mode === 'priced' || mode === 'loading';
    el.title.hidden = priced;
    el.direct.hidden = !priced;
    el.price.hidden = !priced;
    el.reserve.hidden = mode !== 'priced';
    el.reserve.disabled = false;
    el.action.hidden = mode === 'priced' || mode === 'loading';
    if (mode !== 'priced') $('#book-err').textContent = '';
    fields.forEach(function (f) { f.classList.toggle('err-field', mode === 'unavailable'); });
  }

  function chooseMode() {
    setMode('choose');
    el.title.textContent = 'Choose available dates';
    el.body.innerHTML = '';
    el.action.textContent = 'Check availability';
    el.action.onclick = function () { openPicker(fields[0], false); };
  }

  function quoteUrl(a, b) {
    return '/api/quote?id=' + boot.id + '&arrival=' + a + '&departure=' + b + '&adults=' + state.guests + '&children=0&pets=' + state.pets;
  }
  function getJson(url) {
    return fetch(url).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); });
  }

  function refresh() {
    paintFields();
    syncUrl();
    U.refreshDatePicker();
    if (!state.arrival || !state.departure) { chooseMode(); return; }
    if (state.loaded && !validStay(state.arrival, state.departure)) { unavailable(stayProblem(state.arrival, state.departure) || 'Those dates are not available.'); return; }
    var seq = ++state.quoteSeq;
    setMode('loading');
    el.price.innerHTML = '<b>&nbsp;</b>Getting your price';
    el.body.innerHTML = '';
    getJson(quoteUrl(state.arrival, state.departure)).then(function (res) {
      if (seq !== state.quoteSeq) return;
      if (!res.ok) { unavailable(res.j.error || 'Those dates are not available.'); return; }
      var q = res.j, n = U.nights(state.arrival, state.departure);
      setMode('priced');
      el.price.innerHTML = '<b>' + U.money(q.beforeTaxes) + '</b>for ' + U.plural(n, 'night') + ' (before taxes)';
      el.body.innerHTML = '<details class="pd"><summary>Price details</summary><div class="lines">' +
        q.charges.map(function (c) { return '<div class="line"><span>' + U.esc(c.description) + '</span><span>' + U.money2(c.amount) + '</span></div>'; }).join('') +
        '<div class="line total"><span>Total</span><span>' + U.money2(q.total) + '</span></div></div></details>';
    }).catch(function () {
      if (seq !== state.quoteSeq) return;
      unavailable('We could not load pricing. Check your connection and try again.');
    });
  }

  // Nearby stays of the same length (or the minimum stay), closest first, priced live.
  function alternatives(a, b) {
    var want = a && b ? Math.max(1, U.nights(a, b)) : 2;
    var center = a && a >= minDate ? a : minDate;
    var found = [];
    var seen = {};
    for (var k = 0; k <= 60 && found.length < 3; k++) {
      (k ? [k, -k] : [0]).forEach(function (off) {
        if (found.length >= 3) return;
        var s = U.addDays(center, off);
        if (seen[s] || !canArrive(s)) return;
        seen[s] = true;
        var n = Math.max(want, (day(s) || {}).minNights || 0);
        var e = U.addDays(s, n);
        if (s === a && e === b) return;
        if (!stayProblem(s, e)) found.push({ a: s, b: e });
      });
    }
    return found.sort(function (x, y) { return x.a < y.a ? -1 : 1; });
  }

  function unavailable(msg) {
    var seq = ++state.quoteSeq;
    setMode('unavailable');
    el.title.textContent = 'Choose available dates';
    var alts = state.loaded ? alternatives(state.arrival, state.departure) : [];
    el.body.innerHTML = '<p class="berr">' + U.esc(msg) + '</p>' + (alts.length
      ? '<div class="alts"><p class="pop-title">Alternative dates</p>' + alts.map(function (x, i) {
        return '<button type="button" class="alt" data-i="' + i + '"><span>' + U.esc(U.rangeLabel(x.a, x.b).replace(' - ', ' – ')) + '</span><span class="tag-slot"></span><span class="p">&nbsp;</span></button>';
      }).join('') + '</div>'
      : '');
    el.action.textContent = alts.length ? 'Change to closest dates' : 'Choose new dates';
    el.action.onclick = function () {
      if (!alts.length) { openPicker(fields[0], false); return; }
      var best = alts.slice().sort(function (x, y) { return Math.abs(U.parse(x.a) - U.parse(state.arrival || minDate)) - Math.abs(U.parse(y.a) - U.parse(state.arrival || minDate)); })[0];
      state.arrival = best.a; state.departure = best.b; refresh();
    };
    $$('.alt', el.body).forEach(function (btn) {
      btn.addEventListener('click', function () { var x = alts[+btn.getAttribute('data-i')]; state.arrival = x.a; state.departure = x.b; refresh(); });
    });
    var prices = [];
    alts.forEach(function (x, i) {
      getJson(quoteUrl(x.a, x.b)).then(function (res) {
        if (seq !== state.quoteSeq) return;
        var btn = $('.alt[data-i="' + i + '"]', el.body);
        if (!btn) return;
        if (!res.ok) { btn.remove(); return; }
        prices[i] = res.j.beforeTaxes;
        $('.p', btn).textContent = U.money(res.j.beforeTaxes);
        // Tag one cheapest option, and only when the prices actually differ.
        var known = prices.filter(function (p) { return p != null; });
        var min = Math.min.apply(null, known), max = Math.max.apply(null, known);
        var cheapest = known.length > 1 && min < max ? prices.indexOf(min) : -1;
        $$('.alt', el.body).forEach(function (b2) {
          $('.tag-slot', b2).innerHTML = +b2.getAttribute('data-i') === cheapest ? '<span class="tagok">Cheapest</span>' : '';
        });
      }).catch(function () {});
    });
  }

  // ---- date picking ----
  function openPicker(anchorField, pickOut) {
    fields.forEach(function (f) { f.classList.toggle('focus', f === anchorField); });
    U.datePicker({
      anchor: anchorField.parentNode, trigger: anchorField, alignRight: true,
      arrival: state.arrival, departure: state.departure, pickOut: pickOut && !!state.arrival, minDate: minDate,
      keep: fields,
      isDisabled: function (s, picking, a) {
        if (!state.loaded) return false;
        if (picking === 'in' || s <= a) return !canArrive(s);
        return !!stayProblem(a, s);
      },
      note: function (a, b) {
        if (!state.loaded) return 'Loading availability';
        if (a && !b) { var m = (day(a) || {}).minNights; return 'Select your check-out date' + (m > 1 ? '. Minimum stay ' + m + ' nights.' : '.'); }
        if (a && b) return U.plural(U.nights(a, b), 'night') + ': ' + U.shortDate(a) + ' to ' + U.shortDate(b);
        return 'Select your check-in date';
      },
      onChange: function (a, b) {
        state.arrival = a; state.departure = b;
        fields.forEach(function (f) { f.classList.toggle('focus', f.getAttribute('data-field') === (a && !b ? 'out' : 'in')); });
        paintFields();
        if ((a && b) || (!a && !b)) refresh();
      },
      onClose: function () {
        fields.forEach(function (f) { f.classList.remove('focus'); });
        if (state.arrival && !state.departure) { state.arrival = null; refresh(); }
      },
    });
  }
  fields.forEach(function (f) {
    f.addEventListener('click', function () { openPicker(f, f.getAttribute('data-field') === 'out'); });
  });

  // ---- guests ----
  el.gbtn.addEventListener('click', function () { if (U.isOpen(el.gpop)) U.closePop(); else U.showPop(el.gpop, el.gbtn); });
  $$('[data-step]', el.gpop).forEach(function (b) {
    b.addEventListener('click', function () {
      var k = b.getAttribute('data-step');
      var max = k === 'guests' ? boot.maxGuests : boot.maxPets, min = k === 'guests' ? 1 : 0;
      state[k] = Math.max(min, Math.min(max, state[k] + +b.getAttribute('data-d')));
      refresh();
    });
  });

  // ---- reserve: straight to OwnerRez's secure checkout, where guests enter their details ----
  el.reserve.addEventListener('click', function () {
    var err = $('#book-err'), btn = el.reserve;
    var data = { property_id: boot.id, arrival: state.arrival, departure: state.departure, adults: state.guests, children: 0, pets: state.pets };
    err.textContent = '';
    btn.disabled = true; btn.textContent = 'Opening secure checkout';
    var reset = function () { btn.disabled = false; btn.textContent = 'Reserve'; };
    fetch('/api/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j.paymentUrl) { location.href = res.j.paymentUrl; return; }
        err.textContent = res.j.error || 'We could not open checkout. Please try again.';
        reset();
      })
      .catch(function () {
        err.textContent = 'We could not reach checkout. Check your connection and try again.';
        reset();
      });
  });
  // Coming back with the browser's back button can restore a disabled button; re-enable it.
  window.addEventListener('pageshow', function () { el.reserve.disabled = false; el.reserve.textContent = 'Reserve'; });

  // ---- questions: OwnerRez inquiry widget, loaded the first time it is opened ----
  var ask = $('#ask'), askModal = $('#ask-modal');
  if (ask && askModal) {
    ask.addEventListener('click', function () {
      askModal.showModal();
      if (window.OwnerRez && window.OwnerRez.loadWidgets) { window.OwnerRez.loadWidgets('ownerrez-widget'); return; }
      if (document.getElementById('or-widget-js')) return;
      var s = document.createElement('script');
      s.id = 'or-widget-js';
      s.src = 'https://app.ownerrez.com/widget.js';
      document.body.appendChild(s);
    });
  }

  // ---- load availability ----
  paintFields();
  if (state.arrival && state.departure) refresh(); else chooseMode();
  fetch('/api/calendar?id=' + boot.id).then(function (r) { return r.json(); }).then(function (j) {
    if (j.error) return;
    (j.days || []).forEach(function (d) { state.days[d.date] = d; });
    state.loaded = true;
    U.refreshDatePicker();
    if (state.arrival && state.departure && !validStay(state.arrival, state.departure)) refresh();
  }).catch(function () { /* the quote call still validates dates */ });
})();
