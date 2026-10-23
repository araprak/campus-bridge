import type { Answers, TransitMode } from '../lib/model.ts';

export const TRANSIT_MODE_LABELS: Record<TransitMode, string> = {
  undecided: 'I’m not sure yet',
  campus_bus: 'Campus shuttle (Comet Cruiser)',
  public_transit: 'DART buses / trains',
  rideshare: 'Rideshare / taxi',
  carpool: 'Rides with friends / carpool',
  mixed: 'A mix of these options',
};

export function transportationLabel(answers: Answers) {
  if (answers.transport === 'car') {
    if (answers.hasCar) return 'Car available';
    return answers.rentalHelp === 'yes' ? 'Driving · exploring rentals' : 'Driving · car not arranged';
  }
  if (answers.transport === 'transit') {
    return answers.transitMode && answers.transitMode !== 'undecided'
      ? TRANSIT_MODE_LABELS[answers.transitMode] : 'Public transport or getting a ride';
  }
  return answers.transport === 'walking' ? 'Walking / cycling' : 'Transportation undecided';
}

export function wantsRentalGuide(answers: Answers) {
  return answers.transport === 'car' && !answers.hasCar && answers.rentalHelp === 'yes';
}

export const TRANSPORT_OPTIONS_REVIEWED = '2026-10-05';
export const RENTAL_OPTIONS = [
  { id: 'enterprise', coordinates: { latitude: 32.955064413453, longitude: -96.731324299806, sourceUrl: 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=410+N+Central+Expy%2C+Richardson%2C+TX+75080&benchmark=Public_AR_Current&format=json' }, name: 'Enterprise — Richardson Arapaho & Central Expy', address: '410 N Central Expy, Richardson, TX 75080', description: 'A Richardson neighborhood branch. Check pickup hours, vehicle availability, and whether its payment requirements work for you.', url: 'https://www.enterprise.com/en/car-rental-locations/us/tx/richardson-arapaho-central-expy-0976.html', requirementsUrl: 'https://www.enterprise.com/en/car-rental-locations/us/tx/richardson-arapaho-central-expy-0976.html' },
  { id: 'hertz', coordinates: { latitude: 32.952014614731, longitude: -96.734322957507, sourceUrl: 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=233+N+Central+Expy%2C+Richardson%2C+TX+75080&benchmark=Public_AR_Current&format=json' }, name: 'Hertz — Richardson North Central Expressway', address: '233 N Central Expy, Richardson, TX 75080', description: 'A local Richardson rental option. Compare the total price, pickup arrangements, and the requirements for the car you choose.', url: 'https://www.hertz.com/us/en/location/unitedstates/texas/richardson/dfwn07', requirementsUrl: 'https://www.hertz.com/us/en/rental-qualifications-and-requirements' },
  { id: 'avis', coordinates: { latitude: 32.946407979049, longitude: -96.737230444018, sourceUrl: 'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=505+S+Central+Expy%2C+Richardson%2C+TX+75080&benchmark=Public_AR_Current&format=json' }, name: 'Avis — Richardson', address: '505 S Central Expwy, Richardson, TX 75080', description: 'A Richardson pickup location. Confirm hours and the documents, payment card, and deposit required before making a reservation.', url: 'https://go2.avis.com/en/locations/us/tx/richardson', requirementsUrl: 'https://www.avis.com/en/help/usa-faqs/rental-requirements' },
] as const;

export const RENTAL_COMPARISON_NOTE = 'These are places to compare, not confirmed availability or an eligibility check. Before booking, ask the branch about your age, home-country driver’s license, any translation or International Driving Permit, payment card, deposit, and insurance options. Compare the full cost, including young-driver fees where applicable, fuel, mileage, and return conditions.';
