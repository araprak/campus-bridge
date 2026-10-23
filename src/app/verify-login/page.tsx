import { redirect } from 'next/navigation';
import { PublicHeader, Footer } from '@/components/brand';
import { LoginVerificationForm } from '@/components/login-verification-form';
import { accountsEnabled } from '@/lib/server';
import { loginIdentity, pendingSignup } from '@/lib/login-session';
import { loginDestination } from '@/lib/session-policy';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!accountsEnabled()) redirect('/login');
  const query = await searchParams;
  const { user, sessionId, loginVerified } = await loginIdentity();
  if (loginVerified) redirect(loginDestination(query.next));
  const signup = await pendingSignup();
  if (signup && (query.flow === 'signup' || !user || (signup.verifiedSessionId === sessionId && signup.email === user.email?.toLowerCase()))) return <><PublicHeader/><LoginVerificationForm email={signup.email} remembered={signup.remembered} initiallySent={query.sent === '1'} initiallyVerified={!!signup.verifiedSessionId}/><Footer/></>;
  redirect('/login');
}
