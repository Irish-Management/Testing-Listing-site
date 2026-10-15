// Irish Management direct booking site
// Runs as a Cloudflare Worker. All OwnerRez calls happen here on the server,
// so the API token is never sent to guests' browsers.

import {
  renderHome, renderSearch, renderProperty, renderThanks, renderNotFound, renderError,
  renderReviews, renderSitemap, renderTerms, renderPrivacy, renderBigDates, AMENITY_FILTERS, COLLECTIONS,
} from './pages.js';
import { EVENTS, EVENT_GROUPS } from './events.js';

const API = 'https://api.ownerrez.com';
const UA = 'IrishManagementDirectBooking/1.0';

// ---------- OwnerRez client ----------

class OrError extends Error {
  constructor(status, body) {
    super((body && body.messages && body.messages.join(' ')) || 'OwnerRez error ' + status);
    this.status = status;
    this.code = body && body.code;
  }
}

async function or(env, path, opts = {}) {
  const { method = 'GET', query, body } = opts;
  const url = new URL(API + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, String(x)));
      else url.searchParams.set(k, String(v));
    }
  }
  const headers = { 'User-Agent': UA, Accept: 'application/json' };
  // Personal access token: Basic auth with your OwnerRez login email + pt_ token.
  // OAuth "Grant Access To Me" token: leave OWNERREZ_EMAIL blank to send it as Bearer.
  headers.Authorization = env.OWNERREZ_EMAIL
    ? 'Basic ' + btoa(env.OWNERREZ_EMAIL + ':' + env.OWNERREZ_TOKEN)
    : 'Bearer ' + env.OWNERREZ_TOKEN;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
  if (!res.ok) throw new OrError(res.status, data);
  return data;
}

// ---------- Caching ----------
// Two layers: an in-memory map (fast, per server instance) and Cloudflare's edge cache
// (shared, only active on a custom domain). Keeps us well under OwnerRez's
// 300 requests per 5 minutes limit.

const memo = new Map();

async function cached(ctx, key, ttlSeconds, fn) {
  const now = Date.now();
  const m = memo.get(key);
  if (m && m.exp > now) return m.value;

  const cache = caches.default;
  const req = new Request('https://or-cache.internal/' + encodeURIComponent(key));
  const hit = await cache.match(req);
  if (hit) {
    const value = await hit.json();
    memo.set(key, { exp: now + ttlSeconds * 1000, value });
    return value;
  }

  const value = await fn();
  memo.set(key, { exp: now + ttlSeconds * 1000, value });
  if (memo.size > 500) memo.delete(memo.keys().next().value);
  ctx.waitUntil(cache.put(req, new Response(JSON.stringify(value), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=' + ttlSeconds },
  })));
  return value;
}

// ---------- Data ----------

function stateAbbr(s) {
  const map = { indiana: 'IN', michigan: 'MI', illinois: 'IL', ohio: 'OH' };
  return map[String(s || '').toLowerCase()] || s || '';
}

function publicProperty(p) {
  // Only fields safe to show the public. Never pass owner details or street address.
  return {
    id: p.id,
    // The property key is OwnerRez's public widget identifier (it appears in every widget
    // embed code). The inquiry widget needs it, without dashes, to file the inquiry under this home.
    key: String(p.key || '').replace(/-/g, ''),
    // Lowercased OwnerRez tags, used only to build the collection pages.
    tags: (p.tags || []).map((t) => String(t).trim().toLowerCase()),
    title: p.external_name || p.name,
    bedrooms: p.bedrooms || 0,
    bathrooms: p.bathrooms || 0,
    maxGuests: p.max_guests || 0,
    maxPets: p.max_pets || 0,
    city: (p.address && p.address.city) || '',
    state: stateAbbr(p.address && p.address.state),
    zip: (p.address && p.address.postal_code) || '',
    photo: p.thumbnail_url_large || p.thumbnail_url_medium || p.thumbnail_url || '',
    checkIn: p.check_in || '',
    checkOut: p.check_out || '',
    // Rounded to about 100 meters so the map shows the block, not the exact house.
    lat: typeof p.latitude === 'number' ? Math.round(p.latitude * 1000) / 1000 : null,
    lng: typeof p.longitude === 'number' ? Math.round(p.longitude * 1000) / 1000 : null,
    order: p.external_display_order != null ? p.external_display_order : (p.display_order != null ? p.display_order : 9999),
  };
}

async function fetchProperties(env) {
  const all = [];
  let offset = 0;
  for (let i = 0; i < 10; i++) {
    const page = await or(env, '/v2/properties', { query: { active: true, include_tags: true, limit: 100, offset } });
    const items = (page && page.items) || [];
    all.push(...items);
    if (items.length < 100) break;
    offset += 100;
  }
  const excludes = (env.EXCLUDE_NAME_CONTAINS || 'Home Watch')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const requiredTag = (env.REQUIRE_TAG || '').trim().toLowerCase();
  const hiddenTags = (env.EXCLUDE_TAGS == null ? 'Do Not Market' : env.EXCLUDE_TAGS)
    .split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);

  return all
    .filter((p) => p.active && !p.is_snoozed && (p.bedrooms || 0) > 0)
    .filter((p) => {
      const names = ((p.name || '') + ' ' + (p.external_name || '')).toLowerCase();
      return !excludes.some((x) => names.includes(x));
    })
    .filter((p) => !requiredTag || (p.tags || []).some((t) => String(t).toLowerCase() === requiredTag))
    .filter((p) => !(p.tags || []).some((t) => hiddenTags.includes(String(t).trim().toLowerCase())))
    .map(publicProperty)
    .sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title));
}

function getProperties(env, ctx) {
  return cached(ctx, 'properties:v5', 900, () => fetchProperties(env));
}

// OwnerRez amenity text contains HTML entities such as "&ndash;". Decode them to plain
// text here; pages.js escapes everything again on output.
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', hellip: '…' };
function decodeEntities(s) {
  return String(s || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m;
    }
    const v = ENTITIES[e.toLowerCase()];
    return v === undefined ? m : v;
  });
}

// Amenity categories that describe the listing rather than things in the home.
const NOT_AMENITIES = new Set(['PropertyType', 'Accommodation', 'HouseRules', 'Bathrooms', 'Bedrooms',
  'LocationTypeFeatures', 'ThemeFeatures', 'AttractionFeatures', 'LeisureFeatures', 'LocalFeatures',
  'ListingExpectationFeatures', 'ActivitiesFeatures', 'SportsFeatures']);

function shapeListing(l) {
  const d = l.descriptions || {};
  const cats = (l.amenity_categories || []).map((c) => ({
    type: c.type || '',
    caption: decodeEntities(c.caption || c.type || ''),
    // "text" is the amenity name; "title" is an optional host note
    // (for example "Exterior Ring camera at front door"), so it never replaces the name.
    items: (c.amenities || []).map((a) => ({ name: decodeEntities(a.text || a.title), note: a.text && a.title ? decodeEntities(a.title) : '' })).filter((a) => a.name),
  })).filter((c) => c.items.length);
  const byType = (t) => (cats.find((c) => c.type === t) || { items: [] }).items;
  // Whitelist only. The listing response also contains wifi passwords, house manual,
  // and check-in instructions, which must never reach a public page.
  return {
    available: true,
    headline: d.headline || '',
    summary: d.short_description || '',
    description: d.description || '',
    photos: (l.photos || [])
      .filter((p) => p.large_url || p.original_url)
      .map((p) => ({ url: p.large_url || p.original_url, caption: p.caption || '' })),
    amenities: cats.filter((c) => !NOT_AMENITIES.has(c.type)).map((c) => ({ caption: c.caption, items: c.items.map((i) => i.name) })),
    callouts: (l.amenity_call_outs || []).map((a) => decodeEntities(a.text || a.title)).filter(Boolean),
    houseRules: byType('HouseRules').map((i) => i.name),
    expectations: byType('ListingExpectationFeatures').map((i) => i.name + (i.note ? ': ' + i.note : '')),
    beds: (l.rooms || []).reduce((s, r) => s + (r.total_beds || 0), 0),
    reviewAverage: l.review_average || 0,
    reviewCount: l.review_count || 0,
    sleepsMax: l.sleeps_max || l.occupancy_max || 0,
    cancellationPolicy: decodeEntities(l.cancellation_policy),
  };
}

async function fetchListing(env, id) {
  try {
    return shapeListing(await or(env, '/v2/listings/' + id, { query: { descriptionFormat: 'text' } }));
  } catch (e) {
    // 402 means the account does not have listing access for this token.
    // The page still works using basic property info and the thumbnail.
    if (e instanceof OrError && [402, 403, 404].includes(e.status)) {
      return { available: false, reason: e.code || String(e.status) };
    }
    throw e;
  }
}

function getListing(env, ctx, id) {
  return cached(ctx, 'listing:v3:' + id, 1800, () => fetchListing(env, id));
}

function firstName(r) {
  const n = String(r.display_name || (r.guest && r.guest.first_name) || '').trim();
  return n ? n.split(/\s+/)[0] : 'Guest';
}

function shapeReview(r) {
  const d = r.date ? new Date(r.date) : null;
  const month = r.month_of_stay && r.year_of_stay
    ? new Date(Date.UTC(r.year_of_stay, r.month_of_stay - 1, 1))
    : d;
  return {
    name: firstName(r),
    stars: Number(r.stars) || 0,
    text: decodeEntities(r.body || '').trim(),
    when: month ? month.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '',
    propertyId: r.property_id,
  };
}

async function fetchReviews(env, query) {
  const r = await or(env, '/v2/reviews', { query: Object.assign({ include_guest: true, limit: 50 }, query) });
  return ((r && r.items) || [])
    .filter((x) => x.visible !== false && x.reviewer !== 'host' && String(x.body || '').trim())
    .map(shapeReview);
}

function getPropertyReviews(env, ctx, id) {
  return cached(ctx, 'reviews:v1:' + id, 1800, async () => {
    try { return await fetchReviews(env, { property_id: id, limit: 30 }); } catch (e) { return []; }
  });
}

async function getCalendar(env, ctx, id, from, to) {
  return cached(ctx, 'cal:v2:' + id + ':' + from + ':' + to, 300, async () => {
    const c = await or(env, '/v2/calendar/' + id, { query: { from, to } });
    return { currency: (c && c.currency_code) || 'USD', days: shapeDays((c && c.days) || []) };
  });
}

function shapeDays(days) {
  return days.map((d) => {
    const r = d.rules || {};
    return {
      date: d.date,
      open: d.status === 'available' && !r.is_stay_disallowed,
      noArrive: !!r.is_arrival_disallowed,
      noDepart: !!r.is_departure_disallowed,
      minNights: r.min_nights || 0,
      maxNights: r.max_nights || 0,
      rate: d.rate && d.rate.amount != null ? d.rate.amount : null,
    };
  });
}

// Earliest stays that satisfy availability and minimum-night rules, starting at `from`.
function findStays(days, from, count) {
  const byDate = {};
  for (const d of days) byDate[d.date] = d;
  const out = [];
  for (const d of days) {
    if (d.date < from || !d.open || d.noArrive) continue;
    const n = Math.max(1, d.minNights || 1);
    let ok = true;
    for (let i = 0; i < n; i++) {
      const x = byDate[addDays(d.date, i)];
      if (!x || !x.open) { ok = false; break; }
    }
    const dep = byDate[addDays(d.date, n)];
    if (!ok || (dep && dep.noDepart)) continue;
    out.push({ arrival: d.date, departure: addDays(d.date, n), nights: n });
    if (out.length >= count) break;
  }
  return out;
}

const CHARGE_LABELS = { rent: 'Rent', surcharge: 'Fees', tax: 'Taxes', tax_other: 'Taxes', surcharge_other: 'Fees' };
const isTax = (t) => t === 'tax' || t === 'tax_other';

// Surcharges set to "Categorize this as a 'rent' line item" in OwnerRez (show_as_rent). Guests see
// these folded into rent rather than as their own line, so the site does the same.
let rentSurcharges = null;
async function getRentSurchargeIds(env) {
  if (rentSurcharges && rentSurcharges.exp > Date.now()) return rentSurcharges.ids;
  try {
    const ids = new Set();
    let offset = 0;
    for (let i = 0; i < 10; i++) {
      const r = await or(env, '/v2/surcharges', { query: { limit: 100, offset } });
      const items = (r && r.items) || [];
      items.forEach((x) => { if (x.show_as_rent) ids.add(x.id); });
      if (items.length < 100) break;
      offset += 100;
    }
    rentSurcharges = { ids, exp: Date.now() + 30 * 60 * 1000 };
  } catch (e) {
    // Keep the last known list (or none) if OwnerRez is busy; retry in a minute.
    rentSurcharges = { ids: rentSurcharges ? rentSurcharges.ids : new Set(), exp: Date.now() + 60 * 1000 };
  }
  return rentSurcharges.ids;
}

async function fetchQuote(env, q) {
  // test: true prices the stay without saving a quote in OwnerRez.
  const [r, asRent] = await Promise.all([
    or(env, '/v2/quotes', {
      method: 'POST',
      body: {
        property_id: q.id, arrival: q.arrival, departure: q.departure,
        adults: q.adults, children: q.children || 0, pets: q.pets || 0,
        test: true, generate_charges: true, validate_rules: true,
      },
    }),
    getRentSurchargeIds(env),
  ]);
  const raw = ((r && r.charges) || []).slice().sort((a, b) => (a.position || 0) - (b.position || 0));
  const charges = [];
  let folded = 0;
  for (const c of raw) {
    const amount = Number(c.amount) || 0;
    if (c.surcharge_id && asRent.has(c.surcharge_id)) { folded += amount; continue; }
    charges.push({ description: c.description || CHARGE_LABELS[c.type] || 'Charge', amount, type: c.type });
  }
  if (folded) {
    const rent = charges.find((c) => c.type === 'rent');
    if (rent) rent.amount += folded;
    else charges.unshift({ description: 'Rent', amount: folded, type: 'rent' });
  }
  const round = (n) => Math.round(n * 100) / 100;
  charges.forEach((c) => { c.amount = round(c.amount); });
  const shown = charges.filter((c) => c.amount !== 0);
  const total = round(shown.reduce((s, c) => s + c.amount, 0));
  const beforeTaxes = round(shown.filter((c) => !isTax(c.type)).reduce((s, c) => s + c.amount, 0));
  return { charges: shown, total, beforeTaxes };
}

function getQuote(env, ctx, q) {
  const key = ['quote:v3', q.id, q.arrival, q.departure, q.adults, q.children, q.pets].join(':');
  return cached(ctx, key, 300, () => fetchQuote(env, q));
}

async function searchAvailable(env, ctx, arrival, departure) {
  return cached(ctx, 'search:v2:' + arrival + ':' + departure, 300, async () => {
    const ids = [];
    let offset = 0;
    for (let i = 0; i < 10; i++) {
      const r = await or(env, '/v2/propertysearch', {
        // available_to is the checkout date: OwnerRez evaluates min-night rules over this range,
        // and a booking that starts on the checkout day does not block the stay.
        query: { available_from: arrival, available_to: departure, evaluate_rules: true, limit: 100, offset },
      });
      const items = (r && r.items) || [];
      for (const it of items) if (!it.rule_violations || it.rule_violations.length === 0) ids.push(it.id);
      if (items.length < 100) break;
      offset += 100;
    }
    return ids;
  });
}

// ---------- Snapshot ----------
// Card photos, ratings, and "next available stay" prices for every home come from a
// snapshot in Workers KV. A cron trigger refreshes a batch of homes every 10 minutes,
// which keeps each run under Cloudflare's per-request subrequest limit and spreads the
// OwnerRez calls out over time.

const SNAP_KEY = 'snapshot:v1';
const BATCH = 12;
let snapMemo = null;

async function readSnapshot(env) {
  if (!env.SNAP) return null;
  if (snapMemo && snapMemo.exp > Date.now()) return snapMemo.value;
  const value = await env.SNAP.get(SNAP_KEY, 'json').catch(() => null);
  snapMemo = { exp: Date.now() + 60000, value };
  return value;
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

async function refreshSnapshot(env) {
  if (!env.SNAP) throw new Error('SNAP KV binding missing');
  const props = await fetchProperties(env);
  const snap = (await env.SNAP.get(SNAP_KEY, 'json').catch(() => null)) || { props: {}, cursor: 0, reviews: [] };
  const ids = props.map((p) => p.id);
  if (!ids.length) return snap;
  const start = (snap.cursor || 0) % ids.length;
  const batch = [];
  for (let i = 0; i < Math.min(BATCH, ids.length); i++) batch.push(ids[(start + i) % ids.length]);

  const from = addDays(todayISO(), leadDays(env));
  const cal = await or(env, '/v2/calendar', {
    query: { property_ids: batch, from: todayISO(), to: addDays(todayISO(), 89), limit: 100 },
  }).catch(() => null);
  const calById = {};
  for (const it of (cal && cal.items) || []) calById[it.property_id] = shapeDays(it.days || []);

  await pool(batch, 4, async (id) => {
    const prev = snap.props[id] || {};
    const entry = { photos: prev.photos || [], rating: prev.rating || 0, reviews: prev.reviews || 0, beds: prev.beds || 0, amen: prev.amen || [], stay: null, at: Date.now() };
    const l = await fetchListing(env, id).catch(() => null);
    if (l && l.available) {
      entry.photos = l.photos.slice(0, 5).map((p) => p.url);
      entry.rating = l.reviewAverage;
      entry.reviews = l.reviewCount;
      entry.beds = l.beds;
      entry.amen = amenityCodes(l);
    }
    const days = calById[id];
    if (days) {
      for (const s of findStays(days, from, 2)) {
        try {
          const q = await fetchQuote(env, { id, arrival: s.arrival, departure: s.departure, adults: 1 });
          entry.stay = Object.assign({}, s, { price: Math.round(q.beforeTaxes) });
          break;
        } catch (e) { /* rules can reject a stay the calendar allows; try the next one */ }
      }
    }
    snap.props[id] = entry;
  });

  for (const k of Object.keys(snap.props)) if (!ids.includes(Number(k))) delete snap.props[k];
  if (start === 0 || !snap.reviews || !snap.reviews.length) {
    snap.reviews = await fetchReviews(env, { limit: 60 }).catch(() => snap.reviews || []);
  }
  snap.cursor = (start + batch.length) % ids.length;
  snap.updated = new Date().toISOString();
  await env.SNAP.put(SNAP_KEY, JSON.stringify(snap));
  snapMemo = null;
  return snap;
}

function siteRating(props, snap) {
  let count = 0, sum = 0;
  for (const p of props) {
    const s = snap && snap.props && snap.props[p.id];
    if (s && s.reviews && s.rating) { count += s.reviews; sum += s.rating * s.reviews; }
  }
  return { count, average: count ? sum / count : 0 };
}

// Short codes for the amenity filter chips, matched against the home's OwnerRez amenity names.
function amenityCodes(l) {
  const names = [];
  (l.amenities || []).forEach((c) => c.items.forEach((n) => names.push(n)));
  (l.callouts || []).forEach((n) => names.push(n));
  return AMENITY_FILTERS.filter(([, , re, not]) => names.some((n) => re.test(n) && !(not && not.test(n)))).map(([code]) => code);
}

function withSnapshot(props, snap) {
  return props.map((p) => {
    const s = (snap && snap.props && snap.props[p.id]) || {};
    return Object.assign({}, p, {
      photos: s.photos && s.photos.length ? s.photos : (p.photo ? [p.photo] : []),
      rating: s.rating || 0,
      reviews: s.reviews || 0,
      amen: s.amen || [],
      stay: s.stay || null,
    });
  });
}

// ---------- Helpers ----------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isDate(s) { return typeof s === 'string' && DATE_RE.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z')); }
function addDays(s, n) { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function int(v, def) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : def; }
function leadDays(env) { return Math.max(0, int(env.MIN_LEAD_DAYS, 3)); }

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    },
  });
}

function friendlyError(e) {
  if (e instanceof OrError) {
    if (e.status === 429) return 'Our booking system is busy right now. Wait a minute and try again.';
    if (e.code === 'validation_failed' || e.status === 400) return e.message || 'Those dates or guest counts are not available.';
    if (e.status === 401) return 'The booking system connection needs to be updated. Please contact us to book.';
  }
  return 'Something went wrong reaching our booking system. Please try again or contact us.';
}

function validStay(arrival, departure) {
  return isDate(arrival) && isDate(departure) && arrival >= todayISO() && departure > arrival &&
    (Date.parse(departure) - Date.parse(arrival)) / 86400000 <= 90;
}

function site(env, url) {
  const phone = env.CONTACT_PHONE || '';
  return {
    name: env.SITE_NAME || 'Irish Management',
    phone,
    sms: phone.replace(/[^\d+]/g, ''),
    email: env.CONTACT_EMAIL || '',
    instagram: env.INSTAGRAM_URL || '',
    facebook: env.FACEBOOK_URL || '',
    origin: (env.SITE_URL || url.origin).replace(/\/$/, ''),
    leadDays: leadDays(env),
    inquiryWidget: (env.INQUIRY_WIDGET_ID || '').trim(),
  };
}

const SORTS = ['price_asc', 'price_desc', 'bedrooms', 'rating'];

// Price sorting without dates compares price per night, since each home's next available
// stay has a different length. Homes with no open stay go last.
function sortHomes(homes, sort) {
  const nightly = (p) => (p.stay ? p.stay.price / p.stay.nights : null);
  const byPrice = (dir) => (a, b) => {
    const x = nightly(a), y = nightly(b);
    if (x == null || y == null) return (x == null) - (y == null);
    return dir * (x - y);
  };
  const cmp = {
    price_asc: byPrice(1),
    price_desc: byPrice(-1),
    bedrooms: (a, b) => b.bedrooms - a.bedrooms,
    rating: (a, b) => (b.rating - a.rating) || (b.reviews - a.reviews),
  }[sort];
  return cmp ? homes.slice().sort(cmp) : homes;
}

function searchParams(url) {
  const arrival = url.searchParams.get('checkin') || '';
  const departure = url.searchParams.get('checkout') || '';
  return {
    arrival, departure,
    guests: Math.max(0, int(url.searchParams.get('guests'), 0)),
    pets: Math.max(0, int(url.searchParams.get('pets'), 0)),
    bedrooms: Math.max(0, int(url.searchParams.get('bedrooms'), 0)),
    sort: SORTS.includes(url.searchParams.get('sort')) ? url.searchParams.get('sort') : '',
  };
}

// ---------- Routes ----------

async function handleBook(env, ctx, request, url) {
  const b = await request.json().catch(() => null);
  if (!b) return json({ error: 'Send the booking details as JSON.' }, 400);
  if (b.company) return json({ error: 'Request blocked.' }, 400); // hidden honeypot field

  const id = int(b.property_id, 0);
  const adults = int(b.adults, 0);
  const children = Math.max(0, int(b.children, 0));
  const pets = Math.max(0, int(b.pets, 0));
  const first = String(b.first_name || '').trim().slice(0, 60);
  const last = String(b.last_name || '').trim().slice(0, 60);
  const email = String(b.email || '').trim().slice(0, 120);
  const phone = String(b.phone || '').trim().slice(0, 30);

  if (!validStay(b.arrival, b.departure)) return json({ error: 'Choose valid check-in and checkout dates.' }, 400);
  if (!first || !last) return json({ error: 'Enter your first and last name.' }, 400);
  if (!EMAIL_RE.test(email)) return json({ error: 'Enter a valid email address.' }, 400);

  const props = await getProperties(env, ctx);
  const prop = props.find((p) => p.id === id);
  if (!prop) return json({ error: 'That property is not available to book.' }, 404);
  if (adults < 1 || (prop.maxGuests && adults + children > prop.maxGuests)) {
    return json({ error: 'This home sleeps up to ' + prop.maxGuests + ' guests.' }, 400);
  }
  if (pets > (prop.maxPets || 0)) return json({ error: prop.maxPets ? 'This home allows up to ' + prop.maxPets + ' pets.' : 'This home does not allow pets.' }, 400);

  try {
    const guest = await or(env, '/v2/guests', {
      method: 'POST',
      body: {
        first_name: first,
        last_name: last,
        email_addresses: [{ address: email, is_default: true, type: 'home' }],
        phones: phone ? [{ number: phone, is_default: true, type: 'mobile' }] : [],
      },
    });
    if (!guest || !guest.id) return json({ error: 'We could not start your reservation. Please contact us to book.' }, 502);

    const quote = await or(env, '/v2/quotes', {
      method: 'POST',
      body: {
        property_id: id, guest_id: guest.id,
        arrival: b.arrival, departure: b.departure, adults, children, pets,
        generate_charges: true, validate_rules: true,
        redirect_after_booking_url: site(env, url).origin + '/thank-you',
      },
    });
    if (!quote || !quote.payment_form) return json({ error: 'We could not open checkout. Please contact us to book.' }, 502);
    return json({ paymentUrl: quote.payment_form });
  } catch (e) {
    return json({ error: friendlyError(e) }, e instanceof OrError && e.status < 500 && e.status !== 401 ? 400 : 502);
  }
}

async function route(request, env, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const s = site(env, url);

  if (path === '/terms') return html(renderTerms(s));
  if (path === '/privacy-policy' || path === '/privacy') return html(renderPrivacy(s));
  if (path === '/thank-you') return html(renderThanks(s));

  if (!env.OWNERREZ_TOKEN) {
    return html(renderError(s, 'Setup needed', 'Add the OWNERREZ_TOKEN secret to finish connecting this site to OwnerRez.'), 500);
  }

  // Manual snapshot refresh, for warming the cache right after a deploy.
  if (path === '/__refresh' && request.method === 'POST') {
    if (!env.REFRESH_KEY || request.headers.get('x-refresh-key') !== env.REFRESH_KEY) return json({ error: 'Forbidden' }, 403);
    const snap = await refreshSnapshot(env);
    return json({ cursor: snap.cursor, homes: Object.keys(snap.props).length, priced: Object.values(snap.props).filter((p) => p.stay).length });
  }

  if (path === '/' && request.method === 'GET') {
    const [props, snap] = await Promise.all([getProperties(env, ctx), readSnapshot(env)]);
    const homes = withSnapshot(props, snap);
    const recent = ((snap && snap.reviews) || []).filter((r) => r.stars >= 4 && r.text.length > 10).slice(0, 4);
    return html(renderHome(s, { props: homes.slice(0, 10), total: homes.length, rating: siteRating(props, snap), reviews: recent }));
  }

  if (path === '/listings' && request.method === 'GET') return Response.redirect(url.origin + '/s' + url.search, 301);
  if ((path === '/listings/big-dates' || path === '/big-dates') && request.method === 'GET') {
    const [props, snap] = await Promise.all([getProperties(env, ctx), readSnapshot(env)]);
    const homes = withSnapshot(props, snap);
    const byId = new Map(homes.map((p) => [p.id, p]));
    const today = todayISO();
    const upcoming = EVENTS.filter((e) => (e.date || e.departure) >= today && validStay(e.arrival, e.departure));
    // How many of our homes are still open for each weekend. Cached for 30 minutes per weekend.
    const events = await Promise.all(upcoming.map(async (e) => {
      let open = null, openHomes = [];
      try {
        const ids = new Set(await cached(ctx, 'bigdate:v1:' + e.arrival + ':' + e.departure, 1800, () => searchAvailable(env, ctx, e.arrival, e.departure)));
        // Keep the site's display order so the photos show the homes we feature first.
        openHomes = homes.filter((p) => ids.has(p.id) && byId.has(p.id));
        open = openHomes.length;
      } catch (err) { /* show the card without a count */ }
      const nearCampus = openHomes.filter((p) => p.tags.includes('< 1 mile from campus')).length;
      return Object.assign({}, e, {
        open,
        days: Math.round((Date.parse(e.arrival) - Date.parse(today)) / 86400000),
        sleepsMax: openHomes.reduce((m, p) => Math.max(m, p.maxGuests || 0), 0),
        bigGroups: openHomes.filter((p) => (p.maxGuests || 0) >= 12).length,
        nearCampus,
        photos: openHomes.filter((p) => p.photos && p.photos.length).slice(0, 3).map((p) => ({ url: p.photos[0], title: p.title })),
      });
    }));
    return html(renderBigDates(s, { events, groups: EVENT_GROUPS, total: props.length }));
  }
  const colMatch = path.match(/^\/listings\/([\w-]+)$/);
  if ((path === '/s' || colMatch) && request.method === 'GET') {
    const q = searchParams(url);
    const slug = colMatch ? colMatch[1] : url.searchParams.get('collection');
    q.collection = slug ? COLLECTIONS.find((c) => c.slug === slug) || null : null;
    if (colMatch && !q.collection) return html(renderNotFound(s), 404);
    const [props, snap] = await Promise.all([getProperties(env, ctx), readSnapshot(env)]);
    let homes = withSnapshot(props, snap);
    let notice = '';
    q.searched = false;
    if (q.arrival || q.departure) {
      if (validStay(q.arrival, q.departure)) {
        try {
          const open = new Set(await searchAvailable(env, ctx, q.arrival, q.departure));
          homes = homes.filter((p) => open.has(p.id));
          q.searched = true;
        } catch (e) {
          notice = friendlyError(e) + ' Showing all homes instead.';
        }
      } else {
        notice = 'Choose a checkout date after your check-in date.';
      }
    }
    if (q.guests) homes = homes.filter((p) => !p.maxGuests || p.maxGuests >= q.guests);
    if (q.pets) homes = homes.filter((p) => p.maxPets >= q.pets);
    if (q.bedrooms) homes = homes.filter((p) => p.bedrooms >= q.bedrooms);
    // With dates, prices load in the browser, so search.js sorts by price there.
    if (!q.searched || !q.sort.startsWith('price')) homes = sortHomes(homes, q.sort);
    return html(renderSearch(s, { props: homes, q, notice }));
  }

  if (path === '/reviews' && request.method === 'GET') {
    const [props, snap] = await Promise.all([getProperties(env, ctx), readSnapshot(env)]);
    const names = Object.fromEntries(props.map((p) => [p.id, p.title]));
    const list = ((snap && snap.reviews) || []).filter((r) => names[r.propertyId]).map((r) => Object.assign({}, r, { property: names[r.propertyId] }));
    return html(renderReviews(s, { rating: siteRating(props, snap), reviews: list }));
  }

  if (path === '/sitemap' && request.method === 'GET') {
    return html(renderSitemap(s, { props: await getProperties(env, ctx) }));
  }

  // Property page: /property/:id or /property/:id/any-slug
  const m = path.match(/^\/property\/(\d+)(?:\/[\w-]*)?$/);
  if (m && request.method === 'GET') {
    const id = int(m[1], 0);
    const props = await getProperties(env, ctx);
    const prop = props.find((p) => p.id === id);
    if (!prop) return html(renderNotFound(s), 404);
    const [listing, reviews] = await Promise.all([getListing(env, ctx, id), getPropertyReviews(env, ctx, id)]);
    const arrival = url.searchParams.get('checkin');
    const departure = url.searchParams.get('checkout');
    const stay = validStay(arrival, departure) ? { arrival, departure } : { arrival: null, departure: null };
    const guests = Math.min(prop.maxGuests || 16, Math.max(1, int(url.searchParams.get('guests'), 1)));
    const pets = Math.min(prop.maxPets || 0, Math.max(0, int(url.searchParams.get('pets'), 0)));
    return html(renderProperty(s, { prop, listing, reviews, stay, guests, pets }));
  }

  if (path === '/api/calendar' && request.method === 'GET') {
    const id = int(url.searchParams.get('id'), 0);
    const props = await getProperties(env, ctx);
    if (!props.some((p) => p.id === id)) return json({ error: 'Unknown property.' }, 404);
    const from = todayISO();
    const to = addDays(from, 365);
    try {
      return json(await getCalendar(env, ctx, id, from, to));
    } catch (e) {
      return json({ error: friendlyError(e) }, 502);
    }
  }

  if (path === '/api/quote' && request.method === 'GET') {
    const id = int(url.searchParams.get('id'), 0);
    const arrival = url.searchParams.get('arrival');
    const departure = url.searchParams.get('departure');
    const adults = int(url.searchParams.get('adults'), 1);
    const children = Math.max(0, int(url.searchParams.get('children'), 0));
    const pets = Math.max(0, int(url.searchParams.get('pets'), 0));
    if (!validStay(arrival, departure)) return json({ error: 'Choose valid dates.' }, 400);
    const props = await getProperties(env, ctx);
    const prop = props.find((p) => p.id === id);
    if (!prop) return json({ error: 'Unknown property.' }, 404);
    if (adults < 1 || (prop.maxGuests && adults + children > prop.maxGuests)) {
      return json({ error: 'This home sleeps up to ' + prop.maxGuests + ' guests.' }, 400);
    }
    if (pets > (prop.maxPets || 0)) return json({ error: prop.maxPets ? 'This home allows up to ' + prop.maxPets + ' pets.' : 'This home does not allow pets.' }, 400);
    try {
      return json(await getQuote(env, ctx, { id, arrival, departure, adults, children, pets }));
    } catch (e) {
      return json({ error: friendlyError(e) }, e instanceof OrError && e.status === 400 ? 400 : 502);
    }
  }

  if (path === '/api/book' && request.method === 'POST') {
    return handleBook(env, ctx, request, url);
  }

  return html(renderNotFound(s), 404);
}

export default {
  async fetch(request, env, ctx) {
    try {
      return await route(request, env, ctx);
    } catch (e) {
      console.error(e && e.stack ? e.stack : e);
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/')) return json({ error: friendlyError(e) }, 502);
      return html(renderError(site(env, url), 'We hit a snag', friendlyError(e)), 502);
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(refreshSnapshot(env).catch((e) => console.error('snapshot', e && e.stack ? e.stack : e)));
  },
};
