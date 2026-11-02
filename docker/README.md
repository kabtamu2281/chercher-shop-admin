# Kpax Shop — Building Materials Management System
## Production Deployment Manual for Ethio Telecom Ubuntu Linux VPS

Developed by **Kpax Technologies** for building-materials retailers and wholesalers in Ethiopia.

---

### 1. Prerequisites on Ubuntu VPS

Log in as `root` or a `sudo` user:
```bash
ssh root@<YOUR_VPS_IP>
```

Update system packages and install Docker:
```bash
apt update && apt upgrade -y
apt install -y curl git ufw docker.io docker-compose
systemctl enable --now docker
```

---

### 2. Configure Firewall & Security

Allow SSH, HTTP, and HTTPS:
```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

### 3. Deploy Kpax Shop via Docker Compose

1. Clone or extract the application files:
   ```bash
   cd /opt
   git clone <REPO_URL> kpax-shop
   cd kpax-shop
   ```

2. Copy the production environment template:
   ```bash
   cp .env.example .env
   # Edit secrets:
   nano .env
   ```

3. Launch the containerized stack:
   ```bash
   docker-compose -f docker/docker-compose.yml up -d --build
   ```

4. Verify health endpoint:
   ```bash
   curl http://localhost:3000/api/health
   # Expected: {"status":"ok","system":"Kpax Shop - Building Materials Management System",...}
   ```

---

### 4. Automated Daily Backups

Add the backup script to cron:
```bash
chmod +x /opt/kpax-shop/docker/backup.sh
crontab -e
```
Add the following line to run every midnight:
```cron
0 0 * * * /opt/kpax-shop/docker/backup.sh >> /var/log/kpax_backup.log 2>&1
```

---

### 5. Multi-Tenant Architecture & Customizations
- Default currency: **Ethiopian Birr (ETB)**
- Timezone: **Africa/Addis_Ababa** (EAT / GMT+3)
- Multi-lingual UI: English, Amharic (አማርኛ), Afaan Oromo
- Supported building material units: Bags (50kg), Quintals (100kg), Tonnes, Pieces, Square Metres, Litres, and Sino Truckloads.
