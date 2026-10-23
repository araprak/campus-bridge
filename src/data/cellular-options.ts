/** Official provider pages reviewed on this date. Plans and coverage change. */
export const CELLULAR_REVIEWED = '2026-10-06';
export const CELLULAR_GROUPS = ['Major networks', 'Prepaid & flexible', 'Internet bundles', 'Travel eSIM'] as const;
export type CellularGroup = typeof CELLULAR_GROUPS[number];
export type CellularProvider = { id: string; name: string; group: CellularGroup; description: string; url: string };

/** A broad, alphabetical directory within each group. Never an exhaustive market or coverage claim. */
export const CELLULAR_PROVIDERS: CellularProvider[] = [
  { id: 'att', name: 'AT&T', group: 'Major networks', description: 'Compare monthly and multi-line plans.', url: 'https://www.att.com/plans/wireless/' },
  { id: 'boost', name: 'Boost Mobile', group: 'Major networks', description: 'Phone plans and bring-your-own-phone options.', url: 'https://www.boostmobile.com/plans' },
  { id: 'tmobile', name: 'T-Mobile', group: 'Major networks', description: 'Compare monthly and multi-line plans.', url: 'https://www.t-mobile.com/cell-phone-plans' },
  { id: 'verizon', name: 'Verizon', group: 'Major networks', description: 'Compare monthly and multi-line plans.', url: 'https://www.verizon.com/plans/unlimited/' },
  { id: 'att-prepaid', name: 'AT&T Prepaid', group: 'Prepaid & flexible', description: 'Monthly and multi-month prepaid options.', url: 'https://www.att.com/prepaid/plans/' },
  { id: 'consumer-cellular', name: 'Consumer Cellular', group: 'Prepaid & flexible', description: 'Compare talk, text and data plans.', url: 'https://www.consumercellular.com/shopping/choose/plan' },
  { id: 'cricket', name: 'Cricket Wireless', group: 'Prepaid & flexible', description: 'Prepaid plans for one or more lines.', url: 'https://www.cricketwireless.com/plans/phone' },
  { id: 'gen-mobile', name: 'Gen Mobile', group: 'Prepaid & flexible', description: 'Prepaid phone plans; compare included international calls.', url: 'https://www.genmobile.com/' },
  { id: 'good2go', name: 'Good2Go Mobile', group: 'Prepaid & flexible', description: 'Prepaid plans, including longer prepaid terms.', url: 'https://www.good2gomobile.com/' },
  { id: 'google-fi', name: 'Google Fi Wireless', group: 'Prepaid & flexible', description: 'Flexible and unlimited options; check phone compatibility.', url: 'https://fi.google.com/about/plans' },
  { id: 'h2o', name: 'H2O Wireless', group: 'Prepaid & flexible', description: 'Prepaid plans with international calling options.', url: 'https://www.h2owireless.com/plan/monthly' },
  { id: 'lively', name: 'Lively', group: 'Prepaid & flexible', description: 'Phone plans with optional help and safety features.', url: 'https://shop.lively.com/pages/compare-plan' },
  { id: 'lyca', name: 'Lyca Mobile', group: 'Prepaid & flexible', description: 'Prepaid plans with international calling options.', url: 'https://www.lycamobile.us/en/plans/best-prepaid-phone-plans/' },
  { id: 'metro', name: 'Metro by T-Mobile', group: 'Prepaid & flexible', description: 'Prepaid phone and multi-line options.', url: 'https://www.metrobyt-mobile.com/cell-phone-plans' },
  { id: 'mint', name: 'Mint Mobile', group: 'Prepaid & flexible', description: 'Multi-month prepaid plans. Compare the renewal price.', url: 'https://www.mintmobile.com/plans/' },
  { id: 'mobilex', name: 'MobileX', group: 'Prepaid & flexible', description: 'App-managed phone plans and data options.', url: 'https://mymobilex.com/' },
  { id: 'patriot', name: 'Patriot Mobile', group: 'Prepaid & flexible', description: 'Compare phone plans and compatible devices.', url: 'https://patriotmobile.com/' },
  { id: 'puretalk', name: 'PureTalk', group: 'Prepaid & flexible', description: 'Talk, text and data plans for compatible phones.', url: 'https://www.puretalk.com/cell-plans' },
  { id: 'red-pocket', name: 'Red Pocket Mobile', group: 'Prepaid & flexible', description: 'Monthly and annual prepaid options.', url: 'https://www.redpocket.com/plans' },
  { id: 'simple', name: 'Simple Mobile', group: 'Prepaid & flexible', description: 'Prepaid plans with international calling options.', url: 'https://www.simplemobile.com/serviceplan' },
  { id: 'speedtalk', name: 'SpeedTalk Mobile', group: 'Prepaid & flexible', description: 'Prepaid phone plans; choose a phone plan, not a tracker plan.', url: 'https://shop.speedtalkmobile.com/' },
  { id: 'straight-talk', name: 'Straight Talk Wireless', group: 'Prepaid & flexible', description: 'Prepaid phone plans and multi-line options.', url: 'https://www.straighttalk.com/all-plans' },
  { id: 'tmobile-prepaid', name: 'T-Mobile Prepaid', group: 'Prepaid & flexible', description: 'Prepaid talk, text and data plans.', url: 'https://prepaid.t-mobile.com/prepaid-plans' },
  { id: 'tello', name: 'Tello', group: 'Prepaid & flexible', description: 'Build a plan around your minutes and data needs.', url: 'https://tello.com/buy/custom_plans' },
  { id: 'textnow', name: 'TextNow', group: 'Prepaid & flexible', description: 'App-based calling with wireless options. Check verification-text support.', url: 'https://help.textnow.com/hc/en-us/articles/360043031693-TextNow-Service-FAQ' },
  { id: 'ting', name: 'Ting Mobile', group: 'Prepaid & flexible', description: 'Compare data plans and device compatibility.', url: 'https://tingmobile.com/' },
  { id: 'total', name: 'Total Wireless', group: 'Prepaid & flexible', description: 'Prepaid phone and multi-line plans.', url: 'https://www.totalwireless.com/m/plans' },
  { id: 'tracfone', name: 'Tracfone', group: 'Prepaid & flexible', description: 'Prepaid options for smartphones and basic phones.', url: 'https://www.tracfone.com/products/plans-and-services/phone-service-plans.html' },
  { id: 'twigby', name: 'Twigby Mobile', group: 'Prepaid & flexible', description: 'Prepaid plans with different data amounts.', url: 'https://www.twigby.com/' },
  { id: 'ultra', name: 'Ultra Mobile', group: 'Prepaid & flexible', description: 'Prepaid plans with international calling options.', url: 'https://www.ultramobile.com/plans/' },
  { id: 'us-mobile', name: 'US Mobile', group: 'Prepaid & flexible', description: 'Shared-data and unlimited plans; compare network options.', url: 'https://www.usmobile.com/plans' },
  { id: 'verizon-prepaid', name: 'Verizon Prepaid', group: 'Prepaid & flexible', description: 'Prepaid phone plans and multi-line options.', url: 'https://www.verizon.com/prepaid/plans/phone-plans/' },
  { id: 'visible', name: 'Visible', group: 'Prepaid & flexible', description: 'App-managed prepaid phone plans.', url: 'https://www.visible.com/plans' },
  { id: 'family-mobile', name: 'Walmart Family Mobile', group: 'Prepaid & flexible', description: 'Prepaid phone plans for one or more lines.', url: 'https://www.myfamilymobile.com/serviceplan' },
  { id: 'astound', name: 'Astound Mobile', group: 'Internet bundles', description: 'Check Astound Internet and address eligibility first.', url: 'https://www.astound.com/mobile/' },
  { id: 'optimum', name: 'Optimum Mobile', group: 'Internet bundles', description: 'Compare standalone terms and internet bundle discounts.', url: 'https://www.optimum.com/mobile/plan' },
  { id: 'spectrum', name: 'Spectrum Mobile', group: 'Internet bundles', description: 'Requires Spectrum Internet to sign up; compare ongoing bundle costs.', url: 'https://www.spectrum.com/mobile/plans' },
  { id: 'xfinity', name: 'Xfinity Mobile', group: 'Internet bundles', description: 'Check Xfinity Internet eligibility; not a confirmed UTD-area bundle.', url: 'https://www.xfinity.com/learn/mobile/plan' },
  { id: 'airalo', name: 'Airalo', group: 'Travel eSIM', description: 'Short-stay US eSIM options. Check whether calls and SMS are included.', url: 'https://www.airalo.com/united-states-esim' },
  { id: 'holafly', name: 'Holafly', group: 'Travel eSIM', description: 'Travel data eSIM. Do not assume it includes a US phone number.', url: 'https://esim.holafly.com/esim-usa/' },
  { id: 'nomad', name: 'Nomad', group: 'Travel eSIM', description: 'Travel data eSIM. Check validity, hotspot rules and phone compatibility.', url: 'https://www.nomadesim.com/united-states-eSIM' },
];

export function filterCellularProviders(query = '', group: CellularGroup | 'All' = 'All') {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return CELLULAR_PROVIDERS.filter(provider => (group === 'All' || provider.group === group) && words.every(word => `${provider.name} ${provider.description} ${provider.group}`.toLowerCase().includes(word)));
}

export type PhoneNeeds = {usNumber: boolean; noInternetBundle: boolean};
/** Conservative directory narrowing; this never claims plan, price or device eligibility. */
export function filterCellularForNeeds(providers: CellularProvider[], needs: PhoneNeeds) {
  return providers.filter(provider => (!needs.noInternetBundle || provider.group !== 'Internet bundles')
    && (!needs.usNumber || (provider.group !== 'Travel eSIM' && provider.id !== 'textnow')));
}
