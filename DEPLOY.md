# Deployment — EC + DP Timeline 2026

**Domain:** `timeline.endura-assess.com`
**Repo:** `https://github.com/soroura/timeline.git`
**VPS:** `217.76.56.188`
**Stack:** Cloudflare DNS (proxied) → Nginx Proxy Manager (NPM UI) → Docker `nginx:alpine` container serving the static files

---

## What's already done ✅

- DNS record `timeline.endura-assess.com → 217.76.56.188` (Proxied via Cloudflare orange cloud)
- VPS has Nginx Proxy Manager running with UI at `addresses.ahmedsorour.com/nginx/proxy`
- Docker is running on the VPS
- Cloudflare account active (you've used Origin Certificates before)

## What we'll do now 🚀

1. Push the site to GitHub
2. Clone to VPS and run a tiny Docker container that serves the files on port `8090`
3. Add a Proxy Host in NPM UI → forwards `timeline.endura-assess.com` to `<VPS-IP>:8090`
4. SSL via Cloudflare Origin Certificate (15-year cert, generated in Cloudflare, installed in NPM)
5. Set Cloudflare SSL mode to `Full (strict)` so the proxied connection is fully encrypted

---

## Step 1 — Push to GitHub (laptop, one-time)

```bash
cd "/Users/soroura/Library/CloudStorage/OneDrive-WorldHealthOrganization/a-who26/work-plan/ec-dp-timeline"

# If git not initialised yet:
git init && git branch -M main
git remote add origin https://github.com/soroura/timeline.git

git add .
git commit -m "Initial: EC + DP Timeline 2026"
git push -u origin main
```

GitHub auth → use a **Personal Access Token** (Settings → Developer settings → Personal access tokens → Tokens classic, scope `repo`).

For future updates:
```bash
git add . && git commit -m "..." && git push
```

---

## Step 2 — Clone on VPS and run the container

SSH into the VPS:
```bash
ssh root@217.76.56.188      # or your-user@217.76.56.188
```

Clone repo to a clean folder:
```bash
mkdir -p /opt/timeline
cd /opt
git clone https://github.com/soroura/timeline.git
cd timeline
```

Start the container (it reads `docker-compose.yml` from the repo):
```bash
docker compose up -d
```

Verify:
```bash
docker ps | grep timeline-site
curl -I http://localhost:8090/      # should return HTTP/1.1 200 OK
curl -I http://217.76.56.188:8090/  # same from outside (if firewall allows)
```

If port `8090` is already taken on the VPS, edit `docker-compose.yml` (change `8090:80` to another free port like `8765:80`, `8091:80`, etc.) and `docker compose up -d` again.

---

## Step 3 — Add a Proxy Host in NPM UI

Open **`https://addresses.ahmedsorour.com/nginx/proxy`** in your browser → log in.

Click **`Add Proxy Host`** (top right).

### Details tab

| Field | Value |
|---|---|
| **Domain Names** | `timeline.endura-assess.com` (press Enter to add) |
| **Scheme** | `http` |
| **Forward Hostname / IP** | `217.76.56.188` |
| **Forward Port** | `8090` |
| **Cache Assets** | ✅ ON |
| **Block Common Exploits** | ✅ ON |
| **Websockets Support** | ⬜ OFF (not needed for static site) |

Click **Save** (don't enable SSL yet — we do it in Step 4).

### Verify HTTP works first

Open in browser: **`http://timeline.endura-assess.com`**

(May need to use a private/incognito tab to bypass HTTPS auto-upgrade. You should see the site loading over HTTP. If you get a 502 or 504, check `docker ps`, `curl http://217.76.56.188:8090/`, and NPM logs.)

---

## Step 4 — SSL via Cloudflare Origin Certificate

This gives you a 15-year cert. Free. Works perfectly with Cloudflare proxied DNS.

### Part A — Generate the cert in Cloudflare

1. Log into Cloudflare → select **endura-assess.com** zone
2. Left sidebar → **SSL/TLS** → **Origin Server**
3. Click **`Create Certificate`**
4. **Hostnames covered**: keep the defaults (`*.endura-assess.com` and `endura-assess.com`) — this single cert will cover any subdomain (timeline, disaster, www, etc.)
5. **Key type**: RSA (2048)
6. **Certificate Validity**: 15 years
7. Click **Create**
8. Two text boxes appear:
   - **Origin Certificate** (PEM) — copy this
   - **Private Key** (PEM) — copy this
9. **Keep this tab open** — Cloudflare doesn't show the private key again after you leave

### Part B — Add the cert in NPM

1. NPM UI → top menu **`SSL Certificates`**
2. Click **`Add SSL Certificate`** → **`Custom`**
3. Fill in:
   - **Name**: `Cloudflare Origin — *.endura-assess.com`
   - **Certificate Key**: paste the **Private Key** from Cloudflare
   - **Certificate**: paste the **Origin Certificate** from Cloudflare
   - **Intermediate Certificate**: leave blank
4. Click **Save**

### Part C — Attach the cert to the Proxy Host

1. NPM UI → **`Hosts`** → **`Proxy Hosts`**
2. Find `timeline.endura-assess.com` → click **⋮** → **Edit**
3. Go to the **SSL** tab
4. **SSL Certificate**: select `Cloudflare Origin — *.endura-assess.com` from the dropdown
5. Toggles:
   - ✅ **Force SSL**
   - ✅ **HTTP/2 Support**
   - ✅ **HSTS Enabled**
   - ⬜ HSTS Subdomains (only if you want this enforced on all subdomains)
6. Click **Save**

### Part D — Set Cloudflare encryption mode

Back in Cloudflare → endura-assess.com → **SSL/TLS** → **Overview**:
- Encryption mode: **Full (strict)** ← important! Cloudflare will verify the Origin Cert you just installed.

If it's currently on `Flexible`, switching to `Full (strict)` makes the end-to-end connection encrypted.

---

## Step 5 — Verify

Open **`https://timeline.endura-assess.com`** in a fresh browser tab.

- 🟢 You should see the site with the padlock icon
- Click the padlock → should show Cloudflare as the certificate issuer (because Cloudflare proxy is in front)
- All pages, nav, and assets should load correctly

Test the routes:
- `/` (home)
- `/concept.html`
- `/calendar.html`
- `/day-level.html`
- `/combined.html`
- `/layer-1.html` ... `/layer-4.html`

---

## Step 6 — Future updates

Whenever you change a page:

**Laptop:**
```bash
cd "/Users/soroura/Library/CloudStorage/OneDrive-WorldHealthOrganization/a-who26/work-plan/ec-dp-timeline"
git add . && git commit -m "Update content" && git push
```

**VPS:**
```bash
cd /opt/timeline && git pull
# Container picks up changes immediately (read-only volume mount)
# Cloudflare cache may take a few minutes; you can purge manually:
#   Cloudflare → endura-assess.com → Caching → Configuration → Purge Everything
```

### Optional — auto-pull every 5 min

```bash
cat > /usr/local/bin/timeline-update.sh <<'EOF'
#!/bin/bash
cd /opt/timeline && git pull --quiet
EOF
chmod +x /usr/local/bin/timeline-update.sh

(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/timeline-update.sh") | crontab -
```

---

## Rollback

To take the site down without removing it:
- NPM UI → Hosts → Proxy Hosts → toggle the **Enabled** switch off
- Or `docker compose down` in `/opt/timeline`

To remove completely:
```bash
cd /opt/timeline
docker compose down
cd /opt && rm -rf timeline
# NPM UI: delete the proxy host + (optionally) the SSL certificate
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| NPM says 502 Bad Gateway | Container not running or wrong port | `docker ps`, `docker compose logs`, verify port `8090` |
| `curl http://217.76.56.188:8090` works but NPM 502 | VPS firewall blocks intra-host requests | NPM is on same host — should work; double-check IP in NPM Forward field |
| Cloudflare error 521 | VPS not reachable on origin port | Check `curl -I http://217.76.56.188` (NPM handles port 80) |
| Cloudflare error 525 / SSL handshake failed | SSL mode is "Full (strict)" but NPM cert mismatch | Re-check the Origin Cert was pasted correctly; or switch CF to "Full" temporarily |
| Browser shows old version after push | Cloudflare cache | Purge in CF dashboard (Caching → Purge Everything) or hard-refresh |
| Want to add another subdomain later | Same Origin Cert works for ALL `*.endura-assess.com` | Just add new Proxy Host in NPM and select the same cert |

---

**Done. Site at https://timeline.endura-assess.com — fully encrypted, served via your existing NPM + Cloudflare stack.**
