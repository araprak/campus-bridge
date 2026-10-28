# CampusBridge version history

[Open Version history on the website](https://campusbridgeguide.com/releases). This index and the website use the single newest-first manifest at `src/data/releases.json`. Every version links directly to its matching GitHub document.

The current version is **v2.8.0**, adding Group B’s website language selector. Version v2.7.1 corrected the account-save confirmation after v2.7.0 added connected group tools and Spring 2027 preparation through the approved Phase 4 scope. Version v2.5.1 improved map cleanup after the v2.5.0 group-sites release. Version v2.5.0 added the separate Group A and Group B tools and the About journey. The previous v2.4.0 continues after v2.3. Version v2.4.0 consolidates the October 24 team, history, and verification updates. The earlier October 24 labels v1.0.0, v1.1.0, and v1.1.1 were a numbering restart; they are superseded by v2.4.0. Their original documents remain unchanged and accessible at the same URLs, with their metadata retained in `legacy-records.json`.

## Version index

Dates for the original groups retain the source’s wording where an exact release date was not recorded. Original group titles are preserved; all 113 items have a current implemented-and-verified status from the project owner’s October 24 confirmation.

| Version | Date or recorded period | Update | Entries |
| --- | --- | --- | --- |
| [v2.8.0](v2.8.0.md) | 2026-10-28 | Group B website languages | 1 feature note |
| [v2.7.1](v2.7.1.md) | 2026-10-28 | Accurate confirmation after arrival saves | 1 fix note |
| [v2.7.0](v2.7.0.md) | 2026-10-28 | Connected group tools and Spring 2027 preparation | 10 feature notes |
| [v2.5.1](v2.5.1.md) | 2026-10-25 | Keep map fallback usable after closing | 1 fix note |
| [v2.5.0](v2.5.0.md) | 2026-10-25 | Group A and Group B tools, with the CampusBridge journey | 8 feature notes |
| [v2.4.0](v2.4.0.md) | 2026-10-24 | One continuous CampusBridge version history | October 24 updates |
| [v2.3](../history/v2.3.md) | October 22, 2026 | Future roadmap and verification backlog | 8 |
| [v2.2](../history/v2.2.md) | October 2026; latest requirements before October 22 | Transportation and service-guidance enhancements | 10 |
| [v2.1](../history/v2.1.md) | October 2026; latest status to cross-check | Authentication, privacy, and account lifecycle | 10 |
| [v2.0](../history/v2.0.md) | October 2026; audit/refinement window | Core logic and task-management stabilization | 11 |
| [v1.4](../history/v1.4.md) | October 2026; exact request date to verify | Google Maps Housing Explorer integration specification | 12 |
| [v1.3](../history/v1.3.md) | October 8, 2026 | Housing comparison and rating design iteration | 11 |
| [v1.2](../history/v1.2.md) | October 6–7, 2026 | Expanded customer-journey feedback and usability requests | 14 |
| [v1.1](../history/v1.1.md) | September 28, 2026 | Immediate post-deployment personalization requests | 12 |
| [v1.0](../history/v1.0.md) | By September 28, 2026 | First website reported deployed | 12 |
| [v0.1](../history/v0.1.md) | September 24, 2026 | Initial website blueprint / pre-launch specification | 13 |

The [source worksheet reference](../history/README.md) retains the original status definitions, verification worksheet, source trail, and document fingerprint. It is reference material for this timeline, not a second version index.

## Version numbering

New releases use semantic versions with three numbers:

- **Major** (`X.0.0`): an incompatible change that requires users to change how they use CampusBridge.
- **Minor** (`2.Y.0`): a new, compatible feature. Reset the patch number to zero.
- **Patch** (`2.4.Z`): a compatible fix or small improvement to existing behavior.

The manifest’s `version`, the application version in `package.json`, and both root version fields in `package-lock.json` omit the `v` prefix. New entries use `kind: "release"` and a `label` such as `v2.4.1`. The ten original groups retain their source labels, such as `v2.3`; their internal `version` values add `.0` only for ordering. This normalization does not create a deployment tag or an exact historical release date.

## Required for each release

1. Finish only the approved feature or fix and verify its actual behavior.
2. Choose a version higher than the latest manifest entry. Set the release date to the publication date; update it before publishing if the release is delayed.
3. Create `docs/releases/vX.Y.Z.md`. Begin with `# CampusBridge vX.Y.Z` and a `Release date: YYYY-MM-DD` line. Add a separate `## Feature title` section for each changed feature, explaining its user-visible behavior, limitations, and any required action. Keep private planning documents, credentials, account data, and internal source excerpts out of public notes.
4. Prepend a `kind: "release"` entry to `src/data/releases.json` with `version`, `label`, `date`, `title`, `notesPath`, and a nonempty `features` array. Each feature needs a unique `title` and concise `summary`; match the title to its document heading. Use the latest entry as the example. Keep earlier canonical entries and documents intact.
5. Update `package.json` and the root `version` plus `packages[""].version` in `package-lock.json`. A release may group several features, but each needs its own notes section.
6. Run `npm run check:releases`, the relevant feature checks, and `npm run build`. To check the requirement against the branch you started from, run `npm run check:releases -- --base origin/main`.
7. Commit the feature, version fields, manifest entry, and document together. Publish them to GitHub before the matching website deployment, then confirm that the website version link opens the intended document without signing in.

## Record preservation and validation

`src/data/releases.json` is the only version timeline. Historical entries point to their existing documents under `docs/history/` and preserve the original IDs, titles, statuses, date wording, entry counts, and current owner confirmation. `src/data/historical-verification.json` records the owner’s confirmation date and scope.

The superseded October 24 records are preserved in `legacy-records.json` solely to retain prior documents and links. They must not reappear as a separate timeline.

Release validation checks versions, ordering, document links and headings, feature notes, package alignment, historical entry and status counts, and owner confirmation. The GitHub check also compares product changes to the base commit and requires a new release for `src/` or `public/` changes. Contributor-only changes can pass without creating a release.

Reviewers must confirm that each feature is described accurately and that publication dates are correct. A passing check does not authorize deployment or additional product scope.
