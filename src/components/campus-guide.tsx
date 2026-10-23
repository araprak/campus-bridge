'use client';

import { useId, useState } from 'react';
import { BookOpen, ExternalLink, GraduationCap, IdCard, MapPinned, ShoppingBag, Utensils } from 'lucide-react';
import { CAMPUS_DINING_AREAS, CAMPUS_DINING_SOURCE, CAMPUS_ESSENTIALS, CAMPUS_GUIDE_REVIEWED, CAMPUS_PLACES, CAMPUS_TOOLS, COMET_CARD_OFFICE, campusPlace, type CampusPlace, type CampusTool } from '@/data/campus-guide';
import { LocationMapButton } from './location-map';

function OfficialLink({url,children}:{url:string;children:React.ReactNode}) {
  return <a className="provider-source" href={url} target="_blank" rel="noopener noreferrer">{children} <ExternalLink size={12}/></a>;
}

function PlaceMap({place}:{place:CampusPlace}) {
  return <LocationMapButton name={place.name} address={`${place.address} · Building pin`} latitude={place.latitude} longitude={place.longitude}/>;
}

function GuideNote() {
  return <p className="form-hint campus-guide-note">Building pins show the campus location, not an indoor room or accessible entrance. Sources reviewed {CAMPUS_GUIDE_REVIEWED}.</p>;
}

export function CometCardGuide() {
  const place=campusPlace(COMET_CARD_OFFICE.placeId);
  return <section className="local-options campus-guide" aria-label="Comet Card office">
    <div className="local-heading"><span className="local-icon"><IdCard size={20}/></span><div><h3>Pick up your Comet Card</h3><p>Your student ID for campus services.</p></div></div>
    <article className="campus-place-card campus-card-feature"><span className="campus-code" aria-hidden="true">SSA</span><div><h4>Comet Card Office</h4><p><strong>Student Services Addition · second floor · {COMET_CARD_OFFICE.room}</strong></p><p>{COMET_CARD_OFFICE.hours}</p><p className="form-hint">Review UTD’s current photo and ID requirements before you go.</p><div className="campus-card-actions"><PlaceMap place={place}/><OfficialLink url={COMET_CARD_OFFICE.url}>Card requirements</OfficialLink></div></div></article>
  </section>;
}

function ToolList({items}:{items:CampusTool[]}) {
  return <div className="campus-resource-list">{items.map((tool,index)=><article key={tool.id} className="campus-resource-row"><span className="campus-resource-step" aria-hidden="true">{index+1}</span><div><h4>{tool.name}</h4><p>{tool.action}</p><OfficialLink url={tool.url}>Open {tool.name}</OfficialLink></div></article>)}</div>;
}

export function CampusSupportGuide() {
  return <section className="local-options campus-guide" aria-label="UTD student tools">
    <div className="local-heading"><span className="local-icon"><GraduationCap size={20}/></span><div><h3>Your UTD toolkit</h3><p>Set these up once. Keep them handy.</p></div></div>
    <p className="form-hint">Use your UTD credentials on university sites. Your CampusBridge sign-in stays separate.</p>
    <ToolList items={CAMPUS_TOOLS.filter(item=>item.group==='start')}/>
    <details className="campus-guide-more"><summary>More useful student tools</summary><ToolList items={CAMPUS_TOOLS.filter(item=>item.group==='more')}/></details>
  </section>;
}

function DestinationCards({places}:{places:CampusPlace[]}) {
  return <div className="campus-guide-grid">{places.map(place=><article key={place.id} className="campus-place-card"><span className="campus-code" aria-hidden="true">{place.code}</span><div><h4>{place.name}</h4><p>{place.description}</p><div className="campus-card-actions"><PlaceMap place={place}/><OfficialLink url={place.sourceUrl}>Details</OfficialLink></div></div></article>)}</div>;
}

export function CampusDestinationsGuide() {
  return <section className="local-options campus-guide" aria-label="Campus places">
    <div className="local-heading"><span className="local-icon"><MapPinned size={20}/></span><div><h3>Get to know campus</h3><p>Tap a map to see where to go.</p></div></div>
    <DestinationCards places={CAMPUS_PLACES.slice(0,6)}/>
    <details className="campus-guide-more"><summary>Academic buildings & more</summary><DestinationCards places={CAMPUS_PLACES.slice(6)}/></details>
    <GuideNote/>
  </section>;
}

export function CampusDiningGuide() {
  const id = useId();
  const [diet, setDiet] = useState('all');
  const guidance = {
    all: 'Use UTD’s current schedule for hours and Dine on Campus for menus before leaving.',
    vegan: 'UTD Dining publishes a vegan guide. Use it as a starting point, then confirm the current menu, ingredients and preparation with the venue.',
    vegetarian: 'Look for vegetarian items on the current menu and confirm ingredients and preparation with the venue.',
    halal: 'The Student Union directory includes The Halal Shack. Confirm the current menu and any certification or preparation requirement directly with the venue.',
    allergy: 'Contact Dining before ordering about ingredients and cross-contact. A menu label alone cannot establish that a meal is safe for your allergy.',
  }[diet];
  return <section className="local-options campus-guide" aria-label="Campus dining">
    <div className="local-heading"><span className="local-icon"><Utensils size={20}/></span><div><h3>Eat on campus</h3><p>Find a meal close to your next class.</p></div></div>
    <div className="form-field"><label htmlFor={`${id}-diet`}>Dining guidance for your needs</label><select id={`${id}-diet`} value={diet} onChange={event => setDiet(event.target.value)}><option value="all">All dining</option><option value="vegan">Vegan</option><option value="vegetarian">Vegetarian</option><option value="halal">Halal</option><option value="allergy">Food allergy or other dietary need</option></select></div><p className="community-service-note">{guidance}</p>{diet === 'vegan' && <OfficialLink url="https://dineoncampus.com/files/section_documents/dec1c234-c8e4-42b8-a95b-1d887e77eefe.pdf">UTD Dining vegan guide</OfficialLink>}
    <div className="campus-dining-list">{CAMPUS_DINING_AREAS.map((area,index)=><details className="campus-dining-area" key={area.id} open={index===0}><summary><span>{area.name}</span><small>{area.options.length} {area.options.length===1?'option':'options'}</small></summary><div className="campus-dining-body"><p>{area.description}</p><ul className="campus-dining-chips">{area.options.map(option=><li key={option}>{option}</li>)}</ul><div className="campus-card-actions"><PlaceMap place={campusPlace(area.placeId)}/><OfficialLink url={area.sourceUrl}>Hours & menus</OfficialLink></div></div></details>)}</div>
    <p className="form-hint campus-guide-note">Locations come from UTD Dining. Hours and menus change with the term; this list does not show live opening status. Ask the venue about dietary needs. <a href={CAMPUS_DINING_SOURCE} target="_blank" rel="noopener noreferrer">Today’s official schedule</a>.</p>
    <details className="campus-guide-more"><summary>Ordering ahead & Grubhub</summary><p>In Grubhub, open Account → Campus Dining and search for your campus to see available campus features. CampusBridge has not verified UTD meal-plan payment or a UTD Grubhub partnership. Off-campus delivery listings do not establish either.</p><div className="place-links"><OfficialLink url="https://www.grubhub.com/about/campus">Grubhub campus setup & eligibility</OfficialLink><OfficialLink url="https://www.grubhub.com/delivery/tx-richardson/the_university_of_texas_dallas">Grubhub delivery near UTD</OfficialLink><OfficialLink url="https://services.utdallas.edu/dining/delivery">UTD’s campus delivery guidance</OfficialLink></div><p className="form-hint">Check the actual delivery address, fees and pickup instructions before ordering. Dining-needs and ordering guidance reviewed October 15, 2026.</p></details>
    <GuideNote/>
  </section>;
}

export function CampusEssentialsGuide() {
  return <section className="local-options campus-guide" aria-label="Campus essentials">
    <div className="local-heading"><span className="local-icon"><ShoppingBag size={20}/></span><div><h3>Everyday campus stops</h3><p>Supplies, practical help and a food pantry.</p></div></div>
    <div className="campus-guide-grid">{CAMPUS_ESSENTIALS.map(place=><article className="campus-place-card" key={place.id}><span className="campus-code" aria-hidden="true"><BookOpen size={23}/></span><div><h4>{place.name}</h4><p><strong>{place.location}</strong></p><p>{place.description}</p><details className="campus-guide-more"><summary>Before you go</summary><p>{place.beforeYouGo}</p></details><div className="campus-card-actions"><PlaceMap place={campusPlace(place.placeId)}/><OfficialLink url={place.url}>Visit details</OfficialLink></div></div></article>)}</div>
    <GuideNote/>
  </section>;
}
