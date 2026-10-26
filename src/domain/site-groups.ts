export type SiteGroup = 'a' | 'b';

export const GROUPS = {
  a: {
    name: 'Group A', host: 'grp-a.campusbridgeguide.com',
    title: 'Explore your arrival.',
    description: 'Maps, transportation and arrival, plus research into what CampusBridge could offer next.',
    features: ['Google Maps experience', 'Transportation and arrival', 'Campus expansion and premium research'],
  },
  b: {
    name: 'Group B', host: 'grp-b.campusbridgeguide.com',
    title: 'Plan with more confidence.',
    description: 'Compare your expenses, keep track of reminders and understand the sources behind your next steps.',
    features: ['Expenses and budgeting', 'Helpful reminders', 'Accessibility and trust'],
  },
} as const;

export function siteGroupForHost(host: string | null, development = false): SiteGroup | null {
  if (!host || host.includes(',') || /[\s/@\\?#]/.test(host)) return null;
  const normalized = host.toLowerCase();
  for (const group of ['a', 'b'] as const) {
    if (normalized === GROUPS[group].host) return group;
    if (development && new RegExp(`^grp-${group}\\.localhost(?::[0-9]{1,5})?$`).test(normalized)) return group;
  }
  return null;
}

export function allowedRequestOrigin(origin: string | null, requestUrl: string, canonicalOrigin: string, deploymentHost?: string, development = false, requestHost?: string | null): boolean {
  if (!origin) return false;
  try {
    const request = new URL(requestUrl);
    const source = new URL(origin);
    // An Origin contains only its origin, never a path, user information or a trailing slash.
    // Next.js can reconstruct request.url using its internal listening hostname.
    // Match the actual incoming Host, then independently require a known public origin.
    if (source.origin !== origin || source.username || source.password || source.host !== (requestHost ?? request.host).toLowerCase()) return false;
    if (origin === new URL(canonicalOrigin).origin && (source.protocol === 'https:' || development)) return true;
    if (source.protocol === 'https:' && siteGroupForHost(source.host)) return true;
    if (deploymentHost && source.protocol === 'https:' && source.host === deploymentHost) return true;
    return development && source.protocol === 'http:' && (
      ['localhost', '127.0.0.1', '[::1]'].includes(source.hostname) || !!siteGroupForHost(source.host, true)
    );
  } catch { return false; }
}
