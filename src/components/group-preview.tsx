import Link from 'next/link';
import type { SiteGroup } from '@/domain/site-groups';
import styles from './group-preview.module.css';
export function GroupPreview({group}:{group:SiteGroup}){
 const previews=group==='a'?[
  ['Explore homes','Search the community list, compare homes and load or pause the interactive map.','List ⇄ Map · Nearby services'],
  ['Plan your arrival','Start with DFW or Love Field, then prepare your journey and first-night checklist.','Airport → Your destination'],
  ['Team research','A separate workspace for the team to evaluate future campus and premium concepts.','Research worksheet · Team use'],
 ]:[
  ['See your move-in budget','Connect your plan choices, compare estimates and enter your confirmed quotes.','Monthly range + Move-in cash'],
  ['Keep deadlines in view','Choose relevant Spring 2027 reminders, save them and export to your calendar.','Your date · Your time zone'],
  ['Understand the next step','Look up F1 and UTD terms, check official sources and flag information for review.','Plain language · Official sources'],
 ];
 return <section className={`page-width ${styles.preview}`} aria-labelledby="tools-preview-title"><h2 id="tools-preview-title">A look inside your tools</h2><p>These previews illustrate the tools. Sign in to use your own plan and choose what to save.</p><div>{previews.map(([title,body,example])=><article key={title}><p className={styles.example}>{example}</p><h3>{title}</h3><p>{body}</p></article>)}</div><Link className="button" href="/group-tools">{group==='b'?'Open group tools':<>Open Group {group.toUpperCase()} tools</>}</Link><p className="small">Your shared CampusBridge plan is still available from My plan after sign-in.</p></section>;
}
