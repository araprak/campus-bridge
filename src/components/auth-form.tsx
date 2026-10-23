'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';

type AuthMode = 'signup' | 'signin' | 'recover' | 'reset';

export function AuthForm({ mode, enabled, notice, initialEmail = '', initialRemember = false }: {
  mode: AuthMode;
  enabled: boolean;
  notice?: string;
  initialEmail?: string;
  initialRemember?: boolean;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(initialRemember);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const titles = {
    signup: 'Your next chapter starts here.',
    signin: 'Welcome back.',
    recover: 'Let’s get you back in.',
    reset: 'Choose a new password.',
  };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current || !enabled) return;
    submitting.current = true;
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...(mode === 'signin' || mode === 'signup' ? { rememberMe } : {}) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Please try again.');
      if (data.redirect) {
        const destination = new URL(data.redirect, window.location.origin);
        if (destination.origin !== window.location.origin || !['/dashboard', '/verify-login', '/login'].includes(destination.pathname)) {
          throw new Error('We could not open the next step. Please try again.');
        }
        window.location.assign(`${destination.pathname}${destination.search}`);
      } else {
        setMessage(data.message || 'Your request was completed.');
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Please try again.');
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return <main id="main" className="auth-page">
    <p className="eyebrow">CAMPUSBRIDGE</p>
    <h1>{titles[mode]}</h1>
    <p className="muted">{mode === 'signup'
      ? 'Use your personal email and a password. We’ll email a one-time code to confirm your address.'
      : mode === 'signin'
        ? 'Enter your email and password to open your plan.'
        : mode === 'recover'
          ? 'Use the email you normally log in with.'
          : 'Use at least 12 characters to protect your account.'}</p>
    {!enabled && <div className="notice">
      <strong>Account access is temporarily unavailable.</strong>
      <p>Please try again shortly.</p>
    </div>}
    <form className="auth-card" onSubmit={submit} aria-busy={busy}>
      {notice && <p className="notice">{notice}</p>}
      {error && <p className="notice error" role="alert">{error}</p>}
      {message && <p className="notice success" role="status">{message}</p>}
      {mode !== 'reset' && <div className="form-field">
        <label htmlFor="email">{mode === 'signup' ? 'Your personal email' : 'Login email'}</label>
        <input id="email" name="email" type="email" required maxLength={254}
          autoComplete={mode === 'signin' ? 'username' : 'email'}
          autoCapitalize="none" spellCheck={false} value={email}
          onChange={event => setEmail(event.target.value)} disabled={!enabled || busy}/>
      </div>}
      {mode === 'signup' && <p className="form-hint">Use an address you can keep after graduation. UTD email verification is optional in Campus Support.</p>}
      {mode !== 'recover' && <div className="form-field">
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" required
          minLength={mode === 'signin' ? 1 : 12} maxLength={128}
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          value={password} onChange={event => setPassword(event.target.value)} disabled={!enabled || busy}/>
        {mode === 'signup' && <p className="form-hint">At least 12 characters. A longer passphrase works well.</p>}
      </div>}
      {(mode === 'signin' || mode === 'signup') && <div className="auth-remember">
        <label htmlFor="remember-me">
          <input id="remember-me" name="rememberMe" type="checkbox" checked={rememberMe}
            aria-describedby="remember-me-hint" onChange={event => setRememberMe(event.target.checked)}
            disabled={!enabled || busy}/>
          <span>Remember me on this device for 30 days</span>
        </label>
        <p id="remember-me-hint" className="form-hint">Use this only on your personal device. We’ll remember your login email and keep you signed in.</p>
      </div>}
      <button className="button full-width" disabled={busy || !enabled}>
        {busy ? 'Please wait…' : { signup: 'Create my account', signin: 'Log in', recover: 'Send reset link', reset: 'Update password' }[mode]}
        <ArrowRight size={17}/>
      </button>
      {mode === 'signup' && <p className="form-hint"><ShieldCheck size={13}/> By continuing, you acknowledge our <Link href="/privacy">privacy notice</Link>.</p>}
      {mode === 'signin' && <p className="form-footer"><Link href="/forgot-password">Forgot your password?</Link></p>}
    </form>
    <p className="form-footer">{mode === 'signup'
      ? <>Already have an account? <Link href="/login">Log in</Link></>
      : <>New to CampusBridge? <Link href="/signup">Create an account</Link></>}</p>
  </main>;
}
