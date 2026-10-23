'use client';

import { useId, useRef, useState } from 'react';
import { clearComparisonStorage } from '@/domain/apartment-discovery';

export function DeleteAccount({ disabled = false, comparisonKey = null }: { disabled?: boolean; comparisonKey?: string | null }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const keepAccount = useRef<HTMLButtonElement>(null);
  const pending = useRef(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function clearForm() {
    setPassword('');
    setConfirmation('');
    setError('');
  }

  function openDialog() {
    if (disabled || pending.current) return;
    clearForm();
    dialog.current?.showModal();
    keepAccount.current?.focus();
  }

  function closeDialog() {
    if (pending.current) return;
    clearForm();
    dialog.current?.close();
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || pending.current || confirmation !== 'DELETE' || !password) return;
    pending.current = true;
    setBusy(true);
    setError('');
    let deleted = false;

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, confirmation }),
      });
      setPassword('');
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(typeof result?.error === 'string'
          ? result.error
          : 'We couldn’t delete your account. Please try again.');
      }
      deleted = true;
      try { clearComparisonStorage(sessionStorage, comparisonKey); } catch { /* Storage may be blocked. */ }
      window.location.replace('/login?deleted=success');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'We couldn’t delete your account. Please try again.');
    } finally {
      setPassword('');
      if (!deleted) {
        pending.current = false;
        setBusy(false);
      }
    }
  }

  return (
    <section className="card delete-account" aria-labelledby={`${id}-card-title`}>
      <h2 id={`${id}-card-title`}>Delete account</h2>
      <p>Permanently remove your CampusBridge login, profile, answers, university verification, and saved progress. This can’t be undone.</p>
      <p className="form-hint">Copies in provider backups or security logs may remain for their retention periods.</p>
      <button type="button" className="button delete-account-button" disabled={disabled || busy} onClick={openDialog}>Delete account</button>

      <dialog
        ref={dialog}
        className="modal card delete-account-dialog"
        aria-labelledby={`${id}-dialog-title`}
        aria-describedby={`${id}-description`}
        onCancel={event => { event.preventDefault(); closeDialog(); }}
        onClose={() => { if (!pending.current) clearForm(); }}
      >
        <h2 id={`${id}-dialog-title`}>Delete your account?</h2>
        <p id={`${id}-description`}>Your login, profile, answers, university verification, and saved progress will be permanently deleted. You won’t be able to recover them.</p>
        <form onSubmit={submit} aria-busy={busy}>
          {error && <p className="notice error" role="alert">{error}</p>}
          <div className="form-field">
            <label htmlFor={`${id}-password`}>Current password</label>
            <input
              id={`${id}-password`}
              name="current-password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
              disabled={disabled || busy}
              value={password}
              onChange={event => setPassword(event.target.value)}
            />
          </div>
          <div className="form-field">
            <label htmlFor={`${id}-confirmation`}>Type DELETE to confirm</label>
            <input
              id={`${id}-confirmation`}
              name="delete-confirmation"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              required
              maxLength={6}
              disabled={disabled || busy}
              value={confirmation}
              onChange={event => setConfirmation(event.target.value)}
            />
          </div>
          {busy && <p className="delete-account-status" role="status">Deleting your account…</p>}
          <div className="form-actions delete-account-actions">
            <button ref={keepAccount} type="button" className="button button-outline" disabled={busy} onClick={closeDialog}>Keep my account</button>
            <button type="submit" className="button delete-account-button" disabled={disabled || busy || confirmation !== 'DELETE' || !password}>{busy ? 'Deleting…' : 'Delete my account'}</button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
