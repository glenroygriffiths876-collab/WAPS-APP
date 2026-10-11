# WAPS developer/agent instructions (all future changes)

The highest project priority is **preserve all approved behavior while fixing the specific defect**. Read [REGRESSION_POLICY.md](REGRESSION_POLICY.md) before editing. This file applies to all agents and maintainers working in this repository.

## Non-negotiable rules

1. Never change another feature, image, layout, setting, route, saved data format, speech control, or activity while addressing an unrelated issue.
2. Preserve the exact approved v59 portrait and landscape Home artwork and their clickable hotspot positions. Landscape tablet **must show landscape art**, not a shrunken portrait view. Desktop must keep approved wide proportions.
3. Phone is the primary experience; preserve functionality on small phones, larger phones, tablets (both orientations), and desktops. Rotate during testing.
4. Keep child learning screens quiet and non-overwhelming. Never cover the activity choices with support or feedback controls.
5. Preserve the correct-first-response record in Practice and caregiver-controlled answer reveal. Never turn mistaken guesses into independent successes.
6. Do not mark tests successful without seeing their actual results. Before merging, require production quality gate, UI interaction smoke test, and Home orientation regression to pass.
7. Verify Talk AAC, Practice, Maths, Match & Understand, settings, navigation, sound, accessibility, storage, offline PWA, and install cache where affected. Extend the release tests when a new bug is fixed.
8. Make only small, reviewed changes on a feature branch. Update JS/CSS versions and service worker together when app code changes.
9. If tests fail, **do not merge**. Fix the code or correct genuinely obsolete test expectations transparently. Never silence or disable a valid failing test.
10. In updates to the owner, distinguish verified results, untested areas, and live deployment status. Never guarantee zero bugs or claim a release is safe before verification.

The current official CI tests and approved-art hashes are documented in [REGRESSION_POLICY.md](REGRESSION_POLICY.md). A GitHub administrator must configure `main` branch protection requiring successful checks; repository files alone cannot enforce that setting.
