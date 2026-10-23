'use client';

import '@/app/housing-enhancements.css';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check, MapPin, SlidersHorizontal, X } from 'lucide-react';
import { APARTMENTS, HOUSING_DIRECTORY_REVIEWED, HOUSING_DISTANCE_NOTE, type ApartmentOption } from '@/data/local-options';
import { COMMUNITY_TRANSIT, transitScheduleNotice } from '@/data/community-transit';
import { APARTMENT_DISCOVERY_DETAILS } from '@/data/apartment-discovery-details';
import { DEFAULT_HOUSING_FILTERS, HOUSING_RADII, filterApartments, parseHousingFilters, serializeHousingFilters, readComparisonStorage, writeComparisonStorage, toggleComparison, planningCommunityPatch, type HousingFilters } from '@/domain/apartment-discovery';
import { dallasDate, type Answers } from '@/lib/model';
import dynamic from 'next/dynamic';
import { ApartmentRating } from './apartment-rating';
import { ApartmentReviewsProvider } from './apartment-reviews';
import { HousingCostEstimator } from './housing-cost-estimator';
import { useApartmentFavorites } from './use-apartment-favorites';
import { HOUSING_ZIP_CENTERS, HOUSING_ZIP_SOURCE_PAGE, housingZipCenter, validateHousingZip } from '@/data/housing-zip-centers';
import { housingDistanceMiles } from '@/domain/apartment-discovery';
import { directionsUrl } from '@/domain/housing-map';
import type { LocationSave } from './local-setup';

type Props = { answers: Answers; busy: boolean; onSave: LocationSave; comparisonKey: string | null };
const GoogleHousingMap = dynamic(() => import('./google-housing-map'), { ssr: false, loading: () => <p role="status" className="housing-map-placeholder">Loading the map…</p> });
const pageSize = 6;
const communityById = (id: string) => APARTMENTS.find(a => a.id === id);
const reviewedOn = (id: string) => APARTMENT_DISCOVERY_DETAILS[id]?.identityReviewedOn || HOUSING_DIRECTORY_REVIEWED;

function DiscoveryDialog({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const heading = useId();
  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); if (trigger?.isConnected) trigger.focus(); };
  }, []);
  return <dialog ref={ref} className={`discovery-dialog ${wide ? 'discovery-dialog-wide' : ''}`} aria-labelledby={heading} onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><div><p className="eyebrow">FIND & COMPARE HOMES</p><h2 id={heading}>{title}</h2></div><button type="button" autoFocus className="discovery-close" aria-label="Close apartment dialog" onClick={onClose}><X size={21}/></button></header>
    <div className="discovery-dialog-body">{children}</div>
  </dialog>;
}

function PropertyLinks({ apartment }: { apartment: ApartmentOption }) {
  const extra = APARTMENT_DISCOVERY_DETAILS[apartment.id];
  return <div className="discovery-source-links"><a href={apartment.url} target="_blank" rel="noopener noreferrer">Official community website ↗</a>
    {extra?.officialDetailsLinks.map(link => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>)}
  </div>;
}

function TransitSummary({ apartment, arrivalDate }: { apartment: ApartmentOption; arrivalDate: string }) {
  const transit = COMMUNITY_TRANSIT[apartment.id];
  if (!transit) return <span>Not researched for this community yet.</span>;
  return <><ul className="discovery-route-list">{transit.routes.map(route => <li key={route.id}><a href={route.url} target="_blank" rel="noopener noreferrer">{route.name} ↗</a></li>)}</ul><small>{transitScheduleNotice(arrivalDate, dallasDate()).text}</small></>;
}

export function HousingOptions({ answers, busy, onSave, comparisonKey }: Props) {
  const [filters, setFilters] = useState<HousingFilters>({ ...DEFAULT_HOUSING_FILTERS });
  const favorites = useApartmentFavorites(comparisonKey);
  const [savedOnly, setSavedOnly] = useState(false);
  const [zipInput, setZipInput] = useState('');
  const [zipError, setZipError] = useState('');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [limit, setLimit] = useState(pageSize);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [activeApartmentId, setActiveApartmentId] = useState<string | null>(null);
  const [selectionRevision, setSelectionRevision] = useState(0);
  const [mapRequested, setMapRequested] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const mapPanel = useRef<HTMLElement>(null);
  const [comparing, setComparing] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [lease, setLease] = useState(answers.leaseStartDate || '');
  const [notice, setNotice] = useState('');
  const [saveError, setSaveError] = useState('');
  const leaseId = useId();
  const filtersId = useId();
  useEffect(() => setLease(answers.leaseStartDate || ''), [answers.leaseStartDate]);
  useEffect(() => {
    const sync = () => { const params = new URLSearchParams(window.location.search); const next = parseHousingFilters(params); setFilters(next); setZipInput(next.zip || ''); setZipError(params.has('housingZip') && !next.zip ? 'The ZIP in this link is unsupported. Showing the UTD search area.' : ''); if (next.zip || next.search || params.has('housingRadius')) setMapRequested(true); setLimit(pageSize); };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  useEffect(() => {
    setCompareIds([]);
    try { setCompareIds(readComparisonStorage(sessionStorage, comparisonKey)); } catch { /* Comparison still works in memory when storage is blocked. */ }
  }, [comparisonKey]);
  const center = housingZipCenter(filters.zip);
  const centerLabel = center ? `ZIP ${center.zip} reference point` : 'UTD';
  const matches = filterApartments(filters).filter(apartment => !savedOnly || favorites.ids.includes(apartment.id));
  const visible = matches.slice(0, limit);
  const selected = communityById(answers.housingCommunity || '');
  const detail = detailId ? communityById(detailId) : undefined;
  const comparison = compareIds.map(communityById).filter((a): a is ApartmentOption => !!a);
  const pending = pendingId ? communityById(pendingId) : undefined;

  function selectApartment(id: string, fromMap = false) {
    setActiveApartmentId(id);
    setSelectionRevision(revision => revision + 1);
    const index = matches.findIndex(apartment => apartment.id === id);
    if (index >= limit) setLimit(Math.ceil((index + 1) / pageSize) * pageSize);
    if (fromMap) requestAnimationFrame(() => cardRefs.current.get(id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }
  function showApartmentOnMap(id: string) {
    if (!matches.some(apartment => apartment.id === id)) { setSavedOnly(false); updateFilters({ ...DEFAULT_HOUSING_FILTERS, radius: 15 }); }
    setActiveApartmentId(id); setDetailId(null); setComparing(false);
    setSelectionRevision(revision => revision + 1);
    setMapRequested(true); setMobileView('map');
    requestAnimationFrame(() => mapPanel.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }
  function updateFilters(next: HousingFilters) {
    setFilters(next); setLimit(pageSize); setZipInput(next.zip || ''); setZipError('');
    if (next.zip || next.search.trim()) setMapRequested(true);
    const query = serializeHousingFilters(next, window.location.search).toString();
    window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }
  function favoriteButton(apartment: ApartmentOption) {
    const saved = favorites.ids.includes(apartment.id);
    return <button type="button" className="discovery-favorite-button" aria-pressed={saved} aria-label={`${saved ? 'Remove' : 'Save'} ${apartment.name}${saved ? ' from saved apartments' : ' to saved apartments'}`} disabled={favorites.enabled && (favorites.loading || favorites.busy || !!favorites.error)} onClick={() => void favorites.toggle(apartment.id)}>{saved ? '♥ Saved' : '♡ Save apartment'}</button>;
  }
  function favoriteFeedback() {
    return <>{favorites.notice && <p role="status" className="discovery-notice">{favorites.notice}{!favorites.enabled && <> <a href="/login">Log in</a></>}</p>}{favorites.error && <p role="alert" className="discovery-error">{favorites.error} <button type="button" className="discovery-text-button" onClick={() => void favorites.refresh()}>Reload saved apartments</button></p>}</>;
  }
  function storeComparison(ids: string[]) {
    setCompareIds(ids);
    try { writeComparisonStorage(sessionStorage, comparisonKey, ids); } catch { /* No account or persistence dependency. */ }
  }
  function toggle(id: string) {
    const result = toggleComparison(compareIds, id);
    if (result.status === 'full') { setNotice('You can compare three communities. Remove one to add another.'); return; }
    storeComparison(result.ids);
    setNotice(`${communityById(id)?.name || 'Community'} ${result.status === 'removed' ? 'removed from' : 'added to'} comparison.`);
  }
  async function saveCommunity(id: string) {
    const patch = planningCommunityPatch(answers, id);
    if (!patch || busy) return;
    setSaveError(''); setNotice('');
    try {
      if (!await onSave(patch)) { setSaveError('Your community was not changed. Please try again.'); return; }
      setLease(''); setPendingId(null); setDetailId(null); setComparing(false);
      setNotice(id ? 'Planning community saved. Confirm your lease start date below.' : 'Planning community cleared. Your lease date was also cleared.');
    } catch { setSaveError('Your community was not changed. Please try again.'); }
  }
  function requestCommunity(id: string) {
    if (!planningCommunityPatch(answers, id) || busy) return;
    setSaveError('');
    if (answers.housingCommunity || answers.leaseStartDate) setPendingId(id);
    else void saveCommunity(id);
  }
  function chooseButton(apartment: ApartmentOption) {
    return <button type="button" className="button" disabled={busy || apartment.id === answers.housingCommunity} onClick={() => requestCommunity(apartment.id)}>{apartment.id === answers.housingCommunity ? <><Check size={16}/>Your planning community</> : 'Use as my planning community'}</button>;
  }

  return <ApartmentReviewsProvider><section className="local-options apartment-discovery" aria-label="Apartment discovery">
    <div className="discovery-intro"><p className="eyebrow">A PLACE TO START</p><h3>Find & compare homes</h3><p>Explore the area. Shortlist a few. Choose when you’re ready.</p></div>
    {selected && <div className="discovery-saved"><div><span className="discovery-kicker"><Check size={14}/>Your planning community</span><strong>{selected.name}</strong><p>{selected.address}{housingDistanceMiles(selected, filters) > filters.radius && <span> · Outside your {filters.radius}-mile filter</span>}</p></div><button type="button" className="discovery-text-button" disabled={busy} onClick={() => requestCommunity('')}>Clear selection</button></div>}
    <div className="housing-saved-navigation" role="group" aria-label="Apartment collection"><button type="button" aria-pressed={!savedOnly} onClick={() => { setSavedOnly(false); setLimit(pageSize); }}>Explore apartments</button><button type="button" aria-pressed={savedOnly} onClick={() => { setSavedOnly(true); setLimit(pageSize); }}>Saved apartments{favorites.enabled ? ` (${favorites.ids.length})` : ''}</button></div>
    {!favorites.enabled && <p className="discovery-note"><a href="/login">Log in</a> to save apartments across visits and devices. Comparison is available in this tab.</p>}
    {favorites.loading && <p role="status">Loading saved apartments…</p>}
    {favorites.error && <p className="discovery-error" role="alert">{favorites.error} <button type="button" className="discovery-text-button" onClick={() => void favorites.refresh()}>Reload saved apartments</button></p>}
    <p className="discovery-notice" role="status">{favorites.notice}</p>
    <form className="housing-zip-search" onSubmit={event => { event.preventDefault(); const result = validateHousingZip(zipInput); if (result.error) { setZipError(result.error); return; } updateFilters({ ...filters, zip: result.zip }); setMapRequested(true); }}><label htmlFor={`${filtersId}-zip`}>Search around a local ZIP<input id={`${filtersId}-zip`} inputMode="numeric" autoComplete="postal-code" maxLength={10} value={zipInput} placeholder="e.g. 75080" aria-invalid={!!zipError} aria-describedby={`${filtersId}-zip-help${zipError ? ` ${filtersId}-zip-error` : ''}`} onChange={event => { setZipInput(event.target.value); setZipError(''); }}/></label><button type="submit" className="button">Search ZIP & show map</button>{center && <button type="button" className="button button-outline" onClick={() => updateFilters({ ...filters, zip: undefined })}>Search from UTD</button>}</form>
    <p id={`${filtersId}-zip-help`} className="discovery-note">Supported local ZIPs: {HOUSING_ZIP_CENTERS.map(item => item.zip).join(', ')}. Uses an approximate <a href={HOUSING_ZIP_SOURCE_PAGE} target="_blank" rel="noopener noreferrer">2026 Census area reference point ↗</a>, not your street address. Searches our 30-community directory.</p>
    {zipError && <p id={`${filtersId}-zip-error`} className="discovery-error" role="alert">{zipError}</p>}
    <div className="housing-view-switch" aria-label="Housing explorer view"><button type="button" aria-pressed={mobileView === 'list'} onClick={() => setMobileView('list')}>List view</button><button type="button" aria-pressed={mobileView === 'map'} onClick={() => { setMobileView('map'); setMapRequested(true); }}>Map view</button></div>
    <div className={`housing-explorer-split housing-view-${mobileView}`}>
    <div className="housing-explorer-list" aria-label="Apartment listings and filters">
    <div className="discovery-controls">
      <label className="discovery-search" htmlFor={`${filtersId}-search`}>Search communities<input id={`${filtersId}-search`} type="search" placeholder="Name, city or ZIP" maxLength={120} value={filters.search} onChange={e => updateFilters({ ...filters, search: e.target.value })}/></label>
      <label htmlFor={`${filtersId}-radius`}>Distance from {center ? `ZIP ${center.zip}` : 'UTD'}<select id={`${filtersId}-radius`} value={filters.radius} onChange={e => { updateFilters({ ...filters, radius: Number(e.target.value) as HousingFilters['radius'] }); setMapRequested(true); }}>{HOUSING_RADII.map(radius => <option key={radius} value={radius}>Within {radius} miles</option>)}</select></label>
      <label htmlFor={`${filtersId}-sort`}>Sort by<select id={`${filtersId}-sort`} value={filters.sort} onChange={e => updateFilters({ ...filters, sort: e.target.value as HousingFilters['sort'] })}><option value="distance">Nearest first</option><option value="name">Name A–Z</option></select></label>
    </div>
    <div className="discovery-result-line"><p aria-live="polite"><strong>{matches.length}</strong> {matches.length === 1 ? 'community' : 'communities'}{savedOnly ? ' saved' : ' in our directory'}{filters.search ? ' matching your search' : ''} within {filters.radius} miles of {centerLabel}</p><button type="button" className="discovery-text-button" onClick={() => updateFilters({ ...DEFAULT_HOUSING_FILTERS })}><SlidersHorizontal size={13}/>Reset filters</button></div>
    <p className="discovery-coverage">Straight-line distance from {centerLabel} · A researched directory, not every apartment or live vacancies.</p>
    <div className="discovery-grid">{visible.map(apartment => <article className={`discovery-card ${compareIds.includes(apartment.id) ? 'is-compared' : ''} ${activeApartmentId === apartment.id ? 'is-map-selected' : ''}`} key={apartment.id} ref={node => { if (node) cardRefs.current.set(apartment.id, node); else cardRefs.current.delete(apartment.id); }} onClick={event => { if (!(event.target as HTMLElement).closest('button, input, label, a, select')) selectApartment(apartment.id); }}>
      <div className="discovery-card-top"><span><MapPin size={13}/>{housingDistanceMiles(apartment, filters).toFixed(1)} mi {center ? `from ZIP ${center.zip}` : 'to UTD'}</span>{apartment.id === selected?.id && <span className="discovery-saved-badge">Saved home</span>}</div>
      <h4><button type="button" className="housing-card-select" aria-pressed={activeApartmentId === apartment.id} aria-label={`Select ${apartment.name} on map`} onClick={() => selectApartment(apartment.id)}>{apartment.name}</button></h4><p className="discovery-address">{apartment.address}</p><p className="discovery-rent">Rent <span>Check with community</span></p><ApartmentRating apartmentId={apartment.id}/>{favoriteButton(apartment)}
      <div className="discovery-card-actions"><button type="button" className="discovery-detail-button" aria-haspopup="dialog" aria-label={`View details for ${apartment.name}`} onClick={() => setDetailId(apartment.id)}>Details <ArrowRight size={14}/></button><label className="discovery-compare-check"><input type="checkbox" checked={compareIds.includes(apartment.id)} onChange={() => toggle(apartment.id)} aria-label={`Compare ${apartment.name}`}/>Compare</label></div>
    </article>)}</div>
    {!matches.length && <div className="discovery-empty"><h4>{savedOnly ? 'No saved apartments match this view' : 'No matches in this directory'}</h4><p>{savedOnly ? 'Save a community while exploring, or clear the filters to check more of your saved apartments.' : 'Try a wider distance or another name, city or supported ZIP.'}</p><button type="button" className="button button-outline" onClick={() => updateFilters({ ...DEFAULT_HOUSING_FILTERS })}>Clear filters</button></div>}
    {matches.length > limit && <button type="button" className="button button-outline discovery-more" onClick={() => setLimit(n => n + pageSize)}>Show {Math.min(pageSize, matches.length - limit)} more <span>({visible.length} of {matches.length})</span></button>}
    </div>
    <aside ref={mapPanel} className="housing-explorer-map" aria-label="Housing and nearby services map">
      {mapRequested ? <GoogleHousingMap apartments={matches} searchCenter={center} selectionRevision={selectionRevision} selectedId={matches.some(apartment => apartment.id === activeApartmentId) ? activeApartmentId : null} onSelectApartment={id => selectApartment(id, true)} onViewDetails={id => setDetailId(id)}/> : <div className="housing-map-placeholder"><MapPin size={32}/><h4>Your neighborhood, on one map.</h4><p>See these {matches.length} communities, UT Dallas and useful places nearby.</p><button type="button" className="button" onClick={() => setMapRequested(true)}>Load interactive map</button><p className="small">Loads after a valid search or when you choose. No device location is requested.</p></div>}
    </aside></div>
    <p className="discovery-notice" role="status">{notice}</p>
    {compareIds.length > 0 && <aside className="discovery-tray" aria-label="Your apartment comparison"><div><strong>Compare · {compareIds.length} of 3</strong><ul>{comparison.map(apartment => <li key={apartment.id}><span>{apartment.name}</span><button type="button" aria-label={`Remove ${apartment.name} from comparison`} onClick={() => toggle(apartment.id)}><X size={14}/></button></li>)}</ul></div><div className="discovery-tray-actions"><button type="button" className="button" disabled={compareIds.length < 2} onClick={() => setComparing(true)}>Compare homes</button><button type="button" className="discovery-text-button" onClick={() => { storeComparison([]); setNotice('Comparison cleared. Your planning community is unchanged.'); }}>Clear comparison</button>{compareIds.length === 1 && <small>Add one more to compare.</small>}</div></aside>}
    <HousingCostEstimator/>
    <form className="lease-form" onSubmit={async e => { e.preventDefault(); const submittedLease = String(new FormData(e.currentTarget).get('leaseStartDate') || ''); setLease(submittedLease); setSaveError(''); setNotice(''); try { if (await onSave({ leaseStartDate: submittedLease })) setNotice(submittedLease ? 'Lease start date saved.' : 'Lease start date cleared.'); else setSaveError('Your lease date was not saved. Please try again.'); } catch { setSaveError('Your lease date was not saved. Please try again.'); } }}><div className="form-field"><label htmlFor={leaseId}>When does your lease start?</label><input id={leaseId} name="leaseStartDate" type="date" value={lease} disabled={busy} onChange={e => setLease(e.target.value)}/><p className="form-hint">Use the date on your lease. It can differ from your arrival date.</p></div><button className="button button-outline" disabled={busy}>Save lease date</button></form>
    {saveError && pendingId === null && <p role="alert" className="discovery-error">{saveError}</p>}
    <details className="guide-sources discovery-about"><summary>Sources & what’s included</summary><p>{APARTMENTS.length} communities, with individual official sources in Details. Original directory reviewed {HOUSING_DIRECTORY_REVIEWED}; any newer identity checks are dated on each community.</p><p>{HOUSING_DISTANCE_NOTE}</p><p>Open Ratings & reviews to view the community’s Google listing. Google supplies its own ratings and reviews; they are not combined with other sources or used to rank this directory. Rent and amenities still need confirmation with each community.</p><p>Saved apartments belong to your account and refresh when you return to this window. Comparison stays in this browser tab when storage is available. Only “Use as my planning community” changes your saved home; it does not reserve an apartment.</p></details>

    {detail && <DiscoveryDialog title={detail.name} onClose={() => setDetailId(null)}><p className="discovery-detail-address">{detail.address}</p><div className="discovery-detail-location"><strong>{detail.distanceMiles.toFixed(1)} miles to UTD</strong><button type="button" className="map-button" onClick={() => showApartmentOnMap(detail.id)}><MapPin size={15}/>Show on map</button><a className="inline-link" href={directionsUrl(detail)} target="_blank" rel="noopener noreferrer">Get directions ↗</a></div><p className="discovery-note">Straight-line distance · {detail.coordinateNote}</p>
      <dl className="discovery-facts"><div><dt>Monthly rent</dt><dd>Check rent with the community.<small>Ask for your move-in date, lease length, per-bed or whole-unit price, and fees.</small></dd></div><div><dt>Reviews</dt><dd><ApartmentRating apartmentId={detail.id}/></dd></div><div><dt>Amenities</dt><dd>Confirm with the community.<small>Availability can depend on your unit or lease.</small></dd></div><div><dt>Public transport</dt><dd><TransitSummary apartment={detail} arrivalDate={answers.arrivalDate}/></dd></div></dl>
      <PropertyLinks apartment={detail}/><p className="discovery-note">Name and address reviewed {reviewedOn(detail.id)}. Rent and future availability are unconfirmed.</p><div className="discovery-detail-actions">{favoriteButton(detail)}<button type="button" className="button button-outline" onClick={() => toggle(detail.id)}>{compareIds.includes(detail.id) ? 'Remove from comparison' : 'Add to comparison'}</button>{chooseButton(detail)}</div>{favoriteFeedback()}<p role="status" className="discovery-notice">{notice}</p>{saveError && <p role="alert" className="discovery-error">{saveError}</p>}
    </DiscoveryDialog>}

    {comparing && <DiscoveryDialog title="Your homes, side by side" wide onClose={() => setComparing(false)}><p className="discovery-note">Compare what we know. Confirm quotes and availability with each community.</p><p className="discovery-scroll-hint">Scroll sideways to see each home.</p><div className="discovery-table-scroll" role="region" aria-label="Apartment comparison table; scroll horizontally for all communities" tabIndex={0}><table className="discovery-table"><caption>Comparison of {comparison.length} selected communities</caption><thead><tr><th scope="col">What matters</th>{comparison.map(apartment => <th scope="col" key={apartment.id}>{apartment.name}<button type="button" className="discovery-text-button" onClick={() => toggle(apartment.id)} aria-label={`Remove ${apartment.name} from comparison table`}>Remove</button></th>)}</tr></thead><tbody>
      <tr><th scope="row">Distance to UTD</th>{comparison.map(a => <td key={a.id}><strong>{a.distanceMiles.toFixed(1)} miles</strong><small>Straight-line estimate</small></td>)}</tr>
      <tr><th scope="row">Location</th>{comparison.map(a => <td key={a.id}><p>{a.address}</p><button type="button" className="map-button" onClick={() => showApartmentOnMap(a.id)}><MapPin size={15}/>Show on map</button><a href={directionsUrl(a)} target="_blank" rel="noopener noreferrer">Get directions ↗</a></td>)}</tr>
      <tr><th scope="row">Monthly rent</th>{comparison.map(a => <td key={a.id}>Check with community<small>Move-in quote, fees and lease terms unconfirmed</small></td>)}</tr>
      <tr><th scope="row">Ratings & reviews</th>{comparison.map(a => <td key={a.id}><ApartmentRating apartmentId={a.id}/></td>)}</tr>
      <tr><th scope="row">Amenities</th>{comparison.map(a => <td key={a.id}>Not verified</td>)}</tr>
      <tr><th scope="row">Public transport</th>{comparison.map(a => <td key={a.id}><TransitSummary apartment={a} arrivalDate={answers.arrivalDate}/></td>)}</tr>
      <tr><th scope="row">Sources</th>{comparison.map(a => <td key={a.id}><PropertyLinks apartment={a}/><small>Identity reviewed {reviewedOn(a.id)}</small></td>)}</tr>
      <tr><th scope="row">Saved apartments</th>{comparison.map(a => <td key={a.id}>{favoriteButton(a)}</td>)}</tr>
      <tr><th scope="row">Your plan</th>{comparison.map(a => <td key={a.id}>{chooseButton(a)}</td>)}</tr>
    </tbody></table></div>{favoriteFeedback()}{comparison.length < 2 && <p role="status">Close this view and add another community to compare.</p>}<p className="discovery-note">Changing your planning community will ask you to reconfirm the lease date.</p>{saveError && <p role="alert" className="discovery-error">{saveError}</p>}</DiscoveryDialog>}

    {pendingId !== null && <DiscoveryDialog title={pending ? 'Change your planning community?' : 'Clear your planning community?'} onClose={() => { if (!busy) setPendingId(null); }}><p>{pending ? <>Your plan will use <strong>{pending.name}</strong> and ZIP {pending.zip}.</> : 'Your plan will return to general location guidance.'} Your existing lease date will be cleared so you can confirm the correct date.</p><p className="discovery-note">Your completed checklist steps will stay as they are.</p><div className="discovery-detail-actions"><button type="button" className="button button-outline" disabled={busy} onClick={() => setPendingId(null)}>Keep current home</button><button type="button" className="button" disabled={busy} onClick={() => void saveCommunity(pendingId)}>{busy ? 'Saving…' : pending ? 'Change community' : 'Clear community'}</button></div>{saveError && <p role="alert" className="discovery-error">{saveError}</p>}</DiscoveryDialog>}
  </section></ApartmentReviewsProvider>;
}
