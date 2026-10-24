# CampusBridge release notes

Every user-facing feature or fix must ship with release notes. The public [Version history page](https://campusbridgeguide.com/releases) reads its metadata from `src/data/releases.json`. Its version links open `docs/releases/vX.Y.Z.md` directly in this public GitHub repository.

## Version numbering

Use semantic versions with three numbers:

- **Major** (`X.0.0`): an incompatible change that requires users to change how they use CampusBridge.
- **Minor** (`1.Y.0`): a new, compatible feature. Reset the patch number to zero.
- **Patch** (`1.1.Z`): a compatible fix or small improvement to existing behavior.

The application version in `package.json` and both root version fields in `package-lock.json` omit the `v` prefix. The page and document filenames display it. For example, a future version `1.1.2` will link directly to the GitHub document at `docs/releases/v1.1.2.md` once that release exists. This example is not an existing release.

v1.0.0 dated October 24, 2026 begins this formal versioned history. Historical v0.1–v2.3 labels were request-period groupings. Do not convert them into releases or infer launch dates.

## Required for each release

1. Finish only the approved feature or fix and verify its actual behavior.
2. Choose a version higher than the latest entry. Set the release date to the planned publication date; update it before publication if the release is delayed.
3. Create `docs/releases/vX.Y.Z.md`. Start with `# CampusBridge vX.Y.Z` and a `Release date: YYYY-MM-DD` line. Add a separate `## Feature title` section for each changed feature, explaining the user-visible behavior. Include limitations or user actions when relevant. Do not copy private planning documents, credentials, account data, or internal source excerpts into this public document.
4. Prepend an entry to `src/data/releases.json` containing `version`, `date`, `title`, `notesPath`, and a nonempty `features` array. Each feature needs a unique `title` and a concise `summary`; use the same feature title as its release-document heading. Use the latest release as the format example. Keep older entries and documents intact.
5. Update the version in `package.json` and the root `version` plus `packages[""].version` in `package-lock.json`. A release may group several features, but each needs its own notes section.
6. Run `npm run check:releases`, the relevant feature checks, and `npm run build`. A build automatically validates release metadata. To check the release requirement against the branch you started from, run `npm run check:releases -- --base origin/main`.
7. Commit the feature, version fields, manifest entry, and release document together. Publish them to GitHub before the matching website deployment, then verify that the website’s version link opens the intended document without signing in. Never publish a future version before its implementation is ready.

## Automated guardrails

`scripts/check-releases.mjs` validates semantic versions, newest-first ordering, real calendar dates, required feature metadata, each document’s path/version/date/feature headings, and agreement with the package and lockfile. It also rejects unlisted version documents.

The GitHub Actions release-notes check runs on pull requests and pushes to `main`. It compares the change with the base commit. Changes anywhere under `src/` or `public/` require a new version, a new manifest entry, and a new release document; this deliberately includes UI copy, assets, API behavior, and shared application logic. Historical release entries and version documents are preserved. Changes only to contributor documentation, tests, or tooling can pass without creating a release. The first release in this versioned history is validated against a repository with no release manifest.

The check can ensure that notes are present and consistent. Reviewers must still confirm that every feature is described accurately and that the documented date matches publication. No automated check grants approval to deploy or expand product scope.
