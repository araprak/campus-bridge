import { redirect } from 'next/navigation';
import { PublicHeader, Footer } from '@/components/brand';
import { AuthForm } from '@/components/auth-form';
import { accountsEnabled } from '@/lib/server';
import { loginIdentity, rememberedLogin } from '@/lib/login-session';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const enabled = accountsEnabled();
  if (enabled) {
    const { loginVerified } = await loginIdentity();
    if (loginVerified) redirect('/dashboard');
  }
  const query = await searchParams;
  const notice = query.deleted === 'success' ? 'Your account and saved plan have been deleted.' : query.notice === 'expired' ? 'This email link expired or was opened in a different browser. Try logging in or request a new reset link.' : query.reset === 'success' ? 'Your password was updated. Please log in.' : undefined;
  const saved = await rememberedLogin();
  return <><PublicHeader/><AuthForm mode="signin" enabled={enabled} notice={notice} initialEmail={saved.email} initialRemember={saved.remembered}/><Footer/></>;
}
