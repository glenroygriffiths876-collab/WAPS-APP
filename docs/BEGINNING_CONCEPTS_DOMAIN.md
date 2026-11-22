# WAPS / Beginning Concepts — two independent working addresses

## Approved goal

- Original GitHub Pages address (keep independent and operational): https://glenroygriffiths876-collab.github.io/WAPS-APP/
- Additional Beginning Concepts address: https://waps.beginningconcepts.org/
- App/community identity stays WAPS Communication / Western Autism Parents Support.
- Beginning Concepts is the developer/publisher; WAPS remains free.
- Both deployments use the same **WAPS-APP GitHub repository** and may update automatically on changes to `main`.
- **Never set a GitHub Pages Custom domain for this repository.** That changes its default address/redirect behavior. Do not commit a root `CNAME` file.

## Cloudflare Pages independent deployment (free tier)

1. In Cloudflare dashboard: **Workers & Pages → Create application → Pages → Import an existing Git repository**.
2. Connect GitHub and select the existing repository `glenroygriffiths876-collab/WAPS-APP` (do not duplicate or move the repo). Give the Pages project a distinct name such as `waps-communication`.
3. Production branch: `main`; framework preset: `None`; build command: `node scripts/build-cloudflare-pages.mjs`; output directory: `dist`; root directory: repository root.
4. Deploy and first verify the Cloudflare-generated `https://<project-name>.pages.dev/` address works (index, images, Talk, Practice, Maths, More, PWA manifest, share).
5. In that Cloudflare Pages project, open **Custom domains → Set up a domain**, enter `waps.beginningconcepts.org` and follow the activation prompts. Because `beginningconcepts.org` DNS is already in Cloudflare, Pages may create/adjust the DNS record automatically after confirmation.
6. **Important:** The existing Cloudflare DNS `waps` CNAME was initially pointed to `glenroygriffiths876-collab.github.io` for a *different* GitHub Pages custom-domain plan. For independent Cloudflare Pages hosting it must instead point to your new `<project-name>.pages.dev` hostname. Update/replace only the `waps` record, or allow Cloudflare Pages to manage it. Do not change apex or unrelated records.
7. Verify both URLs independently, preferably using two fresh browser sessions. Check HTTPS, assets, screen orientations, offline cache/service worker, installed app, Share/QR, Talk, Practice, Maths, caregiver settings, accessibility and backup/restore. The default GitHub Pages address must continue to display the app **without redirecting** to the Beginning Concepts address.
8. After verification, add the new address to the Beginning Concepts portfolio. Do not announce that the new address is live before HTTPS and functionality checks are confirmed.

## Data and installations

Although both addresses display the same code and design, browsers treat their saved data separately. Existing child profiles, communication boards, progress, settings and offline installations do not sync between origins. Use WAPS **More → App Settings → Backup & restore** to export data on the old GitHub address and import it on the new Beginning Concepts address. Do not suggest that user data is automatically synchronized or that a new install replaces an existing install.

## Scope and constraints

- This deployment is independent of the original GitHub Pages site; its GitHub Pages settings, CNAME and original URL remain unchanged.
- Existing app source, WAPS identity, approved Home artwork, interactions, learning activities and local storage schema must stay intact.
- GitHub connectors can edit application files but cannot click Cloudflare dashboard settings or authorize a new Cloudflare-to-GitHub connection. Activation requires the account owner to perform those Cloudflare interface steps.
- No paid hosting, separate duplicate GitHub repository or automatic data transfer is required.

Official instructions:
- https://developers.cloudflare.com/pages/get-started/git-integration/
- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
