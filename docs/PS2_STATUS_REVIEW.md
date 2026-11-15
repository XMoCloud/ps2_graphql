# Status and memory-card review

15 November 2026.

The authenticated [reference dashboard](https://01-dashboard-kappa.vercel.app/dashboard) was inspected, including its analytics requests. The [imsaud.me card stylesheet](https://www.imsaud.me/assets/index-Cc_hgopT.css) and live hover states were inspected for the full rotation, tilt and float.

## Overview

- Project results count graded attempts, retaining past failures even after the project is passed. Distinct progress rows provide the project attempt history; result rows are a fallback when no graded progress exists, preventing mirrored grades from being counted twice. Repeated source IDs are deduplicated. Null/absent grades are excluded; a grade of zero remains a failure. The separately displayed project total and Main projects memory card deduplicate normalized project names, including reissued objects/paths, while retaining their histories. Piscine quest/checkpoint contexts remain separate. An earlier pass still marks the memory-card save as passed.
- Skills Mastered counts distinct recorded skills, excluding curriculum metadata. This follows the reference's recorded-skill count rather than introducing an arbitrary proficiency threshold.
- Piscines Completed requires a passing record at the piscine root. Enrollment or completed exercises alone do not count as a completed piscine.
- User Distribution replaces Audit exchange. It switches between level and audit-ratio ranges, deduplicates students, omits unavailable values and highlights the account's current range. A separate All Reboot01 students / My cohort filter names the selected population and shows its count.
- Projects XP replaces Skill signal. Transactions are grouped by object and full path, including module awards for completing piscines. Negative corrections reduce the relevant award; duplicate transaction IDs do not increase XP. The legend displays two decimal places, and the center/tooltips expose the exact integer XP. Net-negative entries remain in totals and the list, while donut segments represent positive net awards.

## Data access

`ConsoleCommunity` pages through main-curriculum `event_user` rows, requesting only `id`, `userId`, `eventId`, `level` and `userAuditRatio`. `ConsoleCohorts` loads public cohort label metadata and maps the module/event identifiers in its descriptions to enrollment event IDs, following the reference dashboard. Split-piscine variants are grouped into one cohort; malformed labels are ignored. The live API returned 657 students overall and 130 in the signed-in account's Cohort 4. The graph explicitly covers main-curriculum students rather than applicants or piscine-only accounts. These community queries request no student names or contact details.

Personal progression, skill, audit and project histories continue to use the existing account-scoped paginated queries. Community requests omit the undeclared `userId` variable; personal requests retain it. Each query can fail independently without replacing successful personal statistics with sample data.

Live-account verification found an XP correction that the initial positive-only breakdown had omitted. After including signed corrections, the displayed exact module XP matched the server's module-XP aggregate. Private account responses and credentials were not saved in the repository or review captures.

The revised project-attempt calculation was also checked against live records: 29 passed attempts and 2 failed attempts across 33 unique projects, with 4 ungraded projects excluded. Both historical failures remain visible after their later passes.

## Audits and skills

Audits separates three questions: monthly given/received credit, the running contribution balance, and outcomes of given/received reviews. The repeated monthly review-count chart is replaced by the balance trend and stacked outcome chart. Outcomes distinguish passed, not passed, awaiting grade and closed without a grade. The target-ratio calculator and review history filtered by status remain functional.

Skills uses a full interactive SVG constellation/radar showing every recorded skill by default, with optional technology/technical filters. Hover or focus a labeled star to inspect its score, dates and recent gain; click or press Enter/Space to select its timeline. Live-account review confirmed all 17 actual skills appear. The mobile layout keeps the constellation and provides readable name/score controls for every skill below it. The redundant current-level and recent-growth bar panels are removed.

Gains compare personal bests before/after the last 90 days rather than summing score transactions, and future records are excluded. The history selector follows the active category. When all updates fall on one date, history shows an explicit dated score snapshot instead of an apparently empty chart. Multi-date histories retain the interactive step graph. Platform scores are not presented as professional proficiency.

## Cards, prompts and 404

Memory cards perform a six-second full turn and gentle float from their original resting tilt. Leaving hover returns the card to that exact pose over 450 ms; entering during the return continues from its current pose. A regression test covers repeated entry and return. They have a subtle dark halo and the same white selection glow used by save icons. The selection prompt is larger, blue and black outlined. The shared rectangular focus outline is suppressed for cards; the yellow title, arrow and glow provide focus feedback.

The six opaque card faces now project into a single high-resolution canvas, avoiding layered CSS 3D backface/compositing flashes over the live WebGL background. Perspective texture tiles overlap slightly to avoid antialiasing seams. There are no additional WebGL contexts or rendering dependencies, and idle cards stop requesting animation frames. The rear textures have white Reboot01, Go, JavaScript and Rust marks. Reduced motion keeps the model stationary with selection feedback.

The selection prompt and cards retain the open PS2 layout. Each card has a subtle dark outline and soft shadow behind its actual projected silhouette, following its hover rotation without a rectangular UI frame or another CSS filter. The desktop row becomes two columns on mobile.

The account footer's decorative keyboard prompts are removed. Functional keyboard navigation remains. The death screen contains only `404` and its return button; its background still uses red smoke and two cubes, with no crystal ring.

## Verification and captures

84 tests pass, including historical failures after a pass, repeated attempt IDs, mirrored grades, reissued project names, ungraded outcomes, zero grades, root completion, exact/signed XP, duplicate students, distribution boundaries, cohort mapping/filtering, all-skill visibility/selection, single-date history, repeated card-hover return, recent skill gains, historical balance, review states and query variable scope. The production build passes.

Browser checks cover live account loading without data warnings, matching the XP aggregate, all/cohort and level/ratio switching, exact project XP, all 17 actual skill stars and selecting a star's timeline, category switching, target ratio 2.0, a complete card turn captured in 13 frames, the exact same canvas pixels after un-hover, rear logos, no rectangular card outline, no decorative prompts, and a minimal 404. Desktop and phone layouts have no horizontal overflow. No JavaScript or shader errors were observed. All published captures below use sample records; private account captures remain excluded from Git.

- [Overview distributions and XP](visual-review/status-overview.webp)
- [Project attempts and unique project total](visual-review/status-project-results.webp)
- [Audit balance and outcomes](visual-review/status-audits.webp)
- [All-skill constellation](visual-review/status-skills.webp)
- [Memory-card rotation and closed shell](visual-review/status-cards-spin.webp)
- [White rear logos](visual-review/status-card-logos.webp)
- [Open memory cards with individual shadows](visual-review/status-cards-open.webp)
- [Open cards on mobile](visual-review/status-cards-open-phone.webp)
- [Phone layout](visual-review/status-phone.webp)
- [Minimal 404](visual-review/status-404.webp)
