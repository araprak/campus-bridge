<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## CampusBridge release notes

Every new feature must ship with release notes. Follow `docs/releases/README.md`.
`src/data/releases.json` is the single version timeline for the website and GitHub
index. Continue after its latest version; do not restart numbering or create a
second history section. Add a `kind: "release"` entry, a matching document under
`docs/releases/`, and a separate note for every feature. Bump package versions
and run `npm run check:releases` before publishing, including its base comparison
for product changes. Every version number must link directly to its GitHub document.

Keep earlier canonical entries and source documents available. Original two-part
labels v0.1–v2.3 retain their recorded periods; their internal three-part versions
are ordering values and do not establish deployment tags or exact ship dates.
All 113 items carry the project owner’s October 24 implementation and verification
confirmation. Preserve that attribution and the earlier worksheet record.

The superseded October 24 labels v1.0.0, v1.1.0, and v1.1.1 are consolidated under
v2.4.0. Their original documents and metadata in `docs/releases/legacy-records.json`
remain available to keep links working; do not publish them as a separate timeline.
Do not add further feature sets without a new user request.

## Group sites

The owner assigned new feature sets 3/5/12 to Group A and 6/8/9 to Group B.
Use exact server-side host recognition in `src/domain/site-groups.ts`; never
select a group from a query string or untrusted forwarded host. The groups share
baseline accounts and plans; new tools are scoped to their assigned subdomain.
Keep `/group-tools` protected and unavailable on the main host. Preserve the
single release manifest, with feature notes identifying their group. See
`docs/group-sites/README.md`. Feature set 12 is research until a separate working
campus or paid-service scope is explicitly approved.
