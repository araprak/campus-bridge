import { PublicHeader, Footer } from '@/components/brand';
import historicalChanges from '@/data/historical-changes.json';
import releases from '@/data/releases.json';
import styles from './releases.module.css';

export const metadata = {
  title: 'Version history',
  description: 'CampusBridge versions, new features, and links to the full release notes.',
};

const releaseDate = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeZone: 'UTC',
});

export default function VersionHistory() {
  return <>
    <PublicHeader/>
    <main id="main" className={styles.page}>
      <p className="eyebrow">CAMPUSBRIDGE UPDATES</p>
      <h1>Version history</h1>
      <p className={styles.intro}>What changed in CampusBridge, one version at a time. Select a version to read its full release notes on GitHub.</p>
      <ol className={styles.releases}>
        {releases.map((release, index) => <li key={release.version}>
          <article className={styles.release} aria-labelledby={`release-${release.version}`}>
            <div className={styles.meta}>
              <h2 id={`release-${release.version}`}>
                <a href={`https://github.com/araprak/campus-bridge/blob/main/${release.notesPath}`}>
                  v{release.version}<span aria-hidden="true"> ↗</span>
                </a>
              </h2>
              {index === 0 && <span className={styles.latest}>Latest</span>}
              <time dateTime={release.date}>{releaseDate.format(new Date(`${release.date}T00:00:00Z`))}</time>
            </div>
            <p className={styles.title}>{release.title}</p>
            <ul className={styles.features}>
              {release.features.map(feature => <li key={feature.title}>
                <h3>{feature.title}</h3>
                <p>{feature.summary}</p>
              </li>)}
            </ul>
          </article>
        </li>)}
      </ol>
      <section className={styles.history} aria-labelledby="earlier-change-log">
        <p className="eyebrow">PROJECT RECORD</p>
        <h2 id="earlier-change-log">Earlier change log</h2>
        <p className={styles.historyIntro}>113 recorded entries in 10 historical groups, covering September 24–October 22, 2026. From the review copy dated October 23, 2026.</p>
        <p className={styles.historyContext}>These labels are historical groupings, not verified release versions. Original statuses are preserved; proposed and requested entries do not indicate shipped features.</p>
        <a className={styles.sourceLink} href="https://github.com/araprak/campus-bridge/blob/main/docs/history/README.md">Read the source index on GitHub<span aria-hidden="true"> ↗</span></a>
        <ol className={styles.historyGroups}>
          {historicalChanges.map(group => <li key={group.label}>
            <article className={styles.historyGroup} aria-labelledby={`history-${group.label}`}>
              <div className={styles.historyMeta}>
                <h3 id={`history-${group.label}`}>
                  <a href={`https://github.com/araprak/campus-bridge/blob/main/${group.notesPath}`}>
                    {group.label}<span aria-hidden="true"> ↗</span>
                  </a>
                </h3>
                <span>{group.count} recorded entries</span>
              </div>
              <p className={styles.historyTitle}>{group.title}</p>
              <p className={styles.period}>{group.period}</p>
              <ul className={styles.statuses} aria-label="Original entry statuses">
                {group.statuses.map(item => <li key={item.status}>
                  {item.status} <span aria-hidden="true">·</span> {item.count}
                </li>)}
              </ul>
            </article>
          </li>)}
        </ol>
      </section>
    </main>
    <Footer/>
  </>;
}
