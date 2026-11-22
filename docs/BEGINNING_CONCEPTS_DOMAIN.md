# WAPS — Beginning Concepts: two links, ONE website

**Goal:** Both existing and new shared links must successfully take people to the very same WAPS Communication app. No duplicate hosting or separate app.

- Existing bookmarked link: https://glenroygriffiths876-collab.github.io/WAPS-APP/
- New branded address: https://waps.beginningconcepts.org/
- **What happens:** The old GitHub Pages URL *redirects* to the new address. Either link opens WAPS. GitHub Pages continues to host everything from the existing `WAPS-APP` repository.
- The community identity remains **Western Autism Parents Support**. **Beginning Concepts** is credited as the developer.
- Do not set up Cloudflare Pages or a second deployment.

## Configuration

1. In Cloudflare **DNS** for `beginningconcepts.org`, ensure the existing record for `waps` is **CNAME → glenroygriffiths876-collab.github.io**, with **DNS only** (grey cloud) initially. Do not modify other records.
2. In the existing GitHub repository, open **Settings → Pages** and configure **Custom domain** to `waps.beginningconcepts.org`, then Save. The published branch's root `CNAME` file should contain that exact hostname.
3. After the Pages build and certificate provisioning, use **Enforce HTTPS**.
4. Test **both links**: the branded URL opens WAPS directly; the GitHub URL automatically redirects to the branded URL and still opens the same WAPS Home, Talk, Practice and More experience.
5. Test HTTPS, artwork loading, interactive activities, share links, PWA installation, mobile/tablet/desktop layout, and core offline behavior.

## Important existing-user data note

The *links* lead to the same app, but browsers associate local WAPS profiles, progress, board customization and settings with the original website address. Data **do not automatically migrate to the new address when the old URL redirects**. If families have saved data at the old GitHub URL, encourage them to export it through **More → App Settings → Backup & restore** *before the redirect is activated*, then restore the backup on the branded URL.

## Verification status

The GitHub repository change and automated tests can be checked in GitHub; real-world HTTPS/DNS checks must be confirmed against the live URLs. Do not claim the branded link is active before checking it in a browser.

Official documentation: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
