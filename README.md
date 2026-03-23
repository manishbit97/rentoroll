# RentoRoll

Rent management SaaS — NestJS API + React Native (Expo) frontend.

- **Web / API:** https://rentoz.online
- **API base:** https://rentoz.online/api/v1
- **Swagger:** https://rentoz.online/api/docs

---

## Project Structure

```
RentoRoll/
├── backend-nest/        # NestJS API
├── frontend/            # Expo (React Native + Web)
├── nginx/               # Nginx reverse proxy + sudoers config
├── mongodb/init/        # MongoDB init scripts
├── docker-compose.yml   # Local & production orchestration
└── .github/workflows/   # CI/CD pipelines
```

---

## Local Development

**Prerequisites:** Docker, Node 20

```bash
cp .env.example .env.docker     # edit JWT_SECRET before starting

docker compose up -d            # starts MongoDB + API

cd frontend && npm install
npx expo start
```

| Service       | URL                            |
| ------------- | ------------------------------ |
| API           | http://localhost:8080/api/v1   |
| Swagger       | http://localhost:8080/api/docs |
| Mongo Express | http://localhost:8081          |

---

## CI/CD Overview

Everything after initial setup is **fully automatic** on push to `main`.

| Workflow      | Triggers when                  | What happens                                   |
| ------------- | ------------------------------ | ---------------------------------------------- |
| `backend.yml` | `backend-nest/` changes        | Build image → push GHCR → deploy API           |
| `web.yml`     | `frontend/` changes            | Build image → push GHCR → deploy website       |
| `infra.yml`   | `nginx/rentoroll.conf` changes | Upload config → issue/renew SSL → reload Nginx |
| `mobile.yml`  | version tag `v*` or manual     | EAS build → APK / AAB                          |

---

## ⚠️ Manual Steps (do these once)

These are the only things you ever do by hand. Everything else is automated.

---

### MANUAL STEP 1 — Generate deploy SSH key (once, ever)

Run this **once on your laptop**. Reuse this key for every server, forever.

```bash
ssh-keygen -t ed25519 -C "rentoroll-deploy" -f ~/.ssh/rentoroll_deploy -N ""
```

Two files are created:

```
~/.ssh/rentoroll_deploy      ← private key (goes into GitHub Secrets)
~/.ssh/rentoroll_deploy.pub  ← public key  (copied to every server)
```

---

### MANUAL STEP 2 — Set GitHub Secrets (once, update SSH_HOST on server switch)

Go to: **GitHub repo → Settings → Secrets and variables → Actions**

| Secret            | Value                         | Notes                                                       |
| ----------------- | ----------------------------- | ----------------------------------------------------------- |
| `SSH_PRIVATE_KEY` | `cat ~/.ssh/rentoroll_deploy` | Set once, never change                                      |
| `SSH_USER`        | `deploy`                      | Set once, never change                                      |
| `JWT_SECRET`      | `openssl rand -hex 32`        | **Set once, NEVER change** — changing it logs out all users |
| `CERTBOT_EMAIL`   | your email                    | For SSL expiry alerts                                       |
| `SSH_HOST`        | server IP                     | **Update this when switching servers**                      |

---

### MANUAL STEP 3 — New server setup (once per server)

#### 3a. Create server with Cloud-Init

In Hetzner Console → Create Server → **User Data**, paste:

```yaml
#cloud-config

runcmd:
  - curl -fsSL https://get.docker.com | sh
  - systemctl enable docker && systemctl start docker
  - useradd -m -s /bin/bash deploy
  - usermod -aG docker deploy
  - mkdir -p /home/deploy/.ssh
  - chmod 700 /home/deploy/.ssh
  - mkdir -p /opt/rentoroll
  - chown deploy:deploy /opt/rentoroll
  - apt-get install -y nginx certbot python3-certbot-nginx
  - systemctl enable nginx && systemctl start nginx
```

Wait ~2 min for the server to boot and run the init script.

#### 3b. Add deploy public key to server

```bash
cat ~/.ssh/rentoroll_deploy.pub  # copy this output

ssh root@<server-ip> "
  echo '<paste-public-key-here>' >> /home/deploy/.ssh/authorized_keys
  chmod 600 /home/deploy/.ssh/authorized_keys
  chown -R deploy:deploy /home/deploy/.ssh
"
```

#### 3c. Install sudoers file

```bash
scp nginx/sudoers-deploy root@<server-ip>:/etc/sudoers.d/deploy
ssh root@<server-ip> "chmod 440 /etc/sudoers.d/deploy"
```

#### 3d. Point DNS to server IP

At your domain registrar:

```
A  rentoz.online      →  <server-ip>
A  www.rentoz.online  →  <server-ip>
```

#### 3e. Trigger all workflows manually

```
GitHub → Actions → "Deploy Nginx + SSL"  → Run workflow
GitHub → Actions → "Deploy Backend"      → Run workflow
GitHub → Actions → "Deploy Website"      → Run workflow
```

`infra.yml` will automatically obtain the SSL certificate on first run.

---

## Switching Servers

1. Create new server → follow **Step 3** above
2. Update `SSH_HOST` secret to new server IP
3. Trigger the 3 workflows manually (Step 3e)

**That's it.** `JWT_SECRET` stays the same — no users get logged out.

---

## Mongo Express (DB UI)

Bound to `127.0.0.1` — not exposed publicly. Access via SSH tunnel:

```bash
ssh -L 8081:localhost:8081 deploy@<server-ip>
# open http://localhost:8081
```

---

## Mobile Builds (EAS)

````bash
cd frontend
npm install -g eas-cli && eas login

eas build --platform android --profile preview     # APK for testing
eas build --platform android --profile production  # AAB for Play Store
s```
````
