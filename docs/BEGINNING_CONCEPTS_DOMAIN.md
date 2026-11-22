# WAPS / Beginning Concepts — safe domain activation

**App/community identity:** WAPS Communication / Western Autism Parents Support.
**Developer:** Beginning Concepts. **Proposed URL:** https://waps.beginningconcepts.org/
**Repository:** https://github.com/glenroygriffiths876-collab/WAPS-APP

## Release and DNS checklist

1. Run and pass the WAPS production quality, UI interaction smoke, and Home orientation checks for this PR. Review actual phone, tablet, landscape and desktop behavior. Keep the approved art and child activities unchanged.
2. Before switching the live site, ask existing users to back up their data using WAPS → More → App Settings → Backup & restore from the current GitHub URL.
3. Confirm the repository uses **GitHub Pages → Deploy from a branch → main / (root)**. In GitHub **Settings → Pages**, enter **waps.beginningconcepts.org** in Custom domain and save when release is ready. GitHub Pages should recognize the root CNAME file.
4. In **Cloudflare → beginningconcepts.org → DNS → Records**, ensure no conflicting record named waps exists, then create **Type CNAME**, **Name waps**, **Target glenroygriffiths876-collab.github.io**, **Proxy status DNS only** (grey cloud for initial certificate provisioning), **TTL Auto**. Do not include a repository path in the target. Leave all unrelated records untouched.
5. Wait for the GitHub Pages DNS check and SSL issuance. Turn on **Enforce HTTPS**, then test https://waps.beginningconcepts.org/ for valid SSL, assets, login-free use, Share, QR code, Service Worker, installability, Talk, Practice, Maths, settings, orientation and offline operation.
6. Have existing users restore their downloaded WAPS backup at the new address. Browser storage, PWA installs and offline caches do not automatically transfer across different domain origins.
7. Update the Beginning Concepts portfolio and any printed/shared QR codes only after verifying the new deployment. Keep the old GitHub address for reference/backup while practical.

**Do not merge or point DNS prematurely:** configuring GitHub Pages to use a custom domain may redirect the old GitHub URL, and an unverified DNS record can temporarily strand visitors. The GitHub connector cannot modify GitHub Pages repository settings or Cloudflare DNS. A repository CNAME is not proof that the new domain is active.

References: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site ; https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-subdomain/
