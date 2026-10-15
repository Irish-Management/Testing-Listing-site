// Search page: map with price pins, and live prices for the searched dates.
(function () {
  'use strict';
  var U = window.IM, $ = U.$, $$ = U.$$;
  var pins = [];
  try { pins = JSON.parse($('#pins').textContent); } catch (e) { /* no pins */ }
  var markers = {};

  var mapEl = $('#map');
  if (mapEl && window.L && pins.length) {
    var map = L.map(mapEl, { scrollWheelZoom: true, zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
    var bounds = [];
    pins.forEach(function (p) {
      var html = p.price ? '<span class="pricepin">' + U.esc(p.price) + '</span>' : '<div class="pin-dot"></div>';
      var m = L.marker([p.lat, p.lng], { icon: L.divIcon({ className: '', html: html, iconSize: [0, 0] }), riseOnHover: true }).addTo(map);
      m.bindPopup('<a class="mpop" href="' + U.esc(p.href) + '">' + (p.photo ? '<img src="' + U.esc(p.photo) + '" alt="">' : '') + '<span>' + U.esc(p.title) + '</span></a>', { closeButton: false, minWidth: 220, maxWidth: 220 });
      markers[p.id] = m;
      bounds.push([p.lat, p.lng]);
    });
    // Frame the main cluster around South Bend; a far-off listing should not zoom the map out to half the country.
    var med = function (k) { var v = bounds.map(function (b) { return b[k]; }).sort(function (a, b) { return a - b; }); return v[Math.floor(v.length / 2)]; };
    var c = [med(0), med(1)];
    var near = bounds.filter(function (b) { return Math.abs(b[0] - c[0]) < 0.6 && Math.abs(b[1] - c[1]) < 0.8; });
    map.fitBounds(near.length ? near : bounds, { padding: [40, 40], maxZoom: 14 });
  }

  // Show homes 24 at a time, like the paged results on the old site.
  var cards = $$('.results .card'), shown = 24;
  if (cards.length > shown) {
    var more = document.createElement('div');
    more.className = 'center-btn';
    more.innerHTML = '<button type="button" class="chip">Show more homes</button>';
    $('.results').appendChild(more);
    var paint = function () {
      cards.forEach(function (c, i) { c.hidden = i >= shown; });
      more.hidden = shown >= cards.length;
    };
    more.firstChild.addEventListener('click', function () { shown += 24; paint(); });
    paint();
  }

  function setPrice(id, text) {
    var m = markers[id];
    if (m) m.setIcon(L.divIcon({ className: '', html: '<span class="pricepin">' + U.esc(text) + '</span>', iconSize: [0, 0] }));
  }

  $$('.card').forEach(function (c) {
    var id = c.getAttribute('data-id');
    c.addEventListener('mouseenter', function () { var m = markers[id]; if (m && m._icon) { var e = m._icon.firstChild; if (e) e.classList.add('hot'); m.setZIndexOffset(1000); } });
    c.addEventListener('mouseleave', function () { var m = markers[id]; if (m && m._icon) { var e = m._icon.firstChild; if (e) e.classList.remove('hot'); m.setZIndexOffset(0); } });
  });

  // Price each searched home as its card scrolls into view, a few at a time.
  var queue = [], active = 0;
  function next() {
    if (active >= 3 || !queue.length) return;
    var el = queue.shift(); active++;
    var d = el.dataset;
    fetch('/api/quote?id=' + d.quote + '&arrival=' + d.arrival + '&departure=' + d.departure + '&adults=' + Math.max(1, +d.guests || 1) + '&children=0&pets=' + (+d.pets || 0))
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        var b = el.querySelector('b');
        if (res.ok) { b.textContent = U.money(res.j.beforeTaxes); b.classList.remove('ph'); setPrice(d.quote, U.money(res.j.beforeTaxes)); }
        else { el.textContent = 'Not available for these dates'; }
      })
      .catch(function () { el.textContent = ''; })
      .then(function () { active--; next(); });
    next();
  }
  var priced = $$('[data-quote]');
  if (priced.length) {
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { io.unobserve(en.target); queue.push(en.target); next(); } });
    }, { rootMargin: '300px' }) : null;
    priced.forEach(function (el) { if (io) io.observe(el); else { queue.push(el); } });
    if (!io) next();
  }
})();
