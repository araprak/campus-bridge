'use client';
import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { ArrowRight, CarFront, ExternalLink, Truck, Wifi } from 'lucide-react';
import { internetGuide, INTERNET_COMPARISON_NOTE, CAR_TRANSPORTERS, CAR_TRANSPORT_NOTE, FMCSA_AUTO_TRANSPORT_GUIDE_URL, SERVICES_REVIEWED, INTERNET_REVIEWED, INTERNET_TYPES, BROADBAND_MAP_URL, filterInternetProviders, type InternetType } from '@/data/service-options';
import { effectiveHasCar } from '@/domain/plan';
import { APARTMENTS } from '@/data/local-options';
import type { Answers } from '@/lib/model';
import type { LocationSave } from './local-setup';
import { PreferenceEditor,type PreferenceSave } from './preferences';

export function InternetOptions({answers,busy,onSave}:{answers:Answers;busy:boolean;onSave:LocationSave}) {
  const id = useId();
  const guide = internetGuide(answers.housingLocation==='off_campus'?answers.housingCommunity:undefined,answers.housingLocation==='off_campus'?answers.housingZip:undefined);
  const [zip,setZip] = useState(guide.zip);
  const [notice,setNotice] = useState('');
  const [query,setQuery] = useState('');
  const [type,setType] = useState<InternetType | 'All'>('All');
  const [expanded,setExpanded] = useState(false);
  useEffect(()=>{setZip(guide.zip);setNotice('');},[guide.zip]);
  const results = filterInternetProviders(guide.providers,query,type);
  const visible = expanded || query.trim() || type !== 'All' ? results : results.slice(0,6);
  const providers = <>
    <p className="form-hint">{guide.locationNote}</p>
    <div className="directory-controls form-grid">
      <div className="form-field"><label htmlFor={`${id}-search`}>Search providers</label><input id={`${id}-search`} type="search" placeholder="Name or connection type" value={query} onChange={event=>{setQuery(event.target.value);setExpanded(false);}}/></div>
      <div className="form-field"><label htmlFor={`${id}-type`}>Connection</label><select id={`${id}-type`} value={type} onChange={event=>{setType(event.target.value as InternetType | 'All');setExpanded(false);}}><option value="All">All types</option>{INTERNET_TYPES.map(option=><option key={option}>{option}</option>)}</select></div>
    </div>
    <p className="form-hint" role="status">{results.length} {results.length===1?'provider':'providers'}{visible.length<results.length?` · showing ${visible.length}`:''}</p>
    <div className="provider-list">{visible.map(provider=><article key={provider.id}><div><h5>{provider.name}</h5><span className="provider-kind">{provider.types.join(' / ')}</span><p>{provider.description}</p>{guide.area&&(provider.id==='att'||provider.id==='spectrum')&&<a className="provider-source" href={provider.sourceUrl} target="_blank" rel="noopener noreferrer">Official {guide.area} page <ExternalLink size={12}/></a>}</div><a href={provider.url} target="_blank" rel="noopener noreferrer" aria-label={`Check availability with ${provider.name}`}>Check address <ExternalLink size={13}/></a></article>)}</div>
    {results.length===0&&<p className="form-hint">No match. Try another name or choose All types.</p>}
    {visible.length<results.length&&<button className="button button-outline local-expand" onClick={()=>setExpanded(true)}>Show all {results.length} providers</button>}
    {expanded&&!query.trim()&&type==='All'&&<button className="button button-outline local-expand" onClick={()=>setExpanded(false)}>Show fewer</button>}
  </>;
  if(answers.housingLocation==='on_campus'||answers.internet==='included')return <section className="local-options internet-options"><h3>Your home connection</h3><p>{answers.housingLocation==='on_campus'?'Follow your campus housing instructions to connect your devices.':'Your housing provides internet. Confirm how to connect and who can help if it stops working.'}</p><Link className="inline-link" href="/profile#home-services">Update home services</Link></section>;
  if(answers.internet==='unknown')return <section className="local-options internet-options" aria-label="Home internet guide"><div className="local-heading"><span className="local-icon"><Wifi size={20}/></span><div><h3>Check what your housing provides</h3><p>Before choosing a plan, ask your leasing office or household.</p></div></div><ul><li>Is internet included, or does someone already have an account?</li><li>If it is included, how do you connect your devices?</li><li>If you need your own plan, are any providers required by the building?</li></ul>{guide.communityNote&&<div className="community-service-note"><h4>Your community’s internet</h4><p>{guide.communityNote.summary}</p><a href={guide.communityNote.url} target="_blank" rel="noopener noreferrer">Community details <ExternalLink size={13}/></a></div>}<Link className="inline-link" href="/profile#home-services">Update home services when you know</Link><details className="provider-disclosure"><summary>Explore providers while you check</summary><p className="local-disclosure">{INTERNET_COMPARISON_NOTE}</p>{providers}<p className="form-hint">Sources reviewed {INTERNET_REVIEWED}. Confirm availability at your full address before ordering.</p></details></section>;
  return <section className="local-options internet-options" aria-label="Home internet guide">
    <div className="local-heading"><span className="local-icon"><Wifi size={20}/></span><div><h3>Find home internet</h3><p>{guide.community?`${guide.community.name} · ZIP ${guide.zip}`:guide.zip?`Planning for ZIP ${guide.zip}`:'Dallas–Fort Worth and regional options'}</p></div></div>
    <p className="local-disclosure">{INTERNET_COMPARISON_NOTE}</p>
    {!guide.community&&<form className="zip-form" onSubmit={async e=>{e.preventDefault();setNotice('');if(await onSave({housingCommunity:'',housingZip:zip.trim()}))setNotice('Saved. Your home-service guides use this location.');}}><div className="form-field"><label htmlFor={`${id}-zip`}>Planned ZIP <span className="muted">(optional)</span></label><input id={`${id}-zip`} inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" maxLength={5} placeholder="e.g. 75080" value={zip} onChange={e=>setZip(e.target.value.replace(/\D/g,''))}/></div><button className="button button-outline" disabled={busy}>{busy?'Saving…':'Use ZIP'}</button></form>}
    {guide.communityNote?<><div className="community-service-note"><h4>Your community’s internet</h4><p>{guide.communityNote.summary}</p><a href={guide.communityNote.url} target="_blank" rel="noopener noreferrer">Community details <ExternalLink size={13}/></a></div><details className="provider-disclosure"><summary>Compare separate internet plans</summary>{providers}</details></>:providers}
    <details className="provider-disclosure"><summary>What to compare</summary><p>Regular monthly price, equipment, installation date, data limits and cancellation terms. Satellite may require landlord approval and a clear installation spot.</p><a href={BROADBAND_MAP_URL} target="_blank" rel="noopener noreferrer">Find other providers reported at your address <ExternalLink size={13}/></a></details>
    <p className="form-hint">A researched directory, not a complete or live availability list. Sources reviewed {INTERNET_REVIEWED}.</p>
    {notice&&<p className="service-save-result" role="status">{notice}</p>}
  </section>;
}

export function CarArrivalGuide({answers,editPath,busy=false,onPreferenceSave}:{answers:Answers;editPath:string;busy?:boolean;onPreferenceSave?:PreferenceSave}) {
  const [editing,setEditing]=useState(false);
  const relevant=effectiveHasCar(answers);
  return <>{relevant&&<CarArrivalContent answers={answers}/ >}{(relevant||editing)&&(onPreferenceSave?<PreferenceEditor section="car" answers={answers} busy={busy} onSave={onPreferenceSave} compact onEditingChange={setEditing}/>:<Link className="inline-link" href={editPath}>Edit car arrival <ArrowRight size={14}/></Link>)}</>;
}
function CarArrivalContent({answers}:{answers:Answers}) {
  const community=answers.housingLocation==='off_campus'?APARTMENTS.find(a=>a.id===answers.housingCommunity):undefined;
  const destination=community?.address||'The University of Texas at Dallas, 800 W Campbell Rd, Richardson, TX 75080';
  const drivingUrl=`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`;
  if(answers.carArrival==='here')return <section className="local-options car-arrival"><div className="local-heading"><span className="local-icon"><CarFront size={20}/></span><div><h3>Your car is already nearby</h3><p>Check parking at your community and on campus.</p></div></div><p className="form-hint">Fuel and car-wash options appear in your neighborhood guide when a community is selected.</p></section>;
  if(answers.carArrival==='drive')return <section className="local-options car-arrival"><div className="local-heading"><span className="local-icon"><CarFront size={20}/></span><div><h3>Plan your drive to the UTD area</h3><p>{community?.name||'UT Dallas'}</p></div></div><p className="local-disclosure">Choose your starting point in Maps and check the route, rest stops, and arrival time. Coordinate key pickup with your leasing office before setting off.</p><a className="button button-outline local-expand" href={drivingUrl} target="_blank" rel="noopener noreferrer">Plan the drive <ExternalLink size={14}/></a><p className="form-hint">Allow time to unload and confirm where residents and guests can park.</p></section>;
  if(answers.carArrival!=='ship')return <section className="local-options car-arrival"><div className="local-heading"><span className="local-icon"><CarFront size={20}/></span><div><h3>How your car will arrive</h3><p>{answers.carArrival==='undecided'?'Not decided yet. You can choose when you’re ready.':'You can add this detail whenever you’re ready.'}</p></div></div></section>;
  return <section className="local-options car-arrival" aria-label="Car shipping guide"><div className="local-heading"><span className="local-icon"><Truck size={20}/></span><div><h3>Compare car-shipping options</h3><p>For a move within the United States</p></div></div><p className="local-disclosure">{CAR_TRANSPORT_NOTE}</p><div className="provider-list transporter-list">{CAR_TRANSPORTERS.map(provider=><article key={provider.id}><div><h4>{provider.name}</h4><span className="provider-kind">Auto-transport {provider.type.toLowerCase()}</span><p>{provider.description}</p><a className="provider-source" href={provider.registration.url} target="_blank" rel="noopener noreferrer">FMCSA record · USDOT {provider.registration.usdot} · MC {provider.registration.mc} <ExternalLink size={12}/></a></div><a href={provider.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${provider.name} for a quote`}>View service <ExternalLink size={13}/></a></article>)}</div><a className="official-compare" href={FMCSA_AUTO_TRANSPORT_GUIDE_URL} target="_blank" rel="noopener noreferrer"><span><strong>Before you book: check the broker and carrier</strong><small>FMCSA’s automobile transport guidance</small></span><ExternalLink size={18}/></a><p className="form-hint">Sources reviewed {SERVICES_REVIEWED}. Recheck current registration and the assigned carrier before booking. CampusBridge does not request quotes or send your details.</p></section>;
}
