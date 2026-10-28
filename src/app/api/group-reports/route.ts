import { accountsEnabled,assertOrigin,identity,reply } from '@/lib/server';
import { siteGroupForHost } from '@/domain/site-groups';
import { GROUP_B_SOURCES } from '@/data/group-b-content';
import { SPRING_2027_SOURCES } from '@/data/spring-2027';

async function handle(request:Request){
  if(siteGroupForHost(request.headers.get('host'),process.env.NODE_ENV==='development')!=='b')return reply({error:'Page not found.'},404);
  if(request.method!=='GET'){try{assertOrigin(request);}catch{return reply({error:'Please reopen CampusBridge and try again.'},403);}}
  if(!accountsEnabled())return reply({error:'Source reports are temporarily unavailable.'},503);
  try{
    const {client,user,loginVerified}=await identity();
    if(!user)return reply({error:'Log in to report a source.'},401);
    if(!loginVerified)return reply({error:'Your session expired. Please log in again.'},403);
    const columns='id,source_url,message,status,created_at,reviewed_at';
    if(request.method==='GET'){
      const result=await client.from('group_b_source_reports').select(columns).eq('user_id',user.id).order('created_at',{ascending:false}).limit(20);
      return result.error?reply({error:'Your reports could not be loaded.'},503):reply({reports:result.data});
    }
    let body:Record<string,unknown>;
    try{const raw=await request.text();if(raw.length>4000)throw new Error();body=JSON.parse(raw);if(!body||typeof body!=='object'||Array.isArray(body))throw new Error();}catch{return reply({error:'Review your report before submitting.'},400);}
    if(request.method==='DELETE'){
      if(typeof body.id!=='string'||!/^[0-9a-f-]{36}$/i.test(body.id))return reply({error:'Choose a valid report.'},400);
      const result=await client.from('group_b_source_reports').delete().eq('user_id',user.id).eq('id',body.id);
      return result.error?reply({error:'Your report could not be removed.'},503):reply({ok:true});
    }
    const knownSources=new Set<string>([...GROUP_B_SOURCES,...SPRING_2027_SOURCES].map(source=>source.url));
    const message=typeof body.message==='string'?body.message.trim():'';
    if(typeof body.sourceUrl!=='string'||!knownSources.has(body.sourceUrl)||message.length<1||message.length>1500||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(message))return reply({error:'Choose a listed source and describe the issue in 1–1,500 characters.'},400);
    const since=new Date(Date.now()-86_400_000).toISOString();
    const count=await client.from('group_b_source_reports').select('id',{count:'exact',head:true}).eq('user_id',user.id).gte('created_at',since);
    if(count.error)return reply({error:'Your report was not submitted. Please try again.'},503);
    if((count.count??0)>=10)return reply({error:'You have sent ten reports today. Please try again tomorrow.'},429);
    const result=await client.from('group_b_source_reports').insert({user_id:user.id,source_url:body.sourceUrl,message}).select('id,status,created_at').single();
    return result.error?reply({error:'Your report was not submitted. Please try again.'},503):reply({id:result.data.id,status:result.data.status,createdAt:result.data.created_at},201);
  }catch{return reply({error:'Source reports are temporarily unavailable.'},503);}
}
export const GET=handle;export const POST=handle;export const DELETE=handle;
