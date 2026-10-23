import { NextResponse } from 'next/server';
import { serverClient, siteUrl } from '@/lib/server';
export async function GET(request:Request){
  const url=new URL(request.url);const code=url.searchParams.get('code');
  if(code){try{const client=await serverClient();const {error}=await client.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(`${siteUrl()}${url.searchParams.get('flow')==='recovery'?'/reset-password':'/login'}`);}catch{}}
  return NextResponse.redirect(`${siteUrl()}/login?notice=expired`);
}
