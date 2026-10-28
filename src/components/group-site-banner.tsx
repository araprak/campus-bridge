import Link from 'next/link';
import { GROUPS } from '@/domain/site-groups';
import { requestSiteGroup } from '@/lib/site-group';
import styles from './group-site-banner.module.css';

export async function GroupSiteBanner() {
  const group = await requestSiteGroup();
  if (!group) return null;
  return <aside className={styles.banner} aria-label={`${GROUPS[group].name} site`}>
    <div><strong>{GROUPS[group].name}</strong><span>{group==='a'?'Maps and arrival features':'Budget, reminders and trust features'}</span></div>
    <nav aria-label="Group site navigation"><Link href="/group-tools">Open group tools</Link><a href="https://campusbridgeguide.com">Main CampusBridge</a></nav>
  </aside>;
}
