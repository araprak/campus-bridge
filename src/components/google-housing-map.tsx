'use client';

import { ApartmentRating } from './apartment-rating';
import type { HousingZipCenter } from '@/data/housing-zip-centers';
import { Component, type ReactNode, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { APILoadingStatus, AdvancedMarker, InfoWindow, Map, Pin, useApiLoadingStatus, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { GoogleMapsProvider } from './google-maps-provider';
import { CAMPUS_REFERENCE, HOUSING_DIRECTORY_REVIEWED, type ApartmentOption } from '@/data/local-options';
import { APARTMENT_DISCOVERY_DETAILS } from '@/data/apartment-discovery-details';
import { CURATED_MAP_LOCATIONS, MAP_LAYER_LABELS, directionsUrl, type HousingMapLayer, type HousingMapLocation } from '@/domain/housing-map';

type Props = {
  apartments: ApartmentOption[];
  searchCenter?: HousingZipCenter;
  selectedId: string | null;
  selectionRevision?: number;
  onSelectApartment: (id: string) => void;
  onViewDetails: (id: string) => void;
  savedLayers?: HousingMapLayer[];
  onLayersChange?: (layers: HousingMapLayer[]) => void;
};
type Point = { latitude: number; longitude: number };
type AuthWindow = Window & { gm_authFailure?: () => void };
const position = (point: Point) => ({ lat: point.latitude, lng: point.longitude });
const MAP_ID = 'campusbridge-housing';
const popupOffset: [number, number] = [0, -35];
const layerStyles: Record<HousingMapLayer, { color: string; glyph: string }> = {
  apartments: { color: '#624277', glyph: 'H' },
  campus: { color: '#205539', glyph: 'U' },
  grocery: { color: '#297154', glyph: 'G' },
  restaurants: { color: '#9b3d53', glyph: 'R' },
  pharmacies: { color: '#176f7b', glyph: '+' },
  transportation: { color: '#455978', glyph: 'T' },
  essentials: { color: '#805e16', glyph: 'E' },
};
const initialLayers: HousingMapLayer[] = ['apartments', 'campus'];
const campus = CURATED_MAP_LOCATIONS.find(location => location.id === 'campus-address')!;
const reviewedDate = (value: string) => new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

function MapUnavailable({ configuration = false }: { configuration?: boolean }) {
  return <div className="housing-map-unavailable" role="status">
    <strong>{configuration ? 'The interactive map is not available yet.' : 'The map could not load.'}</strong>
    <p>{configuration ? 'You can still explore every community in the list and open its directions.' : 'Your list and saved choices still work. Check your connection or try again.'}</p>
    {!configuration && <button type="button" className="button button-outline" onClick={() => window.location.reload()}>Reload to retry map</button>}
  </div>;
}

// Google can throw while detaching Advanced Markers after an authorization
// failure. Keep third-party rendering and cleanup errors inside the map panel.
class MapErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <MapUnavailable/> : this.props.children; }
}

function MapCamera({ points, boundsKey, selected, selectionRevision }: { points: Point[]; boundsKey: string; selected?: Point & { id: string }; selectionRevision?: number }) {
  const map = useMap(MAP_ID);
  const core = useMapsLibrary('core');
  const pointsRef = useRef(points);
  const selectedRef = useRef(selected);
  const pendingCamera = useRef<'bounds' | 'selection' | null>(null);
  pointsRef.current = points;
  selectedRef.current = selected;
  const applyPendingCamera = useCallback(() => {
    if (!map || !core) return;
    // Mobile keeps this map mounted while the list is visible. Google ignores
    // fitBounds at 0x0, so retain the latest intent until the map has a size.
    const { width, height } = map.getDiv().getBoundingClientRect();
    if (!width || !height || !pendingCamera.current) return;
    const intent = pendingCamera.current;
    pendingCamera.current = null;
    if (intent === 'selection' && selectedRef.current) {
      map.panTo(position(selectedRef.current));
      map.setZoom(Math.max(map.getZoom() ?? 14, 14));
      return;
    }
    if (pointsRef.current.length === 0) {
      map.moveCamera({ center: position(CAMPUS_REFERENCE), zoom: 14 });
      return;
    }
    if (pointsRef.current.length === 1) {
      map.moveCamera({ center: position(pointsRef.current[0]), zoom: 14 });
      return;
    }
    const bounds = new core.LatLngBounds();
    pointsRef.current.forEach(point => bounds.extend(position(point)));
    map.fitBounds(bounds, 58);
  }, [map, core]);
  useEffect(() => {
    pendingCamera.current = 'bounds';
    applyPendingCamera();
  }, [applyPendingCamera, boundsKey]);
  useEffect(() => {
    if (!selectedRef.current) return;
    pendingCamera.current = 'selection';
    applyPendingCamera();
  }, [applyPendingCamera, selected?.id, selectionRevision]);
  useEffect(() => {
    if (!map) return;
    let wasVisible = false;
    const observer = new ResizeObserver(() => {
      const { width, height } = map.getDiv().getBoundingClientRect();
      const visible = width > 0 && height > 0;
      if (visible) {
        // Re-layout existing tiles without creating a new billable map or
        // resetting the user's camera on ordinary List / Map switches.
        if (!wasVisible) map.moveCamera({});
        applyPendingCamera();
      }
      wasVisible = visible;
    });
    observer.observe(map.getDiv());
    return () => observer.disconnect();
  }, [map, applyPendingCamera]);
  return null;
}

function ApartmentPopup({ apartment, onViewDetails }: { apartment: ApartmentOption; onViewDetails: Props['onViewDetails'] }) {
  return <div className="housing-map-popup">
    <h4>{apartment.name}</h4><p>{apartment.address}</p><ApartmentRating apartmentId={apartment.id}/>
    <dl><div><dt>Rent</dt><dd>Check with community</dd></div><div><dt>Photo</dt><dd>Not available</dd></div></dl>
    <p className="housing-map-popup-note">{apartment.coordinateNote || 'Approximate location. Confirm the leasing entrance.'}</p>
    <div className="housing-map-popup-actions"><button type="button" onClick={() => onViewDetails(apartment.id)}>View details</button><a href={directionsUrl(apartment)} target="_blank" rel="noopener noreferrer">Directions ↗</a></div>
    <p className="housing-map-popup-source"><a href={apartment.url} target="_blank" rel="noopener noreferrer">Community website ↗</a><br/>Details reviewed {reviewedDate(APARTMENT_DISCOVERY_DETAILS[apartment.id]?.identityReviewedOn || HOUSING_DIRECTORY_REVIEWED)}</p>
  </div>;
}

function LocationPopup({ location }: { location: HousingMapLocation }) {
  return <div className="housing-map-popup">
    <p className="housing-map-category">{MAP_LAYER_LABELS[location.layer]}</p><h4>{location.name}</h4>
    {location.address && <p>{location.address}</p>}
    {location.note && <p className="housing-map-popup-note">{location.note}</p>}
    <div className="housing-map-popup-actions"><a href={directionsUrl(location)} target="_blank" rel="noopener noreferrer">Directions ↗</a>{location.url && <a href={location.url} target="_blank" rel="noopener noreferrer">Visit website ↗</a>}</div>
    <p className="housing-map-popup-source">{location.url && <><a href={location.url} target="_blank" rel="noopener noreferrer">Place information ↗</a> · </>}Reviewed {reviewedDate(location.reviewedOn)}</p>
  </div>;
}

function MapContent({ apartments, searchCenter, selectedId, selectionRevision, onSelectApartment, onViewDetails, savedLayers, onLayersChange, mapId, failed }: Props & { mapId: string; failed: boolean }) {
  const status = useApiLoadingStatus();
  const legendId = useId();
  const [layers, setLayers] = useState<HousingMapLayer[]>(savedLayers ?? initialLayers);
  const [activeLocation, setActiveLocation] = useState<HousingMapLocation | null>(null);
  const [dismissedApartment, setDismissedApartment] = useState<string | null>(null);
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const selected = apartments.find(apartment => apartment.id === selectedId);
  const showApartment = selected && layers.includes('apartments') && dismissedApartment !== selectedId && !activeLocation;
  const locations = useMemo(() => CURATED_MAP_LOCATIONS.filter(location => layers.includes(location.layer)), [layers]);
  const plottedApartments = layers.includes('apartments') ? apartments : [];
  const points = [...plottedApartments, ...locations, ...(searchCenter ? [{ ...searchCenter, id: `zip-${searchCenter.zip}` }] : [])];
  // Parent filtering returns a fresh array; only a changed set of pins resets bounds.
  const boundsKey = points.map(point => `${point.id}:${point.latitude}:${point.longitude}`).sort().join('|');
  useEffect(() => { onLayersChange?.(layers); }, [layers, onLayersChange]);
  useEffect(() => {
    setDismissedApartment(null);
    setActiveLocation(null);
    // A new listing selection must be visible even if its layer was hidden.
    if (selectedId) setLayers(current => current.includes('apartments') ? current : [...current, 'apartments']);
  }, [selectedId, selectionRevision]);
  useEffect(() => {
    if (tilesLoaded) return;
    const timeout = window.setTimeout(() => setSlow(true), 20000);
    return () => window.clearTimeout(timeout);
  }, [tilesLoaded]);
  const hasError = failed || status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE;
  function toggleLayer(layer: HousingMapLayer) {
    setLayers(current => current.includes(layer) ? current.filter(value => value !== layer) : [...current, layer]);
    if (activeLocation?.layer === layer) setActiveLocation(null);
  }
  function selectApartment(apartment: ApartmentOption) {
    setActiveLocation(null); setDismissedApartment(null); onSelectApartment(apartment.id);
  }
  return <section className="housing-google-map" aria-label="Housing and nearby places map">
    <fieldset className="housing-map-layers" aria-describedby={legendId}><legend>Show on the map</legend>
      {(Object.keys(MAP_LAYER_LABELS) as HousingMapLayer[]).map(layer => <label key={layer}>
        <input type="checkbox" checked={layers.includes(layer)} onChange={() => toggleLayer(layer)}/>
        <span className="housing-map-layer-symbol" style={{ backgroundColor: layerStyles[layer].color }} aria-hidden="true">{layerStyles[layer].glyph}</span>{MAP_LAYER_LABELS[layer]}
      </label>)}
    </fieldset>
    <p id={legendId} className="housing-map-help">Toggle places to explore the area. A researched starting list, not live search results.{searchCenter && ` ZIP marker: approximate Census reference point for ${searchCenter.zip}.`}</p>
    {hasError ? <MapUnavailable/> : <div className="housing-map-canvas-wrap">
      {!tilesLoaded && <div className="housing-map-loading" role="status">{slow ? <><strong>The map is taking longer than expected.</strong><button type="button" onClick={() => window.location.reload()}>Reload to retry</button></> : 'Loading map…'}</div>}
      <Map id={MAP_ID} mapId={mapId} className="housing-map-canvas" reuseMaps defaultCenter={position(searchCenter ?? CAMPUS_REFERENCE)} defaultZoom={12} gestureHandling="cooperative" keyboardShortcuts mapTypeControl={false} streetViewControl={false} fullscreenControl zoomControl clickableIcons={false} onTilesLoaded={() => { setTilesLoaded(true); setSlow(false); }}>
        <MapCamera points={points} boundsKey={boundsKey} selected={activeLocation || (layers.includes('apartments') ? selected : undefined)} selectionRevision={selectionRevision}/>
        {searchCenter && <AdvancedMarker position={position(searchCenter)} title={`ZIP ${searchCenter.zip} approximate search reference point`} zIndex={31}><Pin background="#805e16" borderColor="#ffffff" glyphColor="#ffffff" glyphText="ZIP"/></AdvancedMarker>}
        {plottedApartments.map(apartment => <AdvancedMarker key={apartment.id} position={position(apartment)} title={`${apartment.name} — view apartment`} onClick={() => selectApartment(apartment)} zIndex={selectedId === apartment.id ? 20 : 1}>
          <Pin background={selectedId === apartment.id ? '#352042' : layerStyles.apartments.color} borderColor="#ffffff" glyphColor="#ffffff" glyphText="H" scale={selectedId === apartment.id ? 1.3 : 1}/>
        </AdvancedMarker>)}
        {locations.map(location => <AdvancedMarker key={location.id} position={position(location)} title={`${location.name} — ${MAP_LAYER_LABELS[location.layer]}`} onClick={() => setActiveLocation(location)} zIndex={location.id === campus.id ? 30 : activeLocation?.id === location.id ? 20 : 2}>
          <Pin background={layerStyles[location.layer].color} borderColor={location.id === campus.id ? '#edc65f' : '#ffffff'} glyphColor="#ffffff" glyphText={location.id === campus.id ? 'UTD' : layerStyles[location.layer].glyph} scale={location.id === campus.id ? 1.5 : 1}/>
        </AdvancedMarker>)}
        {showApartment && <InfoWindow key={`home-${selected.id}`} position={position(selected)} pixelOffset={popupOffset} maxWidth={310} shouldFocus onClose={() => setDismissedApartment(selected.id)}><ApartmentPopup apartment={selected} onViewDetails={onViewDetails}/></InfoWindow>}
        {activeLocation && <InfoWindow key={activeLocation.id} position={position(activeLocation)} pixelOffset={popupOffset} maxWidth={310} shouldFocus onClose={() => setActiveLocation(current => current?.id === activeLocation.id ? null : current)}><LocationPopup location={activeLocation}/></InfoWindow>}
      </Map>
    </div>}
    <p className="housing-map-footer">Pins use reviewed public coordinates; some are approximate. Open a pin for place information and its review date. <a href="https://maps.google.com/help/terms_maps/" target="_blank" rel="noopener noreferrer">Google Maps terms ↗</a> · <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google privacy ↗</a></p>
  </section>;
}

export default function GoogleHousingMap(props: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim();
  const [authHookReady, setAuthHookReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => setFailed(true), []);
  useEffect(() => {
    // Google documents this global callback for authorization failures. Install it
    // before mounting APIProvider so even an immediate rejection is handled.
    const mapWindow = window as AuthWindow;
    const previous = mapWindow.gm_authFailure;
    const authFailure = () => { setFailed(true); previous?.(); };
    mapWindow.gm_authFailure = authFailure;
    setAuthHookReady(true);
    return () => { if (mapWindow.gm_authFailure === authFailure) mapWindow.gm_authFailure = previous; };
  }, []);
  if (!apiKey || !mapId || mapId === 'DEMO_MAP_ID') return <MapUnavailable configuration/>;
  if (!authHookReady) return <div className="housing-map-unavailable" role="status">Preparing map…</div>;
  return <MapErrorBoundary><GoogleMapsProvider onError={onError}>
    <MapContent {...props} mapId={mapId} failed={failed}/>
  </GoogleMapsProvider></MapErrorBoundary>;
}
