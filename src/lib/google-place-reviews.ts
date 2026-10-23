/// <reference types="google.maps" />

/**
 * Own only widget lifetime and place identity. Google's widgets render ratings,
 * reviews, and attribution directly; we never extract or store their content.
 */
export type ReviewWidgetState = {
  phase: 'search' | 'details';
  status: 'loading' | 'ready' | 'empty' | 'error' | 'timeout';
};

export type ReviewWidgetLibrary = Pick<google.maps.PlacesLibrary,
  'PlaceSearchElement' | 'PlaceTextSearchRequestElement' | 'PlaceDetailsElement' |
  'PlaceDetailsPlaceRequestElement' | 'PlaceContentConfigElement' |
  'PlaceAddressElement' | 'PlaceRatingElement' | 'PlaceReviewsElement'>;

export function mountPlaceReviews({ host, library, query, placeId, onState, timeoutMs = 20_000 }: {
  host: Pick<HTMLElement, 'replaceChildren'>;
  library: ReviewWidgetLibrary;
  query: string;
  placeId?: string;
  onState: (state: ReviewWidgetState) => void;
  timeoutMs?: number;
}) {
  let disposed = false;
  let currentCleanup = () => {};
  let revision = 0;

  function content(withReviews: boolean) {
    const config = new library.PlaceContentConfigElement();
    config.append(new library.PlaceAddressElement(), new library.PlaceRatingElement());
    if (withReviews) config.append(new library.PlaceReviewsElement());
    return config;
  }

  function attach(widget: google.maps.places.PlaceDetailsElement | google.maps.places.PlaceSearchElement, phase: ReviewWidgetState['phase'], hasPlaces: () => boolean, select?: EventListener) {
    currentCleanup();
    const instance = ++revision;
    let settled = false;
    const emit = (status: ReviewWidgetState['status']) => {
      if (!disposed && instance === revision) onState({ phase, status });
    };
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      emit('timeout');
    }, timeoutMs);
    const load = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      emit(hasPlaces() ? 'ready' : 'empty');
    };
    const error = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      emit('error');
    };
    widget.addEventListener('gmp-load', load);
    widget.addEventListener('gmp-error', error);
    if (select) widget.addEventListener('gmp-select', select);
    currentCleanup = () => {
      settled = true;
      clearTimeout(timeout);
      widget.removeEventListener('gmp-load', load);
      widget.removeEventListener('gmp-error', error);
      if (select) widget.removeEventListener('gmp-select', select);
    };
    emit('loading');
    host.replaceChildren(widget);
  }

  function showDetails(id: string) {
    if (disposed) return;
    const details = new library.PlaceDetailsElement();
    details.append(new library.PlaceDetailsPlaceRequestElement({ place: id }), content(true));
    attach(details, 'details', () => !!details.place?.id);
  }

  try {
    if (placeId) {
      showDetails(placeId);
    } else {
      const search = new library.PlaceSearchElement({ selectable: true, truncationPreferred: false });
      search.append(new library.PlaceTextSearchRequestElement({ textQuery: query, maxResultCount: 3 }), content(false));
      const select: EventListener = event => {
        if (disposed) return;
        const id = (event as google.maps.places.PlaceSelectEvent).place?.id;
        // A search result is never silently treated as the catalog community.
        // The visitor must choose a displayed match; only its ID is passed on.
        if (id && search.places.some(place => place.id === id)) showDetails(id);
      };
      attach(search, 'search', () => search.places.length > 0, select);
    }
  } catch {
    currentCleanup();
    host.replaceChildren();
    onState({ phase: placeId ? 'details' : 'search', status: 'error' });
  }

  return () => {
    disposed = true;
    revision += 1;
    currentCleanup();
    host.replaceChildren();
  };
}
