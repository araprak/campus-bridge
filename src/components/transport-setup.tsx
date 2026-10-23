'use client';
import { useId, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BusFront, CarFront, ExternalLink } from 'lucide-react';
import type { Answers } from '@/lib/model';
import { effectiveHasCar } from '@/domain/plan';
import { LocationMapButton } from './location-map';
import { RENTAL_OPTIONS, RENTAL_COMPARISON_NOTE, TRANSPORT_OPTIONS_REVIEWED, TRANSIT_MODE_LABELS, wantsRentalGuide } from '@/data/transport-options';

export function RentalCarGuide({answers,editPath}:{answers:Answers;editPath:string}) {
  if (!wantsRentalGuide(answers)) return null;
  return <section className="local-options" aria-label="Rental car guide">
    <div className="local-heading"><span className="local-icon"><CarFront size={20}/></span><div><h3>Find a rental car for your plans</h3><p>Rental options around Richardson</p></div></div>
    <p className="local-disclosure">{RENTAL_COMPARISON_NOTE}</p>
    <div className="provider-list transporter-list">{RENTAL_OPTIONS.map(provider=><article key={provider.id}><div><h4>{provider.name}</h4><p>{provider.address}</p><p>{provider.description}</p><div className="campus-card-actions"><LocationMapButton name={provider.name} address={`${provider.address} · Approximate address pin`} latitude={provider.coordinates.latitude} longitude={provider.coordinates.longitude}/><a className="provider-source" href={provider.requirementsUrl} target="_blank" rel="noopener noreferrer">Check rental requirements <ExternalLink size={12}/></a></div></div><a href={provider.url} target="_blank" rel="noopener noreferrer" aria-label={`Explore ${provider.name}`}>Explore rentals <ExternalLink size={13}/></a></article>)}</div>
    <a className="official-compare" href="https://www.dfwairport.com/explore/transportation/rentalcars/" target="_blank" rel="noopener noreferrer"><span><strong>Picking up a car when you land?</strong><small>Compare options in DFW Airport’s official rental directory</small></span><ExternalLink size={18}/></a>
    <p className="form-hint">Local and airport pickup can have different hours, fees, and requirements. CampusBridge does not book a car or send your details. Sources reviewed {TRANSPORT_OPTIONS_REVIEWED}.</p>
    <p className="form-hint">Once you arrange a car, update your car access to Yes to see parking and nearby fuel options. You can change your transport plans later.</p>
    <Link className="inline-link" href={editPath}>Update my transport plans <ArrowRight size={14}/></Link>
  </section>;
}

export function TransitPassGuide() {
  return <section className="local-options" aria-label="DART and GoPass steps">
    <div className="local-heading"><span className="local-icon"><BusFront size={20}/></span><div><h3>Get ready for DART</h3><p>Check eligibility, request a pass, then confirm it is available.</p></div></div>
    <p className="local-disclosure">The Comet Cruiser does not need a pass or ID. Other DART buses and trains require the appropriate fare or pass.</p>
    <details className="campus-guide-more"><summary>Student GoPass steps</summary><ol><li>Check UTD’s requirements: a valid Comet Card, current enrollment and paid current-semester student fees.</li><li>Open UTD’s student request page and follow its current term dates. It currently lists the first day of the semester for summer/fall and the previous December for spring requests.</li><li>Use the mobile number associated with your GoPass app. UTD currently lists typical mobile processing of 3–5 business days after a request; this is not a guarantee or a tuition-payment countdown.</li><li>Check that your pass is available before travel. Arrange another valid fare while waiting. Contact UTD Parking & Transportation if your request needs help.</li></ol><p className="form-hint">UTD’s general eligibility page and request page describe timing differently. Follow the current request form and ask the office about your term if needed. CampusBridge does not determine eligibility or submit your details.</p></details>
    <div className="place-links"><a href="https://services.utdallas.edu/transit/dart/" target="_blank" rel="noopener noreferrer">UTD pass requirements <ExternalLink size={12}/></a><a href="https://services.utdallas.edu/services/tools/gopass/" target="_blank" rel="noopener noreferrer">Request a student GoPass <ExternalLink size={12}/></a><a href="https://services.utdallas.edu/transit/cruiser/" target="_blank" rel="noopener noreferrer">Comet Cruiser schedules <ExternalLink size={12}/></a></div><p className="form-hint">Official guidance reviewed October 15, 2026. The request page may require UTD VPN when used off campus.</p>
  </section>;
}

export function ParkingGuide({answers}: {answers: Answers}) {
  const [selectedUse, setUse] = useState<'commute' | 'resident' | 'occasional' | 'accessible' | null>(null);
  const use = selectedUse ?? (answers.housingLocation === 'on_campus' ? 'resident' : 'commute');
  const id = useId();
  if (!effectiveHasCar(answers)) return null;
  const guidance = {
    commute: 'Compare the student Green, Gold and Orange permit privileges against your class buildings and the official parking map. A permit does not guarantee a particular space. Commuter lots and garages prohibit overnight parking.',
    resident: 'Start with the permit for your actual university housing area. Resident and combination permits have different privileges; ask Housing or Parking before buying a commuter permit for overnight use.',
    occasional: 'Compare the current pay-by-space rate and vendor fee with a student permit for your expected visits. Check posted time limits, the space number and enforcement hours before leaving your car.',
    accessible: 'Review UTD’s accessible-parking requirements and accessible spaces map. A state-issued accessible credential and the applicable UTD permit are required; contact Parking for your situation.',
  }[use];
  return <section className="local-options" aria-label="Campus parking guide"><div className="local-heading"><span className="local-icon"><CarFront size={20}/></span><div><h3>Choose campus parking</h3><p>Match permit privileges to the way you will use campus.</p></div></div><div className="form-field"><label htmlFor={`${id}-use`}>How will you park?</label><select id={`${id}-use`} value={use} onChange={event => setUse(event.target.value as typeof use)}><option value="commute">Regular commute</option><option value="resident">University housing resident</option><option value="occasional">Occasional visit</option><option value="accessible">Accessible parking</option></select></div><p className="community-service-note">{guidance}</p><div className="place-links"><a href="https://services.utdallas.edu/transit/park/" target="_blank" rel="noopener noreferrer">Current student permits, prices & rules <ExternalLink size={12}/></a><a href="https://services.utdallas.edu/transit/" target="_blank" rel="noopener noreferrer">Parking map & official availability tools <ExternalLink size={12}/></a></div><p className="form-hint">Sources reviewed October 15, 2026. CampusBridge does not show live space availability or sell permits.</p></section>;
}

export function RidePreferenceGuide({answers}:{answers:Answers}) {
  if (answers.transport !== 'transit' || !answers.transitMode || answers.transitMode === 'undecided') return null;
  const mode=answers.transitMode;
  const guidance={
    campus_bus:'Start with the Comet Cruiser routes, stop direction, and service hours. Your community guide below can help you find a boarding point.',
    public_transit:'Plan the full DART journey, including transfers and the return trip. Check student transit-pass information before relying on a bus or train.',
    rideshare:'Check the pickup point and fare in your chosen rideshare or taxi service. Keep another way home for times prices or availability change.',
    carpool:'Agree on pickup, class times, shared costs, and a backup ride with the person driving. Your bus guide stays available for days the ride does not work out.',
    mixed:'Use the campus shuttle or DART for the trips that fit, and plan rides for the gaps. Check the return journey as well as the trip to campus.',
  }[mode];
  const links = mode==='campus_bus'
    ? [{label:'Comet Cruiser routes and schedules',url:'https://services.utdallas.edu/transit/cruiser/'}]
    : mode==='public_transit'
      ? [{label:'Plan a DART trip',url:'https://www.dart.org/trip/trip-planner/trip-planner-map'},{label:'UTD student transit-pass information',url:'https://services.utdallas.edu/services/tools/gopass/'}]
      : mode==='rideshare'
        ? [{label:'Uber in Richardson',url:'https://www.uber.com/global/en/r/cities/richardson-tx-us/'},{label:'Lyft in Dallas–Fort Worth',url:'https://www.lyft.com/rider/cities/dallas-fort-worth-tx'}]
        : [{label:'Comet Cruiser routes and schedules',url:'https://services.utdallas.edu/transit/cruiser/'},{label:'Plan a DART trip',url:'https://www.dart.org/trip/trip-planner/trip-planner-map'}];
  return <section className="local-options" aria-label="Your transport choice"><div className="local-heading"><span className="local-icon"><BusFront size={20}/></span><div><h3>{TRANSIT_MODE_LABELS[mode]}</h3><p>Your transport starting point</p></div></div><p className="local-disclosure">{guidance}</p><div className="place-links">{links.map(link=><a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} <ExternalLink size={13}/></a>)}</div></section>;
}
