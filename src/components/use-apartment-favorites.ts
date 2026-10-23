'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeFavoriteIds } from '@/domain/apartment-favorites';

export function useApartmentFavorites(accountKey: string | null) {
  const enabled = !!accountKey?.startsWith('campusbridge.housing.compare.v1.account.');
  const [savedState, setSavedState] = useState<{ owner: string | null; ids: string[] }>({ owner: accountKey, ids: [] });
  const ids = savedState.owner === accountKey ? savedState.ids : [];
  const [loading, setLoading] = useState(enabled);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const keyRef = useRef(accountKey);
  const mutation = useRef(false);
  const requestRevision = useRef(0);
  keyRef.current = accountKey;
  const refresh = useCallback(async () => {
    if (!enabled || mutation.current) return;
    const revision = ++requestRevision.current;
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/favorites', { cache: 'no-store' });
      const body = await response.json();
      if (keyRef.current !== accountKey || revision !== requestRevision.current) return;
      if (!response.ok) throw new Error(body.error || 'Saved apartments could not be loaded.');
      if (!Array.isArray(body.ids)) throw new Error('Saved apartments could not be loaded. Please try again.');
      setSavedState({ owner: accountKey, ids: normalizeFavoriteIds(body.ids) });
    } catch (cause) { if (keyRef.current === accountKey && revision === requestRevision.current) setError(cause instanceof Error ? cause.message : 'Saved apartments could not be loaded.'); }
    finally { if (keyRef.current === accountKey && revision === requestRevision.current) setLoading(false); }
  }, [accountKey, enabled]);
  useEffect(() => {
    setSavedState({ owner: accountKey, ids: [] }); setError(''); setNotice(''); setBusy(false); setLoading(enabled); mutation.current = false;
    void refresh();
    const onFocus = () => { void refresh(); };
    window.addEventListener('focus', onFocus);
    return () => { ++requestRevision.current; window.removeEventListener('focus', onFocus); };
  }, [refresh, enabled]);
  async function toggle(id: string) {
    if (!enabled) { setNotice('Log in to save apartments across visits and devices.'); return; }
    if (loading || mutation.current) return;
    const saved = !ids.includes(id);
    mutation.current = true; setBusy(true); setError(''); setNotice(''); const revision = ++requestRevision.current;
    try {
      const response = await fetch('/api/favorites', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ communityId: id, saved }) });
      const body = await response.json();
      if (keyRef.current !== accountKey || revision !== requestRevision.current) return;
      if (!response.ok) throw new Error(body.error || 'Saved apartments were not changed.');
      setSavedState(current => ({ owner: accountKey, ids: saved ? normalizeFavoriteIds([...(current.owner === accountKey ? current.ids : []), id]) : (current.owner === accountKey ? current.ids : []).filter(value => value !== id) }));
      setNotice(saved ? 'Apartment saved to your account.' : 'Apartment removed from your saved list.');
    } catch (cause) { if (keyRef.current === accountKey && revision === requestRevision.current) setError(cause instanceof Error ? cause.message : 'Saved apartments were not changed.'); }
    finally { if (keyRef.current === accountKey && revision === requestRevision.current) { mutation.current = false; setBusy(false); } }
  }
  return { ids, loading, busy, error, notice, enabled, toggle, refresh };
}
