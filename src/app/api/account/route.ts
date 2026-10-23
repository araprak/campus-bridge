import { accountsEnabled, assertOrigin, identity, jsonBody, readState, reply } from '@/lib/server';
import { validateState, tasks } from '@/lib/model';
import { canonicalTaskId, generatePlan, taskState } from '@/domain/plan';
import { dallasDate } from '@/lib/model';
export async function GET(){
  if(!accountsEnabled())return reply({redirect:'/login',error:'Account access is being prepared.'},503);
  try{const {client,user,verified,loginVerified}=await identity();if(!user)return reply({redirect:'/login'},401);if(!loginVerified)return reply({redirect:'/login'},403);return reply({state:await readState(client,user.id,user.email||'',verified?.email||'')});}catch{return reply({error:'Your plan could not be loaded. Please try again.'},503);}
}
export async function POST(request:Request){
  try{
    assertOrigin(request);if(!accountsEnabled())return reply({error:'Account access is not available yet.'},503);
    const {client,user,verified,loginVerified}=await identity();if(!user)return reply({error:'Your session expired. Log in again.'},401);if(!loginVerified)return reply({error:'Your session expired. Please log in again.',redirect:'/login'},403);
    const body=await jsonBody(request);const candidate=validateState(body.state);let result;
    if(body.action==='profile'){
      if(!candidate.name)return reply({error:'Enter a name for your plan.'},400);
      result=await client.rpc('save_student_profile',{p_name:candidate.name,p_answers:candidate.answers,p_revision:candidate.revision});
    }else if(body.action==='progress'){
      const current=await readState(client,user.id,user.email||'',verified?.email||'');
      const plan=generatePlan(current.answers,tasks,current.progress,dallasDate());
      if(!current.onboardingComplete||typeof body.taskId!=='string'||!plan.tasks.some(t=>t.id===canonicalTaskId(body.taskId)))return reply({error:'This task is not in your current plan.'},400);
      result=await client.rpc('set_task_state',{p_task:body.taskId,p_state:taskState(candidate.progress[body.taskId]),p_revision:candidate.revision});
    }else if(body.action==='reset_progress'){
      result=await client.rpc('reset_task_completions',{p_revision:candidate.revision});
    }else return reply({error:'Unknown save action.'},400);
    if(result.error){if(result.error.message.includes('revision_conflict'))return reply({error:'Your plan changed in another session. Refresh before trying again.'},409);return reply({error:'Your changes were not saved. Please try again.'},503);}
    return reply({state:await readState(client,user.id,user.email||'',verified?.email||'')});
  }catch(e){return reply({error:e instanceof Error&&/profile details|unsupported|calendar date/.test(e.message)?e.message:'Your changes were not saved. Please try again.'},400);}
}
