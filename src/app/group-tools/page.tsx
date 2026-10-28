import { notFound } from 'next/navigation';
import { ProtectedWorkspace } from '@/components/protected-workspace';
import { requestSiteGroup } from '@/lib/site-group';

export const dynamic = 'force-dynamic';
export async function generateMetadata(){const group=await requestSiteGroup();return {title:group?`Group ${group.toUpperCase()} tools`:{absolute:'Page not found'}};}
export default async function Page() {
  if (!await requestSiteGroup()) notFound();
  return <ProtectedWorkspace screen="group-tools"/>;
}
