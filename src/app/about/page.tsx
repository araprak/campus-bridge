import { PublicHeader, Footer } from '@/components/brand';
import styles from './about.module.css';

export const metadata = { title: 'About', description: 'The CampusBridge journey and team.' };

const members = [
  { name: 'Kavya Vinod', photo: 'kavya-vinod.png', width: 533, height: 800 },
  { name: 'Sai Akshay Jonnalagadda', photo: 'sai-akshay-jonnalagadda.png', width: 1254, height: 1254 },
  { name: 'Songyi Baek', photo: 'songyi-baek.png', width: 683, height: 1024 },
  { name: 'Aravind Venkatakrishna', photo: 'aravind-venkatakrishna.png', width: 724, height: 1086 },
];

export default function About() {
  return <>
    <PublicHeader/>
    <main id="main" className={`page-width ${styles.page}`}>
      <h1>About</h1>
      <p className={styles.journey}>CampusBridge began as Product Alchemy’s student project for MIS 6393 at UT Dallas, exploring how to make moving in and setting up home services easier. Our early research led us to a broader question: how can a new international student know what matters, what comes next, and where to find trusted help? We turned that idea into a personalized First 30 Days Navigator, then refined it through successive releases covering housing, utilities, transportation, campus support, daily life, and progress tracking. Our journey has grown from research and a first website into the CampusBridge experience we continue to build together.</p>
      <ul className={styles.team}>
        {members.map(member => <li key={member.name}>
          <figure>
            <div className={styles.portrait}>
              <img src={`/team/${member.photo}`} alt={member.name} width={member.width} height={member.height}/>
            </div>
            <figcaption>{member.name}</figcaption>
          </figure>
        </li>)}
      </ul>
    </main>
    <Footer/>
  </>;
}
