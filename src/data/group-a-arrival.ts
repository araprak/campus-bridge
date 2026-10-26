/** Official source pages read on this date; schedules and fares remain at the publisher. */
export const ARRIVAL_SOURCES_CHECKED = '2026-10-25';
export const ARRIVAL_SOURCES = {
  dfw: { label: 'DFW Airport public transportation', url: 'https://www.dfwairport.com/explore/transportation/publictransit/', publisher: 'DFW International Airport' },
  dal: { label: 'Love Field public transportation', url: 'https://www.dallas-lovefield.com/passenger-services/ground-transportation/public-transportation', publisher: 'Dallas Love Field' },
  cruiser: { label: 'Comet Cruiser routes and schedules', url: 'https://services.utdallas.edu/transit/cruiser/', publisher: 'UT Dallas' },
  dart: { label: 'Student DART and GoPass requirements', url: 'https://services.utdallas.edu/transit/dart/', publisher: 'UT Dallas' },
  parking: { label: 'Campus parking permits and visitor options', url: 'https://services.utdallas.edu/transit/park/', publisher: 'UT Dallas' },
} as const;
export const ARRIVAL_AIRPORTS = {
  DFW: { name: 'Dallas Fort Worth (DFW)', origin: 'Dallas Fort Worth International Airport, TX', transit: 'DFW lists DART Orange Line service at Terminal A and Silver Line service at Terminal B. Check your terminal, train direction, transfers and final stop for your destination in the live route planner.' },
  DAL: { name: 'Dallas Love Field (DAL)', origin: 'Dallas Love Field Airport, Dallas, TX', transit: 'Love Field lists Route 5 Love Link from the lower-level ground transportation area to Inwood/Love Field Station, with connections to the Green and Orange rail lines. Check onward transfers and your final stop in the live route planner.' },
} as const;
export type ArrivalAirport = keyof typeof ARRIVAL_AIRPORTS;
export const ARRIVAL_TRAVEL_OPTIONS = {
  transit: 'Public transit',
  pickup: 'Taxi, rideshare or someone picking me up',
  car: 'Driving or rental car',
} as const;
export type ArrivalTravel = keyof typeof ARRIVAL_TRAVEL_OPTIONS;

export const EXPANSION_CONCEPTS = [
  { id: 'campus', title: 'Another campus guide', scope: 'A campus-specific arrival guide using official local resources.', validate: 'Validate student need, identify a campus content owner, check local transport and housing sources, and test the first-month tasks.' },
  { id: 'premium', title: 'Optional planning convenience', scope: 'Explore whether students value extra organization, while preserving a useful free core.', validate: 'Test willingness to use and pay, define the optional benefit, evaluate support costs, and confirm that essential guidance remains accessible.' },
] as const;
export const EXPANSION_CHECKS = [
  { id: 'need', label: 'I have recorded student interviews or feedback about this need.' },
  { id: 'owner', label: 'A responsible content or support owner has been identified.' },
  { id: 'sources', label: 'The resources and costs for a small pilot have been checked.' },
  { id: 'test', label: 'A pilot success measure and a decision date have been defined.' },
] as const;
