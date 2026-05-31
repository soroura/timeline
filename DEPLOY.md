# Deployment — EC + DP Timeline 2026

Target domain: **timeline.endura.assess.com**
Repo: **https://github.com/soroura/timeline.git**

Two parts:
1. Push this folder to GitHub
2. Deploy on a VPS with Nginx (+ free SSL via certbot)

---

## Part 1 — Push to GitHub

### One-time (your laptop)

```bash
# 1. Move into the site folder
cd "/Users/soroura/Library/CloudStorage/OneDrive-WorldHealthOrganization/a-who26/work-plan/ec-dp-timeline"

# 2. Initialise git (if not already)
git init
git branch -M main

# 3. Connect the GitHub remote (HTTPS)
git remote add origin https://github.com/soroura/timeline.git

# 4. Stage + commit + push
git add .
git commit -m "Initial: EC + DP Timeline 2026 (phase-in v7)"
git push -u origin main
```

If GitHub asks for credentials, use a **Personal Access Token** (Settings → Developer settings → Personal access tokens → Tokens classic → generate token with `repo` scope) as your password.

### After future changes

```bash
cd "/Users/soroura/Library/CloudStorage/OneDrive-WorldHealthOrganization/a-who26/work-plan/ec-dp-timeline"
git add .
git commit -m "Describe what changed"
git push
```

---

## Part 2 — Deploy on VPS (Nginx + free SSL)

### Prerequisites
- A VPS with **Ubuntu 22.04 or 24.04** (or any Debian-based distro)
- SSH access (e.g., `ssh root@your-vps-ip`)
- DNS already pointing `timeline.endura.assess.com` to your VPS IP (add an **A record** at your DNS provider — see Step 5 if you haven't)

### Step 1 — SSH into the VPS

```bash
ssh root@YOUR_VPS_IP
# (or your-user@YOUR_VPS_IP)
```

### Step 2 — Install Nginx + git + certbot

```bash
apt update
apt install -y nginx git certbot python3-certbot-nginx
systemctl enable --now nginx
```

### Step 3 — Clone the repo to web root

```bash
# Create the web folder
mkdir -p /var/www/timeline
cd /var/www
rm -rf timeline    # only if you need to re-clone fresh
git clone https://github.com/soroura/timeline.git
chown -R www-data:www-data /var/www/timeline
```

### Step 4 — Configure Nginx

Create a new site config:

```bash
nano /etc/nginx/sites-available/timeline.endura.assess.com
```

Paste this (the same config that's in `nginx.conf` in the repo, tweaked for VPS paths):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name timeline.endura.assess.com;

    root /var/www/timeline;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/css application/javascript text/html application/json image/svg+xml;
    gzip_min_length 1024;

    # Cache /assets/ for 7 days
    location /assets/ {
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }

    # Clean URLs — /layer-1 also works (not only /layer-1.html)
    location / {
        try_files $uri $uri.html $uri/ =404;
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

Save (Ctrl+O, Enter, Ctrl+X).

Enable + reload:

```bash
ln -s /etc/nginx/sites-available/timeline.endura.assess.com /etc/nginx/sites-enabled/
nginx -t                # test config syntax
systemctl reload nginx
```

At this point the site is live over **HTTP** at `http://timeline.endura.assess.com`.

### Step 5 — DNS (if not yet done)

At your DNS provider for `endura.assess.com`, add:

| Type | Host       | Value                | TTL  |
|------|------------|----------------------|------|
| A    | `timeline` | `<your VPS IP>`      | 3600 |

Wait 5-15 minutes for DNS to propagate. Check with:
```bash
dig timeline.endura.assess.com +short
# should print your VPS IP
```

### Step 6 — Add free HTTPS (Let's Encrypt)

```bash
certbot --nginx -d timeline.endura.assess.com
# Answer the prompts:
#  - Enter your email
#  - Agree to ToS
#  - Choose redirect (option 2) to force HTTPS
```

Certbot will rewrite your nginx config to serve HTTPS on port 443 and auto-redirect HTTP → HTTPS. Certificate auto-renews via a systemd timer.

Verify:
```bash
curl -I https://timeline.endura.assess.com
# should return HTTP/2 200
```

Open in your browser: **https://timeline.endura.assess.com**

---

## Part 3 — Push an update later

On your laptop:
```bash
cd "/Users/soroura/Library/CloudStorage/OneDrive-WorldHealthOrganization/a-who26/work-plan/ec-dp-timeline"
git add .
git commit -m "Update content"
git push
```

On the VPS:
```bash
cd /var/www/timeline
git pull
# no nginx reload needed — files served fresh on next request
```

Or set up auto-pull (optional):

```bash
# On the VPS, create a hook script
cat > /usr/local/bin/timeline-update.sh << 'EOF'
#!/bin/bash
cd /var/www/timeline && git pull && chown -R www-data:www-data /var/www/timeline
EOF
chmod +x /usr/local/bin/timeline-update.sh

# Run it via cron every 5 minutes
echo "*/5 * * * * /usr/local/bin/timeline-update.sh" | crontab -
```

---

## Quick reference — what runs where

| Step | Where | What |
|---|---|---|
| Edit content | Laptop | Edit HTML / push to git |
| Hosting | VPS | Nginx serves `/var/www/timeline` |
| Updates | VPS | `git pull` pulls latest from GitHub |
| SSL cert | VPS | Auto-renewed by certbot |
| DNS | DNS provider | A record `timeline` → VPS IP |

---

## Troubleshooting

**"502 Bad Gateway"** — usually Nginx config issue. Run `nginx -t` and check `journalctl -u nginx`.

**"Connection refused"** — Nginx not running. `systemctl status nginx` → `systemctl start nginx`.

**Firewall blocking?** — `ufw allow 'Nginx Full'` opens 80 + 443.

**DNS not resolving?** — give it 15 min, check `dig timeline.endura.assess.com`, verify A record.

**Certbot fails?** — DNS must be pointing to the VPS BEFORE running certbot. Re-check Step 5.

**Pushed but site shows old version?** — On the VPS, `cd /var/www/timeline && git pull`. If browser caches, hard-refresh (Cmd+Shift+R).

---

**Done. Site lives at https://timeline.endura.assess.com**
