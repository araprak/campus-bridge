import { PublicHeader, Footer } from '@/components/brand';
import historicalVerification from '@/data/historical-verification.json';
import releases from '@/data/releases.json';
import styles from './releases.module.css';

export const metadata = {
  title: 'Version history',
  description: 'CampusBridge versions, changes, and links to the full release notes.',
};

type VersionBase = { version: string; label: string; title: string; notesPath: string };
type PublishedVersion = VersionBase & {
  kind: 'release';
  date: string;
  features: { title: string; summary: string }[];
};
type RecordedVersion = VersionBase & {
  kind: 'historical';
  period: string;
  count: number;
  statuses: { status: string; count: number }[];
};
type Version = PublishedVersion | RecordedVersion;

const versions = releases as Version[];
const firstRecordedVersion = versions.find(version => version.kind === 'historical')?.version;
const releaseDate = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });
const formatDate = (date: string) => releaseDate.format(new Date(`${date}T00:00:00Z`));

export default function VersionHistory() {
  return <>
    <PublicHeader/>
    <main id="main" className={styles.page}>
      <p className="eyebrow">CAMPUSBRIDGE UPDATES</p>
      <h1>Version history</h1>
      <p className={styles.intro}>One continuous record of CampusBridge updates, newest first. Select a version to read its full document on GitHub.</p>
      <p className={styles.confirmation}>All {historicalVerification.entryCount} items from the original change log are implemented and verified, confirmed by the {historicalVerification.confirmedBy.toLowerCase()} on <time dateTime={historicalVerification.confirmedOn}>{formatDate(historicalVerification.confirmedOn)}</time>.</p>
      <p className={styles.context}>Recorded titles and date windows are retained from the original change log where exact release dates are unavailable.</p>
      <ol className={styles.releases}>
        {versions.map((version, index) => {
          const headingId = version.kind === 'historical' ? `history-${version.label}` : `release-${version.version}`;
          return <li key={version.version} id={version.version === firstRecordedVersion ? 'earlier-change-log' : undefined}>
            <article className={styles.release} aria-labelledby={headingId}>
              <div className={styles.meta}>
                <h2 id={headingId}>
                  <a href={`https://github.com/araprak/campus-bridge/blob/main/${version.notesPath}`}>
                    {version.label}<span aria-hidden="true"> ↗</span>
                  </a>
                </h2>
                {index === 0 && <span className={styles.latest}>Latest</span>}
                {version.kind === 'release'
                  ? <time className={styles.period} dateTime={version.date}>{formatDate(version.date)}</time>
                  : <span className={styles.period}>{version.period}</span>}
              </div>
              {version.kind === 'historical' && <>
                <p className={styles.verified}><span>{historicalVerification.status}</span><span>{version.count} items · Owner confirmed {formatDate(historicalVerification.confirmedOn)}</span></p>
                <p className={styles.sourceLabel}>Recorded title</p>
              </>}
              <p className={styles.title}>{version.title}</p>
              {version.kind === 'release'
                ? <ul className={styles.features}>
                    {version.features.map(feature => <li key={feature.title}>
                      <h3>{feature.title}</h3>
                      <p>{feature.summary}</p>
                    </li>)}
                  </ul>
                : <details className={styles.originalStatuses}>
                    <summary>Original worksheet statuses</summary>
                    <ul className={styles.statuses} aria-label="Original worksheet statuses">
                      {version.statuses.map(item => <li key={item.status}>
                        {item.status} <span aria-hidden="true">·</span> {item.count}
                      </li>)}
                    </ul>
                  </details>}
            </article>
          </li>;
        })}
      </ol>
    </main>
    <Footer/>
  </>;
}
