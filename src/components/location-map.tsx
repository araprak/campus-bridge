'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { mapEmbedUrl } from '@/domain/location-map';
export type MapLocation = {name:string;address?:string;latitude:number;longitude:number};
/** Loads one public-location map only after the student asks to see it. */
export function LocationMapButton({name,address,latitude,longitude,label='View map'}:MapLocation&{label?:string}) {
  const [open,setOpen]=useState(false);const dialog=useRef<HTMLDialogElement>(null);const id=useId();
  useEffect(()=>{if(open)dialog.current?.showModal();else dialog.current?.close();},[open]);
  return <><button type="button" className="map-button" onClick={()=>setOpen(true)} aria-haspopup="dialog"><MapPin size={15}/>{label}</button><dialog ref={dialog} className="location-map-dialog" aria-labelledby={id} onCancel={()=>setOpen(false)} onClose={()=>setOpen(false)}><header><div><p className="eyebrow">FIND YOUR WAY</p><h2 id={id}>{name}</h2>{address&&<p>{address}</p>}</div><button type="button" autoFocus className="map-close" aria-label="Close map" onClick={()=>setOpen(false)}><X size={22}/></button></header>{open&&<iframe title={`Map of ${name}`} src={mapEmbedUrl(latitude,longitude)} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/>}<footer><span>Approximate location · confirm the entrance when you arrive.</span><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a></footer></dialog></>;
}
