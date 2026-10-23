'use client';

import { useId, useState } from 'react';
import { ExternalLink, Route } from 'lucide-react';
import type { Answers } from '@/lib/model';
import { effectiveHasCar } from '@/domain/plan';
import { CAMPUS_PLACES } from '@/data/campus-guide';
import { TRANSIT_PLANNER_URL } from '@/data/community-transit';
import { campusDestination, campusRouteUrl, defaultRouteOrigin, ROUTE_MODES, ROUTE_MODE_LABELS, type RouteMode } from '@/domain/campus-route';

export function CampusRoutePlanner({answers}: {answers: Answers}) {
  const id = useId();
  const [customOrigin, setCustomOrigin] = useState<string | null>(null);
  const [destination, setDestination] = useState('su');
  const [selectedMode, setSelectedMode] = useState<RouteMode | null>(null);
  const origin = customOrigin ?? defaultRouteOrigin(answers);
  const mode = selectedMode ?? (answers.transport === 'walking' ? 'walking' : effectiveHasCar(answers) ? 'driving' : 'transit');
  const url = campusRouteUrl(origin, campusDestination(destination), mode);
  return <section className="local-options campus-route-planner" aria-label="Campus route planner">
    <div className="local-heading"><span className="local-icon"><Route size={20}/></span><div><h3>Plan a trip to campus</h3><p>Choose a starting point, destination and way to travel.</p></div></div>
    <div className="form-grid">
      <div className="form-field"><label htmlFor={`${id}-origin`}>Starting address or place</label><input id={`${id}-origin`} autoComplete="off" maxLength={300} value={origin} onChange={event => setCustomOrigin(event.target.value)} aria-describedby={`${id}-privacy`}/></div>
      <div className="form-field"><label htmlFor={`${id}-destination`}>Campus destination</label><select id={`${id}-destination`} value={destination} onChange={event => setDestination(event.target.value)}>{CAMPUS_PLACES.map(place => <option key={place.id} value={place.id}>{place.name}</option>)}</select></div>
      <div className="form-field"><label htmlFor={`${id}-mode`}>Travel mode</label><select id={`${id}-mode`} value={mode} onChange={event => setSelectedMode(event.target.value as RouteMode)}>{ROUTE_MODES.map(item => <option key={item} value={item}>{ROUTE_MODE_LABELS[item]}</option>)}</select></div>
    </div>
    <p className="form-hint" id={`${id}-privacy`}>Your starting point stays on this page until you open directions. Opening Google Maps shares the entered locations with Google. CampusBridge does not request your device location or save this address.</p>
    <div className="campus-card-actions">{url ? <a className="button button-primary" href={url} target="_blank" rel="noopener noreferrer">Open {ROUTE_MODE_LABELS[mode].toLowerCase()} route <ExternalLink size={14}/></a> : <p className="form-hint" role="status">Enter a starting place to open directions.</p>}<button className="button button-outline" type="button" onClick={() => setCustomOrigin(null)}>Use {answers.housingLocation === 'off_campus' && answers.housingCommunity ? 'planning home' : 'campus'} as start</button></div>
    <p className="form-hint">Google Maps shows route choices, distance and estimated time. Check the destination entrance, crossings and return trip. Transit schedules and walking access can change.</p>
    {mode === 'transit' && <a className="provider-source" href={TRANSIT_PLANNER_URL} target="_blank" rel="noopener noreferrer">Check DART departures and service alerts <ExternalLink size={12}/></a>}
  </section>;
}
