## Defect or improvement
Describe the exact user-reported problem and the intended behavior.

## Scope and protected functionality
- [ ] Only relevant files changed; no unrelated features/designs modified
- [ ] Approved portrait/landscape art and layout unaffected, or explicitly approved
- [ ] Talk Board, Practice, Maths, Settings, routing, audio, storage remain intact
- [ ] Phone, tablet, landscape and desktop behavior reviewed
- [ ] Installed app/offline cache version updated if UI code changed

## Proof before merge
- [ ] Production quality gate **passed**
- [ ] UI interaction smoke test **passed**
- [ ] Home orientation regression **passed**
- [ ] Visual screenshots reviewed if UI changed
- [ ] Existing supported functionality checked; unresolved limits disclosed

## Rollback
Specify exactly how to revert this change if it regresses anything.

Do not merge red checks and do not imply a full validation if only part of the suite passed. See [REGRESSION_POLICY.md](../REGRESSION_POLICY.md).
