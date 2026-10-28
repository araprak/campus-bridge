'use client';
import { useEffect,useId,useState } from 'react';
import { tasks,type StudentState } from '@/lib/model';
import { SPRING_2027_DEADLINES,SPRING_2027_SOURCES } from '@/data/spring-2027';
import { readGroupBReminderDocument,readStudentReminders,reminderCalendar,reminderStatus,resolveReminderDeadline,type GroupBReminderDocument,type StudentReminder } from '@/domain/group-b-reminders';
import { useGroupCloudData } from './use-group-cloud-data';
import { GroupBCloudControls } from './group-b-cloud-controls';
import styles from './group-b-tools.module.css';
const initial=():GroupBReminderDocument=>({schema:2,enabled:false,reminders:[]});
function downloadCalendar(content:string){const url=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='campusbridge-reminder.ics';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function GroupBStudentReminders({accountId,state}:{accountId:string;state:StudentState}){
 const id=useId(),saved=useGroupCloudData({kind:'reminders',parse:readGroupBReminderDocument,initialData:initial});
 const [title,setTitle]=useState(''),[localDateTime,setLocalDateTime]=useState(''),[timeZone,setTimeZone]=useState('America/Chicago'),[error,setError]=useState(''),[notice,setNotice]=useState(''),[now,setNow]=useState<number|null>(null),[dates,setDates]=useState<Record<string,string>>({}),[alerts,setAlerts]=useState<Record<string,boolean>>({});
 useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),60_000);return()=>clearInterval(timer);},[]);
 function add(input:{title:string;localDateTime:string;timeZone:string;sourceId?:string;templateId?:string}){
  if(saved.data.reminders.length>=30){setError('Keep at most 30 reminders. Remove one before adding another.');return false;}
  if(input.templateId&&saved.data.reminders.some(row=>row.templateId===input.templateId)){setError('This template is already in your list. Edit the existing reminder instead.');return false;}
  if(!input.title.trim()||input.title.trim().length>120){setError('Enter a title of up to 120 characters.');return false;}
  const deadline=resolveReminderDeadline(input.localDateTime,input.timeZone);if(!deadline.ok){setError(deadline.message);return false;}
  saved.setData(current=>({...current,enabled:true,reminders:[...current.reminders,{...input,id:crypto.randomUUID(),title:input.title.trim(),utcISO:deadline.iso,done:false}]}));setError('');setNotice('Added to this visit. Choose Save to my account to keep the list across devices.');return true;
 }
 function edit(reminder:StudentReminder,patch:Partial<StudentReminder>){const next={...reminder,...patch};const deadline=resolveReminderDeadline(next.localDateTime,next.timeZone);if(!deadline.ok){setError(deadline.message);return;}saved.setData(current=>({...current,reminders:current.reminders.map(row=>row.id===next.id?{...next,utcISO:deadline.iso}:row)}));setError('');}
 function exportOne(reminder:StudentReminder){try{downloadCalendar(reminderCalendar(reminder,new Date(),alerts[reminder.id]?{alarmMinutes:15}:{}));setNotice('Calendar file prepared. Import it into your calendar and check its notification settings. CampusBridge does not deliver calendar alerts.');}catch{setError('Check the reminder date and time before exporting.');}}
 return <section className={styles.section} aria-labelledby={`${id}-title`}>
 <p className={styles.kicker}>Group B · Helpful reminders</p><h2 id={`${id}-title`}>Keep your Spring 2027 next steps together</h2>
 <p>Choose the templates that apply to you, then edit your reminder times. Source dates are navigation references; your university instructions determine your actual requirement. No health records, I-20 numbers or immigration documents belong here.</p>
 <GroupBCloudControls saved={saved} accountId={accountId} kind="reminders" parseLegacy={value=>{const reminders=readStudentReminders(value);return reminders?{schema:2 as const,enabled:true,reminders}:null;}}/>
 <fieldset className={styles.loadingGuard} disabled={saved.loading}>
 <legend className={styles.srOnly}>Edit reminders</legend>
 <label className={styles.check}><input type="checkbox" checked={saved.data.enabled} onChange={event=>saved.setData(current=>({...current,enabled:event.target.checked}))}/>Show my reminder list</label>
 <p className={styles.note}>Off by default. Adding a reminder turns the list on for this visit. Turning it off hides the list; Save applies that preference to your account. Delete account copy clears it. CampusBridge sends no email, texts or background notifications. Imported calendar events must be removed in the calendar app separately.</p>
 <h3>Official dates and personal planning templates</h3>
 <p className={styles.note}>Templates with a published date but no exact time use 9 a.m. Dallas time as your editable planning reminder, not an official cutoff. A template with no verified date requires your chosen date/time. Eligibility appears on each card; add only the steps that apply.</p>
 <div className={styles.templateGrid}>{SPRING_2027_DEADLINES.map(template=>{const source=SPRING_2027_SOURCES.find(row=>row.id===template.sourceId)!;const choice=dates[template.id]??(template.date?`${template.date}T${template.time??'09:00'}`:'');return <article className={styles.template} key={template.id}>
 <h4>{template.title}</h4><p className={styles.note}>Applies to: {template.eligibility.replaceAll('-',' ')} · {template.date??'Choose a planning date'}{template.time?` · ${template.time} Dallas time`:''}</p><p className={styles.note}>{template.note}</p>
 <p className={styles.note}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.publisher}</a> · Checked {source.checkedOn}</p>
 <label className={styles.field} htmlFor={`${id}-template-${template.id}`}>My reminder time · America/Chicago<input id={`${id}-template-${template.id}`} type="datetime-local" min="2000-01-01T00:00" max="2100-12-31T23:59" value={choice} onChange={event=>setDates(current=>({...current,[template.id]:event.target.value}))}/></label>
 <button type="button" disabled={!choice||saved.data.reminders.some(row=>row.templateId===template.id)} onClick={()=>add({title:template.title,localDateTime:choice,timeZone:template.timeZone,sourceId:template.sourceId,templateId:template.id})}>{saved.data.reminders.some(row=>row.templateId===template.id)?'Added':'Add this reminder'}</button>
 </article>;})}</div>
 <h3>From my plan</h3><p>Your shared arrival date is {state.answers.arrivalDate}. Confirm your flight and lease dates separately.</p><button type="button" disabled={saved.data.reminders.some(row=>row.templateId==='arrival')} onClick={()=>add({title:'Review my arrival-day plan',localDateTime:`${state.answers.arrivalDate}T09:00`,timeZone:'America/Chicago',templateId:'arrival'})}>Add my arrival-day planning reminder</button>
 <form className={styles.reminderForm} onSubmit={event=>{event.preventDefault();if(add({title,localDateTime,timeZone:timeZone.trim()})){setTitle('');setLocalDateTime('');}}}>
 <fieldset><legend>Add a personal reminder</legend><label className={styles.field} htmlFor={`${id}-personal-title`}>Task or deadline<input id={`${id}-personal-title`} required maxLength={120} list={`${id}-tasks`} value={title} onChange={event=>setTitle(event.target.value)}/></label><datalist id={`${id}-tasks`}>{tasks.filter(task=>!state.progress[task.id]?.completedAt&&!state.progress[task.id]?.notApplicableAt).map(task=><option key={task.id} value={task.title}/>)}</datalist>
 <div className={styles.formRow}><label className={styles.field} htmlFor={`${id}-personal-date`}>Date and time<input id={`${id}-personal-date`} type="datetime-local" required min="2000-01-01T00:00" max="2100-12-31T23:59" value={localDateTime} onChange={event=>setLocalDateTime(event.target.value)}/></label><label className={styles.field} htmlFor={`${id}-personal-zone`}>IANA time zone<input id={`${id}-personal-zone`} required maxLength={80} list={`${id}-zones`} value={timeZone} onChange={event=>setTimeZone(event.target.value)}/></label></div><datalist id={`${id}-zones`}>{['America/Chicago','Asia/Kolkata','Asia/Seoul','UTC'].map(zone=><option key={zone}>{zone}</option>)}</datalist><button type="submit">Add reminder</button></fieldset></form>
 {error&&<p className={styles.error} role="alert">{error}</p>}{notice&&<p className={styles.notice} role="status">{notice}</p>}
 {saved.data.enabled&&<><h3>My reminders</h3>{saved.data.reminders.length===0&&<p>No reminders added yet.</p>}<ul className={styles.reminders}>{[...saved.data.reminders].sort((a,b)=>a.utcISO.localeCompare(b.utcISO)).map(reminder=>{const source=SPRING_2027_SOURCES.find(row=>row.id===reminder.sourceId);return <li key={reminder.id}>
 <div><strong>{reminder.title}</strong><span className={styles.badge}>{now===null?'Checking time':reminderStatus(reminder,now)}</span></div>
 <label className={styles.field} htmlFor={`${id}-${reminder.id}-title`}>Reminder title<input id={`${id}-${reminder.id}-title`} value={reminder.title} maxLength={120} onChange={event=>edit(reminder,{title:event.target.value})}/></label>
 <div className={styles.formRow}><label className={styles.field} htmlFor={`${id}-${reminder.id}-date`}>My reminder date/time<input id={`${id}-${reminder.id}-date`} type="datetime-local" min="2000-01-01T00:00" max="2100-12-31T23:59" value={reminder.localDateTime} onChange={event=>edit(reminder,{localDateTime:event.target.value})}/></label><label className={styles.field} htmlFor={`${id}-${reminder.id}-zone`}>Time zone<input key={`${reminder.id}-${reminder.timeZone}`} id={`${id}-${reminder.id}-zone`} defaultValue={reminder.timeZone} maxLength={80} onBlur={event=>edit(reminder,{timeZone:event.target.value.trim()})}/></label></div>
 {source&&<p className={styles.note}><a href={source.url} target="_blank" rel="noopener noreferrer">Official reference</a> · Checked {source.checkedOn}. Your edited reminder time does not change the official requirement.</p>}
 <label className={styles.check}><input type="checkbox" checked={alerts[reminder.id]??false} onChange={event=>setAlerts(current=>({...current,[reminder.id]:event.target.checked}))}/>Request a calendar alert 15 minutes before</label>
 <div className={styles.actions}><button type="button" onClick={()=>edit(reminder,{done:!reminder.done})}>{reminder.done?'Mark pending':'Mark done'}</button><button type="button" onClick={()=>exportOne(reminder)}>Download calendar file (.ics)</button><button type="button" aria-label={`Delete reminder ${reminder.title}`} onClick={()=>saved.setData(current=>({...current,reminders:current.reminders.filter(row=>row.id!==reminder.id)}))}>Remove from list</button></div></li>;})}</ul></>}
 </fieldset>
 </section>;
}
