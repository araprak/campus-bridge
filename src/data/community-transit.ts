/** Research snapshot, not live vehicle data or a pedestrian routing service. */
export const TRANSIT_REVIEWED = '2026-10-15';
export const TRANSIT_FEED_START = '2026-10-04';
export const TRANSIT_FEED_END = '2026-12-06';
export const TRANSIT_FEED_VERSION = 'V750-218-220-20261019';
export const TRANSIT_FEED_URL = 'https://www.dart.org/transitdata/archive/V750-218-220-20261019.ZIP';
export const TRANSIT_FEED_PERIODS = [
  {start: '2026-10-04', end: '2026-10-18', version: 'V741-218-217-20261004'},
  {start: '2026-10-19', end: '2026-12-06', version: TRANSIT_FEED_VERSION},
] as const;
export const TRANSIT_PLANNER_URL = 'https://www.dart.org/trip/trip-planner/trip-planner-map';
export const TRANSIT_DISTANCE_NOTE = 'Distances are approximate straight-line miles from a community map pin or street-address point. They are not walking distances or leasing-office measurements. Open walking directions and confirm the office, pedestrian gate and crossing before you travel.';
export const TRANSIT_SCHEDULE_NOTE = 'Stop locations and route membership checked October 15, 2026 against DART’s published October 19–December 6 feed; the preceding October 4–18 snapshot remains covered. This is scheduled service, not live arrivals. Check UTD or DART for detours and your travel date.';
/** Dates come from the validated profile and the caller's Dallas calendar date. */
export function transitScheduleNotice(arrivalDate: string, todayDallas: string) {
  if (todayDallas > TRANSIT_FEED_END) return {
    status: 'expired' as const,
    text: 'These route and stop details are an older planning reference. The published schedule data ended December 6, 2026, so current service has not been verified. Check the official trip planner before choosing a stop or making a trip.',
  };
  if (arrivalDate > TRANSIT_FEED_END) return {
    status: 'future_arrival' as const,
    text: 'Your arrival is after the December 6, 2026 end of our published schedule data. Use these routes and stops to explore the area, then confirm service for your travel date before relying on them.',
  };
  if (todayDallas < TRANSIT_FEED_START) return {status: 'outside_snapshot' as const, text: 'The published route reference begins October 4, 2026. Check the official trip planner for service outside that period.'};
  return { status: 'within_snapshot' as const, text: TRANSIT_SCHEDULE_NOTE };
}
export const TRANSIT_FARE_NOTE = 'UTD says no pass or identification is needed for the Comet Cruiser. Other DART routes and trains need an appropriate fare or transit pass; check student eligibility.';
export type CommunityTransit = {
  communityId: string;
  reference: {latitude: number; longitude: number; label: string; sourceUrl: string; quality: 'official-property-map' | 'street-address-geocode'};
  routes: {id: string; name: string; url: string; mapUrl: string; summary: string}[];
  stops: {id: string; name: string; latitude: number; longitude: number; routeIds: string[]; straightLineMiles: number; walkingUrl: string}[];
  accessNote: string;
  sources: {name: string; url: string}[];
};

export const COMMUNITY_TRANSIT: Record<string, CommunityTransit> = {
  "northside": {
    "communityId": "northside",
    "reference": {
      "latitude": 32.9944077,
      "longitude": -96.7487302,
      "label": "Official community map pin",
      "sourceUrl": "https://www.liveatnorthside.com/location/",
      "quality": "official-property-map"
    },
    "routes": [
      {
        "id": "883E",
        "name": "883 East · Comet Cruiser",
        "url": "https://services.utdallas.edu/transit/cruiser/",
        "mapUrl": "https://services.utdallas.edu/download/Comet_Cruiser_Map.pdf",
        "summary": "Connects UTD and Northside with Renner Road and CityLine/Bush Station. The outward and return paths differ; check the direction shown at your stop."
      },
      {
        "id": "232",
        "name": "232 · Frankford",
        "url": "https://www.dart.org/guide/transit-and-use/bus-routes/",
        "mapUrl": "https://www.dart.org/trip/trip-planner/trip-planner-map",
        "summary": "DART service along Frankford, Synergy Park and Renner. Use the official planner for your destination and departure time."
      },
      {
        "id": "244",
        "name": "244 · UTD / Richardson",
        "url": "https://www.dart.org/guide/transit-and-use/bus-routes/bus-route-detail/bus-route-244-utd-campbell",
        "mapUrl": "https://www.dart.org/trip/trip-planner/trip-planner-map",
        "summary": "Links the Arapaho Center area with UTD via Campbell and the north side of campus. Confirm your boarding direction and campus stop."
      },
      {
        "id": "SILVER",
        "name": "Silver Line · UT Dallas Station",
        "url": "https://www.dart.org/guide/transit-and-use/rail/rail-station-detail/ut-dallas-station",
        "mapUrl": "https://www.dart.org/trip/trip-planner/trip-planner-map",
        "summary": "Regional rail at UT Dallas Station, north of Northside. Check the train timetable and your walk to the station."
      }
    ],
    "stops": [
      {
        "id": "34260",
        "name": "Synergy Park @ Northside -  W - Ns",
        "latitude": 32.993161,
        "longitude": -96.749201,
        "routeIds": [
          "883E"
        ],
        "straightLineMiles": 0.09,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=Northside%2C+3000+Northside+Blvd%2C+Richardson%2C+TX+75080&destination=32.993161%2C-96.749201&travelmode=walking"
      },
      {
        "id": "34287",
        "name": "Synergy Park @ Eugene - W - Fs",
        "latitude": 32.993161,
        "longitude": -96.748146,
        "routeIds": [
          "883E",
          "232",
          "244"
        ],
        "straightLineMiles": 0.09,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=Northside%2C+3000+Northside+Blvd%2C+Richardson%2C+TX+75080&destination=32.993161%2C-96.748146&travelmode=walking"
      },
      {
        "id": "33157",
        "name": "Synergy Park @ Rutford - E - Fs",
        "latitude": 32.992902,
        "longitude": -96.750708,
        "routeIds": [
          "883E",
          "232",
          "244"
        ],
        "straightLineMiles": 0.15,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=Northside%2C+3000+Northside+Blvd%2C+Richardson%2C+TX+75080&destination=32.992902%2C-96.750708&travelmode=walking"
      },
      {
        "id": "33598",
        "name": "Ut Dallas Station",
        "latitude": 32.996459,
        "longitude": -96.750008,
        "routeIds": [
          "SILVER"
        ],
        "straightLineMiles": 0.16,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=Northside%2C+3000+Northside+Blvd%2C+Richardson%2C+TX+75080&destination=32.996459%2C-96.750008&travelmode=walking"
      }
    ],
    "accessNote": "Use Synergy Park stops for buses. The rail station is a separate boarding point north of the community; confirm the pedestrian entrance.",
    "sources": [
      {
        "name": "DART published stop and route data",
        "url": "https://www.dart.org/about/about-dart/fixed-route-schedule"
      },
      {
        "name": "Community location reference",
        "url": "https://www.liveatnorthside.com/location/"
      },
      {
        "name": "UTD Comet Cruiser route map",
        "url": "https://services.utdallas.edu/download/Comet_Cruiser_Map.pdf"
      }
    ]
  },
  "marquis-at-waterview": {
    "communityId": "marquis-at-waterview",
    "reference": {
      "latitude": 32.9982901,
      "longitude": -96.7335979,
      "label": "Official community map pin",
      "sourceUrl": "https://www.marquiswaterview.com/neighborhood",
      "quality": "official-property-map"
    },
    "routes": [
      {
        "id": "883E",
        "name": "883 East · Comet Cruiser",
        "url": "https://services.utdallas.edu/transit/cruiser/",
        "mapUrl": "https://services.utdallas.edu/download/Comet_Cruiser_Map.pdf",
        "summary": "Connects UTD and Northside with Renner Road and CityLine/Bush Station. The outward and return paths differ; check the direction shown at your stop."
      },
      {
        "id": "232",
        "name": "232 · Frankford",
        "url": "https://www.dart.org/guide/transit-and-use/bus-routes/",
        "mapUrl": "https://www.dart.org/trip/trip-planner/trip-planner-map",
        "summary": "DART service along Frankford, Synergy Park and Renner. Use the official planner for your destination and departure time."
      }
    ],
    "stops": [
      {
        "id": "31557",
        "name": "Renner @ The Marquis At Waterview - W - Mb1",
        "latitude": 32.997718,
        "longitude": -96.733867,
        "routeIds": [
          "883E",
          "232"
        ],
        "straightLineMiles": 0.04,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=Marquis+at+Waterview%2C+800+W+Renner+Rd%2C+Richardson%2C+TX+75080&destination=32.997718%2C-96.733867&travelmode=walking"
      },
      {
        "id": "31581",
        "name": "Renner @ Orchard Ridge - E - Mb2",
        "latitude": 32.997413,
        "longitude": -96.733383,
        "routeIds": [
          "883E",
          "232"
        ],
        "straightLineMiles": 0.06,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=Marquis+at+Waterview%2C+800+W+Renner+Rd%2C+Richardson%2C+TX+75080&destination=32.997413%2C-96.733383&travelmode=walking"
      }
    ],
    "accessNote": "The two stops are on opposite sides of Renner. Ask the office which pedestrian gate and marked crossing to use for your direction.",
    "sources": [
      {
        "name": "DART published stop and route data",
        "url": "https://www.dart.org/about/about-dart/fixed-route-schedule"
      },
      {
        "name": "Community location reference",
        "url": "https://www.marquiswaterview.com/neighborhood"
      },
      {
        "name": "UTD Comet Cruiser route map",
        "url": "https://services.utdallas.edu/download/Comet_Cruiser_Map.pdf"
      }
    ]
  },
  "palencia": {
    "communityId": "palencia",
    "reference": {
      "latitude": 32.992637259036,
      "longitude": -96.767992050808,
      "label": "Approximate street-address point",
      "sourceUrl": "https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html",
      "quality": "street-address-geocode"
    },
    "routes": [
      {
        "id": "883W",
        "name": "883 West · Comet Cruiser",
        "url": "https://services.utdallas.edu/transit/cruiser/",
        "mapUrl": "https://services.utdallas.edu/download/Comet_Cruiser_Map.pdf",
        "summary": "A campus-bound loop from Frankford and Coit to UTD, returning by Campbell, Meandering, McCallum and Dickerson. The Walmart extension runs on Fridays and Sundays; check the current schedule."
      },
      {
        "id": "241",
        "name": "241 · Coit",
        "url": "https://www.dart.org/guide/transit-and-use/bus-routes/",
        "mapUrl": "https://www.dart.org/trip/trip-planner/trip-planner-map",
        "summary": "DART service on Coit Road. It is separate from the free Comet Cruiser; check fare or student-pass eligibility."
      }
    ],
    "stops": [
      {
        "id": "29673",
        "name": "Coit @ Osage Plaza - S - Fs",
        "latitude": 32.993575,
        "longitude": -96.767975,
        "routeIds": [
          "883W",
          "241"
        ],
        "straightLineMiles": 0.06,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=Palencia%2C+17817+Coit+Rd%2C+Dallas%2C+TX+75252&destination=32.993575%2C-96.767975&travelmode=walking"
      },
      {
        "id": "29674",
        "name": "Coit @ Osage Plaza - N - Mb",
        "latitude": 32.993065,
        "longitude": -96.767709,
        "routeIds": [
          "241"
        ],
        "straightLineMiles": 0.03,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=Palencia%2C+17817+Coit+Rd%2C+Dallas%2C+TX+75252&destination=32.993065%2C-96.767709&travelmode=walking"
      }
    ],
    "accessNote": "The southbound Coit stop serves 883 West toward UTD. The northbound stop serves route 241, not the same campus-bound bus. Cross Coit only at a marked crossing.",
    "sources": [
      {
        "name": "DART published stop and route data",
        "url": "https://www.dart.org/about/about-dart/fixed-route-schedule"
      },
      {
        "name": "Community location reference",
        "url": "https://geocoding.geo.census.gov/geocoder/Geocoding_Services_API.html"
      },
      {
        "name": "UTD Comet Cruiser route map",
        "url": "https://services.utdallas.edu/download/Comet_Cruiser_Map.pdf"
      }
    ]
  },
  "james-at-canyon-creek": {
    "communityId": "james-at-canyon-creek",
    "reference": {
      "latitude": 33.001362,
      "longitude": -96.735099,
      "label": "Official community map pin",
      "sourceUrl": "https://www.thejamesatcanyoncreek.com/mapsanddirections",
      "quality": "official-property-map"
    },
    "routes": [
      {
        "id": "883E",
        "name": "883 East · Comet Cruiser",
        "url": "https://services.utdallas.edu/transit/cruiser/",
        "mapUrl": "https://services.utdallas.edu/download/Comet_Cruiser_Map.pdf",
        "summary": "Connects UTD and Northside with Renner Road and CityLine/Bush Station. The outward and return paths differ; check the direction shown at your stop."
      },
      {
        "id": "232",
        "name": "232 · Frankford",
        "url": "https://www.dart.org/guide/transit-and-use/bus-routes/",
        "mapUrl": "https://www.dart.org/trip/trip-planner/trip-planner-map",
        "summary": "DART service along Frankford, Synergy Park and Renner. Use the official planner for your destination and departure time."
      }
    ],
    "stops": [
      {
        "id": "31557",
        "name": "Renner @ The Marquis At Waterview - W - Mb1",
        "latitude": 32.997718,
        "longitude": -96.733867,
        "routeIds": [
          "883E",
          "232"
        ],
        "straightLineMiles": 0.26,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=The+James+at+Canyon+Creek%2C+850+Greenside+Dr%2C+Richardson%2C+TX+75080&destination=32.997718%2C-96.733867&travelmode=walking"
      },
      {
        "id": "31581",
        "name": "Renner @ Orchard Ridge - E - Mb2",
        "latitude": 32.997413,
        "longitude": -96.733383,
        "routeIds": [
          "883E",
          "232"
        ],
        "straightLineMiles": 0.29,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=The+James+at+Canyon+Creek%2C+850+Greenside+Dr%2C+Richardson%2C+TX+75080&destination=32.997413%2C-96.733383&travelmode=walking"
      },
      {
        "id": "32168",
        "name": "Renner @ Greenside - N - Mb",
        "latitude": 32.998768,
        "longitude": -96.739972,
        "routeIds": [
          "883E",
          "232"
        ],
        "straightLineMiles": 0.33,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=The+James+at+Canyon+Creek%2C+850+Greenside+Dr%2C+Richardson%2C+TX+75080&destination=32.998768%2C-96.739972&travelmode=walking"
      }
    ],
    "accessNote": "These are nearby Renner stops to investigate, not a verified shortest walk. Community gates and access paths may make the Greenside stop more practical; ask the office.",
    "sources": [
      {
        "name": "DART published stop and route data",
        "url": "https://www.dart.org/about/about-dart/fixed-route-schedule"
      },
      {
        "name": "Community location reference",
        "url": "https://www.thejamesatcanyoncreek.com/mapsanddirections"
      },
      {
        "name": "UTD Comet Cruiser route map",
        "url": "https://services.utdallas.edu/download/Comet_Cruiser_Map.pdf"
      }
    ]
  },
  "pradera": {
    "communityId": "pradera",
    "reference": {
      "latitude": 33.00125862459992,
      "longitude": -96.73220325331337,
      "label": "Official community map pin",
      "sourceUrl": "https://thepradera.com/neighborhood/",
      "quality": "official-property-map"
    },
    "routes": [
      {
        "id": "883E",
        "name": "883 East · Comet Cruiser",
        "url": "https://services.utdallas.edu/transit/cruiser/",
        "mapUrl": "https://services.utdallas.edu/download/Comet_Cruiser_Map.pdf",
        "summary": "Connects UTD and Northside with Renner Road and CityLine/Bush Station. The outward and return paths differ; check the direction shown at your stop."
      },
      {
        "id": "232",
        "name": "232 · Frankford",
        "url": "https://www.dart.org/guide/transit-and-use/bus-routes/",
        "mapUrl": "https://www.dart.org/trip/trip-planner/trip-planner-map",
        "summary": "DART service along Frankford, Synergy Park and Renner. Use the official planner for your destination and departure time."
      }
    ],
    "stops": [
      {
        "id": "31557",
        "name": "Renner @ The Marquis At Waterview - W - Mb1",
        "latitude": 32.997718,
        "longitude": -96.733867,
        "routeIds": [
          "883E",
          "232"
        ],
        "straightLineMiles": 0.26,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=The+Pradera%2C+851+Greenside+Dr%2C+Richardson%2C+TX+75080&destination=32.997718%2C-96.733867&travelmode=walking"
      },
      {
        "id": "31581",
        "name": "Renner @ Orchard Ridge - E - Mb2",
        "latitude": 32.997413,
        "longitude": -96.733383,
        "routeIds": [
          "883E",
          "232"
        ],
        "straightLineMiles": 0.27,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=The+Pradera%2C+851+Greenside+Dr%2C+Richardson%2C+TX+75080&destination=32.997413%2C-96.733383&travelmode=walking"
      },
      {
        "id": "31556",
        "name": "Renner @ Orchard Ridge - W - Mb",
        "latitude": 32.997672,
        "longitude": -96.730411,
        "routeIds": [
          "883E",
          "232"
        ],
        "straightLineMiles": 0.27,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=The+Pradera%2C+851+Greenside+Dr%2C+Richardson%2C+TX+75080&destination=32.997672%2C-96.730411&travelmode=walking"
      }
    ],
    "accessNote": "These nearby stops are along Renner. A straight line may cross another property; confirm the public pedestrian exit and crossing with the leasing office.",
    "sources": [
      {
        "name": "DART published stop and route data",
        "url": "https://www.dart.org/about/about-dart/fixed-route-schedule"
      },
      {
        "name": "Community location reference",
        "url": "https://thepradera.com/neighborhood/"
      },
      {
        "name": "UTD Comet Cruiser route map",
        "url": "https://services.utdallas.edu/download/Comet_Cruiser_Map.pdf"
      }
    ]
  },
  "estates-of-richardson": {
    "communityId": "estates-of-richardson",
    "reference": {
      "latitude": 33.001882,
      "longitude": -96.7402474,
      "label": "Official community map pin",
      "sourceUrl": "https://www.rentanapt.com/apartments/tx/richardson/estates-of-richardson/contact-us",
      "quality": "official-property-map"
    },
    "routes": [
      {
        "id": "883E",
        "name": "883 East · Comet Cruiser",
        "url": "https://services.utdallas.edu/transit/cruiser/",
        "mapUrl": "https://services.utdallas.edu/download/Comet_Cruiser_Map.pdf",
        "summary": "Connects UTD and Northside with Renner Road and CityLine/Bush Station. The outward and return paths differ; check the direction shown at your stop."
      },
      {
        "id": "232",
        "name": "232 · Frankford",
        "url": "https://www.dart.org/guide/transit-and-use/bus-routes/",
        "mapUrl": "https://www.dart.org/trip/trip-planner/trip-planner-map",
        "summary": "DART service along Frankford, Synergy Park and Renner. Use the official planner for your destination and departure time."
      }
    ],
    "stops": [
      {
        "id": "32167",
        "name": "Renner @ Greenside - S- Fs",
        "latitude": 32.999064,
        "longitude": -96.740973,
        "routeIds": [
          "883E",
          "232"
        ],
        "straightLineMiles": 0.2,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=Estates+of+Richardson%2C+955+W+President+George+Bush+Hwy%2C+Richardson%2C+TX+75080&destination=32.999064%2C-96.740973&travelmode=walking"
      },
      {
        "id": "32168",
        "name": "Renner @ Greenside - N - Mb",
        "latitude": 32.998768,
        "longitude": -96.739972,
        "routeIds": [
          "883E",
          "232"
        ],
        "straightLineMiles": 0.22,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=Estates+of+Richardson%2C+955+W+President+George+Bush+Hwy%2C+Richardson%2C+TX+75080&destination=32.998768%2C-96.739972&travelmode=walking"
      }
    ],
    "accessNote": "The useful campus corridor is Renner and Greenside, south of the community. Confirm the pedestrian exit and correct side of the road before walking.",
    "sources": [
      {
        "name": "DART published stop and route data",
        "url": "https://www.dart.org/about/about-dart/fixed-route-schedule"
      },
      {
        "name": "Community location reference",
        "url": "https://www.rentanapt.com/apartments/tx/richardson/estates-of-richardson/contact-us"
      },
      {
        "name": "UTD Comet Cruiser route map",
        "url": "https://services.utdallas.edu/download/Comet_Cruiser_Map.pdf"
      }
    ]
  },
  "maa-eastside": {
    "communityId": "maa-eastside",
    "reference": {
      "latitude": 32.9737,
      "longitude": -96.7137,
      "label": "Official community map pin",
      "sourceUrl": "https://www.maac.com/texas/dallas/maa-eastside/",
      "quality": "official-property-map"
    },
    "routes": [
      {
        "id": "244",
        "name": "244 · UTD / Richardson",
        "url": "https://www.dart.org/guide/transit-and-use/bus-routes/bus-route-detail/bus-route-244-utd-campbell",
        "mapUrl": "https://www.dart.org/trip/trip-planner/trip-planner-map",
        "summary": "Links the Arapaho Center area with UTD via Campbell and the north side of campus. Confirm your boarding direction and campus stop."
      },
      {
        "id": "243",
        "name": "243 · Plano Road",
        "url": "https://www.dart.org/guide/transit-and-use/bus-routes/",
        "mapUrl": "https://www.dart.org/trip/trip-planner/trip-planner-map",
        "summary": "A DART option around Collins and Alma. Check a complete trip in the planner; this listing does not promise a direct ride to UTD."
      },
      {
        "id": "408",
        "name": "408 · Palisades E-Shuttle",
        "url": "https://www.dart.org/guide/transit-and-use/bus-routes/",
        "mapUrl": "https://www.dart.org/trip/trip-planner/trip-planner-map",
        "summary": "A nearby shuttle option on Greenville and Lawnview. Check operating days and times; do not assume it runs like the all-day Comet Cruiser."
      }
    ],
    "stops": [
      {
        "id": "21601",
        "name": "Greenville @ Lawnview - N - Mb",
        "latitude": 32.976779,
        "longitude": -96.71106,
        "routeIds": [
          "408"
        ],
        "straightLineMiles": 0.26,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=MAA+Eastside%2C+1801+N+Greenville+Ave+Suite+300%2C+Richardson%2C+TX+75081&destination=32.976779%2C-96.71106&travelmode=walking"
      },
      {
        "id": "23301",
        "name": "Collins @ Firman - W - Ns",
        "latitude": 32.968135,
        "longitude": -96.712372,
        "routeIds": [
          "243"
        ],
        "straightLineMiles": 0.39,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=MAA+Eastside%2C+1801+N+Greenville+Ave+Suite+300%2C+Richardson%2C+TX+75081&destination=32.968135%2C-96.712372&travelmode=walking"
      },
      {
        "id": "28895",
        "name": "Alma @ Quality - N - Ns",
        "latitude": 32.966599,
        "longitude": -96.71698,
        "routeIds": [
          "244",
          "243"
        ],
        "straightLineMiles": 0.53,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=MAA+Eastside%2C+1801+N+Greenville+Ave+Suite+300%2C+Richardson%2C+TX+75081&destination=32.966599%2C-96.71698&travelmode=walking"
      },
      {
        "id": "28898",
        "name": "Alma @ Collins - S - Fs",
        "latitude": 32.967353,
        "longitude": -96.717156,
        "routeIds": [
          "244",
          "243"
        ],
        "straightLineMiles": 0.48,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=MAA+Eastside%2C+1801+N+Greenville+Ave+Suite+300%2C+Richardson%2C+TX+75081&destination=32.967353%2C-96.717156&travelmode=walking"
      }
    ],
    "accessNote": "This community is not listed as a direct 883 boarding location. Compare route 244 from Alma with nearby 243/408 options in the trip planner; operating times and the walk may differ.",
    "sources": [
      {
        "name": "DART published stop and route data",
        "url": "https://www.dart.org/about/about-dart/fixed-route-schedule"
      },
      {
        "name": "Community location reference",
        "url": "https://www.maac.com/texas/dallas/maa-eastside/"
      }
    ]
  },
  "estates-on-frankford": {
    "communityId": "estates-on-frankford",
    "reference": {
      "latitude": 32.9991515,
      "longitude": -96.7726654,
      "label": "Official community map pin",
      "sourceUrl": "https://www.rentanapt.com/apartments/tx/dallas/estates-on-frankford/contact-us",
      "quality": "official-property-map"
    },
    "routes": [
      {
        "id": "883W",
        "name": "883 West · Comet Cruiser",
        "url": "https://services.utdallas.edu/transit/cruiser/",
        "mapUrl": "https://services.utdallas.edu/download/Comet_Cruiser_Map.pdf",
        "summary": "A campus-bound loop from Frankford and Coit to UTD, returning by Campbell, Meandering, McCallum and Dickerson. The Walmart extension runs on Fridays and Sundays; check the current schedule."
      },
      {
        "id": "232",
        "name": "232 · Frankford",
        "url": "https://www.dart.org/guide/transit-and-use/bus-routes/",
        "mapUrl": "https://www.dart.org/trip/trip-planner/trip-planner-map",
        "summary": "DART service along Frankford, Synergy Park and Renner. Use the official planner for your destination and departure time."
      }
    ],
    "stops": [
      {
        "id": "33037",
        "name": "Frankford @ Osage Plaza - E - Fs",
        "latitude": 32.99751,
        "longitude": -96.772306,
        "routeIds": [
          "883W",
          "232"
        ],
        "straightLineMiles": 0.12,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=Estates+on+Frankford%2C+7575+Frankford+Rd%2C+Dallas%2C+TX+75252&destination=32.99751%2C-96.772306&travelmode=walking"
      },
      {
        "id": "32677",
        "name": "Frankford @ Osage Plaza - W - Ns",
        "latitude": 32.997725,
        "longitude": -96.772371,
        "routeIds": [
          "232"
        ],
        "straightLineMiles": 0.1,
        "walkingUrl": "https://www.google.com/maps/dir/?api=1&origin=Estates+on+Frankford%2C+7575+Frankford+Rd%2C+Dallas%2C+TX+75252&destination=32.997725%2C-96.772371&travelmode=walking"
      }
    ],
    "accessNote": "For UTD, check the eastbound Frankford @ Osage Plaza stop (33037). It is across Frankford from the community. Use the marked crossing; the straight-line figure below is not the walk from your leasing office.",
    "sources": [
      {
        "name": "DART published stop and route data",
        "url": "https://www.dart.org/about/about-dart/fixed-route-schedule"
      },
      {
        "name": "Community location reference",
        "url": "https://www.rentanapt.com/apartments/tx/dallas/estates-on-frankford/contact-us"
      },
      {
        "name": "UTD Comet Cruiser route map",
        "url": "https://services.utdallas.edu/download/Comet_Cruiser_Map.pdf"
      }
    ]
  }
};

export function getCommunityTransit(communityId?: string): CommunityTransit | undefined {
  return communityId && Object.hasOwn(COMMUNITY_TRANSIT, communityId) ? COMMUNITY_TRANSIT[communityId] : undefined;
}

export const COMET_WEST_ROUTE = {
  heading: 'How 883 West loops between Frankford and UTD',
  toCampus: ['Frankford @ Osage Plaza', 'Coit Road southbound', 'Campbell Road eastbound', 'Waterview / Loop Road SW', 'University Parkway Circle'],
  fromCampus: ['University Parkway Circle', 'Campbell Road westbound', 'Meandering Way northbound', 'McCallum Boulevard eastbound', 'Dickerson Street northbound', 'Frankford @ Osage Plaza'],
  extension: 'On Fridays and Sundays, some campus-bound service first loops north on Coit to the Walmart / Mapleshade area. Check the current route schedule.',
  url: 'https://services.utdallas.edu/transit/cruiser/',
  mapUrl: 'https://services.utdallas.edu/download/Comet_Cruiser_Map.pdf',
} as const;
