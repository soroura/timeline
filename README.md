# EC + DP Timeline 2026 — Static site

Self-contained static site for the **Emergency Care + Disaster Preparedness** integrated capacity-building program.
Period: **14 Jun 2026 → 17 Dec 2026** · 27 weeks · 170 events · 1,420 trainees · 6 entities · 12 hospitals.

Target deployment domain: **timeline.endura-assess.com**

---

## Pages

| File | Purpose |
|---|---|
| `index.html` | Hero home — landing page |
| `combined.html` | Master view (all 4 layers stacked, filterable) |
| `layer-1.html` | Layer 1 — BEC base stream (foundation) |
| `layer-2.html` | Layer 2 — Monthly P / D-TOT |
| `layer-3.html` | Layer 3 — Hospital microlearning + culmination |
| `layer-4.html` | Layer 4 — Program closings (EC + D/MCM) |
| `calendar.html` | Full monthly calendar — every event placed on actual date |
| `day-level.html` | Day-by-day ledger — sortable + filterable |
| `assets/shared.css` | Editorial theme + nav styles |
| `assets/nav.js` | Top navigation injected on every page |

No build step. No backend. Pure HTML/CSS/JS — all data lives in the page scripts.

---

## Local preview

Pick a port that's free locally. Suggested defaults (in order of preference):

- **8765** — uncommon, almost always free
- **4321** — uncommon
- **9876** — uncommon

Avoid: 80, 3000, 4000, 5000, 5173, 5500, 8000, 8080, 8888, 9000 (often in use).

```bash
cd ec-dp-timeline
python3 -m http.server 8765
# → open http://localhost:8765
```

Or with Node:
```bash
npx serve -p 8765 .
```

---

## Deployment to `timeline.endura-assess.com`

### Option A — Static host (fastest)

Drop the `ec-dp-timeline/` folder onto any static host:

- **Netlify** — drag-and-drop the folder, set custom domain `timeline.endura-assess.com`
- **Vercel** — `vercel --prod` from the folder; add custom domain
- **GitHub Pages** — push to a repo, enable Pages, configure CNAME
- **Cloudflare Pages** — connect to git, deploy

For all of these, you'll need to add a `CNAME` (or `A`) DNS record pointing `timeline.endura-assess.com` to the host.

### Option B — Nginx (self-hosted)

Container build:

```bash
docker build -t ec-dp-timeline .
docker run -d --name ec-dp-timeline -p 8765:80 ec-dp-timeline
# → http://localhost:8765
```

Or copy the contents of this folder to your web root (`/usr/share/nginx/html` or `/var/www/html`) and use the provided `nginx.conf` as a starting point.

### Option C — AWS S3 + CloudFront

```bash
aws s3 sync . s3://timeline-endura-assess-com/ --exclude "*.md" --exclude "Dockerfile" --exclude "nginx.conf"
```

Then point CloudFront → S3, attach the ACM cert, and CNAME the domain.

---

## DNS setup (for any deployment option)

Add this record at your DNS provider for `endura-assess.com`:

| Type  | Host       | Value                    | Notes |
|-------|------------|--------------------------|-------|
| CNAME | `timeline` | `<your-host>.netlify.app` (or equivalent) | Static-host deployment |
| A     | `timeline` | `<server IP>`            | Self-hosted Nginx |

---

## Maintenance / updates

Each page is self-contained. To change rules (e.g., entity rotation, cohort length), edit the JavaScript inside the relevant page — no rebuild needed, just refresh the browser.

All data is generated inside the page scripts (no external data file). To change start date, modify `START = new Date(Date.UTC(2026, 5, 14))` in each page's script.

---

## Future layers

Hooks ready for additional layers:
- Layer 5 — JOINT events (once defined)
- Layer 6 — Agenda detail per event (planned)

Adding a new layer: copy `layer-1.html` as a template, update content, add a link to `assets/nav.js` and to the hero `index.html`.

---

**Built for WHO Country Office Egypt · 2026.**
