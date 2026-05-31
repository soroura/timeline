# Deployment — EC + DP Timeline 2026

**Domain:** `timeline.endura-assess.com`
**Repo:** `https://github.com/soroura/timeline.git`
**VPS:** `217.76.56.188`
**Stack:** Cloudflare DNS (proxied) → Nginx Proxy Manager (NPM UI) → Docker `nginx:alpine` container on port `8095`

---

## Already done ✅

- DNS record `timeline.endura-assess.com → 217.76.56.188` (Cloudflare proxied)
- VPS has Nginx Proxy Manager UI at `addresses.ahmedsorour.com/nginx/proxy`
- Docker is running
- Cloudflare wildcard cert exists for `*.endura-assess.com` (reusable for this subdomain)

---

## Step 1 — Push to GitHub (laptop)

```bash
cd "/Users/soroura/Library/CloudStorage/OneDrive-WorldHealthOrganization/a-who26/work-plan/ec-dp-timeline"
git add . && git commit -m "Site for deployment" && git push
```

(First-time: `git init && git branch -M main && git remote add origin https://github.com/soroura/timeline.git && git add . && git commit -m "Initial" && git push -u origin main`. Auth: Personal Access Token.)

---

## Step 2 — On the VPS: clone + start container

```bash
ssh root@217.76.56.188

cd /opt
git clone https://github.com/soroura/timeline.git
cd timeline
docker compose up -d

# Verify
docker ps | grep timeline-site
curl -I http://localhost:8095/      # → HTTP/1.1 200 OK
```

If port `8095` is taken, edit `docker-compose.yml` (change `8095:80`) and `docker compose up -d` again.

---

## Step 3 — NPM UI: add the Proxy Host

Open **`https://addresses.ahmedsorour.com/nginx/proxy`** → **Add Proxy Host**

### Details tab

| Field | Value |
|---|---|
| Domain Names | `timeline.endura-assess.com` |
| Scheme | `http` |
| Forward Hostname / IP | `217.76.56.188` |
| Forward Port | `8095` |
| Cache Assets | ✅ |
| Block Common Exploits | ✅ |
| Websockets Support | ⬜ |

**Save.**

Quick test (incognito tab to avoid HTTPS auto-upgrade): `http://timeline.endura-assess.com` → site should appear.

---

## Step 4 — Skip if you have a Cloudflare Origin cert ✋

If you already have a `*.endura-assess.com` cert in NPM (or elsewhere), **skip ahead to Step 5**.

### Step 4 — Only if you need a NEW cert

1. Cloudflare → **endura-assess.com** → **SSL/TLS** → **Origin Server** → **Create Certificate**
2. Hostnames: defaults (`*.endura-assess.com, endura-assess.com`)
3. RSA, 15 years → **Create**
4. Copy the **Certificate** and **Private Key** (key shown ONCE)
5. NPM UI → **SSL Certificates** → **Add Custom**
   - Name: `Cloudflare Origin — *.endura-assess.com`
   - Paste certificate + private key
   - **Save**

---

## Step 5 — Attach the cert to the Proxy Host

1. NPM UI → **Hosts** → **Proxy Hosts** → edit `timeline.endura-assess.com`
2. **SSL** tab
3. **SSL Certificate** dropdown → select your existing `*.endura-assess.com` cert
4. Toggles:
   - ✅ **Force SSL**
   - ✅ **HTTP/2 Support**
   - ✅ **HSTS Enabled**
5. **Save**

---

## Step 6 — Confirm Cloudflare SSL mode

Cloudflare → **endura-assess.com** → **SSL/TLS** → **Overview**

Encryption mode should be **Full (strict)**. It almost certainly already is (your other endura-assess sites use it).

---

## Step 7 — Test

Open **`https://timeline.endura-assess.com`** → padlock visible, every page loads:
- `/` (home)
- `/concept.html`
- `/calendar.html`
- `/day-level.html`
- `/combined.html`
- `/layer-1.html` ... `/layer-4.html`

---

## Future updates

**Laptop:**
```bash
cd "/Users/soroura/Library/CloudStorage/OneDrive-WorldHealthOrganization/a-who26/work-plan/ec-dp-timeline"
git add . && git commit -m "..." && git push
```

**VPS:**
```bash
cd /opt/timeline && git pull
```

Container picks up changes immediately (read-only volume mount). If Cloudflare shows stale → CF Dashboard → Caching → **Purge Everything**.

### Optional auto-pull

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

- Pause site: NPM UI → toggle Proxy Host **Enabled** off
- Stop container: `cd /opt/timeline && docker compose down`
- Remove entirely: `docker compose down && cd /opt && rm -rf timeline` + delete proxy host in NPM

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| NPM 502 Bad Gateway | `docker ps`; `curl http://localhost:8095/`; verify port in NPM matches docker-compose |
| Cloudflare 521 | VPS not reachable; check NPM is running, container on right port |
| Cloudflare 525 (SSL handshake) | Wrong cert attached, or CF mode mismatch; switch CF to "Full" temporarily, fix, then back to "Full (strict)" |
| Browser shows old version | CF cache: purge in dashboard, or hard-refresh |
| New subdomain later | Same Origin Cert covers all `*.endura-assess.com` — just add new Proxy Host and select the same cert |

---

**Done. Site at https://timeline.endura-assess.com — fully encrypted, via your existing NPM + Cloudflare stack.**
