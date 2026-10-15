// Area guide content for /area-guide. Edit the lists here; the page, its jump links, and its
// search engine data are built from them. Photos live in public/img/guide/.
// Keep `area` only where we are sure of it; leave it out otherwise.

export const GUIDE_INTRO = 'South Bend blends small-town charm with real city energy. Set along the St. Joseph River and home to the University of Notre Dame, it has great local dining, outdoor spaces, museums, and plenty to do between game days.';

export const NOTRE_DAME = [
  {
    name: 'Visit the campus',
    url: 'https://experience.nd.edu/',
    text: 'Explore the University of Notre Dame campus, known for its stunning architecture and rich history. Don’t miss the Golden Dome, the Basilica of the Sacred Heart, and the Grotto of Our Lady of Lourdes.',
  },
  {
    name: 'Notre Dame Stadium',
    url: 'https://fightingirish.com/facilities-3/notre-dame-stadium/',
    photo: '/img/guide/stadium.jpg',
    text: 'Catch a Fighting Irish football game at historic Notre Dame Stadium. The atmosphere on game day is unforgettable.',
  },
];

// Sections shown as card grids, in page order.
export const GUIDE_SECTIONS = [
  {
    id: 'eat', title: 'Eat', heading: 'Where to eat', photo: '/img/guide/eat.jpg',
    intro: 'Local favorites for a big group dinner, a date night, or a pub meal after the game.',
    kind: 'Restaurant',
    places: [
      { name: 'LaSalle Grill', area: 'Downtown South Bend', url: 'https://www.lasallegrill.com/', text: 'Upscale modern American dining with prime steaks and fresh seafood. Elegant and polished, a go-to for special occasions.' },
      { name: 'Fiddler’s Hearth', url: 'https://fiddlershearth.com/', text: 'An authentic Irish pub with shepherd’s pie, fish and chips, and bangers and mash, plus live music.' },
      { name: 'Cafe Navarre', area: 'Downtown South Bend', url: 'https://www.cafenavarre.co/', text: 'French, Spanish, and Italian influences in a beautifully restored historic building. Perfect for a special night out.' },
      { name: 'Woochi Japanese Fusion & Bar', area: 'Downtown South Bend', url: 'https://www.notjustsushi.com/', text: 'Fresh sushi, creative fusion dishes, and bold cocktails in a lively setting.' },
    ],
  },
  {
    id: 'drink', title: 'Drink', heading: 'Bars and nightlife', photo: '/img/guide/drink.jpg',
    intro: 'From a whiskey bar to a neighborhood classic, here is where to raise a glass.',
    kind: 'BarOrPub',
    places: [
      { name: 'The Exchange Whiskey Bar', url: 'https://theexchangebars.com/south-bend/', text: 'An extensive whiskey selection from around the world in an intimate, historic setting.' },
      { name: 'Corby’s Irish Pub', url: 'http://www.corbysirishpub.com/', text: 'A lively local favorite with a casual vibe. The place to catch a game and hang out with friends.' },
      { name: 'Hammer & Quill', url: 'https://www.thehammerandquill.com/', text: 'A stylish, cozy cocktail bar known for expertly crafted drinks and artisanal small plates.' },
      { name: 'South Bend Brew Werks', url: 'https://www.southbendbrewwerks.com/', text: 'A community brewery pouring locally crafted beers in a friendly, relaxed taproom.' },
    ],
  },
  {
    id: 'sweets', title: 'Sweet treats', heading: 'Ice cream and sweet treats',
    intro: 'Save room for dessert. These are worth the drive.',
    kind: 'IceCreamShop',
    places: [
      { name: 'The Chief Ice Cream', url: 'https://chieficecream.com/', text: 'A local favorite since 1962 with homemade flavors, from classic vanilla to banana cream pie.' },
      { name: 'Vanilla Bean Creamery', area: 'Mishawaka', url: 'https://www.vanillabeanicecream.com/', text: 'Handcrafted ice cream in classic and creative flavors at a charming local spot.' },
      { name: 'Urban Swirl & Scoop', area: 'Granger', url: 'https://www.urbanswirlandscoop.com/', text: 'Frozen yogurt, ice cream, and a big toppings bar. A great stop for families.' },
    ],
  },
  {
    id: 'do', title: 'Things to do', heading: 'Things to do',
    intro: 'Adventures, museums, parks, and a night out, all a short drive from your rental.',
    kind: 'TouristAttraction',
    places: [
      { name: 'East Race Waterway', photo: '/img/guide/east-race.jpg', url: 'https://eastracewaterway.com/', text: 'White-water rafting right in the city, for all skill levels. Bring a change of clothes!' },
      { name: 'South Bend Cubs', area: 'Four Winds Field, downtown', photo: '/img/guide/cubs.jpg', url: 'https://www.milb.com/south-bend', text: 'Minor League Baseball from the Chicago Cubs’ affiliate, with a splash pad, a tiki hut, and great ballpark food.' },
      { name: 'Potawatomi Zoo', photo: '/img/guide/zoo.jpg', url: 'https://www.potawatomizoo.org/', text: 'Indiana’s oldest zoo, home to more than 400 animals, with new exhibits and hands-on encounters.' },
      { name: 'Studebaker National Museum', photo: '/img/guide/studebaker.jpg', url: 'https://www.studebakermuseum.org/', text: 'South Bend’s automotive heritage: classic cars, wagons, and military vehicles from the Studebaker Corporation.' },
      { name: 'Raclin Murphy Museum of Art', area: 'Notre Dame campus', photo: '/img/guide/museum.jpg', url: 'https://raclinmurphymuseum.nd.edu/', text: 'Notre Dame’s art museum, the successor to the Snite, with works from ancient to contemporary times.' },
      { name: 'St. Patrick’s County Park', photo: '/img/guide/st-patricks.jpg', url: 'https://www.sjcparks.org/592/St-Patricks', text: 'Hiking, fishing, and bird watching along the St. Joseph River.' },
      { name: 'Rum Village Nature Center', photo: '/img/guide/rum-village.jpg', url: 'https://sbvpa.org/places/rum-village-park/', text: 'Wooded hiking trails, a nature center, and an aerial adventure park.' },
      { name: 'Four Winds Casino', photo: '/img/guide/four-winds.jpg', url: 'https://fourwindscasino.com/southbend/', text: 'Gaming, live entertainment, and plenty of dining for a night out.' },
    ],
  },
];

export const GETTING_AROUND = {
  name: 'Rides2U',
  url: 'https://rides2u.com/',
  code: '340-970',
  text: 'Getting around South Bend, Mishawaka, and Notre Dame is simple with Rides2U. Book at least 12 hours ahead for a pre-scheduled pickup with a vetted driver. You get full driver details and a photo before pickup. No surge pricing, just a dependable ride for game day, an airport run to South Bend International, or a night out.',
};

export const VISIT_SOUTH_BEND = {
  name: 'Visit South Bend Mishawaka',
  url: 'https://www.visitsouthbend.com/things-to-do/',
  text: 'The official visitor guide to attractions, events, dining, and local gems across the South Bend area.',
};
