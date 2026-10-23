'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { APILoadingStatus, useApiLoadingStatus, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { ApartmentOption } from '@/data/local-options';
import { APARTMENT_DISCOVERY_DETAILS } from '@/data/apartment-discovery-details';
import { APARTMENT_GOOGLE_PLACES } from '@/data/apartment-google-places';
import { mountPlaceReviews, type ReviewWidgetState } from '@/lib/google-place-reviews';
import { GoogleMapsProvider } from './google-maps-provider';

function GoogleReviewWidget({ apartment, retry, onRetry, loaderFailed }: { apartment: ApartmentOption; retry: number; onRetry: () => void; loaderFailed: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const library = useMapsLibrary('places');
  const apiStatus = useApiLoadingStatus();
  const placeId = APARTMENT_GOOGLE_PLACES[apartment.id]?.placeId;
  const [state, setState] = useState<ReviewWidgetState>({ phase: placeId ? 'details' : 'search', status: 'loading' });
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (library) return;
    const timeout = window.setTimeout(() => setSlow(true), 20_000);
    return () => window.clearTimeout(timeout);
  }, [library, retry]);
  useEffect(() => {
    if (!library || !host.current) return;
    return mountPlaceReviews({ host: host.current, library, query: `${apartment.name}, ${apartment.address}`, placeId, onState: setState });
  }, [library, apartment.name, apartment.address, placeId, retry]);

  const failed = loaderFailed || apiStatus === APILoadingStatus.FAILED || apiStatus === APILoadingStatus.AUTH_FAILURE || state.status === 'error';
  const timedOut = !library && slow || state.status === 'timeout';
  const empty = state.status === 'empty';
  const loading = !failed && !timedOut && state.status === 'loading';
  return <>
    {state.phase === 'search' && !failed && !timedOut && !empty && <p className="apartment-review-match-help">Choose the listing with this community’s name and address to see its reviews.</p>}
    {loading && <p role="status" className="apartment-review-status">{state.phase === 'search' ? 'Finding the Google listing…' : 'Loading Google reviews…'}</p>}
    {(failed || timedOut || empty) && <div role="status" className="apartment-review-status">
      <strong>{failed ? 'Google reviews could not load.' : timedOut ? 'Google is taking longer than expected.' : 'No matching Google listing was returned.'}</strong>
      <p>{empty ? 'Check the community’s listing on Google Maps below.' : 'Try again, or open the community on Google Maps below.'}</p>
      <button type="button" className="button button-outline" onClick={onRetry}>Try again</button>
    </div>}
    <div ref={host} className="apartment-review-widget" hidden={failed || timedOut || empty}/>
    {state.status === 'ready' && state.phase === 'details' && <p className="apartment-review-note">Reviews are supplied by Google. Google may show a selection of reviews; open the full listing below for more.</p>}
  </>;
}

export default function ApartmentReviewDialog({ apartment, onClose }: { apartment: ApartmentOption; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const address = useId();
  const [retry, setRetry] = useState(0);
  const [loaderFailed, setLoaderFailed] = useState(false);
  const onError = useCallback(() => setLoaderFailed(true), []);
  const configured = process.env.NEXT_PUBLIC_GOOGLE_REVIEWS_ENABLED === 'true' && !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  const mapped = APARTMENT_GOOGLE_PLACES[apartment.id];
  const reviewLink = mapped?.placeId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${apartment.name}, ${apartment.address}`)}&query_place_id=${encodeURIComponent(mapped.placeId)}`
    : APARTMENT_DISCOVERY_DETAILS[apartment.id]?.reviewLinks.find(link => link.platform === 'Google Maps')?.url
      ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${apartment.name}, ${apartment.address}`)}`;

  useEffect(() => {
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    element?.showModal();
    return () => { element?.close(); if (trigger?.isConnected) trigger.focus(); };
  }, []);

  return createPortal(<dialog ref={dialog} className="apartment-review-dialog" aria-labelledby={heading} aria-describedby={address} onCancel={event => { event.preventDefault(); onClose(); }}>
    <header><div><p className="eyebrow">RATINGS & REVIEWS</p><h2 id={heading}>{apartment.name}</h2><p id={address}>{apartment.address}</p></div><button type="button" autoFocus className="discovery-close" aria-label="Close reviews" onClick={onClose}><X size={21}/></button></header>
    <div className="apartment-review-body">
      {configured ? <GoogleMapsProvider onError={onError}><GoogleReviewWidget key={retry} apartment={apartment} retry={retry} loaderFailed={loaderFailed} onRetry={() => { setLoaderFailed(false); setRetry(value => value + 1); }}/></GoogleMapsProvider>
        : <div role="status" className="apartment-review-status"><strong>In-site Google reviews are not connected yet.</strong><p>You can read this community’s reviews on Google Maps.</p></div>}
      <a className="apartment-review-external" href={reviewLink} target="_blank" rel="noopener noreferrer">Open full listing & reviews on Google Maps ↗</a>
    </div>
  </dialog>, document.body);
}
