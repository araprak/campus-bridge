# CampusBridge group sites

The project owner assigned these six numbered feature sets from the Unified Feature Update Register on October 25, 2026:

| Site | Assignment | Implemented scope |
| --- | --- | --- |
| `grp-a.campusbridgeguide.com` | 3. Google Maps experience | Explicit map loading, pause, retained list/filter/selection/layers and fallback |
| Group A | 5. Transportation and arrival | Airport-to-destination assistant, selected-mode directions and current official links |
| Group A | 12. Campus expansion and premium options | Research concepts, evidence checklist and downloadable worksheet |
| `grp-b.campusbridgeguide.com` | 6. Expenses and budgeting | Up to three per-person scenarios, exact cents, unknown flags, move-in cash and optional browser saving |
| Group B | 8. Helpful reminders | Opt-in local deadlines, IANA time zones, due status and calendar export with optional alert request |
| Group B | 9. Accessibility and trust | Plain-language glossary, limited term translations, dated source summaries and report drafts |

The Word change log restarts item numbers in each historical group. The register’s unique 1–12 feature-set summary resolves the assignment; the owner subsequently confirmed these six titles directly. Document content was used as reference, not as independent authorization. Research-only scope for feature set 12 was retained; no payments or multi-campus service were inferred.

## Experience and data model

One maintained Next.js application serves three exact hosts. The main site keeps the baseline experience. The two group hosts select distinct new tools in server-rendered pages. There is no query-string or client flag that enables another group’s tools. `/group-tools` is unavailable on the main host and uses the existing account protection on group hosts. Baseline features remain shared.

Accounts, plans, progress and favorites continue using the existing backend and per-user access rules. No database schema, credentials, security grants or paid plan changed. Cookies stay host-scoped, so users sign in separately. Recovery remains on the established canonical main-site callback. API writes require a known origin matching the actual incoming Host; forwarded-host headers do not select a group or authorize a write.

Group B browser copies require explicit consent and use versioned keys containing host, account ID and feature. The origin also isolates browser storage. Values do not sync between devices. Successful account deletion clears matching local records on the current origin; other origins/devices need their own cleanup. Reminder alerts are calendar requests; no background delivery service was added.

The About page adds a single source-grounded journey paragraph before the existing team portraits. Shared release v2.5.0 has a separate note for each feature. There is still one canonical version manifest and GitHub index.

## Acceptance criteria and verification

- Exact Group A/B host recognition; main and lookalike hosts cannot select group tools.
- Existing login protection; no public demo or production test bypass.
- Same-origin API validation on each public host; harmless invalid-form requests must reach validation rather than fail the origin check.
- Group A searches do not load a Google map until an explicit map action; pause keeps list/filter state and layers.
- Arrival directions preserve airport, destination and travel mode without invented live fares or travel times.
- Budget calculations separate monthly amounts, one-time fees and refundable cash; unknown never implies zero; persistence is opt-in and removable.
- Reminder conversion handles time zones and rejects DST gaps/folds; downloaded calendar bytes preserve the correct instant, escaping and optional alert.
- Glossary and report-draft interactions work; source dates attach only to actually checked resources.
- Responsive layouts stay within a 390px viewport; names/photos remain after the About paragraph.
- Previous version documents, historical records, release checks, tests, typecheck and production build remain valid.

Browser feature checks use fictional values in a temporary localhost fixture, removed before the production build. Public deployment checks confirm host separation, page content, form validation, account gates and direct release-document access. A live signed-in session is required to independently verify authenticated production interactions; a localhost fixture does not prove those interactions or provider configuration.

## Release and rollback

Deploy the same reviewed commit to the existing `product-alchemy/campusbridge` Vercel project. Attach the two new exact subdomains without changing apex, www, email records or nameservers. Check public HTTPS and each host’s group identity after promotion.

To roll back product code, promote the preceding production deployment. If removing the group sites, remove only the two newly added project-domain associations. Optional local copies remain under the user’s browser controls. Preserve published release documents and historical records.
