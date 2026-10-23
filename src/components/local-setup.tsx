'use client';
import { useEffect, useState } from 'react';
import { ExternalLink, Lightbulb } from 'lucide-react';
import { electricityGuide } from '@/data/local-options';
import type { Answers } from '@/lib/model';
export type LocationSave=(location:Pick<Answers,'housingCommunity'|'housingZip'|'leaseStartDate'>)=>Promise<boolean>;
type Props={answers:Answers;busy:boolean;onSave:LocationSave};
export { HousingOptions } from './apartment-discovery';
export function ElectricityOptions({answers,busy,onSave}:Props) {
  const guide=electricityGuide(answers.housingCommunity,answers.housingZip);
  const {community}=guide;
  const activeZip=guide.zip;
  const [zip,setZip]=useState(activeZip);
  const [notice,setNotice]=useState('');
  useEffect(()=>setZip(activeZip),[activeZip]);
  return <div className="local-options electricity-options"><div className="local-heading"><span className="local-icon"><Lightbulb size={20}/></span><div><h3>Electricity</h3><p>{community?`${community.name} · ZIP ${activeZip}`:activeZip?`Planning for ZIP ${activeZip}`:'Exploring homes in Dallas–Fort Worth'}</p></div></div>
    <p className="local-disclosure">If your home needs separate electricity service, compare these providers for your exact address.</p>
    {!community&&<form className="zip-form" onSubmit={async e=>{e.preventDefault();setNotice('');if(await onSave({housingCommunity:'',housingZip:zip.trim()}))setNotice(zip?'ZIP code saved for your plan.':'ZIP code cleared. Showing general DFW guidance.');}}><div className="form-field"><label htmlFor="electricity-zip">Have a ZIP code in mind? <span className="muted">(optional)</span></label><input id="electricity-zip" inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{5}" maxLength={5} placeholder="e.g. 75080" value={zip} onChange={e=>setZip(e.target.value.replace(/\D/g,''))}/></div><button className="button button-outline" disabled={busy}>{busy?'Saving…':'Use ZIP'}</button></form>}
    <h4>{guide.heading}</h4><p className="form-hint">{guide.locationNote}</p><p className="form-hint">These are comparison starting points, not a price ranking or a guarantee of service. Apartment billing arrangements, municipal utilities, or cooperatives can limit your choice.</p>
    <div className="provider-list">{guide.providers.map(p=><article key={p.id}><div><h5>{p.name}</h5><p>{p.description}</p></div><a href={p.url} target="_blank" rel="noopener noreferrer" aria-label={`Check plans from ${p.name}`}>Check plans <ExternalLink size={13}/></a></article>)}</div>
    <a className="official-compare" href="https://www.powertochoose.org/" target="_blank" rel="noopener noreferrer"><span><strong>Compare offers on Power to Choose</strong><small>Public Utility Commission of Texas · Enter your ZIP on the official site</small></span><ExternalLink size={18}/></a><p className="form-hint">Compare the full price and contract. Start service on {answers.leaseStartDate||'your lease start date'}.</p>
    {notice&&<p role="status" className="service-save-result">{notice}</p>}
  </div>;
}
