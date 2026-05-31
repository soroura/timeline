# Deployment — EC + DP Timeline 2026

Target domain: **timeline.endura.assess.com**
Repo: **https://github.com/soroura/timeline.git**

This guide assumes **the VPS already has Nginx + certbot installed and runs other sites**. We're adding one new virtual host alongside the existing ones, without touching them.

---

## Part 1 — Push the local folder to GitHub

### One-time setup (laptop)

```bash
cd "/Users/soroura/Library/CloudStorage/OneDrive-WorldHealthOrganization/a-who26/work-plan/ec-dp-timeline"

# If git is already initialized, skip these 2 lines
git init
git branch -M main

# Add the remote (skip if already added)
git remote add origin https://github.com/soroura/timeline.git

git add .
git commit -m "Initial: EC + DP Timeline 2026 (phase-in v7) + concept page"
git push -u origin main
```

GitHub will prompt for credentials → use a **Personal Access Token** (Settings → Developer settings → Personal access tokens → Tokens classic, scope `repo`).

### Push future updates

```bash
git add . && git commit -m "Describe change" && git push
```

---

## Part 2 — Add as a new site on existing VPS

> **Assumptions**: Nginx is running, you have other sites in `/var/www/` or similar, `sites-available/` + `sites-enabled/` pattern is used, certbot is already installed.

### Step 1 — SSH in & confirm setup

```bash
ssh root@YOUR_VPS_IP    # or your-user@YOUR_VPS_IP

# Verify Nginx + certbot are present
nginx -v
certbot --version

# Look at what sites are already enabled (so we don't conflict)
ls /etc/nginx/sites-enabled/
ls /var/www/
```

If those commands fail, your VPS doesn't have the assumed setup — fall back to the full setup at the bottom of this file.

### Step 2 — Clone repo into its own folder

Pick a folder that doesn't collide with existing sites. Default: `/var/www/timeline`.

```bash
# Make sure target folder doesn't already exist
ls /var/www/ | grep timeline    # if anything shows up, change the path

# Clone
cd /var/www
git clone https://github.com/soroura/timeline.git
chown -R www-data:www-data /var/www/timeline
```

### Step 3 — Drop in the Nginx vhost

The repo already includes a ready-to-use `nginx.conf`. Copy it:

```bash
cp /var/www/timeline/nginx.conf /etc/nginx/sites-available/timeline.endura.assess.com
```

(Or open it with `nano` and inspect first.)

### Step 4 — Test for conflicts BEFORE enabling

```bash
# 1. Make sure no other vhost claims this domain
grep -r "timeline.endura.assess.com" /etc/nginx/sites-enabled/

# 2. Dry-run the new config
nginx -t
```

If `nginx -t` says **`syntax is ok` + `test is successful`**, proceed. If it complains, the new file has a syntax error — fix it before enabling.

### Step 5 — Enable the new site

```bash
ln -s /etc/nginx/sites-available/timeline.endura.assess.com /etc/nginx/sites-enabled/

# Re-test then reload (this WILL NOT affect other sites)
nginx -t && systemctl reload nginx
```

At this point: `http://timeline.endura.assess.com` is live (over HTTP).

### Step 6 — DNS (if not yet set)

At your DNS provider for `endura.assess.com`, add:

| Type | Host       | Value                | TTL  |
|------|------------|----------------------|------|
| A    | `timeline` | `<your VPS IP>`      | 3600 |

Wait 5-15 minutes. Verify:
```bash
dig timeline.endura.assess.com +short
# should print your VPS IP
```

### Step 7 — Add HTTPS for the new domain only

Certbot can add a cert for the new domain without touching any of your existing certs:

```bash
certbot --nginx -d timeline.endura.assess.com
```

When prompted:
- Email — same as for your other certs (or any address you control)
- ToS — agree
- Redirect HTTP → HTTPS — **choose option 2** (forced redirect)

Certbot edits ONLY the new vhost (`timeline.endura.assess.com`). Other sites stay untouched.

Verify:
```bash
curl -I https://timeline.endura.assess.com
# should return HTTP/2 200
```

Renewal is already handled by the existing systemd timer — no extra setup.

---

## Part 3 — Future updates

Laptop:
```bash
cd "/Users/soroura/Library/CloudStorage/OneDrive-WorldHealthOrganization/a-who26/work-plan/ec-dp-timeline"
git add . && git commit -m "Update content" && git push
```

VPS:
```bash
cd /var/www/timeline && git pull
# no nginx reload needed
```

### Optional — auto-pull from GitHub every 5 min

```bash
cat > /usr/local/bin/timeline-update.sh <<'EOF'
#!/bin/bash
cd /var/www/timeline && git pull --quiet && chown -R www-data:www-data /var/www/timeline
EOF
chmod +x /usr/local/bin/timeline-update.sh

# Append to crontab (preserves existing jobs)
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/timeline-update.sh") | crontab -
```

---

## Rollback / removal

If you ever need to remove this site cleanly:

```bash
# Disable site
rm /etc/nginx/sites-enabled/timeline.endura.assess.com
nginx -t && systemctl reload nginx

# Remove cert (optional)
certbot delete --cert-name timeline.endura.assess.com

# Remove files (optional)
rm -rf /var/www/timeline
```

Existing sites and certs are untouched.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `nginx -t` fails after copy | Syntax issue / duplicate `server_name` somewhere | `grep -r "server_name" /etc/nginx/sites-enabled/` and check duplicates |
| Other sites stopped after reload | A previous vhost had a catch-all `_` and our new vhost now beats it | Add explicit `server_name` to every other vhost too |
| `curl https://timeline...` → 404 | Wrong root path or files not pulled | `ls /var/www/timeline/index.html` should exist |
| Certbot fails | DNS hasn't propagated yet | Re-run `dig`, wait 5 min, retry |
| Site is HTTP only after certbot | You chose option 1 (no redirect) | Run `certbot --nginx -d timeline.endura.assess.com` again, choose 2 |
| Pushed but VPS shows old version | Forgot the pull | `cd /var/www/timeline && git pull` |
| Browser shows old version | Hard refresh | Cmd/Ctrl + Shift + R |

---

## Appendix — Fresh VPS (no Nginx yet)

Only use if your VPS doesn't have Nginx installed:

```bash
apt update
apt install -y nginx git certbot python3-certbot-nginx
systemctl enable --now nginx
ufw allow 'Nginx Full'    # if ufw is in use
```

Then resume from Step 2 above.

---

**Done. Site lives at https://timeline.endura.assess.com — alongside everything else already on your VPS.**
