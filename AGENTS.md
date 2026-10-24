<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## CampusBridge release notes

Every new feature must ship with release notes. Follow `docs/releases/README.md`:
bump the application version, add a document under `docs/releases/`, and prepend
its entry with a note for each feature to `src/data/releases.json`. Keep older
release documents and entries available. Version numbers on `/releases` must
link directly to the matching GitHub document. Run `npm run check:releases`
before publishing, and use its base comparison for a feature change.

Historical labels v0.1–v2.3 in planning materials are request groupings, not
verified release tags or release dates. Do not turn proposed backlog items into
release claims. Do not add further feature sets without a new user request.
