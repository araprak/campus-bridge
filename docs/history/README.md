# CampusBridge historical change log

September 24–October 22, 2026 · Review copy dated October 23, 2026.

This archive transcribes all 113 numbered entries from the supplied CampusBridge_Change_Log.docx into ten linked historical groups. It preserves the original entry IDs, descriptions, statuses, and date wording.

**The labels v0.1–v2.3 are editorial review groupings, not deployment tags or certified releases.** Dates describe recorded discussion or request windows unless explicitly stated otherwise. The source did not read the underlying repository or deployment audit trail. All cross-check cells were blank, so this archive does not assign new verification results.

The separately published three-part releases, beginning with v1.0.0, are available on [Version history](https://campusbridgeguide.com/releases). The historical v1.0 grouping below is distinct from release v1.0.0.

## Historical index

| Label | Recorded date or request window | Editorial milestone | Entries |
| --- | --- | --- | --- |
| [v0.1](v0.1.md) | September 24, 2026 | Initial website blueprint / pre-launch specification | 13 |
| [v1.0](v1.0.md) | By September 28, 2026 | First website reported deployed | 12 |
| [v1.1](v1.1.md) | September 28, 2026 | Immediate post-deployment personalization requests | 12 |
| [v1.2](v1.2.md) | October 6–7, 2026 | Expanded customer-journey feedback and usability requests | 14 |
| [v1.3](v1.3.md) | October 8, 2026 | Housing comparison and rating design iteration | 11 |
| [v1.4](v1.4.md) | October 2026; exact request date to verify | Google Maps Housing Explorer integration specification | 12 |
| [v2.0](v2.0.md) | October 2026; audit/refinement window | Core logic and task-management stabilization | 11 |
| [v2.1](v2.1.md) | October 2026; latest status to cross-check | Authentication, privacy, and account lifecycle | 10 |
| [v2.2](v2.2.md) | October 2026; latest requirements before October 22 | Transportation and service-guidance enhancements | 10 |
| [v2.3](v2.3.md) | October 22, 2026 | Future roadmap and verification backlog | 8 |

## Status definitions from the source

These definitions describe the original worksheet, not a fresh audit.

| Recorded status | Meaning |
| --- | --- |
| BASELINE | Planned before website implementation. |
| REPORTED | Described as existing in conversations/site material; confirm by testing. |
| REQUESTED | User explicitly asked for this change; check whether it shipped. |
| ISSUE / QA | Potential or reported defect; reproduce and check fix. |
| PROPOSED | Future backlog or integration spec; do not mark built until tested. |
| REPORTED COMPLETE | Described as completed; independently confirm production behavior. |

## Original verification worksheet and source trail

The following checklist and source trail were included in the original document. They remain historical reference material, with no completion results added.

### Verification worksheet

Use this checklist after comparing the document to the deployed site, repository commits, deployment logs, and screenshots.

- [ ] Locate first working deployment and exact launch date.
- [ ] Retrieve Vercel deployments and Git commit history between Sep. 24 and Oct. 22.
- [ ] Compare v1.0 recorded features with the oldest accessible build or screenshot.
- [ ] For each requested feature, record the commit/deployment in which it actually shipped.
- [ ] Perform signed-in testing of onboarding, account creation, verification, reset, and deletion.
- [ ] Test all three central situations: pre-arrival off-campus/no housing; off-campus housing selected; on-campus included utilities.
- [ ] Check Housing Explorer filters, apartment detail accuracy, comparison, saves, rating attribution, and Google Map controls.
- [ ] Test phone and desktop display, relevant resource URLs, and correct travel modes.
- [ ] Test changing one answer without resetting unrelated completed tasks.
- [ ] Record any feature that exists only in slides/specifications but not in production.
### Known source trail

- September 24: CampusBridge MVP Product Specification v0.1 and website-build conversation; original concept and proposed flows.
- September 28: deployed-site report and early post-deployment changes (housing dropdown, priorities, countdown, ZIP-aware utilities).
- October 6–7: presentation/website feedback covering housing inventory, maps, login, undo, service options, transportation, campus, and UI.
- October 8: Housing Explorer sorting, ratings, and broader apartment inventory requests.
- October: CampusBridge roadmap and Google Maps technical instructions, including explicit testing and data-accuracy cautions.
- October 22: wider site-audit and roadmap conversations for task logic, account functionality, transportation, service guidance, and future opportunities.
- Product Alchemy CampusBridge Product Direction.pptx; Product Alchemy Assign 2-CampusBridge.pptx; CampusBridge_Product_Direction_with_Image_Placeholders.pptx support product vision but are not website deployment proof.
Source limitation: the underlying repository and deployment audit trail were not read for this document. Dates on requested and planned items are conversation/request windows, not verified release dates. Entries are split into small units to make verification easy, not to claim a separate code change for each one.


## Import record

Imported October 24, 2026 from the user-supplied review copy. Word document properties and default template timestamps were not used as evidence for release dates.

Source SHA-256: `4e83ba9933cde33ccb5a9ba969d85c4408759b981b6df17dac5651c0245180f0`
