import Link from 'next/link';
export function Brand({ light = false }: { light?: boolean }) {
  return <Link href="/" className={`brand ${light ? 'brand-light' : ''}`} aria-label="CampusBridge home"><span className="brand-mark"><svg aria-hidden="true" width="32" height="32" viewBox="0 0 32 32" fill="none"><path d="M8 23V9m16 14V9M8 15c4-8 12-8 16 0M8 22c4-8 12-8 16 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg></span>Campus<span className="brand-accent">Bridge</span></Link>;
}
export function PublicHeader() {
  return <header className="public-header"><Brand/><nav aria-label="Main navigation"><Link className="text-link about-link" href="/about">How it works</Link><Link className="text-link public-privacy-link" href="/privacy">Privacy</Link><Link className="text-link" href="/login">Log in</Link><Link className="button button-small" href="/signup">Create account</Link></nav></header>;
}
export function Footer() {
  return <footer className="footer"><span>CampusBridge · A student project by Product Alchemy</span><span>Independent of UT Dallas. <Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/about">About</Link></span></footer>;
}
