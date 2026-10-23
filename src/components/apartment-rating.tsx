'use client';

import { APARTMENT_DISCOVERY_DETAILS } from '@/data/apartment-discovery-details';
import { useApartmentReviews } from './apartment-reviews';

export function ApartmentRating({ apartmentId }: { apartmentId: string }) {
  const open = useApartmentReviews();
  const links = APARTMENT_DISCOVERY_DETAILS[apartmentId]?.reviewLinks ?? [];
  return <div className="apartment-rating">
    {open ? <button type="button" className="apartment-reviews-button" onClick={() => open(apartmentId)}>Ratings & reviews <span aria-hidden="true">→</span></button> : links.map(link => <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>)}
    <small>Read Google reviews for this community.</small>
  </div>;
}
