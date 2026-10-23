import { CAMPUS_REFERENCE, HOUSING_DISTANCES_UPDATED } from '../data/local-options.ts';
import { CAMPUS_ESSENTIALS, CAMPUS_GUIDE_REVIEWED, CAMPUS_PLACES, campusPlace } from '../data/campus-guide.ts';
import { COMMUNITY_TRANSIT, TRANSIT_FEED_END, TRANSIT_REVIEWED } from '../data/community-transit.ts';
import { NEIGHBORHOOD_PLACES, NEIGHBORHOOD_REVIEWED, type NeighborhoodCategory } from '../data/neighborhood-places.ts';

export type HousingMapLayer = 'apartments' | 'campus' | 'grocery' | 'restaurants' | 'pharmacies' | 'transportation' | 'essentials';

export const MAP_LAYER_LABELS: Readonly<Record<HousingMapLayer, string>> = Object.freeze({
  apartments: 'Apartments',
  campus: 'Campus',
  grocery: 'Groceries',
  restaurants: 'Restaurants',
  pharmacies: 'Pharmacies',
  transportation: 'Transit stops',
  essentials: 'Everyday essentials',
});

export type HousingMapLocation = {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  layer: HousingMapLayer;
  /** Existing coordinate reference; this is never a new geocoding result. */
  sourceUrl: string;
  reviewedOn: string;
  note?: string;
  /** A visitor-facing business, service, or trip-planner page. */
  url?: string;
};

type Coordinates = Pick<HousingMapLocation, 'latitude' | 'longitude'>;

function assertCoordinates(location: Coordinates): void {
  if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)
    || Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180) {
    throw new RangeError('A map location needs valid latitude and longitude.');
  }
}

/** Google receives only the selected public destination, never profile data or a stored home origin. */
export function directionsUrl(location: Coordinates): string {
  assertCoordinates(location);
  const params = new URLSearchParams({ api: '1', destination: `${location.latitude},${location.longitude}` });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

const neighborhoodLayers: Partial<Record<NeighborhoodCategory, HousingMapLayer>> = {
  grocery: 'grocery',
  restaurant: 'restaurants',
  pharmacy: 'pharmacies',
  retail: 'essentials',
};

// Retain the existing readable source page. The underlying GTFS ZIP is research
// evidence, not a navigation target for people exploring nearby stops.
const transitSource = 'https://www.dart.org/about/about-dart/fixed-route-schedule';
const transitPlanner = 'https://www.dart.org/trip/trip-planner/trip-planner-map';

function transitLocations(): HousingMapLocation[] {
  const stops = new Map<string, { location: HousingMapLocation; routeIds: Set<string> }>();
  for (const community of Object.values(COMMUNITY_TRANSIT)) {
    for (const stop of community.stops) {
      const existing = stops.get(stop.id);
      if (existing) {
        if (existing.location.name !== stop.name || existing.location.latitude !== stop.latitude || existing.location.longitude !== stop.longitude) {
          throw new Error(`Conflicting public transit stop: ${stop.id}`);
        }
        stop.routeIds.forEach(id => existing.routeIds.add(id));
        continue;
      }
      stops.set(stop.id, {
        location: {
          id: `transit-stop-${stop.id}`,
          name: stop.name,
          latitude: stop.latitude,
          longitude: stop.longitude,
          layer: 'transportation',
          sourceUrl: transitSource,
          reviewedOn: TRANSIT_REVIEWED,
          url: transitPlanner,
        },
        routeIds: new Set(stop.routeIds),
      });
    }
  }
  return [...stops.values()].map(({ location, routeIds }) => ({
    ...location,
    note: `Routes in the reviewed snapshot: ${[...routeIds].sort().join(', ')}. Published stop pin; not a walking route or travel time. Schedule data covered ${TRANSIT_REVIEWED} through ${TRANSIT_FEED_END}. Confirm current service with DART.`,
  }));
}

/**
 * A finite source-reviewed starting list, not live Google Places results or a
 * complete nearby-business directory. Apartment pins are supplied separately
 * from the existing filtered housing list. Co-located services keep distinct
 * identities (for example, a pharmacy inside a grocery store).
 */
export const CURATED_MAP_LOCATIONS: readonly HousingMapLocation[] = [
  {
    id: 'campus-address',
    name: CAMPUS_REFERENCE.name,
    address: CAMPUS_REFERENCE.address,
    latitude: CAMPUS_REFERENCE.latitude,
    longitude: CAMPUS_REFERENCE.longitude,
    layer: 'campus',
    sourceUrl: CAMPUS_REFERENCE.url,
    url: CAMPUS_REFERENCE.url,
    reviewedOn: HOUSING_DISTANCES_UPDATED,
    note: 'Campus address reference used for housing distances. This is not the campus center, a classroom, or an entrance.',
  },
  ...CAMPUS_PLACES.map((place): HousingMapLocation => ({
    id: `campus-${place.id}`,
    name: place.name,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    layer: 'campus',
    sourceUrl: place.coordinateSourceUrl,
    url: place.sourceUrl,
    reviewedOn: CAMPUS_GUIDE_REVIEWED,
    note: `${place.description} Building pin only; confirm the entrance and room.`,
  })),
  ...NEIGHBORHOOD_PLACES.flatMap((place): HousingMapLocation[] => {
    const layer = neighborhoodLayers[place.category];
    if (!layer || !place.coordinates) return [];
    const approximate = place.coordinates.sourceUrl.startsWith('https://geocoding.geo.census.gov/');
    return [{
      id: `nearby-${place.id}`,
      name: place.name,
      address: place.address,
      latitude: place.coordinates.latitude,
      longitude: place.coordinates.longitude,
      layer,
      sourceUrl: place.coordinates.sourceUrl,
      url: place.url,
      reviewedOn: NEIGHBORHOOD_REVIEWED,
      note: `${place.description} ${approximate ? 'Approximate street-address point; confirm the entrance.' : 'Published business pin; confirm the entrance.'} Check current hours before visiting.`,
    }];
  }),
  ...CAMPUS_ESSENTIALS.map((essential): HousingMapLocation => {
    const place = campusPlace(essential.placeId);
    return {
      id: `essential-${essential.id}`,
      name: essential.name,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      layer: 'essentials',
      sourceUrl: place.coordinateSourceUrl,
      url: essential.url,
      reviewedOn: CAMPUS_GUIDE_REVIEWED,
      note: `${essential.location}. ${essential.description} Building pin only; confirm the entrance and room.`,
    };
  }),
  ...transitLocations(),
];

const curatedIds = new Set<string>();
for (const location of CURATED_MAP_LOCATIONS) {
  assertCoordinates(location);
  if (curatedIds.has(location.id)) throw new Error(`Duplicate public map location: ${location.id}`);
  curatedIds.add(location.id);
}
