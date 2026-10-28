import { accountsEnabled,assertOrigin,identity,reply } from '@/lib/server';
import { groupDataTable,expectedGroupRevision } from '@/domain/group-data-access';
import { parseGroupAArrivalRoute } from '@/domain/group-a-arrival';
import { readConnectedBudgetDocument } from '@/domain/group-b-connected-budget';
import { readGroupBReminderDocument } from '@/domain/group-b-reminders';

type Context={params:Promise<{kind:string}>};
async function handle(request:Request,context:Context){
  const {kind}=await context.params;
  const table=groupDataTable(request.headers.get('host'),kind,process.env.NODE_ENV==='development');
  if(!table)return reply({error:'Page not found.'},404);
  const writing=request.method!=='GET';
  if(writing){try{assertOrigin(request);}catch{return reply({error:'Please reopen CampusBridge and try again.'},403);}}
  if(!accountsEnabled())return reply({error:'Account saving is temporarily unavailable.'},503);
  try{
    const {client,user,loginVerified}=await identity();
    if(!user)return reply({error:'Log in to access your saved tools.'},401);
    if(!loginVerified)return reply({error:'Your session expired. Please log in again.'},403);
    const select='data,revision,updated_at';
    if(!writing){
      const result=await client.from(table).select(select).eq('user_id',user.id).eq('kind',kind).maybeSingle();
      if(result.error)return reply({error:'Your saved data could not be loaded.'},503);
      return reply(result.data?{data:result.data.data,revision:result.data.revision,updatedAt:result.data.updated_at}:{data:null,revision:0,updatedAt:null});
    }
    let body:Record<string,unknown>;
    try{const text=await request.text();if(new TextEncoder().encode(text).length>60_000)throw new Error();body=JSON.parse(text);if(!body||typeof body!=='object'||Array.isArray(body)||!expectedGroupRevision(body.expectedRevision))throw new Error();}
    catch{return reply({error:'Choose valid data and a saved revision.'},400);}
    const revision=body.expectedRevision as number;
    const conflict=()=>reply({error:'This data changed on another device. Reload the saved copy before saving again; your draft has been kept.'},409);
    if(request.method==='DELETE'){
      if(revision===0){const current=await client.from(table).select('revision').eq('user_id',user.id).eq('kind',kind).maybeSingle();if(current.error)return reply({error:'Your saved data was not changed.'},503);if(current.data)return conflict();}
      else{const result=await client.from(table).update({data:null,revision:revision+1,updated_at:new Date().toISOString()}).eq('user_id',user.id).eq('kind',kind).eq('revision',revision).select('revision');if(result.error)return reply({error:'Your saved data was not changed.'},503);if(!result.data.length)return conflict();}
      return reply({data:null,revision:revision===0?0:revision+1,updatedAt:null});
    }
    if(body.consent!==true)return reply({error:'Choose Save to account to give permission to store this data.'},400);
    const data=kind==='arrival'?parseGroupAArrivalRoute(body.data):kind==='budget'?readConnectedBudgetDocument(body.data):readGroupBReminderDocument(body.data);
    if(!data)return reply({error:'Review the fields before saving.'},400);
    const row={data,revision:revision+1,updated_at:new Date().toISOString()};
    const result=revision===0
      ?await client.from(table).insert({...row,user_id:user.id,kind}).select(select).single()
      :await client.from(table).update(row).eq('user_id',user.id).eq('kind',kind).eq('revision',revision).select(select).maybeSingle();
    if(result.error){if(result.error.code==='23505')return conflict();return reply({error:'Your saved data was not changed. Please try again.'},503);}
    if(!result.data)return conflict();
    return reply({data:result.data.data,revision:result.data.revision,updatedAt:result.data.updated_at});
  }catch{return reply({error:'Your saved data was not changed. Please try again.'},503);}
}
export const GET=handle;export const PUT=handle;export const DELETE=handle;
