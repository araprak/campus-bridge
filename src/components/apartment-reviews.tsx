'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { APARTMENTS } from '@/data/local-options';

const ReviewDialog = dynamic(() => import('./apartment-review-dialog'), { ssr: false });
const ReviewsContext = createContext<((apartmentId: string) => void) | null>(null);

/** One dialog for the whole directory, including map info-window portals. */
export function ApartmentReviewsProvider({ children }: { children: ReactNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const open = useCallback((id: string) => setSelectedId(id), []);
  const close = useCallback(() => setSelectedId(null), []);
  const apartment = useMemo(() => APARTMENTS.find(item => item.id === selectedId), [selectedId]);
  return <ReviewsContext.Provider value={open}>
    {children}
    {apartment && <ReviewDialog key={apartment.id} apartment={apartment} onClose={close}/>}
  </ReviewsContext.Provider>;
}

export function useApartmentReviews() { return useContext(ReviewsContext); }
