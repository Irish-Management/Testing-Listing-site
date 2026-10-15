// Search page: map with price pins, filters, sorting, and live prices for the searched dates.
(function () {
  'use strict';
  var U = window.IM, $ = U.$, $$ = U.$$;
  var pins = [];
  try { pins = JSON.parse($('#pins').textContent); } catch (e) { /* no pins */ }
  var pinById = {};
  pins.forEach(function (p) { pinById[p.id] = p; });
  var markers = {}, layer = null;
  var grid = $('.results .grid2');
  var cards = $$('.results .card');
  var sortSel = $('#sort');
  var note = $('.sort-note');
  var searched = !!$('[data-quote]');
  var unavailable = {}; // homes whose live quote failed for the searched dates

  cards.forEach(function (c, i) { c.dataset.order = i; });
  function num(c, k) { var v = c.dataset[k]; return v === '' || v == null ? null : +v; }

  // ---- map ----
  function pinHtml(p) { return p.price ? '<span class="pricepin">' + U.esc(p.price) + '</span>' : '<div class="pin-dot"></div>'; }
  function popupHtml(p) {
    return '<a class="mpop" href="' + U.esc(p.href) + '">' + (p.photo ? '<img src="' + U.esc(p.photo) + '" alt="">' : '') +
      '<span>' + U.esc(p.title) + '</span>' + (p.price ? '<span class="mp"><b>' + U.esc(p.price) + '</b> ' + U.esc(p.sub || '') + '</span>' : '') + '</a>';
  }
  var mapEl = $('#map');
  if (mapEl && window.L && pins.length) {
    var map = L.map(mapEl, { scrollWheelZoom: true, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    // Every home stays on the map. Where price pins would overlap, the extra ones show as small
    // dots (see declutter below), and they turn back into prices as you zoom in.
    layer = L.layerGroup().addTo(map);
    var bounds = [];
    pins.forEach(function (p) {
      var m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', html: pinHtml(p), iconSize: [0, 0] }), riseOnHover: true });
      m.bindPopup(function () { return popupHtml(p); }, { closeButton: false, minWidth: 220, maxWidth: 220 });
      layer.addLayer(m);
      markers[p.id] = m;
      bounds.push([p.lat, p.lng]);
    });
    // Frame the main group of homes: the 85% closest to the middle, so a few far-off listings
    // (Niles, the river farms) do not zoom the map out and squeeze everything near campus together.
    var med = function (k) { var v = bounds.map(function (b) { return b[k]; }).sort(function (a, b) { return a - b; }); return v[Math.floor(v.length / 2)]; };
    var c = [med(0), med(1)];
    var near = bounds.slice().sort(function (a, b) {
      return (Math.pow(a[0] - c[0], 2) + Math.pow(a[1] - c[1], 2)) - (Math.pow(b[0] - c[0], 2) + Math.pow(b[1] - c[1], 2));
    }).slice(0, Math.max(1, Math.ceil(bounds.length * 0.85)));
    map.fitBounds(near, { padding: [30, 30], maxZoom: near.length > 1 ? 15 : 12 });
    map.on('zoomend moveend', declutter);
  }
  function setPin(id, price, sub) {
    var p = pinById[id];
    if (!p) return;
    p.price = price; p.sub = sub;
    scheduleDeclutter();
  }

  // Show a price pin for each home unless it would overlap one already placed; those become
  // dots. Homes earlier in the list (the current sort order) get their price shown first.
  var shownAs = {}, declutterTimer = null;
  function scheduleDeclutter() { clearTimeout(declutterTimer); declutterTimer = setTimeout(declutter, 60); }
  function declutter() {
    if (!map || !layer) return;
    var placed = [];
    var order = $$('.results .card').map(function (c) { return c.getAttribute('data-id'); });
    order.forEach(function (id) {
      var m = markers[id], p = pinById[id];
      if (!m || !p || !layer.hasLayer(m)) return;
      var as = 'dot';
      if (p.price) {
        var pt = map.latLngToContainerPoint(m.getLatLng());
        var w = 22 + p.price.length * 8, h = 26;
        var box = { l: pt.x - w / 2 - 2, r: pt.x + w / 2 + 2, t: pt.y - h / 2 - 2, b: pt.y + h / 2 + 2 };
        var hit = placed.some(function (o) { return box.l < o.r && box.r > o.l && box.t < o.b && box.b > o.t; });
        if (!hit) { placed.push(box); as = 'price'; }
      }
      var key = as + (p.price || '');
      if (shownAs[id] === key) return;
      shownAs[id] = key;
      m.setIcon(L.divIcon({ className: '', html: as === 'price' ? pinHtml(p) : '<div class="pin-dot' + (p.price ? ' mini' : '') + '"></div>', iconSize: [0, 0] }));
      m.setZIndexOffset(as === 'price' ? 500 : 0);
    });
  }
  function showPin(id, on) {
    var m = markers[id];
    if (!m || !layer) return;
    var has = layer.hasLayer(m);
    if (on && !has) { layer.addLayer(m); delete shownAs[id]; }
    if (!on && has) layer.removeLayer(m);
    scheduleDeclutter();
  }

  cards.forEach(function (c) {
    var id = c.getAttribute('data-id');
    var hot = function (on) {
      var m = markers[id], p = pinById[id];
      if (!m || !p || !layer || !layer.hasLayer(m)) return;
      if (on) {
        // Show the price even if this home is currently a dot.
        if (p.price) m.setIcon(L.divIcon({ className: '', html: pinHtml(p).replace('class="pricepin"', 'class="pricepin hot"'), iconSize: [0, 0] }));
        else if (m._icon && m._icon.firstChild) m._icon.firstChild.classList.add('hot');
        m.setZIndexOffset(1000);
      } else {
        delete shownAs[id];
        declutter();
      }
    };
    c.addEventListener('mouseenter', function () { hot(true); });
    c.addEventListener('mouseleave', function () { hot(false); });
  });

  // ---- paging: 24 homes at a time ----
  var shown = 24, more = null;
  function visibleCards() { return $$('.results .card').filter(function (c) { return !c.classList.contains('filtered'); }); }
  function paint() {
    var list = visibleCards();
    list.forEach(function (c, i) { c.hidden = i >= shown; });
    if (more) more.hidden = shown >= list.length;
  }
  if (cards.length > shown) {
    more = document.createElement('div');
    more.className = 'center-btn';
    more.innerHTML = '<button type="button" class="chip">Show more homes</button>';
    $('.results').appendChild(more);
    more.firstChild.addEventListener('click', function () { shown += 24; paint(); });
  }

  // ---- sorting ----
  function sortCards() {
    if (!grid) return;
    var s = sortSel ? sortSel.value : '';
    var byPrice = function (dir) {
      return function (a, b) {
        var x = num(a, 'price'), y = num(b, 'price');
        if (x == null || y == null) return (x == null) - (y == null) || (+a.dataset.order - +b.dataset.order);
        return dir * (x - y);
      };
    };
    var cmp = {
      price_asc: byPrice(1),
      price_desc: byPrice(-1),
      bedrooms: function (a, b) { return num(b, 'beds') - num(a, 'beds') || (+a.dataset.order - +b.dataset.order); },
      rating: function (a, b) { return num(b, 'rating') - num(a, 'rating') || num(b, 'reviews') - num(a, 'reviews'); },
    }[s] || function (a, b) { return +a.dataset.order - +b.dataset.order; };
    cards.slice().sort(cmp).forEach(function (c) { grid.appendChild(c); });
    paint();
    scheduleDeclutter();
  }

  // Keep sort and filter choices in the URL and in the search form, so a new date search keeps them.
  function syncParams(params) {
    var u = new URL(location.href);
    // Moving off /listings/<collection> to /s keeps the collection as a parameter; destination pages stay put.
    var col0 = $('.results') && $('.results').getAttribute('data-collection');
    if (col0 && /^\/listings\//.test(u.pathname)) { u.pathname = '/s'; if (!('collection' in params)) params.collection = col0; }
    Object.keys(params).forEach(function (k) { if (params[k]) u.searchParams.set(k, params[k]); else u.searchParams.delete(k); });
    history.replaceState(null, '', u.toString());
    $$('form[data-search]').forEach(function (f) {
      Object.keys(params).forEach(function (k) {
        var h = f.querySelector('input[name="' + k + '"]');
        if (!h) { h = document.createElement('input'); h.type = 'hidden'; h.name = k; f.appendChild(h); }
        h.value = params[k] || '';
        h.disabled = !params[k];
      });
    });
  }

  if (sortSel) sortSel.addEventListener('change', function () {
    syncParams({ sort: sortSel.value });
    if (note) note.hidden = !sortSel.value.startsWith('price');
    sortCards();
  });

  // ---- filters ----
  var url = new URL(location.href);
  var applied = {
    min: url.searchParams.get('pmin') ? +url.searchParams.get('pmin') : null,
    max: url.searchParams.get('pmax') ? +url.searchParams.get('pmax') : null,
    beds: +url.searchParams.get('beds') || 0,
    baths: +url.searchParams.get('baths') || 0,
    pets: url.searchParams.get('petsok') === '1',
    amen: (url.searchParams.get('amen') || '').split(',').filter(Boolean),
    // The server says which collection the page opened with (a /listings/<slug> address may be a destination instead).
    collection: ($('.results') && $('.results').getAttribute('data-collection')) || '',
  };
  var draft = null;
  var clone = function (s) { return { min: s.min, max: s.max, beds: s.beds, baths: s.baths, pets: s.pets, amen: s.amen.slice(), collection: s.collection }; };

  function matches(c, s) {
    if (unavailable[c.getAttribute('data-id')]) return false;
    if (s.collection && (' ' + (c.dataset.cols || '') + ' ').indexOf(' ' + s.collection + ' ') < 0) return false;
    if (s.min != null || s.max != null) {
      var p = num(c, 'price');
      if (p == null) {
        // While live prices are still loading, keep the home; homes with no price at all are left out.
        if (!(searched && c.querySelector('.card-price b.ph'))) return false;
      } else {
        if (s.min != null && p < s.min) return false;
        if (s.max != null && p > s.max) return false;
      }
    }
    if (s.beds && num(c, 'beds') < s.beds) return false;
    if (s.baths && num(c, 'baths') < s.baths) return false;
    if (s.pets && !(num(c, 'pets') > 0)) return false;
    if (s.amen.length) {
      var have = ' ' + (c.dataset.amen || '') + ' ';
      for (var i = 0; i < s.amen.length; i++) if (have.indexOf(' ' + s.amen[i] + ' ') < 0) return false;
    }
    return true;
  }
  function countMatches(s) { return cards.filter(function (c) { return matches(c, s); }).length; }
  function activeCount(s) { return (s.min != null || s.max != null ? 1 : 0) + (s.beds ? 1 : 0) + (s.baths ? 1 : 0) + (s.pets ? 1 : 0) + s.amen.length; }

  function applyFilters() {
    var n = 0;
    cards.forEach(function (c) {
      var ok = matches(c, applied);
      c.classList.toggle('filtered', !ok);
      showPin(c.getAttribute('data-id'), ok);
      if (ok) n++;
    });
    var h = $('#rcount');
    if (h) h.textContent = n + (n === 1 ? ' property' : ' properties') + ' available';
    var fc = $('#fcount'), k = activeCount(applied);
    if (fc) { fc.hidden = !k; fc.textContent = k; }
    shown = 24;
    paint();
  }

  // Price histogram and two-handle slider.
  var modal = $('#filters');
  var pmin = $('#pmin'), pmax = $('#pmax'), pminN = $('#pmin-n'), pmaxN = $('#pmax-n'), hist = $('#hist');
  var lo = 0, hi = 0, BINS = 28;
  function prices() { return cards.map(function (c) { return num(c, 'price'); }).filter(function (p) { return p != null && p > 0; }); }
  function buildPriceRange() {
    var list = prices();
    if (!list.length) { lo = 0; hi = 1000; hist.innerHTML = ''; } else {
      lo = Math.floor(Math.min.apply(null, list) / 10) * 10;
      hi = Math.ceil(Math.max.apply(null, list) / 10) * 10;
      if (hi <= lo) hi = lo + 10;
      var bins = []; for (var i = 0; i < BINS; i++) bins.push(0);
      list.forEach(function (p) { bins[Math.min(BINS - 1, Math.floor((p - lo) / (hi - lo) * BINS))]++; });
      var top = Math.max.apply(null, bins) || 1;
      hist.innerHTML = bins.map(function (b, k) { return '<span data-i="' + k + '" style="height:' + (b ? Math.max(6, Math.round(b / top * 100)) : 0) + '%"></span>'; }).join('');
    }
    [pmin, pmax].forEach(function (r) { r.min = lo; r.max = hi; });
  }
  function paintPrice() {
    var a = draft.min != null ? draft.min : lo, b = draft.max != null ? draft.max : hi;
    pmin.value = a; pmax.value = b;
    if (document.activeElement !== pminN) pminN.value = Math.round(a);
    if (document.activeElement !== pmaxN) pmaxN.value = Math.round(b);
    $$('span', hist).forEach(function (s) {
      var i = +s.getAttribute('data-i');
      var x0 = lo + (hi - lo) * i / BINS, x1 = lo + (hi - lo) * (i + 1) / BINS;
      s.classList.toggle('on', x1 >= a && x0 <= b);
    });
  }
  function setPrice(a, b) {
    a = Math.max(lo, Math.min(a, hi)); b = Math.max(lo, Math.min(b, hi));
    if (a > b) { var t = a; a = b; b = t; }
    draft.min = a <= lo ? null : a;
    draft.max = b >= hi ? null : b;
    paintPrice(); paintDraft();
  }
  function paintDraft() {
    $('#f-beds').textContent = draft.beds ? draft.beds + '+' : 'Any';
    $('#f-baths').textContent = draft.baths ? draft.baths + '+' : 'Any';
    $$('[data-f]', modal).forEach(function (b) {
      if (+b.getAttribute('data-d') < 0) b.disabled = !draft[b.getAttribute('data-f')];
    });
    $('#f-pets').checked = draft.pets;
    $$('.fchip[data-amen]', modal).forEach(function (b) { b.setAttribute('aria-pressed', draft.amen.indexOf(b.getAttribute('data-amen')) >= 0 ? 'true' : 'false'); });
    $$('.fchip[data-col]', modal).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-col') === draft.collection ? 'true' : 'false'); });
    var n = countMatches(draft);
    $('#f-apply').textContent = n ? 'Show ' + n + (n === 1 ? ' home' : ' homes') : 'No homes match';
    $('#f-apply').disabled = !n;
  }

  if (modal) {
    $('#filters-open').addEventListener('click', function () {
      draft = clone(applied);
      buildPriceRange();
      paintPrice(); paintDraft();
      modal.showModal();
    });
    pmin.addEventListener('input', function () { setPrice(+pmin.value, draft.max != null ? draft.max : hi); });
    pmax.addEventListener('input', function () { setPrice(draft.min != null ? draft.min : lo, +pmax.value); });
    pminN.addEventListener('change', function () { setPrice(+pminN.value || lo, draft.max != null ? draft.max : hi); });
    pmaxN.addEventListener('change', function () { setPrice(draft.min != null ? draft.min : lo, +pmaxN.value || hi); });
    $$('[data-f]', modal).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-f');
        draft[k] = Math.max(0, Math.min(12, draft[k] + +b.getAttribute('data-d')));
        paintDraft();
      });
    });
    $('#f-pets').addEventListener('change', function () { draft.pets = $('#f-pets').checked; paintDraft(); });
    $$('.fchip[data-col]', modal).forEach(function (b) {
      b.addEventListener('click', function () {
        var c = b.getAttribute('data-col');
        draft.collection = draft.collection === c ? '' : c;
        paintDraft();
      });
    });
    $$('.fchip[data-amen]', modal).forEach(function (b) {
      b.addEventListener('click', function () {
        var a = b.getAttribute('data-amen'), i = draft.amen.indexOf(a);
        if (i >= 0) draft.amen.splice(i, 1); else draft.amen.push(a);
        paintDraft();
      });
    });
    $('#f-clear').addEventListener('click', function () {
      draft = { min: null, max: null, beds: 0, baths: 0, pets: false, amen: [], collection: '' };
      paintPrice(); paintDraft();
    });
    $('#f-apply').addEventListener('click', function () {
      applied = clone(draft);
      $$('[data-col-intro]').forEach(function (el) { el.hidden = el.getAttribute('data-col-intro') !== applied.collection; });
      syncParams({
        pmin: applied.min != null ? String(Math.round(applied.min)) : '',
        pmax: applied.max != null ? String(Math.round(applied.max)) : '',
        beds: applied.beds ? String(applied.beds) : '', baths: applied.baths ? String(applied.baths) : '',
        petsok: applied.pets ? '1' : '', amen: applied.amen.join(','), collection: applied.collection,
      });
      applyFilters();
      modal.close();
    });
  }

  // First paint: the server already sorted when there are no dates.
  applyFilters();

  // ---- live prices for searched dates: every result, a few at a time ----
  var pricedEls = $$('[data-quote]');
  if (pricedEls.length) {
    var queue = pricedEls.slice().sort(function (a, b) {
      return a.closest('.card').classList.contains('filtered') - b.closest('.card').classList.contains('filtered');
    }), active = 0, settleTimer = null;
    var settle = function () {
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function () {
        if (sortSel && sortSel.value.startsWith('price')) sortCards();
        applyFilters();
        if (modal && modal.open) { buildPriceRange(); paintPrice(); paintDraft(); }
      }, 300);
    };
    var next = function () { while (active < 4 && queue.length) run(queue.shift()); };
    var run = function (el) {
      active++;
      var d = el.dataset, card = el.closest('.card');
      var nights = U.nights(d.arrival, d.departure);
      fetch('/api/quote?id=' + d.quote + '&arrival=' + d.arrival + '&departure=' + d.departure + '&adults=' + Math.max(1, +d.guests || 1) + '&children=0&pets=' + (+d.pets || 0))
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
        .then(function (res) {
          var b = el.querySelector('b');
          if (res.ok) {
            var price = U.money(res.j.beforeTaxes);
            b.textContent = price; b.classList.remove('ph');
            card.dataset.price = res.j.beforeTaxes;
            setPin(d.quote, price, 'for ' + U.plural(nights, 'night'));
          } else {
            el.textContent = 'Not available for these dates';
            card.dataset.price = '';
            unavailable[d.quote] = true;
          }
        })
        .catch(function () { var b = el.querySelector('b'); if (b) b.classList.remove('ph'); })
        .then(function () { active--; settle(); next(); });
    };
    next();
  }
})();
