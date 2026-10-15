// HTML templates for the direct booking site.

export function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function slug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

function fmtTime(hhmm) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = ((h + 11) % 12) + 1;
  return h12 + ':' + String(m || 0).padStart(2, '0') + ' ' + ap;
}

function paragraphs(text) {
  return String(text || '').split(/\n{2,}|\r\n\r\n/).map((p) => p.trim()).filter(Boolean)
    .map((p) => '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>').join('');
}

const ICON = {
  search: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  pin: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.1-7-11.5A7 7 0 0 1 19 9.5C19 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
  wallet: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1 0-4h12v4"/><path d="M4 6v12a2 2 0 0 0 2 2h14v-4"/><circle cx="17" cy="14" r="1.5"/></svg>',
  lock: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  chat: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  bed: '<svg aria-hidden="true" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18V8"/><path d="M3 14h18v4"/><path d="M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/></svg>',
  check: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 4.5 4.5L19 7"/></svg>',
  grid: '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
  left: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  right: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
};

const CSS = String.raw`
:root{--navy:#0E2240;--navy-2:#1E3458;--gold:#A8842E;--gold-text:#7A5F1F;--gold-wash:#F6F0E1;--ink:#1B2433;--ink-2:#3D4757;--muted:#4A5568;--line:#E3E6EC;--line-2:#B9C1CE;--tint:#F4F6F9;--photo:#E8EBF1;
--display:'Archivo','Helvetica Neue',Helvetica,sans-serif;--body:'Public Sans','Helvetica Neue',Helvetica,sans-serif}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;font-family:var(--body);color:var(--ink);background:#fff;line-height:1.5}
a{color:var(--navy)}a:hover{color:var(--gold-text)}
img{max-width:100%;display:block}
:focus-visible{outline:3px solid var(--gold);outline-offset:2px}
.wrap{max-width:1280px;margin:0 auto;padding:0 32px}
@media (max-width:640px){.wrap{padding:0 18px}}
h1,h2,h3{font-family:var(--display);color:var(--navy);letter-spacing:-.015em;margin:0}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:0 24px;border-radius:999px;border:0;background:var(--navy);color:#fff;font:inherit;font-weight:600;text-decoration:none;cursor:pointer}
.btn:hover{color:#fff;background:#18325a}
.btn[disabled]{opacity:.45;cursor:not-allowed}
.btn-outline{background:#fff;color:var(--navy);border:1.5px solid var(--navy)}
.btn-outline:hover{background:var(--tint);color:var(--navy)}
.btn-block{width:100%;border-radius:12px;min-height:54px;font-size:17px;font-weight:700}
.linkbtn{background:none;border:0;padding:0;min-height:44px;font:inherit;font-weight:600;color:var(--navy);text-decoration:underline;cursor:pointer}

/* header */
.site-header{border-bottom:1px solid var(--line);background:#fff}
.site-header .wrap{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px 24px;padding-top:14px;padding-bottom:14px}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;color:var(--navy)}
.brand-mark{width:38px;height:38px;border-radius:8px;background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--display);font-weight:800;font-size:15px}
.brand-name{font-family:var(--display);font-weight:700;font-size:20px}
.nav{display:flex;flex-wrap:wrap;gap:8px 26px;font-weight:500;font-size:15px}
.nav a{text-decoration:none}

/* hero */
.hero{background:var(--navy);color:#fff}
.hero .wrap{padding-top:64px;padding-bottom:72px;display:flex;flex-wrap:wrap;gap:48px;align-items:center}
.hero-copy{flex:1 1 520px;min-width:0;display:flex;flex-direction:column;gap:18px}
.hero h1{color:#fff;font-weight:800;font-size:clamp(38px,5vw,62px);line-height:1.03}
.hero p{margin:0;font-size:18px;color:#D3DAE6;max-width:520px}
.hero-photo{flex:1 1 400px;min-width:0;height:440px;border-radius:20px;overflow:hidden;background:var(--navy-2)}
.hero-photo img{width:100%;height:100%;object-fit:cover}
@media (max-width:640px){.hero-photo{height:260px}}
.search{margin-top:10px;background:#fff;border-radius:16px;padding:8px;display:flex;flex-wrap:wrap;gap:4px;color:var(--ink)}
.search label{flex:1 1 140px;display:flex;flex-direction:column;gap:2px;padding:8px 14px;border-radius:10px}
.search label+label{border-left:1px solid var(--line)}
@media (max-width:640px){.search label+label{border-left:0;border-top:1px solid var(--line)}}
.search span{font-size:13px;font-weight:600;color:var(--muted)}
.search input{border:0;font:inherit;font-size:16px;padding:2px 0;color:var(--ink);background:transparent;min-height:28px}
.search button{flex:0 0 auto;min-height:56px;padding:0 26px;border-radius:12px;border:0;background:var(--gold);color:var(--navy);font:inherit;font-weight:700;font-size:16px;display:inline-flex;align-items:center;gap:8px;cursor:pointer}
@media (max-width:640px){.search button{flex:1 1 100%;justify-content:center}}

/* listings */
.section{padding:72px 0 32px}
.section-head{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:12px;margin-bottom:28px}
.section-head h2{font-size:34px}
.section-head p{margin:6px 0 0;color:var(--muted)}
.notice{margin:0 0 24px;padding:14px 18px;border-radius:12px;background:var(--gold-wash);color:var(--ink-2)}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:32px 24px}
.card{display:flex;flex-direction:column;gap:12px;text-decoration:none;color:var(--ink)}
.card-photo{aspect-ratio:4/3;border-radius:14px;overflow:hidden;background:var(--photo)}
.card-photo img{width:100%;height:100%;object-fit:cover;transition:transform .3s ease}
.card:hover .card-photo img{transform:scale(1.03)}
@media (prefers-reduced-motion:reduce){.card-photo img{transition:none}.card:hover .card-photo img{transform:none}}
.card-title{font-weight:600;font-size:16px;line-height:1.35}
.card-meta{font-size:14px;color:var(--muted)}
.card-cta{font-size:14px;font-weight:600;color:var(--gold-text)}
.empty{padding:40px;border-radius:16px;background:var(--tint);text-align:center}

/* value strip and bands */
.values{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;padding:48px 0}
.value{padding:26px;border-radius:16px;background:var(--tint);display:flex;flex-direction:column;gap:10px;color:var(--navy)}
.value h3{font-size:20px}
.value p{margin:0;color:var(--ink-2)}
.band{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:24px;padding:44px;border-radius:20px;background:var(--gold-wash);margin-bottom:64px}
.band h2{font-size:32px;font-weight:800}
.band p{margin:8px 0 0;color:var(--ink-2);max-width:560px;font-size:17px}

/* footer */
.site-footer{background:var(--navy);color:#D3DAE6}
.site-footer .wrap{display:flex;flex-wrap:wrap;gap:16px 40px;justify-content:space-between;padding-top:40px;padding-bottom:40px;font-size:15px}
.site-footer a{color:#D3DAE6}
.site-footer strong{font-family:var(--display);color:#fff;font-size:20px}

/* property */
.prop-top{padding-top:28px;display:flex;flex-direction:column;gap:10px}
.crumbs{font-size:14px;color:var(--muted)}
.crumbs a{color:var(--muted)}
.prop-top h1{font-weight:800;font-size:clamp(28px,3.4vw,40px);line-height:1.1}
.prop-sub{color:var(--ink-2);font-size:16px}
.gallery{position:relative;display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:230px 230px;gap:8px;margin-top:24px;border-radius:18px;overflow:hidden}
.gallery .ph{background:var(--photo);overflow:hidden}
.gallery .ph img{width:100%;height:100%;object-fit:cover}
.gallery .ph:first-child{grid-row:span 2}
.gallery-btn{position:absolute;right:16px;bottom:16px;background:#fff;color:var(--navy);border:1px solid var(--navy);border-radius:10px;min-height:44px;padding:0 16px;font:inherit;font-weight:600;font-size:14px;display:inline-flex;align-items:center;gap:8px;cursor:pointer}
@media (max-width:800px){.gallery{grid-template-columns:1fr 1fr;grid-template-rows:260px 140px}.gallery .ph:first-child{grid-column:span 2;grid-row:auto}.gallery .ph:nth-child(n+4){display:none}}
.layout{display:flex;flex-wrap:wrap;gap:56px;align-items:flex-start;padding:32px 0 80px}
.main{flex:999 1 560px;min-width:0}
.aside{flex:1 1 360px;min-width:0;position:sticky;top:24px;display:flex;flex-direction:column;gap:14px}
@media (max-width:960px){.aside{position:static}}
.block{padding:28px 0;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:16px}
.block:last-child{border-bottom:0}
.block h2{font-size:22px}
.block p{margin:0;font-size:16px;line-height:1.65;color:var(--ink-2)}
.desc{display:flex;flex-direction:column;gap:12px}
.desc.clamp{max-height:9.5em;overflow:hidden;position:relative}
.desc.clamp::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3em;background:linear-gradient(rgba(255,255,255,0),#fff)}
.host{display:flex;align-items:center;justify-content:space-between;gap:16px}
.host .brand-mark{width:56px;height:56px;border-radius:999px;flex:0 0 auto}
.highlight{display:flex;gap:16px;align-items:flex-start;color:var(--navy)}
.highlight div{display:flex;flex-direction:column;color:var(--ink)}
.highlight span{font-size:15px;color:var(--muted)}
.rooms{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:14px}
.room{border:1px solid #DDE1E8;border-radius:14px;padding:18px;display:flex;flex-direction:column;gap:8px;color:var(--navy)}
.room strong{color:var(--ink)}
.room span{font-size:14px;color:var(--muted)}
.amenities{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px 24px;margin:0;padding:0;list-style:none}
.amenities li{display:flex;align-items:center;gap:12px;color:var(--ink)}
.amenities svg{color:var(--gold);flex:0 0 auto}
details.more summary{cursor:pointer;font-weight:600;min-height:44px;display:inline-flex;align-items:center;color:var(--navy)}
details.more h3{font-size:16px;margin:16px 0 8px}
.rules{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:24px}
.rules div{display:flex;flex-direction:column;gap:6px;color:var(--ink-2);font-size:15px}
.rules strong{color:var(--ink)}
.map{height:320px;border-radius:16px;overflow:hidden;background:var(--photo);border:0;width:100%}

/* calendar */
.cal-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.cal-nav{display:flex;gap:8px}
.cal-nav button{width:44px;height:44px;border-radius:999px;border:1px solid var(--line-2);background:#fff;color:var(--navy);cursor:pointer;display:flex;align-items:center;justify-content:center}
.cal-nav button[disabled]{opacity:.35;cursor:not-allowed}
.months{display:flex;flex-wrap:wrap;gap:36px}
.month{flex:1 1 280px}
.month-name{text-align:center;font-weight:700;margin-bottom:10px}
.dow,.days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:2px}
.dow span{text-align:center;font-size:12px;font-weight:600;color:var(--muted);padding-bottom:6px}
.day{height:44px;border:0;background:transparent;font:inherit;font-size:14px;color:var(--ink);border-radius:999px;cursor:pointer}
.day:hover:not([disabled]){outline:1.5px solid var(--navy)}
.day[disabled]{color:#8A93A3;text-decoration:line-through;cursor:default}
.day.blank{visibility:hidden}
.day.in{background:var(--photo);border-radius:0;color:var(--navy);font-weight:600}
.day.edge{background:var(--navy);color:#fff;font-weight:700;text-decoration:none}
.cal-note{font-size:14px;color:var(--muted);min-height:21px}

/* booking card */
.book{border:1px solid #DDE1E8;border-radius:18px;padding:24px;background:#fff;box-shadow:0 10px 30px rgba(14,34,64,.10);display:flex;flex-direction:column;gap:16px}
.price{display:flex;align-items:baseline;gap:6px}
.price strong{font-family:var(--display);font-weight:800;font-size:26px;color:var(--navy)}
.price span{color:var(--muted)}
.fields{border:1px solid var(--line-2);border-radius:12px;overflow:hidden}
.fields .two{display:grid;grid-template-columns:1fr 1fr}
.datebtn{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px 14px;background:#fff;border:0;font:inherit;text-align:left;cursor:pointer;min-height:58px}
.datebtn+.datebtn{border-left:1px solid var(--line-2)}
.flabel{font-size:12px;font-weight:700;color:var(--ink)}
.fval{font-size:15px;color:var(--ink-2)}
.guests{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 8px 8px 14px;border-top:1px solid var(--line-2)}
.stepper{display:flex;gap:6px}
.stepper button{width:44px;height:44px;border-radius:999px;border:1px solid var(--line-2);background:#fff;color:var(--navy);font-size:20px;cursor:pointer}
.stepper button[disabled]{opacity:.35;cursor:not-allowed}
.lines{display:flex;flex-direction:column;gap:10px;font-size:15px}
.line{display:flex;justify-content:space-between;gap:12px}
.total{display:flex;justify-content:space-between;gap:12px;padding-top:14px;border-top:1px solid var(--line);font-weight:700;font-size:17px}
.small{font-size:13px;color:var(--muted);text-align:center;margin:0}
.err{color:#9B1C1C;font-size:14px;margin:0}
.guest-form{display:none;flex-direction:column;gap:12px}
.guest-form.open{display:flex}
.guest-form label{display:flex;flex-direction:column;gap:4px;font-size:14px;font-weight:600}
.guest-form input{min-height:46px;border:1px solid var(--line-2);border-radius:10px;padding:0 12px;font:inherit;font-weight:400}
.hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
.direct{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:14px;background:var(--gold-wash);font-size:14px;color:var(--ink-2)}
.direct svg{color:var(--gold-text);flex:0 0 auto}

/* photo dialog */
dialog.photos{width:min(1100px,96vw);max-height:92vh;border:0;border-radius:16px;padding:0}
dialog.photos::backdrop{background:rgba(14,34,64,.6)}
.photos-head{position:sticky;top:0;background:#fff;display:flex;justify-content:space-between;align-items:center;padding:12px 18px;border-bottom:1px solid var(--line)}
.photos-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:10px;padding:18px}
.photos-grid figure{margin:0}
.photos-grid img{width:100%;border-radius:10px}
.photos-grid figcaption{font-size:13px;color:var(--muted);padding-top:4px}
.center{padding:96px 0;text-align:center;display:flex;flex-direction:column;gap:16px;align-items:center}
.center p{margin:0;color:var(--ink-2);max-width:520px}
`;

function layout(site, title, body, extra = '') {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<title>' + esc(title) + '</title>' +
    '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Public+Sans:wght@400;500;600;700&display=swap">' +
    '<style>' + CSS + '</style>' + extra + '</head><body>' +
    header(site) + body + footer(site) + '</body></html>';
}

function header(site) {
  return '<header class="site-header"><div class="wrap">' +
    '<a class="brand" href="/"><span class="brand-mark">IM</span><span class="brand-name">' + esc(site.name) + '</span></a>' +
    '<nav class="nav" aria-label="Main"><a href="/#stays">Stays</a><a href="/#game-weekends">Game weekends</a><a href="#contact">Contact</a></nav>' +
    '</div></header>';
}

function footer(site) {
  const contact = [
    site.phone ? '<a href="tel:' + esc(site.phone.replace(/[^\d+]/g, '')) + '">' + esc(site.phone) + '</a>' : '',
    site.email ? '<a href="mailto:' + esc(site.email) + '">' + esc(site.email) + '</a>' : '',
  ].filter(Boolean).join(' &nbsp; ');
  return '<footer class="site-footer" id="contact"><div class="wrap">' +
    '<div><strong>' + esc(site.name) + '</strong><div>Short-term and long-term rentals in South Bend, Indiana.</div></div>' +
    '<div>' + contact + '</div>' +
    '<div>&copy; ' + new Date().getUTCFullYear() + ' Irish Management LLC</div>' +
    '</div></footer>';
}

function propHref(p, q) {
  const params = new URLSearchParams();
  if (q.arrival && q.departure) { params.set('checkin', q.arrival); params.set('checkout', q.departure); }
  if (q.guests) params.set('guests', String(q.guests));
  const qs = params.toString();
  return '/property/' + p.id + '/' + slug(p.title) + (qs ? '?' + qs : '');
}

function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

export function renderHome(site, d) {
  const q = { arrival: d.searched ? d.arrival : '', departure: d.searched ? d.departure : '', guests: d.guests };
  const heroPhoto = d.props.find((p) => p.photo);
  const cards = d.props.map((p) =>
    '<a class="card" href="' + esc(propHref(p, q)) + '">' +
      '<div class="card-photo">' + (p.photo ? '<img src="' + esc(p.photo) + '" alt="" loading="lazy">' : '') + '</div>' +
      '<div><div class="card-title">' + esc(p.title) + '</div>' +
      '<div class="card-meta">' + esc([p.city, plural(p.bedrooms, 'bedroom'), plural(p.bathrooms, 'bath'), 'sleeps ' + p.maxGuests].filter(Boolean).join(', ')) + '</div></div>' +
      '<span class="card-cta">' + (d.searched ? 'See price for your dates' : 'Check dates and prices') + '</span>' +
    '</a>').join('');

  const heading = d.searched
    ? (d.props.length ? plural(d.props.length, 'home') + ' open ' + fmtDate(d.arrival) + ' to ' + fmtDate(d.departure) : 'No homes open for those dates')
    : 'Stays near Notre Dame';
  const sub = d.searched
    ? (d.guests ? 'For ' + plural(d.guests, 'guest') + '. ' : '') + '<a href="/#stays">Clear search</a>'
    : 'Live availability and pricing from our reservation system.';

  const body =
    '<section class="hero"><div class="wrap">' +
      '<div class="hero-copy">' +
        '<h1>Stay close to campus. Book direct with the local team.</h1>' +
        '<p>Homes for game weekends, graduations, family visits, and longer stays, managed right here in South Bend.</p>' +
        '<form class="search" action="/#stays" method="get" role="search">' +
          '<label><span>Check in</span><input type="date" name="checkin" value="' + esc(d.arrival) + '" required></label>' +
          '<label><span>Check out</span><input type="date" name="checkout" value="' + esc(d.departure) + '" required></label>' +
          '<label><span>Guests</span><input type="number" name="guests" min="1" max="30" inputmode="numeric" value="' + esc(d.guests || '') + '" placeholder="Add guests"></label>' +
          '<button type="submit">' + ICON.search + 'Search</button>' +
        '</form>' +
      '</div>' +
      '<div class="hero-photo">' + (heroPhoto ? '<img src="' + esc(heroPhoto.photo) + '" alt="">' : '') + '</div>' +
    '</div></section>' +
    '<section class="section" id="stays"><div class="wrap">' +
      (d.notice ? '<p class="notice">' + esc(d.notice) + '</p>' : '') +
      '<div class="section-head"><div><h2>' + esc(heading) + '</h2><p>' + sub + '</p></div></div>' +
      (d.props.length ? '<div class="cards">' + cards + '</div>'
        : '<div class="empty"><p>Try different dates, or contact us and we will help you find a fit.</p></div>') +
    '</div></section>' +
    '<div class="wrap"><div class="values">' +
      '<div class="value">' + ICON.pin + '<h3>A local team, minutes away</h3><p>Talk to the people who actually manage the home, not a call center.</p></div>' +
      '<div class="value">' + ICON.wallet + '<h3>No booking site fees</h3><p>Book here and skip the guest service fees charged by the big booking sites.</p></div>' +
      '<div class="value">' + ICON.lock + '<h3>Secure checkout</h3><p>Rates, fees, and taxes are calculated live, and payment is processed securely.</p></div>' +
    '</div>' +
    '<div class="band" id="game-weekends"><div><h2>Football weekends book early</h2><p>Home game dates fill months ahead. Search your dates now or contact us about multi-night game weekend stays.</p></div>' +
      '<a class="btn" href="#contact">Ask about game weekends</a></div></div>';

  return layout(site, site.name + ' | South Bend and Notre Dame vacation rentals', body);
}

export function renderProperty(site, d) {
  const p = d.prop;
  const l = d.listing || { available: false };
  const photos = (l.available && l.photos.length) ? l.photos : (p.photo ? [{ url: p.photo, caption: '' }] : []);

  const gallery = '<div class="gallery">' +
    [0, 1, 2, 3, 4].map((i) => '<div class="ph">' + (photos[i] ? '<img src="' + esc(photos[i].url) + '" alt="' + esc(photos[i].caption || p.title) + '"' + (i ? ' loading="lazy"' : '') + '>' : '') + '</div>').join('') +
    (photos.length > 1 ? '<button class="gallery-btn" type="button" id="show-photos">' + ICON.grid + 'Show all ' + photos.length + ' photos</button>' : '') +
    '</div>';

  const dialog = photos.length > 1
    ? '<dialog class="photos" id="photos" aria-label="All photos"><div class="photos-head"><strong>' + esc(p.title) + '</strong><button class="linkbtn" type="button" id="close-photos">Close</button></div><div class="photos-grid">' +
      photos.map((ph) => '<figure><img src="' + esc(ph.url) + '" alt="' + esc(ph.caption || '') + '" loading="lazy">' + (ph.caption ? '<figcaption>' + esc(ph.caption) + '</figcaption>' : '') + '</figure>').join('') +
      '</div></dialog>'
    : '';

  const sleeps = l.available && l.sleepsMax ? l.sleepsMax : p.maxGuests;
  const facts = ['Sleeps ' + sleeps, plural(p.bedrooms, 'bedroom'), plural(p.bathrooms, 'bath')];
  if (p.livingArea) facts.push(p.livingArea.toLocaleString('en-US') + ' ' + (p.livingAreaType || 'sq. ft.'));
  const rating = l.available && l.reviewCount ? ', ' + l.reviewAverage.toFixed(1) + ' from ' + plural(l.reviewCount, 'review') : '';

  const desc = l.available ? (l.description || l.summary) : '';
  const descBlock = desc
    ? '<section class="block"><h2>About this home</h2><div class="desc clamp" id="desc">' + paragraphs(desc) + '</div>' +
      '<button type="button" class="linkbtn" id="desc-more" style="align-self:flex-start">Show more</button></section>'
    : '';

  const rooms = l.available && l.rooms.length
    ? '<section class="block"><h2>Where you\'ll sleep</h2><div class="rooms">' +
      l.rooms.map((r) => '<div class="room">' + ICON.bed + '<strong>' + esc(r.name) + '</strong><span>' + esc(r.description || plural(r.beds, 'bed')) + '</span></div>').join('') +
      '</div></section>'
    : '';

  let amenities = '';
  if (l.available && l.amenities.length) {
    const flat = [];
    l.amenities.forEach((c) => c.items.forEach((i) => { if (!flat.includes(i)) flat.push(i); }));
    const top = (l.callouts.length ? l.callouts : flat).slice(0, 10);
    amenities = '<section class="block"><h2>What this place offers</h2><ul class="amenities">' +
      top.map((a) => '<li>' + ICON.check + esc(a) + '</li>').join('') + '</ul>' +
      (flat.length > top.length
        ? '<details class="more"><summary>Show all ' + flat.length + ' amenities</summary>' +
          l.amenities.map((c) => '<h3>' + esc(c.caption) + '</h3><ul class="amenities">' + c.items.map((a) => '<li>' + ICON.check + esc(a) + '</li>').join('') + '</ul>').join('') +
          '</details>'
        : '') +
      '</section>';
  }

  const map = p.lat != null && p.lng != null
    ? '<section class="block"><h2>Where you\'ll be</h2>' +
      '<iframe class="map" title="Map of the area around this home" loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=' +
      [p.lng - 0.02, p.lat - 0.012, p.lng + 0.02, p.lat + 0.012].map((n) => n.toFixed(4)).join('%2C') + '&amp;layer=mapnik"></iframe>' +
      '<p>' + esc([p.city, p.state].filter(Boolean).join(', ')) + '. The exact address is shared after booking.</p></section>'
    : '';

  const rules = '<section class="block"><h2>Things to know</h2><div class="rules">' +
    '<div><strong>House rules</strong>' +
      (p.checkIn ? '<span>Check-in after ' + esc(fmtTime(p.checkIn)) + '</span>' : '') +
      (p.checkOut ? '<span>Checkout before ' + esc(fmtTime(p.checkOut)) + '</span>' : '') +
      '<span>Up to ' + esc(p.maxGuests) + ' guests</span>' +
      (p.maxPets ? '<span>Pets allowed (up to ' + esc(p.maxPets) + ')</span>' : '<span>No pets</span>') +
    '</div>' +
    (l.available && l.cancellationPolicy ? '<div><strong>Cancellation policy</strong><span>' + esc(l.cancellationPolicy) + '</span></div>' : '') +
    '<div><strong>Rental agreement</strong><span>Signed during checkout</span></div>' +
    '</div></section>';

  const fromPrice = l.available && l.nightlyMin ? '$' + Math.round(l.nightlyMin).toLocaleString('en-US') : '';

  const card =
    '<aside class="aside" aria-label="Book this home">' +
      '<div class="book">' +
        '<div class="price" id="price">' + (fromPrice ? '<span>From</span><strong>' + fromPrice + '</strong><span>night</span>' : '<strong>Add dates</strong><span>for prices</span>') + '</div>' +
        '<div class="fields">' +
          '<div class="two">' +
            '<button type="button" class="datebtn" data-goto-cal><span class="flabel">Check in</span><span class="fval" id="f-in">Add date</span></button>' +
            '<button type="button" class="datebtn" data-goto-cal><span class="flabel">Checkout</span><span class="fval" id="f-out">Add date</span></button>' +
          '</div>' +
          '<div class="guests"><div><div class="flabel">Guests</div><div class="fval" id="f-guests"></div></div>' +
            '<div class="stepper"><button type="button" id="g-minus" aria-label="Fewer guests">&minus;</button><button type="button" id="g-plus" aria-label="More guests">+</button></div></div>' +
        '</div>' +
        '<div id="quote" aria-live="polite"></div>' +
        '<button class="btn btn-block" type="button" id="reserve" disabled>Reserve</button>' +
        '<form class="guest-form" id="guest-form" novalidate>' +
          '<label>First name<input name="first_name" autocomplete="given-name" required></label>' +
          '<label>Last name<input name="last_name" autocomplete="family-name" required></label>' +
          '<label>Email<input name="email" type="email" autocomplete="email" required></label>' +
          '<label>Phone<input name="phone" type="tel" autocomplete="tel"></label>' +
          '<div class="hp" aria-hidden="true"><label>Company<input name="company" tabindex="-1" autocomplete="off"></label></div>' +
          '<button class="btn btn-block" type="submit" id="checkout">Continue to secure checkout</button>' +
          '<p class="err" id="book-err" role="alert"></p>' +
        '</form>' +
        '<p class="small" id="card-note">Pick your dates to see the full price. You won\'t be charged until you confirm on the next page.</p>' +
      '</div>' +
      '<div class="direct">' + ICON.wallet + '<span>Booking direct means no booking site service fee.</span></div>' +
    '</aside>';

  const calendar =
    '<section class="block" id="dates"><div class="cal-head"><div><h2 id="cal-title">Select your dates</h2><div class="cal-note" id="cal-sub">Choose a check-in date.</div></div>' +
      '<div class="cal-nav"><button type="button" id="cal-prev" aria-label="Previous month">' + ICON.left + '</button><button type="button" id="cal-next" aria-label="Next month">' + ICON.right + '</button></div></div>' +
      '<div class="months" id="months"><p class="cal-note">Loading availability</p></div>' +
      '<div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap"><span class="cal-note">Crossed-out dates are not available.</span><button type="button" class="linkbtn" id="clear-dates">Clear dates</button></div>' +
    '</section>';

  const boot = {
    id: p.id,
    maxGuests: p.maxGuests || 16,
    arrival: d.stay.arrival,
    departure: d.stay.departure,
    guests: d.guests,
  };

  const body =
    '<div class="wrap">' +
      '<div class="prop-top"><nav class="crumbs" aria-label="Breadcrumb"><a href="/">Stays</a> / ' + esc(p.city || 'South Bend') + '</nav>' +
        '<h1>' + esc(p.title) + '</h1><div class="prop-sub">' + esc([p.city, p.state].filter(Boolean).join(', ') + '. ' + facts.join(', ') + rating) + '</div></div>' +
      gallery +
      '<div class="layout"><div class="main">' +
        '<section class="block"><div class="host"><div><h2>Entire home managed by ' + esc(site.name) + '</h2><div class="prop-sub">' + esc(facts.join(', ')) + '</div></div><span class="brand-mark" aria-hidden="true">IM</span></div></section>' +
        '<section class="block">' +
          '<div class="highlight">' + ICON.lock + '<div><strong>Self check-in</strong><span>Your personal door code arrives before your stay.</span></div></div>' +
          '<div class="highlight">' + ICON.chat + '<div><strong>Local team on call</strong><span>Questions during your stay go straight to our South Bend team.</span></div></div>' +
        '</section>' +
        descBlock + rooms + amenities + calendar + map + rules +
      '</div>' + card + '</div>' +
    '</div>' + dialog +
    '<script type="application/json" id="boot">' + JSON.stringify(boot).replace(/</g, '\\u003c') + '</script>' +
    '<script>' + CLIENT_JS + '</script>';

  return layout(site, p.title + ' | ' + site.name, body);
}

export function renderThanks(site) {
  return layout(site, 'Reservation received | ' + site.name,
    '<div class="wrap center"><h1>Your reservation is in</h1><p>Check your email for your confirmation. We will send check-in details and your door code before you arrive.</p><a class="btn" href="/">Back to all stays</a></div>');
}

export function renderNotFound(site) {
  return layout(site, 'Page not found | ' + site.name,
    '<div class="wrap center"><h1>We could not find that page</h1><p>The home may no longer be listed. Browse our current stays instead.</p><a class="btn" href="/">See all stays</a></div>');
}

export function renderError(site, title, message) {
  return layout(site, title + ' | ' + site.name,
    '<div class="wrap center"><h1>' + esc(title) + '</h1><p>' + esc(message) + '</p><a class="btn" href="/">Try again</a></div>');
}

// Browser script for the property page: calendar, live quote, and checkout hand-off.
// Written without template literals so it can sit inside this module safely.
const CLIENT_JS = String.raw`
(function () {
  var boot = JSON.parse(document.getElementById('boot').textContent);
  var byId = function (id) { return document.getElementById(id); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var iso = function (d) { return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); };
  var parse = function (s) { var a = s.split('-'); return new Date(Date.UTC(+a[0], +a[1] - 1, +a[2])); };
  var addDays = function (s, n) { var d = parse(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
  var nights = function (a, b) { return Math.round((parse(b) - parse(a)) / 86400000); };
  var money = function (n) { return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var pretty = function (s) { return parse(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }); };
  var esc = function (s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; };

  var state = { arrival: boot.arrival, departure: boot.departure, adults: boot.guests || 2, days: {}, loaded: false, offset: 0, quote: null, quoteSeq: 0 };
  var todayStr = iso(new Date());

  // Photos dialog
  var dlg = byId('photos');
  if (dlg && byId('show-photos')) {
    byId('show-photos').addEventListener('click', function () { dlg.showModal(); });
    byId('close-photos').addEventListener('click', function () { dlg.close(); });
  }

  // Description toggle
  var desc = byId('desc'), more = byId('desc-more');
  if (desc && more) {
    if (desc.scrollHeight <= desc.clientHeight + 4) { desc.classList.remove('clamp'); more.style.display = 'none'; }
    more.addEventListener('click', function () {
      var open = desc.classList.toggle('clamp');
      more.textContent = open ? 'Show more' : 'Show less';
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-goto-cal]'), function (b) {
    b.addEventListener('click', function () { byId('dates').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  });

  // ---- availability rules ----
  function day(s) { return state.days[s]; }
  function canArrive(s) { var d = day(s); return !!d && d.open && !d.noArrive && s >= todayStr; }
  function stayProblem(a, b) {
    if (b <= a) return 'Checkout must be after check-in.';
    for (var s = a; s < b; s = addDays(s, 1)) { var d = day(s); if (!d || !d.open) return 'Some nights in that range are booked.'; }
    var dep = day(b);
    if (dep && dep.noDepart) return 'Checkout is not allowed on ' + pretty(b) + '.';
    var min = day(a).minNights || 0;
    if (min && nights(a, b) < min) return 'Minimum stay from ' + pretty(a) + ' is ' + min + ' nights.';
    return '';
  }

  // ---- calendar ----
  function baseMonth() {
    var start = state.arrival ? parse(state.arrival) : new Date();
    return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + state.offset, 1));
  }
  function renderMonth(first) {
    var y = first.getUTCFullYear(), m = first.getUTCMonth();
    var name = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    var lead = first.getUTCDay();
    var count = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    var html = '<div class="month"><div class="month-name">' + name + '</div><div class="dow" aria-hidden="true"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div><div class="days">';
    for (var i = 0; i < lead; i++) html += '<span class="day blank"></span>';
    var choosingOut = state.arrival && !state.departure;
    for (var d = 1; d <= count; d++) {
      var s = y + '-' + pad(m + 1) + '-' + pad(d);
      var ok = choosingOut ? (s > state.arrival ? !stayProblem(state.arrival, s) : canArrive(s)) : canArrive(s);
      if (choosingOut && s === state.arrival) ok = true;
      var cls = 'day';
      if (state.arrival && (s === state.arrival || s === state.departure)) cls += ' edge';
      else if (state.arrival && state.departure && s > state.arrival && s < state.departure) cls += ' in';
      var label = pretty(s) + (ok ? '' : ', not available');
      html += '<button type="button" class="' + cls + '" data-date="' + s + '"' + (ok ? '' : ' disabled') + ' aria-label="' + label + '">' + d + '</button>';
    }
    return html + '</div></div>';
  }
  function renderCalendar() {
    if (!state.loaded) return;
    var first = baseMonth();
    var second = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 1));
    byId('months').innerHTML = renderMonth(first) + renderMonth(second);
    var now = new Date();
    byId('cal-prev').disabled = first <= new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    var title = byId('cal-title'), sub = byId('cal-sub');
    if (state.arrival && state.departure) {
      var n = nights(state.arrival, state.departure);
      title.textContent = n + (n === 1 ? ' night' : ' nights');
      sub.textContent = pretty(state.arrival) + ' to ' + pretty(state.departure);
    } else if (state.arrival) {
      title.textContent = 'Select checkout date';
      var min = (day(state.arrival) || {}).minNights;
      sub.textContent = 'Check-in ' + pretty(state.arrival) + (min ? '. Minimum stay ' + min + ' nights.' : '');
    } else {
      title.textContent = 'Select your dates';
      sub.textContent = 'Choose a check-in date.';
    }
  }
  byId('months').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-date]');
    if (!b || b.disabled) return;
    var s = b.getAttribute('data-date');
    if (!state.arrival || state.departure) { state.arrival = s; state.departure = null; }
    else if (s <= state.arrival) { if (canArrive(s)) state.arrival = s; }
    else if (!stayProblem(state.arrival, s)) state.departure = s;
    state.offset = 0;
    afterDatesChange();
  });
  byId('cal-prev').addEventListener('click', function () { state.offset--; renderCalendar(); });
  byId('cal-next').addEventListener('click', function () { state.offset++; renderCalendar(); });
  byId('clear-dates').addEventListener('click', function () { state.arrival = null; state.departure = null; state.offset = 0; afterDatesChange(); });

  // ---- guests ----
  function renderGuests() {
    byId('f-guests').textContent = state.adults + (state.adults === 1 ? ' guest' : ' guests');
    byId('g-minus').disabled = state.adults <= 1;
    byId('g-plus').disabled = state.adults >= boot.maxGuests;
  }
  byId('g-minus').addEventListener('click', function () { if (state.adults > 1) { state.adults--; renderGuests(); syncUrl(); fetchQuote(); } });
  byId('g-plus').addEventListener('click', function () { if (state.adults < boot.maxGuests) { state.adults++; renderGuests(); syncUrl(); fetchQuote(); } });

  // ---- quote ----
  function syncUrl() {
    var u = new URL(location.href);
    if (state.arrival && state.departure) { u.searchParams.set('checkin', state.arrival); u.searchParams.set('checkout', state.departure); }
    else { u.searchParams.delete('checkin'); u.searchParams.delete('checkout'); }
    u.searchParams.set('guests', String(state.adults));
    history.replaceState(null, '', u.toString());
  }
  function setReserve(enabled) {
    byId('reserve').disabled = !enabled;
    if (!enabled) byId('guest-form').classList.remove('open');
  }
  function fetchQuote() {
    var box = byId('quote');
    state.quote = null;
    setReserve(false);
    if (!(state.arrival && state.departure)) { box.innerHTML = ''; return; }
    var seq = ++state.quoteSeq;
    box.innerHTML = '<p class="small">Getting your price</p>';
    var qs = '?id=' + boot.id + '&arrival=' + state.arrival + '&departure=' + state.departure + '&adults=' + state.adults + '&children=0';
    fetch('/api/quote' + qs).then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (seq !== state.quoteSeq) return;
        if (!res.ok) { box.innerHTML = '<p class="err">' + esc(res.j.error || 'Those dates are not available.') + '</p>'; return; }
        state.quote = res.j;
        var n = nights(state.arrival, state.departure);
        var rent = 0;
        res.j.charges.forEach(function (c) { if (c.type === 'rent') rent += c.amount; });
        if (rent) byId('price').innerHTML = '<strong>' + money(rent / n).replace('.00', '') + '</strong><span>avg. night</span>';
        box.innerHTML = '<div class="lines">' + res.j.charges.map(function (c) {
          return '<div class="line"><span>' + esc(c.description) + '</span><span>' + money(c.amount) + '</span></div>';
        }).join('') + '</div><div class="total" style="margin-top:12px"><span>Total</span><span>' + money(res.j.total) + '</span></div>';
        setReserve(true);
      })
      .catch(function () { if (seq === state.quoteSeq) box.innerHTML = '<p class="err">We could not load pricing. Check your connection and try again.</p>'; });
  }

  function afterDatesChange() {
    byId('f-in').textContent = state.arrival ? pretty(state.arrival) : 'Add date';
    byId('f-out').textContent = state.departure ? pretty(state.departure) : 'Add date';
    renderCalendar();
    syncUrl();
    fetchQuote();
  }

  // ---- reserve and checkout ----
  byId('reserve').addEventListener('click', function () {
    var f = byId('guest-form');
    f.classList.add('open');
    byId('reserve').style.display = 'none';
    f.querySelector('input').focus();
  });
  byId('guest-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, err = byId('book-err'), btn = byId('checkout');
    var data = { property_id: boot.id, arrival: state.arrival, departure: state.departure, adults: state.adults, children: 0 };
    ['first_name', 'last_name', 'email', 'phone', 'company'].forEach(function (k) { data[k] = f.elements[k].value.trim(); });
    if (!data.first_name || !data.last_name) { err.textContent = 'Enter your first and last name.'; return; }
    if (!f.elements.email.checkValidity() || !data.email) { err.textContent = 'Enter a valid email address.'; return; }
    err.textContent = '';
    btn.disabled = true; btn.textContent = 'Opening secure checkout';
    fetch('/api/book', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (res.ok && res.j.paymentUrl) { location.href = res.j.paymentUrl; return; }
        err.textContent = res.j.error || 'We could not open checkout. Please try again.';
        btn.disabled = false; btn.textContent = 'Continue to secure checkout';
      })
      .catch(function () {
        err.textContent = 'We could not reach checkout. Check your connection and try again.';
        btn.disabled = false; btn.textContent = 'Continue to secure checkout';
      });
  });

  // ---- load availability ----
  renderGuests();
  byId('f-in').textContent = state.arrival ? pretty(state.arrival) : 'Add date';
  byId('f-out').textContent = state.departure ? pretty(state.departure) : 'Add date';
  fetch('/api/calendar?id=' + boot.id).then(function (r) { return r.json(); }).then(function (j) {
    if (j.error) { byId('months').innerHTML = '<p class="err">' + esc(j.error) + '</p>'; return; }
    (j.days || []).forEach(function (d) { state.days[d.date] = d; });
    state.loaded = true;
    if (state.arrival && state.departure && (!canArrive(state.arrival) || stayProblem(state.arrival, state.departure))) {
      byId('cal-sub').textContent = 'Those dates are not available. Pick new dates below.';
      state.arrival = null; state.departure = null;
      afterDatesChange();
      byId('cal-sub').textContent = 'Those dates are not available. Pick new dates below.';
      return;
    }
    renderCalendar();
    if (state.arrival && state.departure) fetchQuote();
  }).catch(function () {
    byId('months').innerHTML = '<p class="err">We could not load availability. Refresh the page to try again.</p>';
  });
})();
`;
