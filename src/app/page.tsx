import Link from 'next/link';
import { ArrowRight, Check, BusFront, House, Compass, CircleCheck, ListChecks, ShieldCheck, Lightbulb } from 'lucide-react';
import { PublicHeader, Footer } from '@/components/brand';
import { requestSiteGroup } from '@/lib/site-group';
import { GROUPS } from '@/domain/site-groups';
import groupStyles from './group-home.module.css';

export default async function Home() {
  const group = await requestSiteGroup();
  return <>
    <PublicHeader/>
    <main id="main">
      {group && <section className={`page-width ${groupStyles.intro}`} aria-labelledby="group-title">
        <p className="eyebrow">CAMPUSBRIDGE · {GROUPS[group].name.toUpperCase()}</p>
        <h1 id="group-title">{GROUPS[group].title}</h1>
        <p>{GROUPS[group].description}</p>
        <ul>{GROUPS[group].features.map(feature => <li key={feature}>{feature}</li>)}</ul>
        <Link className="button" href="/group-tools">Open {GROUPS[group].name} tools <ArrowRight size={17}/></Link>
        <p className="small muted">Use your existing CampusBridge account. Your plan is shared across the group sites; sign in on each site separately. Password recovery opens the main CampusBridge site.</p>
      </section>}
      <div className="landing-hero">
        <section className="hero page-width">
          <div className="hero-copy">
            <p className="eyebrow"><span/> BUILT FOR YOUR NEXT CHAPTER</p>
            {group?<h2>Arrive ready.<br/><em>Make it yours.</em></h2>:<h1>Arrive ready.<br/><em>Make it yours.</em></h1>}
            <p className="hero-description">Find a home. Set up the essentials. Get to know UT Dallas—all in one personal plan.</p>
            <div className="hero-actions">
              <Link className="button" href="/signup">Build my plan <ArrowRight size={18}/></Link>
              <Link className="button button-outline" href="/how-it-works">How it works</Link>
            </div>
            <p className="small muted">Start with your personal email. Built for UT Dallas today.</p>
            <div className="campus-affiliation"><img src="/campus-utd-wordmark.svg" alt="The University of Texas at Dallas" width="286" height="49"/><span>Independent student guide.<br/>Not affiliated with or endorsed by UT Dallas.</span></div><div className="hero-proof">
              <span><Check size={16}/> Personalized to your situation</span>
              <span><Check size={16}/> Trusted places to turn</span>
            </div>
          </div>
          <figure className="hero-photo"><img src="/campus-utd-mall.jpg" alt="Trees and open walkways on the UT Dallas campus" width="1280" height="960"/><span className="hero-photo-label">Your place to begin.</span><figcaption>UT Dallas campus · Stan9999, 2010 · <a href="https://commons.wikimedia.org/wiki/File:UT_Dallas_main_mall.JPG" target="_blank" rel="noopener noreferrer">Public-domain photo</a></figcaption></figure>
        </section>
      </div>
      <section className="journey-strip arrival-journey">
        <div className="page-width journey-inner">
          <span>One personal plan.<br/><strong>From preparing to belonging.</strong></span>
          <div><b>01</b><span>Before arrival<small>Prepare your essentials</small></span></div>
          <div><b>02</b><span>Your first week<small>Find your footing</small></span></div>
          <div><b>03</b><span>Your first month<small>Build your routine</small></span></div>
        </div>
      </section>
      <section className="how-section page-width">
        <div className="section-intro">
          <p className="eyebrow">LESS SEARCHING. MORE SETTLING IN.</p>
          <h2>A plan built around<br/>your starting point.</h2>
          <p>You don’t have to figure out everything today. CampusBridge helps you find the right step and the right support.</p>
          <Link className="inline-link" href="/how-it-works">How CampusBridge works <ArrowRight size={18}/></Link>
        </div>
        <div className="benefit-grid">{[
          [Compass, 'Tell us your situation', 'A few questions about your arrival, home, and how you plan to get around.'],
          [ListChecks, 'Choose your starting point', 'The areas you want help with move to the front of your plan.'],
          [ShieldCheck, 'Find trusted help', 'Clear routes to official UTD resources, local services, and people.'],
          [CircleCheck, 'Keep moving forward', 'Complete a step, save your progress, and return when you’re ready.'],
        ].map(([Icon, title, body]) => {
          const I = Icon as typeof Compass;
          return <article key={String(title)}><I size={25}/><h3>{String(title)}</h3><p>{String(body)}</p></article>;
        })}</div>
      </section>
      <section className="landing-close page-width">
        <div><p className="eyebrow">YOUR FIRST STEP STARTS HERE</p><h2>You bring your situation.<br/>We’ll help you find your way.</h2></div>
        <Link className="button button-light" href="/signup">Create my account <ArrowRight size={18}/></Link>
      </section>
    </main>
    <Footer/>
  </>;
}
