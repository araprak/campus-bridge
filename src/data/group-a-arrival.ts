/** Official source pages read on this date; schedules and fares remain at the publisher. */
export const ARRIVAL_SOURCES_CHECKED = '2026-10-27';
export const ARRIVAL_SOURCES = {
  travel: { label: 'UTD international student travel guide', url: 'https://icp.utdallas.edu/resources/travel-guide/', publisher: 'UT Dallas Intercultural Programs' },
  orientation: { label: 'Spring 2027 International Student Orientation', url: 'https://icp.utdallas.edu/students/international-student-orientation/', publisher: 'UT Dallas Intercultural Programs' },
  isso: { label: 'ISSO pre- and post-arrival resources', url: 'https://isso.utdallas.edu/joining-ut-dallas/pre-post-arrival-resources/', publisher: 'UT Dallas ISSO' },
  housing: { label: 'UTD housing and temporary accommodation resources', url: 'https://icp.utdallas.edu/resources/housing/', publisher: 'UT Dallas Intercultural Programs' },
  renting: { label: 'UTD guide to renting an apartment', url: 'https://icp.utdallas.edu/resources/housing/apartment-resource/', publisher: 'UT Dallas Intercultural Programs' },
  dfw: { label: 'DFW Airport public transportation', url: 'https://www.dfwairport.com/explore/transportation/publictransit/', publisher: 'DFW International Airport' },
  dal: { label: 'Love Field public transportation', url: 'https://www.dallas-lovefield.com/passenger-services/ground-transportation/public-transportation', publisher: 'Dallas Love Field' },
  cruiser: { label: 'Comet Cruiser routes and schedules', url: 'https://services.utdallas.edu/transit/cruiser/', publisher: 'UT Dallas' },
  dart: { label: 'Student DART and GoPass requirements', url: 'https://services.utdallas.edu/transit/dart/', publisher: 'UT Dallas' },
  parking: { label: 'Campus parking permits and visitor options', url: 'https://services.utdallas.edu/transit/park/', publisher: 'UT Dallas' },
} as const;
/** These particular pages were read again for the Spring 2027 arrival update. */
export const SPRING_ARRIVAL_CHECKED = '2026-10-27';
export const BIG_HOWDY_URL = 'https://utdbighowdy.com/';
export const ARRIVAL_DAY_CHECKS = [
  { id: 'first-night', label: 'Confirm my first-night stay and late check-in', detail: 'If your lease begins after arrival, arrange a confirmed temporary stay before travelling. UTD lists nearby hotel resources; CampusBridge does not book rooms or promise free accommodation.', source: 'housing' },
  { id: 'phone', label: 'Prepare a working phone, SIM or eSIM', detail: 'Check that your phone is unlocked and compatible with your chosen provider. Set up airport connectivity before depending on rideshare; UTD notes that Uber or Lyft may require a US phone number.', source: 'travel' },
  { id: 'money', label: 'Check card access and a payment backup', detail: 'Confirm with your bank that your card will work in the US, check international fees and keep a backup payment method. For apartment payments, UTD warns against cash and paying for a property you have not seen.', source: 'renting' },
  { id: 'orientation', label: 'Plan my journey to orientation', detail: 'Spring 2027 International Student Orientation is Jan 13 at ATC Lecture Hall, 2–7 p.m.; check-in is 12:30–1:30 p.m. Mandatory for F/J graduate and exchange students; follow your own program requirements.', source: 'orientation' },
  { id: 'documents', label: 'Keep immigration documents in my carry-on', detail: 'Keep your passport, visa and I-20 or DS-2019 available during travel. Review ISSO’s port-of-entry resources and follow the documents required for your status.', source: 'isso' },
  { id: 'backup', label: 'Agree a backup if my flight or transit is delayed', detail: 'Check the last service for the actual arrival date. Confirm a taxi or pickup alternative, your terminal, luggage arrangements and destination check-in before you travel.', source: 'travel' },
] as const;
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
