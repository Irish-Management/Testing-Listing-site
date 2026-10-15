// Shared browser code: menu, photo carousels, modals, the date picker, and the search pill.
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var iso = function (d) { return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); };
  var parse = function (s) { var a = s.split('-'); return new Date(Date.UTC(+a[0], +a[1] - 1, +a[2])); };
  var addDays = function (s, n) { var d = parse(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
  var shortDate = function (s) { return parse(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }); };
  var localToday = function () { var n = new Date(); return n.getFullYear() + '-' + pad(n.getMonth() + 1) + '-' + pad(n.getDate()); };
  var boot = {};
  try { boot = JSON.parse($('#site-boot').textContent); } catch (e) { /* defaults */ }

  var U = window.IM = {
    $: $, $$: $$, iso: iso, parse: parse, addDays: addDays, shortDate: shortDate, today: localToday, leadDays: boot.leadDays || 0,
    nights: function (a, b) { return Math.round((parse(b) - parse(a)) / 86400000); },
    rangeLabel: function (a, b) {
      var da = parse(a), db = parse(b);
      var same = da.getUTCMonth() === db.getUTCMonth() && da.getUTCFullYear() === db.getUTCFullYear();
      return shortDate(a) + ' - ' + (same ? db.getUTCDate() : shortDate(b));
    },
    money: function (n) { return '$' + Math.round(n).toLocaleString('en-US'); },
    money2: function (n) { return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
    esc: function (s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; },
    plural: function (n, w, many) { return n + ' ' + (n === 1 ? w : (many || w + 's')); },
  };

  // ---- popover management: one open at a time, closes on outside click or Escape ----
  var openPop = null;
  U.closePop = function () {
    if (!openPop) return;
    var p = openPop; openPop = null;
    p.el.hidden = true;
    if (p.trigger) { p.trigger.setAttribute('aria-expanded', 'false'); p.trigger.classList.remove('active'); }
    if (p.onClose) p.onClose();
  };
  U.showPop = function (el, trigger, onClose) {
    if (openPop && openPop.el === el) return;
    U.closePop();
    el.hidden = false;
    if (trigger) { trigger.setAttribute('aria-expanded', 'true'); trigger.classList.add('active'); }
    openPop = { el: el, trigger: trigger, onClose: onClose };
  };
  U.isOpen = function (el) { return !!openPop && openPop.el === el; };
  document.addEventListener('mousedown', function (e) {
    if (!openPop) return;
    if (openPop.el.contains(e.target) || (openPop.trigger && openPop.trigger.contains(e.target))) return;
    if (openPop.keep && openPop.keep.some(function (k) { return k.contains(e.target); })) return;
    U.closePop();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') U.closePop(); });
  U.keepOpenWith = function (els) { if (openPop) openPop.keep = els; };

  // ---- menu ----
  $$('[data-menu]').forEach(function (b) {
    var nav = b.parentNode.querySelector('.menu');
    b.addEventListener('click', function () { if (U.isOpen(nav)) U.closePop(); else U.showPop(nav, b); });
  });

  // ---- filters (search page) ----
  $$('[data-filters]').forEach(function (b) {
    var f = b.parentNode.querySelector('.filters-pop');
    b.addEventListener('click', function () { if (U.isOpen(f)) U.closePop(); else U.showPop(f, b); });
  });

  // ---- photo carousels on cards ----
  U.initCarousels = function (root) {
    $$('[data-carousel]', root).forEach(function (c) {
      if (c._init) return; c._init = true;
      var track = $('.track', c), dots = $$('.dots span', c);
      if (!track) return;
      var go = function (dir, e) {
        e.preventDefault(); e.stopPropagation();
        track.scrollBy({ left: dir * track.clientWidth, behavior: 'smooth' });
      };
      var prev = $('.prev', c), next = $('.next', c);
      if (prev) prev.addEventListener('click', function (e) { go(-1, e); });
      if (next) next.addEventListener('click', function (e) { go(1, e); });
      track.addEventListener('scroll', function () {
        var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
      }, { passive: true });
    });
  };
  U.initCarousels(document);

  // ---- review cards: show "Read more" only when the quote is clipped ----
  $$('.rcard').forEach(function (c) {
    var q = $('.rquote', c), b = $('.readmore', c);
    if (!q || !b) return;
    if (q.scrollHeight > q.clientHeight + 2) b.hidden = false;
    b.addEventListener('click', function () {
      var open = q.classList.toggle('clamp4');
      b.textContent = open ? 'Read more' : 'Show less';
    });
  });

  // ---- modals ----
  $$('[data-open]').forEach(function (b) {
    b.addEventListener('click', function () { var d = document.getElementById(b.getAttribute('data-open')); if (d && d.showModal) d.showModal(); });
  });
  $$('dialog.modal').forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    $$('[data-close]', d).forEach(function (b) { b.addEventListener('click', function () { d.close(); }); });
  });

  // ---- date picker ----
  // Opens a two-month range picker under `anchor`.
  // opts: { anchor, arrival, departure, minDate, isDisabled(date, picking, arrival) -> bool|string,
  //         onChange(arrival, departure), note(arrival, departure) -> string, keep: [elements] }
  var dp = document.createElement('div');
  dp.className = 'pop dp';
  dp.setAttribute('role', 'dialog');
  dp.setAttribute('aria-label', 'Choose dates');
  dp.hidden = true;
  document.body.appendChild(dp);
  var cur = null;

  function monthHtml(first, st) {
    var y = first.getUTCFullYear(), m = first.getUTCMonth();
    var name = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    var lead = first.getUTCDay(), count = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    var h = '<div class="dp-month"><div class="dp-title">' + name + '</div><div class="dp-dow" aria-hidden="true"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div><div class="dp-days">';
    for (var i = 0; i < lead; i++) h += '<span class="dp-day blank"></span>';
    var picking = st.arrival && !st.departure ? 'out' : 'in';
    for (var d = 1; d <= count; d++) {
      var s = y + '-' + pad(m + 1) + '-' + pad(d);
      var dis = s < st.minDate;
      if (!dis && st.isDisabled) dis = !!st.isDisabled(s, picking, st.arrival);
      if (picking === 'out' && s === st.arrival) dis = false;
      var cls = 'dp-day';
      if (s === st.arrival) cls += ' sel start' + (st.departure ? ' has-end' : '');
      if (s === st.departure) cls += ' sel end';
      if (st.arrival && st.departure && s > st.arrival && s < st.departure) cls += ' in';
      h += '<button type="button" class="' + cls + '" data-d="' + s + '"' + (dis ? ' disabled' : '') + ' aria-label="' + shortDate(s) + ', ' + y + (dis ? ', unavailable' : '') + '">' + d + '</button>';
    }
    return h + '</div></div>';
  }

  function renderDp() {
    var st = cur;
    var first = new Date(Date.UTC(st.view.getUTCFullYear(), st.view.getUTCMonth(), 1));
    var second = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1));
    var minMonth = parse(st.minDate.slice(0, 8) + '01');
    dp.innerHTML = '<div class="dp-top"><button type="button" class="linkbtn" data-clear' + (st.arrival ? '' : ' disabled') + '>Clear dates</button></div>' +
      '<div class="dp-months"><button type="button" class="dp-nav prev" aria-label="Previous month"' + (first <= minMonth ? ' disabled' : '') + '>' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg></button>' +
      monthHtml(first, st) + monthHtml(second, st) +
      '<button type="button" class="dp-nav next" aria-label="Next month"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg></button></div>' +
      '<p class="dp-note">' + U.esc(st.note ? st.note(st.arrival, st.departure) : (st.arrival && !st.departure ? 'Select your check-out date' : '')) + '</p>';
  }

  function placeDp(anchor, alignRight) {
    var r = anchor.getBoundingClientRect();
    var w = Math.min(720, window.innerWidth - 32);
    var left = alignRight ? r.right - w : r.left + r.width / 2 - w / 2;
    left = Math.max(16, Math.min(left, window.innerWidth - w - 16));
    dp.style.left = (left + window.scrollX) + 'px';
    dp.style.top = (r.bottom + window.scrollY + 8) + 'px';
  }

  dp.addEventListener('click', function (e) {
    var st = cur; if (!st) return;
    var t = e.target.closest('button'); if (!t) return;
    if (t.classList.contains('prev')) { st.view.setUTCMonth(st.view.getUTCMonth() - 1); renderDp(); return; }
    if (t.classList.contains('next')) { st.view.setUTCMonth(st.view.getUTCMonth() + 1); renderDp(); return; }
    if (t.hasAttribute('data-clear')) { st.arrival = null; st.departure = null; st.onChange(null, null); renderDp(); return; }
    var s = t.getAttribute('data-d'); if (!s || t.disabled) return;
    if (!st.arrival || st.departure || s <= st.arrival) { st.arrival = s; st.departure = null; }
    else st.departure = s;
    st.onChange(st.arrival, st.departure);
    renderDp();
    if (st.arrival && st.departure && st.closeOnComplete !== false) setTimeout(U.closePop, 150);
  });

  U.datePicker = function (opts) {
    var startView = opts.arrival ? parse(opts.arrival) : parse(opts.minDate || localToday());
    cur = {
      arrival: opts.arrival || null, departure: opts.departure || null,
      minDate: opts.minDate || localToday(), isDisabled: opts.isDisabled, note: opts.note,
      onChange: opts.onChange || function () {}, closeOnComplete: opts.closeOnComplete,
      view: new Date(Date.UTC(startView.getUTCFullYear(), startView.getUTCMonth(), 1)),
    };
    if (opts.pickOut && cur.arrival) cur.departure = null;
    renderDp();
    placeDp(opts.anchor, opts.alignRight);
    U.showPop(dp, opts.trigger || opts.anchor, opts.onClose);
    if (opts.keep) U.keepOpenWith(opts.keep);
  };
  U.refreshDatePicker = function () { if (cur && !dp.hidden) renderDp(); };

  // ---- search pill: When / Who popovers ----
  $$('form[data-search]').forEach(function (form) {
    var whenBtn = $('[data-when]', form), whoBtn = $('[data-who]', form);
    var f = form.elements;
    var st = { arrival: f.checkin.value || null, departure: f.checkout.value || null, guests: +f.guests.value || 0, pets: +f.pets.value || 0 };

    function paintWhen() {
      whenBtn.textContent = st.arrival && st.departure ? U.rangeLabel(st.arrival, st.departure) : (st.arrival ? shortDate(st.arrival) + ' - ?' : 'When');
      whenBtn.classList.toggle('set', !!st.arrival);
      f.checkin.value = st.arrival && st.departure ? st.arrival : '';
      f.checkout.value = st.arrival && st.departure ? st.departure : '';
    }
    function paintWho() {
      whoBtn.textContent = st.guests ? U.plural(st.guests, 'guest') + (st.pets ? ', ' + U.plural(st.pets, 'pet') : '') : (st.pets ? U.plural(st.pets, 'pet') : 'Who');
      whoBtn.classList.toggle('set', !!(st.guests || st.pets));
      f.guests.value = st.guests || '';
      f.pets.value = st.pets || '';
    }

    whenBtn.addEventListener('click', function () {
      if (U.isOpen(dp)) { U.closePop(); return; }
      U.datePicker({
        anchor: form, trigger: whenBtn, arrival: st.arrival, departure: st.departure, minDate: localToday(),
        onChange: function (a, d) { st.arrival = a; st.departure = d; paintWhen(); },
      });
    });

    var who = document.createElement('div');
    who.className = 'pop guests-pop';
    who.hidden = true;
    who.setAttribute('role', 'dialog');
    who.setAttribute('aria-label', 'Guests');
    document.body.appendChild(who);
    function renderWho() {
      var row = function (k, label) {
        return '<div class="step"><strong>' + label + '</strong><div class="stepper"><button type="button" data-k="' + k + '" data-d="-1" aria-label="Fewer ' + label.toLowerCase() + '"' + (st[k] ? '' : ' disabled') + '>&minus;</button><span>' + (st[k] || 'Any') + '</span><button type="button" data-k="' + k + '" data-d="1" aria-label="More ' + label.toLowerCase() + '">+</button></div></div>';
      };
      who.innerHTML = row('guests', 'Guests') + row('pets', 'Pets');
    }
    who.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-k]'); if (!b) return;
      var k = b.getAttribute('data-k');
      st[k] = Math.max(0, Math.min(k === 'pets' ? 5 : 30, (st[k] || 0) + +b.getAttribute('data-d')));
      renderWho(); paintWho();
    });
    whoBtn.addEventListener('click', function () {
      if (U.isOpen(who)) { U.closePop(); return; }
      renderWho();
      var r = whoBtn.getBoundingClientRect();
      who.style.left = Math.max(16, Math.min(r.left + window.scrollX, window.innerWidth - 356 + window.scrollX)) + 'px';
      who.style.top = (r.bottom + window.scrollY + 8) + 'px';
      U.showPop(who, whoBtn);
    });

    form.addEventListener('submit', function () {
      ['checkin', 'checkout', 'guests', 'pets'].forEach(function (k) { if (!f[k].value) f[k].disabled = true; });
    });
  });
})();
