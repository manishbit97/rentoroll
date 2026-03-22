# RentoRoll

Rent management SaaS — NestJS API + React Native (Expo) frontend.

**Production:** https://rentoz.online
**API:** https://rentoz.online/api/v1
**Swagger:** https://rentoz.online/api/docs

---

## Project Structure

```
RentoRoll/
├── backend-nest/        # NestJS API
├── frontend/            # Expo (React Native + Web)
├── nginx/               # Nginx reverse proxy config
├── mongodb/init/        # MongoDB init scripts
├── docker-compose.yml   # Local & production orchestration
└── .github/workflows/   # CI/CD pipelines
```

---

## Local Development

**Prerequisites:** Docker, Node 20

```bash
# 1. Copy env file
cp .env.example .env.docker

# 2. Start MongoDB + API
docker compose up -d

# 3. Start Expo
cd frontend
npm install
npx expo start
```

API runs at `http://localhost:8080/api/v1`
Swagger at `http://localhost:8080/api/docs`
Mongo Express at `http://localhost:8081`

---

## CI/CD

Two GitHub Actions workflows trigger on push to `main`:

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `backend.yml` | changes in `backend-nest/` | Builds Docker image → pushes to GHCR → deploys to Hetzner |
| `web.yml` | changes in `frontend/` | Exports Expo web → uploads to `/var/www/rentoroll` on Hetzner |

Mobile APK builds are triggered manually or on version tags (`v*`) via `mobile.yml`.

### GitHub Secrets required

| Secret | Description |
|--------|-------------|
| `SSH_HOST` | Hetzner server IP |
| `SSH_USER` | Deploy user (e.g. `deploy`) |
| `SSH_PRIVATE_KEY` | Private key for the deploy user |
| `JWT_SECRET` | Strong random string — generate with `openssl rand -hex 32` |
| `EXPO_TOKEN` | Expo account token (for EAS mobile builds only) |

---

## Server Setup (Hetzner)

### Option A — New server (recommended)

When creating the server in Hetzner Console, paste this into the **User Data** field:

```yaml
#cloud-config

packages:
  - curl
  - wget

runcmd:
  # Install Docker
  - curl -fsSL https://get.docker.com | sh
  - systemctl enable docker
  - systemctl start docker

  # Create deploy user
  - useradd -m -s /bin/bash deploy
  - usermod -aG docker deploy
  - mkdir -p /home/deploy/.ssh
  - chmod 700 /home/deploy/.ssh

  # Create app directory
  - mkdir -p /opt/rentoroll
  - chown deploy:deploy /opt/rentoroll

  # Install Nginx + Certbot
  - apt-get install -y nginx certbot python3-certbot-nginx
  - systemctl enable nginx
  - systemctl start nginx
```

After the server boots (~2 min), add the deploy SSH key:

```bash
ssh root@<hetzner-ip> \
  "echo '<deploy_public_key>' >> /home/deploy/.ssh/authorized_keys && \
   chmod 600 /home/deploy/.ssh/authorized_keys && \
   chown -R deploy:deploy /home/deploy/.ssh"
```

### Option B — Existing server

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker && systemctl start docker
apt-get install -y nginx certbot python3-certbot-nginx
mkdir -p /opt/rentoroll
```

---

## Nginx + SSL (one-time)

```bash
# Copy nginx config to server
scp nginx/rentoroll.conf deploy@<hetzner-ip>:/etc/nginx/sites-enabled/rentoroll

# Remove default site
ssh deploy@<hetzner-ip> "rm -f /etc/nginx/sites-enabled/default"

# Get SSL certificate
ssh deploy@<hetzner-ip> "certbot --nginx -d rentoz.online -d www.rentoz.online"

# Reload Nginx
ssh deploy@<hetzner-ip> "systemctl reload nginx"
```

DNS must point to the server IP before running Certbot:

```
A  rentoz.online      →  <hetzner-ip>
A  www.rentoz.online  →  <hetzner-ip>
```

---

## Deploy SSH Key Setup

Generate a dedicated key pair on your local machine (never reuse your personal key):

```bash
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/rentoroll_deploy
```

Copy the public key to the server:
```bash
ssh-copy-id -i ~/.ssh/rentoroll_deploy.pub deploy@<hetzner-ip>
```

Paste the private key into GitHub → Settings → Secrets → `SSH_PRIVATE_KEY`:
```bash
cat ~/.ssh/rentoroll_deploy
```

---

## Access Mongo Express (DB UI)

Mongo Express is bound to `127.0.0.1:8081` — not exposed publicly. Access via SSH tunnel:

```bash
ssh -L 8081:localhost:8081 deploy@<hetzner-ip>
# then open http://localhost:8081 in your browser
```

---

## Mobile Builds (EAS)

```bash
cd frontend

# Install EAS CLI
npm install -g eas-cli
eas login

# Preview APK (internal testing)
eas build --platform android --profile preview

# Production AAB (Play Store)
eas build --platform android --profile production
```
