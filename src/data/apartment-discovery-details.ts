/**
 * Small, manually checked supplement to the existing apartment catalog.
 * Links and identities only: no provider ratings, review text, rents, photos,
 * availability, or general amenity facts are copied into this prototype.
 * See outputs/CampusBridge-Apartment-Prototype-Data.md for the source audit.
 */
export type ApartmentDiscoveryDetails = {
  identityReviewedOn: string;
  identitySourceUrl: string;
  officialDetailsLinks: readonly { label: string; url: string }[];
  reviewLinks: readonly {
    platform: string;
    label: string;
    url: string;
    verifiedOn: string;
    sourceUrl: string;
  }[];
};

export const APARTMENT_DISCOVERY_DETAILS: Readonly<Record<string, ApartmentDiscoveryDetails>> = {
  northside: {
    identityReviewedOn: '2026-10-12',
    identitySourceUrl: 'https://www.liveatnorthside.com/',
    officialDetailsLinks: [
      { label: 'Amenities on the community site', url: 'https://www.liveatnorthside.com/amenities/' },
    ],
    reviewLinks: [
      {
        platform: 'Google Maps',
        label: 'Google Maps listing & reviews',
        url: 'https://maps.app.goo.gl/W2tpjqzmSwQrohyr6',
        verifiedOn: '2026-10-12',
        sourceUrl: 'https://www.liveatnorthside.com/',
      },
    ],
  },
  'marquis-at-waterview': {
    identityReviewedOn: '2026-10-12',
    identitySourceUrl: 'https://www.marquiswaterview.com/',
    officialDetailsLinks: [
      { label: 'Floor plans on the community site', url: 'https://www.marquiswaterview.com/floor-plans' },
    ],
    reviewLinks: [
      {
        platform: 'Google Maps',
        label: 'Google Maps listing & reviews',
        url: 'https://maps.app.goo.gl/94GuXC85qgRzfjnA9',
        verifiedOn: '2026-10-12',
        sourceUrl: 'https://www.marquiswaterview.com/',
      },
    ],
  },
  'estates-on-frankford': {
    identityReviewedOn: '2026-10-12',
    identitySourceUrl: 'https://www.rentanapt.com/apartments/tx/dallas/estates-on-frankford/contact-us',
    officialDetailsLinks: [
      { label: 'Amenities on the community site', url: 'https://www.rentanapt.com/apartments/tx/dallas/estates-on-frankford/amenities' },
    ],
    reviewLinks: [
      {
        platform: 'Google Maps',
        label: 'Google Maps listing & reviews',
        url: 'https://www.google.com/maps?cid=11351959048452436429',
        verifiedOn: '2026-10-12',
        sourceUrl: 'https://www.rentanapt.com/apartments/tx/dallas/estates-on-frankford/contact-us',
      },
    ],
  },
  'maa-eastside': {
    identityReviewedOn: '2026-10-12',
    identitySourceUrl: 'https://www.maac.com/texas/dallas/maa-eastside/',
    officialDetailsLinks: [],
    // Its official address link is a generic Maps search, not a matched listing.
    reviewLinks: [],
  },
  'james-at-canyon-creek': {
    identityReviewedOn: '2026-10-12',
    identitySourceUrl: 'https://www.thejamesatcanyoncreek.com/',
    officialDetailsLinks: [
      { label: 'Amenities on the community site', url: 'https://www.thejamesatcanyoncreek.com/amenities' },
    ],
    // The official Maps link retains a former name; resolve identity before publishing it.
    reviewLinks: [],
  },
};
