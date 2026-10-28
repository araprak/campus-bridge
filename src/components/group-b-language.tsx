'use client';
import { useEffect,useId,useRef,useState } from 'react';
import { GROUP_B_LANGUAGE_COOKIE,WEBSITE_LANGUAGES,languageText,readWebsiteLanguage,websiteLanguageInfo,type WebsiteLanguage,type LanguageDictionary } from '@/domain/group-b-language';
import styles from './group-b-language.module.css';

const loadLanguage:Record<Exclude<WebsiteLanguage,'en'>,()=>Promise<{default:Record<string,string>}>>={
 ar:()=>import('@/data/locales/ar.json'),'yue-Hant':()=>import('@/data/locales/yue-Hant.json'),
 fr:()=>import('@/data/locales/fr.json'),de:()=>import('@/data/locales/de.json'),hi:()=>import('@/data/locales/hi.json'),it:()=>import('@/data/locales/it.json'),
 ja:()=>import('@/data/locales/ja.json'),kn:()=>import('@/data/locales/kn.json'),ko:()=>import('@/data/locales/ko.json'),ml:()=>import('@/data/locales/ml.json'),
 'zh-Hans':()=>import('@/data/locales/zh-Hans.json'),pt:()=>import('@/data/locales/pt.json'),es:()=>import('@/data/locales/es.json'),ta:()=>import('@/data/locales/ta.json'),te:()=>import('@/data/locales/te.json'),ur:()=>import('@/data/locales/ur.json'),
};
const helper='Interface text changes. Your entries and official source content stay in their original language.';
const ignored='script,style,noscript,textarea,input,code,pre,[translate="no"],[data-user-content],[data-language-control],[contenteditable="true"]';
type Original={source:string;written:string};

export function GroupBLanguage({initialLanguage='en'}:{initialLanguage?:WebsiteLanguage}){
 const id=useId(),[language,setLanguage]=useState<WebsiteLanguage>(initialLanguage),[dictionary,setDictionary]=useState<LanguageDictionary>({}),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const textRecords=useRef(new WeakMap<Text,Original>()),attributeRecords=useRef(new WeakMap<Element,Map<string,Original>>());
 const activeDictionary=useRef<LanguageDictionary>({});
 useEffect(()=>{let active=true;setBusy(true);setError('');
  const load=language==='en'?Promise.resolve({default:{}}):loadLanguage[language]();
  load.then(value=>{if(active){setDictionary(value.default);setBusy(false);}}).catch(()=>{if(active){setError('This language could not be loaded. Please try again.');setBusy(false);}});
  return()=>{active=false;};
 },[language]);
 useEffect(()=>{
  activeDictionary.current=dictionary;let scheduled=false,stopped=false;
  const apply=()=>{
   scheduled=false;if(stopped)return;
   const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
   let current:Node|null;
   while((current=walker.nextNode())){
    const node=current as Text;if(!node.parentElement||node.parentElement.closest(ignored))continue;
    const now=node.nodeValue??'';const prior=textRecords.current.get(node);
    const source=prior&&prior.written===now?prior.source:now;
    const written=languageText(source,activeDictionary.current);
    textRecords.current.set(node,{source,written});if(now!==written)node.nodeValue=written;
   }
   for(const element of document.body.querySelectorAll<HTMLElement>('[aria-label],[placeholder],[title],[alt]')){
    if(element.closest('[translate="no"],[data-user-content],[data-language-control]'))continue;
    let records=attributeRecords.current.get(element);if(!records){records=new Map();attributeRecords.current.set(element,records);}
    for(const attribute of ['aria-label','placeholder','title','alt']){
     const now=element.getAttribute(attribute);if(now===null)continue;
     const prior=records.get(attribute),source=prior&&prior.written===now?prior.source:now,written=languageText(source,activeDictionary.current);
     records.set(attribute,{source,written});if(now!==written)element.setAttribute(attribute,written);
    }
   }
  };
  const schedule=()=>{if(!scheduled&&!stopped){scheduled=true;queueMicrotask(apply);}};
  const observer=new MutationObserver(schedule);apply();
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title','alt']});
  return()=>{stopped=true;observer.disconnect();};
 },[dictionary]);
 useEffect(()=>{const info=websiteLanguageInfo(language);document.documentElement.lang=info.code;document.documentElement.dir=info.direction;},[language]);
 function choose(value:WebsiteLanguage){
  setLanguage(value);
  // No Domain attribute: this preference belongs to Group B's current origin.
  document.cookie=`${GROUP_B_LANGUAGE_COOKIE}=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;
 }
 return <div className={styles.bar} data-language-control translate="no">
  <label htmlFor={id}>{dictionary['Website language']??'Website language'}<select id={id} data-testid="website-language" aria-label={dictionary['Website language']??'Website language'} value={language} onChange={event=>choose(readWebsiteLanguage(event.target.value))} dir="ltr" disabled={busy}>
   {WEBSITE_LANGUAGES.map(row=><option key={row.code} value={row.code} lang={row.code}>{row.name}{row.code==='en'?'':` · ${row.native}`}</option>)}
  </select></label>
  <p lang={language}>{dictionary[helper]??helper}</p>
  {busy&&<span role="status">Loading…</span>}{error&&<p role="alert">{error}</p>}
 </div>;
}
