# Irish Management direct booking site

A guest-facing booking site that runs on Cloudflare Workers and pulls everything live from OwnerRez:
properties, photos, descriptions, amenities, availability, and full pricing with fees and taxes.
Guests pick dates, see the real total, and are sent straight to OwnerRez's
secure payment page to pay and sign the rental agreement. After booking they return to /thank-you.

No booking platform fee. Your OwnerRez token stays on the server and is never sent to browsers.

## What's included

- `src/worker.js`: the server. Talks to OwnerRez, caches responses, refreshes the card
  snapshot on a schedule, handles booking.
- `src/pages.js`: page templates (home, search, property, reviews, terms, privacy, sitemap).
- `public/`: styles (`site.css`), browser scripts (`app.js`, `property.js`, `search.js`),
  and the logo and section photos.
- `wrangler.toml`: Cloudflare settings, the KV namespace, and the 10 minute cron.

Pages: `/` (home), `/s` (all homes with map; accepts `?checkin=&checkout=&guests=&pets=&bedrooms=`),
`/property/<id>/<slug>` (also accepts `?checkin=2027-01-01&checkout=2027-01-08&guests=6`),
`/listings/<collection>` (opens `/s` with a collection selected: `unique`, `large-groups`,
`walking-campus`, `small-groups`), `/reviews`, `/terms`, `/privacy-policy`, `/sitemap`, `/thank-you`.

`/area-guide` is the South Bend area guide (restaurants, bars, ice cream, things to do, Notre Dame,
Rides2U). Edit its places in `src/guide.js`; photos are in `public/img/guide/`.

`/listings/big-dates` shows upcoming big weekends (football, graduation) with live counts of open
homes and a link to search each weekend. Edit the list in `src/events.js`; past events drop off on
their own.

Collections are defined in `COLLECTIONS` in `src/pages.js`. Each `/listings/<collection>` page shows the
homes carrying its OwnerRez tag; to add a home to a collection, add the tag in OwnerRez.

Search filters are defined in `FILTER_SECTIONS` in `src/pages.js` and match each home's OwnerRez amenity
names. "Walk to the stadium" is set from the home's map location (within about a mile of Notre Dame Stadium).

The design and copy match the previous Wander site at listings.irishmgmt.com.

## Card snapshot

Card photos, ratings, and the "next available stay" price on each card come from a snapshot
stored in Workers KV (binding `SNAP`). The cron trigger refreshes 12 homes every 10 minutes,
so every home is refreshed about every 80 minutes. Card prices are rent plus fees, before
taxes, for the earliest stay that meets the minimum-night rule, starting `MIN_LEAD_DAYS` out.

After a deploy you can fill the snapshot right away instead of waiting for the cron:
set a `REFRESH_KEY` secret, then run this 8 times:
`curl -X POST -H "x-refresh-key: YOUR_KEY" https://your-site/__refresh`

## Setup (about 20 minutes)

1. **Create an OwnerRez token.** In OwnerRez go to Settings > Advanced Tools > Developer/API Settings,
   create a Personal Access Token (starts with `pt_`), copy it, and click Grant Access To Me.
2. **Install tools.** Install Node.js, then in this folder run `npm install -g wrangler` and `wrangler login`.
3. **Fill in `wrangler.toml`:** `OWNERREZ_EMAIL` (blank for an OAuth token), `SITE_URL`,
   contact and social links.
4. **Add the secrets:** `wrangler secret put OWNERREZ_TOKEN` (paste the token) and
   `wrangler secret put REFRESH_KEY` (any random string).
5. **Try it locally:** put `OWNERREZ_TOKEN=...` and `REFRESH_KEY=...` in `.dev.vars`
   (git ignores it), run `npm run dev`, then open http://localhost:8787
6. **Go live:** `wrangler deploy`. Then in the Cloudflare dashboard, add a custom domain to the
   Worker (for example `stay.irishmgmt.com`). Use a custom domain, since Cloudflare's shared cache
   only runs there.
7. **Set the payment redirect.** `SITE_URL` must match the live domain so guests land on your
   thank-you page after paying.

## Email signup

The footer shows the Flodesk signup form set in `NEWSLETTER_FORM_ID` (in `wrangler.toml`). Its fields,
colors, and button are designed in Flodesk. Flodesk loads only when a visitor scrolls near the footer,
so it does not slow down the page. Leave the ID blank to hide the signup.

The Flodesk popup in `NEWSLETTER_POPUP_ID` loads on every page after the page finishes loading. When and how
often it appears is set in Flodesk. Leave it blank to turn the popup off.

## Choosing which homes show

- Anything with "Home Watch" in the name is hidden. Add more words to `EXCLUDE_NAME_CONTAINS`, comma separated.
- Anything tagged `Do Not Market` in OwnerRez is hidden. Add more tags to `EXCLUDE_TAGS`, comma separated.
- For tighter control, tag the homes you want listed in OwnerRez (for example `Direct Booking`)
  and set `REQUIRE_TAG = "Direct Booking"`.

## Check on first run

These follow OwnerRez's published API docs, but couldn't be tested against your live account yet:

1. **Listing content (photos, description, amenities, bedrooms).** OwnerRez requires either the
   WordPress Plugin + Integrated Websites premium or a self-use OAuth app for these. If property
   pages show only one photo and no description, the token lacks listing access. Fix: create an
   OAuth app in OwnerRez, click Grant Access To Me, put that access token in `OWNERREZ_TOKEN`, and
   leave `OWNERREZ_EMAIL` blank. Everything else keeps working either way.
2. **Pricing.** Pick dates on a property and confirm the total matches what OwnerRez quotes for
   the same stay.
3. **Date search on the home page.** Search a weekend you know is booked at one home and confirm
   that home drops out.
4. **Full booking.** Book a cheap stay with your own card, then cancel and refund it in OwnerRez.
   Reserve creates a quote and sends the guest to OwnerRez's payment page, where they enter
   their name, email, and phone (OwnerRez does not pre-fill that page).

## Tracking (Google Analytics 4, Google Tag Manager, Clarity)

The same accounts as the WordPress site, set in `wrangler.toml`: `GTM_ID`, `GA4_ID`, `CLARITY_ID`.

- Tags load only on the production domain (`SITE_URL`). To test on the workers.dev address, open any
  page with `?track=on` (sets a one-day cookie; `?track=off` clears it). Test visits are marked
  `debug_mode`, so they show in GA4 DebugView.
- Site events are sent with `gtag('event', ...)`. GA4 receives them directly, and GTM can use them
  as Custom Event triggers (for Google Ads or Meta tags).
- The GA4 linker adds `_gl` to the OwnerRez checkout link, so the visit carries over to
  app.ownerrez.com. In GA4 also add both domains under Admin > Data streams > Configure tag
  settings > Configure your domains.

| Event | When | Main parameters |
|---|---|---|
| `search` | Search results with dates | `check_in`, `check_out`, `guests` |
| `view_item` | A home's page opens | `items` (home ID and name) |
| `view_quote` | A price is shown for chosen dates | `value` (total), `nights`, `guests`, `items` |
| `reserve_click` | Reserve is clicked, just before OwnerRez checkout | `value`, `nights`, `guests`, `items` |
| `inquiry_open` | "Have a question for us?" is opened | `items` |
| `contact_click` | A call, text, or email link is clicked | `method` (tel, sms, email) |
| `generate_lead` | An inquiry is sent through the OwnerRez widget (see below) | `check_in`, `check_out`, `guests`, `items` |
| `booking_complete` | Guest returns to `/thank-you` after paying | `transaction_id` (ORB...), `value`, `items` |

`generate_lead` needs this one line in OwnerRez, under Settings > Widgets > Booking/Inquiry widget >
Change > Conversion Tracking > **Inquiry Sent**. OwnerRez runs it inside the widget when an inquiry is
sent, and it tells the property page:

```html
<script>try { window.parent.postMessage({ irishmgmt: 'inquiry_sent' }, '*'); } catch (e) {}</script>
```

OwnerRez itself sends the main booking conversion from its checkout (Settings > Advanced Tools >
Analytics Tracking): GA4 `begin_checkout` and `purchase`, and the Meta Pixel `InitiateCheckout` and
`Purchase`. `booking_complete` is a backup with a different name, so it never double counts the
purchase. It only fires for guests who wait for (or click) OwnerRez's 20 second redirect, and only for
bookings made in the last 6 hours.

## Search engines and AI assistants

- Every page has a canonical URL, Open Graph and Twitter tags, and schema.org JSON-LD: the business
  (`LodgingBusiness`) on every page, `VacationRental` on each home (photos, rooms, beds, amenities,
  location rounded to the block, rating and reviews), an `ItemList` on browse pages, and an FAQ on the
  home page (`FAQPage`, with numbers from live OwnerRez data).
- `/sitemap.xml`, `/robots.txt`, and `/llms.txt` (a plain summary for AI assistants) are generated from
  OwnerRez, so new homes appear automatically.
- Date searches and filtered views are `noindex` and point their canonical at the plain page.
- **The site only allows indexing on its production domain.** Indexing turns on when the request comes
  from `SITE_URL`; on the workers.dev test address every page is `noindex` and robots.txt disallows
  everything, so the test copy never competes with the live site.

Going live: add the custom domain to the Worker, set `SITE_URL` to it, make sure Cloudflare's
"Block AI bots" / AI crawler controls allow AI search crawlers on that domain, then submit
`/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

## Limits and costs

- OwnerRez allows 300 API requests every 5 minutes per IP. The site caches property data for
  15 minutes, listing content for 30 minutes, and calendars and prices for 5 minutes.
- Cloudflare Workers' free plan covers 100,000 requests a day. The $5 a month plan raises that a lot.

## Good next steps

- Add Cloudflare Turnstile to the guest form to block bots.
- Add Google Analytics or a Meta pixel in `layout()` in `src/pages.js`.
