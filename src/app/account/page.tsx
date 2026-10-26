import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PublicHeader, Footer } from '@/components/brand';
import { DeleteAccount } from '@/components/delete-account';
import { comparisonSessionKey } from '@/domain/apartment-discovery';
import { configured } from '@/lib/server';
import { loginIdentity } from '@/lib/login-session';
export const dynamic = 'force-dynamic';

export default async function Account() {
  if (!configured()) redirect('/login');
  const {user,loginVerified} = await loginIdentity();
  if (!user) redirect('/login');
  if (!loginVerified) redirect('/login');
  return <><PublicHeader/><main id="main" className="text-page account-settings">
    <p className="eyebrow">YOUR ACCOUNT</p><h1>Account settings</h1>
    <p>Signed in as {user.email}</p>
    <Link className="back-link" href="/dashboard">Back to my plan</Link>
    <DeleteAccount comparisonKey={comparisonSessionKey('account', user.id)} accountId={user.id}/>
  </main><Footer/></>;
}
