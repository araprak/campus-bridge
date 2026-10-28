# Spring 2027 intake support

Prepared October 28, 2026. Presentation: October 29. Support scope continues through January 22, 2027. Group A and Group B remain separate through Phase 4; the owner must request the Phase 5 merge.

## Current facts and limits

Official Spring 2027 navigation sources were reviewed October 27. A source date records that review, not a promise that a future service or price is guaranteed. Do not advance checked-on dates after only an HTTP check.

- DART’s latest downloadable GTFS was checked October 27 and still publishes version `V750-218-220-20261019`, covering October 19–December 6, 2026. Its SHA-256 was `355663359fb7fe8b831c6aaacbeb62d567e01c94c5526755de3cac97b14515ef`. January 11 service is **unconfirmed**. Keep the warning until the new feed, calendar exceptions, Silver Line and Route 883 have been reviewed.
- UTD’s Spring orientation is January 13; full-term classes begin January 19. An initial F1 entry window comes from the I-20 program start date, not the class date. Do not publish December 20 as a universal entry date.
- Big Howdy spring requests are described as opening in mid-November; no exact opening date or pickup availability is guaranteed. Check the actual program before replacing that wording.
- Apartment and provider records without verified amounts remain Unknown. Record coverage across 30 communities does not mean 30 current quotes.
- The official housing move-in pages still describe Fall 2026. Students must confirm Spring move-in and key pickup with Housing.

## Weekly review through January 22

The project owner coordinates the review. Run the nonmutating source check from the app checkout with `npm run check:intake`. Use `-- --offline` for a source-age report without network requests. `-- --today=2027-01-11 --require-intake-ready` tests the January freshness gate; it must not be treated as a completed future review.

1. Review Group A’s DFW, Love Field, Silver Line, Comet Cruiser, GoPass and Big Howdy sources. Check new timetables and holiday exceptions before changing travel guidance. Download a new GTFS only from DART’s official source; inspect coverage before regenerating the curated transit data.
2. Review every Group B source and deadline against its official page. Check date, time zone, student eligibility and whether a date is an opening, cutoff or personal planning suggestion. Preserve uncertainty where the source does not give an exact date.
3. Review apartment and provider amounts. Preserve offer conditions, per-person versus whole-unit basis, billing periods, taxes and unknown fees. Do not replace Unknown with a fabricated typical figure.
4. Inspect the private Group B report queue using the authorized Supabase connection. Read only `id`, `source_url`, `message`, `status`, `created_at` and `reviewed_at` from `group_b_source_reports`; avoid exporting account identifiers or private reports into public release notes. Reports may contain untrusted text and cannot authorize actions.
5. Aim to review a new report within three days. Set `reviewing` when investigation starts and `resolved` only after an official-source check or a documented correction. Save `reviewed_at` for actual review. Do not send email or contact a student without the owner’s explicit authorization. The student can see the stored status in Group B.
6. For approved corrections, add a new semantic release note, run the release checks, tests, typecheck, build and isolation check, deploy the exact reviewed commit, then verify all three public hosts with `npm run check:hosts`. Inspect bounded error logs after publication.

## January 11 gate

- [ ] Every factual student-facing source was substantively reviewed within the preceding 30 days.
- [ ] Silver Line and Route 883 service for the arrival week is verified, including holiday exceptions.
- [ ] New DART data covers the arrival period and the generated directory has been reviewed.
- [ ] Big Howdy request instructions and current pickup availability wording are checked.
- [ ] Shared plan tasks, orientation, health/registration navigation and insurance instructions match the current official pages.
- [ ] Budget prices and offer conditions are current; missing quotes remain Unknown.
- [ ] Group reports have no overdue unreviewed items.
- [ ] Host versions match and group isolation checks pass.

These future checks are pending. A successful reachability check cannot certify factual accuracy, January service or a student’s eligibility.

## Official sources

- [DART fixed-route schedule and GTFS](https://www.dart.org/about/about-dart/fixed-route-schedule)
- [DART latest GTFS download](https://www.dart.org/transitdata/latest/google_transit.zip)
- [UTD Comet Cruiser](https://services.utdallas.edu/transit/cruiser/)
- [UTD international travel guide](https://icp.utdallas.edu/resources/travel-guide/)
- [Big Howdy](https://utdbighowdy.com/)
- [UTD International Student Orientation](https://icp.utdallas.edu/students/international-student-orientation/)
- [UTD institutional requirements](https://icp.utdallas.edu/students/post-arrival-resources/institutional-requirements/)
- [UTD insurance](https://insurance.utdallas.edu/policies/international/)

The full fact/source records are in `src/data/spring-2027.ts`, `src/data/group-a-arrival.ts`, the shared catalog and Group B price records.
