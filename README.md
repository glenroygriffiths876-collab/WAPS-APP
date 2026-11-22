# WAPS Communication — Ceiling Release

**Every Child Has Something to Say.**

A free, private, offline-first caregiver-guided communication platform designed to help families create useful communication opportunities in everyday life. WAPS supports multimodal communication including speech, AAC, gesture, pointing, pictures, signs and typing. It does not diagnose or replace individualized professional assessment when that is needed.

## Deploy to GitHub Pages
Upload the contents of this package to the repository root. In GitHub: **Settings → Pages → Deploy from a branch → main → /(root)**. All application paths are relative so project-site deployment is supported.

## Major systems
WAPS Talk AAC; Partner Mode; guided Today session; Communication Discovery; 40 practice families; 150 packaged concept assets; Live Coach; 18 routine guides; no-material interactions; real-life/generalization records; prompting and spontaneity records; progress; multiple child profiles; goals; visual supports; Child Mode; Caregiver Academy; printable caregiver handbook; Help Me Now; professional summary/report; IndexedDB; backup/restore; offline PWA.

## Privacy
No ads, trackers, analytics, account or silent cloud upload are included. Core user data remain in the browser. Browser storage can be cleared or lost, so WAPS provides export/restore.

## Validation boundary
The software contains evidence-informed caregiver-support content and explicitly avoids standardized-test reproduction and diagnostic claims. Formal clinical validation, Jamaican-language review, autistic/AAC-user review and real-device/user studies are external validation steps rather than claims made by this package.

## Beginning Concepts identity and custom domain

WAPS remains **WAPS Communication — Western Autism Parents Support**. **Beginning Concepts** is credited as the developer. The proposed public address is **https://waps.beginningconcepts.org/**. The WAPS artwork, activities, accessibility and caregiver features must remain unchanged.

**Dual-domain deployment:** Keep the original GitHub Pages URL independent and unchanged, and separately publish the same WAPS repository on **Cloudflare Pages** for `waps.beginningconcepts.org`. See [`docs/BEGINNING_CONCEPTS_DOMAIN.md`](docs/BEGINNING_CONCEPTS_DOMAIN.md). Do not set a custom domain in the GitHub repository's Pages settings or commit a GitHub Pages `CNAME` file: that can redirect the old address. New domains have separate browser storage, so existing users must export and restore profiles/progress if they want their data on both links.
