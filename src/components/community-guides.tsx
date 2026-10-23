'use client';
import { useState } from 'react';
import { BusFront, ExternalLink, MapPin, ShoppingBag } from 'lucide-react';
import { LocationMapButton } from './location-map';
import { APARTMENTS } from '@/data/local-options';
import { COMET_WEST_ROUTE, getCommunityTransit, transitScheduleNotice, TRANSIT_DISTANCE_NOTE, TRANSIT_FARE_NOTE, TRANSIT_PLANNER_URL } from '@/data/community-transit';
import { neighborhoodDirections, neighborhoodPlaces, NEIGHBORHOOD_NOTE, NEIGHBORHOOD_REVIEWED, NEIGHBORHOOD_TRANSIT_NOTE, type NeighborhoodCategory } from '@/data/neighborhood-places';
import { effectiveHasCar } from '@/domain/plan';
import { dallasDate, type Answers } from '@/lib/model';
import { ROUTE_MODE_LABELS, type RouteMode } from '@/domain/campus-route';

const categoryNames: Record<NeighborhoodCategory,string> = {grocery:'Groceries',restaurant:'Food & restaurants',retail:'Everyday shopping',pharmacy:'Pharmacies',fuel:'Gas stations',carwash:'Car washes'};
const directions: Record<string,string> = {N:'northbound',S:'southbound',E:'eastbound',W:'westbound'};
function stopLabel(name:string) {
  return name.replace(/ -\s*([NSEW]) -.*$/,(match,direction:string)=>` — ${directions[direction]}`).replace('Ut Dallas','UT Dallas');
}

export function CommunityTransitGuide({answers}:{answers:Answers}) {
  const community=answers.housingLocation==='off_campus'?APARTMENTS.find(a=>a.id===answers.housingCommunity):undefined;
  const guide=getCommunityTransit(answers.housingCommunity);
  if(answers.housingLocation!=='off_campus'||!community||!guide)return null;
  const west=guide.routes.some(route=>route.id==='883W');
  const schedule=transitScheduleNotice(answers.arrivalDate,dallasDate());
  return <section className="local-options transit-guide" aria-label="Community transit guide">
    <div className="local-heading"><span className="local-icon"><BusFront size={20}/></span><div><h3>Getting around from {community.name}</h3><p>Nearby transit, useful stops, and the route to campus</p></div></div>
    {schedule.status!=='within_snapshot'&&<p className="notice">{schedule.text}</p>}
    <p className="community-access">{guide.accessNote}</p>
    <div className="transit-routes">{guide.routes.map(route=><article key={route.id}><h4>{route.name}</h4><p>{route.summary}</p><a href={route.mapUrl} target="_blank" rel="noopener noreferrer">{route.id.startsWith('883')?'Open official route map':'Open official trip planner'} <ExternalLink size={13}/></a></article>)}</div>
    <h4 className="guide-subheading">{schedule.status==='within_snapshot'?'Stops to check':'Published stops — verify before travel'}</h4><p className="local-disclosure">{TRANSIT_DISTANCE_NOTE}</p>
    <div className="transit-stops">{guide.stops.map(stop=><article key={stop.id}><div><h5><MapPin size={15}/>{stopLabel(stop.name)}</h5><p>Stop {stop.id} · {stop.routeIds.join(' / ')}</p><p>About {stop.straightLineMiles.toFixed(2)} mi straight-line from the community reference point</p></div><LocationMapButton name={stopLabel(stop.name)} latitude={stop.latitude} longitude={stop.longitude}/><a href={stop.walkingUrl} target="_blank" rel="noopener noreferrer" aria-label={`Check walking directions to ${stopLabel(stop.name)}`}>Check the walk <ExternalLink size={13}/></a></article>)}</div>
    {west&&<details className="route-explainer"><summary>{COMET_WEST_ROUTE.heading}</summary><div className="route-directions"><div><h5>Toward campus</h5><ol>{COMET_WEST_ROUTE.toCampus.map(road=><li key={road}>{road}</li>)}</ol></div><div><h5>Returning from campus</h5><ol>{COMET_WEST_ROUTE.fromCampus.map(road=><li key={road}>{road}</li>)}</ol></div></div><p className="form-hint">{COMET_WEST_ROUTE.extension}</p></details>}
    <p className="form-hint">{TRANSIT_FARE_NOTE}</p><a className="official-compare" href={TRANSIT_PLANNER_URL} target="_blank" rel="noopener noreferrer"><span><strong>Plan your trip for the day you travel</strong><small>DART routes, connections, and departure times</small></span><ExternalLink size={18}/></a>
    {schedule.status==='within_snapshot'&&<p className="form-hint">{schedule.text}</p>}<details className="guide-sources"><summary>Sources and location reference</summary><p>{guide.reference.label}. The leasing-office entrance and walking time have not been independently verified.</p><ul>{guide.sources.map(source=><li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name} <ExternalLink size={12}/></a></li>)}</ul></details>
  </section>;
}

export function NeighborhoodGuide({answers}:{answers:Answers}) {
  const [filter,setFilter]=useState<NeighborhoodCategory|'all'>('all');
  const [expanded,setExpanded]=useState(false);
  const [chosenMode,setChosenMode]=useState<RouteMode|null>(null);
  const community=answers.housingLocation==='off_campus'?APARTMENTS.find(a=>a.id===answers.housingCommunity):undefined;
  const car=effectiveHasCar(answers);
  const mode=chosenMode??(answers.transport==='walking'?'walking':car?'driving':'transit');
  const places=neighborhoodPlaces(community?.id,car);
  const hasCommunityMatches=!!community&&places.some(place=>place.communityIds.includes(community.id));
  const areaNote=hasCommunityMatches?NEIGHBORHOOD_NOTE:`A starting list around campus, not every nearby business. ${community?'Routes from your selected home have not been verified. ':''}Check current hours and the full trip before leaving.`;
  if(!places.length)return null;
  const schedule=transitScheduleNotice(answers.arrivalDate,dallasDate());
  const categories=(Object.keys(categoryNames) as NeighborhoodCategory[]).filter(category=>places.some(place=>place.category===category));
  const currentFilter=filter==='all'||categories.includes(filter)?filter:'all';
  const filtered=places.filter(place=>currentFilter==='all'||place.category===currentFilter);
  const visible=expanded?filtered:filtered.slice(0,4);
  return <section className="local-options neighborhood-guide" aria-label="Neighborhood guide">
    <div className="local-heading"><span className="local-icon"><ShoppingBag size={20}/></span><div><h3>Around your campus</h3><p>{hasCommunityMatches?community?.name:'UT Dallas area'} · {places.length} places</p></div></div><p className="local-disclosure">{areaNote}</p>
    {schedule.status!=='within_snapshot'&&places.some(place=>place.transit)&&<p className="notice">{schedule.text}</p>}
    <div className="place-filters" role="group" aria-label="Directions mode">{(['walking','bicycling','driving','transit'] as const).map(item=><button key={item} type="button" aria-pressed={mode===item} onClick={()=>setChosenMode(item)}>{ROUTE_MODE_LABELS[item]}</button>)}</div>
    <div className="place-filters" role="group" aria-label="Filter nearby places">{(['all',...categories] as const).map(category=><button key={category} aria-pressed={currentFilter===category} onClick={()=>{setFilter(category);setExpanded(false);}}>{category==='all'?'All places':categoryNames[category]}</button>)}</div>
    <div className="neighborhood-places">{visible.map(place=><article key={place.id}><span className="place-kind">{categoryNames[place.category]}</span><h4>{place.name}</h4><p className="place-address"><MapPin size={13}/>{place.address}</p><p>{place.description}</p>{(place.transit||(place.category!=='fuel'&&place.category!=='carwash'))&&<details className="guide-sources"><summary>Transit details</summary>{place.transit?<div className="place-transit"><BusFront size={15}/><div><strong>Near a stop on {place.transit.routeId}</strong><p>{place.transit.stopName} · stop {place.transit.stopId}</p><p>About {place.transit.straightLineMiles.toFixed(2)} mi straight-line from the store pin.</p><p>{place.transit.note}</p><a href="https://services.utdallas.edu/transit/cruiser/#schedule" target="_blank" rel="noopener noreferrer">Official bus schedules <ExternalLink size={12}/></a></div></div>:<p className="place-connection">A bus connection and stop-to-store walk have not been verified for this listing.</p>}</details>}<div className="place-links">{place.coordinates&&<LocationMapButton name={place.name} address={place.address} latitude={place.coordinates.latitude} longitude={place.coordinates.longitude}/>}<a href={place.url} target="_blank" rel="noopener noreferrer">Store details & hours <ExternalLink size={13}/></a><a href={neighborhoodDirections(community?.id,place,mode)} target="_blank" rel="noopener noreferrer">{ROUTE_MODE_LABELS[mode]} directions <ExternalLink size={13}/></a>{mode!=='transit'&&place.category!=='fuel'&&place.category!=='carwash'&&<a href={neighborhoodDirections(community?.id,place,'transit')} target="_blank" rel="noopener noreferrer">Bus directions <ExternalLink size={13}/></a>}</div></article>)}</div>
    {filtered.length>4&&<button className="button button-outline local-expand" aria-expanded={expanded} onClick={()=>setExpanded(!expanded)}>{expanded?'Show fewer places':`Show all ${filtered.length} places`}</button>}
    <details className="guide-sources"><summary>Travel notes & sources</summary><p>{NEIGHBORHOOD_TRANSIT_NOTE}</p><p>Reviewed {NEIGHBORHOOD_REVIEWED}. Store links are the source for each location.</p></details>
  </section>;
}
