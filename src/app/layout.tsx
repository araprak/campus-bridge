import type { Metadata } from 'next';
import { GroupSiteBanner } from '@/components/group-site-banner';
import './globals.css';
import './public-polish.css';
import './student-refresh.css';
import './apartment-discovery.css';
import './google-housing-map.css';
import './roadmap.css';
import './group-sites.css';
export const metadata: Metadata = {
  title: { default: 'CampusBridge — Before you arrive. As you settle in.', template: '%s · CampusBridge' },
  description: 'Plan your move to UT Dallas, from finding a home before arrival to getting settled in your first 30 days. A personal guide for international students.',
  icons: { icon: '/favicon.svg?v=2' },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><a className="skip-link" href="#main">Skip to content</a><GroupSiteBanner/>{children}</body></html>;
}
