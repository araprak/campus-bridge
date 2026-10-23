export const dynamic='force-dynamic';
import { PublicHeader, Footer } from '@/components/brand';
import { VerificationForm } from '@/components/verification-form';
import { accountsEnabled, identity } from '@/lib/server';
import { redirect } from 'next/navigation';
export default async function Verify(){if(!accountsEnabled())redirect('/login');const {user,verified,loginVerified}=await identity();if(!user)redirect('/login');if(!loginVerified)redirect('/login');if(verified)redirect('/dashboard');return <><PublicHeader/><VerificationForm/><Footer/></>;}
