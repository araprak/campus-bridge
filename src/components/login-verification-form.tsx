'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, MailCheck } from 'lucide-react';

export function LoginVerificationForm({ email, remembered, initiallySent = false, initiallyVerified = false }: {
  email: string;
  remembered: boolean;
  initiallySent?: boolean;
  initiallyVerified?: boolean;
}) {
  const [codeAccepted, setCodeAccepted] = useState(initiallyVerified);
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(initiallySent);
  const [message, setMessage] = useState(initiallySent ? 'Your confirmation code is on its way. Check your inbox and spam folder.' : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'send' | 'redeem' | 'signout' | null>(null);
  const [remaining, setRemaining] = useState(initiallySent ? 60 : 0);
  const [cooldownUntil, setCooldownUntil] = useState(() => initiallySent ? Date.now() + 60_000 : 0);
  const submitting = useRef(false);
  const codeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!cooldownUntil) return;
    const update = () => {
      const seconds = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) window.clearInterval(timer);
    };
    const timer = window.setInterval(update, 1000);
    update();
    return () => window.clearInterval(timer);
  }, [cooldownUntil]);

  function startCooldown(seconds: number) {
    const duration = Math.max(1, Math.min(86_400, Math.ceil(seconds)));
    setRemaining(duration);
    setCooldownUntil(Date.now() + duration * 1000);
  }

  function redirectTo(path: unknown) {
    if (typeof path !== 'string') throw new Error('We could not open your plan. Please try again.');
    const destination = new URL(path, window.location.origin);
    if (destination.origin !== window.location.origin || !['/dashboard', '/onboarding', '/verify-utd', '/reset-password', '/login'].includes(destination.pathname)) {
      throw new Error('We could not open your plan. Please try again.');
    }
    window.location.assign(`${destination.pathname}${destination.search}`);
  }

  async function submit(action: 'send' | 'redeem') {
    if (submitting.current || (action === 'send' && remaining > 0)) return;
    if (action === 'redeem' && !codeAccepted && !/^\d{6}$/.test(code)) {
      setError('Enter the six-digit code from your confirmation email.');
      codeInput.current?.focus();
      return;
    }
    submitting.current = true;
    setBusy(action);
    setError('');
    setMessage('');
    if (action === 'send') setCode('');
    try {
      const response = await fetch('/api/auth/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, flow: 'signup', ...(action === 'redeem' ? { code } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.codeAccepted === true) setCodeAccepted(true);
        if (response.status === 429 || Number(data.retryAfter) > 0) {
          const retryAfter = Number(data.retryAfter ?? response.headers.get('Retry-After'));
          startCooldown(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60);
        }
        if (response.status === 401 && data.redirect === '/login') { window.location.assign('/login'); return; }
        throw new Error(data.error || 'Please try again.');
      }
      if (data.redirect) {
        redirectTo(data.redirect);
        return;
      }
      if (action === 'send') {
        setSent(true);
        startCooldown(60);
      }
      setMessage(data.message || (action === 'send' ? 'A new confirmation code is on its way. Check your inbox and spam folder.' : 'Email confirmed.'));
    } catch (failure) {
      setCode('');
      setError(failure instanceof Error ? failure.message : 'Please try again.');
    } finally {
      submitting.current = false;
      setBusy(null);
    }
  }

  async function signOut() {
    if (submitting.current) return;
    submitting.current = true;
    setBusy('signout');
    setError('');
    setMessage('');
    setCode('');
    try {
      const response = await fetch('/api/auth/signout', { method: 'POST' });
      if (!response.ok) throw new Error('We could not sign you out. Please try again.');
      window.location.assign('/login');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Please try again.');
    } finally {
      submitting.current = false;
      setBusy(null);
    }
  }

  return <main id="main" className="auth-page login-verification">
    <MailCheck color="#1e7e83" size={32} aria-hidden="true"/>
    <h1>Confirm your email.</h1>
    <p className="muted">{sent ? 'Enter the six-digit code sent to' : 'Request a six-digit code at'} <strong className="login-email">{email}</strong>.</p>
    <p className="form-hint">Confirm your address once to create your account. After that, log in with your email and password.</p>
    <form className="auth-card" aria-busy={busy !== null} onSubmit={event => { event.preventDefault(); void submit('redeem'); }}>
      {error && <p className="notice error" role="alert">{error}</p>}
      {message && <p className="notice success" role="status">{message}</p>}
      {!codeAccepted && <div className="form-field">
        <label htmlFor="login-code">Six-digit confirmation code</label>
        <input ref={codeInput} id="login-code" name="code" type="text" inputMode="numeric"
          autoComplete="one-time-code" autoCapitalize="none" spellCheck={false}
          pattern="[0-9]{6}" minLength={6} maxLength={6} required value={code}
          aria-describedby="login-code-hint" disabled={busy !== null}
          onChange={event => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}/>
        <p id="login-code-hint" className="form-hint">Codes expire after 10 minutes. Each new code replaces the previous one.</p>
      </div>}
      <button className="button full-width" disabled={busy !== null || (!codeAccepted && code.length !== 6)}>
        {busy === 'redeem' ? codeAccepted ? 'Opening your account…' : 'Checking code…' : codeAccepted ? 'Continue to my account' : 'Confirm and continue'}<ArrowRight size={17}/>
      </button>
      {!codeAccepted && <button className="button button-outline full-width login-code-send" type="button"
        disabled={busy !== null || remaining > 0} onClick={() => void submit('send')}>
        {busy === 'send' ? 'Sending code…' : remaining > 0 ? `Send a new code in ${remaining}s` : sent ? 'Send a new code' : 'Send code'}
      </button>}
      {remembered && <p className="form-hint login-remembered">After verification, this device can stay signed in for up to 30 days. You can sign out at any time.</p>}
    </form>
    <p className="form-footer"><button className="auth-text-button" type="button" disabled={busy !== null} onClick={() => void signOut()}>{busy === 'signout' ? 'Signing out…' : 'Use a different account'}</button></p>
  </main>;
}
