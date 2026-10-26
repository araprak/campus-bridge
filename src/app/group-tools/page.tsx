import { notFound } from 'next/navigation';
import { ProtectedWorkspace } from '@/components/protected-workspace';
import { requestSiteGroup } from '@/lib/site-group';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Group tools' };
export default async function Page() {
  if (!await requestSiteGroup()) notFound();
  return <ProtectedWorkspace screen="group-tools"/>;
}
