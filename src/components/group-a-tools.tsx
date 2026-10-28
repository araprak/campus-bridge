'use client';

import { useId, useState } from 'react';
import type { StudentState } from '@/lib/model';
import { APARTMENTS } from '@/data/local-options';
import { GROUP_A_ON_CAMPUS_HOUSING, GROUP_A_HOUSING_CHECKED, GROUP_A_HOUSING_SOURCE } from '@/data/group-a-housing';
import { directionsUrl } from '@/domain/housing-map';
import { CAMPUS_PLACES } from '@/data/campus-guide';
import { comparisonSessionKey } from '@/domain/apartment-discovery';
import { ARRIVAL_AIRPORTS, ARRIVAL_SOURCES, ARRIVAL_SOURCES_CHECKED, ARRIVAL_TRAVEL_OPTIONS, ARRIVAL_DAY_CHECKS, SPRING_ARRIVAL_CHECKED, BIG_HOWDY_URL, EXPANSION_CHECKS, EXPANSION_CONCEPTS, type ArrivalAirport, type ArrivalTravel } from '@/data/group-a-arrival';
import { arrivalRouteUrl, expansionReadiness, expansionWorksheetText, parseGroupAArrivalRoute, type GroupAArrivalRoute } from '@/domain/group-a-arrival';
import { useGroupCloudData } from './use-group-cloud-data';
import { HousingOptions } from './apartment-discovery';
import type { LocationSave } from './local-setup';
import styles from './group-a-tools.module.css';

function ArrivalAssistant({ state }: { state: StudentState }) {
  const id = useId();
  const planHome = state.answers.housingLocation === 'off_campus' && APARTMENTS.some(item => item.id === state.answers.housingCommunity) ? state.answers.housingCommunity! : '';
  const initialData = (): GroupAArrivalRoute => ({ version: 1, airport: 'DFW', travel: 'transit', destinationKind: planHome ? 'community' : 'campus', communityId: planHome || APARTMENTS[0].id, campusId: 'su', customDestination: '', arrivalDate: state.answers.arrivalDate, checklist: [] });
  const cloud = useGroupCloudData<GroupAArrivalRoute>({ kind: 'arrival', parse: parseGroupAArrivalRoute, initialData });
  const value = cloud.data;
  const [shown, setShown] = useState(false);
  const [consent, setConsent] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const place = CAMPUS_PLACES.find(item => item.id === value.campusId)!;
  const home = APARTMENTS.find(item => item.id === value.communityId)!;
  const destination = value.destinationKind === 'custom' ? value.customDestination : value.destinationKind === 'community' ? `${home.name}, ${home.address}` : `${place.name}, ${place.address}`;
  const route = arrivalRouteUrl(value.airport, destination, value.travel);
  const source = value.airport === 'DFW' ? ARRIVAL_SOURCES.dfw : ARRIVAL_SOURCES.dal;
  const lease = state.answers.leaseStartDate;
  const firstNightGap = !!lease && !!value.arrivalDate && lease > value.arrivalDate;
  function edit(patch: Partial<GroupAArrivalRoute>) { cloud.setData(current => ({ ...current, ...patch })); setShown(false); setFormError(''); setConsent(false); }
  async function save() {
    if (!consent) { setFormError('Choose whether to save this arrival plan to your account.'); return; }
    const parsed = parseGroupAArrivalRoute(value);
    if (!parsed) { setFormError('Check the arrival date and enter a destination of up to 300 characters.'); return; }
    setFormError(''); if (await cloud.save(parsed)) setConsent(false);
  }
  return <section className={styles.panel} aria-labelledby={`${id}-title`} id="airport-arrival">
    <p className={styles.kicker}>FEATURE SET 5 · TRANSPORTATION AND ARRIVAL</p>
    <h2 id={`${id}-title`}>From the airport to your first stop</h2>
    <p>Start with the arrival date and apartment in your shared plan, then adjust this Group A arrival plan. Saving here does not change your shared plan.</p>
    <div className={styles.result}>
      <h3>DFW to campus: Silver Line</h3>
      <p>UTD’s travel guide recommends DART Silver Line from <strong>DFW Terminal B → UT Dallas Station</strong>, then walk or take <strong>Comet Cruiser Route 883</strong> to campus.</p>
      <p>UTD publishes about <strong>48 minutes</strong> and <strong>$3 for a single ticket / $6 for a day pass</strong>. These are the publisher’s planning figures, not a live fare or journey time. Check current fares, the final walking segment, luggage and service for your actual travel date.</p>
      <p className={styles.note}><a href={ARRIVAL_SOURCES.travel.url} target="_blank" rel="noopener noreferrer">UTD travel guide ↗</a> · Checked {SPRING_ARRIVAL_CHECKED}</p>
    </div>
    <div className={styles.grid}>
      <article className={styles.card}><h3>Big Howdy airport pickup</h3><p>UTD lists free airport pickup for new students through Big Howdy, run by students, community volunteers and local churches. Spring request forms are expected in <strong>mid-November</strong>. Submit a request through the program and wait for confirmation; a request is not a guaranteed pickup.</p><a href={BIG_HOWDY_URL} target="_blank" rel="noopener noreferrer">Check Big Howdy pickup requests ↗</a><p className={styles.note}>Source: <a href={ARRIVAL_SOURCES.travel.url} target="_blank" rel="noopener noreferrer">UTD travel guide ↗</a> · Checked {SPRING_ARRIVAL_CHECKED}. The UTD page still links a fall form, so use the program’s current spring instructions.</p></article>
      <article className={styles.card}><h3>Landing after transit stops?</h3><p>Check the last train and bus for your arrival date before travelling. Agree an airport taxi, rideshare or confirmed pickup backup and confirm your accommodation’s late check-in.</p><p>UTD lists DFW taxi estimates of <strong>$55–$75</strong> and Uber/Lyft estimates of <strong>$45–$75</strong>; rideshare may require a US phone number. Obtain a current quote and follow the airport’s official pickup signs.</p><p className={styles.note}><a href={ARRIVAL_SOURCES.travel.url} target="_blank" rel="noopener noreferrer">UTD travel guide ↗</a> · Checked {SPRING_ARRIVAL_CHECKED}</p></article>
    </div>
    {cloud.loading && <p role="status">Loading your account’s arrival plan…</p>}
    <form onSubmit={event => { event.preventDefault(); setShown(!!route); setFormError(route ? '' : 'Enter a destination of up to 300 characters.'); }}>
      <fieldset className={styles.formFields} disabled={cloud.loading || cloud.busy}>
      <legend className={styles.srOnly}>Your arrival choices</legend>
      <div className={styles.grid}>
        <label htmlFor={`${id}-date`}>Arrival date<input id={`${id}-date`} type="date" value={value.arrivalDate} onChange={event => edit({ arrivalDate: event.target.value })}/></label>
        <label htmlFor={`${id}-airport`}>Arrival airport<select id={`${id}-airport`} value={value.airport} onChange={event => edit({ airport: event.target.value as ArrivalAirport })}>{Object.entries(ARRIVAL_AIRPORTS).map(([key, item]) => <option key={key} value={key}>{item.name}</option>)}</select></label>
        <label htmlFor={`${id}-travel`}>How will you travel?<select id={`${id}-travel`} value={value.travel} onChange={event => edit({ travel: event.target.value as ArrivalTravel })}>{Object.entries(ARRIVAL_TRAVEL_OPTIONS).map(([key, item]) => <option key={key} value={key}>{item}</option>)}</select></label>
        <label htmlFor={`${id}-destination`}>First destination<select id={`${id}-destination`} value={value.destinationKind} onChange={event => edit({ destinationKind: event.target.value as GroupAArrivalRoute['destinationKind'], customDestination: '' })}><option value="campus">A UT Dallas campus destination</option><option value="community">An apartment community</option><option value="custom">Another address</option></select></label>
        {value.destinationKind === 'campus' && <label htmlFor={`${id}-campus`}>Campus destination<select id={`${id}-campus`} value={value.campusId} onChange={event => edit({ campusId: event.target.value })}>{CAMPUS_PLACES.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
        {value.destinationKind === 'community' && <label htmlFor={`${id}-community`}>Apartment community<select id={`${id}-community`} value={value.communityId} onChange={event => edit({ communityId: event.target.value })}>{APARTMENTS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
        {value.destinationKind === 'custom' && <label htmlFor={`${id}-address`}>Destination address<input id={`${id}-address`} value={value.customDestination} maxLength={300} required autoComplete="off" placeholder="Street, city and ZIP" aria-describedby={`${id}-privacy`} onChange={event => edit({ customDestination: event.target.value })}/></label>}
      </div>
      <div className={styles.actions}><button type="submit" className="button">Build my arrival route</button><button type="button" className="button button-outline" onClick={() => edit({ arrivalDate: state.answers.arrivalDate, destinationKind: planHome ? 'community' : 'campus', communityId: planHome || APARTMENTS[0].id, customDestination: '' })}>Use my current shared plan</button></div>
      </fieldset>
      <p className={styles.note} id={`${id}-privacy`}>Changes stay on this page until you explicitly save. Opening directions sends the airport and destination to Google Maps. Saving sends the arrival date, destination and checklist to your CampusBridge account in Supabase; a custom address may be a precise location. Save it only if you are comfortable storing it there.</p>
    </form>
    {shown && route && <div className={styles.result} aria-live="polite"><h3>Your arrival route</h3><p><strong>{ARRIVAL_AIRPORTS[value.airport].name}</strong> → {destination}</p><p>{value.travel === 'transit' ? ARRIVAL_AIRPORTS[value.airport].transit : value.travel === 'pickup' ? 'Agree on the correct terminal and permitted pickup point with your driver. Confirm the current fare or pickup arrangement before leaving.' : 'Confirm your rental or driver arrangements and the airport pickup location. Check current campus parking permits if you will park at UTD.'}</p><a className="button" href={route} target="_blank" rel="noopener noreferrer">Open {value.travel === 'transit' ? 'transit' : 'driving'} directions ↗</a><p className={styles.note}>Choose your actual terminal in Google Maps. CampusBridge does not provide live fares, schedules or availability.</p></div>}
    <h3>Arrival day checklist</h3>
    {firstNightGap && <p className={styles.result}><strong>Your lease starts after your arrival.</strong> Your shared plan says {lease}; this arrival plan says {value.arrivalDate}. Confirm a temporary first-night stay and how to reach it before you travel.</p>}
    {!lease && <p className={styles.note}>Your shared plan has no lease start date. Confirm when you can collect your keys and whether you need a temporary stay.</p>}
    <fieldset className={styles.checks} disabled={cloud.loading || cloud.busy}><legend>Confirm each arrangement yourself</legend>{ARRIVAL_DAY_CHECKS.map(item => <label key={item.id}><input type="checkbox" checked={value.checklist.includes(item.id)} onChange={event => edit({ checklist: event.target.checked ? [...value.checklist, item.id] : value.checklist.filter(check => check !== item.id) })}/><span><strong>{item.label}</strong><br/>{item.detail}<br/><a href={ARRIVAL_SOURCES[item.source].url} target="_blank" rel="noopener noreferrer">{ARRIVAL_SOURCES[item.source].label} ↗</a> · Checked {SPRING_ARRIVAL_CHECKED}{item.id === 'documents' && <> · <a href="https://www.youtube.com/watch?v=f0Fw3YoKoVU" target="_blank" rel="noopener noreferrer">ISSO port-of-entry video ↗</a></>}</span></label>)}</fieldset>
    <div className={styles.saveBox}><label className={styles.consent}><input type="checkbox" checked={consent} disabled={cloud.loading || cloud.busy} onChange={event => setConsent(event.target.checked)}/><span>Save this Group A arrival date, destination and checklist to my CampusBridge account, including any custom address I entered.</span></label><div className={styles.actions}><button type="button" className="button" disabled={cloud.loading || cloud.busy || !consent} onClick={() => void save()}>{cloud.busy ? 'Saving…' : 'Save arrival plan to my account'}</button><button type="button" className="button button-outline" disabled={cloud.loading || cloud.busy} onClick={() => void cloud.reload()}>Reload saved plan</button>{cloud.hasSaved && <button type="button" className="button button-outline" disabled={cloud.busy} onClick={() => setConfirmRemove(true)}>Delete saved arrival plan</button>}</div>
    {confirmRemove && <div className={styles.result}><p>Delete the Group A arrival plan from your account? Your shared plan remains available.</p><div className={styles.actions}><button type="button" className="button button-outline" onClick={() => setConfirmRemove(false)}>Keep saved plan</button><button type="button" className="button" disabled={cloud.busy} onClick={async () => { if (await cloud.remove()) { setConfirmRemove(false); setConsent(false); setShown(false); } }}>Delete arrival plan</button></div></div>}
    {formError && <p role="alert" className={styles.error}>{formError}</p>}{cloud.error && <p role="alert" className={styles.error}>{cloud.error}</p>}{cloud.notice && <p role="status">{cloud.notice}</p>}</div>
    <div className={styles.sources}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a><a href={ARRIVAL_SOURCES.cruiser.url} target="_blank" rel="noopener noreferrer">Comet Cruiser routes and schedules ↗</a><a href={ARRIVAL_SOURCES.dart.url} target="_blank" rel="noopener noreferrer">Student DART / GoPass requirements ↗</a><a href={ARRIVAL_SOURCES.parking.url} target="_blank" rel="noopener noreferrer">UTD parking permits and visitor options ↗</a></div>
    <details className={styles.disclosure}><summary>Before using campus transportation</summary><p>The Comet Cruiser does not require a pass or ID. Other DART services require an appropriate fare or active pass. UTD requires a valid Comet Card, current registration and paid current-semester fees for a student GoPass application, and says to apply on or after the first day of class for that semester. Do not assume that a student pass covers your pre-semester airport journey. Confirm an active pass or buy the appropriate fare before travelling.</p><p>Airport and transit directory pages checked {ARRIVAL_SOURCES_CHECKED}; Spring arrival guidance above checked {SPRING_ARRIVAL_CHECKED}. Holiday schedules for January 2027 must be checked with the publisher when released.</p></details>
  </section>;
}

function OnCampusHousing() {
  return <div className={styles.onCampus}>
    <h3>On-campus housing</h3><p>Compare University Housing options alongside the 30 off-campus communities. Their pins appear in the map’s Campus and on-campus housing layer. Housing applications and assignments are handled by UTD; a map pin does not mean a room is available.</p>
    <div className={styles.grid}>{GROUP_A_ON_CAMPUS_HOUSING.map(item => <article key={item.id} className={styles.card}><h4>{item.name}</h4><p>{item.note}</p><div className={styles.actions}><a href={item.url} target="_blank" rel="noopener noreferrer">Official housing details ↗</a><a href={directionsUrl(item)} target="_blank" rel="noopener noreferrer">Directions to this pin ↗</a><a href={item.sourceUrl} target="_blank" rel="noopener noreferrer">UTD campus map ↗</a></div><p className={styles.note}>Housing details and map pin checked {GROUP_A_HOUSING_CHECKED}</p></article>)}</div>
    <p className={styles.note}><a href={GROUP_A_HOUSING_SOURCE} target="_blank" rel="noopener noreferrer">University Housing availability, applications and move-in dates ↗</a> · Checked {GROUP_A_HOUSING_CHECKED}. Confirm your actual move-in appointment; the Spring-only agreement term begins Jan 19, 2027.</p>
  </div>;
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
    <h2 id={`${id}-title`}>Team research</h2>
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
    <nav className={styles.jumpLinks} aria-label="Group A tools"><a href="#maps-experience">Maps</a><a href="#airport-arrival">Transportation and arrival</a><a href="#expansion-research">Team research</a></nav>
    <section className={styles.panel} id="maps-experience" aria-labelledby="group-a-maps-title"><p className={styles.kicker}>FEATURE SET 3 · GOOGLE MAPS EXPERIENCE</p><h2 id="group-a-maps-title">Explore homes with control over the map</h2><p>Keep the list and map in sync, switch views on your phone and explore nearby places. The map loads when you ask, and you can pause it while continuing with the list.</p><button type="button" className="button button-outline" aria-expanded={exploring} aria-controls="group-a-housing-explorer" onClick={() => setExploring(current => !current)}>{exploring ? 'Close housing explorer' : 'Open housing explorer'}</button>{exploring && <div id="group-a-housing-explorer"><HousingOptions comparisonKey={comparisonSessionKey('account', accountId)} answers={state.answers} busy={busy} onSave={onLocationSave} groupAEnhancements/></div>}<OnCampusHousing/></section>
    <ArrivalAssistant state={state}/>
    <ExpansionResearch/>
  </div>;
}
