// Weekly health and traffic report for stayirish.com.
//   node scripts/site-report.mjs            (uptime checks only)
//   CLOUDFLARE_API_TOKEN=... node scripts/site-report.mjs   (adds Cloudflare traffic numbers)
// The token only needs "Analytics: Read" on the zone and "Account Analytics: Read".
// Prints a Markdown report. Exits with code 1 if any uptime check fails.

const SITE = 'https://stayirish.com';
const ZONE = 'e82ab2dfcdc1c4a01338472982224a24';
const ACCOUNT = 'cb72463eb5726be8854372ebd303c3b1';
const WORKER = 'irish-mgmt-booking';
const TOKEN = process.env.CLOUDFLARE_API_TOKEN;

const out = [];
const say = (s = '') => out.push(s);
let failed = 0;

async function check(name, url, test, opts = {}) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { redirect: opts.redirect || 'follow', headers: { 'user-agent': 'stayirish-health-check' } });
    const body = opts.redirect === 'manual' ? '' : await r.text();
    const ms = Date.now() - t0;
    const problem = test(r, body);
    if (problem) { failed++; say(`- ❌ **${name}**: ${problem} (${ms} ms)`); }
    else say(`- ✅ ${name} (${ms} ms)`);
    return body;
  } catch (e) {
    failed++;
    say(`- ❌ **${name}**: could not connect (${e.message})`);
    return '';
  }
}
const ok200 = (r) => (r.status === 200 ? '' : `status ${r.status}`);

say('## Is the site up?');
const home = await check('Home page', SITE + '/', (r, b) => ok200(r) || (/Irish Management/.test(b) ? '' : 'page looks wrong'));
let homes = 0, firstHome = '';
const search = await check('Search page', SITE + '/s', (r, b) => {
  homes = +((b.match(/(\d+) propert(?:y|ies) available/) || [])[1] || 0);
  return ok200(r) || (homes > 0 ? '' : 'no homes listed');
});
firstHome = (search.match(/href="(\/property\/[^"]+)"/) || search.match(/href="(\/stay\/[^"]+)"/) || [])[1] || '';
const pins = (() => { try { return JSON.parse((search.match(/id="pins"[^>]*>([\s\S]*?)<\/script>/) || [])[1]); } catch { return []; } })();
if (!firstHome && pins[0]) firstHome = pins[0].href;
if (firstHome) await check('A home page (' + firstHome + ')', SITE + firstHome, (r, b) => ok200(r) || (/Reserve|Check availability|Book/i.test(b) ? '' : 'booking box missing'));
if (pins[0]) await check('Live calendar from OwnerRez', SITE + '/api/calendar?id=' + pins[0].id, (r, b) => ok200(r) || (b.startsWith('{') ? '' : 'bad response'));
await check('Area guide', SITE + '/area-guide', ok200);
await check('Blog', SITE + '/blog', ok200);
await check('Owners page', SITE + '/management', ok200);
await check('www redirect', 'https://www.stayirish.com/', (r) => (r.status === 301 || r.status === 308 ? '' : `status ${r.status}`), { redirect: 'manual' });
say();
say(homes ? `Homes listed on the site: **${homes}**` : '');

async function gql(query) {
  const r = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const j = await r.json();
  if (j.errors && j.errors.length) throw new Error(j.errors.map((e) => e.message).join('; '));
  return j.data;
}
const day = (d) => d.toISOString().slice(0, 10);
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const change = (a, b) => (b ? ` (${a >= b ? '+' : ''}${Math.round(((a - b) / b) * 100)}% vs prior week)` : '');

if (!TOKEN) {
  say();
  say('_Traffic numbers skipped: CLOUDFLARE_API_TOKEN is not set._');
} else {
  try {
    const now = new Date();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); // today 00:00 UTC
    const start = new Date(end - 7 * 864e5), prevStart = new Date(end - 14 * 864e5);
    const z = await gql(`{ viewer { zones(filter:{zoneTag:"${ZONE}"}) {
      httpRequests1dGroups(limit:14, filter:{date_geq:"${day(prevStart)}", date_lt:"${day(end)}"}, orderBy:[date_ASC]) {
        dimensions{date} sum{requests pageViews threats responseStatusMap{edgeResponseStatus requests} countryMap{clientCountryName requests}} uniq{uniques} } } } }`);
    const rows = z.viewer.zones[0].httpRequests1dGroups;
    const week = rows.filter((r) => r.dimensions.date >= day(start)), prev = rows.filter((r) => r.dimensions.date < day(start));
    const tot = (list, f) => list.reduce((s, r) => s + f(r), 0);
    const status = (list, test) => tot(list, (r) => r.sum.responseStatusMap.filter((s) => test(s.edgeResponseStatus)).reduce((a, s) => a + s.requests, 0));

    say();
    say(`## Traffic, ${day(start)} to ${day(new Date(end - 864e5))} (Cloudflare)`);
    say('_Cloudflare counts every visit, bots included. GA4 shows real people only, so expect GA4 numbers to be lower._');
    say();
    const pv = tot(week, (r) => r.sum.pageViews), pvPrev = tot(prev, (r) => r.sum.pageViews);
    const uv = tot(week, (r) => r.uniq.uniques), uvPrev = tot(prev, (r) => r.uniq.uniques);
    say(`- Page views: **${fmt(pv)}**${prev.length >= 7 ? change(pv, pvPrev) : ''}`);
    say(`- Unique visitors (daily, added up): **${fmt(uv)}**${prev.length >= 7 ? change(uv, uvPrev) : ''}`);
    say(`- Total requests: ${fmt(tot(week, (r) => r.sum.requests))}`);
    say();
    say('| Day | Page views | Visitors |');
    say('|---|---:|---:|');
    for (const r of week) say(`| ${r.dimensions.date} | ${fmt(r.sum.pageViews)} | ${fmt(r.uniq.uniques)} |`);
    const countries = {};
    for (const r of week) for (const c of r.sum.countryMap) countries[c.clientCountryName] = (countries[c.clientCountryName] || 0) + c.requests;
    const topC = Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (topC.length) { say(); say('Top countries by requests: ' + topC.map(([c, n]) => `${c} ${fmt(n)}`).join(', ')); }

    say();
    say('## Errors and security');
    const e5 = status(week, (s) => s >= 500), e429 = status(week, (s) => s === 429);
    say(`- Server errors (5xx): **${fmt(e5)}**${e5 > 20 ? ' ⚠️ worth a look' : ''}`);
    say(`- Rate-limited requests (429): ${fmt(e429)}`);
    say(`- Threats blocked by Cloudflare: ${fmt(tot(week, (r) => r.sum.threats))}`);
    try {
      const a = await gql(`{ viewer { accounts(filter:{accountTag:"${ACCOUNT}"}) {
        workersInvocationsAdaptive(limit:20, filter:{datetime_geq:"${start.toISOString()}", datetime_lt:"${end.toISOString()}", scriptName:"${WORKER}"}) {
          sum{requests errors} dimensions{status} } } } }`);
      const w = a.viewer.accounts[0].workersInvocationsAdaptive;
      const req = tot(w, (r) => r.sum.requests), err = tot(w, (r) => r.sum.errors);
      say(`- Site code runs: ${fmt(req)}, crashes: **${fmt(err)}**${err ? ` (${((err / req) * 100).toFixed(2)}%)` : ''}`);
    } catch (e) { say(`- Site code stats unavailable (${e.message})`); }
    try {
      const since = new Date(Date.now() - 864e5).toISOString();
      const p = await gql(`{ viewer { zones(filter:{zoneTag:"${ZONE}"}) {
        httpRequestsAdaptiveGroups(limit:8, filter:{datetime_geq:"${since}", edgeResponseStatus_geq:500, requestSource:"eyeball"}, orderBy:[count_DESC]) { count dimensions{clientRequestPath} } } } }`);
      const g = p.viewer.zones[0].httpRequestsAdaptiveGroups;
      if (g.length) say('- Pages with server errors in the last 24 hours: ' + g.map((x) => `${x.dimensions.clientRequestPath} (${x.count})`).join(', '));
    } catch { /* not available on every plan */ }
  } catch (e) {
    say();
    say(`_Could not read Cloudflare analytics: ${e.message}_`);
  }
}

say();
say(failed ? `**${failed} uptime check(s) failed.**` : '**All uptime checks passed.**');
console.log(out.filter((l, i) => !(l === '' && out[i - 1] === '')).join('\n'));
process.exit(failed ? 1 : 0);
