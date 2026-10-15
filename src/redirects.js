// Redirects from the old WordPress site (stayirish.com) so links and Google rankings carry over.
// Used by redirectLegacy() in worker.js. All redirects are permanent (301).

// Old home pages (/property/<slug>/) -> OwnerRez property ID on this site. Matched by name in
// October 2026. Homes not listed here (or no longer listed) go to the all-homes page.
export const LEGACY_HOMES = {
  "2b-2ba-near-nd-private-balcony-walk-to-campus": 484603, // 2b-2ba-near-nd-private-balcony-walk-to-campus
  "2bd-2ba-condo-w-beach-access-pool-isla-del-sol": 417507, // 2bd-2ba-condo-w-beach-access-pool-isla-del-sol
  "38-acres-of-luxury-9br-indoor-pool-gym-near-nd": 395725, // 38-acres-of-luxury-9br-indoor-pool-gym-near-nd
  "3br-1ba-updated-south-bend-retreat-close-to-nd": 490995, // 3br-1ba-updated-south-bend-retreat-close-to-nd
  "3br-3ba-home-on-angela-blvd-steps-from-nd": 469513, // 3br-3ba-home-on-angela-blvd-steps-from-nd
  "4br-gameday-getaway-ev-charger-pet-friendly-10p": 409044, // 4br-gameday-getaway-ev-charger-pet-friendly-10p
  "9br-sorins-estate-w-pool-and-paddle-tennis-court-orp5b61fb0x": 401328, // 9br-sorin-s-estate-w-pool-and-paddle-tennis-court
  "across-from-nd-stadium-luxury-1br-1ba-sleeps-2": 492033, // across-from-nd-stadium-luxury-1br-1ba-sleeps-2
  "across-from-nd-stadium-luxury-5b-4ba-sleeps-12": 492034, // across-from-nd-stadium-luxury-5b-4ba-sleeps-12
  "across-from-nd-stadium-luxury-6b-5ba-sleeps-14": 481005, // across-from-nd-stadium-luxury-6b-5ba-sleeps-14
  "audubon-woods-retreat-4br-3ba-near-notre-dame": 478017, // audubon-woods-retreat-4br-3ba-near-notre-dame
  "blue-gold-haven4b-3ba-house": 455751, // blue-gold-haven-4b-3ba-house-1mi-to-nd-stadium
  "charming-4-bedroom-retreat-near-notre-dame": 419233, // charming-4-bedroom-retreat-near-notre-dame
  "claddagh-clover-retreat-3b-2ba-home-1-mi-to-nd": 463377, // claddagh-clover-retreat-3b-2ba-home-1-mi-to-nd
  "cozy-2-bedroom-home-near-notre-dame-perfect-for-game-day-stays": 422053, // cozy-2-bedroom-home-near-notre-dame-perfect-for-game-day-stays
  "cozy-4br-3ba-home-1-2-mi-walk-to-nd": 399031, // cozy-4br-3ba-home-1-2-mi-walk-to-nd
  "cozy-freshly-updated-3br-home-5-min-from-nd": 398615, // cozy-freshly-updated-3br-home-5-min-from-nd
  "cozy-home-w-sonos-walking-to-notre-dame": 395723, // cozy-home-w-sonos-walking-to-notre-dame
  "cozy-tiny-house-bungalow-7-blocks-from-campus": 395717, // cozy-tiny-house-bungalow-7-blocks-from-campus
  "emerald-clover3br-1bath-house-1-mile-from-nd": 470215, // emerald-clover-3br-1bath-house-1-mile-from-nd
  "fighting-irish-retreat-3br-4ba": 497186, // fighting-irish-retreat-3br-4ba
  "freshly-updated-5br2-5b-5min-to-nd-stadium": 398616, // freshly-updated-5br2-5b-5min-to-nd-stadium
  "game-day-luxury-2br-2ba-condo-near-notre-dame-private-balcony": 489692, // game-day-luxury-2br-2ba-condo-near-notre-dame-private-bal
  "golden-dome-getawaytownhome-1-5-mi-to-nd": 435867, // golden-dome-getaway-townhome-1-5-mi-to-nd
  "golden-dome-retreat-5br-0-7-miles-to-notre-dame": 494827, // golden-dome-retreat-5br-0-7-miles-to-notre-dame
  "golden-dome-retreat-lower-level-near-notre-dame": 495438, // golden-dome-retreat-lower-level-near-notre-dame
  "golden-dome-retreat-upper-level-near-notre-dame": 495439, // golden-dome-retreat-upper-level-near-notre-dame
  "golden-shamrock3br-home-3min-to-nd": 437378, // golden-shamrock-3br-home-3min-to-nd
  "irish-quarter-game-day-retreat-3bd-2ba": 485039, // irish-quarter-game-day-retreat-3bd-2ba
  "irish-retreat-at-the-pond-4-bedrooms-2-baths-close-to-nd": 481002, // nd-retreat-at-the-pond-4-bedrooms-2-baths-close-to-nd
  "irish-trail-retreat-1-2-miles-from-nd": 496674, // irish-trail-retreat-1-mile-from-nd
  "irish-victory-house-5br-4ba": 495857, // irish-victory-house-5br-4ba
  "kennan-hollow-farm-100-acres-on-river-sleeps-21-5br-4-5ba": 452517, // keenan-hollow-farm-100-acres-on-river-sleeps-15-5br-4-5ba
  "legends-landing-home-1-5mi-to-nd": 436636, // legends-landing-home-1-5mi-to-nd
  "luxury-2br-2ba-condo-walk-to-notre-dame": 487467, // luxury-2br-2ba-condo-walk-to-notre-dame
  "luxury-irish-quarter-escape-near-nd-2bd-2ba": 478283, // luxury-irish-quarter-escape-near-nd-2bd-2ba
  "luxury-irish-quarter-retreat-walk-to-notre-dame": 478285, // luxury-irish-quarter-retreat-walk-to-notre-dame
  "luxury-legacy-retreat-sleeps-10-south-bend": 496810, // luxury-legacy-retreat-sleeps-10-south-bend
  "luxury-notre-dame-retreat-2br-2ba-balcony-reserved-parking": 487298, // luxury-notre-dame-retreat-2br-2ba-balcony-reserved-parking
  "minutes-from-notre-dame-\u2618\ufe0f-4br-home-for-groups-sleeps-8-10": 467114, // minutes-from-notre-dame-4br-home-for-groups-sleeps-8-10
  "modern-cozy-home-4-min-drive-from-notre-dame": 395719, // modern-cozy-home-4-min-drive-from-notre-dame
  "modern-luxury-condo-walk-to-notre-dame-2br-2ba-parking": 484602, // modern-luxury-condo-walk-to-notre-dame-2br-2ba-parking
  "nd-luxury-townhome-8-min-to-nd-stadium": 450719, // nd-luxury-townhome-8-min-to-nd-stadium
  "nd-retreatluxury-3-b-3-5-ba-townhome-1-5mi-to-nd": 480302, // nd-retreat-luxury-3-b-3-5-ba-townhome-1-5mi-to-nd
  "new-4-bed-2-and-a-half-bath-near-nd-campus": 488323, // new-4-bed-2-and-a-half-bath-near-nd-campus
  "new-build-near-notre-dame-5br-4-5ba": 485265, // new-build-near-notre-dame-5br-4-5ba
  "newly-updated-smart-home-1-mile-from-nd-eddy-st": 395703, // newly-updated-smart-home-1-mile-from-nd-eddy-st
  "on-campus-home-updated-steps-from-hesburgh-10": 395727, // on-campus-home-updated-steps-from-hesburgh-10
  "perfect-notre-dame-weekend-home-0-8-miles-to-nd": 395722, // perfect-notre-dame-weekend-home-0-8-miles-to-nd
  "perfect-notre-dame-weekend-space-walk-to-campus": 395729, // perfect-notre-dame-weekend-space-walk-to-campus
  "rockne-retreat6br-3ba-home-close-to-nd": 492190, // rockne-retreat-6br-3ba-home-close-to-nd
  "rocknes-rallyupdated-3br-2-bathroom-home-1-mile": 449996, // rockne-s-rally-updated-3br-2-bathroom-home-1-mile-to-nd
  "shamrock-99-charming-family-home-1-5-miles-from-nd": 422051, // shamrock-99-charming-family-home-1-5-miles-from-nd
  "south-bend-serenity-mid-century-3br-5min-to-nd": 408493, // south-bend-serenity-mid-century-3br-5min-to-nd
  "spacious-4-bedroom-home-1-mile-to-notre-dame-stadium": 419655, // spacious-4-bedroom-home-1-mi-to-nd-stadium
  "spacious-nd-home-near-angela-blvd": 477961, // spacious-nd-home-near-angela-blvd
  "stylish-2br-cozy-home-10min-drive-from-nd": 395715, // stylish-3br-cozy-home-10min-drive-from-nd
  "stylish-notre-dame-haven-2br-2ba-private-balcony-parking": 492174, // stylish-notre-dame-haven-2br-2ba-private-balcony-parking
  "tdj-getaway4br-home-w-game-room": 432460, // tdj-getaway-4br-home-w-game-room
  "the-darby-condocozy-1br-condo": 466575, // the-darby-condo-cozy-1br-condo-1mi-to-nd-campus
  "the-dome-home3br-house-1mi-to-nd": 463623, // the-dome-home-3br-house-1mi-to-nd
  "the-domer-den-3br-3-5ba-home-1-5mi-to-nd-campus": 458819, // the-domer-den-3br-3-5ba-home-1-5mi-to-nd-campus
  "the-experience-at-notre-dame": 483158, // the-experience-at-notre-dame
  "the-huddle-hangout-3-bedroom-house-close-to-nd": 462883, // the-huddle-hangout-3-bedroom-house-close-to-nd
  "the-irish-charm5br-2ba-home-1mi-to-nd-campus": 466348, // the-irish-charm-5br-2ba-home-1mi-to-nd-campus
  "the-irish-grand-4br-home-0-5-mi-to-campus-sleeps-20": 455752, // the-irish-grand-4br-home-0-5-mi-to-campus-sleeps-20
  "the-irish-landing-2br-2ba-private-balcony": 492635, // the-irish-landing-2br-2ba-private-balcony
  "the-irish-retreat-2br-2ba-near-notre-dame-private-balcony": 492634, // the-irish-retreat-2br-2ba-near-notre-dame-private-balcony
  "the-modern-irish-4b-3-5ba-1-mi-to-nd-stadium": 499033, // the-modern-irish-4b-3-5ba-1-mi-to-nd-stadium
  "the-playbook-place2br-1ba-home-1-5mi-to-nd": 465739, // the-playbook-place-2br-1ba-home-1-5mi-to-nd
  "the-sorin-house-garage-loft": 401646, // the-sorin-house-garage-loft
  "the-sorin-house-main-house": 401644, // the-sorin-house-main-house
  "the-sorin-house-pool-house": 401645, // the-sorin-house-pool-house
  "the-victory-lounge-3b-3-5ba": 460167, // the-victory-lounge-3b-3-5ba-1-mi-to-nd
  "victory-views-estate-luxury-guest-loft": 405069, // victory-views-estate-luxury-guest-loft
  "victory-views-estate-luxury-retreat-for-25-guests": 404236, // victory-views-estate-luxury-retreat-for-25-guests
  "victory-views-main-house-luxury-retreat-for-20-guests": 405068, // victory-views-main-house-luxury-retreat-for-20-guests
  "walk-to-nd-luxury-2br-2ba-condo-balcony-parking": 486877, // walk-to-nd-luxury-2br-2ba-condo-balcony-parking
};

// Old home pages with no clear match yet. Add an entry above (old slug: property ID) to send one
// to a specific home; until then they go to the all-homes page.
//   807-twyckenham
//   artists-vintage-home-5-mins-from-nd-campus
//   beautifully-renovated-home-corner-of-nd-and-angela
//   entire-home-blocks-from-notre-dame-sleeps-8
//   family-home-walkable-to-notre-dame
//   luxury-estate-with-stadium-tdj-views-sleeps-20
//   luxury-nd-retreat-3bd-2-5ba-balcony
//   luxury-notre-dame-home-the-lucky-charm
//   the-isles-townhome-located-6-blocks-from-nd
//   the-shamrock-retreat-movie-nights-kids-nook-10
//   victory-villa-5-br-home-5-min-from-campusnd-living

// Other old pages: exact path (no trailing slash) -> new path.
export const LEGACY_PAGES = {
  "/property": "/s",
  "/listings/pet-friendly": "/s?petsok=1",
  "/events": "/listings/big-dates",
  "/contact": "/#contact",
  "/contact-us": "/#contact",
  "/feed": "/blog",
  "/category/uncategorized": "/blog",
};

// Old sections with nothing to replace them: any path starting with one of these goes home.
export const LEGACY_PREFIXES = ['/partners', '/faq', '/category', '/author', '/tag', '/blog/page'];

// WordPress short links (/?p=<id>) to blog posts.
export const LEGACY_POST_IDS = {
  6864: "building-a-more-connected-real-estate-experience",
  6670: "springtime-in-south-bend-plan-your-stay-with-irish-management",
  6633: "how-irish-management-handles-guest-relations-so-you-dont-have-to",
  6569: "your-winter-getaway-packing-guide-for-south-bend",
  6533: "why-professional-property-management-matters-for-short-term-rental-owners",
  6503: "booking-sites-vs-direct-booking",
  6403: "notre-dame-tailgate-tips",
};
