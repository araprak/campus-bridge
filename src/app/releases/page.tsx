import { PublicHeader, Footer } from '@/components/brand';
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
    </main>
    <Footer/>
  </>;
}
