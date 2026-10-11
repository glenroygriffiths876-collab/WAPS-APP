# WAPS — Protected Features & Release Rules

## This document is binding for future WAPS development

Fixing one issue must not silently undo a previously approved design or feature. The currently approved Home designs, child-friendly Talk, Practice, Maths, learning sections, parent Settings, storage, accessibility, and phone/tablet/desktop responsiveness are preserved unless the owner **explicitly requests** a change.

### Non-negotiable release process

1. **Before editing:** Identify the precise reported defect, affected files, and approved behavior that must remain unchanged. Work on a named feature/fix branch, never casually edit `main`.
2. **Smallest safe change:** No unrelated styling, icon, homepage, audio, storage, data format, feature, or routing edits. No substituting approved art or rearranging screen sections.
3. **Pre-merge CI must be green:** `WAPS production quality gate`, `WAPS UI interaction smoke test`, and `WAPS Home orientation regression`. Fix all relevant failures; don't call a failing workflow a pass.
4. **Cross-device gate:** Test small phone portrait and landscape, tablet portrait and landscape (including switching live), and desktop. Confirm Home art and tappable hotspots, Talk AAC, Practice choices/support, other learning entries, and parent Settings.
5. **Visual approval:** Inspect the CI's `waps-responsive-qa` screenshots when changing anything visual. Automated functionality checks alone do not prove visual quality. Approved artwork is hash-protected.
6. **Offline/version gate:** Update `index.html` JS/CSS versions and `sw.js` cache together for changed UI code. Keep the PWA orientation flexible and core functionality available.
7. **Never claim full test coverage:** Clearly state exactly what passed, what remains untested, and whether the update is merged and GitHub Pages has deployed.
8. **Recovery:** If a new release causes a regression, revert the offending change and re-run the gates before attempting an alternative.

### Current approved Home artwork — LOCKED

- `assets/ui/v59/home-landscape.b64`
- `assets/ui/v59/home-portrait-1.b64`
- `assets/ui/v59/home-portrait-2.b64`

The contract `scripts/approved-release-contract.mjs` verifies the artwork hashes. The production layout uses a distinct approved artboard per orientation, with device-appropriate sizing; the correct landscape art must **never** be a tiny portrait island on a wide tablet.

### CI and test organization

- `tests/home-orientation.spec.js` is the locked Home layout/rotation baseline.
- `tests/core-regression.spec.js` is the evergreen, release-blocking test of key activities across devices.
- `tests/ui.spec.js` is **historical**. Its 41 accumulated cases reference obsolete v50/v51/v55 screens and cannot be treated as a reliable release gate without updating their selectors/expectations. Do not delete it; modernize relevant tests into the evergreen suite.

### Branch protection to configure in GitHub (repository administrator)

In **Settings → Branches → Add branch protection rule** for `main` (or Settings → Rules → Rulesets, if available):

- Require a pull request before merging.
- Require passing status checks: `quality`, `ui`, and `responsive-home` from the named workflows.
- Require branches to be up to date before merging (if supported).
- Restrict direct pushes/bypasses, including administrators if that is the intended policy.

**Important:** CI tests by themselves do not prevent someone from merging/pushing despite failure. Branch protection is the separate enforcement layer. The GitHub connector used to implement these files cannot alter those repository settings directly.

### Validation scope

Automated tests reduce regression risk but do not guarantee zero defects, clinical validation, or perfect behavior on every device. Real-device review is especially important for Android installed-PWA rotation and audio.
