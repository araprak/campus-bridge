/**
 * Place IDs only: no copied Google ratings, review text, or author details.
 * Each official-site link was resolved to its business listing, then verified
 * with a deliberately unmatched query plus query_place_id on 2026-10-19.
 * Unmapped communities use a visitor-confirmed listing search in the widget.
 */
export const APARTMENT_GOOGLE_PLACES: Record<string, {
  placeId: string;
  verifiedOn: string;
  sourceUrl: string;
  listingUrl: string;
}> = {
  northside: {
    placeId: 'ChIJxblxuDSgToYRcn4cxwiPeVU', verifiedOn: '2026-10-19',
    sourceUrl: 'https://www.liveatnorthside.com/',
    listingUrl: 'https://maps.app.goo.gl/W2tpjqzmSwQrohyr6',
  },
  'marquis-at-waterview': {
    placeId: 'ChIJdwOKsbAYTIYRLUzYD62OdiE', verifiedOn: '2026-10-19',
    sourceUrl: 'https://www.marquiswaterview.com/',
    listingUrl: 'https://maps.app.goo.gl/94GuXC85qgRzfjnA9',
  },
  'estates-on-frankford': {
    placeId: 'ChIJm6bPDT0iTIYRzfHJ-5tCip0', verifiedOn: '2026-10-19',
    sourceUrl: 'https://www.rentanapt.com/apartments/tx/dallas/estates-on-frankford/contact-us',
    listingUrl: 'https://www.google.com/maps?cid=11351959048452436429',
  },
  'the-lyla': {
    placeId: 'ChIJcQqSYjkZTIYRHfu6BS4ns1I', verifiedOn: '2026-10-19',
    sourceUrl: 'https://www.citylinelyla.com/',
    listingUrl: 'https://maps.app.goo.gl/6dPgW5NpDj5CDpkV8',
  },
  'foundation-at-cityline': {
    placeId: 'ChIJx7qPMcgYTIYRP9jTYw5bMl4', verifiedOn: '2026-10-19',
    sourceUrl: 'https://www.foundationatcityline.com/',
    listingUrl: 'https://maps.app.goo.gl/tH1BVA1Xcs9aJuKz9',
  },
  'windsor-cityline': {
    placeId: 'ChIJRZ9C-yUZTIYRu0dJNVgFeBE', verifiedOn: '2026-10-19',
    sourceUrl: 'https://www.windsorcommunities.com/properties/windsor-cityline/',
    listingUrl: 'https://search.google.com/local/reviews?placeid=ChIJRZ9C-yUZTIYRu0dJNVgFeBE',
  },
};
