import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import type { StudentState } from '../src/lib/model.ts';
const globalKey='__campusbridgeTaskApiTest';
const stub=`const state=()=>globalThis.${globalKey};
 export const accountsEnabled=()=>true;
 export function assertOrigin(request){if(request.headers.get('origin')!=='https://campusbridge.example')throw Error('invalid_origin');}
 export const identity=async()=>({client:{rpc:async(name,args)=>{state().calls.push({name,args});return {error:state().rpcError};}},user:state().loggedIn?{id:'owner',email:'owner@example.invalid'}:null,loginVerified:state().approved,verified:null});
 export const jsonBody=request=>request.json();
 export const readState=async()=>state().current;
 export const reply=(value,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store'}});`;
registerHooks({resolve(specifier,context,nextResolve){
 if(specifier==='@/lib/server')return {url:'data:text/javascript,'+encodeURIComponent(stub),shortCircuit:true};
 if(!specifier.startsWith('@/'))return nextResolve(specifier,context);
 const path=specifier.slice(2);const url=new URL(`../src/${path}${path.endsWith('.json')?'':'.ts'}`,import.meta.url).href;
 const resolved=nextResolve(url,context);return url.endsWith('.json')?{...resolved,importAttributes:{type:'json'}}:resolved;
}});
const {initialState}=await import('../src/lib/model.ts');
const {GET,POST}=await import('../src/app/api/account/route.ts');
type Setup={current:StudentState;loggedIn:boolean;approved:boolean;rpcError:null|{message:string};calls:{name:string,args:Record<string,unknown>}[]};
function setup(){
 const value:Setup={current:{...initialState(),name:'Alex',onboardingComplete:true,revision:5},loggedIn:true,approved:true,rpcError:null,calls:[]};
 (globalThis as unknown as Record<string,unknown>)[globalKey]=value;return value;
}
function request(state:StudentState,taskId='arrange-electricity',action='progress',origin='https://campusbridge.example'){
 return new Request('https://campusbridge.example/api/account',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify({action,taskId,state})});
}

test('account API sends the derived three-state value and exact revision to the scoped RPC',async()=>{
 for(const [state,record] of Object.entries({completed:{completedAt:'2026-10-15T19:00:00Z'},not_applicable:{completedAt:null,notApplicableAt:'2026-10-15T19:00:00Z'},pending:{completedAt:null}})){
  const fixture=setup();const candidate={...fixture.current,progress:{'arrange-electricity':record}};
  const result=await POST(request(candidate));assert.equal(result.status,200);
  assert.deepEqual(fixture.calls,[{name:'set_task_state',args:{p_task:'arrange-electricity',p_state:state,p_revision:5}}]);
  assert.deepEqual((await result.json()).state,fixture.current,'adopt authoritative saved response');
  assert.equal(result.headers.get('Cache-Control'),'private, no-store');
 }
});

test('legacy utility actions remain accepted and client-forged applicability cannot authorize a task',async()=>{
 const fixture=setup();
 const candidate={...fixture.current,progress:{'confirm-electricity-responsibility':{completedAt:null}}};
 assert.equal((await POST(request(candidate,'confirm-electricity-responsibility'))).status,200);
 assert.equal(fixture.calls[0].args.p_state,'pending');
 fixture.calls=[];
 const forged={...fixture.current,answers:{...fixture.current.answers,transport:'car' as const,hasCar:true},progress:{'arrange-campus-parking':{completedAt:'2026-10-15T19:00:00Z'}}};
 assert.equal((await POST(request(forged,'arrange-campus-parking'))).status,400);
 assert.equal(fixture.calls.length,0);
});

test('task-state API preserves auth, validation, revision conflict, and reset semantics',async()=>{
 const fixture=setup();fixture.loggedIn=false;
 assert.equal((await GET()).status,401);assert.equal((await POST(request(fixture.current))).status,401);
 fixture.loggedIn=true;fixture.approved=false;assert.equal((await POST(request(fixture.current))).status,403);
 fixture.approved=true;
 assert.equal((await POST(request({...fixture.current,progress:{'arrange-electricity':{completedAt:'2026-10-15T19:00:00Z',notApplicableAt:'2026-10-15T19:00:00Z'}}}))).status,400);
 assert.equal((await POST(request(fixture.current,'arrange-electricity','progress','https://attacker.example'))).status,400);
 assert.equal(fixture.calls.length,0);
 fixture.rpcError={message:'revision_conflict'};
 const conflict=await POST(request(fixture.current));assert.equal(conflict.status,409);
 assert.match((await conflict.json()).error,/another session/);
 fixture.calls=[];fixture.rpcError=null;
 assert.equal((await POST(request(fixture.current,'','reset_progress'))).status,200);
 assert.deepEqual(fixture.calls,[{name:'reset_task_completions',args:{p_revision:5}}]);
});
