import { PublicHeader, Footer } from '@/components/brand';
import { AuthForm } from '@/components/auth-form';
import { accountsEnabled } from '@/lib/server';
export const dynamic='force-dynamic';
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|undefined>>}) {
 const query=await searchParams;const notice=query.notice==='expired'?'This email link expired or was opened in a different browser. Try logging in or request a new reset link.':query.reset==='success'?'Your password was updated. Please log in.':undefined;
 return <><PublicHeader/><AuthForm mode='signup' enabled={accountsEnabled()} notice={notice}/><Footer/></>;
}
