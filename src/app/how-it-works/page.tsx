import Link from 'next/link';
import { PublicHeader, Footer } from '@/components/brand';

export const metadata = { title: 'How it works' };

export default function About() {
  return <>
    <PublicHeader/>
    <main id="main" className="text-page">
      <p className="eyebrow">A CLEARER START AT UT DALLAS</p>
      <h1>Your situation.<br/>Your next step.</h1>
      <p>Moving to a new country and university comes with a lot of questions at once. CampusBridge helps international UTD students prepare before arrival and get settled during their first 30 days, especially when living independently or off campus.</p>
      <h2>1. Tell us where you’re starting</h2>
      <p>A short setup asks about your arrival, home, transportation, and what you would like help with. Choose as many areas as you need, or let us suggest a starting order. You can update your answers at any time.</p>
      <h2>2. See what matters to you first</h2>
      <p>Your arrival date sets the context for your plan, and your selected priorities move to the front. Without a preference, an off-campus plan begins with a place to live and home services, followed by getting around, campus support, and daily essentials.</p>
      <p>You don’t need to understand electricity or internet before starting. The plan explains those services and helps you confirm what your housing includes. As you learn more, update your answers to keep your tasks relevant.</p>
      <h2>3. Explore your options</h2>
      <p>Compare a starter list of nearby apartment communities and follow their official links to check current availability. You can optionally save a community or ZIP code to make home-service guidance more relevant. Provider suggestions are starting points for comparison, not endorsements or live price quotes.</p>
      <p>Tasks also connect you with official UTD pages, government resources, and the people who can help. Always check the source for current requirements, deadlines, availability, and costs.</p>
      <h2>4. Pick up where you left off</h2>
      <p>Create an account to build your plan. Mark tasks complete, undo them, and pick up where you left off across devices.</p>
      <h2>Made for a focused beginning</h2>
      <p>CampusBridge is an independent student project by Product Alchemy for MIS 6393 at UT Dallas. It is not an official university service or an endorsement of any provider. UTD email verification confirms mailbox access, not current enrollment.</p>
      <p>We provide navigation, not legal, immigration, medical, tax, or financial advice. CampusBridge does not replace official systems or human support. For questions about a requirement or your circumstances, contact the relevant office directly.</p>
      <div className="about-actions">
        <Link className="button" href="/signup">Create my account</Link>
        <Link href="/privacy">Read our privacy notice</Link>
      </div>
    </main>
    <Footer/>
  </>;
}
