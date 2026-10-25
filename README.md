## v2.4.0 — One continuous version history (October 24, 2026)

[Version history](https://campusbridgeguide.com/releases) now has one timeline: v2.4.0, followed by v2.3 through v0.1. The [GitHub version index](docs/releases/README.md) matches it, and each version opens its own document directly. This consolidates the October 24 About page, linked release documents, full 113-entry change log, and owner-confirmed implemented-and-verified status. The approved About page and team photographs are unchanged.

The October 24 labels v1.0.0, v1.1.0, and v1.1.1 are superseded by v2.4.0. Their original GitHub documents remain available at the same URLs. Original historical periods are retained where exact release dates were not recorded. See [v2.4.0 release notes](docs/releases/v2.4.0.md) and the [release process](docs/releases/README.md). Every future feature must have release notes and continue the current numbering.

## Reviews update — live (October 20, 2026)

Apartment cards, details, comparisons and map popups now open an on-demand Google ratings and reviews panel on [campusbridgeguide.com](https://campusbridgeguide.com/dashboard). Six exact listing IDs are verified; other communities use a visitor-confirmed Google listing search. Google renders its own ratings, reviews and attribution. No scores or review text are copied to the catalog. The owner approved Places UI Kit activation; the service and `NEXT_PUBLIC_GOOGLE_REVIEWS_ENABLED` are enabled while exact website and API restrictions remain in place. Deployment `dpl_FKhDRc51NDRH4EVyGkDUAmumt3sx` was tested as a staged production build and promoted unchanged. All 218 tests, typecheck and optimized builds passed. Hosted Madison listing selection, canonical-domain Northside reviews, map integration, password login and 390px mobile layout were verified. The disposable account and dependent records were deleted after signout. See [review release evidence and quota limitations](../CampusBridge-Reviews-Release.md).

# CampusBridge

**Authentication change live October 18, 2026:** Confirmed accounts now use **email + password → account access** without a recurring email code. New accounts still confirm their address once with a six-digit signup code; unfinished signup can resume after entering the correct password. Remembered sign-in, password recovery, optional UTD mailbox verification and account-scoped data access remain in place. Deployment `dpl_5JYn4D6xCmxZif3TJLuByL3Q6Q2Z` is live at [campusbridgeguide.com](https://campusbridgeguide.com/login). All 212 automated tests, typecheck and hosted build passed, followed by 12 live release-check groups and browser password-login verification. See the [password-login release record](../CampusBridge-Password-Login-Release.md).

**Live roadmap release, October 17, 2026:** [campusbridgeguide.com](https://campusbridgeguide.com) serves deployment `dpl_2v1p6yzNhUwRZpdSPmWQojwyEv7E`. It adds focused preferences, three checklist states and dependable undo/reset, next-step recommendations and a four-stage timeline, ZIP/radius housing search, persistent Saved Apartments, housing and monthly budget calculators, and expanded transport, phone and daily-life guidance. All **188 tests**, typecheck and the hosted build passed. The nine controlled account/API check groups passed on both the exact staged build and the canonical domain; each HTTP fixture was removed. Published map selection, mobile setup/dashboard/map/utilities/phone checks at 390 × 844, all four timeline stages and conditional guidance passed. Tested mobile views had no horizontal overflow. The separate browser-test account was signed out, deleted and verified absent, and temporary private fixture files were removed. Browser-console checks and the bounded production-error query found no errors. Session observations cover continuity within approval validity and expected 12-hour unremembered expiry; no actual 30-day elapsed browser test is claimed. See the [roadmap release report](../CampusBridge-Roadmap-Release.md), [scope and limits](../CampusBridge-Roadmap-Scope-Status.md) and [workstream tracker](../CampusBridge-Roadmap-Status-Tracker.csv).

**Historical authentication baseline, October 15, 2026:** Signup and login then followed **email + password → one six-digit email code → account access**. Public demo access is removed. Deployment `dpl_8UMpa2RZDr9aq2uyLMXDBnpyytRt` was promoted to [campusbridgeguide.com](https://campusbridgeguide.com). All 141 automated tests, typecheck and hosted build passed; disposable-account HTTP checks passed on both the staged deployment and the canonical site, and the staged browser test reached setup after one code. Migration `20261015182847_email_signup_code.sql` and the native signup email template/settings are applied. See [single-code release evidence](../CampusBridge-Single-Code-Auth-Release.md).

**Also live — Google Maps, October 15:** Housing Explorer includes the embedded Google map, synchronized apartment cards and pins, optional place layers and mobile List / Map controls. See [Google Maps release evidence](../CampusBridge-Google-Maps-Release.md) and [setup and cost controls](../CampusBridge-Google-Maps-Setup.md). Other topic maps retain their existing map implementation.

**Historical release — October 13:** Housing added adjustable-radius discovery and comparison of up to three existing communities. Deployment `dpl_6d1beRPaXPYcctTo7fvKfcuscdcG` was Ready and serving [campusbridgeguide.com](https://campusbridgeguide.com) at that release. All 127 tests, typecheck and the hosted build passed, along with focused desktop/phone checks. Account comparison storage was scoped to the authenticated user. No migration was required. See [release evidence and limitations](../CampusBridge-Apartment-Discovery-Release.md).

CampusBridge is a personalized pre-arrival and first-30-days guide for international students moving to UT Dallas. It helps students decide what applies, what to do next, where to find trusted help, and what they have completed.

**Historical snapshot — October 8, 2026.** The student-guides refresh was published at [campusbridgeguide.com](https://campusbridgeguide.com). That day's link patch replaced the neighborhood route-data ZIP link with a readable official bus schedule page; typecheck, hosted build and live checks passed. The October 7 baseline passed all 107 automated tests and focused desktop/mobile checks. Migrations 008–009 were applied and the production audit passed. See [student-guides release](../CampusBridge-Student-Guides-Release.md) for the evidence and [launch checklist](../CampusBridge-Launch-Checklist.md) for account acceptance checks recorded at that time.

| Item | Recorded October 8 status |
| --- | --- |
| Published application | Thirty communities, lease date, in-page maps, final utility checks, bulk undo, expanded connectivity directories, campus and daily-life guides, personal-email signup and refreshed design |
| Production Supabase | Project `hnqncupihsxchrtsyleh`; migrations 001–009 applied. Production audit confirms 16 active tasks, bulk undo and retained email-login authorization |
| Production Vercel | October 8 schedule-link patch `dpl_GXsChBaoHwfyJjNAo38UX2Bevmzj` Ready in `Product Alchemy/campusbridge` |
| Canonical URL | [campusbridgeguide.com](https://campusbridgeguide.com), connected and serving HTTPS |
| Alternate hosts | `www.campusbridgeguide.com` and [campusbridge-phi.vercel.app](https://campusbridge-phi.vercel.app) redirect to the apex |
| Email | Owner reported signup confirmation in about 2 minutes in spam and UTD code in about 5 seconds; spam cause unconfirmed |
| Validation | All 107 automated tests, final typecheck, local/hosted builds, production migration audit and focused live desktop/mobile checks passed |
| Real-account acceptance | Inbox, recovery, remembered sign-in, cross-device saves and deletion of a disposable account remain owner-assisted checks |

This snapshot does not certify full Midterm V1 acceptance. Earlier release records preserve the results observed on their own dates.

## Implemented experience

- Public landing, About, privacy, signup, login and password-recovery pages. A warmer palette, campus photographs, a separate UTD campus wordmark and the tagline **Arrive ready. Make it yours.** accompany shorter content and more whitespace. CampusBridge is an independent student guide, not a university service.
- Arrival-aware three-step setup. On-campus housing disables home type; off-campus options exclude university housing. All five priorities can be selected. Empty priorities use housing, utilities, transport, campus, then daily life.
- Public transport or getting a ride opens a follow-up for campus shuttle, DART, rideshare/taxi, carpool, a mix or undecided. Driving asks whether a car is arranged; No offers rental help. Switching branches clears hidden preferences and stale car access. Rental interest does not imply car access.
- A topic-based dashboard with arrival countdown, the next three applicable steps and four suggested arrival stages. Pending, completed and Not applicable are separate states. Undo last restores the prior change; **Undo all completed** asks for confirmation and preserves answers and Not applicable choices. Stable electricity/internet task identities retain compatible legacy progress.
- Thirty sourced apartment communities, ranked by approximate straight-line distance to UTD. Optional community, ZIP and lease start date are saved. These are comparison starting points, not live vacancies, measured commute times or a reservation service.
- Electricity comparisons and 12 home-internet providers, with exact-address checks and researched community-managed internet notes. Electricity and internet tasks finish with a readiness check. A searchable directory offers 41 cellular options, including separately labeled travel eSIM options. Neither directory claims every provider or guaranteed eligibility at a specific unit.
- Car arrival choices and sourced domestic shipping brokers. Rental help includes Enterprise, Hertz, Avis and the DFW airport directory; no quotes, booking or eligibility guarantee. The student DART pass task is omitted from Driving plans, including rental plans.
- Researched transit for the original eight communities, named directional stops and approximate straight-line distances from property references. The additional communities do not inherit unverified route or walking-time claims. The retained DART service snapshot covers October 4–18, 2026; the refreshed period covers October 19–December 6, 2026. Static schedule references need periodic review and do not supply live arrivals.
- Twenty sourced neighborhood places. With no supported community or an on-campus profile, a campus-area fallback keeps Daily Life useful. Gas stations and car washes require confirmed car access. Destination-stop annotations do not promise direct rides or live walking routes.
- Housing Explorer loads Google Maps after a valid ZIP, text or radius search, with 30 apartment pins, synchronized cards and filters, UT Dallas and optional curated place layers. Eleven local ZIP reference points and 1/3/5/10/15-mile radii use approximate straight-line distances. Saved Apartments persists privately with the account and remains separate from comparison and the selected planning home. Directions open Google Maps for the selected public destination. Other topic locations retain in-page OpenStreetMap dialogs. Maps show attribution and do not establish live routes, verified entrances or guaranteed free service at scale.
- Campus guides include 11 buildings, 21 dining outlets across seven building groups, 11 student tools and three essentials. They show the Comet Card office, useful student websites, food choices and support locations inside the site, with source links and maps.
- New signup asks for a personal email and rejects `.edu` signup addresses in the app. Existing university-email accounts can still sign in and recover access. Campus email verification is optional in Campus Support; an authenticated, confirmed account and user-scoped database access remain required. This is a product signup rule, not proof that an address is personal or a new authorization boundary.
- Signup sends one native Supabase six-digit code after the email and password are submitted; that code confirms the mailbox and completes signup. Login for a confirmed account opens the plan after the password is accepted, without sending an email code. An unfinished signup can resume from login with the correct password. Signup confirmation is a one-time mailbox check; it is not a recurring login step.
- Remembered sign-in uses a fixed 30-day approval deadline; browser-session sign-in uses a 12-hour approval. Passwords are not stored in application cookies. Separate campus-email codes verify mailbox access, not enrollment.
- Public demo access and demo entry links are removed. `/demo` and its nested routes redirect to login; setup and plan use require a verified account. Public informational and account-entry pages remain available. Self-service account deletion requires the current password and exact `DELETE` confirmation.

Research for the new directories and campus guides was reviewed October 6, 2026. Publication on October 7 does not imply a fresh source review. Campus photos are credited archival photographs from 2010. See the release record for source notes and limitations.

## Run locally

Use Node.js **22.18 or later** and npm. From the `campusbridge` directory:

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:3000`. Public informational pages need no credentials; setup and the plan require signup or login. For account integration, copy `.env.example` to `.env.local` and enter values privately, apply the migrations and configure the email settings below. Keep the account flag false until configuration is ready; there is no demo fallback. Never commit secrets.

```sh
npm test
npm run typecheck
npm run build
npm start
```

Build before `npm start`. Both server commands bind to loopback. Account activation in production mode requires a non-local HTTPS origin, including with a local production build; use `npm run dev` for account testing on local HTTP.

## Environment settings

Configure local, preview and production separately. Redeploy Vercel after environment changes. Public-prefixed values are not secret storage.

Required production values are saved. The user-authorized support contact is `aravind.venkatakrishna@utdallas.edu`; the sending identity is `CampusBridge <verify@campusbridgeguide.com>`. Secret values are kept privately in provider settings. Account access is enabled in the published app. The owner's earlier successful signup and email-delivery report describes the previous flow; single-code authentication verification is recorded in the October 15 release report, separately from those historical observations.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Intended Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public client key; database policies enforce user access |
| `SUPABASE_SECRET_KEY` | **Server-only** elevated key for verification operations and deletion of the reauthenticated user's own account |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin; local development uses `http://127.0.0.1:3000`, production uses the actual non-local HTTPS origin |
| `CAMPUSBRIDGE_ACCOUNTS_ENABLED` | Explicit activation flag; example defaults to `false` |
| `SUPPORT_EMAIL` | Monitored privacy and account-support contact |
| `RESEND_API_KEY` | **Server-only** sending key for optional UTD verification codes |
| `VERIFICATION_FROM` | Sender on the verified domain; replace the example address |
| `VERIFICATION_SECRET` | **Server-only** random secret for code/IP digests; generate at least 32 random bytes and store the encoded value privately |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Public browser key restricted to approved website origins and APIs; add Places UI Kit only after approval |
| `NEXT_PUBLIC_GOOGLE_REVIEWS_ENABLED` | `true` only after approved Places UI Kit API activation; otherwise in-site reviews stay off |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | CampusBridge's own Google map configuration ID for the housing map |

Activation requires the flag, Supabase values, elevated key, contact, Resend key, sender and a verification secret of at least 32 characters. Production also requires a non-local HTTPS site URL. These checks validate presence, not successful DNS, delivery, permissions or migrations. Signout remains independent of the activation flag when Supabase is configured.

The Supabase dashboard confirms **Allow new users to sign up**, **Confirm Email** and the email provider are enabled; anonymous sign-ins and manual identity linking are off. The app flag does **not** disable direct Supabase signup and is not a tester allowlist: account routes are now available to visitors. Keep email confirmation enabled. [Supabase Auth settings](https://supabase.com/docs/guides/auth/general-configuration)

## Database and catalog

Apply in this order to the intended new project:

1. `supabase/migrations/202609250001_foundation.sql` — schema, private challenges, profile trigger, policies and transactional functions.
2. `supabase/migrations/202609250002_catalog.sql` — tasks, resources, links and rule metadata.
3. `supabase/migrations/202610020003_email_login.sql` — email sign-in challenges and remembered approvals.
4. `supabase/migrations/202610020004_email_login_enforcement.sql` — private-data and write authorization gates.
5. `supabase/migrations/202610030005_arrival_plan.sql` — expanded priorities, optional community/ZIP, transport-aware parking applicability.
6. `supabase/migrations/202610040006_car_arrival.sql` — optional domestic car arrival preference; retains private validation and all authorization gates.
7. `supabase/migrations/202610050007_transport_options.sql` — optional public-transport/ride and rental-help preferences; backward-compatible validation with unchanged private-validator access restrictions.
8. `supabase/migrations/202610060008_student_guides.sql` — optional lease start date, DART-pass applicability, atomic completion reset and the updated 16-task catalog.
9. `supabase/migrations/202610060009_personal_login.sql` — personal-account plan access after verified email sign-in; campus verification becomes optional while user isolation and revision checks remain enforced.
10. `supabase/migrations/20261015182847_email_signup_code.sql` — server-only bridge from a freshly verified native email OTP session to the existing private-plan approval. Requires a confirmed account, matching live Auth session and recent authoritative OTP evidence; retries preserve the original approval deadline.

11. `supabase/migrations/20261015190407_roadmap_task_states.sql` — additive Not applicable state, stable utility-task aliases, authenticated revision-checked writes and completed-only reset.
12. `supabase/migrations/20261015190410_apartment_favorites.sql` — owner-only saved apartments with approved-login checks and account-deletion cascades.

Migrations 001–009 succeeded on the project above; 008 and 009 were applied in order on October 7, 2026. The production audit confirmed 16 active tasks, the bulk reset function, the `dart_pass` rule, verified email-login authorization without a mandatory UTD gate, and two restrictive answer/progress policies. These migrations did not rewrite account answers or progress. **Do not rerun the foundation there:** the full migration is not repeatable. Record these dashboard-applied migrations before using migration tooling so it does not reapply them.

Migration `20261015182847_email_signup_code.sql` was applied to the same project on October 15, 2026 for the authentication release. It adds the restricted approval function without changing saved plans or removing the existing login gate. Do not reapply it merely to redeploy the website.

Both roadmap migrations were applied October 16, 2026. Final staged and canonical release checks passed for task-state compatibility, reset behavior, saved apartments and account isolation. Do not rerun these applied migrations for an application redeploy. Keep the additive schema during application rollback; the prior interface cannot display Not applicable, but compatible stored states remain intact. See the [migration review](../CampusBridge-Task-State-Migration-Review.md).

`src/data/catalog.json` supplies the app catalog. `npm run seed:generate` regenerates the initial catalog SQL; it does not apply SQL or publish changes. After these migrations are applied, use a new dated migration for later changes. Keep deployed catalog data and SQL synchronized. Retire task IDs rather than deleting progress history. Removing/changing resource associations needs explicit SQL because the generator only inserts/upserts.

Rules live in `src/domain/plan.ts`; SQL independently enforces applicability for direct database calls. Tests compare both across 288 answer combinations. Preserve that comparison when changing rules.

## Email and callbacks

Supabase sends the native signup confirmation code and password-recovery email through its configured SMTP integration. CampusBridge sends optional UTD verification codes through Resend HTTP. Ordinary password sign-in does not send an email code. A Vercel `RESEND_API_KEY` does **not** configure Supabase SMTP.

Resend has verified `campusbridgeguide.com` after its DKIM and `send` MX/SPF records were applied. Two sending-only keys restricted to this domain were created: one saved privately in Vercel for app-owned codes and a separate key saved privately in Supabase SMTP. The configured sender is `verify@campusbridgeguide.com`, name `CampusBridge`; SMTP uses host `smtp.resend.com`, port `465`, username `resend`, and the SMTP key as password. In the earlier link-based signup flow, the owner reported confirmation in about 2 minutes in spam, then a separate UTD code in about 5 seconds. The spam cause remains unconfirmed; this is not a delivery measurement for the new flow. A monitoring-only DMARC record, `_dmarc` TXT `v=DMARC1; p=none`, was published and read back from authoritative DNS; it does not establish inbox placement. [Resend setup](https://resend.com/docs/send-with-supabase-smtp), [Supabase SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

Vercel's `NEXT_PUBLIC_SITE_URL` and the Supabase Site URL are saved as `https://campusbridgeguide.com`, with these two callback destinations saved in the Supabase allowlist:

- `https://campusbridgeguide.com/auth/callback`
- `https://campusbridgeguide.com/auth/callback?flow=recovery`

For the single-code signup flow, keep **Confirm Email enabled**, set the email OTP length to **6** and email OTP expiry to **600 seconds**, and make the **Confirm signup** template display `{{ .Token }}` without a confirmation-link button. The signup verification route submits that code to Supabase, binds the returned session to a signed pending-signup cookie, and grants private-plan access after the server checks recent native OTP evidence. Returning users with confirmed accounts obtain session approval after their password is verified; an unconfirmed account cannot use that path. The signed pending transaction lasts 30 minutes; each emailed code lasts 10 minutes.

Keep the **password recovery** template linked through `{{ .ConfirmationURL }}` for the existing code-exchange callback, and disable email click tracking. Recovery links still need the initiating browser and host for PKCE; ordinary signup no longer depends on opening an email link. The base callback remains available for previously issued links. Add intended local/controlled preview callback origins separately when testing recovery. [Supabase redirects](https://supabase.com/docs/guides/auth/redirect-urls), [email templates](https://supabase.com/docs/guides/auth/auth-email-templates)

## Verification limits

Native signup codes use Supabase's email OTP expiry and Auth rate limits. They do not use the app-owned challenge table or its five-attempt limit. The server-only approval bridge requires OTP evidence from the same live session within 15 minutes; a successful retry cannot extend an existing approval. The migration has automated coverage for browser-role denial, stale or mismatched evidence, account isolation, expiry and revocation.

Routine sign-in no longer creates or sends app-owned login challenges. The historical login-challenge schema is retained for compatibility. Optional campus codes validate the exact `utdallas.edu` domain and bind the code to the signed-in account and destination. They store keyed digests and consume a valid challenge once; campus verification preserves the original login email. Campus-code limits are:

- Ten-minute validity; five attempts per challenge.
- 60-second resend cooldown; a new campus challenge replaces unused campus challenges for the account.
- Six campus challenges per account or destination per rolling hour; 20 per network digest per hour. Shared networks share that limit.
- Challenges older than 24 hours are purged on new challenge creation; no scheduled cleanup job exists yet.
- Sending retries at most once, using the same payload and challenge-specific idempotency key, with eight seconds allowed per attempt. A timed-out send can still arrive; the code remains usable.

Email-service acceptance is not inbox delivery. Resend retains idempotency keys for 24 hours; new challenges use new keys. [Resend API](https://resend.com/docs/api-reference/emails/send-email), [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys)

The badge confirms mailbox access, not enrollment or UTD endorsement. University addresses are currently unique across verification records, including revoked records; self-service reassignment is deferred.

## Account deletion

Signed-in users can choose **Delete account** in My profile or open `/account`, even before UTD verification or onboarding. The confirmation dialog explains the permanent removal, initially focuses **Keep my account**, and enables deletion only after the current password and exact text `DELETE` are entered. Cancelling or pressing Escape clears those fields. Support remains available for account-access problems.

The same-origin server endpoint obtains the account identity from the authenticated session; it accepts no browser-supplied user ID. It reauthenticates the current password before requesting a hard deletion from Supabase Auth. Existing foreign keys cascade deletion through profiles, onboarding answers, task progress, institution verification and private verification challenges. Success clears the session cookies; a provider failure preserves the session. The original deletion release required no database migration or new environment settings.

At the original deletion release, all 33 automated tests, standalone typecheck, local production build and Vercel build passed, and a dedicated security review found no blockers. Those checks were retained in the October 7 107-test suite. Isolated integration tests exercised the real deletion route with a fake Auth provider: a provider failure preserved the session, success removed all three session-cookie chunks, and stale sessions and repeat login were rejected. Embedded Postgres checks confirmed all five user-owned tables were cleared, another account and the shared catalog were preserved, and stale deleted-user claims could not read, update or recreate profile/progress data.

Local browser checks used a fake account fixture. They verified the Account settings link before UTD verification, cancellation/Escape clearing fields, initial focus on Keep my account, the disabled final button until both required inputs were present, and wrong-password feedback that clears the password. Desktop 1280×720 and mobile 375×812 views were inspected. [Account deletion screenshot](../CampusBridge-delete-account.png) shows that local fixture, not a production deletion. At that deletion release, no real cloud account was deleted; hosted deletion-route acceptance was pending. Later roadmap release fixtures were removed through the administrative test-cleanup helper, which verifies cascades but does not certify the self-service deletion UI.

On the live release, opening `/account` while signed out redirected to login. A signed-out deletion request returned HTTP 401, a request from a foreign origin returned HTTP 403, and the privacy page displayed the new self-service deletion guidance. These checks did not identify or delete any real user data.

## Activation, validation and recovery

The October 17 roadmap release is live as noted at the top of this file; the [roadmap report](../CampusBridge-Roadmap-Release.md) records current deployment evidence, acceptance and source limits. The October 15 authentication release remains the rollback baseline and documents the single-code flow. Earlier counts and checks below remain historical. Migration `20261015182847_email_signup_code.sql` is already applied; the Supabase confirmation template now sends a six-digit code, with OTP length 6 and expiry 600 seconds. Native email-link recovery uses that same provider expiry setting.

At the October 7 release, the production deployment was Ready, the apex served HTTPS, signup was enabled, and migrations 001–009 were applied. Sender DNS, SMTP, the support contact, production variables and callback settings were saved. The owner had completed signup and UTD-code verification using a UTD address as the login email. Existing university-email accounts retain login and recovery.

The student-guides refresh passed all 107 automated tests, including lease validation, bulk completion reset, DART-pass applicability, personal-account authorization, cross-user isolation and existing email-login/deletion boundaries. Final standalone typecheck and production build passed after the neighborhood fallback correction. Local browser checks passed for lease persistence, single and bulk undo, provider search, campus maps/dining, conditional transport and topic order; desktop and phone views were inspected. Migrations 008–009 were applied after the owner continued following the prepared approval prompt. Production audit and hosted build passed. Live checks confirmed personal-email signup, 30-community search, working embedded maps, lease persistence, bulk undo preserving housing details, and final utility checks using the lease date. Home, signup and Privacy returned HTTP 200; signed-out account access returned HTTP 401. The 390-pixel phone view had no horizontal overflow. See [student-guides release](../CampusBridge-Student-Guides-Release.md) for the deployment and evidence.

The historical [launch checklist](../CampusBridge-Launch-Checklist.md) recorded owner-assisted acceptance needs for inbox access, recovery, remembered login, second-device persistence and deletion of a designated disposable account. These must be assessed against the authentication release's actual hosted results; earlier automated coverage does not establish current cloud delivery or production concurrency. Historical transport verification remains in [transport release](../CampusBridge-Transport-Release.md); earlier QA records describe their release dates.

If account service fails, disable new Supabase signups and deploy with the app account flag false while investigating. Preserve data and the last working Vercel deployment. Application rollback does not reverse database migrations; database recovery needs a separate plan. Disabled account access shows an unavailable notice and does not enable a public demo.
