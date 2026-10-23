import { redirect } from 'next/navigation';
import { PublicHeader, Footer } from '@/components/brand';
import { AuthForm } from '@/components/auth-form';
import { accountsEnabled } from '@/lib/server';
import { loginIdentity, passwordRecoveryAllowed } from '@/lib/login-session';
export const dynamic = 'force-dynamic';
export default async function Page() {
  if (!accountsEnabled()) redirect('/login');
  const context = await loginIdentity();
  const { user, loginVerified } = context;
  if (!user) redirect('/login?notice=expired');
  if (!loginVerified && !await passwordRecoveryAllowed(context)) redirect('/forgot-password');
  return <><PublicHeader/><AuthForm mode="reset" enabled={true}/><Footer/></>;
}
