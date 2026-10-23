import { COMMUNITY_TRANSIT } from './community-transit.ts';
import { EXPANDED_APARTMENTS } from './housing-expansion.ts';
/** Curated source review, not a vacancy, price, routing, or utility-eligibility feed. */
export const LOCAL_OPTIONS_REVIEWED = '2026-10-03';
export const HOUSING_DISTANCES_UPDATED = '2026-10-06';
export const HOUSING_DIRECTORY_REVIEWED = '2026-10-06';

export const CAMPUS_REFERENCE = {
  name: 'UT Dallas campus address',
  address: '800 W Campbell Rd, Richardson, TX 75080',
  latitude: 32.978326885573,
  longitude: -96.745489886754,
  url: 'https://www.utdallas.edu/about-us/contact-location/',
};

export const HOUSING_DISTANCE_NOTE = 'Approximate straight-line miles to UTD’s campus address at 800 W Campbell Rd. Campus entrances and your classroom may be closer or farther. Open directions for current travel routes and times.';
export const HOUSING_AVAILABILITY_NOTE = 'A curated shortlist within 15 miles, ordered by distance. Check the community’s own site for current availability, total rent, lease terms, and application requirements.';
export const ELECTRICITY_COMPARISON_NOTE = 'These are three providers to compare, not a price ranking or a guarantee of service. Confirm your exact apartment address, unit, and start date with the provider. First ask your housing office whether electricity is included or billed by the property.';
export const ELECTRICITY_TERRITORY_NOTE = 'A ZIP code can cover different service areas. Municipal and cooperative service areas may not offer retail provider choice. Use Power to Choose or ask your housing office to confirm who serves your exact address.';
export const POWER_TO_CHOOSE_URL = 'https://www.powertochoose.org/';

export type ApartmentOption = {
  id: string;
  name: string;
  address: string;
  zip: string;
  distanceMiles: number;
  latitude: number;
  longitude: number;
  coordinateSourceUrl: string;
  coordinateNote: string;
  url: string;
  directionsUrl: string;
};

function directions(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(address)}&destination=${encodeURIComponent('The University of Texas at Dallas, 800 W Campbell Rd, Richardson, TX 75080')}`;
}

// Property details reviewed separately from the coordinate references below.
const apartmentDetails: Omit<ApartmentOption, 'distanceMiles' | 'latitude' | 'longitude' | 'coordinateSourceUrl' | 'coordinateNote'>[] = [
  {
    id: 'northside', name: 'Northside',
    address: '3000 Northside Blvd, Richardson, TX 75080', zip: '75080',
    url: 'https://www.liveatnorthside.com/',
    directionsUrl: directions('Northside, 3000 Northside Blvd, Richardson, TX 75080'),
  },
  {
    id: 'marquis-at-waterview', name: 'Marquis at Waterview',
    address: '800 W Renner Rd, Richardson, TX 75080', zip: '75080',
    url: 'https://www.marquiswaterview.com/',
    directionsUrl: directions('Marquis at Waterview, 800 W Renner Rd, Richardson, TX 75080'),
  },
  {
    id: 'palencia', name: 'Palencia',
    address: '17817 Coit Rd, Dallas, TX 75252', zip: '75252',
    url: 'https://www.palencialiving.com/',
    directionsUrl: directions('Palencia, 17817 Coit Rd, Dallas, TX 75252'),
  },
  {
    id: 'james-at-canyon-creek', name: 'The James at Canyon Creek',
    address: '850 Greenside Dr, Richardson, TX 75080', zip: '75080',
    url: 'https://www.thejamesatcanyoncreek.com/',
    directionsUrl: directions('The James at Canyon Creek, 850 Greenside Dr, Richardson, TX 75080'),
  },
  {
    id: 'pradera', name: 'The Pradera',
    address: '851 Greenside Dr, Richardson, TX 75080', zip: '75080',
    url: 'https://thepradera.com/',
    directionsUrl: directions('The Pradera, 851 Greenside Dr, Richardson, TX 75080'),
  },
  {
    id: 'estates-of-richardson', name: 'Estates of Richardson',
    address: '955 W President George Bush Hwy, Richardson, TX 75080', zip: '75080',
    url: 'https://www.rentanapt.com/apartments/tx/richardson/estates-of-richardson/',
    directionsUrl: directions('Estates of Richardson, 955 W President George Bush Hwy, Richardson, TX 75080'),
  },
  {
    id: 'maa-eastside', name: 'MAA Eastside',
    address: '1801 N Greenville Ave, Richardson, TX 75081', zip: '75081',
    url: 'https://www.maac.com/texas/dallas/maa-eastside/',
    directionsUrl: directions('MAA Eastside, 1801 N Greenville Ave, Richardson, TX 75081'),
  },
  {
    id: 'estates-on-frankford', name: 'Estates on Frankford',
    address: '7575 Frankford Rd, Dallas, TX 75252', zip: '75252',
    url: 'https://www.rentanapt.com/apartments/tx/dallas/estates-on-frankford/',
    directionsUrl: directions('Estates on Frankford, 7575 Frankford Rd, Dallas, TX 75252'),
  },
];

/** Shared property references keep housing and nearby-stop distances consistent. */
export function campusDistanceMiles(reference: {latitude: number; longitude: number}): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(reference.latitude - CAMPUS_REFERENCE.latitude);
  const longitudeDelta = radians(reference.longitude - CAMPUS_REFERENCE.longitude);
  const arc = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(CAMPUS_REFERENCE.latitude)) * Math.cos(radians(reference.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 3958.7613 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

// Sort the unrounded values; the interface displays one decimal.
export const APARTMENTS: ApartmentOption[] = [
  ...apartmentDetails.map(apartment => {
    const reference = COMMUNITY_TRANSIT[apartment.id].reference;
    return {
      ...apartment,
      latitude: reference.latitude,
      longitude: reference.longitude,
      coordinateSourceUrl: reference.sourceUrl,
      coordinateNote: reference.quality === 'official-property-map'
        ? 'Official property map pin; confirm the leasing entrance.'
        : 'Approximate street-address point; confirm the leasing entrance.',
      distanceMiles: campusDistanceMiles(reference),
    };
  }),
  ...EXPANDED_APARTMENTS.map(apartment => ({
    ...apartment,
    directionsUrl: directions(`${apartment.name}, ${apartment.address}`),
    distanceMiles: campusDistanceMiles(apartment),
  })),
].sort((a,b) => a.distanceMiles - b.distanceMiles);

/** Intentionally alphabetical: no invented price, quality, or serviceability ranking. */
export const ELECTRICITY_PROVIDERS = [
  {
    id: 'gexa', name: 'Gexa Energy', url: 'https://www.gexaenergy.com/',
    description: 'Enter your ZIP code to explore plans. Check the Electricity Facts Label for usage credits, fees, and contract length.',
  },
  {
    id: 'reliant', name: 'Reliant', url: 'https://www.reliant.com/en/residential/electricity/electricity-plans/compare-plans',
    description: 'Compare residential and apartment plans using your service location. Review the total price at your expected usage.',
  },
  {
    id: 'txu', name: 'TXU Energy', url: 'https://www.txu.com/plan-offers',
    description: 'Check plans for your new address. Compare delivery charges, deposits, cancellation fees, and the service start date.',
  },
] as const;

export const HOUSING_SOURCES = [
  { name: 'UT Dallas campus address', url: CAMPUS_REFERENCE.url },
  { name: 'Census address geocoding method', url: 'https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html' },
  ...APARTMENTS.map(({ name, url }) => ({ name, url })),
];

export const ELECTRICITY_SOURCES = [
  { name: 'Texas Power to Choose', url: POWER_TO_CHOOSE_URL },
  { name: 'Gexa service areas', url: 'https://www.gexaenergy.com/residential/service-areas' },
  { name: 'Reliant in Richardson', url: 'https://www.reliant.com/en/residential/electricity/areas-we-serve/dfw-north-texas/richardson' },
  { name: 'TXU Energy in Dallas', url: 'https://www.txu.com/en/electric-rates/dallas' },
];

/** Coarse city context from the sourced community directory, never unit eligibility. */
export function electricityGuide(housingCommunity?: string, housingZip?: string) {
  const community = APARTMENTS.find(option => option.id === housingCommunity);
  const zip = community?.zip || housingZip || '';
  const localAreas: Record<string, 'Dallas' | 'Richardson'> = {
    '75080': 'Richardson', '75081': 'Richardson', '75252': 'Dallas',
  };
  const area = Object.hasOwn(localAreas, zip) ? localAreas[zip] : null;
  const providers = ELECTRICITY_PROVIDERS.map(provider => ({
    ...provider,
    url: area && provider.id === 'reliant'
      ? `https://www.reliant.com/en/residential/electricity/areas-we-serve/dfw-north-texas/${area.toLowerCase()}`
      : area && provider.id === 'gexa' ? 'https://www.gexaenergy.com/residential/service-areas'
        : area === 'Dallas' && provider.id === 'txu' ? 'https://www.txu.com/en/electric-rates/dallas'
          : provider.url,
  }));
  return { community, zip, area, providers,
    heading: area ? `Three options to explore around ${area}` : 'General DFW provider examples',
    locationNote: area
      ? `Our local guide covers the ${area} area around ZIP ${zip}. Use this ZIP on the provider’s site, then confirm your full service address and unit.`
      : zip ? `We haven’t established local coverage for ZIP ${zip}. The examples below are general DFW references, not results matched to this ZIP. Ask your housing contact who serves the address; for Texas homes, check Power to Choose.`
        : 'Choose a community or add its ZIP when you know it. For now, these are general Dallas–Fort Worth examples.',
  };
}
