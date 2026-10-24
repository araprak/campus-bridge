'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { ArrowRight, ArrowLeft, Check, CheckCircle2, Circle, Home, BusFront, Lightbulb, GraduationCap, Coffee, LayoutDashboard, UserRound, LogOut, ShieldCheck, RotateCcw, ExternalLink, Clock3, Sparkles, ChevronRight, HelpCircle, CalendarDays } from 'lucide-react';
import { Brand } from './brand';
import { DeleteAccount } from './delete-account';
import { PlanDashboard, transportLabel } from './plan-dashboard';
import { HousingOptions, ElectricityOptions } from './local-setup';
import { InternetOptions, CarArrivalGuide } from './services-setup';
import { CommunityTransitGuide, NeighborhoodGuide } from './community-guides';
import { CampusRoutePlanner } from './campus-route-planner';
import { TransitPassGuide,ParkingGuide,RentalCarGuide, RidePreferenceGuide } from './transport-setup';
import { CellularOptions } from './cellular-options';
import { CampusSupportGuide,CometCardGuide,CampusDestinationsGuide,CampusDiningGuide,CampusEssentialsGuide } from './campus-guide';
import { TRANSIT_MODE_LABELS } from '@/data/transport-options';
import { onboardingCopy } from '@/domain/onboarding';
import { COMPARISON_SESSION_KEYS, comparisonSessionKey, clearComparisonStorage } from '@/domain/apartment-discovery';
import { generatePlan, CATEGORIES, canonicalTaskId,taskState,taskProgress,updateTaskProgress,type Category } from '@/domain/plan';
import { MyPreferences,PreferenceEditor,type PreferenceSave } from './preferences';
import { FieldSelect,TransportFields } from './preference-fields';
import { preferencePatch } from '@/domain/preferences';
import { categoryLabels, horizonLabels, tasks, resources, initialState, validateState, updateTransportAnswers, dallasDate, type StudentState, type Answers } from '@/lib/model';
const icons={housing:Home,transportation:BusFront,services:Lightbulb,campus:GraduationCap,daily_life:Coffee};
const key='campusbridge.demo.v1';
let memory: StudentState|null=null;
export function Workspace({mode,screen='home',taskId,accountId}:{mode:'demo'|'account';screen?:string;taskId?:string;accountId?:string}) {
  const demo=mode==='demo'; const router=useRouter();
  const comparisonKey=comparisonSessionKey(mode,accountId);
  const [state,setState]=useState<StudentState|null>(null); const [error,setError]=useState('');
  const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false); const [localOnly,setLocalOnly]=useState(false); const [resetOpen,setResetOpen]=useState(false);
  const locked=useRef(false);
  const [lastAction,setLastAction]=useState<{id:string;previous:'pending'|'completed'|'not_applicable'}|null>(null);
  const [today,setToday]=useState(dallasDate);
  useEffect(()=>{const update=()=>setToday(dallasDate());const timer=setInterval(update,30000);window.addEventListener('focus',update);document.addEventListener('visibilitychange',update);return()=>{clearInterval(timer);window.removeEventListener('focus',update);document.removeEventListener('visibilitychange',update);};},[]);
  useEffect(()=>{if(state&&lastAction&&!generatePlan(state.answers,tasks,state.progress,today).tasks.some(t=>t.id===canonicalTaskId(lastAction.id)))setLastAction(null);},[state,today,lastAction]);
  const [progressResetOpen,setProgressResetOpen]=useState(false);
  const progressDialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(progressResetOpen)progressDialog.current?.showModal();else progressDialog.current?.close();},[progressResetOpen]);
  const [onboardingVersion,setOnboardingVersion]=useState(0);
  const resetDialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{if(resetOpen)resetDialog.current?.showModal();else resetDialog.current?.close();},[resetOpen]);
  const path=(target:string)=>demo?`/demo/${target}`:target==='plan'?'/dashboard':target==='onboarding'?'/onboarding':target==='profile'?'/profile':`/${target}`;
  useEffect(()=>{
    if(demo){
      let loaded=memory;
      try{const raw=localStorage.getItem(key);if(raw)loaded=validateState(JSON.parse(raw));}
      catch{setLocalOnly(true);setMessage('Saved demo data is unavailable. Changes will last for this session.');}
      setState(loaded||initialState(true));
    } else {
      fetch('/api/account',{cache:'no-store'}).then(async r=>{const body=await r.json();if(!r.ok){if(body.redirect){router.replace(body.redirect);return;}throw new Error(body.error||'Your plan could not be loaded.');}setState(body.state);}).catch(e=>setError(e.message));
    }
  },[demo,router]);
  async function save(next:StudentState,action:'profile'|'progress'|'reset_progress',task?:string){
    if(locked.current)return false;locked.current=true;setBusy(true);setError('');setMessage('');
    try{
      if(demo){
        next=validateState(next);
        memory=next;
        try{localStorage.setItem(key,JSON.stringify(next));setLocalOnly(false);setMessage('Saved on this browser');}
        catch{setLocalOnly(true);setMessage('Saved for this session only');}
        setState(next);
      }else{
        const response=await fetch('/api/account',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,state:next,taskId:task})});
        const body=await response.json();if(!response.ok)throw new Error(body.error||'Could not save. Please try again.');setState(body.state);setMessage('Saved to your account');
      }
      return true;
    }catch(e){setError(e instanceof Error?e.message:'Could not save. Please try again.');return false;}
    finally{locked.current=false;setBusy(false);}
  }
  const savePreferences:PreferenceSave=async (draft,base)=>{
    if(!state||locked.current)return {ok:false,error:'Please wait for the current change to finish.'};
    if(Object.keys(draft).length===1&&'carArrival' in draft&&!(state.answers.transport==='car'&&state.answers.hasCar))return {ok:false,conflict:true,error:'Your current travel plan no longer has a car. Your draft is below; update Getting around first if you now have a car arranged.'};
    const merged=preferencePatch(base,state.answers,draft);
    if(merged.conflicts.length)return {ok:false,conflict:true,error:'These preferences changed while you were editing. Review the saved choices below.'};
    if(!Object.keys(merged.patch).length)return {ok:true};
    locked.current=true;setBusy(true);setError('');setMessage('');
    try{
      const candidate=validateState({...state,answers:updateTransportAnswers(state.answers,merged.patch)});
      if(demo){memory=candidate;try{localStorage.setItem(key,JSON.stringify(candidate));setLocalOnly(false);}catch{setLocalOnly(true);}setState(candidate);}
      else{
        const response=await fetch('/api/account',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'profile',state:candidate})});
        const body=await response.json();
        if(response.status===409){const latest=await fetch('/api/account',{cache:'no-store'});if(latest.ok){const next=await latest.json();setState(next.state);}return {ok:false,conflict:true,error:'Your plan changed in another session. Your draft is still here. Review before saving.'};}
        if(!response.ok)return {ok:false,error:body.error||'Your changes were not saved. Try again.'};
        setState(body.state);
      }
      setMessage('Saved. Your plan is updated.');return {ok:true};
    }catch(e){return {ok:false,error:e instanceof Error?e.message:'Your changes were not saved. Try again.'};}
    finally{locked.current=false;setBusy(false);}
  };
  async function changeTask(id:string,next:'pending'|'completed'|'not_applicable',remember=true){
    if(!state)return;const canonical=canonicalTaskId(id);const previous=taskState(taskProgress(state.progress,canonical));
    if(await save({...state,progress:updateTaskProgress(state.progress,canonical,next)},'progress',canonical)){setLastAction(remember?{id:canonical,previous}:null);}
  }
  async function complete(id:string){if(!state)return;await changeTask(id,taskState(taskProgress(state.progress,id))==='completed'?'pending':'completed');}
  async function undoLast(){if(lastAction)await changeTask(lastAction.id,lastAction.previous,false);}
  async function resetProgress(){if(!state)return;if(await save({...state,progress:Object.fromEntries(Object.keys(state.progress).map(id=>[id,{...state.progress[id],completedAt:null}]))},'reset_progress')){setProgressResetOpen(false);setLastAction(null);setMessage('All completed steps are ready to revisit. Your answers are unchanged.');}}
  async function signOut(){if(demo){router.push('/');return;}setBusy(true);try{const r=await fetch('/api/auth/signout',{method:'POST'});if(!r.ok)throw new Error('Sign out failed. Please try again.');try{clearComparisonStorage(sessionStorage,comparisonKey);}catch{/* Storage may be blocked. */}router.push('/');router.refresh();}catch(e){setError((e as Error).message);setBusy(false);}}
  function reset(){const next=initialState(true);memory=next;try{localStorage.setItem(key,JSON.stringify(next));}catch{setLocalOnly(true);}try{sessionStorage.removeItem(COMPARISON_SESSION_KEYS.demo);}catch{/* Storage may be unavailable. */}setState(next);setOnboardingVersion(v=>v+1);setResetOpen(false);setMessage('Demo reset. Your sample profile is ready.');router.push('/demo/onboarding');}
  if(!state)return <main id="main" className="busy-screen"><div>{error?<><p role="alert">{error}</p><button className="button" onClick={()=>location.reload()}>Try again</button></>:<p>Getting your plan ready…</p>}</div></main>;
  const current=screen==='home'?(state.onboardingComplete?'plan':'onboarding'):screen;
  const onboarding=current==='onboarding'||!state.onboardingComplete;
  const plan=generatePlan(state.answers,tasks,state.progress,today);
  const next=plan.nextTask;
  const details=taskId?tasks.find(t=>t.id===canonicalTaskId(taskId)):null;
  const applicable=taskId?plan.tasks.find(t=>t.id===canonicalTaskId(taskId)):null;
  const utilityCheck=!!details&&['electricity_unknown','internet_unknown','electricity_setup','internet_setup'].includes(details.rule);
  const serviceIncluded=details?.id==='arrange-electricity'?state.answers.electricity==='included':details?.id==='arrange-home-internet'?state.answers.internet==='included':false;
  const housingProvidesService=utilityCheck&&state.answers.housingLocation==='off_campus'&&serviceIncluded;
  const resource=housingProvidesService?undefined:resources.find(r=>r.id===(utilityCheck&&state.answers.housingLocation==='on_campus'?'utd-housing-faq':details?.resourceId));
  return <div className="app-shell"><aside className="sidebar"><Brand light/><p className="sidebar-subtitle">YOUR ARRIVAL & BEYOND</p><nav aria-label="Student navigation"><Link className={current==='plan'?'active':''} href={path('plan')}><LayoutDashboard size={19}/>My plan</Link><Link className={current==='profile'?'active':''} href={path('profile')}><UserRound size={19}/>My preferences</Link></nav><div className="sidebar-bottom"><div className="sidebar-help"><HelpCircle size={21}/><p>A little guidance.<br/>One step at a time.</p><Link href="/about">About CampusBridge <ArrowRight size={14}/></Link></div><button onClick={signOut} disabled={busy}><LogOut size={18}/>{demo?'Exit demo':'Sign out'}</button><Link className="privacy-link" href="/privacy">Privacy & your information</Link></div></aside><div className="app-content"><header className="workspace-header"><span className="workspace-breadcrumb">{onboarding?'Getting started':current==='task'?'My plan / Task details':current==='profile'?'My preferences':'My plan'}</span><div className="workspace-user"><span className="verification-badge"><ShieldCheck size={15}/>{demo?'Demo profile':state.utdEmail?'UTD email verified':'Personal account'}</span><span className="avatar">{state.name.slice(0,1).toUpperCase()||'C'}</span><button className="mobile-signout" onClick={signOut} disabled={busy}><LogOut size={16}/>{demo?'Exit demo':'Sign out'}</button></div></header>{demo&&<div className="demo-bar"><span><Sparkles size={15}/><strong>You’re exploring a sample plan.</strong> {localOnly?'Saved for this session only.':'Progress stays in this browser.'}</span><button onClick={()=>setResetOpen(true)}><RotateCcw size={14}/>Reset demo</button></div>}<main id="main" className={`workspace-main ${onboarding?'onboarding-main':''}`}>{error&&<div role="alert" className="notice error">{error}</div>}{message&&<p className="save-status" role="status"><Check size={14}/>{message}</p>}
  {onboarding?<Onboarding key={`${state.onboardingComplete?'edit':'new'}:${onboardingVersion}`} data={state} demo={demo} busy={busy} onSave={async s=>{if(await save(s,'profile'))router.push(path('plan'));}}/>
  :current==='profile'?<><MyPreferences state={state} busy={busy} onSave={savePreferences}/>{!demo&&<DeleteAccount disabled={busy} comparisonKey={comparisonKey}/>}</>
  :current==='task'?<><Link className="back-link" href={path('plan')}><ArrowLeft size={16}/>Back to my plan</Link>{!details||!applicable?<section className="card empty-state"><h1>This step isn’t in your current plan.</h1><p>It may no longer apply after your answers changed.</p><Link className="button" href={path('plan')}>Return to my plan</Link></section>:<div className="task-detail-layout"><article className="card task-detail"><div className="task-meta"><span className={`category-label category-${details.category}`}>{categoryLabels[details.category]}</span><span><Clock3 size={14}/>{horizonLabels[applicable.horizon]}</span></div><h1>{details.title}</h1><p className="task-why">{details.why}</p><div className="why-box"><h3>Why this is in your plan</h3>{applicable.reasons.map(r=><p key={r}>{r}</p>)}</div>{details.rule==='off_campus'&&<HousingOptions key={comparisonKey||'memory'} comparisonKey={comparisonKey} answers={state.answers} busy={busy} onSave={answers=>save({...state,answers:{...state.answers,...answers}},'profile')}/>} {['electricity_unknown','electricity_setup'].includes(details.rule)&&state.answers.housingLocation==='off_campus'&&state.answers.electricity!=='included'&&<ElectricityOptions answers={state.answers} busy={busy} onSave={answers=>save({...state,answers:{...state.answers,...answers}},'profile')}/>}{['internet_unknown','internet_setup'].includes(details.rule)&&state.answers.housingLocation==='off_campus'&&<InternetOptions answers={state.answers} busy={busy} onSave={answers=>save({...state,answers:{...state.answers,...answers}},'profile')}/>}{details.category==='transportation'&&<><RidePreferenceGuide answers={state.answers}/><RentalCarGuide answers={state.answers} editPath={`${path('profile')}#transport`}/><CampusRoutePlanner answers={state.answers}/>{state.answers.transport!=='car'&&<><CommunityTransitGuide key={state.answers.housingCommunity} answers={state.answers}/><TransitPassGuide/></>}<ParkingGuide answers={state.answers}/></>}{details.id==='check-student-tech'&&<CampusSupportGuide/>}{details.id==='get-comet-card'&&<CometCardGuide/>}{details.id==='find-campus-destinations'&&<CampusDestinationsGuide/>}{details.id==='plan-campus-meals'&&<CampusDiningGuide/>}{details.id==='save-essentials-support'&&<CampusEssentialsGuide/>}{details.id==='set-up-mobile-service'&&<CellularOptions/>}<h2>Final check</h2><ol className="step-list">{details.steps.map((s,i)=><li key={s}><span>{i+1}</span><p>{s}</p></li>)}</ol>{['electricity_unknown','internet_unknown','electricity_setup','internet_setup'].includes(details.rule)&&<div className="service-followup"><p>Need to change your housing’s service arrangement?</p><Link className="inline-link" href={`${path('profile')}#home-services`}>Update my home services <ArrowRight size={16}/></Link></div>}<button disabled={busy} className={`button ${applicable.completedAt?'button-outline':''}`} onClick={()=>complete(details.id)}>{applicable.completedAt?<><RotateCcw size={17}/>Undo completion</>:<><Check size={18}/>Mark complete</>}</button><button type="button" className="button button-outline" disabled={busy} onClick={()=>changeTask(details.id,applicable.state==='not_applicable'?'pending':'not_applicable')}>{applicable.state==='not_applicable'?'Restore this step':'Not applicable to me'}</button><p className="form-hint">{busy?'Saving…':applicable.state==='not_applicable'?'Not applicable. Restore it at any time.':applicable.completedAt?'Completed. You can undo this at any time.':'Mark this complete when you have finished the step.'}</p></article><aside><section className="card resource-card"><span className="resource-source"><ShieldCheck size={16}/>{housingProvidesService?'Your housing':resource?.sourceType==='official_utd'?'Official UTD resource':'Government resource'}</span><h3>{housingProvidesService?'Confirm with your household':resource?.title}</h3><p>{housingProvidesService?'Your lease, leasing office or account holder can confirm how to use the service and report a problem.':resource?.publisher}</p>{resource&&<a className="button full-width" target="_blank" rel="noopener noreferrer" href={resource.url}>Open trusted resource <ExternalLink size={16}/></a>}{resource&&<p className="form-hint">Opens the official source. Check current instructions, availability and requirements there.</p>}</section><section className="help-card"><HelpCircle size={22}/><h3>Who can help?</h3><p>{details.help}</p><p className="small">CampusBridge organizes your next steps. The office or provider can answer questions about your situation.</p></section></aside></div>}
    {/* Keep the editor mounted when a conflict refresh makes the current task inapplicable. */}
    {details?.category==='transportation'&&<CarArrivalGuide key={details.id} answers={state.answers} editPath={`${path('profile')}#transport`} busy={busy} onPreferenceSave={savePreferences}/>}
  </>
  :<PlanDashboard comparisonKey={comparisonKey} state={state} plan={plan} busy={busy} demo={demo} localOnly={localOnly} path={path} complete={complete} canUndo={!!lastAction} onUndoLast={()=>void undoLast()} onTaskState={changeTask} onPreferenceSave={savePreferences} onResetProgress={()=>setProgressResetOpen(true)} onLocationSave={answers=>save({...state,answers:{...state.answers,...answers}},'profile')}/>}

  </main><footer className="app-footer">CampusBridge · Independent student project <Link href="/about">About</Link><Link href="/releases">Version history</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></footer></div><dialog ref={progressDialog} className="modal card" aria-labelledby="undo-all-title" onCancel={()=>setProgressResetOpen(false)} onClose={()=>setProgressResetOpen(false)}><h2 id="undo-all-title">Undo all completed steps?</h2><p>This clears completion checks across your plan. Your home, lease date and other answers stay saved.</p><div className="form-actions"><button autoFocus className="button button-outline" onClick={()=>setProgressResetOpen(false)}>Keep my progress</button><button className="button" disabled={busy} onClick={resetProgress}>Undo all completed</button></div></dialog><dialog ref={resetDialog} className="modal card" aria-labelledby="reset-title" onCancel={()=>setResetOpen(false)} onClose={()=>setResetOpen(false)}><h2 id="reset-title">Start a fresh demo?</h2><p>This resets only the sample profile and demo progress on this browser.</p><div className="form-actions"><button autoFocus className="button button-outline" onClick={()=>setResetOpen(false)}>Keep my demo</button><button className="button" onClick={reset}>Reset demo</button></div></dialog></div>;
}

function Onboarding({data,demo,busy,onSave}:{data:StudentState;demo:boolean;busy:boolean;onSave:(s:StudentState)=>Promise<void>}){
  const [step,setStep]=useState(0);const [draft,setDraft]=useState(data);const [problem,setProblem]=useState('');const a=draft.answers;
  const copy=onboardingCopy(step===0?dallasDate():a.arrivalDate,dallasDate());
  function answer<K extends keyof Answers>(k:K,v:Answers[K]){setDraft(d=>({...d,answers:updateTransportAnswers(d.answers,{[k]:v,...(k==='housingLocation'&&v==='off_campus'&&d.answers.housingType==='residence'?{housingType:'apartment' as const}:{})})}));}
  async function next(e:React.FormEvent){e.preventDefault();setProblem('');if(!draft.name.trim()){setProblem('Enter a name for your plan.');return;}try{validateState(draft);if(step<2)setStep(step+1);else await onSave(validateState({...draft,name:draft.name.trim(),answers:{...draft.answers,...(draft.answers.transport==='car'&&draft.answers.hasCar?{carArrival:draft.answers.carArrival||'undecided'}:{})},onboardingComplete:true}));}catch(e){setProblem((e as Error).message);}}
  return <div className="onboarding-wrap"><div className="onboarding-intro"><p className="eyebrow">A PLAN THAT STARTS WITH YOU</p><h1>{['Let’s start with your arrival.',copy.homeTitle,'What matters to you first?'][step]}</h1><p>{['A few details will help us put your next steps in order.',copy.homeDescription,copy.transportDescription][step]}</p></div><div className="wizard-progress" aria-label={`Step ${step+1} of 3`}>{['Your arrival','Your home','Your priorities'].map((label,i)=><span key={label} className={i<=step?'active':''}><b>{i<step?<Check size={14}/>:i+1}</b>{label}</span>)}</div><form onSubmit={next} className="card onboarding-card">{problem&&<p className="notice error" role="alert">{problem}</p>}{step===0?<><div className="form-field"><label htmlFor="name">What should we call you?</label><input id="name" required maxLength={60} value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} autoComplete={demo?'off':'given-name'}/>{demo&&<p className="form-hint">This is a demo. Use a sample name.</p>}</div><div className="form-field"><label htmlFor="arrival">When did you arrive, or when are you arriving?</label><input type="date" id="arrival" required value={a.arrivalDate} onChange={e=>answer('arrivalDate',e.target.value)}/><p className="form-hint">Your best estimate is fine. You can update it later.</p></div><div className="onboarding-note"><ShieldCheck size={21}/><p>Just the details that shape your plan. No student ID, address, financial information, or documents.</p></div></>:step===1?<><div className="form-grid"><FieldSelect label={copy.location} id="location" value={a.housingLocation} options={[['off_campus','Off campus'],['on_campus','On campus']]} onChange={v=>answer('housingLocation',v as Answers['housingLocation'])}/><FieldSelect label={copy.housingType} id="housing-type" disabled={a.housingLocation==='on_campus'} hint={a.housingLocation==='on_campus'?'No need to choose a home type for campus housing.':undefined} value={a.housingLocation==='on_campus'?'':a.housingType} options={a.housingLocation==='on_campus'?[['','Campus housing']]:[['apartment','Apartment'],['house','House / townhome'],['temporary','Temporary housing']]} onChange={v=>answer('housingType',v as Answers['housingType'])}/></div><FieldSelect label={copy.household} id="household" value={a.household} options={[['roommates','Roommates / shared household'],['alone',copy.alone]]} onChange={v=>answer('household',v as Answers['household'])}/><div className="onboarding-note"><Lightbulb size={21}/><p>You don’t need to know how home services work yet. Your plan will explain electricity and internet and help you find out what your housing provides.</p></div></>:<><TransportFields answers={a} future={a.arrivalDate>dallasDate()} id="setup-transport" onChange={patch=>setDraft(d=>({...d,answers:updateTransportAnswers(d.answers,patch)}))}/><fieldset className="priority-options"><legend>What would you like help with?</legend><p className="form-hint">Choose all that apply. These topics will appear first in your plan. Leave this blank and we’ll suggest an order.</p>{CATEGORIES.map(c=>{const Icon=icons[c];return <label key={c} className={a.priorities.includes(c)?'selected':''}><input type="checkbox" checked={a.priorities.includes(c)} onChange={e=>{setProblem('');answer('priorities',e.target.checked?[...a.priorities,c]:a.priorities.filter(x=>x!==c));}}/><Icon size={18}/>{categoryLabels[c]}</label>})}</fieldset></>}<div className="form-actions"><button type="button" className="button button-outline" disabled={step===0||busy} onClick={()=>setStep(step-1)}><ArrowLeft size={16}/>Back</button><span className="small muted">{step+1} of 3</span><button className="button" disabled={busy}>{busy?'Saving…':step===2?'Show my plan':'Continue'}<ArrowRight size={17}/></button></div></form><p className="onboarding-footer">A useful plan today. Easy to update tomorrow.{!demo&&<><br/><Link className="inline-link" href="/account">Account settings</Link></>}</p></div>;
}
