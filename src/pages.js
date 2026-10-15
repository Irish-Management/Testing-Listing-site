// HTML templates for the direct booking site. Styles live in public/site.css and
// browser scripts in public/*.js; both are served as static assets by the Worker.

const V = '30'; // bump to make browsers fetch new CSS and JS after a deploy

export function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function slug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function shortDate(iso) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function fmtTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return h12 + ':' + String(m || 0).padStart(2, '0') + ' ' + ap;
}

function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
function plural(n, word, many) { return n + ' ' + (n === 1 ? word : (many || word + 's')); }
function json(o) { return JSON.stringify(o).replace(/</g, '\\u003c'); }

function paragraphs(text) {
  return String(text || '').split(/\r?\n\s*\r?\n/).map((p) => p.trim()).filter(Boolean)
    .map((p) => '<p>' + esc(p).replace(/\r?\n/g, '<br>') + '</p>').join('');
}

// Amenity filter chips on the all-homes page: [code, label, matches, unless].
export const AMENITY_FILTERS = [
  ['parking', 'Free parking', /free parking|driveway|garage parking/i],
  ['workspace', 'Dedicated workspace', /workspace|desk/i],
  ['wheelchair', 'Wheelchair accessible', /wheelchair/i, /inaccessible|not accessible|not wheelchair/i],
  ['fireplace', 'Fireplace', /fireplace/i],
  ['firepit', 'Fire pit', /fire ?pit/i],
  ['garage', 'Garage', /garage/i],
  ['hottub', 'Hot tub', /hot ?tub|jacuzzi/i],
  ['pool', 'Pool', /pool/i, /pool table|billiard/i],
  ['gameroom', 'Game room', /game room|pool table|billiard|ping ?pong|foosball|arcade|air hockey/i],
  ['console', 'Game console', /game console|playstation|xbox|nintendo/i],
  ['grill', 'Grill', /grill|bbq|barbecue/i],
  ['washer', 'Washer & dryer', /washer|washing machine|laundry/i],
  ['ev', 'EV charger', /ev charg|electric vehicle/i],
  ['balcony', 'Balcony', /balcony/i],
  ['sauna', 'Sauna', /sauna/i],
  ['elevator', 'Elevator', /elevator/i],
  ['kayaks', 'Kayaks', /kayak/i],
];

// Tag-driven collections, a quick filter on the all-homes page. /listings/<slug> (the
// stayirish.com addresses) opens that page with the collection selected.
export const COLLECTIONS = [
  { slug: 'unique', tag: 'The Unique Collection', name: 'The Unique Collection',
    description: 'Explore our unique collection of homes with Irish Management. Discover one-of-a-kind properties that offer distinctive charm and special features for any stay.',
    // Optional page header: script title image, lead line, blurb, and photo.
    intro: {
      script: '/img/unique-script.png', photo: '/img/unique-collection.jpg', photoAlt: 'Timber-framed bar with stained glass windows',
      lead: 'Explore Our <em>Unique Collection</em>',
      text: 'Welcome to a curated showcase of Irish Management’s most distinctive properties. Our <em>Unique Collection</em> features signature homes that stand out for their exceptional character, design, and locations. Each property in this collection is carefully selected to offer an unforgettable experience that combines luxury, comfort, and a touch of the extraordinary. From historical landmarks to modern architectural marvels, discover the perfect backdrop for your next getaway. Immerse yourself in elegance and exclusivity with our <em>Unique Collection</em>, where every stay is a journey beyond the ordinary.',
    } },
  { slug: 'large-groups', tag: 'Large Groups', name: 'Large Groups',
    description: 'Discover your ideal group getaway with Irish Management! Our large vacation homes feature spacious living areas, multiple bedrooms, and fully-equipped kitchens, perfect for families, friends, or corporate retreats.' },
  { slug: 'walking-campus', tag: '< 1 Mile from Campus', name: 'Homes <1 Mile from Campus',
    description: 'Find homes within walking distance to Notre Dame with Irish Management. Enjoy convenient access to campus and local attractions from our well-located properties.' },
  { slug: 'small-groups', tag: 'Smaller Groups', name: 'Smaller Groups',
    description: 'Discover cozy homes for smaller groups with Irish Management. Perfect for intimate gatherings, these listings offer comfort and charm for your next getaway.' },
];

// Homes outside the South Bend area, matched by state. Each gets a showcase page at
// /listings/<slug> and a home page feature, and stays out of the South Bend search.
export const DESTINATIONS = [
  {
    slug: 'florida', state: 'FL', name: 'Florida Getaway', eyebrow: 'Beyond South Bend',
    title: 'Trade game day for beach days',
    intro: 'Our Gulf Coast condo at Isla del Sol in St. Petersburg, Florida has 2 bedrooms, 2 baths, beach access, and a pool. Booked direct with the same local team.',
  },
];

// Collection slugs a home belongs to, from its OwnerRez tags.
function collectionsOf(p) {
  return COLLECTIONS.filter((c) => (p.tags || []).includes(c.tag.toLowerCase())).map((c) => c.slug);
}

// ---------- Icons ----------

const svg = (d, size = 20, sw = 1.6) => '<svg aria-hidden="true" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';

export const ICON = {
  search: svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', 18, 1.8),
  menu: svg('<path d="M4 7h16M4 12h16M4 17h16"/>', 18, 1.8),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>', 18, 1.8),
  left: svg('<path d="m15 18-6-6 6-6"/>', 18, 1.8),
  right: svg('<path d="m9 18 6-6-6-6"/>', 18, 1.8),
  down: svg('<path d="m6 9 6 6 6-6"/>', 18, 1.6),
  share: svg('<path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>', 18, 1.6),
  star: '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z"/></svg>',
  dollar: svg('<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .8-3 2s1.2 1.7 3 2 3 .8 3 2-1.3 2-3 2c-1.5 0-2.6-.6-3-1.6M12 6.5v11"/>', 24, 1.6),
  phone: svg('<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>', 24, 1.6),
  users: svg('<circle cx="9" cy="8" r="3.2"/><circle cx="16.5" cy="8" r="3.2"/><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5H3z"/><path d="M15 14.2c.5-.1 1-.2 1.5-.2 3.3 0 5.5 2 5.5 5h-5"/>', 24, 1.6),
  starLine: svg('<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z"/>', 24, 1.6),
  headset: svg('<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="13" width="3.5" height="5.5" rx="1.5"/><rect x="17.5" y="13" width="3.5" height="5.5" rx="1.5"/><path d="M19 18.5c0 1.5-1.5 2.5-4 2.5h-1.5"/><path d="m10 12 1.5 1.5L14.5 10"/>', 24, 1.6),
  homeLg: svg('<path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/>', 24, 1.6),
  home: svg('<path d="M4 11 12 4l8 7v9H4z"/><path d="M10 20v-5h4v5"/>', 22, 1.6),
  note: svg('<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M8 9h8M8 13h5M14 20v-3a2 2 0 0 1 2-2h4"/>', 22, 1.6),
  badge: svg('<path d="M12 3l2.3 1.6 2.8-.2.9 2.7 2.3 1.6-.9 2.6.9 2.6-2.3 1.6-.9 2.7-2.8-.2L12 21l-2.3-1.6-2.8.2-.9-2.7-2.3-1.6.9-2.6-.9-2.6L6 6.5l.9-2.7 2.8.2z"/><path d="m9 12 2 2 4-4"/>', 22, 1.6),
  phoneSm: svg('<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>', 16, 1.6),
  mail: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>', 16, 1.6),
  tag: svg('<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.5"/>', 18, 1.6),
  sliders: svg('<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>', 18, 1.6),
  bed: svg('<path d="M3 19V7"/><path d="M3 14h18v5"/><path d="M21 14v-2.5A2.5 2.5 0 0 0 18.5 9H11v5"/><circle cx="7" cy="11.5" r="1.8"/>', 30, 1.5),
  grid: svg('<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>', 16, 1.6),
};

const AMENITY_ICONS = [
  [/wifi|internet/i, '<path d="M2 9a15 15 0 0 1 20 0"/><path d="M5 12.5a10 10 0 0 1 14 0"/><path d="M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19.5" r=".8"/>'],
  [/parking|garage|driveway/i, '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M10 17V7h3a3 3 0 0 1 0 6h-3"/>'],
  [/tv|television/i, '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8"/>'],
  [/fridge|refrigerator|freezer/i, '<rect x="6" y="3" width="12" height="18" rx="2"/><path d="M6 10h12M9 6v2M9 13v3"/>'],
  [/kitchen|stove|oven|cook|microwave|toaster|pots/i, '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16"/><circle cx="8" cy="6.5" r=".6"/><circle cx="12" cy="6.5" r=".6"/><rect x="7" y="12" width="10" height="5" rx="1"/>'],
  [/dish|utensil|wine|glass/i, '<path d="M7 3v8a2 2 0 0 0 4 0V3M9 3v18M17 3c-1.5 0-3 2-3 6s1.5 5 3 5v7"/>'],
  [/coffee|kettle/i, '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M11 3v3"/>'],
  [/dining|table/i, '<path d="M3 7h18M5 7v13M19 7v13M3 4h18"/>'],
  [/washer|laundry|dryer/i, '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 6h2"/>'],
  [/air condition|a\/c|\bac\b|fan/i, '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/>'],
  [/heat|fireplace|fire pit/i, '<path d="M12 21c-4 0-6-2.7-6-6 0-4 4-6 4-11 2 2 3.5 3.5 4 6 1-1 1.5-2 1.5-3 2 2 2.5 4.5 2.5 8 0 3.3-2 6-6 6z"/>'],
  [/linen|towel|bath|shower|hair|shampoo|soap/i, '<path d="M8 4h8l1 4-2 1v11H9V9L7 8z"/>'],
  [/patio|deck|porch|balcony|outdoor/i, '<path d="M3 20h18M5 20v-7h14v7M4 13l8-6 8 6"/>'],
  [/garden|yard|backyard|lawn|grill|bbq/i, '<path d="M12 21v-8"/><path d="M12 13c-4 0-6-3-6-7 4 0 6 3 6 7z"/><path d="M12 11c0-4 2-6 6-6 0 4-2 6-6 6z"/>'],
  [/pool|hot tub|spa/i, '<path d="M3 17c2 0 2-1.5 4.5-1.5S9.5 17 12 17s2.5-1.5 4.5-1.5S19 17 21 17M3 21c2 0 2-1.5 4.5-1.5S9.5 21 12 21s2.5-1.5 4.5-1.5S19 21 21 21M8 14V5a2 2 0 0 1 4 0M16 14V5a2 2 0 0 0-4 0"/>'],
  [/crib|pack n play|high chair|child|baby/i, '<rect x="4" y="8" width="16" height="10" rx="1"/><path d="M8 8v10M12 8v10M16 8v10M4 21v-3M20 21v-3"/>'],
  [/desk|workspace|laptop/i, '<rect x="4" y="5" width="16" height="10" rx="1.5"/><path d="M2 19h20"/>'],
  [/game|board|ping|pool table|foosball/i, '<rect x="3" y="7" width="18" height="11" rx="4"/><path d="M8 11v3M6.5 12.5h3"/><circle cx="16" cy="11.5" r=".8"/><circle cx="17.5" cy="13.5" r=".8"/>'],
  [/smoke|carbon|extinguisher|first aid|safety/i, '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/>'],
  [/ev charg/i, '<path d="M13 3 6 13h5l-1 8 7-10h-5z"/>'],
  [/pet/i, '<circle cx="6" cy="10" r="1.8"/><circle cx="10" cy="6" r="1.8"/><circle cx="14" cy="6" r="1.8"/><circle cx="18" cy="10" r="1.8"/><path d="M12 12c-3 0-5 3.5-5 6 0 1.5 1.5 2 3 1.5 1.2-.4 2.8-.4 4 0 1.5.5 3 0 3-1.5 0-2.5-2-6-5-6z"/>'],
];

function amenityIcon(name) {
  for (const [re, d] of AMENITY_ICONS) if (re.test(name)) return svg(d, 22, 1.5);
  return svg('<path d="m5 12 4.5 4.5L19 7"/>', 22, 1.5);
}

function stars(n, size) {
  const s = ICON.star.replace(/width="14" height="14"/, 'width="' + (size || 14) + '" height="' + (size || 14) + '"');
  return '<span class="stars" aria-label="' + esc(n) + ' out of 5 stars">' + s.repeat(Math.max(0, Math.min(5, Math.round(n)))) + '</span>';
}

// ---------- Layout ----------

function abs(site, u) { return !u ? '' : /^https?:/.test(u) ? u : site.origin + u; }

// Sitewide business details for search engines and AI assistants (schema.org).
function orgSchema(site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': site.origin + '/#business',
    name: site.name,
    url: site.origin + '/',
    logo: site.origin + '/img/logo.png',
    image: site.origin + '/img/hero.jpg',
    description: 'Irish Management offers vacation rentals near the University of Notre Dame in South Bend, Indiana, for football weekends, graduation, family visits, and longer stays, booked direct with the local team.',
    telephone: site.phone || undefined,
    email: site.email || undefined,
    address: { '@type': 'PostalAddress', streetAddress: '1539 N Ironwood Dr', addressLocality: 'South Bend', addressRegion: 'IN', postalCode: '46635', addressCountry: 'US' },
    areaServed: ['South Bend, IN', 'Notre Dame, IN', 'Mishawaka, IN', 'Niles, MI'],
    sameAs: [site.instagram, site.facebook].filter(Boolean),
  };
}

function layout(site, title, body, opts = {}) {
  const desc = opts.description || 'Notre Dame vacation rentals, booked direct with Irish Management. Stay minutes from campus and Notre Dame Stadium and skip the extra fees.';
  const canonical = opts.canonical ? site.origin + opts.canonical : '';
  const noindex = !site.indexable || opts.noindex;
  const image = abs(site, opts.image || '/img/hero.jpg');
  const schemas = [orgSchema(site)].concat(opts.schema || []);
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + esc(title) + '</title>' +
    '<meta name="description" content="' + esc(desc) + '">' +
    (canonical ? '<link rel="canonical" href="' + esc(canonical) + '">' : '') +
    (noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large">') +
    '<meta property="og:type" content="' + (opts.ogType || 'website') + '"><meta property="og:site_name" content="' + esc(site.name) + '">' +
    '<meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '">' +
    (canonical ? '<meta property="og:url" content="' + esc(canonical) + '">' : '') +
    '<meta property="og:image" content="' + esc(image) + '">' +
    '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="' + esc(title) + '"><meta name="twitter:description" content="' + esc(desc) + '"><meta name="twitter:image" content="' + esc(image) + '">' +
    schemas.map((x) => '<script type="application/ld+json">' + json(x) + '</script>').join('') +
    '<link rel="icon" href="/img/favicon.png">' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;600&display=swap">' +
    (opts.map ? '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css">' : '') +
    '<link rel="stylesheet" href="/site.css?v=' + V + '">' +
    '</head><body class="' + (opts.bodyClass || '') + '">' +
    '<a class="skip" href="#main">Skip to content</a>' +
    (opts.textBar && site.sms ? '<div class="textbar"><a href="sms:' + esc(site.sms) + '">Have questions? Text us</a></div>' : '') +
    header(site, opts) +
    '<main id="main">' + body + '</main>' + footer(site) +
    '<script type="application/json" id="site-boot">' + json({ leadDays: site.leadDays }) + '</script>' +
    (opts.map ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>' : '') +
    (opts.cluster ? '<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.js"></script>' : '') +
    '<script src="/app.js?v=' + V + '"></script>' +
    (opts.script ? '<script src="/' + opts.script + '.js?v=' + V + '"></script>' : '') +
    '</body></html>';
}

function searchPill(q, extraClass) {
  q = q || {};
  const when = q.arrival && q.departure ? rangeLabel(q.arrival, q.departure) : '';
  const who = q.guests ? plural(q.guests, 'guest') + (q.pets ? ', ' + plural(q.pets, 'pet') : '') : '';
  return '<form class="pill ' + (extraClass || '') + '" action="/s" method="get" role="search" data-search>' +
    '<button type="button" class="pill-seg' + (when ? ' set' : '') + '" data-when aria-haspopup="dialog">' + (when ? esc(when) : 'When') + '</button>' +
    '<span class="pill-sep" aria-hidden="true"></span>' +
    '<button type="button" class="pill-seg' + (who ? ' set' : '') + '" data-who aria-haspopup="dialog">' + (who ? esc(who) : 'Who') + '</button>' +
    '<input type="hidden" name="checkin" value="' + esc(q.arrival || '') + '"><input type="hidden" name="checkout" value="' + esc(q.departure || '') + '">' +
    '<input type="hidden" name="guests" value="' + esc(q.guests || '') + '"><input type="hidden" name="pets" value="' + esc(q.pets || '') + '">' +
    (q.bedrooms ? '<input type="hidden" name="bedrooms" value="' + esc(q.bedrooms) + '">' : '') +
    (q.collection ? '<input type="hidden" name="collection" value="' + esc(q.collection.slug) + '">' : '') +
    (q.dest ? '<input type="hidden" name="dest" value="' + esc(q.dest.slug) + '">' : '') +
    '<button type="submit" class="pill-go">Search</button>' +
    '</form>';
}

function rangeLabel(a, b) {
  const da = new Date(a + 'T00:00:00Z'), db = new Date(b + 'T00:00:00Z');
  const sameMonth = da.getUTCMonth() === db.getUTCMonth() && da.getUTCFullYear() === db.getUTCFullYear();
  return shortDate(a) + ' - ' + (sameMonth ? db.getUTCDate() : shortDate(b));
}

function header(site, opts) {
  return '<header class="site-header' + (opts.headerSearch ? ' with-search' : '') + '"><div class="hwrap">' +
    '<a class="logo" href="/" aria-label="' + esc(site.name) + ' home"><img src="/img/logo.png" alt="' + esc(site.name) + '" width="36" height="36"></a>' +
    (opts.headerSearch ? '<div class="hsearch">' + searchPill(opts.q) + (opts.filters ? opts.filters : '') + '</div>' : '') +
    '<div class="menu-wrap"><button type="button" class="iconbtn" data-menu aria-expanded="false" aria-label="Menu">' + ICON.menu + '</button>' +
      '<nav class="menu" aria-label="Main" hidden>' +
        '<a href="/">Home</a><a href="/s">All homes</a>' +
        '<span class="menu-label">Listings</span>' + COLLECTIONS.map((c) => '<a class="sub" href="/listings/' + c.slug + '">' + esc(c.name) + '</a>').join('') + '<a class="sub" href="/listings/big-dates">Big Weekends</a>' + DESTINATIONS.map((d) => '<a class="sub" href="/listings/' + d.slug + '">' + esc(d.name) + '</a>').join('') +
        '<span class="menu-sep" aria-hidden="true"></span><a href="/reviews">Guest reviews</a>' +
        (site.sms ? '<a href="sms:' + esc(site.sms) + '">Text us</a>' : '') +
        (site.email ? '<a href="mailto:' + esc(site.email) + '">Email us</a>' : '') +
      '</nav></div>' +
    '</div></header>';
}

function footer(site) {
  const contact = (site.phone || site.email)
    ? '<div class="contactbar"><div class="fwrap"><strong>Contact Us</strong>' +
      (site.phone ? '<a href="tel:' + esc(site.sms) + '">' + ICON.phoneSm + esc(site.phone) + '</a>' : '') +
      (site.email ? '<a href="mailto:' + esc(site.email) + '">' + ICON.mail + esc(site.email) + '</a>' : '') +
      '</div></div>'
    : '';
  const social = [
    site.instagram ? '<a href="' + esc(site.instagram) + '" rel="noopener" target="_blank">Instagram</a>' : '',
    site.facebook ? '<a href="' + esc(site.facebook) + '" rel="noopener" target="_blank">Facebook</a>' : '',
  ].filter(Boolean).join('');
  return '<footer class="site-footer">' + contact +
    '<div class="fwrap fgrid"><div><img src="/img/logo.png" alt="' + esc(site.name) + '" width="32" height="32"></div>' +
      '<div class="fcols"><div><h2>Listings</h2><a href="/s">All homes</a>' + COLLECTIONS.map((c) => '<a href="/listings/' + c.slug + '">' + esc(c.name) + '</a>').join('') + '<a href="/listings/big-dates">Big Weekends</a>' + DESTINATIONS.map((d) => '<a href="/listings/' + d.slug + '">' + esc(d.name) + '</a>').join('') + '</div>' +
      (social ? '<div><h2>Social</h2>' + social + '</div>' : '') + '</div></div>' +
    '<div class="fbottom"><div class="fwrap"><span>&copy; ' + new Date().getUTCFullYear() + ' ' + esc(site.name) + '</span>' +
      '<nav aria-label="Legal"><a href="/terms">Terms of Service</a><span aria-hidden="true">&middot;</span><a href="/privacy-policy">Privacy Policy</a><span aria-hidden="true">&middot;</span><a href="/sitemap">Sitemap</a></nav></div></div>' +
    '</footer>';
}

// ---------- Shared pieces ----------

// Canonical path of a home's page.
export function homePath(p) { return '/property/' + p.id + '/' + slug(p.title); }

function propHref(p, q) {
  const params = new URLSearchParams();
  if (q && q.arrival && q.departure) { params.set('checkin', q.arrival); params.set('checkout', q.departure); }
  if (q && q.guests) params.set('guests', String(q.guests));
  if (q && q.pets) params.set('pets', String(q.pets));
  const qs = params.toString();
  return '/property/' + p.id + '/' + slug(p.title) + (qs ? '?' + qs : '');
}

function rating(p) {
  return p.reviews ? '<span class="rating">' + ICON.star + ' ' + p.rating.toFixed(2) + ' (' + p.reviews + ')</span>' : '';
}

function priceLine(p, q) {
  if (q && q.searched) {
    const n = Math.round((Date.parse(q.departure) - Date.parse(q.arrival)) / 86400000);
    return '<p class="card-price" data-quote="' + p.id + '" data-arrival="' + esc(q.arrival) + '" data-departure="' + esc(q.departure) + '" data-guests="' + esc(q.guests || 1) + '" data-pets="' + esc(q.pets || 0) + '">' +
      '<b class="ph">&nbsp;</b> for ' + plural(n, 'night') + '<span class="sep">&middot;</span>' + esc(shortDate(q.arrival) + ' – ' + shortDate(q.departure)) + '</p>';
  }
  if (!p.stay) return '';
  return '<p class="card-price"><b>' + money(p.stay.price) + '</b> for ' + plural(p.stay.nights, 'night') + '<span class="sep">&middot;</span>' + esc(shortDate(p.stay.arrival) + ' – ' + shortDate(p.stay.departure)) + '</p>';
}

function card(p, q, eager) {
  const photos = (p.photos || []).slice(0, 5);
  const nightly = !(q && q.searched) && p.stay ? (p.stay.price / p.stay.nights).toFixed(2) : '';
  const cols = collectionsOf(p);
  const hide = q && q.collection && !cols.includes(q.collection.slug);
  return '<a class="card' + (hide ? ' filtered' : '') + '" href="' + esc(propHref(p, q)) + '" data-cols="' + cols.join(' ') + '" data-id="' + p.id + '" data-price="' + nightly + '" data-beds="' + p.bedrooms + '" data-rating="' + (p.rating || 0) + '" data-reviews="' + (p.reviews || 0) + '" data-baths="' + (p.bathrooms || 0) + '" data-pets="' + (p.maxPets || 0) + '" data-amen="' + esc((p.amen || []).join(' ')) + '">' +
    '<div class="card-photos" data-carousel>' +
      '<div class="track">' + photos.map((u, i) => '<img src="' + esc(u) + '" alt="' + (i ? '' : esc(p.title)) + '"' + (eager && !i ? '' : ' loading="lazy"') + ' decoding="async">').join('') + '</div>' +
      (photos.length > 1
        ? '<button type="button" class="car-btn prev" aria-label="Previous photo" tabindex="-1">' + ICON.left + '</button><button type="button" class="car-btn next" aria-label="Next photo" tabindex="-1">' + ICON.right + '</button>' +
          '<div class="dots" aria-hidden="true">' + photos.map((_, i) => '<span' + (i ? '' : ' class="on"') + '></span>').join('') + '</div>'
        : '') +
    '</div>' +
    '<div class="card-body"><div class="card-top"><p class="card-title">' + esc(p.title) + '</p>' + rating(p) + '</div>' +
      '<p class="muted">' + esc([p.city, p.state].filter(Boolean).join(', ')) + '</p>' +
      '<p class="muted">' + plural(p.bedrooms, 'bedroom') + '<span class="sep">&middot;</span>' + plural(p.bathrooms, 'bath', 'baths') + '</p>' +
      priceLine(p, q) +
    '</div></a>';
}

// Home page "book direct" section: what sets Irish Management apart.
const UNIQUES = [
  ['starLine', 'Proven Local Experience', 'With 3,000+ successful stays completed, our experienced and hands-on South Bend team knows exactly what it takes to deliver a smooth, well-executed stay for your entire group.'],
  ['headset', '24/7 Proactive Support', 'From the moment you book to the day you check out, our local team is available 24/7/365 to provide responsive, proactive communication and ensure everything runs seamlessly.'],
  ['homeLg', 'Premium Homes', 'We offer the largest collection of spacious, centrally located homes in the South Bend region, designed with modern amenities and room for your group to stay together comfortably.'],
];

const PROMISES = [
  ['dollar', 'Lower prices, every time', 'Pay less than you would anywhere else. No middlemen or platform fees.'],
  ['phone', 'Direct line, real care', 'Book with the team that actually runs the property. Faster answers, better service, real accountability.'],
  ['users', 'Not just a transaction', 'We go further for direct guests. We’re building a relationship, not closing a booking.'],
];

function reviewCard(r) {
  return '<article class="rcard"><div><p class="rquote clamp4">“' + esc(r.text) + '”</p><button type="button" class="readmore" hidden>Read more</button></div>' +
    '<div class="rmeta">' + stars(r.stars || 5) + '<h3>' + esc(r.name) + '</h3><p>Stayed in ' + esc(r.when) + '</p></div></article>';
}

// ---------- Pages ----------

// FAQ shown on the home page and given to search engines and AI assistants as FAQPage data.
// Numbers come from the live OwnerRez data, so answers stay accurate as homes change.
function homeFaq(site, f) {
  const contact = [site.phone ? 'call or text ' + site.phone : '', site.email ? 'email ' + site.email : ''].filter(Boolean).join(', or ');
  return [
    ['How close are your homes to Notre Dame?', 'We manage ' + f.total + ' homes around South Bend, and ' + f.nearCampus + ' of them are within a mile of campus and Notre Dame Stadium. Most of the rest are a short drive away. Open Filters on the all homes page and choose Homes <1 Mile from Campus to see the closest.'],
    ['Do you have homes for large groups?', 'Yes. ' + f.bigGroups + ' of our homes sleep 12 or more guests, and the largest sleeps up to ' + f.maxSleeps + '. They are a good fit for football weekends, graduation, reunions, and team trips.'],
    ['Can I book a Notre Dame football weekend or graduation weekend?', 'Yes. Our Big Weekends page lists upcoming home football games and graduation weekend, with how many homes are still open for each. Big weekends tend to fill early, so it is worth booking ahead.'],
    ['Are pets allowed?', f.petHomes ? f.petHomes + ' of our homes welcome pets. Turn on Pets allowed in Filters to see them. Pet fees may apply and are shown before you pay.' : 'Pet policies vary by home and are listed on each home\u2019s page.'],
    ['Why book direct instead of Airbnb or Vrbo?', 'When you book here you book with the local team that manages the home, and you skip the guest service fees that booking sites add. Questions go straight to our South Bend team.'],
    ['What is included in the price?', 'The price shown on each home is rent and fees before taxes. State and local lodging taxes are added at checkout, and you see the full total before you pay.'],
    ['How do check-in and check-out work?', 'Check-in and check-out times are listed on each home\u2019s page. After you book we send check-in details before you arrive.'],
    ['What is the cancellation policy?', 'It varies by home. Each home\u2019s page and the checkout page show the cancellation policy for your dates.'],
    ['How do I contact Irish Management?', 'Our team offers 24/7 guest support. ' + (contact ? 'You can ' + contact + '.' : '')],
  ];
}

export function renderHome(site, d) {
  const r = d.rating;
  const body =
    '<section class="hero"><div class="hero-media"><img src="/img/hero.jpg" alt="" fetchpriority="high"></div>' +
      '<div class="hero-copy"><h1>Notre Dame Vacation Rentals, Booked Direct</h1>' +
      '<p>From cozy condos to game-day estates, stay minutes from campus and Notre Dame Stadium. Book direct with Irish Management and skip the extra fees.</p>' +
      searchPill({}) + '</div></section>' +
    '<section class="wrap props"><h2 class="eyebrow-h">Our Properties</h2><div class="grid4">' + d.props.map((p, i) => card(p, null, i < 4)).join('') + '</div>' +
      '<div class="center-btn"><a class="chip" href="/s">See more properties</a></div></section>' +
    '<section class="direct wrap"><h2>Get more when you book direct</h2>' +
      '<p class="direct-sub">Better rates than the booking sites, with a local team behind every stay.</p><div class="direct-grid">' +
      UNIQUES.map(([i, t, s]) => '<div><span class="ibox">' + ICON[i] + '</span><h3>' + t + '</h3><p>' + s + '</p></div>').join('') + '</div></section>' +
    // Evergreen promo for /listings/big-dates. The "Coming up" line reads src/events.js, so it needs no edits here.
    '<section class="wrap away bw-promo"><a class="away-card" href="/listings/big-dates"><img src="/img/welcome.jpg" alt="" loading="lazy">' +
      '<div><p class="sub">Football, Graduation, and More</p><h2>Big Weekends in South Bend</h2>' +
      '<p class="muted">Game days and graduation book up months ahead. See which homes are still open for every big weekend, and lock in your group’s stay before they’re gone.</p>' +
      ((d.bigWeekends || []).length ? '<p class="bw-next"><strong>Coming up:</strong> ' + d.bigWeekends.map((e) => esc(e.name.replace(/^Notre Dame (vs\. )?/, '')) + ' (' + shortDate(e.date || e.arrival) + ')').join(', ') + '</p>' : '') +
      '<span class="btn-dark big">See Big Weekends</span></div></a></section>' +
    (r.count
      ? '<section class="guests wrap"><p class="sub">What Guests Say</p><h2>Trusted by Travelers</h2>' +
        '<p class="big">' + r.average.toFixed(2) + '</p>' + stars(5, 16) + '<p class="count">' + r.count.toLocaleString('en-US') + ' reviews</p>' +
        (d.reviews.length ? '<div class="rgrid">' + d.reviews.map(reviewCard).join('') + '</div>' : '') +
        '<div class="center-btn"><a class="chip" href="/reviews">Show all ' + r.count.toLocaleString('en-US') + ' reviews</a></div></section>'
      : '') +
    (d.away || []).map(({ dest, homes }) => {
      const h = homes[0];
      const img = h.photos && h.photos[0];
      return '<section class="wrap away"><a class="away-card" href="/listings/' + dest.slug + '">' +
        (img ? '<img src="' + esc(img) + '" alt="' + esc(h.title) + '" loading="lazy">' : '') +
        '<div><p class="sub">' + esc(dest.eyebrow) + '</p><h2>' + esc(dest.title) + '</h2><p class="muted">' + esc(dest.intro) + '</p>' +
        '<span class="btn-dark big">' + (homes.length === 1 ? 'See the ' + esc(dest.name.replace(/ Getaway$/, '')) + ' condo' : 'See ' + homes.length + ' homes') + '</span></div></a></section>';
    }).join('') +
    (d.facts ? '<section class="wrap faq" id="faq"><h2>Frequently asked questions</h2><div class="faq-list">' +
      homeFaq(site, d.facts).map(([q, a]) => '<details><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('') + '</div></section>' : '') +
    '<section class="band cta" style="--bg:url(/img/patio.jpg)"><div class="band-in"><p class="sub">From Our South Bend Team</p><h2>Come Stay in Notre Dame Country</h2><a class="chip" href="/s">Browse Homes</a></div></section>';

  const schema = [{ '@context': 'https://schema.org', '@type': 'WebSite', name: site.name, url: site.origin + '/' }];
  if (d.facts) schema.push({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: homeFaq(site, d.facts).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });
  return layout(site, 'Notre Dame Vacation Rentals | Book Direct - ' + site.name, body, { canonical: '/', schema, bodyClass: 'home', image: '/img/hero.jpg' });
}

export function renderSearch(site, d) {
  const q = d.q;
  const pins = d.props.filter((p) => p.lat != null && p.lng != null).map((p) => ({
    id: p.id, lat: p.lat, lng: p.lng, title: p.title, href: propHref(p, q.searched ? q : null),
    price: q.searched ? null : (p.stay ? money(p.stay.price) : null), photo: (p.photos || [])[0] || '',
    sub: q.searched ? '' : (p.stay ? 'for ' + plural(p.stay.nights, 'night') + ', ' + shortDate(p.stay.arrival) + ' \u2013 ' + shortDate(p.stay.departure) : ''),
  }));
  const have = new Set();
  d.props.forEach((p) => (p.amen || []).forEach((a) => have.add(a)));
  const chips = AMENITY_FILTERS.filter(([code]) => have.has(code));
  const stepper = (k, label) => '<div class="step"><span>' + label + '</span><div class="stepper"><button type="button" data-f="' + k + '" data-d="-1" aria-label="Fewer ' + label.toLowerCase() + '">&minus;</button><span id="f-' + k + '">Any</span><button type="button" data-f="' + k + '" data-d="1" aria-label="More ' + label.toLowerCase() + '">+</button></div></div>';
  const filters = '<div class="filters-wrap"><button type="button" class="filters-btn" id="filters-open" aria-haspopup="dialog">' + ICON.sliders + '<span>Filters</span><span class="fcount" id="fcount" hidden></span></button></div>';
  const filterModal = '<dialog class="modal filters-modal" id="filters" aria-label="Filters"><div class="modal-head"><button type="button" class="iconbtn" data-close aria-label="Close">' + ICON.close + '</button><strong>Filters</strong><span></span></div>' +
    '<div class="modal-body">' +
      (q.dest ? '' : '<section class="fsec"><h3>Collection</h3><div class="chips">' +
        COLLECTIONS.map((c) => '<button type="button" class="fchip" data-col="' + c.slug + '" aria-pressed="false">' + esc(c.name) + '</button>').join('') + '</div></section>') +
      '<section class="fsec"><h3>' + (q.searched ? 'Total price' : 'Price per night') + '</h3>' +
        '<p class="muted small">' + (q.searched ? 'Rent and fees for your dates, before taxes.' : 'Based on each home\u2019s next available stay, before taxes.') + '</p>' +
        '<div class="hist" id="hist" aria-hidden="true"></div>' +
        '<div class="range"><input type="range" id="pmin" aria-label="Minimum price" step="1"><input type="range" id="pmax" aria-label="Maximum price" step="1"></div>' +
        '<div class="minmax"><label>Minimum<span class="money-in">$<input type="number" id="pmin-n" inputmode="numeric" min="0"></span></label><label>Max<span class="money-in">$<input type="number" id="pmax-n" inputmode="numeric" min="0"></span></label></div></section>' +
      (chips.length ? '<section class="fsec"><h3>Amenities</h3><div class="chips">' + chips.map(([code, label]) => '<button type="button" class="fchip" data-amen="' + code + '" aria-pressed="false">' + esc(label) + '</button>').join('') + '</div></section>' : '') +
      '<section class="fsec"><h3>Rooms and beds</h3>' + stepper('beds', 'Bedrooms') + stepper('baths', 'Bathrooms') + '</section>' +
      '<section class="fsec"><h3>Accommodations</h3><label class="toggle"><span>Pets allowed</span><input type="checkbox" id="f-pets" role="switch"><span class="sw" aria-hidden="true"></span></label></section>' +
    '</div><div class="modal-foot"><button type="button" class="linkbtn" id="f-clear">Clear all</button><button type="button" class="btn-dark big" id="f-apply">Show homes</button></div></dialog>';
  const col = q.collection;
  const shownCount = col ? d.props.filter((p) => collectionsOf(p).includes(col.slug)).length : d.props.length;
  // Collection header (trusted copy from COLLECTIONS); search.js hides it if the guest switches collections.
  const ci = col && col.intro;
  const colIntro = ci ? '<header class="col-intro" data-col-intro="' + col.slug + '"><div>' +
      '<h1><img src="' + ci.script + '" alt="' + esc(col.name) + '" width="529" height="144"></h1>' +
      '<p class="lead">' + ci.lead + '</p><p>' + ci.text + '</p></div>' +
      (ci.photo ? '<img class="col-photo" src="' + ci.photo + '" alt="' + esc(ci.photoAlt || '') + '">' : '') + '</header>' : '';
  const body = colIntro +
    '<div class="search-layout"><section class="results" data-collection="' + (col ? col.slug : '') + '">' +
      (d.notice ? '<p class="notice">' + esc(d.notice) + '</p>' : '') +
      (q.dest ? '<div class="dest-intro"><p class="sub">' + esc(q.dest.eyebrow) + '</p><h2>' + esc(q.dest.title) + '</h2><p class="muted">' + esc(q.dest.intro) + '</p></div>' : '') +
      '<div class="results-head"><' + (ci ? 'h2' : 'h1') + ' class="eyebrow-h" id="rcount">' + plural(shownCount, 'property', 'properties') + ' available</' + (ci ? 'h2' : 'h1') + '>' +
      (d.props.length > 1 ? '<label class="sort">Sort by <select id="sort">' +
        [['', 'Recommended'], ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low'], ['bedrooms', 'Most bedrooms'], ['rating', 'Top rated']]
          .map(([v, l]) => '<option value="' + v + '"' + (q.sort === v ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>' : '') + '</div>' +
      (q.searched ? '' : '<p class="muted small sort-note"' + (q.sort && q.sort.startsWith('price') ? '' : ' hidden') + '>Without dates, homes are sorted by price per night for their next available stay.</p>') +
      (d.props.length ? '<div class="grid2">' + d.props.map((p, i) => card(p, q, i < 4)).join('') + '</div>'
        : '<div class="empty"><p>No homes match those dates. Try different dates, or text us and we will help you find a fit.</p><a class="chip" href="/s">Clear search</a></div>') +
    '</section><aside class="mapcol"><div id="map" class="map" aria-label="Map of homes"></div></aside></div>' +
    filterModal +
    '<script type="application/json" id="pins">' + json(pins) + '</script>';
  const path = q.dest ? '/listings/' + q.dest.slug : col ? '/listings/' + col.slug : '/s';
  // Searches with dates or filters are endless variations of the same page; keep them out of search results.
  const filtered = q.searched || q.guests || q.pets || q.bedrooms || q.sort;
  const listed = col ? d.props.filter((p) => collectionsOf(p).includes(col.slug)) : d.props;
  const itemList = filtered ? [] : [{
    '@context': 'https://schema.org', '@type': 'ItemList',
    name: (q.dest ? q.dest.name : col ? col.name : 'Vacation rentals near Notre Dame') + ' | ' + site.name,
    numberOfItems: listed.length,
    itemListElement: listed.slice(0, 100).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: site.origin + propHref(p), name: p.title })),
  }];
  const title = (q.dest ? q.dest.name : col ? col.name : 'All homes') + (q.searched ? ', open ' + rangeLabel(q.arrival, q.departure) : '');
  return layout(site, title + ' | ' + site.name, body,
    { headerSearch: true, q, filters, map: true, script: 'search', bodyClass: 'searchpage', description: q.dest ? q.dest.intro : col ? col.description : 'Browse ' + d.props.length + ' vacation rentals near Notre Dame and South Bend with live availability, prices, and a map. Book direct with Irish Management.',
      canonical: path, noindex: filtered, schema: itemList });
}

// schema.org VacationRental for one home (the format Google documents for vacation rentals).
// Location is the rounded map point and city only; the street address is never published.
function bedDetails(sleep) {
  const beds = {};
  (sleep || []).forEach((r) => String(r.beds || '').split(',').forEach((part) => {
    const m = part.trim().match(/^(\d+)\s+(.+?)s?$/i);
    if (m) { const type = m[2].replace(/\s*beds?$/i, '').trim(); beds[type] = (beds[type] || 0) + Number(m[1]); }
  }));
  return Object.keys(beds).map((type) => ({ '@type': 'BedDetails', numberOfBeds: beds[type], typeOfBed: type.charAt(0).toUpperCase() + type.slice(1) }));
}

function rentalSchema(site, p, l, photos, reviews) {
  const amen = [];
  if (l) l.amenities.forEach((c) => c.items.forEach((i) => { if (!amen.includes(i)) amen.push(i); }));
  const x = {
    '@context': 'https://schema.org',
    '@type': 'VacationRental',
    '@id': site.origin + '/property/' + p.id + '#rental',
    name: p.title,
    identifier: String(p.id),
    url: site.origin + '/property/' + p.id + '/' + slug(p.title),
    description: l ? (l.summary || l.description || '').slice(0, 1000) : undefined,
    image: photos.slice(0, 12).map((ph) => ph.url),
    brand: { '@id': site.origin + '/#business' },
    address: { '@type': 'PostalAddress', addressLocality: p.city, addressRegion: p.state, postalCode: p.zip || undefined, addressCountry: 'US' },
    latitude: p.lat != null ? p.lat : undefined,
    longitude: p.lng != null ? p.lng : undefined,
    checkinTime: p.checkIn ? p.checkIn + ':00' : undefined,
    checkoutTime: p.checkOut ? p.checkOut + ':00' : undefined,
    containsPlace: {
      '@type': 'Accommodation',
      additionalType: 'EntirePlace',
      numberOfBedrooms: p.bedrooms,
      numberOfBathroomsTotal: p.bathrooms,
      occupancy: { '@type': 'QuantitativeValue', value: (l && l.sleepsMax) || p.maxGuests },
      bed: bedDetails(l && l.sleep),
      amenityFeature: amen.slice(0, 60).map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
      petsAllowed: p.maxPets > 0,
    },
  };
  if (l && l.reviewCount) x.aggregateRating = { '@type': 'AggregateRating', ratingValue: Number(l.reviewAverage.toFixed(2)), ratingCount: l.reviewCount, reviewCount: l.reviewCount, bestRating: 5 };
  if (reviews && reviews.length) x.review = reviews.slice(0, 5).map((r) => ({ '@type': 'Review', reviewRating: { '@type': 'Rating', ratingValue: r.stars, bestRating: 5 }, author: { '@type': 'Person', name: r.name }, reviewBody: r.text }));
  return x;
}

export function renderProperty(site, d) {
  const p = d.prop;
  const l = d.listing && d.listing.available ? d.listing : null;
  const photos = l && l.photos.length ? l.photos : (p.photo ? [{ url: p.photo, caption: '' }] : []);
  const location = [p.city, p.state].filter(Boolean).join(', ');
  const sleeps = (l && l.sleepsMax) || p.maxGuests;
  const reviewCount = l ? l.reviewCount : 0;

  const gallery = '<section class="gallery" id="photos" data-count="' + photos.length + '">' +
    [0, 1, 2, 3, 4].map((i) => '<button type="button" class="ph ph' + i + '" data-photo="' + i + '">' + (photos[i] ? '<img src="' + esc(photos[i].url) + '" alt="' + esc(photos[i].caption || (i ? '' : p.title)) + '"' + (i ? ' loading="lazy"' : ' fetchpriority="high"') + '>' : '') + '</button>').join('') +
    (photos.length > 1 ? '<button type="button" class="chip gallery-all" data-photo="0">View all ' + photos.length + ' photos</button>' : '') +
    '</section>';

  const photosDialog = '<dialog class="modal photos-modal" id="photos-modal" aria-label="All photos"><div class="modal-head"><button type="button" class="iconbtn" data-close aria-label="Close">' + ICON.close + '</button><strong>' + esc(p.title) + '</strong><span></span></div>' +
    '<div class="photo-list">' + photos.map((ph, i) => '<figure id="photo-' + i + '"><img src="' + esc(ph.url) + '" alt="' + esc(ph.caption || '') + '" loading="lazy">' + (ph.caption ? '<figcaption>' + esc(ph.caption) + '</figcaption>' : '') + '</figure>').join('') + '</div></dialog>';

  const facts = [plural(p.bedrooms, 'bedroom')];
  if (l && l.beds) facts.push(plural(l.beds, 'bed'));
  facts.push(plural(p.bathrooms, 'bath', 'baths'), plural(sleeps, 'guest'));

  const titleBlock = '<section class="ptitle" id="overview"><div><p class="muted">' + esc(location) + '</p><h1>' + esc(p.title) + '</h1>' +
    '<p class="facts">' + facts.map(esc).join(' <span aria-hidden="true">&middot;</span> ') +
    (reviewCount ? ' <span aria-hidden="true">&middot;</span> <a href="#reviews" class="rlink">' + ICON.star + ' ' + l.reviewAverage.toFixed(2) + ' (' + reviewCount + ')</a>' : '') + '</p></div>' +
    '<button type="button" class="iconbtn share" data-share aria-label="Share">' + ICON.share + '</button></section>';

  const desc = l ? (l.description || l.summary) : '';
  const about = desc
    ? '<section class="psec" id="about"><div class="desc clamp5" id="desc">' + paragraphs(desc) + '</div><button type="button" class="chip" id="desc-more">Read more</button></section>'
    : '';

  const sleepRooms = l && l.sleep ? l.sleep : [];
  const sleep = sleepRooms.length
    ? '<section class="psec" id="sleep"><h2>Where you\u2019ll sleep</h2><div class="sleep">' +
      sleepRooms.map((r) => '<div class="sleep-card">' + ICON.bed + '<strong>' + esc(r.name) + '</strong>' + (r.beds ? '<span>' + esc(r.beds) + '</span>' : '') + '</div>').join('') +
      '</div></section>'
    : '';

  let amenities = '';
  if (l && l.amenities.length) {
    const flat = [];
    l.amenities.forEach((c) => c.items.forEach((i) => { if (!flat.includes(i)) flat.push(i); }));
    const top = flat.slice(0, 8);
    amenities = '<section class="psec" id="amenities"><h2>What this home offers</h2><ul class="amen">' +
      top.map((a) => '<li>' + amenityIcon(a) + '<span>' + esc(a) + '</span></li>').join('') + '</ul>' +
      (flat.length > top.length ? '<button type="button" class="chip" data-open="amen-modal">Show all ' + flat.length + ' amenities</button>' : '') + '</section>' +
      '<dialog class="modal" id="amen-modal" aria-label="Amenities"><div class="modal-head"><button type="button" class="iconbtn" data-close aria-label="Close">' + ICON.close + '</button><strong>What this home offers</strong><span></span></div><div class="modal-body">' +
      l.amenities.map((c) => '<h3>' + esc(c.caption) + '</h3><ul class="amen one">' + c.items.map((a) => '<li>' + amenityIcon(a) + '<span>' + esc(a) + '</span></li>').join('') + '</ul>').join('') +
      '</div></dialog>';
  }

  const reviews = d.reviews || [];
  const reviewItem = (r) => '<article class="review"><div class="rhead"><span class="avatar">' + esc(r.name.charAt(0).toUpperCase()) + '</span><strong>' + esc(r.name) + '</strong></div>' +
    '<p class="rsub">' + stars(r.stars, 11) + ' <span aria-hidden="true">&middot;</span> ' + esc(r.when) + '</p><p class="rtext">' + esc(r.text) + '</p></article>';
  const reviewsBlock = reviewCount || reviews.length
    ? '<section class="psec" id="reviews"><h2>What our guests say</h2>' +
      (reviewCount ? '<div class="rsum"><p>' + l.reviewAverage.toFixed(2) + ' ' + ICON.star.replace(/14/g, '22') + '</p><p class="muted b">' + plural(reviewCount, 'review') + '</p></div>' : '') +
      reviews.slice(0, 3).map(reviewItem).join('') +
      (reviews.length > 3 ? '<button type="button" class="chip" data-open="reviews-modal">Show all reviews</button>' : '') + '</section>' +
      (reviews.length > 3 ? '<dialog class="modal" id="reviews-modal" aria-label="Reviews"><div class="modal-head"><button type="button" class="iconbtn" data-close aria-label="Close">' + ICON.close + '</button><strong>' + (reviewCount ? l.reviewAverage.toFixed(2) + ' · ' + plural(reviewCount, 'review') : 'Reviews') + '</strong><span></span></div><div class="modal-body">' + reviews.map(reviewItem).join('') + '</div></dialog>' : '')
    : '';

  const where = p.lat != null && p.lng != null
    ? '<section class="psec" id="location"><h2>Where you’ll be</h2><p class="muted">' + esc([p.city, p.state, p.zip, 'US'].filter(Boolean).join(', ')) + '</p>' +
      '<div class="map pmap" id="pmap" data-lat="' + p.lat + '" data-lng="' + p.lng + '" aria-label="Map of the area around this home"></div>' +
      '<p class="muted small">The exact address is shared after booking.</p></section>'
    : '';

  const promise = '<section class="psec wide" id="promise"><h2>Our promise to you</h2><div class="promise">' +
    PROMISES.map(([i, t]) => '<div>' + ICON[i].replace(/width="24" height="24"/, 'width="22" height="22"') + '<p>' + t + '</p></div>').join('') + '</div>' +
    '<button type="button" class="chip" data-open="promise-modal">Learn more</button></section>' +
    '<dialog class="modal" id="promise-modal" aria-label="Our promise"><div class="modal-head"><button type="button" class="iconbtn" data-close aria-label="Close">' + ICON.close + '</button><strong>Get more when you book direct</strong><span></span></div><div class="modal-body promise-list">' +
    PROMISES.map(([i, t, s]) => '<div><span class="ibox">' + ICON[i] + '</span><div><h3>' + t + '</h3><p>' + s + '</p></div></div>').join('') + '</div></dialog>';

  const rules = [];
  if (l && l.houseRules.length) rules.push(...l.houseRules.map((r) => r.replace(/\.?$/, '.')));
  else {
    rules.push('Maximum ' + plural(p.maxGuests, 'guest') + '.');
    rules.push(p.maxPets ? 'Pets allowed (up to ' + p.maxPets + ').' : 'No pets allowed.');
  }
  const allRules = rules.concat(l ? l.expectations.map((e) => e.replace(/\.?$/, '.')) : []);
  const cancel = l && l.cancellationPolicy ? l.cancellationPolicy : '';
  const cancelFirst = cancel ? (cancel.match(/^.*?[.!?](\s|$)/) || [cancel])[0].trim() : '';
  const things = '<section class="psec wide" id="things"><h2>Things to know</h2><div class="things">' +
    '<div>' + ICON.home + '<h3>Check-in &amp; check-out</h3>' + (p.checkIn ? '<p>Check-in after ' + esc(fmtTime(p.checkIn)) + '.</p>' : '') + (p.checkOut ? '<p>Check-out before ' + esc(fmtTime(p.checkOut)) + '.</p>' : '') + '</div>' +
    '<div>' + ICON.note + '<h3>Property rules</h3>' + rules.slice(0, 5).map((r) => '<p>' + esc(r) + '</p>').join('') +
      (allRules.length > 5 ? '<button type="button" class="textlink" data-open="rules-modal">Read more</button>' : '') + '</div>' +
    '<div>' + ICON.badge + '<h3>Cancellation policy</h3>' + (cancel ? '<p class="dark">' + esc(cancelFirst) + '</p>' + (cancel.length > cancelFirst.length ? '<button type="button" class="textlink dark" data-open="cancel-modal">Learn more</button>' : '') : '<p>Shown during checkout.</p>') + '</div>' +
    '</div></section>' +
    '<dialog class="modal" id="rules-modal" aria-label="Property rules"><div class="modal-head"><button type="button" class="iconbtn" data-close aria-label="Close">' + ICON.close + '</button><strong>Property rules</strong><span></span></div><div class="modal-body">' + allRules.map((r) => '<p>' + esc(r) + '</p>').join('') + '</div></dialog>' +
    (cancel ? '<dialog class="modal" id="cancel-modal" aria-label="Cancellation policy"><div class="modal-head"><button type="button" class="iconbtn" data-close aria-label="Close">' + ICON.close + '</button><strong>Cancellation policy</strong><span></span></div><div class="modal-body">' + paragraphs(cancel.replace(/(\.)\s+(?=[A-Z])/g, '.\n\n')) + '</div></dialog>' : '');

  const card =
    '<aside class="bookcol" aria-label="Book this home"><div class="book" id="book">' +
      '<p class="direct-note" hidden id="b-direct">' + ICON.tag + 'You’re booking direct for the best price</p>' +
      '<h3 id="b-title">Choose available dates</h3>' +
      '<p class="b-price" id="b-price" hidden></p>' +
      '<div class="b-dates"><button type="button" class="field" data-field="in"><span class="flabel">Check-in</span><span class="fval" id="f-in">Add date</span></button>' +
        '<button type="button" class="field" data-field="out"><span class="flabel">Check-out</span><span class="fval" id="f-out">Add date</span></button></div>' +
      '<div class="guests-wrap"><button type="button" class="field guests-btn" id="g-btn" aria-expanded="false"><span><span class="flabel">Guests</span><span class="fval" id="f-guests"></span></span>' + ICON.down + '</button>' +
        '<div class="pop guests-pop" id="g-pop" hidden>' +
          '<div class="step"><div><strong>Guests</strong><span class="muted small">Up to ' + esc(p.maxGuests || 16) + '</span></div><div class="stepper"><button type="button" data-step="guests" data-d="-1" aria-label="Fewer guests">&minus;</button><span id="g-n"></span><button type="button" data-step="guests" data-d="1" aria-label="More guests">+</button></div></div>' +
          (p.maxPets ? '<div class="step"><div><strong>Pets</strong><span class="muted small">Up to ' + esc(p.maxPets) + '</span></div><div class="stepper"><button type="button" data-step="pets" data-d="-1" aria-label="Fewer pets">&minus;</button><span id="p-n"></span><button type="button" data-step="pets" data-d="1" aria-label="More pets">+</button></div></div>' : '') +
        '</div></div>' +
      '<div id="b-body" aria-live="polite"></div>' +
      '<button type="button" class="btn-gold" id="reserve" hidden>Reserve</button>' +
      '<button type="button" class="btn-soft" id="b-action">Check availability</button>' +
      (site.inquiryWidget && p.key ? '<button type="button" class="btn-outline" id="ask">Have a question for us?</button>' : '') +
      '<p class="err" id="book-err" role="alert"></p>' +
      '<p class="small muted center">You won’t be charged yet.</p>' +
    '</div></aside>';

  const tabs = '<nav class="ptabs" id="ptabs" aria-label="Sections" hidden><div class="wrap">' +
    [['photos', 'Photos'], ['overview', 'Overview'], ['about', 'About', about], ['amenities', 'Amenities', amenities], ['reviews', 'Reviews', reviewsBlock], ['location', 'Location', where], ['things', 'Things to know']]
      .filter((t) => t.length < 3 || t[2]).map(([id, label]) => '<a href="#' + id + '">' + label + '</a>').join('') + '</div></nav>';

  const boot = {
    id: p.id, maxGuests: p.maxGuests || 16, maxPets: p.maxPets || 0,
    arrival: d.stay.arrival, departure: d.stay.departure, guests: d.guests, pets: d.pets || 0,
  };

  const body = tabs +
    '<div class="wrap">' + gallery +
      '<div class="playout"><div class="pmain">' + titleBlock + about + sleep + amenities + reviewsBlock + where + '</div>' + card + '</div>' +
      promise + things +
    '</div>' + photosDialog +
    (site.inquiryWidget && p.key ? '<dialog class="modal" id="ask-modal" aria-label="Ask a question"><div class="modal-head"><button type="button" class="iconbtn" data-close aria-label="Close">' + ICON.close + '</button><strong>Have a question for us?</strong><span></span></div>' +
      '<div class="modal-body"><p class="muted">Ask us anything about ' + esc(p.title) + '. Our South Bend team will get back to you.</p>' +
      '<div class="ownerrez-widget ask-widget" data-propertyId="' + esc(p.key) + '" data-widget-type="Inquiry" data-widgetId="' + esc(site.inquiryWidget) + '"></div></div></dialog>' : '') +
    '<script type="application/json" id="boot">' + json(boot) + '</script>';

  return layout(site, p.title + ' | ' + site.name, body, {
    canonical: '/property/' + p.id + '/' + slug(p.title), schema: [rentalSchema(site, p, l, photos, reviews)],
    headerSearch: true, textBar: true, q: { arrival: d.stay.arrival, departure: d.stay.departure }, map: !!where, script: 'property', bodyClass: 'proppage',
    description: (l && (l.summary || l.headline)) || undefined, image: photos[0] && photos[0].url,
  });
}

function weekday(iso) { return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }); }
function stayLabel(a, b) { return weekday(a) + ', ' + shortDate(a) + ' – ' + weekday(b) + ', ' + shortDate(b); }
function groupId(name) { return slug(name); }

function countdown(days) {
  if (days <= 0) return 'This weekend';
  if (days === 1) return 'Tomorrow';
  if (days < 14) return 'In ' + days + ' days';
  if (days < 60) return 'In ' + Math.round(days / 7) + ' weeks';
  return Math.round(days / 30.4) + ' months away';
}

function eventCard(e, total, site) {
  const nights = Math.round((Date.parse(e.departure) - Date.parse(e.arrival)) / 86400000);
  const d = e.date || e.arrival;
  const month = new Date(d + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }).toUpperCase();
  const badge = e.date
    ? '<div class="ev-date"><span>' + month + '</span><b>' + Number(d.slice(8)) + '</b><span>' + weekday(d).toUpperCase() + '</span></div>'
    : '<div class="ev-date range"><span>' + month + '</span><b>' + Number(e.arrival.slice(8)) + '–' + Number(e.departure.slice(8)) + '</b><span>' + e.arrival.slice(0, 4) + '</span></div>';

  // Urgency that is true for this weekend, from the live count of open homes.
  let pitch = '';
  if (e.open != null && total) {
    const share = e.open / total;
    const [cls, head, sub] = e.open === 0
      ? ['out', 'Sold out', 'Text us and we’ll let you know if anything opens up.']
      : share <= 0.15 ? ['low', e.open === 1 ? 'Only 1 home left' : 'Only ' + e.open + ' homes left', 'These go quickly. Book now to lock in your stay.']
      : share <= 0.4 ? ['mid', 'Booking fast', plural(e.open, 'home') + ' still open for this weekend.']
      : ['ok', 'Best selection right now', 'Book early for your pick of ' + e.open + ' homes.'];
    pitch = '<div class="ev-pitch ' + cls + '"><p class="ev-head">' + head + '</p><p class="ev-sub">' + esc(sub) + '</p></div>';
  }

  const perks = [];
  if (e.open) {
    if (e.sleepsMax >= 10) perks.push('Sleeps up to ' + e.sleepsMax);
    if (e.bigGroups) perks.push(plural(e.bigGroups, 'home') + ' for groups of 12+');
    if (e.nearCampus) perks.push(e.nearCampus + ' within a mile of campus');
  }
  const photos = e.open && e.photos && e.photos.length
    ? '<div class="ev-photos">' + e.photos.map((ph) => '<img src="' + esc(ph.url) + '" alt="" loading="lazy" title="' + esc(ph.title) + '">').join('') +
      (e.open > e.photos.length ? '<span>+' + (e.open - e.photos.length) + '</span>' : '') + '</div>'
    : '';

  const href = '/s?checkin=' + e.arrival + '&checkout=' + e.departure;
  const action = e.open === 0
    ? (site.sms ? '<a class="chip ev-go" href="sms:' + esc(site.sms) + '">Text us about this weekend</a>' : '')
    : '<a class="btn-dark big ev-go" href="' + esc(href) + '">' + (e.open ? 'See ' + plural(e.open, 'open home') : 'See open homes') + '</a>';
  return '<article class="ev">' +
    '<div class="ev-top">' + badge + '<div class="ev-title"><p class="ev-when">' + esc(countdown(e.days)) + '</p><h3>' + esc(e.name) + '</h3>' +
      '<p class="muted">' + esc(stayLabel(e.arrival, e.departure)) + ' <span aria-hidden="true">&middot;</span> ' + plural(nights, 'night') + '</p></div></div>' +
    pitch + photos +
    (perks.length ? '<ul class="ev-perks">' + perks.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
    action + '</article>';
}

export function renderBigDates(site, d) {
  const groups = [];
  d.events.forEach((e) => { if (!groups.includes(e.group)) groups.push(e.group); });
  const body =
    '<section class="band bd-hero" style="--bg:url(/img/welcome.jpg)"><div class="band-in">' +
      '<p class="sub">Discover Spacious Luxury in Our Homes</p><h1>Big Weekends in South Bend</h1>' +
      '<p class="bd-intro">Experience the best of South Bend’s biggest weekends with spacious homes designed for gathering, relaxing, and making memories together. Whether you’re visiting for Notre Dame football weekends, graduation celebrations, concerts, or special events, our properties offer the perfect combination of comfort, style, and convenience.</p>' +
      (groups.length > 1 ? '<nav class="bd-jump" aria-label="Jump to">' + groups.map((g) => '<a class="chip" href="#' + groupId(g) + '">' + esc(g) + '</a>').join('') + '</nav>' : '') +
    '</div></section>' +
    '<div class="wrap bd">' +
      (groups.length
        ? groups.map((g) => '<section class="bd-group" id="' + groupId(g) + '"><h2>' + esc(g) + '</h2>' + (d.groups[g] ? '<p class="muted">' + esc(d.groups[g]) + '</p>' : '') +
            '<div class="ev-grid">' + d.events.filter((e) => e.group === g).map((e) => eventCard(e, d.total, site)).join('') + '</div></section>').join('')
        : '<div class="empty"><p>New big weekends are coming soon. Text us and we will help you plan your stay.</p><a class="chip" href="/s">Browse homes</a></div>') +
      '<section class="bd-cta"><div><h2>Planning a big group or a different weekend?</h2><p class="muted">Our South Bend team books game days, graduations, and reunions every year. Tell us your dates and group size and we will find the right home.</p></div>' +
        '<div class="bd-cta-btns">' + (site.sms ? '<a class="btn-dark big" href="sms:' + esc(site.sms) + '">Text us</a>' : '') + '<a class="chip" href="/s">Browse all homes</a></div></section>' +
    '</div>';
  return layout(site, 'Big Weekends in South Bend | ' + site.name, body, {
    canonical: '/listings/big-dates',
    description: 'Book Notre Dame football weekends, graduation, and other big South Bend weekends direct with Irish Management. See which homes are still open for each date.',
    image: '/img/welcome.jpg',
  });
}

export function renderReviews(site, d) {
  const r = d.rating;
  const body = '<section class="guests wrap page-pad"><p class="sub">What Guests Say</p><h1>Trusted by Travelers</h1>' +
    (r.count ? '<p class="big">' + r.average.toFixed(2) + '</p>' + stars(5, 16) + '<p class="count">' + r.count.toLocaleString('en-US') + ' reviews</p>' : '') +
    '<div class="rgrid">' + d.reviews.map((x) => reviewCard(x).replace('<div class="rmeta">', '<div class="rmeta"><p class="muted small">' + esc(x.property) + '</p>')).join('') + '</div>' +
    '<div class="center-btn"><a class="chip" href="/s">Browse Homes</a></div></section>';
  return layout(site, 'Guest reviews | ' + site.name, body, { canonical: '/reviews', description: 'Read reviews from guests who stayed in Irish Management vacation rentals near Notre Dame.' });
}

export function renderSitemap(site, d) {
  const body = '<section class="wrap legal"><h1>Sitemap</h1><ul><li><a href="/">Home</a></li><li><a href="/s">All homes</a></li>' + COLLECTIONS.map((c) => '<li><a href="/listings/' + c.slug + '">' + esc(c.name) + '</a></li>').join('') + '<li><a href="/listings/big-dates">Big Weekends</a></li><li><a href="/reviews">Guest reviews</a></li><li><a href="/terms">Terms of Service</a></li><li><a href="/privacy-policy">Privacy Policy</a></li></ul>' +
    '<h2>Homes</h2><ul>' + d.props.map((p) => '<li><a href="' + esc(propHref(p)) + '">' + esc(p.title) + '</a></li>').join('') + '</ul></section>';
  return layout(site, 'Sitemap | ' + site.name, body, { canonical: '/sitemap' });
}

function legal(site, title, sections, path) {
  return layout(site, title + ' | ' + site.name, '<article class="wrap legal"><h1>' + esc(title) + '</h1>' + sections + '</article>', { canonical: path });
}

const contactBlock = (site) => '<p>' + esc(site.name) + '<br>1539 N Ironwood Dr, South Bend, IN 46635' +
  (site.email ? '<br>Email: <a href="mailto:' + esc(site.email) + '">' + esc(site.email) + '</a>' : '') +
  (site.phone ? '<br>Phone: <a href="tel:' + esc(site.sms) + '">' + esc(site.phone) + '</a>' : '') + '</p>';

export function renderTerms(site) {
  return legal(site, 'Terms of Service',
    '<p>These Terms of Service ("Terms") govern your use of this website and your booking of accommodations from Irish Management ("we", "us", "our"). By accessing this site or making a reservation, you agree to these Terms.</p>' +
    '<h2>1. Reservations and Bookings</h2><p>A reservation is confirmed only after you complete the booking flow and we (or our payment processor) successfully charge the required amount. We may decline or cancel a reservation at our discretion, including for suspected fraud, misrepresentation, violation of these Terms, or unavailability of the property. Confirmed reservations are subject to the cancellation policy disclosed at the time of booking.</p>' +
    '<h2>2. Payment, Fees, and Taxes</h2><p>You agree to pay the total amount disclosed at checkout, including nightly rates, fees, deposits, and applicable taxes. Charges are processed by our payment provider; by providing payment information, you authorize us to charge the amount due. We may place a hold or pre-authorization on your payment method to cover incidentals or damage.</p>' +
    '<h2>3. Cancellations and Refunds</h2><p>The cancellation policy that applies to your reservation is the one shown at checkout and on your booking confirmation. Refunds, if any, are issued under that policy and may take several business days to appear on your statement, depending on your payment provider.</p>' +
    '<h2>4. Guest Conduct and House Rules</h2><p>By staying at one of our properties, you agree to:</p><ul><li>Use the property solely for short-term lodging by the registered guests.</li><li>Comply with house rules, occupancy limits, and any community or HOA regulations.</li><li>Respect quiet hours and neighbors; no parties or events without prior written approval.</li><li>Refrain from illegal activity, smoking where prohibited, and any conduct that damages the property or disturbs others.</li></ul><p>We may terminate a stay without refund and pursue costs and damages if these rules are violated.</p>' +
    '<h2>5. Damage, Loss, and Liability</h2><p>You are responsible for damage to the property or its contents caused during your stay, beyond ordinary wear and tear. We may charge your payment method for repair or replacement costs. To the maximum extent permitted by law, we are not liable for indirect, incidental, or consequential damages, and our total liability for any claim arising out of or relating to your stay or use of this site is limited to the amount you paid for the reservation in question.</p>' +
    '<h2>6. Assumption of Risk</h2><p>Use of pools, hot tubs, kitchens, outdoor areas, equipment, and surrounding amenities is at your own risk. You are responsible for the safety and supervision of any minors or guests in your party.</p>' +
    '<h2>7. Intellectual Property</h2><p>All content on this site, including text, images, logos, and design, is owned by or licensed to Irish Management or our service providers and is protected by intellectual property laws. You may not copy, modify, or redistribute it without our written permission.</p>' +
    '<h2>8. Privacy</h2><p>Our handling of personal information is described in our <a href="/privacy-policy">Privacy Policy</a>. By using this site or making a booking, you acknowledge that policy.</p>' +
    '<h2>9. Changes to These Terms</h2><p>We may update these Terms from time to time. Material changes will take effect when posted; continued use of the site after that point constitutes acceptance of the updated Terms.</p>' +
    '<h2>10. Contact</h2><p>For questions about these Terms or your reservation:</p>' + contactBlock(site), '/terms');
}

export function renderPrivacy(site) {
  return legal(site, 'Privacy Policy',
    '<p>This Privacy Policy describes how Irish Management ("we", "us", "our") collects, uses, and shares information about guests and visitors who use our website and book stays at properties we manage. By using this site or making a booking, you agree to the practices described below.</p>' +
    '<h2>1. Information We Collect</h2><p>We collect the following categories of information:</p><ul>' +
    '<li><strong>Contact details:</strong> name, email address, phone number, and mailing address you provide when booking a stay or contacting us.</li>' +
    '<li><strong>Booking details:</strong> dates, property selected, number of guests, and any preferences or special requests you share with us.</li>' +
    '<li><strong>Payment information:</strong> billing address and payment card details, which are processed by our payment provider; we do not store full card numbers on our servers.</li>' +
    '<li><strong>Identity and stay verification:</strong> government-issued ID or similar documents where required to confirm a reservation.</li>' +
    '<li><strong>Device and usage data:</strong> IP address, browser type, pages viewed, and similar information collected automatically when you use the site.</li>' +
    '<li><strong>Communications:</strong> messages you send us by email, phone, or text.</li></ul>' +
    '<h2>2. How We Use Your Information</h2><p>We use the information we collect to:</p><ul><li>Process and confirm reservations, payments, and refunds.</li><li>Communicate with you about your stay, including check-in details and support.</li><li>Verify identity, prevent fraud, and enforce our policies.</li><li>Comply with legal, tax, and regulatory obligations.</li><li>Improve the website, respond to inquiries, and, with your consent, send marketing communications you can opt out of at any time.</li></ul>' +
    '<h2>3. How We Share Your Information</h2><p>We share information only as needed to operate our business:</p><ul>' +
    '<li><strong>Service providers:</strong> our reservation system, payment processors, hosting and software providers, identity verification services, and other vendors who help us run the site and fulfill your booking.</li>' +
    '<li><strong>Legal and safety:</strong> when required by law, subpoena, or to protect the rights, property, or safety of guests, our team, or the public.</li>' +
    '<li><strong>Business transfers:</strong> in connection with a merger, acquisition, or sale of all or part of our business.</li></ul><p>We do not sell your personal information.</p>' +
    '<h2>4. Cookies and Tracking</h2><p>We use cookies and similar technologies to remember preferences, measure how the site is used, and (where applicable) deliver advertising. You can control cookies through your browser settings; disabling some cookies may affect site functionality.</p>' +
    '<h2>5. Data Retention</h2><p>We retain personal information for as long as needed to provide our services, comply with legal and tax obligations, resolve disputes, and enforce our agreements. Retention periods vary by data type and applicable law.</p>' +
    '<h2>6. Your Privacy Rights</h2><p>Depending on where you live, you may have rights to access, correct, delete, or receive a copy of the personal information we hold about you, to opt out of certain sharing or targeted advertising, and to withdraw consent. To exercise these rights, contact us using the details in section 9. We will not discriminate against you for exercising any right under applicable privacy law.</p>' +
    '<h2>7. Children\'s Privacy</h2><p>This site is not directed to children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us so we can delete it.</p>' +
    '<h2>8. Security</h2><p>We use reasonable administrative, technical, and physical safeguards designed to protect personal information. No system is perfectly secure, however, and we cannot guarantee the security of any information you transmit to us.</p>' +
    '<h2>9. Contact Us</h2><p>For questions or requests about this Privacy Policy or our data practices:</p>' + contactBlock(site) +
    '<h2>10. Changes to This Privacy Policy</h2><p>We may update this Privacy Policy from time to time. Material changes will be communicated through the site or by email where appropriate.</p>', '/privacy-policy');
}

export function renderThanks(site) {
  return layout(site, 'Reservation received | ' + site.name,
    '<div class="wrap centerpage"><h1>Your reservation is in</h1><p>Check your email for your confirmation. We will send check-in details and your door code before you arrive.</p><a class="chip" href="/">Back to all stays</a></div>', { noindex: true });
}

export function renderNotFound(site) {
  return layout(site, 'Page not found | ' + site.name,
    '<div class="wrap centerpage"><h1>We could not find that page</h1><p>The home may no longer be listed. Browse our current stays instead.</p><a class="chip" href="/s">See all stays</a></div>', { noindex: true });
}

export function renderError(site, title, message) {
  return layout(site, title + ' | ' + site.name,
    '<div class="wrap centerpage"><h1>' + esc(title) + '</h1><p>' + esc(message) + '</p><a class="chip" href="/">Try again</a></div>', { noindex: true });
}
