'use client';
import { useEffect, useRef, useState } from 'react';
import { groupBStorageKey } from '@/domain/group-b-budget';
import styles from './group-b-tools.module.css';

type Saved<T>={data:T;loading:boolean;busy:boolean;hasSaved:boolean;error:string;notice:string;save:(next?:T)=>Promise<boolean>;remove:()=>Promise<boolean>;reload:()=>Promise<void>};
export function GroupBCloudControls<T>({saved,accountId,kind,parseLegacy}:{saved:Saved<T>;accountId:string;kind:'budget'|'reminders';parseLegacy:(value:unknown)=>T|null}){
 const [consent,setConsent]=useState(false),[legacy,setLegacy]=useState<T|null>(null),[localNotice,setLocalNotice]=useState('');const parser=useRef(parseLegacy);parser.current=parseLegacy;
 useEffect(()=>{try{const raw=localStorage.getItem(groupBStorageKey(accountId,location.hostname,kind));if(raw){const row=JSON.parse(raw);if(row.schema===1&&row.optedIn===true)setLegacy(parser.current(row.data));}}catch{setLocalNotice('The earlier browser copy could not be read. Account saving remains available.');}},[accountId,kind]);
 function clearLegacy(){try{localStorage.removeItem(groupBStorageKey(accountId,location.hostname,kind));setLegacy(null);setLocalNotice('The earlier browser copy was removed from this device.');}catch{setLocalNotice('Use browser site-data settings to remove the earlier browser copy.');}}
 async function importCopy(){if(!legacy||!consent)return;if(await saved.save(legacy)){clearLegacy();setLocalNotice('Imported the earlier browser copy into your account and removed that browser copy.');}}
 return <div className={styles.cloud}>
 <p className={styles.note}>Edits stay in this tab until you choose Save. Saving stores this Group B tool in your CampusBridge account so you can open it on another device. It does not change your shared plan or Group A data.</p>
 <label className={styles.check}><input type="checkbox" checked={consent} onChange={event=>setConsent(event.target.checked)}/>I want to save these entries to my account</label>
 <div className={styles.actions}><button type="button" disabled={!consent||saved.loading||saved.busy} onClick={()=>void saved.save()}>Save to my account</button><button type="button" disabled={saved.loading||saved.busy} onClick={()=>void saved.reload()}>Reload saved copy</button><button type="button" disabled={saved.loading||saved.busy||!saved.hasSaved} onClick={()=>void saved.remove()}>Delete account copy and clear entries</button></div>
 {legacy&&<div className={styles.notice}><p>An earlier browser copy is available. Importing replaces the currently saved {kind}; confirm that you want to replace it. Earlier combined utility amounts map to electricity; one-time totals map to setup. Review and adjust the imported lines before relying on them.</p><button type="button" disabled={!consent||saved.loading||saved.busy} onClick={()=>void importCopy()}>Import this browser copy to my account</button> <button type="button" onClick={clearLegacy}>Discard earlier browser copy</button></div>}
 {saved.loading&&<p role="status">Loading your saved copy…</p>}{saved.busy&&<p role="status">Saving your change…</p>}{saved.error&&<p className={styles.error} role="alert">{saved.error} Reload only when you are ready to replace any unsaved entries.</p>}{saved.notice&&<p className={styles.notice} role="status">{saved.notice}</p>}{localNotice&&<p role="status">{localNotice}</p>}
 </div>;
}
