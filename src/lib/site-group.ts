import 'server-only';
import { headers } from 'next/headers';
import { siteGroupForHost } from '@/domain/site-groups';

export async function requestSiteGroup() {
  return siteGroupForHost((await headers()).get('host'), process.env.NODE_ENV === 'development');
}
