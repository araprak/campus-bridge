# Phase 0–4 verification record

Checked October 28, 2026. Source facts were reviewed October 27. Presentation date: October 29.

## Automated checks

- All 253 domain, API-boundary and database tests pass. Group storage tests cover verified sessions, cross-account isolation, grants, stale writes, removal/recreation revision protection and account-deletion cascades.
- Type checking, the production build and canonical release validation pass. The timeline preserves all 113 historical items.
- The built-server isolation check passes for Group A, Group B, the main host, look-alike hosts, wrong-group APIs, spoofed forwarded hosts and query selection. GitHub Actions runs these checks on each release.
- New production tables have row security enabled. The account-owned group tables and report queue were added through additive migrations; earlier migrations are preserved.

## Live checks

- The owner approved adding only Group A’s website to the existing Maps key. Existing website restrictions and the two allowed APIs were retained. The signed-in Group A map loaded community and campus pins without an authorization error.
- Both group accounts load their assigned published tools. Group A arrival saving and reloading, Group B budget and reminder saving, and restore in a second signed-in tab were exercised with presentation samples.
- A saved Spring orientation reminder exported a calendar file. Export does not prove a calendar provider delivered an alert.
- Both group workspaces were inspected at a 375 px browser viewport. This is responsive-browser evidence, not a test on a separate physical phone.
- The main site and both group sites reported the same v2.7.0 deployment before the v2.7.1 confirmation fix. Final host parity must be checked after the patch promotion.
- The v2.7.0 GitHub workflow passed. Its exact source tree was deployed, the staged version endpoint returned 2.7.0, and the same deployment was promoted. Bounded error logs returned no errors during that observation window.

## Pending checks that cannot be certified in advance

The venue network, two full team rehearsals, a separate physical phone/device and presentation-morning check remain pending. No existing real account was permanently deleted during browser testing; deletion behavior is covered by isolated database and account-workflow tests.

DART’s latest available feed still ends December 6, 2026. January 11 Silver Line/Route 883 service and the January 11 source freshness gate require later review. The daily intake follow-up is active through January 22, with weekly factual reviews and report triage. Missing prices remain Unknown. Phase 5 has not started.
