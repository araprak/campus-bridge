'use client';

import { APIProvider, type APIProviderProps } from '@vis.gl/react-google-maps';

const libraries = ['marker'];

/** Identical loader settings let maps and on-demand reviews share Google's SDK. */
export function GoogleMapsProvider({ children, onError }: Pick<APIProviderProps, 'children' | 'onError'>) {
  return <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? ''} libraries={libraries} version="quarterly" region="US" language="en" authReferrerPolicy="origin" solutionChannel="" disableUsageAttribution onError={onError}>
    {children}
  </APIProvider>;
}
