import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { SPRING_2027_SOURCES } from '../src/data/spring-2027.ts';
import { ARRIVAL_SOURCES, ARRIVAL_SOURCES_CHECKED } from '../src/data/group-a-arrival.ts';
import { APARTMENTS, HOUSING_DIRECTORY_REVIEWED } from '../src/data/local-options.ts';
import { TRANSIT_FEED_END, TRANSIT_FEED_VERSION, TRANSIT_REVIEWED } from '../src/data/community-transit.ts';

// Read-only operational check. An HTTP success is reachability, never a factual review.
const args = process.argv.slice(2);
const offline = args.includes('--offline');
const evaluationDate = args.find(arg => arg.startsWith('--today='))?.slice(8)
  ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Chicago' }).format(new Date());
const gtfsFile = args.find(arg => arg.startsWith('--gtfs-file='))?.slice(12);
const dateMs = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
  && new Date(`${value}T00:00:00Z`).toISOString().startsWith(value) ? Date.parse(`${value}T00:00:00Z`) : NaN;
if (!Number.isFinite(dateMs(evaluationDate))) throw new Error('Use a real YYYY-MM-DD date for --today.');
const records = [
  ...SPRING_2027_SOURCES,
  ...Object.entries(ARRIVAL_SOURCES).map(([id, item]) => ({ id: `arrival-${id}`, title: item.label, url: item.url, checkedOn: ARRIVAL_SOURCES_CHECKED })),
  ...APARTMENTS.map(item => ({ id: `housing-${item.id}`, title: item.name, url: item.url, checkedOn: HOUSING_DIRECTORY_REVIEWED })),
  { id: 'dart-gtfs', title: 'DART fixed route schedule', url: 'https://www.dart.org/about/about-dart/fixed-route-schedule', checkedOn: TRANSIT_REVIEWED },
  { id: 'big-howdy', title: 'Big Howdy airport pickup', url: 'https://utdbighowdy.com/', checkedOn: ARRIVAL_SOURCES_CHECKED },
];
const sources = [...new Map(records.map(record => [record.url, record])).values()].map(record => {
  const ageDays = Math.floor((dateMs(evaluationDate) - dateMs(record.checkedOn)) / 86400000);
  return { ...record, ageDays, reviewDue: !Number.isFinite(ageDays) || ageDays > 30 || ageDays < 0 };
});

async function reachability(source) {
  if (offline) return { ...source, reachability: 'not-checked' };
  try {
    const response = await fetch(source.url, { method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'CampusBridge-source-review/1.0' } });
    await response.body?.cancel();
    return { ...source, reachability: response.ok ? 'reachable' : 'needs-check', httpStatus: response.status, finalUrl: response.url };
  } catch (error) {
    // Only error categories are emitted; environment settings and credentials are never logged.
    return { ...source, reachability: 'unavailable', error: error instanceof Error ? error.name : 'RequestError' };
  }
}

async function limitedDownload(url) {
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(45000) });
  if (!response.ok) throw new Error(`GTFS HTTP ${response.status}`);
  const chunks = []; let total = 0;
  for await (const chunk of response.body) {
    total += chunk.length;
    if (total > 50_000_000) { await response.body.cancel().catch(() => {}); throw new Error('GTFS exceeds 50 MB review limit'); }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

let feed = { status: 'not-checked', storedVersion: TRANSIT_FEED_VERSION, storedThrough: TRANSIT_FEED_END, january11Confirmed: false };
if (!offline || gtfsFile) {
  try {
    const bytes = gtfsFile ? await readFile(gtfsFile) : await limitedDownload('https://www.dart.org/transitdata/latest/google_transit.zip');
    // Python's standard ZIP/CSV readers avoid treating a downloaded archive as executable content.
    const raw = execFileSync('python3', ['-c', 'import sys,io,zipfile,csv,json; z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())); i=z.getinfo("feed_info.txt"); assert i.file_size < 50000; print(json.dumps(list(csv.DictReader(io.StringIO(z.read(i).decode("utf-8-sig"))))))'], { input: bytes, maxBuffer: 64000 });
    const info = JSON.parse(raw.toString())[0];
    if (!info || !/^\d{8}$/.test(info.feed_end_date)) throw new Error('No valid GTFS coverage metadata');
    const through = info.feed_end_date.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3');
    feed = { ...feed, status: info.feed_version === TRANSIT_FEED_VERSION && through === TRANSIT_FEED_END ? 'unchanged' : 'new-feed-review-required', publishedVersion: info.feed_version, publishedThrough: through, january11Confirmed: false,
      note: through >= '2027-01-11' ? 'Coverage reaches January 11; a person must still verify Silver Line, Route 883, calendar exceptions and stop changes before publication.' : 'Published coverage does not reach January 11. Keep the student-facing warning and check again when a new feed is published.' };
  } catch (error) { feed = { ...feed, status: 'unavailable', error: error instanceof Error ? error.name : 'FeedError' }; }
}
const results = [];
for (let offset = 0; offset < sources.length; offset += 4) results.push(...await Promise.all(sources.slice(offset, offset + 4).map(reachability)));
const issues = results.filter(item => item.reviewDue || ['needs-check', 'unavailable'].includes(item.reachability));
const report = {
  observedAt: new Date().toISOString(), evaluationDate, offline,
  status: issues.length || ['new-feed-review-required', 'unavailable'].includes(feed.status) ? 'attention-required' : 'checks-passed',
  limits: 'Reachability does not verify content, prices, actual service, source ownership changes, or personal eligibility. Checked-on dates are never changed by this script.',
  sourceCount: results.length, issues, sources: results, transit: feed,
  reports: 'No student reports or account records are fetched. Review the Group B report queue using the authorized Supabase workflow in docs/group-sites/intake-support.md.',
};
console.log(JSON.stringify(report, null, 2));
if (report.status === 'attention-required' || (args.includes('--require-intake-ready') && !feed.january11Confirmed)) process.exitCode = 1;
