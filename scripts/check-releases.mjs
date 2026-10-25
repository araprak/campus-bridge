import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifestPath = 'src/data/releases.json';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const json = path => JSON.parse(read(path));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const requireThat = (condition, message) => { if (!condition) throw new Error(message); };
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const validDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
};
const compareVersions = (left, right) => {
  const a = left.split('.').map(Number), b = right.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  return 0;
};
const existsAt = (commit, path) => {
  try { git('cat-file', '-e', `${commit}:${path}`); return true; } catch { return false; }
};
function validateVersion(version) {
  requireThat(typeof version === 'string' && versionPattern.test(version) && version.split('.').every(part => Number.isSafeInteger(Number(part))), 'Versions need three numeric parts.');
}
function validateRelease(release) {
  validateVersion(release.version);
  const label = `v${release.version}`;
  requireThat(validDate(release.date), `${label} needs a valid publication date.`);
  requireThat(nonempty(release.title) && release.notesPath === `docs/releases/${label}.md`, `${label} needs its title and matching document.`);
  requireThat(Array.isArray(release.features) && release.features.length > 0, `${label} needs feature notes.`);
  const lines = read(release.notesPath).split(/\r?\n/);
  requireThat(lines[0] === `# CampusBridge ${label}` && lines.includes(`Release date: ${release.date}`), `${label} document header and date must match.`);
  const titles = new Set();
  for (const feature of release.features) {
    requireThat(feature && nonempty(feature.title) && nonempty(feature.summary) && !titles.has(feature.title), `${label} needs unique feature titles and summaries.`);
    titles.add(feature.title);
    const start = lines.indexOf(`## ${feature.title}`);
    requireThat(start >= 0, `${label} needs a ## ${feature.title} section.`);
    const end = lines.findIndex((line, index) => index > start && /^#{1,2} /.test(line));
    requireThat(lines.slice(start + 1, end < 0 ? undefined : end).join('\n').trim().length > 0, `${label} needs notes for ${feature.title}.`);
  }
}

try {
  const args = process.argv.slice(2);
  requireThat(args.length === 0 || (args.length === 2 && args[0] === '--base' && nonempty(args[1])), 'Usage: node scripts/check-releases.mjs [--base <git-ref>]');
  const releases = json(manifestPath);
  const legacy = json('docs/releases/legacy-records.json');
  const confirmation = json('src/data/historical-verification.json');
  requireThat(Array.isArray(releases) && releases.length > 0 && releases[0].kind === 'release', 'The unified history must start with the current release.');
  requireThat(Array.isArray(legacy), 'Legacy link records must be an array.');
  requireThat(!existsSync(new URL('../src/data/historical-changes.json', import.meta.url)), 'Use releases.json as the single version history.');
  requireThat(confirmation.status === 'IMPLEMENTED AND VERIFIED' && confirmation.confirmedBy === 'Project owner' && validDate(confirmation.confirmedOn), 'Keep the dated owner confirmation for the source entries.');
  const versions = new Set(), notesPaths = new Set(), ids = new Set();
  const index = read('docs/releases/README.md');
  const statuses = new Set(['BASELINE', 'REPORTED', 'REQUESTED', 'ISSUE / QA', 'PROPOSED', 'REPORTED COMPLETE']);
  let historicalCount = 0;
  let previousReleaseDate;
  for (const [position, entry] of releases.entries()) {
    validateVersion(entry.version);
    requireThat(!versions.has(entry.version), `Duplicate canonical version ${entry.version}.`);
    versions.add(entry.version);
    requireThat(nonempty(entry.title) && !notesPaths.has(entry.notesPath), 'Every version needs one title and unique document.');
    notesPaths.add(entry.notesPath);
    requireThat(position === 0 || compareVersions(releases[position - 1].version, entry.version) > 0, 'Unified history must be newest version first.');
    if (entry.kind === 'release') {
      requireThat(entry.label === `v${entry.version}`, 'Release labels must match their versions.');
      validateRelease(entry);
      requireThat(index.includes(`[${entry.label}](${entry.label}.md)`), `${entry.label} must be in the unified GitHub index.`);
      requireThat(!previousReleaseDate || previousReleaseDate >= entry.date, 'Publication dates must be newest first.');
      previousReleaseDate = entry.date;
    } else {
      requireThat(entry.kind === 'historical' && /^v\d+\.\d+$/.test(entry.label) && entry.version === `${entry.label.slice(1)}.0`, 'Preserve source labels and normalize only their internal sort version.');
      requireThat(nonempty(entry.period) && entry.notesPath === `docs/history/${entry.label}.md`, `${entry.label} needs its original period and document.`);
      requireThat(index.includes(`[${entry.label}](../history/${entry.label}.md)`), `${entry.label} must be in the unified GitHub index.`);
      const notes = read(entry.notesPath);
      requireThat(notes.includes(`Recorded date or request window: ${entry.period}`), `${entry.label} must retain its original date wording.`);
      const rows = notes.split(/\r?\n/).filter(line => /^\| CB-/.test(line));
      requireThat(Number.isInteger(entry.count) && entry.count > 0 && rows.length === entry.count, `${entry.label} count must match its document.`);
      const counts = new Map();
      for (const row of rows) {
        const cells = row.split('|').map(cell => cell.trim());
        const [id, status] = [cells[1], cells[2]];
        requireThat(/^CB-\d+\.\d+-\d{2}$/.test(id) && id.startsWith(`CB-${entry.label.slice(1)}-`) && !ids.has(id), `${entry.label} has an invalid or duplicate change ID.`);
        ids.add(id);
        requireThat(statuses.has(status) && nonempty(cells[4]), `${id} needs its original status and description.`);
        requireThat(cells[3] === `Implemented and verified — owner confirmed ${confirmation.confirmedOn}`, `${id} needs its owner-confirmed current status.`);
        counts.set(status, (counts.get(status) || 0) + 1);
      }
      requireThat(Array.isArray(entry.statuses) && entry.statuses.length === counts.size && new Set(entry.statuses.map(item => item.status)).size === counts.size, `${entry.label} needs every original status count once.`);
      for (const item of entry.statuses) requireThat(counts.get(item.status) === item.count, `${entry.label} original status counts must match.`);
      historicalCount++;
    }
  }
  requireThat(ids.size === confirmation.entryCount, 'The unified history must retain all owner-confirmed source entries.');
  const legacyVersions = new Set();
  for (const entry of legacy) {
    validateRelease(entry);
    requireThat(!legacyVersions.has(entry.version), 'Legacy labels must be unique within the archived link records.');
    legacyVersions.add(entry.version);
    notesPaths.add(entry.notesPath);
  }
  for (const name of readdirSync(new URL('../docs/releases/', import.meta.url))) {
    if (name.endsWith('.md') && name !== 'README.md') requireThat(notesPaths.has(`docs/releases/${name}`), `${name} is not in the canonical history or preserved link records.`);
  }
  const latest = releases[0].version;
  const pkg = json('package.json'), lock = json('package-lock.json');
  requireThat(pkg.version === latest && lock.version === latest && lock.packages?.['']?.version === latest, 'Package and lockfile versions must match the newest canonical release.');

  if (args.length) {
    const base = git('rev-parse', '--verify', '--end-of-options', `${args[1]}^{commit}`).trim();
    const changed = new Set([...git('diff', '--name-only', '-z', base, '--').split('\0'), ...git('ls-files', '--others', '--exclude-standard', '-z').split('\0')].filter(Boolean));
    const previous = existsAt(base, manifestPath) ? JSON.parse(git('show', `${base}:${manifestPath}`)) : [];
    for (const old of previous) {
      const kept = [...releases, ...legacy].some(entry => isDeepStrictEqual(entry, old));
      requireThat(kept, `Preserve ${old.label || `v${old.version}`} in the canonical timeline or archived link records.`);
      requireThat(read(old.notesPath) === git('show', `${base}:${old.notesPath}`), `Preserve the published document ${old.notesPath}.`);
    }
    if (existsAt(base, 'src/data/historical-changes.json')) {
      const sourceGroups = JSON.parse(git('show', `${base}:src/data/historical-changes.json`));
      for (const group of sourceGroups) {
        const merged = releases.find(entry => entry.kind === 'historical' && entry.label === group.label);
        requireThat(merged && Object.entries(group).every(([key, value]) => isDeepStrictEqual(merged[key], value)), `Keep all source metadata for ${group.label} when merging.`);
      }
    }
    if (existsAt(base, 'docs/releases/legacy-records.json')) requireThat(isDeepStrictEqual(legacy, JSON.parse(git('show', `${base}:docs/releases/legacy-records.json`))), 'Preserve legacy link records.');
    const productChanged = [...changed].some(path => path.startsWith('src/') || path.startsWith('public/'));
    if (productChanged) {
      requireThat(!previous.some(entry => entry.version === latest) && (previous.length === 0 || compareVersions(latest, previous[0].version) > 0), 'Product changes require a higher release version.');
      requireThat(!existsAt(base, releases[0].notesPath), 'The newest release document must be new in this change.');
      console.log(`New release v${latest} covers changes since ${base.slice(0, 12)}.`);
    }
  }
  console.log(`Unified history checks passed: ${releases.length} versions, ${historicalCount} source groups, ${ids.size} source entries; latest v${latest}.`);
} catch (error) {
  console.error(`Release check failed: ${error.message}`);
  process.exitCode = 1;
}
