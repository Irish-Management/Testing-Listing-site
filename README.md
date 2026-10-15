# Irish Management direct booking site

A guest-facing booking site that runs on Cloudflare Workers and pulls everything live from OwnerRez:
properties, photos, descriptions, amenities, availability, and full pricing with fees and taxes.
Guests pick dates, see the real total, enter their name and email, and are sent to OwnerRez's
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
`/reviews`, `/terms`, `/privacy-policy`, `/sitemap`, `/thank-you`.

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
   Each booking attempt creates a guest record in OwnerRez.

## Limits and costs

- OwnerRez allows 300 API requests every 5 minutes per IP. The site caches property data for
  15 minutes, listing content for 30 minutes, and calendars and prices for 5 minutes.
- Cloudflare Workers' free plan covers 100,000 requests a day. The $5 a month plan raises that a lot.

## Good next steps

- Add Cloudflare Turnstile to the guest form to block bots.
- Look up existing guests by email before creating a new one, to avoid duplicates.
- Add Google Analytics or a Meta pixel in `layout()` in `src/pages.js`.
