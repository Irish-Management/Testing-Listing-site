// Irish Management direct booking site
// Runs as a Cloudflare Worker. All OwnerRez calls happen here on the server,
// so the API token is never sent to guests' browsers.

import { renderHome, renderProperty, renderThanks, renderNotFound, renderError } from './pages.js';

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

function publicProperty(p) {
  // Only fields safe to show the public. Never pass owner, key, or address line details.
  return {
    id: p.id,
    title: p.external_name || p.name,
    bedrooms: p.bedrooms || 0,
    bathrooms: p.bathrooms || 0,
    maxGuests: p.max_guests || 0,
    maxPets: p.max_pets || 0,
    city: (p.address && p.address.city) || '',
    state: (p.address && p.address.state) || '',
    photo: p.thumbnail_url_large || p.thumbnail_url_medium || p.thumbnail_url || '',
    checkIn: p.check_in || '',
    checkOut: p.check_out || '',
    livingArea: p.living_area || 0,
    livingAreaType: p.living_area_type || '',
    // Rounded so the map shows the neighborhood, not the exact house.
    lat: typeof p.latitude === 'number' ? Math.round(p.latitude * 100) / 100 : null,
    lng: typeof p.longitude === 'number' ? Math.round(p.longitude * 100) / 100 : null,
    order: p.external_display_order != null ? p.external_display_order : (p.display_order != null ? p.display_order : 9999),
  };
}

async function getProperties(env, ctx) {
  return cached(ctx, 'properties:v1', 900, async () => {
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

    return all
      .filter((p) => p.active && !p.is_snoozed && (p.bedrooms || 0) > 0)
      .filter((p) => {
        const names = ((p.name || '') + ' ' + (p.external_name || '')).toLowerCase();
        return !excludes.some((x) => names.includes(x));
      })
      .filter((p) => !requiredTag || (p.tags || []).some((t) => String(t).toLowerCase() === requiredTag))
      .map(publicProperty)
      .sort((a, b) => (a.order - b.order) || a.title.localeCompare(b.title));
  });
}

async function getListing(env, ctx, id) {
  return cached(ctx, 'listing:v2:' + id, 1800, async () => {
    try {
      const l = await or(env, '/v2/listings/' + id, { query: { descriptionFormat: 'text' } });
      const d = l.descriptions || {};
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
        // "text" is the amenity name; "title" is an optional host note
        // (for example "Exterior Ring camera at front door"), so it never replaces the name.
        amenities: (l.amenity_categories || [])
          .map((c) => ({ caption: decodeEntities(c.caption || c.type || ''), items: (c.amenities || []).map((a) => decodeEntities(a.text || a.title)).filter(Boolean) }))
          .filter((c) => c.items.length),
        callouts: (l.amenity_call_outs || []).map((a) => decodeEntities(a.text || a.title)).filter(Boolean),
        rooms: (l.rooms || [])
          .filter((r) => r.type === 'bedroom' || r.type === 'studio')
          .map((r) => ({ name: r.name || 'Bedroom', description: r.description || '', beds: r.total_beds || 0 })),
        reviewAverage: l.review_average || 0,
        reviewCount: l.review_count || 0,
        sleepsMax: l.sleeps_max || l.occupancy_max || 0,
        cancellationPolicy: decodeEntities(l.cancellation_policy),
        nightlyMin: l.nightly_rate_min || 0,
      };
    } catch (e) {
      // 402 means the account does not have listing access for this token.
      // The page still works using basic property info and the thumbnail.
      if (e instanceof OrError && [402, 403, 404].includes(e.status)) {
        return { available: false, reason: e.code || String(e.status) };
      }
      throw e;
    }
  });
}

async function getCalendar(env, ctx, id, from, to) {
  return cached(ctx, 'cal:v1:' + id + ':' + from + ':' + to, 300, async () => {
    const c = await or(env, '/v2/calendar/' + id, { query: { from, to } });
    return {
      currency: (c && c.currency_code) || 'USD',
      days: ((c && c.days) || []).map((d) => {
        const r = d.rules || {};
        return {
          date: d.date,
          open: d.status === 'available' && !r.is_stay_disallowed,
          noArrive: !!r.is_arrival_disallowed,
          noDepart: !!r.is_departure_disallowed,
          minNights: r.min_nights || 0,
          rate: d.rate && d.rate.amount != null ? d.rate.amount : null,
        };
      }),
    };
  });
}

const CHARGE_LABELS = { rent: 'Rent', surcharge: 'Fees', tax: 'Taxes', tax_other: 'Taxes', surcharge_other: 'Fees' };

async function getQuote(env, ctx, q) {
  const key = ['quote:v1', q.id, q.arrival, q.departure, q.adults, q.children].join(':');
  return cached(ctx, key, 300, async () => {
    // test: true prices the stay without saving a quote in OwnerRez.
    const r = await or(env, '/v2/quotes', {
      method: 'POST',
      body: {
        property_id: q.id, arrival: q.arrival, departure: q.departure,
        adults: q.adults, children: q.children,
        test: true, generate_charges: true, validate_rules: true,
      },
    });
    const charges = ((r && r.charges) || [])
      .slice()
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .map((c) => ({ description: c.description || CHARGE_LABELS[c.type] || 'Charge', amount: Number(c.amount) || 0, type: c.type }))
      .filter((c) => c.amount !== 0);
    const total = Math.round(charges.reduce((s, c) => s + c.amount, 0) * 100) / 100;
    return { charges, total };
  });
}

async function searchAvailable(env, ctx, arrival, departure) {
  return cached(ctx, 'search:v1:' + arrival + ':' + departure, 300, async () => {
    const ids = [];
    let offset = 0;
    for (let i = 0; i < 10; i++) {
      const r = await or(env, '/v2/propertysearch', {
        query: { available_from: arrival, available_to: addDays(departure, -1), evaluate_rules: true, limit: 100, offset },
      });
      const items = (r && r.items) || [];
      for (const it of items) if (!it.rule_violations || it.rule_violations.length === 0) ids.push(it.id);
      if (items.length < 100) break;
      offset += 100;
    }
    return ids;
  });
}

// ---------- Helpers ----------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function isDate(s) { return typeof s === 'string' && DATE_RE.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z')); }
function addDays(s, n) { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function int(v, def) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : def; }

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
  return {
    name: env.SITE_NAME || 'Irish Management',
    phone: env.CONTACT_PHONE || '',
    email: env.CONTACT_EMAIL || '',
    origin: (env.SITE_URL || url.origin).replace(/\/$/, ''),
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
        arrival: b.arrival, departure: b.departure, adults, children,
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

  if (!env.OWNERREZ_TOKEN) {
    return html(renderError(s, 'Setup needed', 'Add the OWNERREZ_TOKEN secret to finish connecting this site to OwnerRez.'), 500);
  }

  // Home and search
  if (path === '/' && request.method === 'GET') {
    const arrival = url.searchParams.get('checkin') || '';
    const departure = url.searchParams.get('checkout') || '';
    const guests = Math.max(0, int(url.searchParams.get('guests'), 0));
    let props = await getProperties(env, ctx);
    let searched = false;
    let notice = '';
    if (arrival || departure) {
      if (validStay(arrival, departure)) {
        searched = true;
        try {
          const open = new Set(await searchAvailable(env, ctx, arrival, departure));
          props = props.filter((p) => open.has(p.id));
        } catch (e) {
          notice = friendlyError(e) + ' Showing all homes instead.';
          searched = false;
        }
      } else {
        notice = 'Choose a checkout date after your check-in date.';
      }
    }
    if (guests) props = props.filter((p) => !p.maxGuests || p.maxGuests >= guests);
    return html(renderHome(s, { props, arrival, departure, guests, searched, notice }));
  }

  // Property page: /property/:id or /property/:id/any-slug
  const m = path.match(/^\/property\/(\d+)(?:\/[\w-]*)?$/);
  if (m && request.method === 'GET') {
    const id = int(m[1], 0);
    const props = await getProperties(env, ctx);
    const prop = props.find((p) => p.id === id);
    if (!prop) return html(renderNotFound(s), 404);
    const listing = await getListing(env, ctx, id);
    const arrival = url.searchParams.get('checkin');
    const departure = url.searchParams.get('checkout');
    const stay = validStay(arrival, departure) ? { arrival, departure } : { arrival: null, departure: null };
    const guests = Math.min(prop.maxGuests || 16, Math.max(1, int(url.searchParams.get('guests'), 2)));
    return html(renderProperty(s, { prop, listing, stay, guests }));
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
    if (!validStay(arrival, departure)) return json({ error: 'Choose valid dates.' }, 400);
    const props = await getProperties(env, ctx);
    const prop = props.find((p) => p.id === id);
    if (!prop) return json({ error: 'Unknown property.' }, 404);
    if (adults < 1 || (prop.maxGuests && adults + children > prop.maxGuests)) {
      return json({ error: 'This home sleeps up to ' + prop.maxGuests + ' guests.' }, 400);
    }
    try {
      return json(await getQuote(env, ctx, { id, arrival, departure, adults, children }));
    } catch (e) {
      return json({ error: friendlyError(e) }, e instanceof OrError && e.status === 400 ? 400 : 502);
    }
  }

  if (path === '/api/book' && request.method === 'POST') {
    return handleBook(env, ctx, request, url);
  }

  if (path === '/thank-you') return html(renderThanks(s));

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
};
