// Search page: map with price pins, sorting, and live prices for the searched dates.
(function () {
  'use strict';
  var U = window.IM, $ = U.$, $$ = U.$$;
  var pins = [];
  try { pins = JSON.parse($('#pins').textContent); } catch (e) { /* no pins */ }
  var pinById = {};
  pins.forEach(function (p) { pinById[p.id] = p; });
  var markers = {};
  var grid = $('.results .grid2');
  var cards = $$('.results .card');
  var sortSel = $('#sort');
  var note = $('.sort-note');

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
    var bounds = [];
    // Nearby homes group into a "12 homes" bubble that splits into price pins as you zoom in.
    var layer = L.markerClusterGroup ? L.markerClusterGroup({
      maxClusterRadius: 22, disableClusteringAtZoom: 16, showCoverageOnHover: false, spiderfyOnMaxZoom: false,
      iconCreateFunction: function (cl) { return L.divIcon({ className: '', html: '<span class="pricepin cluster">' + cl.getChildCount() + ' homes</span>', iconSize: [0, 0] }); },
    }).addTo(map) : map;
    pins.forEach(function (p) {
      var m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', html: pinHtml(p), iconSize: [0, 0] }), riseOnHover: true }).addTo(layer);
      m.bindPopup(function () { return popupHtml(p); }, { closeButton: false, minWidth: 220, maxWidth: 220 });
      markers[p.id] = m;
      bounds.push([p.lat, p.lng]);
    });
    // Frame the main cluster around South Bend; a far-off listing should not zoom the map out to half the country.
    var med = function (k) { var v = bounds.map(function (b) { return b[k]; }).sort(function (a, b) { return a - b; }); return v[Math.floor(v.length / 2)]; };
    var c = [med(0), med(1)];
    var near = bounds.filter(function (b) { return Math.abs(b[0] - c[0]) < 0.6 && Math.abs(b[1] - c[1]) < 0.8; });
    map.fitBounds(near.length ? near : bounds, { padding: [40, 40], maxZoom: 14 });
  }

  function setPin(id, price, sub) {
    var p = pinById[id], m = markers[id];
    if (!p) return;
    p.price = price; p.sub = sub;
    if (m) m.setIcon(L.divIcon({ className: '', html: pinHtml(p), iconSize: [0, 0] }));
  }
  function removePin(id) { var m = markers[id]; if (m) { if (m.__parent && m.__parent._group) m.__parent._group.removeLayer(m); else m.remove(); delete markers[id]; } }

  cards.forEach(function (c) {
    var id = c.getAttribute('data-id');
    var hot = function (on) {
      var m = markers[id];
      if (!m || !m._icon) return;
      var e = m._icon.firstChild; if (e) e.classList.toggle('hot', on);
      m.setZIndexOffset(on ? 1000 : 0);
    };
    c.addEventListener('mouseenter', function () { hot(true); });
    c.addEventListener('mouseleave', function () { hot(false); });
  });

  // ---- paging: 24 homes at a time ----
  var shown = 24, more = null;
  function paint() {
    var list = $$('.results .card');
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
  cards.forEach(function (c, i) { c.dataset.order = i; });
  function num(c, k) { var v = c.dataset[k]; return v === '' || v == null ? null : +v; }
  function sortCards() {
    if (!grid) return;
    var s = sortSel ? sortSel.value : '';
    var list = cards.slice();
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
    list.sort(cmp).forEach(function (c) { grid.appendChild(c); });
    paint();
  }
  if (sortSel) sortSel.addEventListener('change', function () {
    var u = new URL(location.href);
    if (sortSel.value) u.searchParams.set('sort', sortSel.value); else u.searchParams.delete('sort');
    history.replaceState(null, '', u.toString());
    if (note) note.hidden = !sortSel.value.startsWith('price');
    // Remember the choice when the guest changes dates or filters.
    $$('form[data-search], .filters-pop').forEach(function (f) {
      var h = f.querySelector('input[name=sort]');
      if (!h) { h = document.createElement('input'); h.type = 'hidden'; h.name = 'sort'; f.appendChild(h); }
      h.value = sortSel.value;
      h.disabled = !sortSel.value;
    });
    sortCards();
  });
  // The server already applies the sort when there are no dates; the paging still needs a first paint.
  paint();

  // ---- live prices for searched dates: every result, a few at a time ----
  var priced = $$('[data-quote]');
  if (priced.length) {
    var queue = priced.slice(), active = 0, resortTimer = null;
    var resort = function () {
      if (!sortSel || !sortSel.value.startsWith('price')) return;
      clearTimeout(resortTimer);
      resortTimer = setTimeout(sortCards, 300);
    };
    var next = function () {
      while (active < 4 && queue.length) run(queue.shift());
    };
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
            removePin(d.quote);
          }
        })
        .catch(function () { el.textContent = ''; })
        .then(function () { active--; resort(); next(); });
    };
    next();
  }
})();
