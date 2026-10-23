'use client';
import Link from 'next/link';
export default function ErrorPage({reset}:{reset:()=>void}){return <main id="main" className="text-page"><h1>We couldn’t load this page.</h1><p>Please try again. Your previously saved progress has not been changed.</p><button className="button" onClick={reset}>Try again</button> <Link className="button button-outline" href="/">Return home</Link></main>;}
