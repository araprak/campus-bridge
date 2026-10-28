'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

type Kind = 'arrival' | 'budget' | 'reminders';
export function useGroupCloudData<T>({kind,parse,initialData}:{kind:Kind;parse:(value:unknown)=>T|null;initialData:()=>T}) {
  const [data,setData]=useState<T>(initialData);
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
  const [error,setError]=useState(''),[notice,setNotice]=useState('');
  const [revision,setRevision]=useState(0),[hasSaved,setHasSaved]=useState(false);
  const parser=useRef(parse),initializer=useRef(initialData),draft=useRef(data);
  parser.current=parse;initializer.current=initialData;draft.current=data;
  const active=useRef(true),generation=useRef(0),ready=useRef(false),working=useRef(false);
  const accept=useCallback((body:{data:unknown;revision:number})=>{
    if(!Number.isSafeInteger(body.revision)||body.revision<0)throw new Error('Invalid saved revision.');
    const value=body.data===null?initializer.current():parser.current(body.data);
    if(value===null)throw new Error('Your saved data uses an unsupported format.');
    setData(value);draft.current=value;setRevision(body.revision);setHasSaved(body.data!==null);ready.current=true;
  },[]);
  const reload=useCallback(async()=>{
    const attempt=++generation.current;ready.current=false;setLoading(true);setError('');setNotice('');
    try{
      const response=await fetch(`/api/group-data/${kind}`,{cache:'no-store'});const body=await response.json();
      if(!response.ok)throw new Error(body.error||'Your saved data could not be loaded.');
      if(active.current&&attempt===generation.current)accept(body);
    }catch(problem){if(active.current&&attempt===generation.current)setError(problem instanceof Error?problem.message:'Your saved data could not be loaded.');}
    finally{if(active.current&&attempt===generation.current)setLoading(false);}
  },[accept,kind]);
  useEffect(()=>{active.current=true;void reload();return()=>{active.current=false;generation.current++;};},[reload]);
  async function write(method:'PUT'|'DELETE',next?:T){
    if(!ready.current||working.current||loading)return false;
    working.current=true;setBusy(true);setError('');setNotice('');const attempt=generation.current;const submitted=next??draft.current;const draftAtStart=JSON.stringify(draft.current);
    try{
      const response=await fetch(`/api/group-data/${kind}`,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(method==='PUT'?{data:submitted,expectedRevision:revision,consent:true}:{expectedRevision:revision})});
      const body=await response.json();if(!response.ok){if(response.status===409)ready.current=false;throw new Error(body.error||'Your saved data was not changed.');}
      if(!active.current||attempt!==generation.current)return false;
      const newerDraft=method==='PUT'&&JSON.stringify(draft.current)!==draftAtStart?draft.current:null;accept(body);if(newerDraft!==null){setData(newerDraft);draft.current=newerDraft;}setNotice(method==='PUT'?(newerDraft!==null?'Saved that copy. Your newer edits are still unsaved.':'Saved to your account.'):'Removed from your account.');return true;
    }catch(problem){if(active.current&&attempt===generation.current)setError(problem instanceof Error?problem.message:'Your saved data was not changed.');return false;}
    finally{working.current=false;if(active.current&&attempt===generation.current)setBusy(false);}
  }
  return {data,setData,loading,busy,error,notice,revision,hasSaved,save:(next?:T)=>write('PUT',next),remove:()=>write('DELETE'),reload};
}
