import type { HousingMapLocation } from '../domain/housing-map.ts';

export const GROUP_A_HOUSING_CHECKED = '2026-10-27';
export const GROUP_A_HOUSING_SOURCE = 'https://housing.utdallas.edu/';
export const GROUP_A_RENTING_SOURCE = 'https://icp.utdallas.edu/resources/housing/apartment-resource/';
/** Coordinates read from UTD's public campus map, Housing category 42141.
 * These supplemental pins are passed only by Group A; baseline map pins stay intact.
 */
export const GROUP_A_ON_CAMPUS_HOUSING: readonly HousingMapLocation[] = [
  { id: 'group-a-housing-commons', name: 'University Commons · Andromeda Hall', latitude: 32.99052, longitude: -96.754654, layer: 'campus', sourceUrl: 'https://map.concept3d.com/?id=1772#!m/434478', url: 'https://housing.utdallas.edu/housing-options/university-commons/', reviewedOn: GROUP_A_HOUSING_CHECKED, note: 'University Commons serves first-year students. This is the published Andromeda Hall building pin, not an assigned room or check-in entrance. Confirm eligibility, availability and your move-in instructions with University Housing.' },
  { id: 'group-a-housing-village', name: 'University Village · housing office', latitude: 32.989395, longitude: -96.754898, layer: 'campus', sourceUrl: 'https://map.concept3d.com/?id=1772#!m/434556', url: 'https://housing.utdallas.edu/housing-options/university-village/', reviewedOn: GROUP_A_HOUSING_CHECKED, note: 'Unfurnished apartments for non-first-year students. Pin marks the University Village Housing Office, not every apartment or an assigned home. Follow your assigned building and check-in instructions.' },
  { id: 'group-a-housing-cch-north', name: 'Canyon Creek Heights North', latitude: 32.981586, longitude: -96.755264, layer: 'campus', sourceUrl: 'https://map.concept3d.com/?id=1772#!m/434482', url: 'https://housing.utdallas.edu/housing-options/canyon-creek-heights/', reviewedOn: GROUP_A_HOUSING_CHECKED, note: 'Furnished apartments for sophomore, junior, senior and graduate students. Published North building pin only; confirm availability, your assigned building and the correct check-in entrance.' },
  { id: 'group-a-housing-cch-south', name: 'Canyon Creek Heights South', latitude: 32.980637, longitude: -96.755341, layer: 'campus', sourceUrl: 'https://map.concept3d.com/?id=1772#!m/434481', url: 'https://housing.utdallas.edu/housing-options/canyon-creek-heights/', reviewedOn: GROUP_A_HOUSING_CHECKED, note: 'Furnished apartments for sophomore, junior, senior and graduate students. Published South building pin only; confirm availability, your assigned building and the correct check-in entrance.' },
];
