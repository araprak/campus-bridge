import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const root = fileURLToPath(new URL('../', import.meta.url));
const manifestPath = 'src/data/releases.json';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const json = path => JSON.parse(read(path));
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const requireThat = (condition, message) => {
  if (!condition) throw new Error(message);
};
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const versionPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const compareVersions = (left, right) => {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  }
  return 0;
};
const existsAt = (commit, path) => {
  try {
    git('cat-file', '-e', `${commit}:${path}`);
    return true;
  } catch {
    return false;
  }
};

try {
  const args = process.argv.slice(2);
  requireThat(args.length === 0 || (args.length === 2 && args[0] === '--base' && nonempty(args[1])), 'Usage: node scripts/check-releases.mjs [--base <git-ref>]');
  const releases = json(manifestPath);
  requireThat(Array.isArray(releases) && releases.length > 0, 'Release manifest must contain at least one release.');
  const versions = new Set();
  const notesPaths = new Set();

  for (const [index, release] of releases.entries()) {
    requireThat(release && typeof release === 'object', `Release ${index + 1} must be an object.`);
    requireThat(typeof release.version === 'string' && versionPattern.test(release.version) && release.version.split('.').every(part => Number.isSafeInteger(Number(part))), `Release ${index + 1} needs a semantic version such as 1.1.2 (without v).`);
    const label = `v${release.version}`;
    requireThat(!versions.has(release.version), `Duplicate release ${label}.`);
    versions.add(release.version);
    requireThat(typeof release.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(release.date), `${label} needs a YYYY-MM-DD date.`);
    const date = new Date(`${release.date}T00:00:00Z`);
    requireThat(!Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === release.date, `${label} has an invalid calendar date.`);
    requireThat(nonempty(release.title), `${label} needs a title.`);
    requireThat(release.notesPath === `docs/releases/${label}.md`, `${label} must point to docs/releases/${label}.md.`);
    notesPaths.add(release.notesPath);
    requireThat(Array.isArray(release.features) && release.features.length > 0, `${label} needs at least one feature or fix.`);
    const featureTitles = new Set();
    const notes = read(release.notesPath);
    const lines = notes.split(/\r?\n/);
    requireThat(lines[0] === `# CampusBridge ${label}`, `${release.notesPath} must begin with # CampusBridge ${label}.`);
    requireThat(lines.includes(`Release date: ${release.date}`), `${release.notesPath} must contain Release date: ${release.date}.`);
    for (const feature of release.features) {
      requireThat(feature && nonempty(feature.title) && nonempty(feature.summary), `${label} features need a title and summary.`);
      requireThat(!featureTitles.has(feature.title), `${label} has a duplicate feature title: ${feature.title}.`);
      featureTitles.add(feature.title);
      const heading = lines.indexOf(`## ${feature.title}`);
      requireThat(heading >= 0, `${release.notesPath} needs a ## ${feature.title} section.`);
      const nextHeading = lines.findIndex((line, lineIndex) => lineIndex > heading && /^#{1,2} /.test(line));
      const section = lines.slice(heading + 1, nextHeading < 0 ? undefined : nextHeading).join('\n').trim();
      requireThat(section.length > 0, `${release.notesPath} needs release notes under ## ${feature.title}.`);
    }
    if (index > 0) {
      const newer = releases[index - 1];
      requireThat(compareVersions(newer.version, release.version) > 0, 'Release manifest must be ordered by version, newest first.');
      requireThat(newer.date >= release.date, 'Release dates must be ordered newest first.');
    }
  }

  for (const filename of readdirSync(new URL('../docs/releases/', import.meta.url))) {
    if (filename.endsWith('.md') && filename !== 'README.md') {
      requireThat(notesPaths.has(`docs/releases/${filename}`), `${filename} is not listed in the release manifest.`);
    }
  }

  const latest = releases[0].version;
  const pkg = json('package.json');
  const lock = json('package-lock.json');
  requireThat(pkg.version === latest, `package.json version must match the latest release: ${latest}.`);
  requireThat(lock.version === latest && lock.packages?.['']?.version === latest, `Both package-lock.json root versions must match the latest release: ${latest}.`);

  if (args.length) {
    const base = git('rev-parse', '--verify', '--end-of-options', `${args[1]}^{commit}`).trim();
    const changedPaths = new Set([
      ...git('diff', '--name-only', '-z', base, '--').split('\0'),
      ...git('ls-files', '--others', '--exclude-standard', '-z').split('\0'),
    ].filter(Boolean));
    const userFacingChanges = [...changedPaths].some(path => path.startsWith('src/') || path.startsWith('public/'));
    const previous = existsAt(base, manifestPath) ? JSON.parse(git('show', `${base}:${manifestPath}`)) : [];
    requireThat(Array.isArray(previous), 'Base release manifest must be an array.');

    for (const historical of previous) {
      const retained = releases.find(release => release.version === historical.version);
      requireThat(isDeepStrictEqual(retained, historical), `Preserve the existing v${historical.version} release entry; describe new changes in a new release.`);
      requireThat(read(historical.notesPath) === git('show', `${base}:${historical.notesPath}`), `Preserve ${historical.notesPath}; add corrections in a new release.`);
    }

    if (userFacingChanges) {
      requireThat(!previous.some(release => release.version === latest), 'User-facing src/ or public/ changes require a new release version, manifest entry, and document.');
      requireThat(previous.length === 0 || compareVersions(latest, previous[0].version) > 0, 'The new release version must be higher than the base release.');
      requireThat(!existsAt(base, releases[0].notesPath), 'The latest release document must be new in this change.');
      console.log(`New release v${latest} covers user-facing changes since ${base.slice(0, 12)}.`);
    } else {
      console.log('No src/ or public/ changes require a new release.');
    }
  }

  console.log(`Release checks passed: ${releases.length} documented release${releases.length === 1 ? '' : 's'}; latest v${latest}.`);
} catch (error) {
  console.error(`Release check failed: ${error.message}`);
  process.exitCode = 1;
}
