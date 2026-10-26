'use client';

import { useId, useState } from 'react';
import type { StudentState } from '@/lib/model';
import { APARTMENTS } from '@/data/local-options';
import { CAMPUS_PLACES } from '@/data/campus-guide';
import { comparisonSessionKey } from '@/domain/apartment-discovery';
import { ARRIVAL_AIRPORTS, ARRIVAL_SOURCES, ARRIVAL_SOURCES_CHECKED, ARRIVAL_TRAVEL_OPTIONS, EXPANSION_CHECKS, EXPANSION_CONCEPTS, type ArrivalAirport, type ArrivalTravel } from '@/data/group-a-arrival';
import { arrivalRouteUrl, expansionReadiness, expansionWorksheetText } from '@/domain/group-a-arrival';
import { HousingOptions } from './apartment-discovery';
import type { LocationSave } from './local-setup';
import styles from './group-a-tools.module.css';

function ArrivalAssistant({ state }: { state: StudentState }) {
  const id = useId();
  const [airport, setAirport] = useState<ArrivalAirport>('DFW');
  const [travel, setTravel] = useState<ArrivalTravel>('transit');
  const activeHome = state.answers.housingLocation === 'off_campus' && APARTMENTS.some(item => item.id === state.answers.housingCommunity) ? state.answers.housingCommunity! : '';
  const [kind, setKind] = useState<'campus' | 'community' | 'custom'>(activeHome ? 'community' : 'campus');
  const [community, setCommunity] = useState(activeHome || APARTMENTS[0].id);
  const [campus, setCampus] = useState('su');
  const [custom, setCustom] = useState('');
  const [shown, setShown] = useState(false);
  const [error, setError] = useState('');
  const place = CAMPUS_PLACES.find(item => item.id === campus)!;
  const home = APARTMENTS.find(item => item.id === community)!;
  const destination = kind === 'custom' ? custom : kind === 'community' ? `${home.name}, ${home.address}` : `${place.name}, ${place.address}`;
  const route = arrivalRouteUrl(airport, destination, travel);
  const source = airport === 'DFW' ? ARRIVAL_SOURCES.dfw : ARRIVAL_SOURCES.dal;
  function edit(action: () => void) { action(); setShown(false); setError(''); }
  return <section className={styles.panel} aria-labelledby={`${id}-title`} id="airport-arrival">
    <p className={styles.kicker}>FEATURE SET 5 · TRANSPORTATION AND ARRIVAL</p>
    <h2 id={`${id}-title`}>From the airport to your first stop</h2>
    <p>Choose your airport, destination and way of travelling. Build a route to check in Google Maps before you leave.</p>
    <form onSubmit={event => { event.preventDefault(); setShown(!!route); setError(route ? '' : 'Enter a destination of up to 300 characters.'); }}>
      <div className={styles.grid}>
        <label htmlFor={`${id}-airport`}>Arrival airport<select id={`${id}-airport`} value={airport} onChange={event => edit(() => setAirport(event.target.value as ArrivalAirport))}>{Object.entries(ARRIVAL_AIRPORTS).map(([key, value]) => <option key={key} value={key}>{value.name}</option>)}</select></label>
        <label htmlFor={`${id}-travel`}>How will you travel?<select id={`${id}-travel`} value={travel} onChange={event => edit(() => setTravel(event.target.value as ArrivalTravel))}>{Object.entries(ARRIVAL_TRAVEL_OPTIONS).map(([key, value]) => <option key={key} value={key}>{value}</option>)}</select></label>
        <label htmlFor={`${id}-destination`}>First destination<select id={`${id}-destination`} value={kind} onChange={event => edit(() => setKind(event.target.value as typeof kind))}><option value="campus">A UT Dallas campus destination</option><option value="community">An apartment community</option><option value="custom">Another address</option></select></label>
        {kind === 'campus' && <label htmlFor={`${id}-campus`}>Campus destination<select id={`${id}-campus`} value={campus} onChange={event => edit(() => setCampus(event.target.value))}>{CAMPUS_PLACES.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
        {kind === 'community' && <label htmlFor={`${id}-community`}>Apartment community<select id={`${id}-community`} value={community} onChange={event => edit(() => setCommunity(event.target.value))}>{APARTMENTS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
        {kind === 'custom' && <label htmlFor={`${id}-address`}>Destination address<input id={`${id}-address`} value={custom} maxLength={300} required autoComplete="off" placeholder="Street, city and ZIP" aria-describedby={`${id}-privacy`} onChange={event => edit(() => setCustom(event.target.value))}/></label>}
      </div>
      <p className={styles.note} id={`${id}-privacy`}>An address entered here stays on this page and clears on reload. Opening directions sends the airport and destination to Google Maps.</p>
      <button type="submit" className="button">Build my arrival route</button>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </form>
    {shown && route && <div className={styles.result} aria-live="polite">
      <h3>Your arrival plan</h3><p><strong>{ARRIVAL_AIRPORTS[airport].name}</strong> → {destination}</p>
      <p>{travel === 'transit' ? ARRIVAL_AIRPORTS[airport].transit : travel === 'pickup' ? 'Agree on the correct terminal and permitted pickup point with your driver. Follow current airport signs and instructions, and confirm the fare or pickup arrangement before leaving.' : 'Confirm your rental or driver arrangements and the airport pickup location. If you will park at UT Dallas, check the current permit or visitor parking options first.'}</p>
      <ol><li>Confirm your arrival terminal and your destination’s check-in arrangements.</li><li>{travel === 'transit' ? 'Check live departures, every transfer, the final walking segment and a backup option for late arrivals or luggage.' : 'Check the current route and pickup details with your driver or rental provider.'}</li><li>Open directions and check the result before travelling. The route starts at the airport; choose your actual terminal or pickup point in Google Maps.</li></ol>
      <a className="button" href={route} target="_blank" rel="noopener noreferrer">Open {travel === 'transit' ? 'transit' : 'driving'} directions ↗</a>
      <p className={styles.note}>CampusBridge does not show live fares, schedules, travel times or transport availability.</p>
    </div>}
    <div className={styles.sources}>
      <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a>
      <a href={ARRIVAL_SOURCES.cruiser.url} target="_blank" rel="noopener noreferrer">Comet Cruiser routes and schedules ↗</a>
      <a href={ARRIVAL_SOURCES.dart.url} target="_blank" rel="noopener noreferrer">Student DART / GoPass requirements ↗</a>
      <a href={ARRIVAL_SOURCES.parking.url} target="_blank" rel="noopener noreferrer">UTD parking permits and visitor options ↗</a>
    </div>
    <details className={styles.disclosure}><summary>Before using campus transportation</summary><p>The Comet Cruiser serves UT Dallas and nearby communities and does not require a pass or ID. Other DART services require the appropriate fare or pass. UTD lists a valid Comet Card, current registration and paid current-semester fees among student GoPass requirements. Follow UTD’s current application instructions and confirm that your pass is active before travelling.</p><p>Official airport and UTD pages checked {ARRIVAL_SOURCES_CHECKED}. Recheck the publisher for changes, holidays and your arrival date.</p></details>
  </section>;
}

function ExpansionResearch() {
  const id = useId();
  const [concept, setConcept] = useState<string>('campus');
  const [campus, setCampus] = useState('');
  const [problem, setProblem] = useState('');
  const [evidence, setEvidence] = useState('');
  const [measure, setMeasure] = useState('');
  const [checked, setChecked] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  const selected = EXPANSION_CONCEPTS.find(item => item.id === concept)!;
  const readiness = expansionReadiness(checked);
  function download() {
    const text = expansionWorksheetText({ concept, campus, problem, evidence, measure, checked });
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'campusbridge-group-a-research.txt'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('Worksheet download started. If your browser asks, choose where to save it. Your notes remain on this page until you clear it or reload.');
  }
  return <section className={styles.panel} aria-labelledby={`${id}-title`} id="expansion-research">
    <p className={styles.kicker}>FEATURE SET 12 · CAMPUS EXPANSION AND PREMIUM OPTIONS</p>
    <h2 id={`${id}-title`}>Test the next idea</h2>
    <p><strong className={styles.badge}>Research only</strong> Compare a possible next step, record the evidence and download a worksheet for the team. These concepts are not available services.</p>
    <div className={styles.concepts} role="group" aria-label="Research concept">{EXPANSION_CONCEPTS.map(item => <button key={item.id} type="button" aria-pressed={concept === item.id} onClick={() => { setConcept(item.id); setNotice(''); }}><strong>{item.title}</strong><span>{item.scope}</span></button>)}</div>
    <p className={styles.result}>{selected.validate}</p>
    <div className={styles.grid}>
      <label htmlFor={`${id}-campus`}>Campus or audience to research<input id={`${id}-campus`} maxLength={160} value={campus} placeholder="e.g. incoming students at a proposed campus" onChange={event => setCampus(event.target.value)}/></label>
      <label htmlFor={`${id}-problem`}>Which problem would this solve?<textarea id={`${id}-problem`} maxLength={2000} rows={3} value={problem} onChange={event => setProblem(event.target.value)}/></label>
      <label htmlFor={`${id}-evidence`}>Evidence and responsible owner<textarea id={`${id}-evidence`} maxLength={2000} rows={3} value={evidence} placeholder="Summarize findings without student names or contact details" onChange={event => setEvidence(event.target.value)}/></label>
      <label htmlFor={`${id}-measure`}>Pilot success measure and decision date<textarea id={`${id}-measure`} maxLength={2000} rows={3} value={measure} onChange={event => setMeasure(event.target.value)}/></label>
    </div>
    <fieldset className={styles.checks}><legend>Evidence before a pilot</legend>{EXPANSION_CHECKS.map(item => <label key={item.id}><input type="checkbox" checked={checked.includes(item.id)} onChange={event => setChecked(current => event.target.checked ? [...current, item.id] : current.filter(value => value !== item.id))}/><span>{item.label}</span></label>)}</fieldset>
    <p role="status">{readiness.completed} of {readiness.total} criteria recorded. {readiness.ready ? 'Ready for a team review of the evidence; launching a pilot is a separate decision.' : 'Keep gathering evidence before deciding on a pilot.'}</p>
    <div className={styles.actions}><button type="button" className="button" onClick={download}>Download research worksheet</button><button type="button" className="button button-outline" onClick={() => { setCampus(''); setProblem(''); setEvidence(''); setMeasure(''); setChecked([]); setNotice('Research worksheet cleared.'); }}>Clear worksheet</button></div>
    <p className={styles.note}>Notes stay in this page’s memory and clear on reload. They are not sent to CampusBridge or stored with your account. Keep personal student information out of shared notes.</p>
    <p role="status">{notice}</p>
  </section>;
}

export function GroupATools({ state, accountId, busy, onLocationSave }: { state: StudentState; accountId: string; busy: boolean; onLocationSave: LocationSave }) {
  const [exploring, setExploring] = useState(false);
  return <div className={styles.tools}>
    <header className={styles.intro}><p className={styles.kicker}>CAMPUSBRIDGE · GROUP A</p><h1>Explore, arrive and plan what comes next</h1><p>Group A brings together the map experience, airport and campus transportation, and research into future campus and premium concepts.</p></header>
    <nav className={styles.jumpLinks} aria-label="Group A tools"><a href="#maps-experience">Maps</a><a href="#airport-arrival">Transportation and arrival</a><a href="#expansion-research">Expansion research</a></nav>
    <section className={styles.panel} id="maps-experience" aria-labelledby="group-a-maps-title"><p className={styles.kicker}>FEATURE SET 3 · GOOGLE MAPS EXPERIENCE</p><h2 id="group-a-maps-title">Explore homes with control over the map</h2><p>Keep the list and map in sync, switch views on your phone and explore nearby places. The map loads when you ask, and you can pause it while continuing with the list.</p><button type="button" className="button button-outline" aria-expanded={exploring} aria-controls="group-a-housing-explorer" onClick={() => setExploring(current => !current)}>{exploring ? 'Close housing explorer' : 'Open housing explorer'}</button>{exploring && <div id="group-a-housing-explorer"><HousingOptions comparisonKey={comparisonSessionKey('account', accountId)} answers={state.answers} busy={busy} onSave={onLocationSave} groupAEnhancements/></div>}</section>
    <ArrivalAssistant state={state}/>
    <ExpansionResearch/>
  </div>;
}
