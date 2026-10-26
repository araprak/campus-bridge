import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { authCookieOptions, PERSIST_COOKIE } from './lib/session-policy';
export async function proxy(request:NextRequest){
  let response=NextResponse.next({request});
  if(!process.env.NEXT_PUBLIC_SUPABASE_URL||!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)return response;
  const client=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,{cookies:{getAll:()=>request.cookies.getAll(),setAll:items=>{items.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});items.forEach(({name,value,options})=>response.cookies.set(name,value,authCookieOptions(value,options,request.cookies.get(PERSIST_COOKIE)?.value,process.env.VERIFICATION_SECRET||'')));}}});
  await client.auth.getClaims();
  response.headers.set('Cache-Control','private, no-store');
  return response;
}
export const config={matcher:['/login','/verify-login','/account/:path*','/dashboard/:path*','/profile/:path*','/onboarding/:path*','/tasks/:path*','/group-tools','/verify-utd/:path*','/api/:path*','/auth/:path*','/reset-password']};
