/**
 * Local subset of the Census Bureau 2026 Gazetteer ZCTA internal points.
 * Downloaded 2026-10-15; these are representative area points, not addresses,
 * postal delivery boundaries, or population-weighted/geometric centroids.
 */
export const HOUSING_ZIP_SOURCE = 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2026_Gazetteer/2026_Gaz_zcta_national.zip';
export const HOUSING_ZIP_SOURCE_PAGE = 'https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html';
export const HOUSING_ZIP_REVIEWED = '2026-10-15';
export type HousingZipCenter = { zip: string; latitude: number; longitude: number };
export const HOUSING_ZIP_CENTERS: readonly HousingZipCenter[] = [
  { zip: '75074', latitude: 33.033284, longitude: -96.672758 },
  { zip: '75075', latitude: 33.021268, longitude: -96.741558 },
  { zip: '75080', latitude: 32.976063, longitude: -96.742080 },
  { zip: '75081', latitude: 32.949566, longitude: -96.707420 },
  { zip: '75082', latitude: 32.994599, longitude: -96.666758 },
  { zip: '75093', latitude: 33.034224, longitude: -96.811608 },
  { zip: '75240', latitude: 32.930154, longitude: -96.792727 },
  { zip: '75243', latitude: 32.912633, longitude: -96.736637 },
  { zip: '75248', latitude: 32.969699, longitude: -96.797334 },
  { zip: '75252', latitude: 32.996776, longitude: -96.788479 },
  { zip: '75254', latitude: 32.940610, longitude: -96.797565 },
];
export function housingZipCenter(zip: string | undefined): HousingZipCenter | undefined {
  return HOUSING_ZIP_CENTERS.find(center => center.zip === zip);
}
export function validateHousingZip(value: string): { zip: string; error?: string } {
  const zip = value.trim();
  if (!/^\d{5}$/.test(zip)) return { zip, error: 'Enter a five-digit ZIP code.' };
  if (!housingZipCenter(zip)) return { zip, error: 'This ZIP is outside our supported local search area. Choose one of the listed ZIPs or search from UTD.' };
  return { zip };
}
