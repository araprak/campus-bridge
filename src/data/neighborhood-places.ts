import { APARTMENTS } from './local-options.ts';

/** Business addresses reviewed against their own location pages; not a live directory. */
export const NEIGHBORHOOD_REVIEWED = '2026-10-04';
export const NEIGHBORHOOD_NOTE = 'A few useful places around your community and its transit corridors. This is a curated starting list, not every nearby business. Open the store page for current hours and plan the full trip before leaving.';
export const NEIGHBORHOOD_TRANSIT_NOTE = 'A destination near a bus stop is not necessarily a direct ride from home. Check connections, direction, service days, crossings, and the final walk. Displayed stop distances are approximate straight-line distances from the business’s published map pin, not walking distances.';
export const NEIGHBORHOOD_TRANSIT_SOURCE = 'https://www.dart.org/transitdata/archive/V750-218-220-20261019.ZIP';

export type NeighborhoodCategory = 'grocery' | 'restaurant' | 'retail' | 'pharmacy' | 'fuel' | 'carwash';
export type NeighborhoodPlace = {
  id: string;
  name: string;
  category: NeighborhoodCategory;
  address: string;
  url: string;
  description: string;
  communityIds: string[];
  coordinates?: { latitude: number; longitude: number; sourceUrl: string };
  transit?: {
    routeId: string;
    stopId: string;
    stopName: string;
    straightLineMiles: number;
    note: string;
    sourceUrl: string;
  };
};

const WEST = ['estates-on-frankford', 'palencia'];
const RENNER = ['marquis-at-waterview', 'james-at-canyon-creek', 'pradera', 'estates-of-richardson'];
const NORTH = ['northside', ...RENNER];
const CRUISER = [...WEST, ...NORTH];
const CAMPBELL_STORE = 'https://local.tomthumb.com/tx/richardson/1380-w-campbell-rd.html';
const CUSTER_STORE = 'https://local.tomthumb.com/tx/richardson/3411-custer-pkwy.html';
const TARGET_STORE = 'https://www.target.com/sl/north-dallas-coit-road/1775';
const FUKURO = 'https://www.fukurotx.com/';
const CAMPBELL_STOP = {
  routeId: '883W', stopId: '19544', stopName: 'Campbell @ Coit — westbound', straightLineMiles: 0.12,
  note: 'Destination stop on 883 West. The opposite direction uses a different stop; check the trip and crossing.', sourceUrl: NEIGHBORHOOD_TRANSIT_SOURCE,
};
const CUSTER_STOP = {
  routeId: '883E', stopId: '31556', stopName: 'Renner @ Orchard Ridge — westbound', straightLineMiles: 0.08,
  note: 'Destination stop on 883 East; DART 232 also serves this stop. Check the correct side of Renner for your return.', sourceUrl: NEIGHBORHOOD_TRANSIT_SOURCE,
};

export const NEIGHBORHOOD_PLACES: NeighborhoodPlace[] = [
  {
    id: 'tom-thumb-campbell', name: 'Tom Thumb — Campbell Road', category: 'grocery',
    address: '1380 W Campbell Rd, Richardson, TX 75080', url: CAMPBELL_STORE,
    description: 'Groceries, prepared food, household essentials, and an in-store pharmacy.', communityIds: [...WEST, 'northside'],
    coordinates: { latitude: 32.980084487358596, longitude: -96.76688978780476, sourceUrl: CAMPBELL_STORE }, transit: CAMPBELL_STOP,
  },
  {
    id: 'sprouts-campbell', name: 'Sprouts Farmers Market — Richardson', category: 'grocery',
    address: '1343 W Campbell Rd, Richardson, TX 75080', url: 'https://www.sprouts.com/store/tx/richardson/richardson/',
    description: 'Produce, groceries, deli items, and a sandwich counter near Campbell and Coit.', communityIds: [...WEST, 'northside'],
    coordinates: { latitude: 32.976856, longitude: -96.76494, sourceUrl: 'https://www.sprouts.com/store/tx/richardson/richardson/' },
    transit: { routeId: '883W', stopId: '19545', stopName: 'Campbell @ Mimosa — eastbound', straightLineMiles: 0.11, note: 'Destination stop on 883 West. The store and stop pins are nearby; verify the path across the shopping center.', sourceUrl: NEIGHBORHOOD_TRANSIT_SOURCE },
  },
  {
    id: 'target-coit', name: 'Target — North Dallas Coit Road', category: 'retail',
    address: '16731 Coit Rd, Dallas, TX 75248', url: TARGET_STORE,
    description: 'Home basics, groceries, clothing, and a CVS pharmacy inside the store.', communityIds: CRUISER,
    coordinates: { latitude: 32.983052, longitude: -96.769579, sourceUrl: TARGET_STORE },
    transit: { routeId: '883W', stopId: '28903', stopName: 'Coit @ Lake Park — southbound', straightLineMiles: 0.09, note: 'Destination stop on 883 West and DART 241. Plan the final walk and any transfer from your community.', sourceUrl: NEIGHBORHOOD_TRANSIT_SOURCE },
  },
  {
    id: 'dominos-coit', name: 'Domino’s — Coit Road', category: 'restaurant',
    address: '17509 Coit Rd, Dallas, TX 75252', url: 'https://pizza.dominos.com/texas/dallas/17509-coit-road',
    description: 'Pizza for carryout or delivery. Check the menu and delivery address with the restaurant.', communityIds: WEST,
    coordinates: { latitude: 32.98924, longitude: -96.76826, sourceUrl: 'https://pizza.dominos.com/texas/dallas/17509-coit-road' },
    transit: { routeId: '883W', stopId: '29675', stopName: 'Coit @ McCallum — southbound', straightLineMiles: 0.04, note: 'Destination stop on 883 West and DART 241. Check the return journey; 883 West follows a loop.', sourceUrl: NEIGHBORHOOD_TRANSIT_SOURCE },
  },
  {
    id: 'taco-casa-coit', name: 'Taco Casa — Coit Road', category: 'restaurant',
    address: '18120 Coit Rd, Dallas, TX 75252', url: 'https://tacocasatexas.com/location/69-dallas/',
    description: 'A Coit Road restaurant option. This listing has a verified business address; its walking route from a bus stop has not been checked.', communityIds: WEST,
    coordinates: { latitude: 32.9980624, longitude: -96.7666722, sourceUrl: 'https://tacocasatexas.com/location/69-dallas/' },
  },
  {
    id: 'walmart-plano-coit', name: 'Walmart — Plano Coit', category: 'grocery',
    address: '425 Coit Rd, Plano, TX 75075', url: 'https://www.walmart.com/store/3482-plano-tx',
    description: 'Groceries, home supplies, and pharmacy. The 883 West shopping extension is limited to Friday and Sunday service.', communityIds: CRUISER,
    coordinates: { latitude: 33.004364, longitude: -96.771589, sourceUrl: 'https://www.walmart.com/store/3482-plano-tx' },
    transit: { routeId: '883W', stopId: '32976', stopName: 'Mapleshade @ Coit — westbound', straightLineMiles: 0.11, note: 'Friday and Sunday 883 West shopping extension only. Check today’s timetable; this stop is not on the regular weekday loop.', sourceUrl: NEIGHBORHOOD_TRANSIT_SOURCE },
  },
  {
    id: 'tom-thumb-custer', name: 'Tom Thumb — Custer Parkway', category: 'grocery',
    address: '3411 Custer Pkwy, Richardson, TX 75080', url: CUSTER_STORE,
    description: 'Groceries and everyday essentials in Custer Creek Village, with a pharmacy.', communityIds: NORTH,
    coordinates: { latitude: 32.99877290499229, longitude: -96.73063606023788, sourceUrl: CUSTER_STORE }, transit: CUSTER_STOP,
  },
  {
    id: 'wingstop-renner', name: 'Wingstop — West Renner Road', category: 'restaurant',
    address: '710 W Renner Rd, Suite 3, Richardson, TX 75080', url: 'https://locations.wingstop.com/tx/richardson/wingstop-2636-richardson-tx-75080',
    description: 'Wings and sides in the Renner/Custer shopping area.', communityIds: NORTH,
    coordinates: { latitude: 32.99802259619927, longitude: -96.72974838506975, sourceUrl: 'https://locations.wingstop.com/tx/richardson/wingstop-2636-richardson-tx-75080' },
    transit: { ...CUSTER_STOP, straightLineMiles: 0.05 },
  },
  {
    id: 'fukuro-northside', name: 'Fukuro — Northside', category: 'restaurant',
    address: '3000 Northside Blvd, Suite 600, Richardson, TX 75080', url: FUKURO,
    description: 'Ramen, sushi, poke, and tea in the Northside retail area.', communityIds: NORTH,
    coordinates: { latitude: 32.9937328, longitude: -96.7497448, sourceUrl: FUKURO },
    transit: { routeId: '883E', stopId: '34260', stopName: 'Synergy Park @ Northside — westbound', straightLineMiles: 0.05, note: 'Destination stop on 883 East. Plan your walking approach through the Northside retail area.', sourceUrl: NEIGHBORHOOD_TRANSIT_SOURCE },
  },
  {
    id: 'seven-eleven-northside', name: '7-Eleven — Northside', category: 'retail',
    address: '3000 Northside Blvd, Suite A100, Richardson, TX 75080', url: 'https://www.7-eleven.com/locations/tx/richardson/3000-northside-blvd-a-100-38342',
    description: 'A convenience store for small first-day essentials and snacks in the Northside complex.', communityIds: NORTH,
    coordinates: { latitude: 32.993195943627, longitude: -96.749383240394, sourceUrl: 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=3000+Northside+Blvd%2C+Richardson%2C+TX+75080&benchmark=Public_AR_Current&format=json' },
  },
  {
    id: 'pharmacy-campbell', name: 'Tom Thumb Pharmacy — Campbell', category: 'pharmacy',
    address: '1380 W Campbell Rd, Richardson, TX 75080', url: 'https://local.pharmacy.tomthumb.com/tx/richardson/1380-w-campbell-rd.html',
    description: 'Prescription and over-the-counter pharmacy inside Tom Thumb. Pharmacy hours can differ from store hours.', communityIds: [...WEST, 'northside'], transit: CAMPBELL_STOP,
    coordinates: { latitude: 32.980084487358596, longitude: -96.76688978780476, sourceUrl: CAMPBELL_STORE },
  },
  {
    id: 'pharmacy-custer', name: 'Tom Thumb Pharmacy — Custer', category: 'pharmacy',
    address: '3411 Custer Pkwy, Richardson, TX 75080', url: 'https://local.pharmacy.tomthumb.com/tx/richardson/3411-custer-pkwy.html',
    description: 'Pharmacy inside the Custer Parkway grocery store. Confirm hours and prescription needs directly.', communityIds: RENNER, transit: CUSTER_STOP,
    coordinates: { latitude: 32.99877290499229, longitude: -96.73063606023788, sourceUrl: CUSTER_STORE },
  },
  {
    id: 'whole-foods-cityline', name: 'Whole Foods Market — Cityline', category: 'grocery',
    address: '1411 E Renner Rd, Richardson, TX 75082', url: 'https://www.wholefoodsmarket.com/stores/cityline',
    description: 'Groceries, prepared food, and household basics in the CityLine area. Check the full trip; a direct bus ride from Eastside has not been established.', communityIds: ['maa-eastside'],
    coordinates: { latitude: 32.998618, longitude: -96.6986521, sourceUrl: 'https://www.wholefoodsmarket.com/stores/cityline' },
  },
  {
    id: 'tom-thumb-arapaho', name: 'Tom Thumb — Arapaho Village', category: 'grocery',
    address: '819 Arapaho Rd, Richardson, TX 75080', url: 'https://local.tomthumb.com/tx/richardson/819-arapaho-rd.html',
    description: 'Another Richardson grocery and pharmacy option. Plan the full journey from Eastside; no direct bus connection is claimed here.', communityIds: ['maa-eastside'],
    coordinates: { latitude: 32.96139819992371, longitude: -96.74981653690344, sourceUrl: 'https://local.tomthumb.com/tx/richardson/819-arapaho-rd.html' },
  },
  {
    id: 'menas-eastside', name: 'Mena’s Grill — Richardson', category: 'restaurant',
    address: '1851 N Greenville Ave, Suite 500, Richardson, TX 75081', url: 'https://menasgrill.squarespace.com/contact-us',
    description: 'Tex-Mex at the Shops at Eastside. Check the walking route within the development.', communityIds: ['maa-eastside'],
    coordinates: { latitude: 32.973653728638, longitude: -96.712865342349, sourceUrl: 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=1851+N+Greenville+Ave%2C+Richardson%2C+TX+75081&benchmark=Public_AR_Current&format=json' },
  },
  {
    id: 'cvs-renner', name: 'CVS Pharmacy — East Renner', category: 'pharmacy',
    address: '1555 E Renner Rd, Richardson, TX 75082', url: 'https://www.cvs.com/store-locator/richardson-tx-pharmacies/1555-east-renner-rd-richardson-tx-75082/storeid=10665',
    description: 'Pharmacy and personal-care supplies in the CityLine area. Confirm current hours and plan connections from home.', communityIds: ['maa-eastside'],
    coordinates: { latitude: 32.99777, longitude: -96.69608, sourceUrl: 'https://www.cvs.com/store-locator/richardson-tx-pharmacies/1555-east-renner-rd-richardson-tx-75082/storeid=10665' },
  },
  {
    id: 'racetrac-coit', name: 'RaceTrac — Coit', category: 'fuel',
    address: '620 Coit Rd, Plano, TX 75075', url: 'https://www.racetrac.com/locations/texas/plano/coit',
    description: 'Fuel and convenience store north of the turnpike. Check the station page for current access and fuel details.', communityIds: CRUISER,
    coordinates: { latitude: 33.008394, longitude: -96.766496, sourceUrl: 'https://www.racetrac.com/locations/texas/plano/coit' },
  },
  {
    id: 'quiktrip-beltline', name: 'QuikTrip — West Beltline', category: 'fuel',
    address: '522 W Beltline Rd, Richardson, TX 75080', url: 'https://locations.quiktrip.com/tx/richardson/522-w-beltline-rd',
    description: 'A Richardson fuel stop with a convenience store. Open directions for the drive from your community.', communityIds: ['maa-eastside'],
    coordinates: { latitude: 32.95153315086823, longitude: -96.73652101564139, sourceUrl: 'https://locations.quiktrip.com/tx/richardson/522-w-beltline-rd' },
  },
  {
    id: 'car-spa-coit', name: 'Car Spa — Dallas Coit Road', category: 'carwash',
    address: '18093 Coit Rd, Dallas, TX 75252', url: 'https://carspa.net/locations/dallas-car-wash/',
    description: 'Car wash and detailing on Coit Road. Check services, hours, and prices before driving over.', communityIds: [...WEST, 'northside', 'maa-eastside'],
    coordinates: { latitude: 32.997403074312, longitude: -96.767941032707, sourceUrl: 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=18093+Coit+Rd%2C+Dallas%2C+TX+75252&benchmark=Public_AR_Current&format=json' },
  },
  {
    id: 'whitewater-plano', name: 'WhiteWater Express — Plano Coit', category: 'carwash',
    address: '628 Coit Rd, Plano, TX 75075', url: 'https://www.whitewatercw.com/locations/plano',
    description: 'An express car wash near the Coit Road shopping area north of the turnpike.', communityIds: RENNER,
    coordinates: { latitude: 33.008966555796, longitude: -96.766644749993, sourceUrl: 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=628+Coit+Rd%2C+Plano%2C+TX+75075&benchmark=Public_AR_Current&format=json' },
  },
];

export function neighborhoodPlaces(communityId?: string, hasCar = false): NeighborhoodPlace[] {
  const eligible=NEIGHBORHOOD_PLACES.filter(place=>hasCar||(place.category!=='fuel'&&place.category!=='carwash'));
  const matched=communityId?eligible.filter(place=>place.communityIds.includes(communityId)):[];
  // A campus-area starting list remains useful without a researched community match.
  return matched.length?matched:eligible;
}

export function neighborhoodDirections(communityId: string|undefined, place: NeighborhoodPlace, mode: 'transit' | 'walking' | 'bicycling' | 'driving' = 'transit'): string {
  const community = APARTMENTS.find(option => option.id === communityId);
  const params = new URLSearchParams({ api: '1', destination: `${place.name}, ${place.address}`, travelmode: mode });
  if (community) params.set('origin', `${community.name}, ${community.address}`);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
