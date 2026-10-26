import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { initialState, validateState, type StudentState } from './model';
import { authCookieOptions, PERSIST_COOKIE } from './session-policy';
import { allowedRequestOrigin } from '../domain/site-groups';
export function configured(){return !!(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);}
export function accountsEnabled(){
  const ready=configured()&&process.env.CAMPUSBRIDGE_ACCOUNTS_ENABLED==='true'
    &&!!process.env.SUPPORT_EMAIL&&!!process.env.SUPABASE_SECRET_KEY
    &&!!process.env.RESEND_API_KEY&&!!process.env.VERIFICATION_FROM
    &&(process.env.VERIFICATION_SECRET?.length||0)>=32;
  if(!ready)return false;
  try{const url=new URL(process.env.NEXT_PUBLIC_SITE_URL||'');return process.env.NODE_ENV==='development'||(url.protocol==='https:'&&!['localhost','127.0.0.1','[::1]'].includes(url.hostname));}catch{return false;}
}
export function siteUrl(){const url=process.env.NEXT_PUBLIC_SITE_URL||'http://127.0.0.1:3000';return new URL(url).origin;}
export async function serverClient(){
  if(!configured())throw new Error('Account access is temporarily unavailable. Please try again later.');
  const jar=await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{
    cookies:{
      getAll:()=>jar.getAll(),
      setAll:items=>{try{items.forEach(({name,value,options})=>jar.set(name,value,authCookieOptions(value,options,jar.get(PERSIST_COOKIE)?.value,process.env.VERIFICATION_SECRET||'')));}catch{/* Server components cannot set cookies; proxy refreshes them. */}},
    },
  });
}
export function adminClient(){if(!configured()||!process.env.SUPABASE_SECRET_KEY)throw new Error('Verification is not available yet.');return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SECRET_KEY,{auth:{autoRefreshToken:false,persistSession:false}});}
export function assertOrigin(request:Request){
  if(!allowedRequestOrigin(request.headers.get('origin'),request.url,siteUrl(),process.env.VERCEL_URL,process.env.NODE_ENV==='development',request.headers.get('host')))throw new Error('Please reopen CampusBridge and try again.');
}
export async function jsonBody(request:Request){const body=await request.text();if(body.length>20_000)throw new Error('The request is too large.');return JSON.parse(body);}
export function reply(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'private, no-store'}});}
export async function identity(){
  const {loginIdentity}=await import('./login-session');
  const context=await loginIdentity();const {client,user,loginVerified}=context;
  if(!user||!loginVerified)return {...context,verified:null};
  const {data:verified,error:verificationError}=await client.from('institution_verifications').select('email,verified_at,revoked_at').eq('user_id',user.id).maybeSingle();
  if(verificationError)throw new Error('Account information could not be loaded. Please try again.');
  return {...context,verified:verified?.verified_at&&!verified.revoked_at?verified:null};
}
export async function readState(client:Awaited<ReturnType<typeof serverClient>>,userId:string,email:string,utdEmail:string=''):Promise<StudentState>{
  const [profile,answers,progress]=await Promise.all([
    client.from('profiles').select('display_name,revision').eq('user_id',userId).single(),
    client.from('onboarding_answers').select('answers,completed_at').eq('user_id',userId).maybeSingle(),
    client.from('user_task_progress').select('task_id,completed_at,not_applicable_at,updated_at').eq('user_id',userId),
  ]);
  if(profile.error||answers.error||progress.error)throw new Error('Your saved plan could not be loaded. Please try again.');
  const initial=initialState();
  const state=validateState({...initial,name:profile.data.display_name||'',revision:profile.data.revision,answers:answers.data?.answers||initial.answers,onboardingComplete:!!answers.data?.completed_at,progress:Object.fromEntries((progress.data||[]).map(p=>[p.task_id,{completedAt:p.completed_at,notApplicableAt:p.not_applicable_at,updatedAt:p.updated_at}]))});
  return {...state,email,utdEmail};
}
