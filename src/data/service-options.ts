import { APARTMENTS } from './local-options.ts';

/** Editorial source review only. No live eligibility, price, or booking feed. */
export const SERVICES_REVIEWED = '2026-10-04';
export const INTERNET_REVIEWED = '2026-10-06';
export const INTERNET_COMPARISON_NOTE = 'Check what your lease includes, then compare service at your full address and apartment number.';
export const BROADBAND_MAP_URL = 'https://broadbandmap.fcc.gov/home';

export const INTERNET_TYPES = ['Wired', 'Wireless', 'Satellite'] as const;
export type InternetType = typeof INTERNET_TYPES[number];
export type InternetProvider = {
  id: string;
  name: string;
  description: string;
  types: InternetType[];
  url: string;
  sourceUrl: string;
};

/** An editorial directory, not an availability feed or price ranking. */
export const INTERNET_PROVIDERS: InternetProvider[] = [
  { id: 'att', name: 'AT&T Internet', types: ['Wired', 'Wireless'], description: 'Fiber or Internet Air, depending on your address.', url: 'https://www.att.com/internet/availability/', sourceUrl: 'https://www.att.com/local/internet/texas/richardson' },
  { id: 'astound', name: 'Astound Broadband', types: ['Wired'], description: 'Cable or fiber in selected Dallas-area service areas.', url: 'https://www.astound.com/check-for-service/', sourceUrl: 'https://www.astound.com/texas/' },
  { id: 'earthlink', name: 'EarthLink', types: ['Wired', 'Wireless', 'Satellite'], description: 'Connection type and terms depend on the address and plan.', url: 'https://www.earthlink.net/internet/', sourceUrl: 'https://www.earthlink.net/internet/' },
  { id: 'frontier', name: 'Frontier', types: ['Wired'], description: 'Fiber and other wired service in selected North Texas areas.', url: 'https://frontier.com/shop/internet', sourceUrl: 'https://frontier.com/local/texas' },
  { id: 'hughesnet', name: 'Hughesnet', types: ['Satellite'], description: 'Satellite service. Check installation access, data terms and latency.', url: 'https://www.hughesnet.com/', sourceUrl: 'https://www.hughesnet.com/' },
  { id: 'nextlink', name: 'Nextlink Internet', types: ['Wired', 'Wireless'], description: 'Fiber or fixed wireless in selected Texas service areas.', url: 'https://nextlinkinternet.com/', sourceUrl: 'https://nextlinkinternet.com/' },
  { id: 'optimum', name: 'Optimum', types: ['Wired'], description: 'Cable or fiber in selected North Texas service areas.', url: 'https://www.optimum.com/internet', sourceUrl: 'https://www.optimum.com/internet' },
  { id: 'spectrum', name: 'Spectrum Internet', types: ['Wired'], description: 'Check your unit, equipment fees and self-installation options.', url: 'https://www.spectrum.com/internet', sourceUrl: 'https://www.spectrum.com/locations/tx/richardson' },
  { id: 'starlink', name: 'Starlink', types: ['Satellite'], description: 'Satellite service. Needs a suitable installation spot with a clear sky view.', url: 'https://starlink.com/residential', sourceUrl: 'https://starlink.com/residential' },
  { id: 'tmobile', name: 'T-Mobile Home Internet', types: ['Wireless'], description: '5G home internet; signal and local network capacity affect eligibility.', url: 'https://www.t-mobile.com/home-internet/eligibility', sourceUrl: 'https://www.t-mobile.com/home-internet/faq' },
  { id: 'verizon', name: 'Verizon 5G Home Internet', types: ['Wireless'], description: 'Wireless home service where your exact address qualifies.', url: 'https://www.verizon.com/home/internet/5g/', sourceUrl: 'https://www.verizon.com/home/internet/5g/' },
  { id: 'viasat', name: 'Viasat', types: ['Satellite'], description: 'Satellite service. Compare equipment, installation and data policies.', url: 'https://www.viasat.com/satellite-internet/', sourceUrl: 'https://www.viasat.com/satellite-internet/' },
];

export function filterInternetProviders(providers: InternetProvider[], query = '', type: InternetType | 'All' = 'All') {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return providers.filter(provider => (type === 'All' || provider.types.includes(type)) && words.every(word => `${provider.name} ${provider.description} ${provider.types.join(' ')}`.toLowerCase().includes(word)));
}

type CommunityInternetNote = { summary: string; url: string };

/** These are lease questions, never automatic changes to a student's answers. */
export const COMMUNITY_INTERNET_NOTES: Partial<Record<string, CommunityInternetNote>> = {
  northside: {
    summary: 'Northside’s FAQ lists internet among charges outside base rent and says utilities are held in Northside’s name and billed back. Ask the office about your internet connection, activation, and exact lease charges before ordering separate service.',
    url: 'https://www.liveatnorthside.com/frequently-asked-questions/',
  },
  'maa-eastside': {
    summary: 'MAA Eastside lists MAA Connect as a required recurring fee for high-speed internet and/or video. Confirm what your lease supplies and how to activate it before ordering a separate internet plan.',
    url: 'https://www.maac.com/texas/dallas/maa-eastside/',
  },
};

export const INTERNET_SOURCES = [
  ...INTERNET_PROVIDERS.map(provider => ({ name: `${provider.name}: official service information`, url: provider.sourceUrl })),
  { name: 'FCC provider-reported availability map', url: BROADBAND_MAP_URL },
  { name: 'AT&T address availability', url: 'https://www.att.com/internet/availability/' },
  { name: 'AT&T in Richardson', url: 'https://www.att.com/local/internet/texas/richardson' },
  { name: 'AT&T in Dallas', url: 'https://www.att.com/local/internet/texas/dallas' },
  { name: 'Spectrum in Richardson', url: 'https://www.spectrum.com/locations/tx/richardson' },
  { name: 'Spectrum in Dallas', url: 'https://www.spectrum.com/locations/tx/dallas' },
  { name: 'T-Mobile eligibility and service details', url: 'https://www.t-mobile.com/home-internet/faq' },
  { name: 'Northside utility FAQ', url: COMMUNITY_INTERNET_NOTES.northside!.url },
  { name: 'MAA Eastside leasing details', url: COMMUNITY_INTERNET_NOTES['maa-eastside']!.url },
];

export function internetGuide(housingCommunity?: string, housingZip?: string) {
  const community = APARTMENTS.find(option => option.id === housingCommunity);
  const zip = community?.zip || housingZip || '';
  const areas: Record<string, 'Dallas' | 'Richardson'> = {
    '75080': 'Richardson', '75081': 'Richardson', '75252': 'Dallas',
  };
  const area = Object.hasOwn(areas, zip) ? areas[zip] : null;
  const providers = INTERNET_PROVIDERS.map(provider => ({
    ...provider,
    sourceUrl: area && provider.id === 'att'
      ? `https://www.att.com/local/internet/texas/${area.toLowerCase()}`
      : area && provider.id === 'spectrum'
        ? `https://www.spectrum.com/locations/tx/${area.toLowerCase()}`
        : provider.sourceUrl,
  }));
  return {
    community, zip, area, providers,
    communityNote: community ? COMMUNITY_INTERNET_NOTES[community.id] : undefined,
    heading: 'Find home internet',
    locationNote: area
      ? `ZIP ${zip}: a city listing does not confirm service at your apartment. Check the full address and unit.`
      : zip
        ? `We have not established local coverage for ZIP ${zip}. Check your full address with each provider.`
        : 'Choose a community or add a ZIP. Every provider still needs your full address and unit to confirm service.',
  };
}

export const FMCSA_CHECK_URL = 'https://safer.fmcsa.dot.gov/CompanySnapshot.aspx';
export const FMCSA_AUTO_TRANSPORT_GUIDE_URL = 'https://www.fmcsa.dot.gov/protect-your-move/resources/consumer-advisory-automobile-transporters';
export const CAR_TRANSPORT_NOTE = 'For a car already in the United States. These brokers arrange transport with a separate carrier; this is a comparison list, not an endorsement or a quote. Confirm pickup and delivery windows, the full written price, cancellation terms, and the assigned carrier’s insurance before booking. International vehicle import is outside this guide.';

export type CarTransporter = {
  id: string;
  name: string;
  type: 'Broker';
  description: string;
  url: string;
  sourceUrl: string;
  registration: { usdot: string; mc: string; url: string; snapshotDate: string };
};

function registration(usdot: string, mc: string): CarTransporter['registration'] {
  return {
    usdot, mc, snapshotDate: '2026-10-02',
    url: `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${usdot}`,
  };
}

/** Alphabetical. FMCSA snapshot date is the source's date, not a future guarantee. */
export const CAR_TRANSPORTERS: CarTransporter[] = [
  {
    id: 'amerifreight', name: 'AmeriFreight Auto Transport', type: 'Broker',
    description: 'Arranges domestic vehicle transport to and from the Dallas area, including Richardson. Request a written estimate using your actual vehicle, origin, and dates.',
    url: 'https://www.amerifreight.net/texas/dallas-auto-transport',
    sourceUrl: 'https://www.amerifreight.net/texas/dallas-auto-transport',
    registration: registration('2238770', '597401'),
  },
  {
    id: 'montway', name: 'Montway Auto Transport', type: 'Broker',
    description: 'Arranges vehicle shipping to and from Dallas and other Texas cities. Compare the pickup window, carrier details, and the written quote for your route.',
    url: 'https://www.montway.com/dallas-car-shipping',
    sourceUrl: 'https://www.montway.com/carrier-network/',
    registration: registration('2239816', '611862'),
  },
  {
    id: 'sherpa', name: 'Sherpa Auto Transport', type: 'Broker',
    description: 'Arranges open or enclosed vehicle transport for Dallas and Richardson. Ask which service, pickup location, and delivery window the quote covers.',
    url: 'https://www.sherpaautotransport.com/routes/texas-car-shipping/dallas/',
    sourceUrl: 'https://www.sherpaautotransport.com/carrier-terms-conditions/',
    registration: registration('4085166', '1555035'),
  },
];

export const CAR_TRANSPORT_SOURCES = [
  { name: 'FMCSA automobile transport consumer guide', url: FMCSA_AUTO_TRANSPORT_GUIDE_URL },
  ...CAR_TRANSPORTERS.flatMap(provider => [
    { name: `${provider.name}: service information`, url: provider.url },
    { name: `${provider.name}: FMCSA record`, url: provider.registration.url },
  ]),
];
