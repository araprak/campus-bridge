import Link from 'next/link';
import { PublicHeader, Footer } from '@/components/brand';
export default function NotFound(){return <><PublicHeader/><main id="main" className="text-page"><p className="eyebrow">LET’S FIND YOUR WAY BACK</p><h1>This page isn’t here.</h1><p>The link may have changed. Your plan is a good place to start.</p><Link className="button" href="/">Back to CampusBridge</Link></main><Footer/></>;}
