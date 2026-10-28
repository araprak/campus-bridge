import type { Metadata } from 'next';
import { GroupSiteBanner } from '@/components/group-site-banner';
import { GroupBLanguage } from '@/components/group-b-language';
import { requestSiteGroup } from '@/lib/site-group';
import { cookies } from 'next/headers';
import { GROUP_B_LANGUAGE_COOKIE,readWebsiteLanguage,websiteLanguageInfo } from '@/domain/group-b-language';
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
export default async function Layout({ children }: { children: React.ReactNode }) {
  const group=await requestSiteGroup();
  const language=group==='b'?readWebsiteLanguage((await cookies()).get(GROUP_B_LANGUAGE_COOKIE)?.value):'en';
  const info=websiteLanguageInfo(language);
  return <html lang={language} dir={info.direction}><body><a className="skip-link" href="#main">Skip to content</a><GroupSiteBanner/>{group==='b'&&<GroupBLanguage initialLanguage={language}/>} {children}</body></html>;
}
